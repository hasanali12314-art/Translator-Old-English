import { toArchaic, type ArchaicStyle } from './archaic';
import { toDialect, type DialectId } from './dialect';
import { toFancy, type FancyStyle } from './fancy';
import { resolveLangCode } from './languages';
import { translateNavajo } from './navajo';

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const MAX_CHUNK = 450;

export type TranslateMode = 'translate' | 'archaic' | 'fancy' | 'dialect';

export interface TranslateOptions {
  sourceLang?: string;
  targetLang?: string;
  mode?: TranslateMode;
  style?: string;
  dialect?: DialectId;
  fancyStyle?: FancyStyle;
  usePronouns?: boolean;
  useVerbs?: boolean;
  useVocab?: boolean;
}

function splitChunks(text: string): string[] {
  if (text.length <= MAX_CHUNK) return [text];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > MAX_CHUNK) {
    let cut = rest.lastIndexOf('. ', MAX_CHUNK);
    if (cut < MAX_CHUNK / 2) cut = rest.lastIndexOf(' ', MAX_CHUNK);
    if (cut < 1) cut = MAX_CHUNK;
    chunks.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

async function fetchMyMemory(
  text: string,
  source: string,
  target: string,
): Promise<string> {
  const src = source === 'auto' ? 'en' : source;
  const params = new URLSearchParams({
    q: text,
    langpair: `${src}|${target}`,
  });
  const res = await fetch(`${MYMEMORY_URL}?${params}`);
  if (!res.ok) throw new Error(`Translation service error (${res.status})`);
  const data = await res.json();
  const status = data.responseStatus;
  if (status !== 200 && status !== '200') {
    const detail = data.responseDetails || 'Translation failed';
    throw new Error(typeof detail === 'string' ? detail : 'Translation failed');
  }
  const translated = data.responseData?.translatedText;
  if (!translated) throw new Error('No translation returned for this language pair.');
  if (typeof translated === 'string' && translated.includes('INVALID TARGET LANGUAGE')) {
    throw new Error('This language is not supported by the translation service.');
  }
  return translated;
}

export async function translateViaApi(
  text: string,
  source: string,
  target: string,
): Promise<string> {
  const chunks = splitChunks(text);
  const parts: string[] = [];
  for (const chunk of chunks) {
    parts.push(await fetchMyMemory(chunk, source, target));
  }
  return parts.join(' ');
}

/** Languages MyMemory does not support — use local fallbacks */
const LOCAL_ONLY = new Set(['ang']);

export async function translateText(
  text: string,
  opts: TranslateOptions = {},
): Promise<string> {
  const mode = opts.mode ?? 'translate';
  const source = opts.sourceLang ?? 'en';
  let target = opts.targetLang ?? 'es';

  if (mode === 'fancy') {
    return toFancy(text, (opts.fancyStyle as FancyStyle) ?? 'script');
  }
  if (mode === 'dialect') {
    return toDialect(text, opts.dialect ?? 'british');
  }
  if (mode === 'archaic' || LOCAL_ONLY.has(target)) {
    return toArchaic(text, (opts.style as ArchaicStyle) ?? 'early', {
      pronouns: opts.usePronouns,
      verbs: opts.useVerbs,
      vocab: opts.useVocab,
    });
  }

  if (target === 'nv') {
    return translateNavajo(text);
  }

  return translateViaApi(text, source, target);
}

export function langFromLabel(label: string): string {
  return resolveLangCode(label);
}
