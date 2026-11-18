import { getTtwidCookie } from './lib/tiktok-extractor.js';

async function testCookies() {
  const c = await getTtwidCookie();
  console.log('Local ttwid cookie:', c);
}

testCookies();
