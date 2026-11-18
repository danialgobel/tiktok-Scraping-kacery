import { getTtwidCookie } from '../lib/tiktok-extractor.js';

async function inspectVideoObject() {
  const videoUrl = 'https://www.tiktok.com/@fumakilla.indonesia/video/7397750585644158214'; // or any video
  const cookie = await getTtwidCookie('114.122.14.85');
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    'Cookie': cookie,
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
  };

  const res = await fetch(videoUrl, { headers });
  const html = await res.text();
  const match = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) {
    console.log('No rehydration, check WAF');
    return;
  }
  const data = JSON.parse(match[1]);
  const videoDetail = data?.['__DEFAULT_SCOPE__']?.['webapp.video-detail'];
  const item = videoDetail?.itemInfo?.itemStruct;
  if (!item) {
    console.log('No itemStruct found');
    return;
  }
  console.log('Item Video Keys:', Object.keys(item.video || {}));
  console.log('playAddr:', item.video?.playAddr);
  console.log('downloadAddr:', item.video?.downloadAddr);
  console.log('bitrateInfo length:', item.video?.bitrateInfo?.length);
  if (item.video?.bitrateInfo) {
    console.log('bitrateInfo[0]:', JSON.stringify(item.video.bitrateInfo[0], null, 2));
  }
  console.log('music:', item.music?.title, item.music?.playUrl);
}

inspectVideoObject().catch(console.error);
