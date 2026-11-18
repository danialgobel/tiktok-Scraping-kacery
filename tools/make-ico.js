import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pngPath = path.join(__dirname, '..', 'public', 'icons', 'kacery-logo.png');
const icoPath = path.join(__dirname, '..', 'public', 'icons', 'kacery-logo.ico');

const pngBuffer = fs.readFileSync(pngPath);

// Windows Vista+ ICO header with embedded PNG payload
// Header: 2 bytes reserved (0), 2 bytes type (1 = icon), 2 bytes image count (1)
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // Reserved
header.writeUInt16LE(1, 2); // ICO format
header.writeUInt16LE(1, 4); // 1 image

// Directory entry: 16 bytes
const dirEntry = Buffer.alloc(16);
dirEntry.writeUInt8(0, 0);       // Width 0 means 256px
dirEntry.writeUInt8(0, 1);       // Height 0 means 256px
dirEntry.writeUInt8(0, 2);       // Color count (0 = >= 8bpp)
dirEntry.writeUInt8(0, 3);       // Reserved
dirEntry.writeUInt16LE(1, 4);     // Color planes
dirEntry.writeUInt16LE(32, 6);    // Bits per pixel
dirEntry.writeUInt32LE(pngBuffer.length, 8); // Image size in bytes
dirEntry.writeUInt32LE(22, 12);   // Offset of image data (6 header + 16 dirEntry = 22)

const icoBuffer = Buffer.concat([header, dirEntry, pngBuffer]);
fs.writeFileSync(icoPath, icoBuffer);
console.log(`✅ Berhasil membuat ${icoPath} (${icoBuffer.length} bytes)`);

