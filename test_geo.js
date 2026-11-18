import { getTtwidCookie } from './lib/tiktok-extractor.js';

async function testCountryCookie() {
  const ttwid = await getTtwidCookie();
  
  // Test with US store country
  const resUS = await fetch('https://www.tiktok.com/@spilanibunlinka/video/7702294290352934152', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Cookie': ttwid + '; store-country-code=us; my_region=US;',
    }
  });
  const htmlUS = await resUS.text();
  const mUS = htmlUS.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
  if (mUS) {
    const data = JSON.parse(mUS[1]);
    const item = data['__DEFAULT_SCOPE__']?.['webapp.video-detail']?.itemInfo?.itemStruct;
    console.log('US cookie item.anchors:', item?.anchors?.length);
    console.log('US item.isECVideo:', item?.isECVideo);
  } else {
    console.log('No rehydration with US cookie');
  }

  // Test with ID store country
  const resID = await fetch('https://www.tiktok.com/@spilanibunlinka/video/7702294290352934152', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Cookie': ttwid + '; store-country-code=id; my_region=ID;',
    }
  });
  const htmlID = await resID.text();
  const mID = htmlID.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
  if (mID) {
    const data = JSON.parse(mID[1]);
    const item = data['__DEFAULT_SCOPE__']?.['webapp.video-detail']?.itemInfo?.itemStruct;
    console.log('ID cookie item.anchors:', item?.anchors?.length);
    console.log('ID item.isECVideo:', item?.isECVideo);
  }
}

testCountryCookie();

