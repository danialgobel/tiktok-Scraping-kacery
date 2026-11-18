async function testPublicAPIs() {
  const cleanUrl = 'https://www.tiktok.com/@scout2015/video/6718335390845095173';
  
  // Test TikWM Mirror
  try {
    const res = await fetch('https://api.tikwm.com/api/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' },
      body: new URLSearchParams({ url: cleanUrl, hd: '1' })
    });
    const text = await res.text();
    console.log('TikWM mirror status:', res.status, 'Preview:', text.slice(0, 100));
  } catch (e) {
    console.log('TikWM mirror failed:', e.message);
  }

  // Test TikMate API
  try {
    const res = await fetch('https://api.tikmate.app/api/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' },
      body: new URLSearchParams({ url: cleanUrl })
    });
    const text = await res.text();
    console.log('TikMate status:', res.status, 'Preview:', text.slice(0, 100));
  } catch (e) {
    console.log('TikMate failed:', e.message);
  }

  // Test LoveTik API
  try {
    const res = await fetch('https://lovetik.com/api/ajax/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' },
      body: new URLSearchParams({ query: cleanUrl })
    });
    const text = await res.text();
    console.log('LoveTik status:', res.status, 'Preview:', text.slice(0, 100));
  } catch (e) {
    console.log('LoveTik failed:', e.message);
  }
}
testPublicAPIs();

