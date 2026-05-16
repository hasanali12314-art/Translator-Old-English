/**
 * Writes security headers to public/_headers, vercel.json, netlify.toml, public/.htaccess
 * Run: node scripts/sync-security-headers.mjs (also runs on npm run build)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONTENT_SECURITY_POLICY, SECURITY_HEADERS } from '../config/security-headers.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function writeNetlifyHeaders() {
  const lines = ['# Auto-generated — node scripts/sync-security-headers.mjs', '/*'];
  for (const { key, value } of SECURITY_HEADERS) {
    lines.push(`  ${key}: ${value}`);
  }
  fs.writeFileSync(path.join(root, 'public/_headers'), lines.join('\n') + '\n');
}

function writeVercelJson() {
  const vercelPath = path.join(root, 'vercel.json');
  const vercel = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
  const headerList = SECURITY_HEADERS.map(({ key, value }) => ({ key, value }));
  vercel.headers = [{ source: '/(.*)', headers: headerList }];
  fs.writeFileSync(vercelPath, JSON.stringify(vercel, null, 2) + '\n');
}

function writeNetlifyToml() {
  const tomlPath = path.join(root, 'netlify.toml');
  let toml = fs.readFileSync(tomlPath, 'utf8');
  const blockStart = '[[headers]]\n  for = "/*"\n';
  const headerLines = SECURITY_HEADERS.map(
    ({ key, value }) => `    ${key} = "${value.replace(/"/g, '\\"')}"`
  ).join('\n');
  const newBlock = `[[headers]]\n  for = "/*"\n${headerLines}\n`;

  if (toml.includes('[[headers]]')) {
    toml = toml.replace(/\[\[headers\]\][\s\S]*?(?=\n\[|\n#|\n$|$)/m, newBlock.trim() + '\n\n');
  } else {
    toml = toml.trim() + '\n\n' + newBlock;
  }
  fs.writeFileSync(tomlPath, toml);
}

function writeHtaccess() {
  const htPath = path.join(root, 'public/.htaccess');
  let ht = fs.readFileSync(htPath, 'utf8');
  const marker = '# Security headers (auto-generated)';
  const headerBlock = [
    marker,
    '<IfModule mod_headers.c>',
    ...SECURITY_HEADERS.map(
      ({ key, value }) => `  Header always set ${key} "${value.replace(/"/g, '\\"')}"`
    ),
    '</IfModule>',
    '',
  ].join('\n');

  if (ht.includes(marker)) {
    ht = ht.replace(
      /# Security headers \(auto-generated\)[\s\S]*?<\/IfModule>\n\n?/,
      headerBlock
    );
  } else {
    ht = headerBlock + ht;
  }
  fs.writeFileSync(htPath, ht);
}

writeNetlifyHeaders();
writeVercelJson();
writeNetlifyToml();
writeHtaccess();
console.log('Synced security headers (CSP + HSTS + …) to _headers, vercel.json, netlify.toml, .htaccess');
