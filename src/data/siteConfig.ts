/** Site-wide SEO, contact, and social settings — update URLs when profiles are live */
export const SITE_URL = 'https://translatoroldenglish.com';
export const SITE_NAME = 'Translator Old English';
/** 1200×630 recommended; must be absolute URL when shared */
export const DEFAULT_OG_IMAGE = '/og-image.png';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const SITE_EMAIL = 'support@translatoroldenglish.com';
/** Update with your real support line if available */
export const SITE_PHONE = '+1 (888) 610-1847';
export const SITE_PHONE_TEL = '+18886101847';
export const LEGAL_ENTITY =
  'Translator Old English is operated by Old English Language Tools LLC, a United States–based company focused on free historical and modern language translation software.';

export const SOCIAL_LINKS = {
  twitter: 'https://x.com/TranslatorOldEng',
  facebook: 'https://www.facebook.com/translatoroldenglish',
  linkedin: 'https://www.linkedin.com/company/translator-old-english',
  youtube: 'https://www.youtube.com/@translatoroldenglish',
  instagram: 'https://www.instagram.com/translatoroldenglish',
  pinterest: 'https://www.pinterest.com/translatoroldenglish',
  tiktok: 'https://www.tiktok.com/@translatoroldenglish',
} as const;

export const DMCA_URL = 'https://www.dmca.com/Protection/Status.aspx?r=translatoroldenglish.com';

/** All public indexable paths (trailing slash) */
export const SITEMAP_PATHS: { path: string; priority: string; changefreq?: string }[] = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/all-languages/', priority: '0.9', changefreq: 'monthly' },
  { path: '/language-translators/', priority: '0.8', changefreq: 'monthly' },
  { path: '/chinese-translator/', priority: '0.8', changefreq: 'monthly' },
  { path: '/spanish-translator/', priority: '0.8', changefreq: 'monthly' },
  { path: '/arabic-translator/', priority: '0.8', changefreq: 'monthly' },
  { path: '/german-translator/', priority: '0.8', changefreq: 'monthly' },
  { path: '/french-translator/', priority: '0.8', changefreq: 'monthly' },
  { path: '/greek-translator/', priority: '0.8', changefreq: 'monthly' },
  { path: '/creole-translator/', priority: '0.8', changefreq: 'monthly' },
  { path: '/ancient-languages/', priority: '0.8', changefreq: 'monthly' },
  { path: '/latin-translator/', priority: '0.8', changefreq: 'monthly' },
  { path: '/old-english/', priority: '0.8', changefreq: 'monthly' },
  { path: '/ancient-greek/', priority: '0.8', changefreq: 'monthly' },
  { path: '/aramaic-translator/', priority: '0.8', changefreq: 'monthly' },
  { path: '/egyptian-arabic/', priority: '0.8', changefreq: 'monthly' },
  { path: '/specialty-translators/', priority: '0.8', changefreq: 'monthly' },
  { path: '/tools-resources/', priority: '0.8', changefreq: 'monthly' },
  { path: '/translation-tools/', priority: '0.8', changefreq: 'monthly' },
  { path: '/dialect-translator/', priority: '0.7', changefreq: 'monthly' },
  { path: '/fancy-translator/', priority: '0.7', changefreq: 'monthly' },
  { path: '/speak-translate/', priority: '0.7', changefreq: 'monthly' },
  { path: '/sinhala-translator/', priority: '0.7', changefreq: 'monthly' },
  { path: '/rare-languages/', priority: '0.7', changefreq: 'monthly' },
  { path: '/navajo-translator/', priority: '0.7', changefreq: 'monthly' },
  { path: '/translator-old-english/', priority: '0.8', changefreq: 'monthly' },
  { path: '/blog/', priority: '0.7', changefreq: 'weekly' },
  { path: '/blog/what-is-old-english/', priority: '0.6', changefreq: 'yearly' },
  { path: '/blog/middle-english-vs-old-english/', priority: '0.6', changefreq: 'yearly' },
  { path: '/blog/shakespearean-language-guide/', priority: '0.6', changefreq: 'yearly' },
  { path: '/blog/old-english-in-fantasy-writing/', priority: '0.6', changefreq: 'yearly' },
  { path: '/blog/history-of-english-language/', priority: '0.6', changefreq: 'yearly' },
  { path: '/blog/old-english-vocabulary/', priority: '0.6', changefreq: 'yearly' },
  { path: '/blog/beowulf-language-analysis/', priority: '0.6', changefreq: 'yearly' },
  { path: '/blog/old-english-grammar-basics/', priority: '0.6', changefreq: 'yearly' },
  { path: '/blog/old-english-for-game-developers/', priority: '0.6', changefreq: 'yearly' },
  { path: '/blog/viking-old-norse-influence/', priority: '0.6', changefreq: 'yearly' },
  { path: '/about-us/', priority: '0.5', changefreq: 'yearly' },
  { path: '/contact-us/', priority: '0.5', changefreq: 'yearly' },
  { path: '/search/', priority: '0.4', changefreq: 'monthly' },
  { path: '/sitemap/', priority: '0.4', changefreq: 'monthly' },
  { path: '/privacy-policy/', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms-and-conditions/', priority: '0.3', changefreq: 'yearly' },
  { path: '/cookies/', priority: '0.3', changefreq: 'yearly' },
];

export const NAV_ITEMS = [
  { name: 'Home', url: '/' },
  { name: 'All languages', url: '/all-languages/' },
  { name: 'Chinese translator', url: '/chinese-translator/' },
  { name: 'Spanish translator', url: '/spanish-translator/' },
  { name: 'Arabic translator', url: '/arabic-translator/' },
  { name: 'Language translators', url: '/language-translators/' },
  { name: 'Latin translator', url: '/latin-translator/' },
  { name: 'Old English', url: '/old-english/' },
  { name: 'Ancient Greek', url: '/ancient-greek/' },
  { name: 'Ancient languages', url: '/ancient-languages/' },
  { name: 'Dialect converter', url: '/dialect-translator/' },
  { name: 'Fancy text', url: '/fancy-translator/' },
  { name: 'Speak translator', url: '/speak-translate/' },
  { name: 'Blog', url: '/blog/' },
  { name: 'About us', url: '/about-us/' },
  { name: 'Contact us', url: '/contact-us/' },
];

/** Footer blog links (shown under Company, not a separate column). */
export const FOOTER_BLOG_SLUGS = [
  'what-is-old-english',
  'middle-english-vs-old-english',
  'shakespearean-language-guide',
] as const;

/** Footer tools column — three tools, then “See all tools”. */
export const FOOTER_TOOL_LINKS = [
  { href: '/dialect-translator/', label: 'Dialect converter' },
  { href: '/fancy-translator/', label: 'Fancy text' },
  { href: '/speak-translate/', label: 'Speak translator' },
] as const;

export type BlogPost = {
  slug: string;
  title: string;
  desc: string;
  date: string;
  keywords: string;
  footerLabel?: string;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'what-is-old-english',
    footerLabel: 'What is old english',
    title: 'What Is Old English? A Complete Guide to Anglo-Saxon Language',
    desc: 'Discover the origins, structure, and legacy of Old English.',
    date: '2024-05-12',
    keywords: 'what is old english, anglo saxon language, old english guide, beowulf language',
  },
  {
    slug: 'middle-english-vs-old-english',
    footerLabel: 'Middle english vs old english',
    title: 'Middle English vs Old English: Key Differences Explained',
    desc: 'A clear comparison of Old English and Middle English.',
    date: '2024-05-08',
    keywords: 'middle english vs old english, chaucer english, historical english grammar',
  },
  {
    slug: 'shakespearean-language-guide',
    footerLabel: 'The complete guide to shakespearean language',
    title: 'The Complete Guide to Shakespearean Language',
    desc: 'Learn Early Modern English as used by Shakespeare.',
    date: '2024-05-04',
    keywords: 'shakespearean language, early modern english, thee thou grammar, shakespeare translator',
  },
  {
    slug: 'old-english-in-fantasy-writing',
    title: 'How to Use Old English in Fantasy Writing',
    desc: 'A practical guide for fantasy authors.',
    date: '2024-04-29',
    keywords: 'old english fantasy writing, archaic dialogue, fantasy names old english',
  },
  {
    slug: 'history-of-english-language',
    title: 'The History of the English Language',
    desc: 'From Anglo-Saxon roots to today.',
    date: '2024-04-24',
    keywords: 'history of english language, anglo saxon to modern english, english evolution',
  },
  {
    slug: 'old-english-vocabulary',
    title: '50 Old English Words You Should Know',
    desc: 'Fascinating Old English words and kennings.',
    date: '2024-04-19',
    keywords: 'old english words, old english vocabulary, anglo saxon words, kennings',
  },
  {
    slug: 'beowulf-language-analysis',
    title: 'Beowulf: Language, Style, and Translation Challenges',
    desc: 'Analysis of Beowulf language and translation.',
    date: '2024-04-14',
    keywords: 'beowulf language, old english poetry, beowulf translation, anglo saxon literature',
  },
  {
    slug: 'old-english-grammar-basics',
    title: 'Old English Grammar Basics',
    desc: 'Introduction to Old English grammar.',
    date: '2024-04-09',
    keywords: 'old english grammar, anglo saxon grammar, old english cases, historical grammar',
  },
  {
    slug: 'old-english-for-game-developers',
    title: 'Old English for Game Developers',
    desc: 'Names, spells, and lore for games.',
    date: '2024-04-03',
    keywords: 'old english game development, fantasy names, rpg archaic text, game lore writing',
  },
  {
    slug: 'viking-old-norse-influence',
    title: 'How Old Norse Shaped the English Language',
    desc: 'Viking influence on English vocabulary.',
    date: '2024-03-28',
    keywords: 'old norse english, viking words in english, norse influence english language',
  },
];
