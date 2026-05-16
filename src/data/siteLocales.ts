/** UI languages for homepage site-wide translation */
export const SITE_LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'es', label: 'Spanish' },
  { code: 'ru', label: 'Russian' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'bn', label: 'Bengali' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'ms', label: 'Malay' },
  { code: 'pl', label: 'Polish' },
  { code: 'id', label: 'Indonesian' },
  { code: 'ar', label: 'Arabic' },
  { code: 'bg', label: 'Bulgarian' },
  { code: 'tr', label: 'Turkish' },
  { code: 'sv', label: 'Swedish' },
  { code: 'ur', label: 'Urdu' },
] as const;

export type SiteLocaleCode = (typeof SITE_LOCALES)[number]['code'];
