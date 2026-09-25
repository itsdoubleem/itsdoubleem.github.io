// Tests for the pure parts of src/release.ts. Run with `npm test` — Node's own runner,
// which reads TypeScript directly, so there is nothing to install.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { manifestIcons } from '../src/release.ts';

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
