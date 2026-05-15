export type DialectId = 'british' | 'southern' | 'scottish' | 'australian' | 'irish';

const BRITISH: [RegExp, string][] = [
  [/\bcolor\b/gi, 'colour'],
  [/\bcolors\b/gi, 'colours'],
  [/\bfavorite\b/gi, 'favourite'],
  [/\borganize\b/gi, 'organise'],
  [/\borganizing\b/gi, 'organising'],
  [/\bapartment\b/gi, 'flat'],
  [/\belevator\b/gi, 'lift'],
  [/\btrash\b/gi, 'rubbish'],
  [/\bgas\b/gi, 'petrol'],
  [/\bcookie\b/gi, 'biscuit'],
  [/\bcookies\b/gi, 'biscuits'],
  [/\bhello\b/gi, 'hello'],
  [/\bthanks\b/gi, 'cheers'],
  [/\bthank you\b/gi, 'thank you'],
  [/\bgoodbye\b/gi, 'cheerio'],
  [/\bmom\b/gi, 'mum'],
  [/\bmommy\b/gi, 'mummy'],
  [/\bneighbor\b/gi, 'neighbour'],
  [/\bcenter\b/gi, 'centre'],
  [/\btheater\b/gi, 'theatre'],
];

const SOUTHERN: [RegExp, string][] = [
  [/\byou all\b/gi, "y'all"],
  [/\byou\b/gi, 'ya'],
  [/\bare\b/gi, "ain't"],
  [/\bisn't\b/gi, "ain't"],
  [/\bover there\b/gi, 'over yonder'],
  [/\bchild\b/gi, 'youngun'],
  [/\bchildren\b/gi, 'younguns'],
  [/\bhello\b/gi, 'howdy'],
  [/\bhi\b/gi, 'howdy'],
  [/\bgoing to\b/gi, 'fixin to'],
  [/\babout to\b/gi, 'fixin to'],
];

const SCOTTISH: [RegExp, string][] = [
  [/\bnot\b/gi, 'nae'],
  [/\bno\b/gi, 'nae'],
  [/\bdon't\b/gi, 'dinnae'],
  [/\bdo not\b/gi, 'dinnae'],
  [/\bchild\b/gi, 'wean'],
  [/\bchildren\b/gi, 'weans'],
  [/\bhello\b/gi, 'awright'],
  [/\bgoodbye\b/gi, 'cheerio the nou'],
  [/\bmy\b/gi, 'ma'],
  [/\byour\b/gi, 'yer'],
  [/\byou\b/gi, 'ye'],
  [/\bvery\b/gi, 'pure'],
  [/\blittle\b/gi, 'wee'],
];

const AUSTRALIAN: [RegExp, string][] = [
  [/\bafternoon\b/gi, 'arvo'],
  [/\bbarbecue\b/gi, 'barbie'],
  [/\bbreakfast\b/gi, 'brekkie'],
  [/\bfriend\b/gi, 'mate'],
  [/\bfriends\b/gi, 'mates'],
  [/\bhello\b/gi, 'g\'day'],
  [/\bthanks\b/gi, 'ta'],
  [/\bthank you\b/gi, 'ta'],
  [/\bexcellent\b/gi, 'bonza'],
  [/\bsandwich\b/gi, 'sanga'],
];

const IRISH: [RegExp, string][] = [
  [/\bfun\b/gi, 'craic'],
  [/\bhello\b/gi, 'howya'],
  [/\bthanks\b/gi, 'fair play'],
  [/\bthank you\b/gi, 'thanks a million'],
  [/\bgoodbye\b/gi, 'slán'],
  [/\bchild\b/gi, 'gossoon'],
  [/\byes\b/gi, 'aye'],
];

const DIALECTS: Record<DialectId, [RegExp, string][]> = {
  british: BRITISH,
  southern: SOUTHERN,
  scottish: SCOTTISH,
  australian: AUSTRALIAN,
  irish: IRISH,
};

function applyRules(text: string, rules: [RegExp, string][]): string {
  let out = text;
  for (const [re, rep] of rules) out = out.replace(re, rep);
  return out;
}

export function toDialect(text: string, dialect: DialectId = 'british'): string {
  return applyRules(text, DIALECTS[dialect] ?? BRITISH);
}
