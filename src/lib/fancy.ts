const STYLES: Record<string, { u: number; l: number }> = {
  script: { u: 0x1d49c, l: 0x1d4b6 },
  bold: { u: 0x1d400, l: 0x1d41a },
  italic: { u: 0x1d434, l: 0x1d44e },
  fraktur: { u: 0x1d504, l: 0x1d51e },
  double: { u: 0x1d538, l: 0x1d552 },
  mono: { u: 0x1d670, l: 0x1d68a },
};

export type FancyStyle = keyof typeof STYLES;

export function toFancy(text: string, style: FancyStyle = 'script'): string {
  const s = STYLES[style] ?? STYLES.script;
  return [...text].map((ch) => {
    const c = ch.codePointAt(0)!;
    if (c >= 0x41 && c <= 0x5a) return String.fromCodePoint(s.u + (c - 0x41));
    if (c >= 0x61 && c <= 0x7a) return String.fromCodePoint(s.l + (c - 0x61));
    if (c >= 0x30 && c <= 0x39 && style === 'double') {
      return String.fromCodePoint(0x1d7d8 + (c - 0x30));
    }
    return ch;
  }).join('');
}
