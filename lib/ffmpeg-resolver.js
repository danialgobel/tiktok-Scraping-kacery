import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lokasi penyimpanan dependency lokal di komputer user (%APPDATA%\TikTokValidatorKacery\bin)
export function getAppDataBinDir() {
  const baseDir = process.env.APPDATA || 
    (process.platform === 'darwin' 
      ? path.join(process.env.HOME || '', 'Library', 'Application Support') 
      : path.join(process.env.HOME || '', '.config'));
  
  const targetDir = path.join(baseDir, 'TikTokValidatorKacery', 'bin');
  if (!fs.existsSync(targetDir)) {
    try {
      fs.mkdirSync(targetDir, { recursive: true });
    } catch (e) {
      console.warn('Gagal membuat direktori AppData bin:', e.message);
    }
  }
  return targetDir;
}

/**
 * Mencari executable ffmpeg dengan prioritas 4 lapis:
 * 1. AppData lokal user (%APPDATA%\TikTokValidatorKacery\bin\ffmpeg.exe)
 * 2. Bundled Electron resources (process.resourcesPath/bin/ffmpeg.exe)
 * 3. Folder project lokal (./bin/ffmpeg.exe)
 * 4. Sistem PATH global ('ffmpeg')
 */
export function getFfmpegPath() {
  const isWin = process.platform === 'win32';
  const binaryName = isWin ? 'ffmpeg.exe' : 'ffmpeg';

  // 1. Cek di AppData folder user
  try {
    const appDataPath = path.join(getAppDataBinDir(), binaryName);
    if (fs.existsSync(appDataPath)) return appDataPath;
  } catch (e) {}

  // 2. Cek di Electron resources (jika running as desktop app)
  if (process.resourcesPath) {
    const resourcesPath = path.join(process.resourcesPath, 'bin', binaryName);
    if (fs.existsSync(resourcesPath)) return resourcesPath;
  }

  // 3. Cek di folder root project ./bin/
  const localProjectBin = path.join(__dirname, '..', 'bin', binaryName);
  if (fs.existsSync(localProjectBin)) return localProjectBin;

  // 4. Default ke command di system PATH
  return binaryName;
}

/**
 * Uji apakah executable ffmpeg yang ditemukan bisa dijalankan
 */
export function checkFfmpegAvailable() {
  return new Promise((resolve) => {
    const ffmpegCmd = getFfmpegPath();
    try {
      const proc = spawn(ffmpegCmd, ['-version']);
      proc.on('error', () => resolve(false));
      proc.on('close', (code) => resolve(code === 0));
    } catch (e) {
      resolve(false);
    }
  });
}

