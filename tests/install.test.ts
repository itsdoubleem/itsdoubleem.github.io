// Tests for src/install.ts — the rules an install translation must follow.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installOrder, installProblems, type InstallLanguage } from '../src/install.ts';

const lang = (over: Partial<InstallLanguage> = {}): InstallLanguage => ({
  checked: false,
  unchecked: 'Chưa được người bản ngữ kiểm tra.',
  title: 'Cách cài đặt',
  sections: [{ heading: 'Android', steps: ['Tải tệp {apkSize}.'] }],
  ...over,
});
const appLangs = ['ko', 'en', 'vi', 'zh'];
const known = ['version', 'apkSize', 'sha256'];

test('a well-formed unchecked translation passes', () => {
  assert.deepEqual(installProblems({ vi: lang() }, appLangs, known), []);
});

test('an unchecked translation must say so', () => {
  const p = installProblems({ vi: lang({ unchecked: '  ' }) }, appLangs, known);
  assert.equal(p.length, 1);
  assert.match(p[0], /^vi: checked is false/);
});

test('a checked translation must drop the warning', () => {
  const p = installProblems({ vi: lang({ checked: true }) }, appLangs, known);
  assert.match(p[0], /delete the unchecked: line/);
  assert.deepEqual(installProblems({ vi: lang({ checked: true, unchecked: undefined }) }, appLangs, known), []);
});

test('a language the app does not speak is refused', () => {
  const p = installProblems({ km: lang() }, appLangs, known);
  assert.equal(p.length, 1);
  assert.match(p[0], /^km: the app does not list km/);
});

test('English is the source, so it must be marked checked', () => {
  const en = { checked: true, title: 'How to install', sections: [{ heading: 'Android', steps: ['Tap it.'] }] };
  assert.deepEqual(installProblems({ en }, appLangs, known), []);
  assert.ok(installProblems({ en: lang() }, appLangs, known).some((m) => m.startsWith('en: the English is the source')));
});

test('an app with no languages: list can offer none', () => {
  assert.match(installProblems({ vi: lang() }, undefined, known)[0], /does not list vi/);
});

test('a token the app cannot fill is caught, wherever it is', () => {
  const p = installProblems(
    { vi: lang({ title: 'Cài {webSize}', sections: [{ heading: 'Web', steps: ['{nope}'] }] }) },
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
