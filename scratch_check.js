async function inspectDeep() {
  const res = await fetch('https://pekerjaankacery.vercel.app/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://vt.tiktok.com/ZSp7FUvR9/' })
  });
  const d = await res.json();
  const it = d._debug?.rawItem;
  if (!it) return;
  console.log('contents:', JSON.stringify(it.contents));
  console.log('textExtra:', JSON.stringify(it.textExtra));
  console.log('stickersOnItem:', JSON.stringify(it.stickersOnItem));
  console.log('originalItem:', it.originalItem);
  console.log('officalItem:', it.officalItem);
  console.log('diversificationId:', it.diversificationId);
  console.log('backendSourceEventTracking:', it.backendSourceEventTracking);
}

inspectDeep();
