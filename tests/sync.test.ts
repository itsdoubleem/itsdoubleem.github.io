// Tests for tools/sync-lib.mjs — the parts of the hourly app sync that need no network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanNotes, compareVersions, kstDate, planApp, releaseField, setReleaseField, signersOf } from '../tools/sync-lib.mjs';

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
const app = (extra = '') => ({ slug: 'x', md: appMd(extra), readme: `${OLD}  x.apk\n`, notesExists: true });
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
  await assert.rejects(planApp({ ...app(), notesExists: false }, { ...rel('v1.0.0'), body: '' }, io()), /no release notes/);
});

test('the same or an older release changes nothing', async () => {
  assert.deepEqual((await planApp(app(), rel('v1.0.0'), io())).writes, []);
  assert.deepEqual((await planApp(app(), rel('v0.9.0'), io())).writes, []);
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
