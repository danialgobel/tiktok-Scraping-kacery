/**
 * Gemini Multimodal Video & Content Analyzer
 */

const GEMINI_MODEL = 'gemini-3.5-flash';

export async function analyzeContentWithGemini({ caption, brandKeywords = [], videoUrl = '' }) {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    return {
      available: false,
      reason: 'GEMINI_API_KEY belum dikonfigurasi di server.'
    };
  }

  const prompt = `
Kamu adalah asisten validator video affiliate TikTok untuk Kacery.
Tugasmu: Periksa apakah brand ${JSON.stringify(brandKeywords)} disebutkan atau dipromosikan dalam konten ini.

Data Video:
- Caption: "${caption}"
- Video URL: ${videoUrl || 'Tidak tersedia'}

Analisis dengan teliti:
1. Apakah nama brand atau produk turunan dari brand tersebut disebut di caption atau tersirat jelas dalam konten?
2. Apakah video ini merupakan konten promosi / review / affiliate untuk brand tersebut?

Kembalikan jawaban HANYA dalam format JSON valid berikut (tanpa markdown backtick):
{
  "analyzed": true,
  "brandsFound": [
    {
      "brand": "Nama Brand",
      "found": true,
      "location": "caption atau audio/visual",
      "evidence": "Penjelasan singkat ramah untuk Kacery"
    }
  ],
  "isAffiliateContent": true,
  "confidenceScore": 95,
  "summary": "Ringkasan analisis 1-2 kalimat"
}
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    const data = await res.json();
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
      return {
        available: true,
        ...parsed
      };
    }
  } catch (err) {
    console.warn('Gemini analysis error:', err.message);
  }

  return {
    available: false,
    reason: 'Gagal memproses analisis AI'
  };
}
