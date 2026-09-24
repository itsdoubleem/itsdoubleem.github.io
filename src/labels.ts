/* The words the site uses for platform and language codes, in one place.
 *
 * Platforms have two forms on purpose. The card packs everything into one line, so it
 * says "Web"; the app page has room to say what that means to someone deciding whether
 * they can use it — "Any web browser". A new platform needs both. */
export const platformShort: Record<string, string> = {
  android: 'Android', ios: 'iPhone', web: 'Web', macos: 'macOS', windows: 'Windows',
};
export const platformLong: Record<string, string> = {
  android: 'Android', ios: 'iPhone', web: 'Any web browser', macos: 'macOS', windows: 'Windows',
};

// Each language in its own name, because the reader looking for it reads that one.
export const languageNames: Record<string, string> = {
  ko: '한국어', en: 'English', vi: 'Tiếng Việt', zh: '中文',
  th: 'ไทย', id: 'Bahasa Indonesia', ne: 'नेपाली', km: 'ភាសាខ្មែរ',
};
