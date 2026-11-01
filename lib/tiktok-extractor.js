import crypto from 'crypto';

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
  'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

/**
 * Solve TikTok SlardarWAF Proof-of-Work challenge
 */
function solveWafPoW(csBase64) {
  try {
    const payload = JSON.parse(Buffer.from(csBase64, 'base64').toString('utf8'));
    const seedBuf = Buffer.from(payload.v.a, 'base64');
    const targetBuf = Buffer.from(payload.v.c, 'base64');

    for (let i = 0; i < 500000; i++) {
      const hash = crypto.createHash('sha256')
        .update(Buffer.concat([seedBuf, Buffer.from(String(i))]))
        .digest();
      if (hash.equals(targetBuf)) {
        payload.d = Buffer.from(String(i)).toString('base64');
        return Buffer.from(JSON.stringify(payload)).toString('base64');
      }
    }
  } catch (err) {
    console.error('Error solving PoW:', err.message);
  }
  return null;
}

/**
 * Resolve shortlink or canonical URL to final TikTok URL
 */
export async function resolveTikTokUrl(inputUrl) {
  const cleanUrl = inputUrl.trim();
  try {
    const response = await fetch(cleanUrl, {
      method: 'GET',
      headers: BROWSER_HEADERS,
      redirect: 'follow',
    });
    return response.url || cleanUrl;
  } catch (err) {
    return cleanUrl;
  }
}

/**
 * Fetch video details directly from TikTok using SlardarWAF solver
 */
async function extractDirectFromTikTok(targetUrl) {
  const res1 = await fetch(targetUrl, {
    headers: BROWSER_HEADERS,
    redirect: 'follow',
  });

  const finalUrl = res1.url || targetUrl;
  let html = await res1.text();

  // If SlardarWAF challenge encountered, solve it and retry
  if (!html.includes('__UNIVERSAL_DATA_FOR_REHYDRATION__')) {
    const wciMatch = html.match(/<p id="wci" class="([^"]*)"><\/p>/);
    const csMatch = html.match(/<p id="cs" class="([^"]*)"><\/p>/);

    if (wciMatch && csMatch) {
      const cookieName = wciMatch[1];
      const solvedCookieValue = solveWafPoW(csMatch[1]);

      if (solvedCookieValue) {
        const res2 = await fetch(finalUrl, {
          headers: {
            ...BROWSER_HEADERS,
            'Cookie': `${cookieName}=${solvedCookieValue};`,
            'Referer': finalUrl,
          },
        });
        html = await res2.text();
      }
    }
  }

  const rehydrationMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
  if (!rehydrationMatch) {
    return null;
  }

  try {
    const data = JSON.parse(rehydrationMatch[1]);
    const scope = data['__DEFAULT_SCOPE__'] || {};
    const videoDetail = scope['webapp.video-detail'];

    if (!videoDetail || !videoDetail.itemInfo?.itemStruct) {
      return null;
    }

    const item = videoDetail.itemInfo.itemStruct;
    const author = item.author || {};
    const authorStats = item.authorStats || {};
    const stats = item.stats || {};

    return {
      success: true,
      source: 'tiktok_direct',
      videoUrl: finalUrl,
      videoId: item.id || '',
      createTime: item.createTime || null,
      caption: item.desc || '',
      author: {
        id: author.id || '',
        username: author.uniqueId || '',
        nickname: author.nickname || '',
        avatar: author.avatarLarger || author.avatarMedium || author.avatarThumb || '',
        followerCount: typeof authorStats.followerCount === 'number' ? authorStats.followerCount : null,
        followingCount: typeof authorStats.followingCount === 'number' ? authorStats.followingCount : null,
        heartCount: typeof authorStats.heartCount === 'number' ? authorStats.heartCount : null,
      },
      stats: {
        views: typeof stats.playCount === 'number' ? stats.playCount : (stats.playCount ? parseInt(stats.playCount, 10) : null),
        likes: typeof stats.diggCount === 'number' ? stats.diggCount : (stats.diggCount ? parseInt(stats.diggCount, 10) : null),
        comments: typeof stats.commentCount === 'number' ? stats.commentCount : (stats.commentCount ? parseInt(stats.commentCount, 10) : null),
        shares: typeof stats.shareCount === 'number' ? stats.shareCount : (stats.shareCount ? parseInt(stats.shareCount, 10) : null),
        saves: typeof stats.collectCount === 'number' ? stats.collectCount : (stats.collectCount ? parseInt(stats.collectCount, 10) : null),
      },
      media: {
        videoUrl: item.video?.playAddr || item.video?.downloadAddr || '',
        coverUrl: item.video?.cover || '',
        duration: item.video?.duration || null,
      }
    };
  } catch (err) {
    console.error('Error parsing rehydration JSON:', err);
    return null;
  }
}

/**
 * Fetch profile follower count directly from TikTok profile
 */
export async function fetchProfileFollowers(username) {
  const profileUrl = `https://www.tiktok.com/@${username.replace(/^@/, '')}`;
  try {
    const res1 = await fetch(profileUrl, { headers: BROWSER_HEADERS });
    let html = await res1.text();

    if (!html.includes('__UNIVERSAL_DATA_FOR_REHYDRATION__')) {
      const wciMatch = html.match(/<p id="wci" class="([^"]*)"><\/p>/);
      const csMatch = html.match(/<p id="cs" class="([^"]*)"><\/p>/);
      if (wciMatch && csMatch) {
        const cookieName = wciMatch[1];
        const solved = solveWafPoW(csMatch[1]);
        if (solved) {
          const res2 = await fetch(profileUrl, {
            headers: {
              ...BROWSER_HEADERS,
              'Cookie': `${cookieName}=${solved};`,
              'Referer': profileUrl,
            }
          });
          html = await res2.text();
        }
      }
    }

    const match = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
    if (match) {
      const data = JSON.parse(match[1]);
      const userDetail = data?.['__DEFAULT_SCOPE__']?.['webapp.user-detail'];
      const stats = userDetail?.userInfo?.stats;
      if (stats && typeof stats.followerCount === 'number') {
        return stats.followerCount;
      }
    }
  } catch (err) {
    console.error('Failed to fetch profile followers:', err.message);
  }
  return null;
}

/**
 * Fallback extraction using TikWM API
 */
async function extractFromTikWM(targetUrl) {
  try {
    const res = await fetch('https://www.tikwm.com/api/', {
      method: 'POST',
      headers: {
        'User-Agent': BROWSER_HEADERS['User-Agent'],
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ url: targetUrl, hd: '1' }),
    });

    const json = await res.json();
    if (json.code === 0 && json.data) {
      const d = json.data;
      const username = d.author?.unique_id || '';

      // TikWM video endpoint doesn't return author followers, so fetch followers via direct profile PoW
      let followers = null;
      if (username) {
        followers = await fetchProfileFollowers(username);
      }

      return {
        success: true,
        source: 'tikwm_fallback',
        videoUrl: targetUrl,
        videoId: d.id || '',
        createTime: d.create_time || null,
        caption: d.title || '',
        author: {
          id: d.author?.id || '',
          username: username,
          nickname: d.author?.nickname || '',
          avatar: d.author?.avatar || '',
          followerCount: followers,
          followingCount: null,
          heartCount: null,
        },
        stats: {
          views: typeof d.play_count === 'number' ? d.play_count : null,
          likes: typeof d.digg_count === 'number' ? d.digg_count : null,
          comments: typeof d.comment_count === 'number' ? d.comment_count : null,
          shares: typeof d.share_count === 'number' ? d.share_count : null,
          saves: typeof d.collect_count === 'number' ? d.collect_count : null,
        },
        media: {
          videoUrl: d.play || d.wmplay || '',
          coverUrl: d.cover || '',
          duration: d.duration || null,
        }
      };
    }
  } catch (err) {
    console.error('TikWM fallback error:', err.message);
  }
  return null;
}

/**
 * Main Extraction Function: combines URL resolution, Direct PoW Scraper, and Fallback
 */
export async function extractTikTokVideo(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string' || !inputUrl.trim()) {
    return {
      success: false,
      error: 'URL video TikTok tidak boleh kosong',
      url: inputUrl,
    };
  }

  const trimmed = inputUrl.trim();

  // 1. Resolve URL (handles shortlinks vt.tiktok.com, vm.tiktok.com)
  let resolvedUrl = trimmed;
  try {
    resolvedUrl = await resolveTikTokUrl(trimmed);
  } catch (err) {
    console.warn(`URL resolution warning for ${trimmed}:`, err.message);
  }

  // 2. Try Primary Engine (Direct TikTok WAF PoW Scraper)
  try {
    const directResult = await extractDirectFromTikTok(resolvedUrl);
    if (directResult && directResult.success) {
      return directResult;
    }
  } catch (err) {
    console.warn(`Direct extraction failed for ${resolvedUrl}, trying fallback...`, err.message);
  }

  // 3. Try Secondary Fallback Engine (TikWM API)
  try {
    const fallbackResult = await extractFromTikWM(resolvedUrl);
    if (fallbackResult && fallbackResult.success) {
      return fallbackResult;
    }
  } catch (err) {
    console.error(`Fallback extraction failed for ${resolvedUrl}:`, err.message);
  }

  // 4. Return clear error if both failed
  return {
    success: false,
    error: 'Tidak dapat mengambil data video TikTok. Video mungkin di-private, telah dihapus, atau link tidak valid.',
    url: trimmed,
    resolvedUrl,
  };
}
