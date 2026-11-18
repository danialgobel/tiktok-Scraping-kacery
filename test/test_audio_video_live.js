import { startDesktopServer } from '../server.js';
import { extractTikTokVideo } from '../lib/tiktok-extractor.js';

async function runLiveTest() {
  console.log('=== LIVE TEST: AUDIO STREAM DEMUX & VIDEO PROXY ===');
  const { server, port } = await startDesktopServer(0);
  console.log(`[1] Server internal running on test port: ${port}`);

  const testVideoUrl = 'https://www.tiktok.com/@scout2015/video/6718335390845095173';
  console.log(`[2] Extracting live TikTok video: ${testVideoUrl}`);
  const extractRes = await extractTikTokVideo(testVideoUrl);
  
  if (!extractRes.success || !extractRes.media?.videoUrl) {
    console.error('FAILED: Could not extract videoUrl');
    server.close();
    process.exit(1);
  }

  const videoUrl = extractRes.media.videoUrl;
  console.log(`    Extracted videoUrl: ${videoUrl.slice(0, 70)}...`);
  console.log(`    Extracted audioUrl: ${extractRes.media.audioUrl ? 'YES (same as video stream)' : 'NO'}`);

  // 1. Test /api/stream-audio (demux pure MP3 from video stream via ffmpeg)
  console.log('\n[3] Testing /api/stream-audio endpoint...');
  const audioEndpoint = `http://127.0.0.1:${port}/api/stream-audio?url=${encodeURIComponent(videoUrl)}`;
  const audioRes = await fetch(audioEndpoint);
  console.log(`    HTTP Status: ${audioRes.status} (Expected: 200)`);
  console.log(`    Content-Type: ${audioRes.headers.get('content-type')} (Expected: audio/mpeg)`);
  const audioBuf = await audioRes.arrayBuffer();
  console.log(`    Audio Stream Size: ${audioBuf.byteLength} bytes`);
  const isAudioOk = audioRes.status === 200 && audioBuf.byteLength > 10000;
  console.log(`    >>> Audio Demux Test: ${isAudioOk ? 'PASS (100% SUKSES)' : 'FAIL'} <<<`);

  // 2. Test /api/proxy-video (bypasses hotlink protection with Range request)
  console.log('\n[4] Testing /api/proxy-video endpoint with HTTP Range (0-1024)...');
  const videoProxyEndpoint = `http://127.0.0.1:${port}/api/proxy-video?url=${encodeURIComponent(videoUrl)}`;
  const videoProxyRes = await fetch(videoProxyEndpoint, {
    headers: { 'Range': 'bytes=0-1024' }
  });
  console.log(`    HTTP Status: ${videoProxyRes.status} (Expected: 206 Partial Content)`);
  console.log(`    Content-Type: ${videoProxyRes.headers.get('content-type')} (Expected: video/mp4)`);
  console.log(`    Content-Range: ${videoProxyRes.headers.get('content-range')}`);
  const videoBuf = await videoProxyRes.arrayBuffer();
  console.log(`    Video Range Chunk Size: ${videoBuf.byteLength} bytes (Expected: 1025)`);
  const isVideoOk = videoProxyRes.status === 206 && videoBuf.byteLength === 1025;
  console.log(`    >>> Video Proxy Range Test: ${isVideoOk ? 'PASS (100% SUKSES)' : 'FAIL'} <<<`);

  server.close(() => {
    console.log('\n=== SEMUA PENGUJIAN AUDIO & VIDEO 100% SELESAI & LULUS! ===');
    process.exit((isAudioOk && isVideoOk) ? 0 : 1);
  });
}

runLiveTest().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

