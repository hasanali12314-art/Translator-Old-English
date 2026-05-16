/** Cross-links between blog posts (incoming internal links). */
export const BLOG_RELATED: Record<string, string[]> = {
  'what-is-old-english': [
    'middle-english-vs-old-english',
    'history-of-english-language',
    'old-english-grammar-basics',
    'old-english-vocabulary',
  ],
  'middle-english-vs-old-english': [
    'what-is-old-english',
    'shakespearean-language-guide',
    'history-of-english-language',
    'old-english-grammar-basics',
  ],
  'shakespearean-language-guide': [
    'what-is-old-english',
    'middle-english-vs-old-english',
    'old-english-vocabulary',
    'history-of-english-language',
  ],
  'old-english-in-fantasy-writing': [
    'beowulf-language-analysis',
    'old-english-vocabulary',
    'old-english-for-game-developers',
    'what-is-old-english',
  ],
  'history-of-english-language': [
    'what-is-old-english',
    'viking-old-norse-influence',
    'middle-english-vs-old-english',
    'old-english-grammar-basics',
  ],
  'old-english-vocabulary': [
    'what-is-old-english',
    'beowulf-language-analysis',
    'old-english-grammar-basics',
    'shakespearean-language-guide',
  ],
  'beowulf-language-analysis': [
    'what-is-old-english',
    'old-english-vocabulary',
    'old-english-in-fantasy-writing',
    'history-of-english-language',
  ],
  'old-english-grammar-basics': [
    'what-is-old-english',
    'middle-english-vs-old-english',
    'old-english-vocabulary',
    'history-of-english-language',
  ],
  'old-english-for-game-developers': [
    'old-english-in-fantasy-writing',
    'old-english-vocabulary',
    'beowulf-language-analysis',
    'viking-old-norse-influence',
  ],
  'viking-old-norse-influence': [
    'history-of-english-language',
    'what-is-old-english',
    'old-english-vocabulary',
    'beowulf-language-analysis',
  ],
};
