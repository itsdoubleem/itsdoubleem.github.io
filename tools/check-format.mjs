/* Every app page has the same sections in the same order, follows its GitHub Releases the same
 * way, and says nothing the hard rules ban. Exits non-zero, so it gates a deploy.
 *
 *   node tools/check-format.mjs      (or: npm run check, which CI runs)
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { blockedPhrases, pageProblems } from './format-lib.mjs';

const root = join(fileURLToPath(import.meta.url), '../..');
const pages = (dir) => (existsSync(join(root, dir)) ? readdirSync(join(root, dir)) : [])
  .filter((f) => f.endsWith('.md') && f !== 'README.md');

const problems = [];
const apps = pages('apps');
for (const name of apps) {
  for (const p of pageProblems(readFileSync(join(root, 'apps', name), 'utf8'))) problems.push(`apps/${name} ${p}`);
}
for (const dir of ['guides', 'install', 'releases']) {
  for (const name of pages(dir)) {
    for (const w of blockedPhrases(readFileSync(join(root, dir, name), 'utf8'))) problems.push(`${dir}/${name} says something banned: ${w}`);
  }
}
if (!apps.length) problems.push('apps/ has no pages — has the layout moved?');
if (problems.length) {
  console.error(`check-format: ${problems.length} problem(s)\n  - ${problems.join('\n  - ')}`);
  process.exit(1);
}
console.log(`check-format: ${apps.length} app page(s) share one format, and nothing says what the rules ban`);
