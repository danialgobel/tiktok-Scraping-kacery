async function check() {
  const res = await fetch("https://www.tiktok.com/@niningsyalalaa", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    }
  });
  const html = await res.text();
  console.log("Status:", res.status, "Length:", html.length);
  // check if rehydration data is present
  const m = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
  if (m) {
    console.log("Rehydration found!");
    try {
      const data = JSON.parse(m[1]);
      const scope = data['__DEFAULT_SCOPE__'] || {};
      const userDetail = scope['webapp.user-detail'] || {};
      const itemList = scope['webapp.user-detail']?.itemList || [];
      console.log("Keys in userDetail:", Object.keys(userDetail));
      console.log("Keys in scope:", Object.keys(scope));
    } catch (e) {
      console.error("JSON err:", e.message);
    }
  } else {
    console.log("Rehydration NOT found. Checking WAF...");
    const wciMatch = html.match(/<p id="wci" class="([^"]*)"><\/p>/);
    console.log("WAF wci:", wciMatch ? wciMatch[1] : 'none');
  }
}
check();
