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
 *
 * Only the tagline, audience and body come from the listing. The release block, the verify
 * claims and everything else stay in apps/<slug>.md. */
import { createHash } from 'node:crypto';
import { blockedPhrases, bodyProblems, sections, splitPage } from './format-lib.mjs';

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
const scalar = (v) => (/^[\p{L}\p{N}][^#\n]*$/u.test(v) && !/:\s/.test(v) && !/\s$/.test(v) ? v : JSON.stringify(v));

export function parseListing(text) {
  const { front, body } = splitPage(text.replace(/\r\n/g, '\n'));
  const fields = {};
  for (const line of front.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'))) {
    const m = line.match(/^([\w-]+):\s*(.*)$/);
    fields[m ? m[1] : line] = m ? unquote(m[2]) : '';
  }
  return { fields, body: body.trim() };
}

const fieldOf = (front, key) => {
  const m = front.match(new RegExp(`^${key}:(.*)$`, 'm'));
  return m ? unquote(m[1]) : undefined;
};

/** Numbers in a text, sorted, so a moved number is not a changed one. */
const numbers = (text) => (text.match(/\d[\d,.]*\d|\d/g) ?? []).sort();
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

const fence = (t) => `\`\`\`\`\n${t}\n\`\`\`\``;

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
    if (!(key in FIELDS)) refused.push(`has a field "${key}" — a listing carries only ${Object.keys(FIELDS).join(' and ')}; the rest stays in apps/${slug}.md`);
  }
  if (!listing.fields.tagline) refused.push('has no tagline');
  for (const [key, max] of Object.entries(FIELDS)) {
    if ((listing.fields[key] ?? '').length > max) refused.push(`${key} is over ${max} characters`);
  }
  if (/^---$/m.test(listing.body)) refused.push('has a --- line in its body, which would break the page');
  refused.push(...bodyProblems(listing.body, type));
  const all = `${listing.fields.tagline ?? ''}\n${listing.fields.audience ?? ''}\n${listing.body}`;
  refused.push(...blockedPhrases(all).map((w) => `says something banned: ${w}`));
  if (refused.length) return { status: 'refused', id, reasons: refused };

  const next = applyListing(md, listing);
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
  for (const h of PROTECTED) if (was.get(h) !== now.get(h)) reasons.push(`it changes "${h}"`);
  const prose = (x) => `${x.tagline}\n${x.audience ?? ''}\n${x.body}`;
  const added = multisetDiff(numbers(prose(after)), numbers(prose(before)));
  const gone = multisetDiff(numbers(prose(before)), numbers(prose(after)));
  if (added.length || gone.length) {
    reasons.push(`its numbers change${added.length ? ` (new: ${added.join(', ')})` : ''}${gone.length ? ` (gone: ${gone.join(', ')})` : ''}`);
  }
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
