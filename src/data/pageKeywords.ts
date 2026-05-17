import { BLOG_POSTS } from './siteConfig';

const DEFAULT_KEYWORDS =
  'old english translator, english to old english, archaic english, free translation, AI translator';

const PATH_KEYWORDS: Record<string, string> = {
  '/': 'old english translator, shakespeare translator, middle english, anglo saxon, free AI translation',
  '/blog/': 'old english blog, english language history, anglo saxon grammar, translation guides',
  '/about-us/': 'about translator old english, old english tool, free historical translator',
  '/sitemap/': 'sitemap translator old english',
  '/privacy-policy/': 'privacy policy translator old english',
  '/terms-and-conditions/': 'terms translator old english',
  '/cookies/': 'cookies policy translator old english',
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
