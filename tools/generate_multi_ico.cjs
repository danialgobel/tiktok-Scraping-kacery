const { app, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(() => {
  const pngPath = path.join(__dirname, '..', 'public', 'icons', 'kacery-logo.png');
  const baseImg = nativeImage.createFromPath(pngPath);
  console.log('Original image size:', baseImg.getSize());

  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const images = [];

  for (const s of sizes) {
    const resized = baseImg.resize({ width: s, height: s, quality: 'high' });
    const pngBuffer = resized.toPNG();
    images.push({ size: s, buffer: pngBuffer });
    console.log(`Generated frame ${s}x${s}, size: ${pngBuffer.length} bytes`);
  }

  // Construct standard multi-resolution Windows ICO file
  // Header: 6 bytes (Reserved 2, Type 2, Count 2)
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  // Directory entries: count * 16 bytes
  const dirSize = count * 16;
  let currentOffset = 6 + dirSize;

  const dirBuffers = [];
  const imageBuffers = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size === 256 ? 0 : img.size, 0); // Width
    entry.writeUInt8(img.size === 256 ? 0 : img.size, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Image data size
    entry.writeUInt32LE(currentOffset, 12); // Offset to image data

    dirBuffers.push(entry);
    imageBuffers.push(img.buffer);
    currentOffset += img.buffer.length;
  }

  const finalIco = Buffer.concat([header, ...dirBuffers, ...imageBuffers]);
  const outPath = path.join(__dirname, '..', 'public', 'icons', 'kacery-logo.ico');
  fs.writeFileSync(outPath, finalIco);
  console.log(`Successfully generated multi-resolution ICO at ${outPath}, total size: ${finalIco.length} bytes`);

  app.quit();
});

