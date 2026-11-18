const { execSync } = require('child_process');
try {
  const stdout = execSync('tasklist', { encoding: 'utf8' });
  const lines = stdout.split('\n').filter(l => l.toLowerCase().includes('tiktok'));
  console.log('Running processes:', lines.length > 0 ? lines : 'None');
} catch (e) {
  console.error(e);
}

