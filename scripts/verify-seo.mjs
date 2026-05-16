/**
 * Fails the build if any HTML in dist/ has broken SEO (localhost canonical, missing OG/Twitter).
 * Run automatically after: npm run build
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const errors = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (name === 'index.html') check(p, fs.readFileSync(p, 'utf8'));
  }
}

function isRedirectStub(html) {
  return (
    html.includes('http-equiv="refresh"') ||
    (html.includes('Redirecting to:') && !html.includes('property="og:title"'))
  );
}

function check(file, html) {
  const rel = path.relative(dist, file);
  if (isRedirectStub(html)) return;
  if (/localhost/i.test(html)) {
    errors.push(`${rel}: contains "localhost" (fix canonical / redeploy from CI)`);
  }
  if (!html.includes('property="og:title"')) {
    errors.push(`${rel}: missing og:title`);
  }
  if (!html.includes('name="twitter:card"')) {
    errors.push(`${rel}: missing twitter:card`);
  }
  if (!html.includes('name="robots"')) {
    errors.push(`${rel}: missing robots meta`);
  }
  const canon = html.match(/rel="canonical"\s+href="([^"]+)"/);
  if (canon && !canon[1].startsWith('https://translatoroldenglish.com')) {
    errors.push(`${rel}: canonical must use https://translatoroldenglish.com (got ${canon[1]})`);
  }
}

if (!fs.existsSync(dist)) {
  console.error('verify-seo: dist/ not found — run npm run build first');
  process.exit(1);
}

walk(dist);

if (errors.length) {
  console.error('SEO verification failed:\n' + errors.slice(0, 20).join('\n'));
  if (errors.length > 20) console.error(`... and ${errors.length - 20} more`);
  process.exit(1);
}

console.log('SEO verification passed for all index.html files in dist/');
