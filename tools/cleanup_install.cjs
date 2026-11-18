const fs = require('fs');
const path = require('path');

const localAppData = process.env.LOCALAPPDATA || '';
const appData = process.env.APPDATA || '';
const userProfile = process.env.USERPROFILE || '';

const pathsToDelete = [
  path.join(localAppData, 'Programs', 'tiktok-validator-kacery'),
  path.join(appData, 'tiktok-validator-kacery'),
  path.join(localAppData, 'tiktok-validator-kacery-updater'),
  path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'TikTok Validator Kacery.lnk'),
  path.join(userProfile, 'OneDrive', 'Desktop', 'TikTok Validator Kacery.lnk'),
  path.join(userProfile, 'Desktop', 'TikTok Validator Kacery.lnk'),
];

console.log('Cleaning up old installation files...');
for (const p of pathsToDelete) {
  if (fs.existsSync(p)) {
    try {
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        fs.rmSync(p, { recursive: true, force: true });
        console.log(`[DELETED DIRECTORY] ${p}`);
      } else {
        fs.unlinkSync(p);
        console.log(`[DELETED FILE] ${p}`);
      }
    } catch (err) {
      console.error(`[ERROR DELETING] ${p}:`, err.message);
    }
  } else {
    console.log(`[NOT PRESENT] ${p}`);
  }
}
console.log('Cleanup finished.');

