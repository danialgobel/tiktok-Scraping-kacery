async function verifyStream() {
  const cleanUrl = 'https://www.tiktok.com/@scout2015/video/6718335390845095173';
  const res = await fetch('https://api.tikmate.app/api/lookup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: new URLSearchParams({ url: cleanUrl })
  });
  const json = await res.json();
  const streamUrl = `https://tikmate.app/download/${json.token}/${json.id}.mp4`;
  console.log('Fetching head of stream URL...');
  const headRes = await fetch(streamUrl, {
    headers: { 'Range': 'bytes=0-1000' }
  });
  console.log('Stream HTTP status:', headRes.status);
  console.log('Content-Type:', headRes.headers.get('content-type'));
  const buf = await headRes.arrayBuffer();
  console.log('Bytes received:', buf.byteLength);
}
verifyStream().catch(console.error);

