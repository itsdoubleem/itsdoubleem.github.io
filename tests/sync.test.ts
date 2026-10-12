// Tests for tools/sync-lib.mjs — the parts of the hourly app sync that need no network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanNotes, compareVersions, kstDate, releaseField, setReleaseField } from '../tools/sync-lib.mjs';

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
