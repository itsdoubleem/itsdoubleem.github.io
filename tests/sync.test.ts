// Tests for tools/sync-lib.mjs — the parts of the hourly app sync that need no network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanNotes, compareVersions, kstDate, notesFile, planApp, releaseField, setReleaseField, signersOf } from '../tools/sync-lib.mjs';

const md = `---
name: X
release:
  version: 1.2.9
  sha256: abc
# a comment that must survive
notice:
  version: 9.9.9
---
body
`;

test('reads and writes release fields without touching anything else', () => {
  assert.equal(releaseField(md, 'version'), '1.2.9');
  const next = setReleaseField(setReleaseField(md, 'version', '1.2.10'), 'captured', "'1.2.9'");
  assert.equal(releaseField(next, 'version'), '1.2.10');
  assert.equal(releaseField(next, 'captured'), '1.2.9');
  assert.match(next, /# a comment that must survive\nnotice:\n  version: 9\.9\.9/);
  assert.equal(next.replace(/  version: 1\.2\.10\n/, '  version: 1.2.9\n').replace("  captured: '1.2.9'\n", ''), md);
});

test('versions compare as numbers, not text', () => {
  assert.equal(compareVersions('1.2.25', '1.2.9'), 1);
  assert.equal(compareVersions('v1.0.2', '1.0.2'), 0);
  assert.equal(compareVersions('1.0', '1.0.1'), -1);
  assert.throws(() => compareVersions('1.2.26-hotfix', '1.2.25'), /cannot compare/);
});

test('the release day is the day in Korea', () => {
  assert.equal(kstDate('2026-10-11T21:21:39Z'), '2026-10-12');
  assert.equal(kstDate('2026-10-12T09:21:15Z'), '2026-10-12');
});

test('notes lose PR numbers, the download link and hash, and CHANGELOG pointers', () => {
  const body =
    'Fixes the pension figure (#31, #32). Details in CHANGELOG.md.\r\n\r\n' +
    'The APK is at https://itsdoubleem.github.io/downloads/x.apk — SHA-256 ' + 'a'.repeat(64) + '.\r\n\r\n' +
    '보수월액을 받아들입니다. (#32)';
  assert.equal(cleanNotes(body), 'Fixes the pension figure.\n\n보수월액을 받아들입니다.');
  assert.equal(cleanNotes(null), '');
});

test('notes lose ranges of PR numbers too', () => {
  // LOGGER 1.7.0's real notes, which went live with both of these still in them.
  assert.equal(
    cleanNotes('The punch button is now inspired by the app\'s clock icon, with START or STOP inside. (#47–#50)'),
    'The punch button is now inspired by the app\'s clock icon, with START or STOP inside.',
  );
  assert.equal(cleanNotes('Undo it with one tap, for 9 seconds. (#46, #51–#53)'), 'Undo it with one tap, for 9 seconds.');
  // A hyphen, an em dash, a bare second number and the PR prefix are all the same thing.
  assert.equal(cleanNotes('Fixed (#46-#48).'), 'Fixed.');
  assert.equal(cleanNotes('Fixed (PR #46 — 48, #50).'), 'Fixed.');
  // Brackets that are not PR numbers stay: a year range, a lone hash, a dash with no number.
  assert.equal(cleanNotes('Covers (2025–2026) and (#tag).'), 'Covers (2025–2026) and (#tag).');
  assert.equal(cleanNotes('Odd (#46–).'), 'Odd (#46–).');
});

test('notes are cut by the sentence, not the paragraph', () => {
  // HANGIL's real v1.0.2 notes: the install sentence stays, the link-and-hash one goes.
  const hangil =
    'Signed with the same key as 1.0.1, so it installs over it and keeps your progress. ' +
    'The APK is at https://itsdoubleem.github.io/downloads/hangil.apk — SHA-256 ' + 'b'.repeat(64) + '.';
  assert.equal(cleanNotes(hangil), 'Signed with the same key as 1.0.1, so it installs over it and keeps your progress.');
  assert.equal(cleanNotes('See CHANGELOG.md for 1.2.25. The rest stays.'), 'The rest stays.');
});

test('notes lose HTML, images, repo-relative links, headings and GitHub\'s generated lines', () => {
  const body = [
    "## What's Changed",
    '* Fix the pension figure by @someone in https://github.com/o/r/pull/3 (PR #33)',
    '',
    '## Big <b>news</b><script>alert(1)</script>',
    '![shot](https://github.com/user-attachments/x.png) Read [the guide](docs/USAGE.md) or [the site](https://example.com) (#31 and #32)',
    '',
    '**Full Changelog**: https://github.com/o/r/compare/v1...v2',
  ].join('\n');
  assert.equal(
    cleanNotes(body),
    '* Fix the pension figure\n\n**Big news**\nRead the guide or [the site](https://example.com)',
  );
});

test('a less-than sign is text, not a tag; an autolink keeps its address', () => {
  assert.equal(cleanNotes('Rounds when hours < 4 and pay > 0.'), 'Rounds when hours < 4 and pay > 0.');
  assert.equal(cleanNotes('See <https://example.com/x>.'), 'See https://example.com/x.');
});

test('permissions are read in every form aapt2 prints them', async () => {
  const { permissionsOf } = await import('../tools/sync-lib.mjs');
  const badging = "uses-permission: name='android.permission.VIBRATE'\nuses-permission-sdk-23: name='android.permission.INTERNET'\n";
  assert.deepEqual(permissionsOf(badging), ['android.permission.INTERNET', 'android.permission.VIBRATE']);
});

test('only signer lines count as signers, not a source stamp', () => {
  const out = `Signer #1 certificate SHA-256 digest: ${'a'.repeat(64)}\nSource Stamp Signer certificate SHA-256 digest: ${'c'.repeat(64)}\n`;
  assert.deepEqual(signersOf(out), ['a'.repeat(64)]);
  assert.deepEqual(signersOf(`V2 Signer: certificate SHA-256 digest: ${'d'.repeat(64)}`), ['d'.repeat(64)]);
});

// ---- planApp, the whole per-app decision, with a fake release and fake tools ----

const SIGNER = 'e'.repeat(64);
const OLD = 'f'.repeat(64);
const appMd = (extra = '') => `---
name: X
release:
  version: 1.0.0
  apk: /downloads/x.apk
  sha256: ${OLD}
  web: /x/
  date: 2026-01-01
  source: o/x
  signer: ${SIGNER}
${extra}---
`;
const served = (notes = 'Better.') => notesFile({ version: '1.0.0', date: '2026-10-12', url: 'https://github.com/o/x/releases/tag/v1.0.0', notes });
const app = (extra = '') => ({ slug: 'x', md: appMd(extra), readme: `${OLD}  x.apk\n`, notes: served() as string | null });
const rel = (tag = 'v1.1.0', assets = [{ name: 'x.apk', browser_download_url: 'https://dl/x.apk' }]) => ({
  tag_name: tag, published_at: '2026-10-12T09:00:00Z', html_url: 'https://github.com/o/x/releases/tag/' + tag,
  body: 'Better.', assets,
});
const io = (over = {}) => ({
  download: async () => Buffer.from('apk'),
  inspect: () => ({ versionName: '1.1.0', signers: [SIGNER], permissions: ['android.permission.VIBRATE'] }),
  current: () => ({ permissions: ['android.permission.VIBRATE'] }),
  unpack: () => [['index.html', Buffer.from('<html>')]],
  sha256: () => '1'.repeat(64),
  ...over,
});

test('a newer, correctly signed release plans every file and nothing else', async () => {
  const plan = await planApp(app(), rel(), io());
  assert.equal(plan.change, 'x: 1.0.0 → 1.1.0');
  assert.deepEqual(plan.writes.map(([p]) => p), ['public/downloads/x.apk', 'public/x/index.html', 'apps/x.md', 'README.md', 'releases/x.md']);
  const md = String(plan.writes[2][1]);
  assert.equal(releaseField(md, 'version'), '1.1.0');
  assert.equal(releaseField(md, 'captured'), '1.0.0');
  assert.equal(releaseField(md, 'date'), '2026-10-12');
  assert.equal(String(plan.writes[3][1]), `${'1'.repeat(64)}  x.apk\n`);
});

test('a release whose notes clean down to nothing is refused, and writes nothing', async () => {
  // The build refuses a new release with no description, and the sync pushes before the
  // build runs — so empty notes must stop here, or main goes red until someone writes them.
  const empty = (body: string | null) => ({ ...rel(), body });
  await assert.rejects(planApp(app(), empty(null), io()), /no release notes/);
  await assert.rejects(planApp(app(), empty('SHA-256 ' + 'a'.repeat(64)), io()), /no release notes/);
  await assert.rejects(planApp({ ...app(), notes: null }, { ...rel('v1.0.0'), body: '' }, io()), /no release notes/);
});

test('the same or an older release changes nothing', async () => {
  assert.deepEqual((await planApp(app(), rel('v1.0.0'), io())).writes, []);
  assert.deepEqual((await planApp(app(), rel('v0.9.0'), io())).writes, []);
});

test("a release whose notes were edited on GitHub rewrites the page's notes, and only those", async () => {
  const plan = await planApp(app(), { ...rel('v1.0.0'), body: 'Better, and faster.' }, io());
  assert.equal(plan.change, 'x: release notes for 1.0.0 updated');
  assert.deepEqual(plan.writes.map(([p]) => p), ['releases/x.md']);
  const file = String(plan.writes[0][1]);
  assert.match(file, /\n\nBetter, and faster\.\n$/);
  assert.match(file, /^version: '1\.0\.0'$/m);
  assert.match(file, /^date: 2026-10-12$/m);
  // Written again from the new text, it matches, so the next hourly run changes nothing.
  assert.deepEqual((await planApp({ ...app(), notes: String(plan.writes[0][1]) }, { ...rel('v1.0.0'), body: 'Better, and faster.' }, io())).writes, []);
});

test("notes the page can show say so, so a refused-notes Issue closes; a new version says nothing", async () => {
  assert.deepEqual((await planApp(app(), rel('v1.0.0'), io())).notes, { held: null });
  // A rewrite is not live until its candidate passes, so the Issue waits for the next run.
  assert.equal((await planApp(app(), { ...rel('v1.0.0'), body: 'Edited.' }, io())).notes, undefined);
  assert.equal((await planApp(app(), rel(), io())).notes, undefined);
});

test('a hand edit to the notes file lasts until the release text itself changes', async () => {
  const handEdited = served().replace('Better.', 'Better. (Edited here.)');
  assert.deepEqual((await planApp({ ...app(), notes: handEdited }, rel('v1.0.0'), io())).writes, []);
  const plan = await planApp({ ...app(), notes: handEdited }, { ...rel('v1.0.0'), body: 'Rewritten.' }, io());
  assert.deepEqual(plan.writes.map(([p]) => p), ['releases/x.md']);
});

test('a notes file from before fingerprints is compared by its text', async () => {
  const old = served().replace(/^source: .*\n/m, '');
  assert.deepEqual((await planApp({ ...app(), notes: old }, rel('v1.0.0'), io())).writes, []);
  assert.deepEqual((await planApp({ ...app(), notes: old }, { ...rel('v1.0.0'), body: 'Changed.' }, io())).writes.map(([p]) => p), ['releases/x.md']);
});

test('notes edited down to nothing keep the page notes it has, with a warning', async () => {
  const plan = await planApp(app(), { ...rel('v1.0.0'), body: '' }, io());
  assert.deepEqual(plan.writes, []);
  assert.match(plan.warning!, /keeps the ones it has/);
  // The sync keeps an Issue open for it, instead of one warning line an hour nobody reads.
  assert.match(plan.notes!.held!, /nothing the site can show/);
});

test("a tag written v1.0 still writes the site's own version, 1.0.0, which the build checks", async () => {
  const plan = await planApp(app(), { ...rel('v1.0'), body: 'Shorter tag.' }, io());
  assert.match(String(plan.writes[0][1]), /^version: '1\.0\.0'$/m);
});

test('notes with a phrase the site refuses: a new version stops, an edit keeps the page notes', async () => {
  await assert.rejects(planApp(app(), { ...rel(), body: 'A seamless update.' }, io()), /does not allow/);
  const plan = await planApp(app(), { ...rel('v1.0.0'), body: 'It is free forever.' }, io());
  assert.deepEqual(plan.writes, []);
  assert.match(plan.warning!, /keeps the ones it has/);
  assert.match(plan.notes!.held!, /stays free/);
});

test('a release with no APK is a warning, not a failure, and writes nothing', async () => {
  const plan = await planApp(app(), rel('v1.1.0', []), io());
  assert.match(plan.warning, /no APK/);
  assert.deepEqual(plan.writes, []);
});

test('refusals: wrong signer, wrong version, a new permission, INTERNET, a tied notice, no README line, no web build', async () => {
  await assert.rejects(planApp(app(), rel(), io({ inspect: () => ({ versionName: '1.1.0', signers: ['0'.repeat(64)], permissions: [] }) })), /not the pinned/);
  await assert.rejects(planApp(app(), rel(), io({ inspect: () => ({ versionName: '1.0.9', signers: [SIGNER], permissions: [] }) })), /versionName 1\.0\.9/);
  await assert.rejects(planApp(app(), rel(), io({ inspect: () => ({ versionName: '1.1.0', signers: [SIGNER], permissions: ['android.permission.CAMERA'] }) })), /CAMERA/);
  const internet = { versionName: '1.1.0', signers: [SIGNER], permissions: ['android.permission.INTERNET'] };
  await assert.rejects(planApp(app(), rel(), io({ inspect: () => internet, current: () => ({ permissions: ['android.permission.INTERNET'] }) })), /INTERNET/);
  await assert.rejects(planApp({ ...app(), md: appMd('notice:\n  badge: Read first\n  version: 1.0.0\n') }, rel(), io()), /notice tied/);
  await assert.rejects(planApp({ ...app(), readme: '' }, rel(), io()), /no hash line/);
  await assert.rejects(planApp(app(), rel(), io({ unpack: () => [] })), /no assets\/www/);
});

// ---- the icon: LOGGER 1.4.0 changed its icon, the sync copied the web build but not the
// page's copy, and the build refused every deploy from then on ----

const withManifest = (icon = Buffer.from('new-icon')) => [
  ['manifest.webmanifest', Buffer.from(JSON.stringify({ icons: [
    { src: 'icon-512.png', sizes: '512x512', purpose: 'any' },
    { src: 'icon-maskable-512.png', sizes: '512x512', purpose: 'maskable' },
  ] }))],
  ['icon-512.png', icon],
  ['icon-maskable-512.png', Buffer.from('padded')],
] as [string, Buffer][];

test("a release carries the app's own 512px icon over the page's copy", async () => {
  const md = appMd('icon: /assets/x/icon.png\n');
  const plan = await planApp({ ...app(), md }, rel(), io({ unpack: () => withManifest() }));
  const icon = plan.writes.find(([p]) => p === 'public/assets/x/icon.png');
  assert.equal(String(icon?.[1]), 'new-icon');
});

test('with no manifest in the APK the page icon is left for the build to judge', async () => {
  const md = appMd('icon: /assets/x/icon.png\n');
  const plan = await planApp({ ...app(), md }, rel(), io());
  assert.equal(plan.writes.find(([p]) => p === 'public/assets/x/icon.png'), undefined);
});
