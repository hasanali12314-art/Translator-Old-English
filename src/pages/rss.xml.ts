import type { APIRoute } from 'astro';
import { SITE_URL, SITE_NAME, BLOG_POSTS } from '../data/siteConfig';

export const GET: APIRoute = () => {
  const items = BLOG_POSTS.map(
    (p) => `    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${SITE_URL}/blog/${p.slug}/</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${p.slug}/</guid>
      <description><![CDATA[${p.desc}]]></description>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    </item>`
  ).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME} Blog</title>
    <link>${SITE_URL}/blog/</link>
    <description>Articles on Old English, Middle English, translation, and linguistics.</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
