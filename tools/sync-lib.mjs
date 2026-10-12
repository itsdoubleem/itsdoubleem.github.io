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

/** -1, 0 or 1. Compares dotted numbers (1.2.9 < 1.2.25); a leading v is ignored. A part
 *  that is not a number (1.2.26-hotfix) throws, rather than comparing as equal and being
 *  skipped without a word. */
export function compareVersions(a, b) {
  const parse = (v) => {
    const parts = v.replace(/^v/, '').split('.').map(Number);
    if (parts.some(Number.isNaN)) throw new Error(`cannot compare version ${v}`);
    return parts;
  };
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return Math.sign(d);
  }
  return 0;
}

/** The day an instant falls on in Korea, as YYYY-MM-DD. Release days are Korean days
 *  (src/release.ts), and both apps are released from there. */
export const kstDate = (iso) => new Date(new Date(iso).getTime() + 9 * 3600e3).toISOString().slice(0, 10);

/* A GitHub Release's notes are written for the app's repo, not for a stranger on this site,
 * and they are published here every hour with nobody reading them first. So they are cut
 * down to plain prose, sentence by sentence — a whole paragraph is never dropped for one
 * bad sentence in it:
 *   · HTML tags and images go; a relative link keeps its words and loses the link (it
 *     pointed into the app's repo); headings become bold lines, so they never sit as a
 *     second h2 under "What's new";
 *   · pull-request numbers — "(#32)", "(PR #33)", "(#31 and #32)" — link nowhere here;
 *   · GitHub's generated "What's Changed" furniture: the heading, "by @user in …/pull/N",
 *     "**Full Changelog**: …", "New Contributors";
 *   · any sentence carrying a SHA-256, this site's address or CHANGELOG.md — HANGIL's notes
 *     repeat the download link and its hash, which the page prints beside the button.
 * Everything else is shown as written, in whatever language it was written in. */
const DROP_SENTENCE = [/\b[0-9a-f]{64}\b/, /itsdoubleem\.github\.io/, /CHANGELOG\.md/];
const DROP_LINE = [/^#+\s*What's Changed\s*$/i, /^#+\s*New Contributors\s*$/i, /^\*\*Full Changelog\*\*/, /made their first contribution/];

const sentences = (line) => line.split(/(?<=[.!?。])\s+(?=\S)/);

export function cleanNotes(body) {
  const text = (body ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\[([^\]]+)\]\((?!https?:\/\/)[^)]*\)/g, '$1')
    .replace(/ by @[\w-]+ in https:\/\/github\.com\/\S+/g, '')
    .replace(/[ \t]*\((?:PR\s*)?#\d+(?:(?:,\s*|\s+and\s+)(?:PR\s*)?#\d+)*\)/g, '');
  return text
    .split(/\n\s*\n/)
    .map((para) =>
      para
        .split('\n')
        .filter((line) => !DROP_LINE.some((r) => r.test(line.trim())))
        .map((line) => line.replace(/^#{1,6}\s+(.+?)\s*#*\s*$/, '**$1**'))
        .map((line) => sentences(line).filter((x) => !DROP_SENTENCE.some((r) => r.test(x))).join(' ').replace(/^ (?=\S)/, ''))
        .filter((line) => line.trim() && !/^\s*[-*+]\s*$/.test(line))
        .join('\n')
        .trim(),
    )
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

/* Android permissions an APK asks for, from `aapt2 dump badging`. */
export const permissionsOf = (badging) =>
  [...badging.matchAll(/^uses-permission: name='([^']+)'/gm)].map((m) => m[1]).sort();

/* What one app's sync would do, worked out without touching the disk. Everything that can
 * fail — the download, the version, the signer, the permissions, the unpacking, the README
 * line — fails here, before a single file is written; the caller writes `writes` only when
 * this returns. An app that fails halfway therefore leaves nothing behind for the commit
 * step to pick up.
 *
 *   app   { slug, md, readme, notesExists }
 *   rel   the GitHub API's release JSON
 *   io    { download(url) → Buffer, inspect(buf) → { versionName, signers, permissions },
 *           current() → { permissions } of the APK served now, unpack(buf) → [[path, Buffer]] }
 *
 * Returns { change?, warning?, writes: [[repoPath, string|Buffer]] }. */
export async function planApp(app, rel, io) {
  const { slug, readme } = app;
  let md = app.md;
  const current = releaseField(md, 'version');
  const latest = rel.tag_name.replace(/^v/, '');
  const notes = () =>
    notesFile({ version: latest, date: kstDate(rel.published_at), url: rel.html_url, notes: cleanNotes(rel.body) });
  const cmp = compareVersions(latest, current);

  if (cmp < 0) return { writes: [], log: `${current} is current (latest release ${rel.tag_name} is older)` };
  if (cmp === 0) {
    return app.notesExists
      ? { writes: [], log: `${current} is current` }
      : { writes: [[`releases/${slug}.md`, notes()]], change: `${slug}: release notes for ${current}`, log: 'wrote its release notes' };
  }

  // A notice tied to the old version would fail the build. It was written by a person
  // about one update, so a person decides what happens to it.
  if (/^notice:\n(?:[ \t]+.*\n)*?[ \t]+version:/m.test(md)) {
    throw new Error(`has a notice tied to ${current} — rewrite or delete it, then sync again`);
  }

  const wanted = releaseField(md, 'asset');
  const apks = rel.assets.filter((a) => (wanted ? a.name === wanted : a.name.endsWith('.apk')));
  if (apks.length !== 1) {
    return {
      writes: [],
      warning: `${rel.tag_name} has ${apks.length ? 'several' : 'no'} APK ${wanted ? `named ${wanted}` : 'assets'} — attach one to the release to publish it here`,
    };
  }

  const buf = await io.download(apks[0].browser_download_url);
  const got = io.inspect(buf);
  if (got.versionName !== latest) throw new Error(`${rel.tag_name}'s APK says versionName ${got.versionName}`);
  const pinned = releaseField(md, 'signer');
  if (!got.signers.length || got.signers.some((x) => x !== pinned)) {
    throw new Error(`${rel.tag_name}'s APK is signed by ${got.signers.join(', ') || 'nothing'}, not the pinned ${pinned}`);
  }
  // The pages say what the app can and cannot do — "asks for no internet permission" above
  // all. A permission the served APK does not ask for makes some sentence on the page
  // untrue, and only a person can rewrite it.
  const had = new Set(io.current().permissions);
  const added = got.permissions.filter((p) => !had.has(p) || p === 'android.permission.INTERNET');
  if (added.length) {
    throw new Error(`${rel.tag_name}'s APK asks for ${added.join(', ')}, which the served one does not — check what the page says, then update by hand`);
  }

  const apkPath = releaseField(md, 'apk');
  const apkName = apkPath.split('/').pop();
  const oldSha = releaseField(md, 'sha256');
  if (!readme.includes(`${oldSha}  ${apkName}`)) throw new Error(`README.md has no hash line for ${apkName}`);
  const web = releaseField(md, 'web');
  const www = web ? io.unpack(buf) : [];
  if (web && !www.length) throw new Error(`${rel.tag_name}'s APK has no assets/www/ for ${web}`);

  const sha = io.sha256(buf);
  if (!releaseField(md, 'captured')) md = setReleaseField(md, 'captured', `'${current}'`);
  md = setReleaseField(md, 'version', latest);
  md = setReleaseField(md, 'sha256', sha);
  md = setReleaseField(md, 'date', kstDate(rel.published_at));

  return {
    change: `${slug}: ${current} → ${latest}`,
    log: `${current} → ${latest} (${sha})`,
    writes: [
      [`public${apkPath}`, buf],
      ...www.map(([p, data]) => [`public${web.replace(/\/?$/, '/')}${p}`, data]),
      [`apps/${slug}.md`, md],
      ['README.md', readme.replace(`${oldSha}  ${apkName}`, `${sha}  ${apkName}`)],
      [`releases/${slug}.md`, notes()],
    ],
  };
}

/* The certificates an APK is signed with, from `apksigner verify --print-certs`. Only the
 * signer lines — "Signer #1 certificate …" or "V2 Signer: certificate …" — not a Source
 * Stamp or a rotated key's lineage, which name certificates that do not sign the APK. */
export const signersOf = (out) =>
  [...out.matchAll(/^(?:Signer #\d+|V\d+ Signer):? certificate SHA-256 digest: ([0-9a-f]{64})/gm)].map((m) => m[1]);
