async function testTikMate() {
  const cleanUrl = 'https://www.tiktok.com/@scout2015/video/6718335390845095173';
  const res = await fetch('https://api.tikmate.app/api/lookup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: new URLSearchParams({ url: cleanUrl })
  });
  console.log('TikMate Status:', res.status);
  const json = await res.json();
  console.log('TikMate Keys:', Object.keys(json));
  console.log('id:', json.id, 'token:', json.token);
  // TikMate stream URL is: https://tikmate.app/download/${token}/${id}.mp4?hd=1
  if (json.id && json.token) {
    const streamUrl = `https://tikmate.app/download/${json.token}/${json.id}.mp4`;
    console.log('TikMate Stream URL:', streamUrl);
  }
}
testTikMate();

