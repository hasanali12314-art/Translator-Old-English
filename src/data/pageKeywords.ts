import { BLOG_POSTS } from './siteConfig';

const DEFAULT_KEYWORDS =
  'old english translator, english to old english, archaic english, free translation, AI translator';

const PATH_KEYWORDS: Record<string, string> = {
  '/': 'old english translator, shakespeare translator, middle english, anglo saxon, free AI translation',
  '/all-languages/': 'all language translator, translate any language, free online translator, multilingual',
  '/language-translators/': 'language translator, english translation, free online languages',
  '/blog/': 'old english blog, english language history, anglo saxon grammar, translation guides',
  '/old-english/': 'anglo saxon translator, old norse, historical english translation',
  '/ancient-languages/': 'latin translator, ancient greek, aramaic, old english, ancient languages',
  '/specialty-translators/': 'dialect translator, fancy text, rare languages, navajo translator',
  '/translation-tools/': 'translation tools, free translator, language tools online',
  '/tools-resources/': 'translation resources, language guides, old english help',
};

export function getPageKeywords(pathname: string, title: string): string {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const blogMatch = path.match(/^\/blog\/([^/]+)\/$/);
  if (blogMatch) {
    const post = BLOG_POSTS.find((p) => p.slug === blogMatch[1]);
    if (post?.keywords) return post.keywords;
  }
  if (PATH_KEYWORDS[path]) return PATH_KEYWORDS[path];
  const short = title
    .replace(/\s*[—|–-]\s*.*$/, '')
    .toLowerCase()
    .replace(/translator old english/gi, '')
    .trim();
  return short ? `${short}, ${DEFAULT_KEYWORDS}` : DEFAULT_KEYWORDS;
}
