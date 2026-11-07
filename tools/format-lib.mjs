/* The one format every app page shares, as code rather than as advice: apps/README.md asked
 * for these headings in this order, and nothing checked. Used by check-format.mjs on what is
 * in the repo and by listing-lib.mjs on what an app's repo sends. Needs nothing installed. */

/** The headings a page may use, in the order it must use them. */
export const SECTIONS = ['What it does', "Who it's for", 'What it is not', 'Your data', 'Getting it'];
/** Those a page may not omit. Getting it is the one that can be padding. */
export const REQUIRED = SECTIONS.slice(0, 4);
/** Kinds of work that install and run. A novel has no "Your data". */
const SOFTWARE = ['app', 'tool', 'bot'];

/* The rules in README.md, and "never coming soon" from apps/README.md. The word "free"
 * is not here on purpose: present tense is a fact, and LOGGER's is load-bearing. */
export const BLOCKED = [
  [/\b(?:stays?|remains?|will (?:always )?(?:be|stay|remain)|always be) free\b/i, 'promises it stays free (hard rule 2)'],
  [/\bfree,? (?:forever|always|for life)\b|\b(?:forever|always) free\b/i, 'promises it stays free (hard rule 2)'],
  [/\brevolutionary\b/i, '"revolutionary" (hard rule 5)'],
  [/\bseamless(?:ly)?\b/i, '"seamless" (hard rule 5)'],
  [/\bempower(?:s|ing)?\b/i, '"empowering" (hard rule 5)'],
  [/\bcoming soon\b/i, '"coming soon" — apps/README.md allows live or beta'],
  [/\btrusted by\b/i, '"trusted by" (hard rule 1)'],
];

export const splitPage = (md) => {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return m ? { front: m[1], body: m[2] } : { front: '', body: md };
};

/** A page's body as [[heading, text]], in order. Text before the first heading is ignored. */
export const sections = (body) =>
  [...body.matchAll(/^## (.+)\n([\s\S]*?)(?=^## |(?![\s\S]))/gm)].map((m) => [m[1].trim(), m[2].trim()]);

/** Line breaks collapsed first: these pages are hard-wrapped, so "stays" can end a line. */
export const blockedPhrases = (text) => {
  const flat = text.replace(/\s+/g, ' ');
  return BLOCKED.filter(([r]) => r.test(flat)).map(([, why]) => why);
};

/** What is wrong with the body of a page of this type. */
export function bodyProblems(body, type = 'app') {
  if (!SOFTWARE.includes(type)) return [];
  const out = [];
  const found = sections(body).map(([h]) => h);
  for (const h of found) if (!SECTIONS.includes(h)) out.push(`has a section ${/^[\w' -]+$/.test(h) ? `"${h}"` : 'it cannot read'} — the page format allows ${SECTIONS.join(', ')}`);
  for (const h of REQUIRED) if (!found.includes(h)) out.push(`has no "${h}" section`);
  const known = found.filter((h) => SECTIONS.includes(h));
  if (known.join() !== [...known].sort((a, b) => SECTIONS.indexOf(a) - SECTIONS.indexOf(b)).join()) {
    out.push(`has its sections out of order — they go ${SECTIONS.join(', ')}`);
  }
  if (new Set(found).size !== found.length) out.push('repeats a section');
  return out;
}

/** What is wrong with one apps/<slug>.md. */
export function pageProblems(md) {
  const { front, body } = splitPage(md);
  const type = front.match(/^type:\s*(\w+)/m)?.[1] ?? 'app';
  const out = [...bodyProblems(body, type), ...blockedPhrases(md).map((w) => `says something banned: ${w}`)];
  if (/\bTODO\b/.test(md)) out.push('still has a TODO in it');
  const block = front.match(/^release:\n((?:[ \t]+.*\n?)+)/m)?.[1] ?? '';
  if (block) {
    for (const key of ['source', 'asset', 'signer']) {
      if (!new RegExp(`^\\s+${key}:`, 'm').test(block)) out.push(`release: has no ${key}: — every app follows its GitHub Releases the same way`);
    }
  }
  return out;
}

/** The skeleton `npm run new-app` writes. Every TODO fails the check until it is replaced. */
export function newAppPage({ slug, name, source = 'TODO/TODO' }) {
  return `---
slug: ${slug}
name: ${name}
tagline: TODO one sentence, verb first, at most 90 characters.
type: app
category: Tools
status: beta
platforms: [android]
price: free
privacy: on-device
icon: /assets/${slug}/icon.png
order: 99
downloads:
  - label: Download for Android
    href: /downloads/${slug}.apk
    note: Version {version} · APK, {apkSize} — install directly, no store account
verify: []
release:
  version: 'TODO'
  apk: /downloads/${slug}.apk
  sha256: TODO
  date: TODO
  source: ${source}
  asset: TODO the APK's file name on the GitHub Release
  signer: TODO
---

## What it does

TODO three or four concrete sentences.

## Who it's for

TODO name the actual person.

## What it is not

TODO the honest limits.

## Your data

TODO what leaves the device, and how that is enforced. Check it on the running app.
`;
}
