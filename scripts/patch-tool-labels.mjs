/**
 * One-off: add toolLabel and remove generic examplesTitle from tool pages.
 */
import fs from 'fs';
import path from 'path';

const map = {
  'chinese-translator': 'Chinese',
  'spanish-translator': 'Spanish',
  'arabic-translator': 'Arabic',
  'greek-translator': 'Greek',
  'german-translator': 'German',
  'french-translator': 'French',
  'latin-translator': 'Latin',
  'sinhala-translator': 'Sinhala',
  'creole-translator': 'Haitian Creole',
  'navajo-translator': 'Navajo',
  'ancient-greek': 'Ancient Greek',
  'old-english': 'Old English',
  'aramaic-translator': 'Aramaic',
  'egyptian-arabic': 'Egyptian Arabic',
  'dialect-translator': 'Dialect',
  'fancy-translator': 'Fancy text',
  'speak-translate': 'Speak',
  'rare-languages': 'Rare language',
};

const customExamples = {
  'dialect-translator': 'Dialect conversion examples',
  'fancy-translator': 'Fancy text style examples',
  'rare-languages': 'Rare language conversion examples',
  'speak-translate': 'Speak translation examples',
};

const root = path.join(import.meta.dirname, '..', 'src', 'pages');

for (const [slug, label] of Object.entries(map)) {
  const file = path.join(root, slug, 'index.astro');
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/\n\s*examplesTitle="[^"]*"/g, '');
  if (customExamples[slug]) {
    if (!html.includes('examplesTitle=')) {
      html = html.replace(
        /(titleHtml=\{titleHtml\}\n)/,
        `$1    examplesTitle="${customExamples[slug]}"\n`
      );
    }
  } else if (!html.includes('toolLabel=')) {
    html = html.replace(/(titleHtml=\{titleHtml\}\n)/, `$1    toolLabel="${label}"\n`);
  }
  fs.writeFileSync(file, html);
}

console.log('Patched tool labels on', Object.keys(map).length, 'pages');
