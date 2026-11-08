import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { RETAKE, duplicates, issueText, staleCaptures, withoutCaptured } from '../tools/captures-lib.mjs';
import { releaseField } from '../tools/sync-lib.mjs';

const md = (release: string) => `---\nslug: x\nname: LOGGER\ntagline: T\nrelease:\n${release}---\n\nbody\n`;
const behind = md("  version: 1.4.1\n  sha256: abc\n  captured: '1.2.25'\n");

test('an app whose captured: differs from its version is behind; one without it is not', () => {
  assert.deepEqual(staleCaptures([{ slug: 'logger', md: behind }]), [{ slug: 'logger', name: 'LOGGER', captured: '1.2.25', served: '1.4.1' }]);
  assert.deepEqual(staleCaptures([{ slug: 'logger', md: md('  version: 1.4.1\n') }]), []);
  // A captured: left at the version served says nothing is behind.
  assert.deepEqual(staleCaptures([{ slug: 'logger', md: md("  version: 1.4.1\n  captured: '1.4.1'\n") }]), []);
});

test('the Issue names each app, its versions and the command, in one Issue for all', () => {
  const one = issueText(staleCaptures([{ slug: 'logger', md: behind }]));
  assert.equal(one.title, "LOGGER's screenshots are from 1.2.25; the site serves 1.4.1");
  assert.match(one.body, /npm run retake -- logger/);
  const two = issueText(staleCaptures([
    { slug: 'logger', md: behind },
    { slug: 'hangil', md: behind.replace('LOGGER', 'HANGIL') },
  ]));
  assert.match(two.title, /LOGGER and HANGIL/);
  assert.match(two.body, /retake -- hangil/);
});

test('withoutCaptured deletes that one line and nothing else', () => {
  const after = withoutCaptured(behind);
  assert.equal(after, md('  version: 1.4.1\n  sha256: abc\n'));
  assert.equal(withoutCaptured(after), after);
  const withComment = md("  version: 1.4.1\n  # a note\n  captured: '1.2.25'\n  signer: s\n");
  assert.equal(withoutCaptured(withComment), md('  version: 1.4.1\n  # a note\n  signer: s\n'));
  // Text in the body that looks like the field is left alone.
  const inBody = `${md('  version: 1\n')}  captured: '0'\n`;
  assert.equal(withoutCaptured(inBody), inBody);
});

test('every app the sync updates has a retake entry, and its scripts exist', () => {
  for (const f of readdirSync('apps').filter((n) => n.endsWith('.md') && n !== 'README.md')) {
    const slug = f.replace(/\.md$/, '');
    if (!releaseField(readFileSync(`apps/${f}`, 'utf8'), 'source')) continue;
    const entry = RETAKE[slug as keyof typeof RETAKE];
    assert.ok(entry, `RETAKE has no entry for ${slug}`);
    for (const s of entry.scripts) assert.ok(existsSync(s), s);
    // The scripts read the address from this variable, so a spare port reaches them.
    for (const s of entry.scripts) assert.match(readFileSync(s, 'utf8'), new RegExp(`process\\.env\\.${entry.env}`), s);
  }
});

test('retake refuses an unknown app and, off the Mac, any app', () => {
  const unknown = spawnSync(process.execPath, ['tools/retake.mjs', 'nope'], { encoding: 'utf8' });
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /say which app: logger, hangil/);
  if (process.platform !== 'darwin') {
    const r = spawnSync(process.execPath, ['tools/retake.mjs', 'logger'], { encoding: 'utf8' });
    assert.match(r.stderr, /run this on the Mac/);
  }
});

test('watch.yml keeps the screenshots Issue, without npm', () => {
  const yml = readFileSync('.github/workflows/watch.yml', 'utf8');
  assert.match(yml, /node tools\/check-captures\.mjs --issue/);
  assert.doesNotMatch(yml, /^(?!\s*#).*\bnpm (ci|install)/m);
});

test('identical pictures are found, as ten copies of one welcome screen were', () => {
  const a = Buffer.from('welcome');
  assert.deepEqual(duplicates([['g/07.png', a], ['g/10.png', Buffer.from('welcome')], ['g/01.png', Buffer.from('lang')]]), [['g/07.png', 'g/10.png']]);
  assert.deepEqual(duplicates([['g/01.png', a], ['g/02.png', Buffer.from('other')]]), []);
  // The same screen in two folders is allowed: HANGIL's guide/08-exam.png and shots/05-exam.png.
  assert.deepEqual(duplicates([['guide/08-exam.png', a], ['shots/05-exam.png', Buffer.from('welcome')]]), []);
});
