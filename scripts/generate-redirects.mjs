/**
 * Writes public/_redirects and merges Vercel redirects for kept + removed paths.
 * Run: node scripts/generate-redirects.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(root, 'src/data/siteConfig.ts');
const outPath = path.join(root, 'public/_redirects');
const vercelPath = path.join(root, 'vercel.json');

const src = fs.readFileSync(configPath, 'utf8');
const keptPaths = [...src.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1]);
const removedMatch = src.match(/export const REMOVED_PATHS[^=]*=\s*\[([\s\S]*?)\];/);
const removedPaths = removedMatch
  ? [...removedMatch[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
  : [];

const lines = [
  '# Auto-generated — node scripts/generate-redirects.mjs',
  '# Trailing slash canonical URLs + retired pages → homepage',
  '',
];

for (const p of keptPaths) {
  if (p === '/') continue;
  const bare = p.replace(/\/$/, '');
  if (bare) lines.push(`${bare}  ${p}  301`);
}

for (const p of removedPaths) {
  const bare = p.replace(/\/$/, '');
  lines.push(`${bare}  /  301`);
  lines.push(`${p}  /  301`);
}

lines.push('', '# Legacy PHP', '/index.php  /  301', '/index.php/  /  301', '');

fs.writeFileSync(outPath, lines.join('\n'));

const vercel = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
const redirectMap = new Map();

redirectMap.set('/index.php', { source: '/index.php', destination: '/', permanent: true });

for (const p of keptPaths) {
  if (p === '/') continue;
  const bare = p.replace(/\/$/, '');
  if (bare) redirectMap.set(bare, { source: bare, destination: p, permanent: true });
}

for (const p of removedPaths) {
  const bare = p.replace(/\/$/, '');
  redirectMap.set(bare, { source: bare, destination: '/', permanent: true });
  redirectMap.set(p, { source: p, destination: '/', permanent: true });
}

vercel.redirects = [...redirectMap.values()];
fs.writeFileSync(vercelPath, JSON.stringify(vercel, null, 2) + '\n');

console.log(
  'Wrote',
  outPath,
  '—',
  keptPaths.length,
  'kept paths,',
  removedPaths.length,
  'removed → /'
);
