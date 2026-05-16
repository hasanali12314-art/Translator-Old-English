/**
 * Generates public/locales/home.{code}.json from home.en.json via MyMemory API.
 * Run: node scripts/build-home-locales.mjs
 * Optional: node scripts/build-home-locales.mjs hi es  (only listed codes)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const enPath = path.join(root, 'public/locales/home.en.json');
const outDir = path.join(root, 'public/locales');

const ALL = ['hi', 'es', 'ru', 'fr', 'de', 'it', 'pt', 'bn', 'ja', 'ko', 'ms', 'pl', 'id', 'ar', 'bg', 'tr', 'sv', 'ur'];
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ALL;

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const keys = Object.keys(en);

async function translate(text, target) {
  const q = encodeURIComponent(text.slice(0, 450));
  const url = `https://api.mymemory.translated.net/get?q=${q}&langpair=en|${target}`;
  const res = await fetch(url);
  const data = await res.json();
  const out = data?.responseData?.translatedText;
  if (!out || out === '-' || String(out).includes('MYMEMORY WARNING')) return text;
  return out;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

for (const code of targets) {
  const out = {};
  console.log(`Translating → ${code} (${keys.length} strings)...`);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    out[k] = await translate(en[k], code);
    if (i % 5 === 4) await sleep(350);
  }
  fs.writeFileSync(path.join(outDir, `home.${code}.json`), JSON.stringify(out, null, 0));
  console.log(`  wrote home.${code}.json`);
}
console.log('Done.');
