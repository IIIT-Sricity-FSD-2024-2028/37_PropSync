const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  if (!fs.existsSync(filePath) && !fs.existsSync(filePath + '.ts')) {
    console.log('MISSING:', filePath);
  } else {
    // Check actual case on disk vs imported case
    const dir = path.dirname(filePath);
    const base = path.basename(filePath);
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      if (!files.includes(base) && !files.includes(base + '.ts')) {
         console.log('CASE MISMATCH:', filePath, 'in', dir);
      }
    }
  }
}

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const regex = /from\s+['\"](\.[^'\"]+)['\"]/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const importPath = path.resolve(dir, match[1]);
        checkFile(importPath);
      }
    }
  }
}

scanDir('./src');
console.log('DONE');
