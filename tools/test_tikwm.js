async function testTikwm() {
  try {
    const res = await fetch('https://www.tikwm.com/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: new URLSearchParams({ url: 'https://vt.tiktok.com/ZSjXYa3V2/', hd: '1' })
    });
    console.log('TikWM Status:', res.status);
    const text = await res.text();
    console.log('TikWM Response preview:', text.slice(0, 300));
  } catch (err) {
    console.error('TikWM err:', err);
  }
}
testTikwm();

