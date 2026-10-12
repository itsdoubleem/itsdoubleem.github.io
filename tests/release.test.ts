// Tests for the pure parts of src/release.ts. Run with `npm test` — Node's own runner,
// which reads TypeScript directly, so there is nothing to install.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { manifestIcons, noticeIsLive, publicPath, releaseIsNew, webDir } from '../src/release.ts';

test('reads 192 and 512 icons, resolving relative src against the folder', () => {
  const icons = manifestIcons(
    { icons: [{ src: 'icon-192.png', sizes: '192x192' }, { src: './icon-512.png', sizes: '512x512', purpose: 'any' }] },
    '/app/',
  );
  assert.deepEqual(icons, { 192: '/app/icon-192.png', 512: '/app/icon-512.png' });
});

test('an icon marked "any maskable" never stands in for the plain one', () => {
  const icons = manifestIcons(
    {
      icons: [
        { src: 'icon-512.png', sizes: '512x512' },
        { src: 'icon-maskable-512.png', sizes: '512x512', purpose: 'any maskable' },
      ],
    },
    '/app/',
  );
  assert.deepEqual(icons, { 512: '/app/icon-512.png' });
});

test('maskable-only and monochrome icons are left out', () => {
  const icons = manifestIcons(
    {
      icons: [
        { src: 'm.png', sizes: '512x512', purpose: 'maskable' },
        { src: 'mono.png', sizes: '192x192', purpose: 'monochrome' },
      ],
    },
    '/app/',
  );
  assert.deepEqual(icons, {});
});

test('a manifest with no icons, a null one, or an icon with no src gives nothing, not a crash', () => {
  assert.deepEqual(manifestIcons(null, '/app/'), {});
  assert.deepEqual(manifestIcons({}, '/app/'), {});
  assert.deepEqual(manifestIcons({ icons: [{ sizes: '512x512' }] }, '/app/'), {});
});

test('sizes may be written with a capital X or list several sizes', () => {
  assert.deepEqual(manifestIcons({ icons: [{ src: 'a.png', sizes: '512X512' }] }, '/app/'), { 512: '/app/a.png' });
  assert.deepEqual(manifestIcons({ icons: [{ src: 'b.png', sizes: '192x192 512x512' }] }, '/app/'), {
    192: '/app/b.png',
    512: '/app/b.png',
  });
});

test('src resolves as a browser would, and an icon on another site does not count', () => {
  const icons = manifestIcons(
    {
      icons: [
        { src: 'https://cdn.example/icon-512.png', sizes: '512x512' },
        { src: '../shared/icon-512.png', sizes: '512x512' },
        { src: '/abs/icon-192.png', sizes: '192x192' },
      ],
    },
    '/app/',
  );
  assert.deepEqual(icons, { 192: '/abs/icon-192.png', 512: '/shared/icon-512.png' });
});

test('webDir normalises a release.web value to its folder', () => {
  for (const web of ['/hangil', '/hangil/', '/hangil/?v=2', '/hangil#top']) assert.equal(webDir(web), '/hangil/');
});

test('publicPath decodes a percent-encoded path, as the server does', () => {
  // manifestIcons keeps the encoded href for the HTML; the file on disk has the plain name.
  assert.ok(publicPath('/app/icon%20512.png').endsWith(join('public', 'app', 'icon 512.png')));
  assert.ok(publicPath('/%ED%95%9C%EA%B8%B8/icon-512.png').endsWith(join('public', '한길', 'icon-512.png')));
  // Malformed escapes are not a crash: the raw text is used.
  assert.ok(publicPath('/app/100%.png').endsWith(join('public', 'app', '100%.png')));
});

test('a release is new for seven Korean days, its release day counting as the first', () => {
  const release = { date: new Date('2026-10-12') };
  assert.equal(releaseIsNew(release, new Date('2026-10-11T23:59:59+09:00')), false);
  assert.equal(releaseIsNew(release, new Date('2026-10-12T00:00:00+09:00')), true);
  assert.equal(releaseIsNew(release, new Date('2026-10-12T06:21:00+09:00')), true);
  assert.equal(releaseIsNew(release, new Date('2026-10-18T23:59:59+09:00')), true);
  assert.equal(releaseIsNew(release, new Date('2026-10-19T00:00:00+09:00')), false);
  assert.equal(releaseIsNew(undefined), false);
});

test('a notice with no until goes when its release stops being new; one with until keeps to it', () => {
  const release = { date: new Date('2026-10-11') };
  assert.equal(noticeIsLive({}, release, new Date('2026-10-17T23:00:00+09:00')), true);
  assert.equal(noticeIsLive({}, release, new Date('2026-10-18T00:00:00+09:00')), false);
  const until = { until: new Date('2026-12-31') };
  assert.equal(noticeIsLive(until, release, new Date('2026-12-31T23:00:00+09:00')), true);
  assert.equal(noticeIsLive(until, release, new Date('2027-01-01T00:00:00+09:00')), false);
  assert.equal(noticeIsLive(undefined, release), false);
});
