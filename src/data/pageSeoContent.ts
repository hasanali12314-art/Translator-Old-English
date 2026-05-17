export interface Section {
  title: string;
  paragraphs: string[];
}

export type PageSeoKey = 'about-us' | 'sitemap';

export const PAGE_SEO_CONTENT: Record<PageSeoKey, { heading: string; sections: Section[] }> = {
  'about-us': {
    heading: 'More about our project',
    sections: [
      {
        title: 'Built for learners and creators',
        paragraphs: [
          'Translator Old English exists to lower the barrier between modern English and historical or specialised forms. We combine linguistics-informed prompts with a simple interface anyone can use in seconds.',
          'The platform grows through user feedback. If you spot an error or want a new feature, email us from the contact section on this page.',
        ],
      },
    ],
  },
  sitemap: {
    heading: 'Using this sitemap',
    sections: [
      {
        title: 'Pages on this site',
        paragraphs: [
          'The homepage is the free Old English translator. The blog publishes guides on grammar, history, and writing. Legal pages cover privacy, terms, and cookies.',
          'Search engines should use the XML sitemap at /sitemap.xml for automated crawling.',
        ],
      },
    ],
  },
};
