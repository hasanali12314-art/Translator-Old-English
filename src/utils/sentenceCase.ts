/** First word's Latin letter uppercase, rest lowercase. */
export function sentenceCase(text: string): string {
  const t = text.trim();
  if (!t) return t;
  const lower = t.toLowerCase();
  const i = lower.search(/[a-z0-9\u00C0-\u024F]/i);
  if (i < 0) return lower;
  if (/[0-9]/.test(lower.charAt(i))) return lower;
  return lower.slice(0, i) + lower.charAt(i).toUpperCase() + lower.slice(i + 1);
}
