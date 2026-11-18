async function testTikTokAweme() {
  const videoId = '7441228701775252744';
  const url = `https://api16-normal-c-alisg.tiktokv.com/aweme/v1/feed/?aweme_id=${videoId}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'com.zhiliaoapp.musically/2022600030 (Linux; U; Android 7.1.2; es_ES; SM-G988N; Build/NRD90M;tt-ok/3.12.13.1)',
        'Accept': 'application/json'
      }
    });
    console.log('Aweme Status:', res.status);
    const json = await res.json();
    console.log('Aweme response keys:', Object.keys(json));
    const aweme = json.aweme_list?.[0];
    if (aweme) {
      console.log('Video play_addr url_list:', aweme.video?.play_addr?.url_list?.slice(0, 2));
    }
  } catch (e) {
    console.error('Aweme err:', e.message);
  }
}
testTikTokAweme();

