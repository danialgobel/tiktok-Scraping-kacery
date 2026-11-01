/**
 * TikTok Affiliate Content Validator Engine
 * Disesuaikan khusus untuk Kacery agar laporan mudah dipahami, ramah, dan jelas
 */

export const DEFAULT_CAMPAIGN_CONFIG = {
  name: 'Campaign Vape Fumakilla',
  minFollowers: 600,
  minViews: 300,
  minLikes: 50,
  requiredMentions: ['@vape.antinyamuk.idn'],
  requiredHashtags: [
    '#VapeCuanAntiNyamuk',
    '#VapeMAT',
    '#TanpaAsapTanpaAbu'
  ],
  brandKeywords: ['Vape', 'Fumakilla'],
  brandCheckLocation: 'caption_or_video', // 'caption_or_video' | 'caption_only' | 'video_only'
  expectedUsernames: [], // opsional: daftar username affiliate yang diharapkan
};

export const STATUS_LABELS = {
  PASS: 'Sudah Sesuai',
  FAIL: 'Belum Sesuai',
  'NEED REVIEW': 'Perlu Cek Manual',
};

/**
 * Helper to escape regex special characters
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Format numbers with thousand separators (e.g. 1.010)
 */
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return 'Tidak tersedia';
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Extract all hashtags from caption text
 */
export function extractHashtags(text) {
  if (!text) return [];
  const matches = text.match(/#[\p{L}\p{N}_]+/gu) || [];
  return [...new Set(matches)];
}

/**
 * Extract all mentions from caption text
 */
export function extractMentions(text) {
  if (!text) return [];
  const matches = text.match(/@[\p{L}\p{N}._]+/gu) || [];
  return [...new Set(matches)];
}

/**
 * Check if a hashtag exists in text with exact boundary (case-insensitive)
 * e.g., #Vape must NOT match #VapeMAT
 */
export function checkHashtag(caption, targetHashtag) {
  if (!caption || !targetHashtag) return false;
  const cleanTarget = targetHashtag.startsWith('#') ? targetHashtag.slice(1) : targetHashtag;
  const regex = new RegExp(`(?:^|[^\\p{L}\\p{N}_])#${escapeRegex(cleanTarget)}(?=[^\\p{L}\\p{N}_]|$)`, 'iu');
  return regex.test(caption);
}

/**
 * Check if a mention exists in text with exact boundary (case-insensitive)
 */
export function checkMention(caption, targetMention) {
  if (!caption || !targetMention) return false;
  const cleanTarget = targetMention.startsWith('@') ? targetMention.slice(1) : targetMention;
  const regex = new RegExp(`(?:^|[^\\p{L}\\p{N}._])@${escapeRegex(cleanTarget)}(?=[^\\p{L}\\p{N}._]|$)`, 'iu');
  return regex.test(caption);
}

/**
 * Check if a brand keyword exists in text with word boundary (case-insensitive)
 */
export function checkKeyword(text, keyword) {
  if (!text || !keyword) return false;
  const regex = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeRegex(keyword.trim())}(?=[^\\p{L}\\p{N}]|$)`, 'iu');
  return regex.test(text);
}

/**
 * Calculate Engagement Rate (ER)
 */
export function calculateER(stats) {
  const views = stats?.views;
  const likes = stats?.likes || 0;
  const comments = stats?.comments || 0;
  const shares = stats?.shares || 0;
  const saves = stats?.saves;

  if (views === null || views === undefined || isNaN(views)) {
    return {
      rate: null,
      formatted: 'N/A',
      explanation: 'Views belum tersedia, ER belum bisa dihitung.',
      hasSaves: false,
    };
  }

  if (views <= 0) {
    return {
      rate: 0,
      formatted: '0.00%',
      explanation: 'Views video masih 0.',
      hasSaves: false,
    };
  }

  const savesCount = typeof saves === 'number' ? saves : 0;
  const hasSaves = typeof saves === 'number';
  const totalInteractions = likes + comments + shares + savesCount;
  const erPercent = (totalInteractions / views) * 100;

  const formulaText = hasSaves
    ? `(${formatNumber(likes)} Likes + ${formatNumber(comments)} Komentar + ${formatNumber(shares)} Share + ${formatNumber(savesCount)} Saves) / ${formatNumber(views)} Views × 100%`
    : `(${formatNumber(likes)} Likes + ${formatNumber(comments)} Komentar + ${formatNumber(shares)} Share) / ${formatNumber(views)} Views × 100% (tanpa Saves)`;

  return {
    rate: Number(erPercent.toFixed(2)),
    formatted: `${erPercent.toFixed(2)}%`,
    explanation: formulaText,
    hasSaves,
  };
}

/**
 * Validate a single TikTok video against Campaign Configuration
 */
export function validateVideo(videoData, campaignConfig = DEFAULT_CAMPAIGN_CONFIG, manualVideoReview = null) {
  if (!videoData || !videoData.success) {
    return {
      success: false,
      videoUrl: videoData?.url || '',
      error: videoData?.error || 'Gagal mengambil data video TikTok',
      overallStatus: 'FAIL',
      overallStatusLabel: STATUS_LABELS['FAIL'],
      results: [],
      summary: { total: 1, pass: 0, fail: 1, needReview: 0 },
    };
  }

  const checks = [];
  const author = videoData.author || {};
  const stats = videoData.stats || {};
  const caption = videoData.caption || '';

  // 1. Username Validation
  const username = author.username || '';
  const expectedList = (campaignConfig.expectedUsernames || [])
    .map(u => u.trim().replace(/^@/, '').toLowerCase())
    .filter(Boolean);

  if (expectedList.length > 0) {
    const isMatched = expectedList.includes(username.toLowerCase());
    checks.push({
      category: 'Username',
      name: 'Nama Akun Affiliate',
      status: isMatched ? 'PASS' : 'FAIL',
      statusLabel: isMatched ? STATUS_LABELS['PASS'] : STATUS_LABELS['FAIL'],
      evidence: isMatched
        ? `Akun @${username} terdaftar di daftar affiliate Kacery.`
        : `Akun @${username} tidak ditemukan di daftar affiliate yang diharapkan.`,
      actualValue: `@${username}`,
      expectedValue: expectedList.map(u => `@${u}`).join(', '),
    });
  } else {
    checks.push({
      category: 'Username',
      name: 'Nama Akun Affiliate',
      status: username ? 'PASS' : 'NEED REVIEW',
      statusLabel: username ? STATUS_LABELS['PASS'] : STATUS_LABELS['NEED REVIEW'],
      evidence: username
        ? `Akun pengunggah: @${username} (semua akun affiliate diterima).`
        : `Nama akun pengunggah tidak berhasil dibaca.`,
      actualValue: username ? `@${username}` : 'Tidak diketahui',
      expectedValue: 'Semua akun diterima',
    });
  }

  // 2. Metrics Validation: Followers (> minFollowers)
  const minFollowers = campaignConfig.minFollowers ?? 600;
  if (author.followerCount !== null && author.followerCount !== undefined) {
    const isPass = author.followerCount > minFollowers;
    checks.push({
      category: 'Metrik',
      name: 'Jumlah Pengikut (Followers)',
      status: isPass ? 'PASS' : 'FAIL',
      statusLabel: isPass ? STATUS_LABELS['PASS'] : STATUS_LABELS['FAIL'],
      evidence: isPass
        ? `Keren! Ada ${formatNumber(author.followerCount)} followers (sudah di atas syarat > ${formatNumber(minFollowers)}).`
        : `Followers akun baru ${formatNumber(author.followerCount)} (kurang dari syarat > ${formatNumber(minFollowers)}).`,
      actualValue: formatNumber(author.followerCount),
      expectedValue: `> ${formatNumber(minFollowers)}`,
    });
  } else {
    checks.push({
      category: 'Metrik',
      name: 'Jumlah Pengikut (Followers)',
      status: 'NEED REVIEW',
      statusLabel: STATUS_LABELS['NEED REVIEW'],
      evidence: `Jumlah followers belum terbaca otomatis, Kacery bisa cek profil @${username || 'user'} ya.`,
      actualValue: 'Belum terbaca',
      expectedValue: `> ${formatNumber(minFollowers)}`,
    });
  }

  // 3. Metrics Validation: Views (>= minViews)
  const minViews = campaignConfig.minViews ?? 300;
  if (stats.views !== null && stats.views !== undefined) {
    const isPass = stats.views >= minViews;
    checks.push({
      category: 'Metrik',
      name: 'Jumlah Penayangan (Views)',
      status: isPass ? 'PASS' : 'FAIL',
      statusLabel: isPass ? STATUS_LABELS['PASS'] : STATUS_LABELS['FAIL'],
      evidence: isPass
        ? `Mantap! Video sudah ditonton ${formatNumber(stats.views)} kali (memenuhi syarat minimal >= ${formatNumber(minViews)}).`
        : `Views baru ${formatNumber(stats.views)} kali (masih di bawah target minimal >= ${formatNumber(minViews)}).`,
      actualValue: formatNumber(stats.views),
      expectedValue: `>= ${formatNumber(minViews)}`,
    });
  } else {
    checks.push({
      category: 'Metrik',
      name: 'Jumlah Penayangan (Views)',
      status: 'NEED REVIEW',
      statusLabel: STATUS_LABELS['NEED REVIEW'],
      evidence: 'Jumlah penayangan belum berhasil dibaca.',
      actualValue: 'Belum terbaca',
      expectedValue: `>= ${formatNumber(minViews)}`,
    });
  }

  // 4. Metrics Validation: Likes (>= minLikes)
  const minLikes = campaignConfig.minLikes ?? 50;
  if (stats.likes !== null && stats.likes !== undefined) {
    const isPass = stats.likes >= minLikes;
    checks.push({
      category: 'Metrik',
      name: 'Jumlah Suka (Likes)',
      status: isPass ? 'PASS' : 'FAIL',
      statusLabel: isPass ? STATUS_LABELS['PASS'] : STATUS_LABELS['FAIL'],
      evidence: isPass
        ? `Bagus! Dapat ${formatNumber(stats.likes)} likes (memenuhi target minimal >= ${formatNumber(minLikes)}).`
        : `Likes baru dapat ${formatNumber(stats.likes)} (kurang dari target minimal >= ${formatNumber(minLikes)}).`,
      actualValue: formatNumber(stats.likes),
      expectedValue: `>= ${formatNumber(minLikes)}`,
    });
  } else {
    checks.push({
      category: 'Metrik',
      name: 'Jumlah Suka (Likes)',
      status: 'NEED REVIEW',
      statusLabel: STATUS_LABELS['NEED REVIEW'],
      evidence: 'Jumlah likes belum berhasil dibaca.',
      actualValue: 'Belum terbaca',
      expectedValue: `>= ${formatNumber(minLikes)}`,
    });
  }

  // 5. Required Mentions Validation (Case-insensitive)
  const requiredMentions = campaignConfig.requiredMentions || [];
  for (const mention of requiredMentions) {
    const cleanMention = mention.trim();
    if (!cleanMention) continue;
    const isPresent = checkMention(caption, cleanMention);
    checks.push({
      category: 'Caption',
      name: `Mention ${cleanMention}`,
      status: isPresent ? 'PASS' : 'FAIL',
      statusLabel: isPresent ? STATUS_LABELS['PASS'] : STATUS_LABELS['FAIL'],
      evidence: isPresent
        ? `Sip! Akun ${cleanMention} sudah dimention di caption.`
        : `Belum ada mention ${cleanMention} di dalam caption.`,
      actualValue: isPresent ? 'Ada di caption' : 'Tidak ada',
      expectedValue: cleanMention,
    });
  }

  // 6. Required Hashtags Validation (Case-insensitive)
  const requiredHashtags = campaignConfig.requiredHashtags || [];
  for (const hashtag of requiredHashtags) {
    const cleanTag = hashtag.trim();
    if (!cleanTag) continue;
    const isPresent = checkHashtag(caption, cleanTag);
    checks.push({
      category: 'Caption',
      name: `Hashtag ${cleanTag}`,
      status: isPresent ? 'PASS' : 'FAIL',
      statusLabel: isPresent ? STATUS_LABELS['PASS'] : STATUS_LABELS['FAIL'],
      evidence: isPresent
        ? `Tagar ${cleanTag} sudah ditulis di caption.`
        : `Tagar ${cleanTag} belum ditulis di caption.`,
      actualValue: isPresent ? 'Ada di caption' : 'Tidak ada',
      expectedValue: cleanTag,
    });
  }

  // 7. Brand Requirements Validation (Caption & Video)
  const brandKeywords = campaignConfig.brandKeywords || [];
  const checkLoc = campaignConfig.brandCheckLocation || 'caption_or_video';

  for (const brand of brandKeywords) {
    const cleanBrand = brand.trim();
    if (!cleanBrand) continue;

    const inCaption = checkKeyword(caption, cleanBrand);

    const videoReview = manualVideoReview?.[cleanBrand.toLowerCase()];
    const inVideoVisual = videoReview?.visualFound === true;
    const inVideoAudio = videoReview?.audioFound === true;
    const inVideo = inVideoVisual || inVideoAudio;

    let status = 'NEED REVIEW';
    let evidence = '';

    if (checkLoc === 'caption_only') {
      status = inCaption ? 'PASS' : 'FAIL';
      evidence = inCaption
        ? `Kata brand "${cleanBrand}" ditemukan di dalam caption.`
        : `Kata brand "${cleanBrand}" tidak ditemukan di dalam caption.`;
    } else if (checkLoc === 'video_only') {
      if (inVideo) {
        status = 'PASS';
        evidence = `Brand "${cleanBrand}" terbukti ada di video (${inVideoVisual ? 'tulisan layar' : ''}${inVideoVisual && inVideoAudio ? ' & ' : ''}${inVideoAudio ? 'suara' : ''}).`;
      } else if (videoReview && !inVideo) {
        status = 'FAIL';
        evidence = `Brand "${cleanBrand}" tidak ditemukan di dalam video.`;
      } else {
        status = 'NEED REVIEW';
        evidence = `Brand "${cleanBrand}" perlu Kacery tonton videonya sebentar untuk memastikan.`;
      }
    } else {
      // Default: 'caption_or_video'
      if (inCaption) {
        status = 'PASS';
        evidence = `Kata brand "${cleanBrand}" sudah ada di caption.`;
      } else if (inVideo) {
        status = 'PASS';
        evidence = `Brand "${cleanBrand}" terbukti ada di video (${inVideoVisual ? 'tulisan layar' : ''}${inVideoVisual && inVideoAudio ? ' & ' : ''}${inVideoAudio ? 'suara' : ''}).`;
      } else if (videoReview && !inVideo && !inCaption) {
        status = 'FAIL';
        evidence = `Brand "${cleanBrand}" tidak ditemukan di caption maupun video.`;
      } else {
        status = 'NEED REVIEW';
        evidence = `Brand "${cleanBrand}" tidak tertulis di caption, Kacery bisa cek videonya ya!`;
      }
    }

    checks.push({
      category: 'Brand',
      name: `Penyebutan Brand: ${cleanBrand}`,
      status,
      statusLabel: STATUS_LABELS[status],
      evidence,
      actualValue: inCaption ? 'Ada di caption' : (inVideo ? 'Ada di video' : 'Perlu dicek'),
      expectedValue: checkLoc === 'caption_or_video' ? 'Caption atau Video' : (checkLoc === 'caption_only' ? 'Wajib di Caption' : 'Wajib di Video'),
    });
  }

  // 8. Engagement Rate (ER)
  const erResult = calculateER(stats);

  // Overall status
  const total = checks.length;
  const passCount = checks.filter(c => c.status === 'PASS').length;
  const failCount = checks.filter(c => c.status === 'FAIL').length;
  const needReviewCount = checks.filter(c => c.status === 'NEED REVIEW').length;

  let overallStatus = 'PASS';
  if (failCount > 0) {
    overallStatus = 'FAIL';
  } else if (needReviewCount > 0) {
    overallStatus = 'NEED REVIEW';
  }

  return {
    success: true,
    videoUrl: videoData.videoUrl,
    videoId: videoData.videoId,
    author: videoData.author,
    stats: videoData.stats,
    caption: videoData.caption,
    media: videoData.media,
    createTime: videoData.createTime,
    detectedHashtags: extractHashtags(caption),
    detectedMentions: extractMentions(caption),
    engagementRate: erResult,
    overallStatus,
    overallStatusLabel: STATUS_LABELS[overallStatus],
    summary: {
      total,
      pass: passCount,
      fail: failCount,
      needReview: needReviewCount,
    },
    results: checks,
  };
}
