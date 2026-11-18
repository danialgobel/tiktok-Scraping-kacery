import crypto from 'crypto';

const DEFAULT_INDONESIA_IP = '180.252.120.30';

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

let cachedTtwidCookie = '';
let lastTtwidFetch = 0;

/**
 * Obtain legitimate visitor session cookie (ttwid) from TikTok
 */
export async function getTtwidCookie(clientIp = '') {
  const now = Date.now();
  if (cachedTtwidCookie && (now - lastTtwidFetch < 30 * 60 * 1000)) {
    return cachedTtwidCookie;
  }
  const ip = clientIp || DEFAULT_INDONESIA_IP;
  try {
    const homeRes = await fetch('https://www.tiktok.com/', {
      headers: {
        ...BROWSER_HEADERS,
        'X-Forwarded-For': ip,
        'X-Real-IP': ip,
        'Client-IP': ip,
        'Referer': 'https://www.google.com/',
      },
    });
    const cookies = (homeRes.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ');
    if (cookies && cookies.includes('ttwid')) {
      cachedTtwidCookie = cookies;
      lastTtwidFetch = now;
      return cachedTtwidCookie;
    }
  } catch (e) {
    console.warn('Could not pre-fetch ttwid cookie:', e.message);
  }
  return cachedTtwidCookie || '';
}

/**
 * Resolve shortlink or canonical URL to final TikTok URL
 */
export async function resolveTikTokUrl(inputUrl, clientIp = '') {
  const cleanUrl = inputUrl.trim();
  const ip = clientIp || DEFAULT_INDONESIA_IP;
  try {
    const ttwidCookie = await getTtwidCookie(ip);
    const regionalCookies = 'store-country-code=id; store-idc=alisg; my_region=ID; country_code=ID;';
    const response = await fetch(cleanUrl, {
      method: 'GET',
      headers: {
        ...BROWSER_HEADERS,
        'X-Forwarded-For': ip,
        'X-Real-IP': ip,
        'Client-IP': ip,
        'Cookie': [ttwidCookie, regionalCookies].filter(Boolean).join('; '),
      },
      redirect: 'follow',
    });
    return response.url || cleanUrl;
  } catch (err) {
    return cleanUrl;
  }
}

/**
 * Extract Yellow Shopping Cart (TikTok Shop / Product Anchor) from TikTok direct itemStruct
 */
export function parseYellowCartFromTikTok(item = {}) {
  let hasCart = false;
  let name = '';
  let coverUrl = '';
  let productId = '';
  let productUrl = '';
  let seller = '';

  if (item.isECVideo) {
    hasCart = true;
  }

  if (Array.isArray(item.anchors)) {
    for (const anchor of item.anchors) {
      if (anchor.component_key === 'anchor_shop' || anchor.type === 28 || anchor.type === 33) {
        hasCart = true;
        if (anchor.keyword) name = anchor.keyword;
        if (anchor.id) productId = String(anchor.id);
        if (anchor.thumbnail?.urlList?.[0]) coverUrl = anchor.thumbnail.urlList[0];
      }

      if (anchor.extra && typeof anchor.extra === 'string') {
        try {
          const parsedExtra = JSON.parse(anchor.extra);
          const shopItems = Array.isArray(parsedExtra) ? parsedExtra : [parsedExtra];
          for (const s of shopItems) {
            if (s.component_key === 'anchor_shop' || s.type === 33 || s.type === 28 || s.keyword) {
              hasCart = true;
              if (s.keyword && !name) name = s.keyword;
              if (s.id && !productId) productId = String(s.id);
              if (s.icon?.url_list?.[0] && !coverUrl) coverUrl = s.icon.url_list[0];

              if (s.extra && typeof s.extra === 'string') {
                try {
                  const deep = JSON.parse(s.extra);
                  if (deep.title) name = deep.title;
                  if (deep.cover_url) coverUrl = deep.cover_url;
                  else if (deep.img_url?.[0]) coverUrl = deep.img_url[0];
                  if (deep.seo_url) productUrl = deep.seo_url;
                  else if (deep.detail_url) productUrl = deep.detail_url;
                  if (deep.source) seller = deep.source;
                  if (deep.product_id) productId = String(deep.product_id);
                } catch (e) {}
              }
            }
          }
        } catch (e) {}
      }
    }
  }

  const proxyCoverUrl = coverUrl ? `/api/proxy-image?url=${encodeURIComponent(coverUrl)}` : '';

  return {
    hasCart,
    name: name || (hasCart ? 'Produk TikTok Shop' : ''),
    coverUrl,
    proxyCoverUrl,
    productId,
    productUrl,
    seller: seller || (hasCart ? 'TikTok Shop / Tokopedia' : ''),
  };
}

/**
 * Extract Yellow Shopping Cart from TikWM payload
 */
export function parseYellowCartFromTikWM(d = {}) {
  let hasCart = false;
  let name = '';
  let coverUrl = '';
  let productId = '';
  let productUrl = '';
  let seller = '';

  if (d.anchors_extras && typeof d.anchors_extras === 'string') {
    try {
      const extra = JSON.parse(d.anchors_extras);
      if (extra.is_ec_video === 1 || extra.ec_anchor_info?.anchor_tag === 'Shop' || (extra.ec_anchor_info?.da_info && extra.ec_anchor_info.da_info.includes('video_cart_tag'))) {
        hasCart = true;
      }
    } catch (e) {}
  }

  if (Array.isArray(d.anchors) && d.anchors.length > 0) {
    for (const a of d.anchors) {
      if (a.keyword) {
        hasCart = true;
        name = a.keyword;
      }
      if (a.thumbnail?.urlList?.[0]) {
        coverUrl = a.thumbnail.urlList[0];
      }
    }
  }

  const proxyCoverUrl = coverUrl ? `/api/proxy-image?url=${encodeURIComponent(coverUrl)}` : '';

  return {
    hasCart,
    name: name || (hasCart ? 'Produk TikTok Shop' : ''),
    coverUrl,
    proxyCoverUrl,
    productId,
    productUrl,
    seller: seller || (hasCart ? 'TikTok Shop / Tokopedia' : ''),
  };
}

/**
 * Fetch video details directly from TikTok using SlardarWAF solver & ttwid session
 */
async function extractDirectFromTikTok(targetUrl, clientIp = '', customCookie = '') {
  const ip = clientIp || DEFAULT_INDONESIA_IP;
  const ttwidCookie = customCookie || await getTtwidCookie(ip);
  const regionalCookies = 'store-country-code=id; store-idc=alisg; my_region=ID; country_code=ID;';
  const initialCookie = [ttwidCookie, regionalCookies].filter(Boolean).join('; ');

  const requestHeaders = {
    ...BROWSER_HEADERS,
    'X-Forwarded-For': ip,
    'X-Real-IP': ip,
    'Client-IP': ip,
    'Cookie': initialCookie,
  };

  const res1 = await fetch(targetUrl, {
    headers: requestHeaders,
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
        let res1Cookies = '';
        if (typeof res1.headers.getSetCookie === 'function') {
          res1Cookies = res1.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
        } else {
          const raw = res1.headers.get('set-cookie');
          if (raw) res1Cookies = raw.split(';')[0];
        }
        const combinedCookies = [ttwidCookie, regionalCookies, res1Cookies, `${cookieName}=${solvedCookieValue}`].filter(Boolean).join('; ');

        const res2 = await fetch(finalUrl, {
          headers: {
            ...BROWSER_HEADERS,
            'X-Forwarded-For': ip,
            'X-Real-IP': ip,
            'Client-IP': ip,
            'Cookie': combinedCookies,
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
    
    // Extract 100% full raw caption, combining item.desc and item.contents array (before & after hashtags)
    let fullCaption = item.desc || '';
    if (Array.isArray(item.contents) && item.contents.length > 0) {
      const mergedContents = item.contents.map(c => c.desc).filter(Boolean).join('\n').trim();
      if (mergedContents.length > fullCaption.length) {
        fullCaption = mergedContents;
      }
    }

    const author = item.author || {};
    const authorStats = item.authorStats || {};
    const stats = item.stats || {};

    // Multi-source video URL resolution from TikTok JSON structure
    let resolvedVideoUrl = item.video?.playAddr || item.video?.downloadAddr || '';
    if (!resolvedVideoUrl && Array.isArray(item.video?.bitrateInfo)) {
      for (const b of item.video.bitrateInfo) {
        const u = b.PlayAddr?.UrlList?.[0] || b.playAddr?.urlList?.[0] || b.PlayAddr?.urlList?.[0];
        if (u) {
          resolvedVideoUrl = u;
          break;
        }
      }
    }
    if (!resolvedVideoUrl && item.video?.PlayAddrStruct?.UrlList?.[0]) {
      resolvedVideoUrl = item.video.PlayAddrStruct.UrlList[0];
    }

    return {
      success: true,
      source: 'tiktok_direct',
      videoUrl: finalUrl,
      videoId: item.id || '',
      createTime: item.createTime || null,
      caption: fullCaption,
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
        videoUrl: resolvedVideoUrl,
        coverUrl: item.video?.cover || '',
        duration: item.video?.duration || null,
        // Authentic audio MUST be the video stream URL (voice + mixed audio via ffmpeg demux, NEVER BGM)
        audioUrl: resolvedVideoUrl,
        bgmUrl: item.music?.playUrl || '',
      },
      yellowCart: parseYellowCartFromTikTok(item),
      _debug: {
        vercelRegion: process.env.VERCEL_REGION || 'local',
        rawItem: item,
        hasAnchors: !!item.anchors,
        anchorsLen: item.anchors?.length || 0,
        anchors: item.anchors || [],
        isECVideo: item.isECVideo,
        itemKeys: Object.keys(item),
      },
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
          let initialCookies = '';
          if (typeof res1.headers.getSetCookie === 'function') {
            initialCookies = res1.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
          } else {
            const raw = res1.headers.get('set-cookie');
            if (raw) initialCookies = raw.split(';')[0];
          }
          const cookieHeader = [initialCookies, `${cookieName}=${solved}`].filter(Boolean).join('; ');

          const res2 = await fetch(profileUrl, {
            headers: {
              ...BROWSER_HEADERS,
              'Cookie': cookieHeader,
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
 * Clean & sanitize TikTok URL, stripping tracking parameters for resilient scraping
 */
export function sanitizeTikTokUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  try {
    const parsed = new URL(trimmed);
    return `${parsed.origin}${parsed.pathname}`;
  } catch (e) {
    return trimmed.split('?')[0];
  }
}

/**
 * Fallback extraction using TikWM API
 * @param {string} targetUrl 
 * @param {boolean} fetchFollowers Whether to fetch profile followers via separate HTTP request (set false for fast parallel enrichment)
 */
async function extractFromTikWM(targetUrl, fetchFollowers = true) {
  try {
    const cleanUrl = sanitizeTikTokUrl(targetUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('https://www.tikwm.com/api/', {
      method: 'POST',
      headers: {
        'User-Agent': BROWSER_HEADERS['User-Agent'],
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ url: cleanUrl, hd: '1' }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await res.text();
    if (!text.startsWith('{')) {
      console.warn('TikWM returned non-JSON response');
      return null;
    }
    const json = JSON.parse(text);
    if (json.code === 0 && json.data) {
      const d = json.data;
      const username = d.author?.unique_id || '';

      // Only fetch followers via profile PoW if requested (saves ~1.5s in parallel extraction)
      let followers = null;
      if (fetchFollowers && username) {
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
          // Authentic audio is strictly the video URL (never BGM song)
          audioUrl: d.play || d.wmplay || '',
          bgmUrl: d.music || d.music_info?.play || '',
        },
        yellowCart: parseYellowCartFromTikWM(d),
      };
    }
  } catch (err) {
    console.error('TikWM fallback error:', err.message);
  }
  return null;
}

/**
 * Tertiary fallback extraction using TikMate API
 * @param {string} targetUrl 
 * @param {boolean} fetchFollowers
 */
async function extractFromTikMate(targetUrl, fetchFollowers = false) {
  try {
    const cleanUrl = sanitizeTikTokUrl(targetUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch('https://api.tikmate.app/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': BROWSER_HEADERS['User-Agent'],
      },
      body: new URLSearchParams({ url: cleanUrl }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await res.text();
    if (!text.startsWith('{')) return null;
    const json = JSON.parse(text);

    if (json.id && json.token) {
      const streamUrl = `https://tikmate.app/download/${json.token}/${json.id}.mp4`;
      const username = json.author_id || json.author_name || '';

      let followers = null;
      if (fetchFollowers && username) {
        followers = await fetchProfileFollowers(username);
      }

      return {
        success: true,
        source: 'tikmate_fallback',
        videoUrl: targetUrl,
        videoId: json.id || '',
        createTime: json.create_time || null,
        caption: json.desc || '',
        author: {
          id: json.author_id || '',
          username: username,
          nickname: json.author_name || username,
          avatar: json.author_avatar || '',
          followerCount: followers,
          followingCount: null,
          heartCount: null,
        },
        stats: {
          views: null,
          likes: typeof json.like_count === 'number' ? json.like_count : null,
          comments: typeof json.comment_count === 'number' ? json.comment_count : null,
          shares: typeof json.share_count === 'number' ? json.share_count : null,
          saves: null,
        },
        media: {
          videoUrl: streamUrl,
          coverUrl: json.cover || json.dynamic_cover || '',
          duration: null,
          audioUrl: streamUrl,
          bgmUrl: '',
        },
        yellowCart: {
          hasCart: false,
          name: '',
          coverUrl: '',
          proxyCoverUrl: '',
          productId: '',
          productUrl: '',
          seller: '',
        },
      };
    }
  } catch (err) {
    console.warn('TikMate fallback notice:', err.message);
  }
  return null;
}

// High-performance in-memory cache for fast repeated validations (15 min TTL)
const EXTRACTION_CACHE = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

export function clearExtractionCache() {
  EXTRACTION_CACHE.clear();
}

/**
 * Main Extraction Function: combines Concurrent Parallel Scraper and Resilient Fallbacks
 */
export async function extractTikTokVideo(inputUrl, clientIp = '', customCookie = '') {
  if (!inputUrl || typeof inputUrl !== 'string' || !inputUrl.trim()) {
    return {
      success: false,
      error: 'URL video TikTok tidak boleh kosong',
      url: inputUrl,
    };
  }

  const trimmed = inputUrl.trim();
  const cacheKey = trimmed.toLowerCase();

  // 1. Instant Cache Check (0ms response for repeated URLs)
  const cached = EXTRACTION_CACHE.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return JSON.parse(JSON.stringify(cached.data));
  }

  // 2. Parallel Fetch: Scrape TikTok Direct (accurate stats & cart) + TikWM (video & authentic voice) simultaneously
  const directPromise = extractDirectFromTikTok(trimmed, clientIp, customCookie).catch(err => {
    console.warn(`Direct extraction failed for ${trimmed}:`, err.message);
    return null;
  });

  // TikWM can accept shortlinks directly; fetchFollowers is set to false initially to save ~1.5s
  const tikwmPromise = extractFromTikWM(trimmed, false).catch(err => {
    console.warn(`TikWM parallel fetch failed for ${trimmed}:`, err.message);
    return null;
  });

  const [directResult, tikwmResult] = await Promise.all([directPromise, tikwmPromise]);

  // Case A: Direct scraper succeeded (authoritative metrics, followers, cart & caption)
  if (directResult && directResult.success) {
    // 1. First priority: video stream from parallel TikWM
    if (tikwmResult && tikwmResult.success && tikwmResult.media?.videoUrl) {
      directResult.media.videoUrl = tikwmResult.media.videoUrl;
      directResult.media.audioUrl = tikwmResult.media.videoUrl;
      if (tikwmResult.media?.bgmUrl) {
        directResult.media.bgmUrl = tikwmResult.media.bgmUrl;
      }
      if (!directResult.yellowCart?.hasCart && tikwmResult.yellowCart?.hasCart) {
        directResult.yellowCart = tikwmResult.yellowCart;
      }
    } 
    
    // 2. If videoUrl is still empty or Akamai-locked, try TikMate tertiary resolver
    if (!directResult.media.videoUrl || directResult.media.videoUrl.includes('webapp-prime')) {
      try {
        const mateRes = await extractFromTikMate(trimmed, false);
        if (mateRes && mateRes.media?.videoUrl) {
          directResult.media.videoUrl = mateRes.media.videoUrl;
          directResult.media.audioUrl = mateRes.media.videoUrl;
        }
      } catch (e) {}
    }

    // 3. If still empty, try secondary TikWM fetch with clean sanitized URL
    if (!directResult.media.videoUrl || directResult.media.videoUrl.includes('webapp-prime')) {
      try {
        const fallbackRes = await extractFromTikWM(trimmed, false);
        if (fallbackRes && fallbackRes.media?.videoUrl) {
          directResult.media.videoUrl = fallbackRes.media.videoUrl;
          directResult.media.audioUrl = fallbackRes.media.videoUrl;
          if (fallbackRes.yellowCart?.hasCart && !directResult.yellowCart?.hasCart) {
            directResult.yellowCart = fallbackRes.yellowCart;
          }
        }
      } catch (e) {}
    }

    // 4. Emergency Audio Fallback: If videoUrl is available, audio is videoUrl.
    // If video stream is completely blocked, fall back to bgmUrl so audio player NEVER dies!
    if (directResult.media.videoUrl) {
      directResult.media.audioUrl = directResult.media.videoUrl;
    } else if (directResult.media.bgmUrl) {
      directResult.media.audioUrl = directResult.media.bgmUrl;
    }

    // Save to Cache
    EXTRACTION_CACHE.set(cacheKey, { timestamp: Date.now(), data: directResult });
    if (directResult.videoId) {
      EXTRACTION_CACHE.set(`vid_${directResult.videoId}`, { timestamp: Date.now(), data: directResult });
    }
    if (EXTRACTION_CACHE.size > 200) {
      const oldest = EXTRACTION_CACHE.keys().next().value;
      EXTRACTION_CACHE.delete(oldest);
    }

    return directResult;
  }

  // Case B: Direct scraper blocked or failed, but TikWM succeeded
  if (tikwmResult && tikwmResult.success) {
    // If TikWM lacks followerCount, fetch it now as fallback
    if (tikwmResult.author?.username && (tikwmResult.author.followerCount === null || typeof tikwmResult.author.followerCount === 'undefined')) {
      try {
        tikwmResult.author.followerCount = await fetchProfileFollowers(tikwmResult.author.username);
      } catch (fErr) {
        console.warn(`Profile follower fallback fetch error:`, fErr.message);
      }
    }

    EXTRACTION_CACHE.set(cacheKey, { timestamp: Date.now(), data: tikwmResult });
    if (tikwmResult.videoId) {
      EXTRACTION_CACHE.set(`vid_${tikwmResult.videoId}`, { timestamp: Date.now(), data: tikwmResult });
    }
    return tikwmResult;
  }

  // Case C: Both concurrent fetches failed, resolve URL and try secondary/tertiary fallback
  let resolvedUrl = trimmed;
  try {
    resolvedUrl = await resolveTikTokUrl(trimmed, clientIp);
    // Try TikWM on resolved URL
    const fallbackResult = await extractFromTikWM(resolvedUrl, true);
    if (fallbackResult && fallbackResult.success) {
      EXTRACTION_CACHE.set(cacheKey, { timestamp: Date.now(), data: fallbackResult });
      return fallbackResult;
    }
    // Try TikMate on resolved URL
    const mateFallback = await extractFromTikMate(resolvedUrl, true);
    if (mateFallback && mateFallback.success) {
      EXTRACTION_CACHE.set(cacheKey, { timestamp: Date.now(), data: mateFallback });
      return mateFallback;
    }
  } catch (err) {
    console.error(`Secondary fallback extraction failed for ${resolvedUrl}:`, err.message);
  }

  // Case D: Return clear error if all attempts fail
  return {
    success: false,
    error: 'Tidak dapat mengambil data video TikTok. Video mungkin di-private, telah dihapus, atau link tidak valid.',
    url: trimmed,
    resolvedUrl,
  };
}
