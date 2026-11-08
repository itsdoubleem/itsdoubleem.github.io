/* Outside links on the built site, and what a check of each one means. Decided here, without
 * the network, so the rules can be tested; tools/check-links.mjs does the fetching.
 *
 * Only a definite answer counts as broken: 404 or 410, or a host that no longer exists. Many
 * sites refuse robots (UC Davis answered 403 for a page that was there), rate-limit them, or
 * time out now and then, so every other failure is "could not check": listed, never alarmed on. */

const OWN = new Set(['itsdoubleem.github.io']);
/** Addresses the checker must never be sent to: this machine and private networks. */
const PRIVATE = /^(localhost|.*\.local|.*\.internal|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|0\.0\.0\.0|\[.*\])$/i;
const MAX_URL = 2000;

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#38;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/** [{ url, pages }] for every http(s) link in <a href> on these pages, own site left out.
 *  pages is [[path, html]]; path is the page's address on the site, like /apps/logger/. */
export function externalLinks(pages) {
  const by = new Map();
  for (const [path, html] of pages) {
    for (const m of html.matchAll(/<a\b[^>]*?\shref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
      const raw = decode((m[1] ?? m[2]).trim());
      let url;
      try { url = new URL(raw); } catch { continue; }
      if (!/^https?:$/.test(url.protocol) || OWN.has(url.hostname) || PRIVATE.test(url.hostname)) continue;
      url.hash = '';
      const key = url.href;
      if (key.length > MAX_URL) continue;
      by.set(key, new Set([...(by.get(key) ?? []), path]));
    }
  }
  return [...by].map(([url, ps]) => ({ url, pages: [...ps].sort() })).sort((a, b) => a.url.localeCompare(b.url));
}

/** The page address for a file in dist/: dist/apps/logger/index.html → /apps/logger/. */
export function pagePath(rel) {
  return `/${rel.replace(/\\/g, '/').replace(/(^|\/)index\.html$/, '$1')}`;
}

/** 'ok' | 'broken' | 'unsure' for one answer: { status } after redirects, or { error: code }. */
export function verdict({ status, error }) {
  if (error) return ['ENOTFOUND', 'ERR_INVALID_URL'].includes(error) ? 'broken' : 'unsure';
  if (status >= 200 && status < 400) return 'ok';
  if (status === 404 || status === 410) return 'broken';
  return 'unsure';
}

/** The list handed from the job that builds to the job that checks, read back defensively:
 *  the building job ran npm, so its output is treated as data from a stranger. */
export function readList(text) {
  const list = JSON.parse(text);
  if (!Array.isArray(list)) throw new Error('not a list');
  return list.flatMap((x) => {
    let url;
    try { url = new URL(x?.url); } catch { return []; }
    if (!/^https?:$/.test(url.protocol) || url.href.length > MAX_URL || OWN.has(url.hostname) || PRIVATE.test(url.hostname)) return [];
    const pages = (Array.isArray(x.pages) ? x.pages : []).filter((p) => typeof p === 'string' && /^\/[\w./-]*$/.test(p)).slice(0, 20);
    return [{ url: url.href, pages }];
  });
}

/** Markdown with nothing in it a link or page can break out of. */
const code = (s) => `\`${s.replace(/`/g, '%60')}\``;

/** The Issue: broken links with where they are, then the ones that could not be checked. */
export function issueText(broken, unsure) {
  const line = (r) => `- ${code(r.url)} (${r.why}) on ${r.pages.map(code).join(', ') || 'a page'}`;
  const title = broken.length === 1 ? 'An outside link is broken' : `${broken.length} outside links are broken`;
  const body = [
    'The weekly link check got a definite "not here" for these: a 404 or 410, or a host that no longer exists. Replace each with a working page that says the same thing, or take it out. A citation in the deck needs a source that still supports the claim.',
    '',
    ...broken.map(line),
    ...(unsure.length ? ['', `Could not check ${unsure.length} more. They may well be fine: many sites refuse robots.`, '', ...unsure.map(line)] : []),
    '',
    'This Issue closes itself when a check finds none broken.',
  ].join('\n');
  return { title, body };
}
