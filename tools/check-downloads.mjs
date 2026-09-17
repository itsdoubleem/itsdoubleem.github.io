/* Checks every download the site advertises against the file it actually serves.
 *
 *   node tools/check-downloads.mjs
 *
 * An app page states two facts about its APK: its size and its SHA-256. Both are
 * typed by hand into `apps/<slug>.md`, and README.md repeats the hash as the
 * second opinion that lives on github.com rather than on the site. Three copies
 * of a fact, none of them derived from the file — so any of them can go stale
 * without a single thing breaking.
 *
 * It had. HANGIL's page said 1.4 MB about a 2.6 MB APK, left behind by a build
 * the page was never updated for. Nobody would have caught that by reading the
 * page; it looks exactly as right as the true number would.
 *
 * This is hard rule 1 wearing work clothes — a number on the site that nothing
 * verifies is a number the site is inventing. Exits non-zero, so it can gate a
 * deploy.
 */
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';

const root = new URL('..', import.meta.url);
const readme = await readFile(new URL('README.md', root), 'utf8');
const problems = [];
let checked = 0;

for (const name of (await readdir(new URL('apps/', root))).filter(f => f.endsWith('.md'))) {
  const slug = name.slice(0, -3);
  if (slug === 'README') continue;
  const md = await readFile(new URL(`apps/${name}`, root), 'utf8');

  // The two claims, as the page words them.
  const size = md.match(/note:\s*APK,\s*([\d.]+)\s*MB/);
  const hash = md.match(/\b([0-9a-f]{64})\b/);
  if (!size && !hash) continue;

  let apk;
  try {
    apk = await readFile(new URL(`public/downloads/${slug}.apk`, root));
  } catch {
    problems.push(`${name}: claims an APK but public/downloads/${slug}.apk is not there`);
    continue;
  }
  checked++;

  // Sizes on the pages are MiB to one decimal — what a phone shows.
  const real = (apk.length / 1048576).toFixed(1);
  if (size && size[1] !== real) {
    problems.push(`${name}: says ${size[1]} MB, the file is ${real} MB`);
  }

  const sum = createHash('sha256').update(apk).digest('hex');
  if (hash && hash[1] !== sum) {
    problems.push(`${name}: prints a hash that is not this file's\n    page ${hash[1]}\n    file ${sum}`);
  }
  if (!readme.includes(sum)) {
    problems.push(`README.md: no hash for ${slug}.apk — the second-opinion copy is stale`);
  }
}

if (!checked) {
  console.error('check-downloads: found no APKs to check — has the layout moved?');
  process.exit(1);
}
if (problems.length) {
  console.error(`check-downloads: ${problems.length} problem(s)\n  - ${problems.join('\n  - ')}`);
  process.exit(1);
}
console.log(`check-downloads: ${checked} download(s), size and hash match in both places`);
