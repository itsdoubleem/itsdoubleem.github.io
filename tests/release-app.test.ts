// Tests for tools/release-lib.mjs — what the release command refuses, without an app repo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { changelogSection, gradleVersion, releaseProblems } from '../tools/release-lib.mjs';

const SIGNER = 'e'.repeat(64);
const ok = {
  version: '1.2.0', tagExists: false, latest: '1.1.0', clean: true, branch: 'main', defaultBranch: 'main',
  inSync: true, notes: 'Better.', signer: SIGNER, had: ['android.permission.VIBRATE'],
  apk: { versionName: '1.2.0', signers: [SIGNER], permissions: ['android.permission.VIBRATE'] },
};

test('a clean, new, signed release with notes passes', () => {
  assert.deepEqual(releaseProblems(ok), []);
});

test('each thing the command refuses is named', () => {
  const says = (over: object, re: RegExp) => assert.match(releaseProblems({ ...ok, ...over }).join('|'), re);
  says({ clean: false }, /uncommitted/);
  says({ branch: 'feat/x' }, /on feat\/x/);
  says({ inSync: false }, /not level/);
  says({ tagExists: true }, /already exists/);
  says({ latest: '1.2.0' }, /not newer/);
  says({ notes: '' }, /no release notes/);
  says({ notes: 'SHA-256 ' + 'a'.repeat(64) }, /no release notes/);
  says({ apk: null }, /APK is missing/);
  says({ apk: { ...ok.apk, versionName: '1.1.9' } }, /versionName 1\.1\.9/);
  says({ apk: { ...ok.apk, signers: ['0'.repeat(64)] } }, /not the pinned/);
  says({ apk: { ...ok.apk, permissions: ['android.permission.INTERNET'] } }, /INTERNET/);
});

test('an unreadable version stops everything', () => {
  assert.match(releaseProblems({ ...ok, version: null })[0], /versionName/);
});

test('the version is read from either quote style', () => {
  assert.equal(gradleVersion("android {\n        versionName '1.0.2'\n}"), '1.0.2');
  assert.equal(gradleVersion('        versionName "1.4.1"'), '1.4.1');
  assert.equal(gradleVersion('versionCode 3'), null);
});

test('the changelog section is the one naming this exact version, up to the next of its level', () => {
  const log = '# Log\n\n## v1.0.2 — 2026-10-11\n\nTwelve sets.\n\n### Fixed\n\nA.\n\n## v1.0.21\n\nNot me.\n\n## 1.0\n\nOld.\n';
  assert.equal(changelogSection(log, '1.0.2'), 'Twelve sets.\n\n### Fixed\n\nA.');
  assert.equal(changelogSection(log, '1.0'), 'Old.');
  assert.equal(changelogSection(log, '3.0'), '');
});
