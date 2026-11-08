/* An app's description, kept in the app's own repo as LISTING.md and carried onto its page by
 * the sync (tools/sync-apps.mjs). The decision is made here, without the network or the disk:
 *
 *   refused  it breaks the page format or a banned-phrase rule; nothing happens until it is
 *            fixed, and approval cannot override it
 *   held     it changes something a person has to vouch for; it waits for the owner's approval
 *   publish  ordinary prose; it goes on the page without anyone reading it first
 *
 * What gets held is hard rules 1 and 3 made mechanical. "What it is not" carries LOGGER's legal
 * position and "Your data" carries the privacy claims. A changed number might be a wrong one:
 * HANGIL's GitHub description said 197 words the day its page, counted from what ships, said 404.
 * The tagline is held too, because it is what a stranger reads first and everywhere.
 * A changed link might point at someone else's APK.
 *
 * Only the tagline, audience and body come from the listing. The release block, the verify
 * claims and everything else stay in apps/<slug>.md. */
import { createHash } from 'node:crypto';
import { blockedPhrases, bodyProblems, pageProblems, sections, splitPage } from './format-lib.mjs';

export const LISTING_FILE = 'LISTING.md';
const FIELDS = { tagline: 90, audience: 120 };
/** Sections that always wait for approval. */
export const PROTECTED = ['What it is not', 'Your data'];

const unquote = (v) => {
  const t = v.trim();
  if (t.startsWith('"')) { try { return JSON.parse(t); } catch { return t; } }
  return t.startsWith("'") && t.endsWith("'") ? t.slice(1, -1).replace(/''/g, "'") : t;
};
/** A one-line YAML value: plain when that is safe, otherwise double-quoted. */
const YAML_WORD = /^(null|true|false|yes|no|on|off|~|[-+.\d][\d._eE+-]*)$/i;
const scalar = (v) => (/^[\p{L}\p{N}][^#\n]*$/u.test(v) && !/:(\s|$)/.test(v) && !/\s$/.test(v) && !YAML_WORD.test(v) ? v : JSON.stringify(v));

/* The gate below compares sections found by pattern, while readers get what the markdown
 * renderer makes, and any way of writing that makes the two differ defeats it: a comment hiding
 * "What it is not", a quoted heading, a lone carriage return opening a code block. So this is an
 * allow-list rather than a list of tricks. These pages are paragraphs, bold openers and plain
 * "## " headings, and a listing may be nothing else. Refused, not judged: approval cannot pass it. */
const PLAIN_LINE = /^(?:## \S.*|(?![>#=~|<\[!`_+-]|\*(?!\*)|\d+[.)](?:\s|$))\S.*)$/u;
export function structureProblems(body) {
  const out = [];
  if (body && !body.startsWith('## ')) out.push('has text before its first heading');
  // \n is the one line ending, because the checks split on it and the renderer honours others.
  if (/[\p{Cc}\p{Zl}\p{Zp}]/u.test(body.replace(/\n/g, ''))) out.push('has a control character or an unusual line ending');
  if (/<[a-zA-Z!/?]/.test(body)) out.push('has raw HTML or a comment in it');
  if (/\]:/.test(body)) out.push('has a link definition in it');
  // The renderer resolves both before it looks for links, so they can disguise one from LINK.
  if (/\\|&[#\w]+;/.test(body)) out.push('has a backslash or an HTML entity in it');
  // A row of only marks is a divider or a table's second row, whatever it starts with.
  const bad = body.split('\n').filter((l) => l.trim() && (!PLAIN_LINE.test(l) || /^[\s*_:|-]+$/.test(l))).length;
  if (bad) out.push(`has ${bad} line(s) that are not plain text or a "## " heading: no lists, quotes, tables, code, indents or other headings`);
  return out;
}

export function parseListing(text) {
  const { front, body } = splitPage(text.replace(/\r\n/g, '\n'));
  const fields = {};
  for (const line of front.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'))) {
    const m = line.match(/^([\w-]+):\s*(.*)$/);
    fields[m ? m[1] : line] = m ? unquote(m[2]) : '';
  }
  return { fields, body: body.trim() };
}

const prose = (x) => `${x.tagline}\n${x.audience ?? ''}\n${x.body}`;

const fieldOf = (front, key) => {
  const m = front.match(new RegExp(`^${key}:(.*)$`, 'm'));
  return m ? unquote(m[1]) : undefined;
};

/* Digits in any script (NFKC turns fullwidth ones to ASCII), number words, and Korean
 * counts of people, in order, so a swap is a change. A claim can still be written around all
 * of this, which is why apps/README.md asks for it to be checked before it is written. */
const NUMBER = /\d[\d,.]*\d|\d|\b(?:two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|dozen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion)\b|[천만억]\s*명/gi;
const numbers = (text = '') => (text.normalize('NFKC').toLowerCase().match(NUMBER) ?? []);
const LINK = /[a-z][a-z0-9+.-]*:\/\/[^\s)>]+|\/\/[^\s)>]+|www\.[^\s)>]+|\]\([^)]*\)|[^\s@]+@[^\s@]+\.[^\s@]+/gi;
const links = (text = '') => text.match(LINK) ?? [];
const multisetDiff = (a, b) => {
  const rest = [...b];
  return a.filter((x) => { const i = rest.indexOf(x); if (i < 0) return true; rest.splice(i, 1); return false; });
};

/** apps/<slug>.md with a listing's fields and body in place. Everything else is untouched. */
export function applyListing(md, { fields, body }) {
  const { front } = splitPage(md);
  let next = front;
  for (const key of Object.keys(FIELDS)) {
    if (fields[key] === undefined) continue;
    const line = `${key}: ${scalar(fields[key])}`;
    next = new RegExp(`^${key}:.*$`, 'm').test(next)
      ? next.replace(new RegExp(`^${key}:.*$`, 'm'), () => line)
      : next.replace(/^(tagline:.*)$/m, (t) => `${t}\n${line}`);
  }
  return `---\n${next}\n---\n\n${body}\n`;
}

/** A code fence longer than any run of backticks in the text, so the text cannot close it. */
const fence = (t) => {
  const ticks = '`'.repeat(Math.max(3, ...(t.match(/`+/g) ?? []).map((r) => r.length)) + 1);
  return `${ticks}\n${t}\n${ticks}`;
};

/** Decides what happens to one app's listing.
 *  Returns { status: 'same' | 'publish' | 'held' | 'refused', id, md?, reasons?, changes? },
 *  where id is `slug@hash`, the thing an approval names. */
export function planListing({ slug, md, text, approved }) {
  const id = `${slug}@${createHash('sha256').update(text).digest('hex').slice(0, 12)}`;
  const listing = parseListing(text);
  const { front, body } = splitPage(md);
  const type = front.match(/^type:\s*(\w+)/m)?.[1] ?? 'app';

  const refused = [];
  for (const key of Object.keys(listing.fields)) {
    // The name is printed only if it is a plain word: this text goes into an Issue.
    if (!(key in FIELDS)) refused.push(`has a field ${/^[\w-]+$/.test(key) ? `"${key}"` : 'it cannot read'} — a listing carries only ${Object.keys(FIELDS).join(' and ')}; the rest stays in apps/${slug}.md`);
  }
  if (!listing.fields.tagline) refused.push('has no tagline');
  for (const [key, max] of Object.entries(FIELDS)) {
    if ((listing.fields[key] ?? '').length > max) refused.push(`${key} is over ${max} characters`);
    if (/[\p{Cc}]/u.test(listing.fields[key] ?? '')) refused.push(`${key} has a line break or control character in it`);
  }
  refused.push(...structureProblems(listing.body));
  refused.push(...bodyProblems(listing.body, type));
  const all = `${listing.fields.tagline ?? ''}\n${listing.fields.audience ?? ''}\n${listing.body}`;
  refused.push(...blockedPhrases(all).map((w) => `says something banned: ${w}`));
  if (refused.length) return { status: 'refused', id, reasons: refused };

  const next = applyListing(md, listing);
  // What verify would refuse is refused here, because one app's bad listing would otherwise
  // hold back every app in the same candidate.
  const whole = pageProblems(next);
  if (whole.length) return { status: 'refused', id, reasons: whole };
  const before = { tagline: fieldOf(front, 'tagline'), audience: fieldOf(front, 'audience'), body: body.trim() };
  const after = {
    tagline: listing.fields.tagline,
    audience: listing.fields.audience ?? before.audience,
    body: listing.body,
  };
  if (before.tagline === after.tagline && before.audience === after.audience && before.body === after.body) {
    return { status: 'same', id };
  }

  const was = new Map(sections(before.body));
  const now = new Map(sections(after.body));
  const reasons = [];
  // The tagline is the one line a stranger reads everywhere: on the card, in the page head and
  // in search results. "Labour-law advice, from your phone" would publish there unread and say
  // the opposite of LOGGER's "What it is not". Owner's decision, 2026-11-08 (S9).
  if (before.tagline !== after.tagline) reasons.push('it changes the tagline');
  for (const h of PROTECTED) if (was.get(h) !== now.get(h)) reasons.push(`it changes "${h}"`);
  // Field by field and section by section: the same numbers elsewhere are different claims.
  const parts = (x, map) => [x.tagline, x.audience, ...[...new Set([...was.keys(), ...now.keys()])].map((h) => map.get(h))];
  const beforeParts = parts(before, was);
  const afterParts = parts(after, now);
  const moved = beforeParts.some((p, i) => numbers(p).join() !== numbers(afterParts[i]).join());
  const flat = (ps) => ps.flatMap((p) => numbers(p));
  const added = multisetDiff(flat(afterParts), flat(beforeParts));
  const gone = multisetDiff(flat(beforeParts), flat(afterParts));
  if (moved) {
    reasons.push(added.length || gone.length
      ? `its numbers change${added.length ? ` (new: ${added.join(', ')})` : ''}${gone.length ? ` (gone: ${gone.join(', ')})` : ''}`
      : 'its numbers change places');
  }
  if (links(prose(after)).join() !== links(prose(before)).join()) reasons.push('its links change');
  if (!reasons.length || approved === id) return { status: 'publish', id, md: next };

  const changes = [];
  for (const key of ['tagline', 'audience']) {
    if (before[key] !== after[key]) changes.push(`**${key}**\n\nNow:\n${fence(before[key] ?? '')}\n\nProposed:\n${fence(after[key] ?? '')}`);
  }
  for (const h of new Set([...was.keys(), ...now.keys()])) {
    if (was.get(h) !== now.get(h)) changes.push(`**${h}**\n\nNow:\n${fence(was.get(h) ?? '')}\n\nProposed:\n${fence(now.get(h) ?? '')}`);
  }
  return { status: 'held', id, reasons, changes };
}

/** The LISTING.md that matches a page as it stands, to start an app's repo off with. */
export function exportListing(md) {
  const { front, body } = splitPage(md);
  const lines = Object.keys(FIELDS)
    .map((k) => [k, fieldOf(front, k)])
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${scalar(v)}`);
  return `---\n${lines.join('\n')}\n---\n\n${body.trim()}\n`;
}
