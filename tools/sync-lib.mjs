/* The pure parts of tools/sync-apps.mjs, kept apart so tests/sync.test.ts can reach them
 * without the network, an APK or the Android SDK.
 *
 * Like check-downloads.mjs, this reads and writes the `release:` block by pattern rather than
 * with a YAML library, so the hourly job runs on a bare checkout with nothing installed. */

/** The `release:` block's indented lines, or '' if there is none. */
export const releaseBlock = (md) => md.match(/^release:\n((?:[ \t]+.*\n)+)/m)?.[1] ?? '';

/** One scalar field of the `release:` block, quotes stripped. */
export function releaseField(md, key) {
  return releaseBlock(md).match(new RegExp(`^\\s+${key}:\\s*['"]?([^'"\\s#]+)`, 'm'))?.[1];
}

/** Sets a scalar field in the `release:` block, adding it at the end if it is missing.
 *  Every other line — comments included — is left exactly as it was. */
export function setReleaseField(md, key, value) {
  const block = releaseBlock(md);
  if (!block) throw new Error('no release: block');
  const line = new RegExp(`^(\\s+)${key}:.*$`, 'm');
  const next = line.test(block)
    ? block.replace(line, (_, indent) => `${indent}${key}: ${value}`)
    : `${block}  ${key}: ${value}\n`;
  return md.replace(`release:\n${block}`, `release:\n${next}`);
}

/** -1, 0 or 1. Compares dotted numbers (1.2.9 < 1.2.25); a leading v is ignored. */
export function compareVersions(a, b) {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return Math.sign(d);
  }
  return 0;
}

/** The day an instant falls on in Korea, as YYYY-MM-DD. Release days are Korean days
 *  (src/release.ts), and both apps are released from there. */
export const kstDate = (iso) => new Date(new Date(iso).getTime() + 9 * 3600e3).toISOString().slice(0, 10);

/* A GitHub Release's notes are written for the app's repo, not for a stranger on this site.
 * Three things in them mean nothing here, so they go:
 *   · pull-request numbers — "(#32)" links nowhere on this site;
 *   · a paragraph carrying a SHA-256 or this site's own address — HANGIL's notes repeat the
 *     download link and its hash, which the page already prints beside the button;
 *   · a sentence pointing at CHANGELOG.md — a file in another repo.
 * Everything else is shown as written, in whatever language it was written in. */
export function cleanNotes(body) {
  return (body ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]*\((?:#\d+(?:,\s*)?)+\)/g, '')
    .split(/\n\s*\n/)
    .filter((p) => !/\b[0-9a-f]{64}\b/.test(p) && !/itsdoubleem\.github\.io/.test(p))
    .map((p) => p.replace(/[ \t]*[^.!?\n]*CHANGELOG\.md[^.!?\n]*[.!?]?/g, '').trim())
    .filter(Boolean)
    .join('\n\n');
}

/** The file releases/<slug>.md: the notes for one version, as the page shows them. */
export function notesFile({ version, date, url, notes }) {
  return [
    '---',
    '# Written by tools/sync-apps.mjs from the GitHub Release. Edit it if you like; the next',
    '# release replaces it.',
    `version: '${version}'`,
    `date: ${date}`,
    `url: ${url}`,
    '---',
    '',
    notes,
    '',
  ].join('\n');
}
