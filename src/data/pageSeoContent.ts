export interface Section {
  title: string;
  paragraphs: string[];
}

export type PageSeoKey =
  | 'language-translators'
  | 'ancient-languages'
  | 'specialty-translators'
  | 'tools-resources'
  | 'translation-tools'
  | 'dialect-translator'
  | 'fancy-translator'
  | 'speak-translate'
  | 'sinhala-translator'
  | 'rare-languages'
  | 'navajo-translator'
  | 'about-us'
  | 'contact-us'
  | 'sitemap';

export const PAGE_SEO_CONTENT: Record<PageSeoKey, { heading: string; sections: Section[] }> = {
  'language-translators': {
    heading: 'Free language translation online',
    sections: [
      {
        title: 'Why use dedicated language pages',
        paragraphs: [
          'Each language has its own page with examples, direction controls, and notes on script or dialect. That keeps Chinese, Arabic, Spanish, and other pairs fast to find without scrolling through one giant list.',
          'You can translate English to the target language or reverse direction with the flip control. Results are generated instantly in the browser using our AI translation service.',
        ],
      },
      {
        title: 'Popular pairs and scripts',
        paragraphs: [
          'Chinese supports simplified and traditional output. Arabic and Hebrew use right-to-left layout in the tool. European languages include French, German, Greek, and Spanish with accurate everyday phrasing.',
          'For historical English styles, return to the homepage for Early Modern, Middle, Anglo-Saxon, and simplified archaic modes.',
        ],
      },
      {
        title: 'Tips for accurate results',
        paragraphs: [
          'Use complete sentences rather than single words when context matters. For formal documents, review names, numbers, and idioms manually before publishing.',
          'If your language is not listed here, open the all-languages translator from the main navigation — it supports more than one hundred targets in one interface.',
        ],
      },
    ],
  },
  'ancient-languages': {
    heading: 'Ancient language tools',
    sections: [
      {
        title: 'Latin, Greek, Old English, and more',
        paragraphs: [
          'Ancient language pages focus on classical and historical forms rather than modern chat-style translation. Latin covers classical and ecclesiastical usage. Ancient Greek supports Koine and classical registers.',
          'Old English and Old Norse tools suit literature, gaming, and academic work. Aramaic and Egyptian Arabic pages address specialised religious and regional study needs.',
        ],
      },
      {
        title: 'How to get the best results',
        paragraphs: [
          'Use complete sentences where possible. For names or short phrases, add context in the input so the model can choose an appropriate register.',
          'Always verify sensitive religious, legal, or academic text with a qualified scholar. These tools are aids for learning and creativity, not certified translations.',
        ],
      },
    ],
  },
  'specialty-translators': {
    heading: 'Specialty translation tools',
    sections: [
      {
        title: 'Beyond standard language pairs',
        paragraphs: [
          'Specialty tools cover dialect conversion, voice-friendly input, decorative Unicode text, rare and endangered languages, and Navajo (Diné Bizaad). Each page is tuned for its use case rather than generic bilingual chat.',
          'Writers use dialect and fancy text tools for dialogue and social posts. Researchers and community projects use rare-language and Navajo pages for outreach and preservation work.',
        ],
      },
      {
        title: 'Privacy and free access',
        paragraphs: [
          'No account is required. Translation history stays in your browser when enabled. All specialty tools share the same free, instant experience as our main Old English translator.',
        ],
      },
    ],
  },
  'tools-resources': {
    heading: 'Translation tools and guides',
    sections: [
      {
        title: 'What you will find here',
        paragraphs: [
          'This hub links to every translator on the site plus the blog, where we publish guides on Old English grammar, Shakespearean language, and the history of English.',
          'Use it when you need a quick overview of available tools before diving into a specific language or ancient script.',
        ],
      },
      {
        title: 'Staying up to date',
        paragraphs: [
          'New articles and tools are added as we expand coverage. Bookmark this page or subscribe to the RSS feed linked in the site footer for updates.',
        ],
      },
    ],
  },
  'translation-tools': {
    heading: 'All translation tools',
    sections: [
      {
        title: 'One directory for every tool',
        paragraphs: [
          'From the flagship Old English translator to all-languages mode, Latin, dialect conversion, and rare languages — every free tool is listed here with a short description and direct link.',
          'Tools are designed for desktop and mobile browsers. Paste or type up to 5,000 characters per request on supported pages.',
        ],
      },
      {
        title: 'Choosing the right tool',
        paragraphs: [
          'Use Old English styles for historical fiction and theatre. Use language-specific pages for modern pairs like English–Spanish or English–Chinese. Use specialty tools for dialect, voice, or decorative text.',
        ],
      },
    ],
  },
  'dialect-translator': {
    heading: 'Regional dialect conversion',
    sections: [
      {
        title: 'When to use dialect conversion',
        paragraphs: [
          'Dialect conversion helps authors, screenwriters, and marketers render regional flavour without inventing inconsistent spelling. Select a target dialect and paste standard English source text.',
          'Output is illustrative. Always read aloud and adjust for your character, era, and audience. Combine with the speak translator if you are drafting dialogue from voice notes.',
        ],
      },
    ],
  },
  'fancy-translator': {
    heading: 'Fancy and decorative text',
    sections: [
      {
        title: 'Unicode styles for social and design',
        paragraphs: [
          'The fancy text generator maps normal letters to Unicode mathematical and script characters for bios, titles, and short headlines. Pick a style from the dropdown and paste your source text.',
          'Because these are special characters, test display on the platform you target — some apps substitute fallback fonts. Keep messages short for best compatibility.',
        ],
      },
    ],
  },
  'speak-translate': {
    heading: 'Voice-friendly translation',
    sections: [
      {
        title: 'Speak or type your source text',
        paragraphs: [
          'Use the microphone control on supported browsers to dictate into the input box, then translate as usual. This is helpful for quick phrases while travelling or during conversation practice.',
          'Microphone access stays on your device until you revoke it in browser settings. Pair with language-specific pages when you need a fixed target language.',
        ],
      },
    ],
  },
  'sinhala-translator': {
    heading: 'English and Sinhala translation',
    sections: [
      {
        title: 'Sinhala script support',
        paragraphs: [
          'Sinhala uses its own script. The tool displays native characters in the output panel when translating from English, and accepts Sinhala input when reversing direction.',
          'Ideal for correspondence with Sri Lankan contacts, study, and localised content. For other South Asian languages, browse the all-languages translator.',
        ],
      },
    ],
  },
  'rare-languages': {
    heading: 'Rare and minority languages',
    sections: [
      {
        title: 'Supporting less common languages',
        paragraphs: [
          'Rare-language mode targets minority and endangered languages that mainstream apps often omit. Select the closest available label and provide clear, simple source sentences.',
          'Community reviewers are essential for cultural accuracy. Treat output as a draft for human review, especially for public-facing or ceremonial text.',
        ],
      },
    ],
  },
  'navajo-translator': {
    heading: 'Navajo (Diné Bizaad)',
    sections: [
      {
        title: 'Respectful use of Diné Bizaad',
        paragraphs: [
          'Navajo is a living indigenous language with deep cultural significance. Use this tool for learning, draft communication, and appreciation — not to replace fluent speakers for official or ceremonial work.',
          'Short, clear English input produces clearer suggestions. Consult community language resources when preparing educational or public materials.',
        ],
      },
    ],
  },
  'about-us': {
    heading: 'More about our project',
    sections: [
      {
        title: 'Built for learners and creators',
        paragraphs: [
          'Translator Old English exists to lower the barrier between modern English and historical or specialised forms. We combine linguistics-informed prompts with a simple interface anyone can use in seconds.',
          'The platform grows through user feedback. If you spot an error or want a new language, reach out via the contact page.',
        ],
      },
    ],
  },
  'contact-us': {
    heading: 'Support and feedback',
    sections: [
      {
        title: 'What to include in your message',
        paragraphs: [
          'Tell us which page you used, the languages or style selected, and a short sample of input if something went wrong. Screenshots help us reproduce issues quickly.',
          'We welcome partnership and press enquiries. Allow up to two business days for a reply.',
        ],
      },
      {
        title: 'Common questions we can help with',
        paragraphs: [
          'Report incorrect translations, broken pages, or accessibility issues. Ask about educational use, licensing for commercial projects, and adding new languages to the roadmap.',
          'For privacy requests, email from the address tied to your enquiry and reference our privacy policy. We do not provide phone support for real-time translation coaching.',
        ],
      },
    ],
  },
  sitemap: {
    heading: 'Using this sitemap',
    sections: [
      {
        title: 'HTML and XML versions',
        paragraphs: [
          'This page lists every major section for visitors. Search engines should use the XML sitemap at /sitemap.xml for automated crawling.',
          'Internal links use trailing slashes consistently. If you cannot find a page, try the search box or return to the homepage translator.',
        ],
      },
      {
        title: 'Sections covered',
        paragraphs: [
          'Main pages include the Old English translator and the all-languages hub. Language translators cover widely spoken modern pairs. Ancient languages include Latin, Greek, Old English, Aramaic, and Egyptian Arabic.',
          'Specialty tools cover dialects, voice input, fancy Unicode text, Sinhala, rare languages, and Navajo. Legal pages document privacy, terms, cookies, and contact information.',
        ],
      },
    ],
  },
};
