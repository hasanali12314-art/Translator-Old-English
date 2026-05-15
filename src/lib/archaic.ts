export type ArchaicStyle = 'early' | 'middle' | 'ancient' | 'simple';

const PRONOUN_RULES: [RegExp, string][] = [
  [/\byou\b/gi, 'thee'],
  [/\byour\b/gi, 'thy'],
  [/\byours\b/gi, 'thine'],
  [/\bare\b/gi, 'art'],
  [/\bdo\b/gi, 'dost'],
  [/\bdoes\b/gi, 'doth'],
  [/\bhave\b/gi, 'hast'],
  [/\bhas\b/gi, 'hath'],
  [/\bwill\b/gi, 'shalt'],
  [/\bshall\b/gi, 'shalt'],
  [/\bwas\b/gi, 'wast'],
  [/\bwere\b/gi, 'wert'],
  [/\bmy\b/gi, 'mine'],
  [/\bme\b/gi, 'me'],
];

const MIDDLE_EXTRA: [RegExp, string][] = [
  [/\bthe\b/gi, 'ye'],
  [/\bof\b/gi, 'o'],
  [/\bto\b/gi, 'unto'],
  [/\bfrom\b/gi, 'fro'],
  [/\bwith\b/gi, 'withal'],
  [/\bthat\b/gi, 'that'],
  [/\bthis\b/gi, 'this'],
  [/\bking\b/gi, 'cyning'],
  [/\bman\b/gi, 'man'],
  [/\bwoman\b/gi, 'wif'],
  [/\bwarrior\b/gi, 'cempa'],
  [/\bsea\b/gi, 'sæ'],
  [/\bstorm\b/gi, 'storm'],
  [/\bbrave\b/gi, 'beald'],
  [/\bstrong\b/gi, 'strang'],
];

const ANCIENT_EXTRA: [RegExp, string][] = [
  [/\bhello\b/gi, 'Wes þū hāl'],
  [/\bgoodbye\b/gi, 'Fare þū wel'],
  [/\bthank you\b/gi, 'Ic þancie þē'],
  [/\bplease\b/gi, 'Ic bidde'],
  [/\bking\b/gi, 'cyning'],
  [/\bglory\b/gi, 'þrym'],
  [/\bheard\b/gi, 'gefrunon'],
  [/\blisten\b/gi, 'Hwæt'],
];

function applyRules(text: string, rules: [RegExp, string][]): string {
  let out = text;
  for (const [re, rep] of rules) out = out.replace(re, rep);
  return out;
}

export function toArchaic(
  text: string,
  style: ArchaicStyle = 'early',
  opts?: { pronouns?: boolean; verbs?: boolean; vocab?: boolean },
): string {
  const pronouns = opts?.pronouns !== false;
  const verbs = opts?.verbs !== false;
  const vocab = opts?.vocab !== false;

  let out = text;
  if (pronouns || verbs) out = applyRules(out, PRONOUN_RULES);
  if (vocab && (style === 'middle' || style === 'ancient')) {
    out = applyRules(out, MIDDLE_EXTRA);
  }
  if (vocab && style === 'ancient') {
    out = applyRules(out, ANCIENT_EXTRA);
  }
  if (style === 'simple') {
    out = applyRules(out, PRONOUN_RULES.slice(0, 6));
  }
  return out;
}
