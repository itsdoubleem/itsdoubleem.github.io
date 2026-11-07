/* Starts a new app page in the shared format.
 *
 *   npm run new-app -- <slug> "<Name>" [owner/repo]
 *
 * It writes apps/<slug>.md and nothing else. `npm run check` fails on every TODO left in it,
 * so a half-filled page cannot deploy. */
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { newAppPage } from './format-lib.mjs';

const root = join(fileURLToPath(import.meta.url), '../..');
const [slug, name, source] = process.argv.slice(2);
if (!/^[a-z][a-z0-9-]*$/.test(slug ?? '') || !name) {
  console.error('usage: npm run new-app -- <slug> "<Name>" [owner/repo]   (slug: lowercase letters, digits, hyphens)');
  process.exit(1);
}
const file = join(root, 'apps', `${slug}.md`);
if (existsSync(file)) {
  console.error(`apps/${slug}.md already exists`);
  process.exit(1);
}
writeFileSync(file, newAppPage({ slug, name, source }));
console.log(`Wrote apps/${slug}.md. To finish it:

  1. Replace every TODO. apps/README.md explains each field.
  2. Put the icon at public/assets/${slug}/icon.png and the first APK at public/downloads/${slug}.apk.
  3. Add "<sha256>  ${slug}.apk" to the hash list in README.md, and the same hash in release.sha256.
  4. npm run build && npm run check

After that, updates come from GitHub Releases. Add LISTING.md to the app's repo to keep
the description there too (apps/README.md).`);
