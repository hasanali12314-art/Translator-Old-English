/**
 * Writes public/_redirects with trailing-slash rules for all sitemap paths.
 * Run: node scripts/generate-redirects.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(root, 'src/data/siteConfig.ts');
const outPath = path.join(root, 'public/_redirects');

const src = fs.readFileSync(configPath, 'utf8');
const paths = [...src.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1]).filter((p) => p !== '/');

const lines = [
  '# Auto-generated — node scripts/generate-redirects.mjs',
  '# Trailing slash canonical URLs',
  '',
];

for (const p of paths) {
  const bare = p.replace(/\/$/, '');
  if (bare) lines.push(`${bare}  ${p}  301`);
}

lines.push('', '# Legacy PHP', '/index.php  /  301', '/index.php/  /  301', '');

fs.writeFileSync(outPath, lines.join('\n'));
console.log('Wrote', outPath, 'with', paths.length, 'redirects');
