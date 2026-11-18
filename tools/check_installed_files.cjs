const fs = require('fs');
const path = require('path');

const localAppData = process.env.LOCALAPPDATA || '';
const appData = process.env.APPDATA || '';
const userProfile = process.env.USERPROFILE || '';

const checkPaths = [
  path.join(localAppData, 'Programs', 'tiktok-validator-kacery'),
  path.join(appData, 'tiktok-validator-kacery'),
  path.join(localAppData, 'tiktok-validator-kacery-updater'),
  path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'TikTok Validator Kacery.lnk'),
  path.join(userProfile, 'OneDrive', 'Desktop', 'TikTok Validator Kacery.lnk'),
  path.join(userProfile, 'Desktop', 'TikTok Validator Kacery.lnk'),
];

for (const p of checkPaths) {
  console.log(`${fs.existsSync(p) ? '[EXISTS]' : '[NOT FOUND]'} ${p}`);
}

