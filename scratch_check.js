async function inspectVercelItem() {
  const res = await fetch('https://pekerjaankacery.vercel.app/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://vt.tiktok.com/ZSp7FUvR9/' })
  });
  const data = await res.json();
  console.log('Vercel data keys:', Object.keys(data));
}

inspectVercelItem();
