const fs = require('fs');
const buf = fs.readFileSync('public/icons/kacery-logo.ico');
console.log('ICO file size:', buf.length);
console.log('Number of images inside ICO:', buf.readUInt16LE(4));
for (let i = 0; i < buf.readUInt16LE(4); i++) {
  const offset = 6 + i * 16;
  const w = buf[offset] === 0 ? 256 : buf[offset];
  const h = buf[offset + 1] === 0 ? 256 : buf[offset + 1];
  console.log(`Image ${i + 1}: ${w}x${h}, bpp: ${buf.readUInt16LE(offset + 6)}, bytes: ${buf.readUInt32LE(offset + 8)}`);
}

