const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateChecksum() {
  const rootDir = path.resolve(__dirname, '..');
  const files = fs.readdirSync(rootDir);
  const vsixFile = files.find(f => f.endsWith('.vsix'));

  if (!vsixFile) {
    console.error('[checksum] ERROR: No .vsix file found to generate checksum!');
    process.exit(1);
  }

  const vsixPath = path.join(rootDir, vsixFile);
  const fileBuffer = fs.readFileSync(vsixPath);
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();

  const checksumContent = `${hash}  ${vsixFile}\n`;
  const outputPath = path.join(rootDir, 'SHA256SUMS.txt');
  fs.writeFileSync(outputPath, checksumContent, 'utf8');

  console.log(`[checksum] Generated SHA256SUMS.txt:`);
  console.log(`           ${hash}  ${vsixFile}`);
}

generateChecksum();
