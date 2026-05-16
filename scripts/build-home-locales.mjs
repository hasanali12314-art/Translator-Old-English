/**
 * Generates public/locales/home.{code}.json from home.en.json via MyMemory API.
 * Run: node scripts/build-home-locales.mjs
 * Optional: node scripts/build-home-locales.mjs es hi  (only listed codes)
 * Optional: node scripts/build-home-locales.mjs --fix es  (re-translate keys still in English)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const enPath = path.join(root, 'public/locales/home.en.json');
const outDir = path.join(root, 'public/locales');

const ALL = ['hi', 'es', 'ru', 'fr', 'de', 'it', 'pt', 'bn', 'ja', 'ko', 'ms', 'pl', 'id', 'ar', 'bg', 'tr', 'sv', 'ur'];
const argv = process.argv.slice(2);
const fixOnly = argv.includes('--fix');
const targets = argv.filter((a) => !a.startsWith('--')).length
  ? argv.filter((a) => !a.startsWith('--'))
  : ALL;

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const keys = Object.keys(en);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateOnce(text, target) {
  const q = encodeURIComponent(text.slice(0, 480));
  const url = `https://api.mymemory.translated.net/get?q=${q}&langpair=en|${encodeURIComponent(target)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const out = data?.responseData?.translatedText;
  if (!out || out === '-' || String(out).toUpperCase().includes('MYMEMORY WARNING')) return null;
  return out;
}

async function translate(text, target, retries = 3) {
  if (!text || !String(text).trim()) return text;
  const chunks = splitChunks(String(text), 420);
  const parts = [];
  for (const chunk of chunks) {
    let result = null;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        result = await translateOnce(chunk, target);
        if (result && result.trim() && result.trim() !== chunk.trim()) break;
      } catch (e) {
        /* retry */
      }
      await sleep(600 + attempt * 400);
    }
    parts.push(result && result.trim() ? result : chunk);
    await sleep(380);
  }
  return parts.join(chunks.length > 1 ? ' ' : '');
}

function splitChunks(text, maxLen) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  let rest = text;
  while (rest.length > maxLen) {
    let cut = rest.lastIndexOf('. ', maxLen);
    if (cut < maxLen * 0.35) cut = rest.lastIndexOf(' ', maxLen);
    if (cut < 1) cut = maxLen;
    chunks.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

function needsTranslation(key, enVal, existing) {
  if (!existing || existing === enVal) return true;
  if (fixOnly && existing === enVal) return true;
  return false;
}

for (const code of targets) {
  const outPath = path.join(outDir, `home.${code}.json`);
  let out = {};
  if (fixOnly && fs.existsSync(outPath)) {
    try {
      out = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    } catch (e) {
      out = {};
    }
  }

  const todo = keys.filter((k) => !fixOnly || needsTranslation(k, en[k], out[k]));
  console.log(`Translating → ${code} (${todo.length}/${keys.length} strings)...`);

  for (let i = 0; i < todo.length; i++) {
    const k = todo[i];
    out[k] = await translate(en[k], code);
    if (i % 3 === 2) await sleep(200);
  }

  for (const k of keys) {
    if (out[k] == null) out[k] = en[k];
  }

  fs.writeFileSync(outPath, JSON.stringify(out));
  const untranslated = keys.filter((k) => out[k] === en[k]).length;
  console.log(`  wrote home.${code}.json (${untranslated} keys still match English)`);
}
console.log('Done.');
