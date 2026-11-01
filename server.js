import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { extractTikTokVideo } from './lib/tiktok-extractor.js';
import { validateVideo, DEFAULT_CAMPAIGN_CONFIG } from './lib/validator.js';
import { analyzeContentWithGemini } from './lib/gemini-analyzer.js';
import { logActivityToDiscord } from './lib/discord-logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env if present
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split(/\r?\n/)) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        if (!process.env[key]) process.env[key] = val.trim();
      }
    }
  }
} catch (e) {
  console.warn('Could not read .env file:', e.message);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Enrich validation report with Gemini AI Analysis
async function enrichWithGemini(report, config) {
  if (!process.env.GEMINI_API_KEY || !report || !report.success) return report;
  try {
    const ai = await analyzeContentWithGemini({
      caption: report.caption || '',
      brandKeywords: config.brandKeywords || [],
      videoUrl: report.media?.videoUrl || ''
    });
    if (ai && ai.available) {
      report.aiAnalysis = ai;
      const brandCheck = (report.results || []).find(r => r.id === 'brand_keywords');
      if (brandCheck && brandCheck.status !== 'PASS' && ai.brandsFound?.some(b => b.found)) {
        brandCheck.aiVerified = true;
        brandCheck.status = 'PASS';
        brandCheck.statusLabel = 'Sudah Sesuai';
        brandCheck.evidence = `Terverifikasi AI Jorje: ${ai.summary || 'Brand terdeteksi dalam konten'}`;
        
        // Re-evaluate overall status
        const hasFail = report.results.some(r => r.status === 'FAIL');
        const hasReview = report.results.some(r => r.status === 'NEED REVIEW');
        if (!hasFail && !hasReview) {
          report.overallStatus = 'PASS';
          report.overallStatusLabel = 'Sudah Sesuai';
        }
      }
    }
  } catch (err) {
    console.warn('Gemini enrichment error:', err.message);
  }
  return report;
}

// API: Get default campaign config
app.get('/api/default-campaign', (req, res) => {
  res.json({ success: true, config: DEFAULT_CAMPAIGN_CONFIG });
});

// API: Realtime Activity Logger to Discord Webhook
app.post('/api/activity-log', (req, res) => {
  try {
    const eventData = req.body || {};
    if (!eventData.clientInfo) eventData.clientInfo = {};
    if (!eventData.clientInfo.ip) {
      eventData.clientInfo.ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '-';
    }
    // Fire-and-forget: log to Discord without delaying response
    logActivityToDiscord(eventData).catch(err => {
      console.warn('[Activity Log API] Error:', err.message);
    });
    res.json({ success: true });
  } catch (err) {
    res.status(200).json({ success: true, warning: err.message });
  }
});

// API: Single video extraction
app.post('/api/extract', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL video tidak boleh kosong' });
  }
  try {
    const data = await extractTikTokVideo(url);
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Single video validation
app.post('/api/validate', async (req, res) => {
  const { url, campaignConfig, manualVideoReview } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL video tidak boleh kosong' });
  }

  const config = campaignConfig || DEFAULT_CAMPAIGN_CONFIG;

  try {
    const rawData = await extractTikTokVideo(url);
    let report = validateVideo(rawData, config, manualVideoReview);
    report = await enrichWithGemini(report, config);
    res.json(report);
  } catch (err) {
    res.status(500).json({
      success: false,
      videoUrl: url,
      error: err.message,
      overallStatus: 'FAIL',
      results: [],
      summary: { total: 1, pass: 0, fail: 1, needReview: 0 }
    });
  }
});

// API: Batch video validation with concurrency control
app.post('/api/batch-validate', async (req, res) => {
  const { urls, campaignConfig } = req.body;
  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ success: false, error: 'Daftar URL harus berupa array dan tidak boleh kosong' });
  }

  const config = campaignConfig || DEFAULT_CAMPAIGN_CONFIG;

  // Filter out empty and deduplicate links
  const uniqueUrls = [...new Set(urls.map(u => (typeof u === 'string' ? u.trim() : '')).filter(Boolean))];

  console.log(`[Batch] Memulai validasi ${uniqueUrls.length} video TikTok...`);

  // Process with concurrency limit (2 at a time to prevent rate limiting)
  const CONCURRENCY = 2;
  const results = [];

  for (let i = 0; i < uniqueUrls.length; i += CONCURRENCY) {
    const chunk = uniqueUrls.slice(i, i + CONCURRENCY);
    const chunkPromises = chunk.map(async (url) => {
      try {
        const rawData = await extractTikTokVideo(url);
        let report = validateVideo(rawData, config);
        report = await enrichWithGemini(report, config);
        return report;
      } catch (err) {
        return {
          success: false,
          videoUrl: url,
          error: err.message,
          overallStatus: 'FAIL',
          results: [],
          summary: { total: 1, pass: 0, fail: 1, needReview: 0 }
        };
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }

  res.json({
    success: true,
    totalProcessed: results.length,
    results
  });
});

// Fallback to index.html for SPA/PWA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Only listen when running standalone/locally (not inside Vercel serverless functions)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 TikTok Affiliate Validator server is running!`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });
}

export default app;

