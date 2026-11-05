import fs from 'fs';
import path from 'path';

// Let's check model file sizes
const dir = '/Users/mohammad/.gemini/antigravity/scratch/portfolio/public/models';
const files = fs.readdirSync(dir);
console.log('Model files:');
files.forEach(f => {
  const stat = fs.statSync(path.join(dir, f));
  console.log(`  ${f}: ${(stat.size / 1024).toFixed(1)} KB`);
});
