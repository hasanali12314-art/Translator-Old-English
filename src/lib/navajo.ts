const PHRASES: Record<string, string> = {
  hello: "Yá'át'ééh",
  'hello world': "Yá'át'ééh nahasdzáán",
  'thank you': 'Ahéheeʼ',
  'good morning': "Yá'át'ééh abíní",
  'good night': "Yá'át'ééh hiiłchiʼįʼ",
  goodbye: 'Hágoóneeʼ',
  yes: 'Aooʼ',
  no: 'Doo',
  water: 'Tó',
  food: 'Chʼiyáán',
  family: 'Kʼé',
  friend: 'Shikʼis',
  love: 'Ayóó áníínííshní',
  help: 'Níłá',
  'how are you': 'Ąąʼ haʼíí baa naniná?',
};

export function translateNavajo(text: string): string {
  const key = text.trim().toLowerCase();
  if (PHRASES[key]) return PHRASES[key];
  const words = text.split(/\s+/);
  const translated = words.map((w) => PHRASES[w.toLowerCase()] ?? w);
  if (translated.some((w, i) => w !== words[i])) {
    return translated.join(' ');
  }
  throw new Error(
    'Full Navajo translation requires a paid API. Known phrases: hello, thank you, goodbye, yes, no, water, family, friend, love, help.',
  );
}
