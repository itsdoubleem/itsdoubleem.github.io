// Tests for src/install.ts — the rules an install translation must follow.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFileProblems, installOrder, installProblems, type InstallLanguage } from '../src/install.ts';

const lang = (over: Partial<InstallLanguage> = {}): InstallLanguage => ({
  checked: false,
  unchecked: 'Chưa được người bản ngữ kiểm tra.',
  title: 'Cách cài đặt',
  sections: [{ heading: 'Android', steps: ['Tải tệp {apkSize}.'] }],
  ...over,
});
// English is the source every translation follows, so each test file carries it.
const en: InstallLanguage = { checked: true, title: 'How to install', sections: [{ heading: 'Android', steps: ['Download it.'] }] };
const appLangs = ['ko', 'en', 'vi', 'zh'];
const known = ['version', 'apkSize', 'sha256'];

test('a well-formed unchecked translation passes', () => {
  assert.deepEqual(installProblems({ en, vi: lang() }, appLangs, known), []);
});

test('an unchecked translation must say so', () => {
  const p = installProblems({ en, vi: lang({ unchecked: '  ' }) }, appLangs, known);
  assert.equal(p.length, 1);
  assert.match(p[0], /^vi: checked is false/);
});

test('a checked translation must drop the warning', () => {
  const p = installProblems({ en, vi: lang({ checked: true }) }, appLangs, known);
  assert.match(p[0], /delete the unchecked: line/);
  assert.deepEqual(installProblems({ en, vi: lang({ checked: true, unchecked: undefined }) }, appLangs, known), []);
});

test('a language the app does not speak is refused', () => {
  const p = installProblems({ en, km: lang() }, appLangs, known);
  assert.equal(p.length, 1);
  assert.match(p[0], /^km: the app does not list km/);
});

test('English is the source, so it must be marked checked', () => {
  assert.deepEqual(installProblems({ en }, appLangs, known), []);
  assert.ok(installProblems({ en: lang() }, appLangs, known).some((m) => m.startsWith('en: the English is the source')));
});

test('an app with no languages: list can offer none', () => {
  assert.ok(installProblems({ en, vi: lang() }, undefined, known).some((m) => /does not list vi/.test(m)));
});

test('a token the app cannot fill is caught, wherever it is', () => {
  const p = installProblems(
    { en, vi: lang({ title: 'Cài {webSize}', sections: [{ heading: 'Android', steps: ['{nope}'] }] }) },
    appLangs,
    known,
  );
  assert.deepEqual(p, ['vi: {webSize} cannot be filled for this app', 'vi: {nope} cannot be filled for this app']);
});

test('languages come out in the app’s order, leaving out the missing ones', () => {
  const out = installOrder({ zh: lang(), vi: lang(), en: lang() }, appLangs);
  assert.deepEqual(out.map((l) => l.code), ['en', 'vi', 'zh']);
  assert.equal(out[0].title, 'Cách cài đặt');
  assert.deepEqual(installOrder({ vi: lang() }, undefined), []);
});

test('English must be there whenever any language is', () => {
  const p = installProblems({ vi: lang() }, appLangs, known);
  assert.deepEqual(p, ['en: missing — it is the source every other language translates']);
  assert.deepEqual(installProblems({}, appLangs, known), ['languages: is empty — add en, or delete the file']);
});

test('a translation that drops or adds a step or a section is caught', () => {
  const two = { heading: 'Android', steps: ['Download it.', 'Open it.'] };
  const enTwo = { ...en, sections: [two, { heading: 'Update', steps: ['Install over it.'] }] };
  const viShort = lang({ sections: [{ heading: 'Android', steps: ['Tải.', 'Mở.'] }] });
  assert.deepEqual(installProblems({ en: enTwo, vi: viShort }, appLangs, known),
    ['vi: has 1 section(s), en has 2 — every language says what en says']);
  const viStep = lang({ sections: [{ heading: 'Android', steps: ['Tải.'] }, { heading: 'Cập nhật', steps: ['Cài.'] }] });
  assert.deepEqual(installProblems({ en: enTwo, vi: viStep }, appLangs, known),
    ['vi: section 1 has 1 step(s), en has 2 — every language says what en says']);
});

test('one install file per app, named after it', () => {
  const f = (file: string, app: string) => ({ file, app });
  assert.deepEqual(installFileProblems([f('install/logger.md', 'logger'), f('install/hangil.md', 'hangil')]), []);
  assert.deepEqual(installFileProblems([f('install/foo.md', 'logger')]),
    ['install/foo.md says app: logger — name it install/logger.md']);
  assert.deepEqual(installFileProblems([f('install/logger.md', 'logger'), f('install/zz-dup.md', 'logger')]), [
    'install/zz-dup.md says app: logger — name it install/logger.md',
    'install/logger.md and install/zz-dup.md are both for logger — keep one',
  ]);
  // The real file name, not the loader's slug of it: Logger.md would be found as "logger",
  // and "logger 2.md" reported as install/logger-2.md, a file that is not there.
  assert.deepEqual(installFileProblems([f('install/Logger.md', 'logger')]),
    ['install/Logger.md says app: logger — name it install/logger.md']);
  assert.deepEqual(installFileProblems([f('install/logger.md', 'logger'), f('install/logger 2.md', 'logger')]), [
    'install/logger 2.md says app: logger — name it install/logger.md',
    'install/logger.md and install/logger 2.md are both for logger — keep one',
  ]);
});
