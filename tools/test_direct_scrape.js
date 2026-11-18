import { getTtwidCookie } from '../lib/tiktok-extractor.js';

// Let's test solving WAF on a real video
async function testDirectScrape() {
  const targetUrl = 'https://www.tiktok.com/@scout2015/video/6718335390845095173';
  const cookie = await getTtwidCookie('114.122.14.85');
  const res = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
      'Cookie': cookie,
    }
  });
  console.log('Direct status:', res.status);
  const html = await res.text();
  console.log('HTML length:', html.length);
  if (html.includes('__UNIVERSAL_DATA_FOR_REHYDRATION__')) {
    console.log('Universal data found!');
    const m = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
    const data = JSON.parse(m[1]);
    const scope = data['__DEFAULT_SCOPE__'] || {};
    const videoDetail = scope['webapp.video-detail'];
    if (videoDetail?.itemInfo?.itemStruct) {
      const it = videoDetail.itemInfo.itemStruct;
      console.log('Item found! Video keys:', Object.keys(it.video || {}));
      console.log('it.video.playAddr:', it.video?.playAddr);
      console.log('it.video.downloadAddr:', it.video?.downloadAddr);
      console.log('it.video.bitrateInfo:', it.video?.bitrateInfo?.map(b => b.Bitrate));
      console.log('Music keys:', Object.keys(it.music || {}));
      console.log('it.music.playUrl:', it.music?.playUrl);
    } else {
      console.log('No itemStruct, keys in videoDetail:', Object.keys(videoDetail || {}));
      console.log('videoDetail contents:', JSON.stringify(videoDetail));
    }
  } else {
    console.log('No universal data');
  }
}
testDirectScrape().catch(console.error);
