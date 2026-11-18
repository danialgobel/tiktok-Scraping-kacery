import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { extractTikTokVideo } from './lib/tiktok-extractor.js';
import { validateVideo, DEFAULT_CAMPAIGN_CONFIG } from './lib/validator.js';
import { analyzeContentWithGemini } from './lib/gemini-analyzer.js';
import { logActivityToDiscord } from './lib/discord-logger.js';
import { getFfmpegPath, checkFfmpegAvailable } from './lib/ffmpeg-resolver.js';

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

// Helper: Enrich validation report with Gemini AI Analysis (hanya jika ada syarat brand)
async function enrichWithGemini(report, config) {
  if (!process.env.GEMINI_API_KEY || !report || !report.success) return report;
  // Jika tidak ada kata kunci brand yang dicari, lewati Gemini untuk menghemat waktu respon 2-3 detik per video
  if (!config.brandKeywords || config.brandKeywords.length === 0) return report;
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

// API: Image Proxy to bypass TikTok Shop CDN hotlink protection
app.get('/api/proxy-image', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl || typeof imageUrl !== 'string') {
    return res.status(400).send('URL gambar diperlukan');
  }

  try {
    const parsed = new URL(imageUrl);
    const allowedHost = parsed.hostname.endsWith('tiktokcdn.com') ||
      parsed.hostname.endsWith('ibyteimg.com') ||
      parsed.hostname.endsWith('tiktok.com') ||
      parsed.hostname.endsWith('tokopedia.net') ||
      parsed.hostname.endsWith('tokopedia.com') ||
      parsed.hostname.includes('tiktokcdn');

    if (!allowedHost) {
      return res.status(403).send('Domain gambar tidak diizinkan');
    }

    const imgRes = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://www.tiktok.com/',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!imgRes.ok) {
      return res.status(imgRes.status).send('Gagal mengambil gambar dari sumber');
    }

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');

    const arrayBuffer = await imgRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    res.status(500).send(`Gagal memuat gambar: ${err.message}`);
  }
});

// In-memory cache for extracted audio streams (max 50, 15 min TTL)
const AUDIO_STREAM_CACHE = new Map();
let ffmpegAvailableCache = null;
let lastFfmpegCheck = 0;

async function isFfmpegReady() {
  const now = Date.now();
  if (ffmpegAvailableCache !== null && (now - lastFfmpegCheck < 60000)) {
    return ffmpegAvailableCache;
  }
  ffmpegAvailableCache = await checkFfmpegAvailable();
  lastFfmpegCheck = now;
  return ffmpegAvailableCache;
}

// API: Pure Audio Stream Extractor (converts video stream to pure MP3 audio via ffmpeg on-the-fly)
app.get('/api/stream-audio', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).send('URL video diperlukan');
  }

  // 1. Check in-memory audio cache
  const cached = AUDIO_STREAM_CACHE.get(targetUrl);
  if (cached && (Date.now() - cached.timestamp < 15 * 60 * 1000)) {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=900');
    return res.send(cached.buffer);
  }

  // 2. Jika FFmpeg tidak tersedia di sistem, langsung alihkan ke proxy-video (instant stream)
  const hasFfmpeg = await isFfmpegReady();
  if (!hasFfmpeg) {
    return res.redirect(`/api/proxy-video?url=${encodeURIComponent(targetUrl)}`);
  }

  try {
    // 3. Spawn ffmpeg to extract authentic MP3 audio stream from video on the fly
    const ffmpegCmd = getFfmpegPath();
    const ff = spawn(ffmpegCmd, [
      '-headers', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\nReferer: https://www.tiktok.com/\r\n',
      '-i', targetUrl,
      '-vn',
      '-acodec', 'libmp3lame',
      '-ab', '128k',
      '-ar', '44100',
      '-f', 'mp3',
      'pipe:1'
    ]);

    const chunks = [];
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=900');

    ff.stdout.on('data', chunk => {
      chunks.push(chunk);
      res.write(chunk);
    });

    ff.stdout.on('end', () => {
      res.end();
      if (chunks.length > 0) {
        const fullBuffer = Buffer.concat(chunks);
        AUDIO_STREAM_CACHE.set(targetUrl, { timestamp: Date.now(), buffer: fullBuffer });
        if (AUDIO_STREAM_CACHE.size > 50) {
          const oldest = AUDIO_STREAM_CACHE.keys().next().value;
          AUDIO_STREAM_CACHE.delete(oldest);
        }
      }
    });

    ff.stderr.on('data', () => {});

    ff.on('error', (err) => {
      console.warn('ffmpeg extraction fallback to proxy-video:', err.message);
      if (!res.headersSent) {
        res.redirect(`/api/proxy-video?url=${encodeURIComponent(targetUrl)}`);
      }
    });

    req.on('close', () => {
      ff.kill();
    });
  } catch (err) {
    console.warn('Audio stream error fallback to proxy-video:', err.message);
    if (!res.headersSent) {
      res.redirect(`/api/proxy-video?url=${encodeURIComponent(targetUrl)}`);
    }
  }
});

// API: Video Stream Proxy (bypasses TikTok CDN CORS & hotlink protection with Range support)
app.get('/api/proxy-video', async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl || typeof videoUrl !== 'string') {
    return res.status(400).send('URL video diperlukan');
  }

  try {
    const rangeHeader = req.headers.range;
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://www.tiktok.com/',
      'Accept': '*/*',
    };

    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const videoRes = await fetch(videoUrl, { headers: fetchHeaders });

    if (!videoRes.ok && videoRes.status !== 206) {
      return res.status(videoRes.status).send('Gagal mengambil video dari sumber');
    }

    res.status(videoRes.status);
    const contentType = videoRes.headers.get('content-type') || 'video/mp4';
    const contentLength = videoRes.headers.get('content-length');
    const contentRange = videoRes.headers.get('content-range');
    const acceptRanges = videoRes.headers.get('accept-ranges') || 'bytes';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', acceptRanges);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentRange) res.setHeader('Content-Range', contentRange);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const reader = videoRes.body.getReader();
    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      } catch (e) {
        reader.cancel().catch(() => {});
        res.end();
      }
    };
    pump();

    req.on('close', () => {
      reader.cancel().catch(() => {});
    });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).send(`Gagal memuat video: ${err.message}`);
    }
  }
});

// API: Single video extraction
app.post('/api/extract', async (req, res) => {
  const { url, sessionCookie } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL video tidak boleh kosong' });
  }
  const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || '';
  const cookie = sessionCookie || req.headers['x-tiktok-session'] || '';
  try {
    const data = await extractTikTokVideo(url, clientIp, cookie);
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Single video validation
app.post('/api/validate', async (req, res) => {
  const { url, campaignConfig, manualVideoReview, sessionCookie } = req.body;
  console.log(`\n======================================================`);
  console.log(`[REQ /api/validate] URL: ${url}`);
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL video tidak boleh kosong' });
  }

  const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || '';
  const cookie = sessionCookie || req.headers['x-tiktok-session'] || '';
  const config = campaignConfig || DEFAULT_CAMPAIGN_CONFIG;

  try {
    const rawData = await extractTikTokVideo(url, clientIp, cookie);
    console.log(`[EXTRACTED] Source: ${rawData.source || 'direct'}, VideoUrl: ${rawData.media?.videoUrl ? 'YES' : 'NO'}, AudioUrl: ${rawData.media?.audioUrl ? 'YES' : 'NO'}`);
    console.log(`[EXTRACTED AUDIO] URL: ${rawData.media?.audioUrl}`);
    let report = validateVideo(rawData, config, manualVideoReview);
    report = await enrichWithGemini(report, config);
    res.json(report);
  } catch (err) {
    console.error(`[VALIDATE ERROR]:`, err.message);
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

// API: System & Environment Status (Desktop & Web Telemetry)
app.get('/api/system-status', async (req, res) => {
  const hasFfmpeg = await checkFfmpegAvailable();
  res.json({
    success: true,
    isDesktop: Boolean(process.versions?.electron),
    ffmpegAvailable: hasFfmpeg,
    ffmpegPath: getFfmpegPath(),
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime()
  });
});

// Fallback to index.html for SPA/PWA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * Start Desktop Server with Dynamic Port Collision Handling
 * Automatically picks a free port if 3000 is occupied.
 */
export function startDesktopServer(preferredPort = 3000) {
  return new Promise((resolve, reject) => {
    const server = app.listen(preferredPort, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`🚀 Desktop server running on http://127.0.0.1:${port}`);
      resolve({ server, port });
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${preferredPort} sedang dipakai, mencari port bebas otomatis...`);
        const fallbackServer = app.listen(0, '127.0.0.1', () => {
          const port = fallbackServer.address().port;
          console.log(`🚀 Desktop server running on fallback port http://127.0.0.1:${port}`);
          resolve({ server: fallbackServer, port });
        });
        fallbackServer.on('error', reject);
      } else {
        reject(err);
      }
    });
  });
}

// Only listen standalone if not running inside Vercel or Electron master process
if (!process.env.VERCEL && !process.env.ELECTRON_RUN_AS_NODE && !process.versions?.electron) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 TikTok Affiliate Validator server is running!`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });
}

export default app;

