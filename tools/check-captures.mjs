/* Says which apps' screenshots show an older version than the site serves.
 *
 *   node tools/check-captures.mjs            print it
 *   node tools/check-captures.mjs --issue    and keep one Issue open while it is so (watch.yml)
 *
 * Reads apps/*.md only: `captured:` is written by the sync when it moves an app past its
 * pictures, and deleted by `npm run retake -- <slug>` (tools/captures-lib.mjs). It never fails
 * the run. Old pictures are a job to do, not a broken site. */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { issueText, staleCaptures } from './captures-lib.mjs';
import { issues } from './issues.mjs';

const root = join(fileURLToPath(import.meta.url), '../..');
const apps = readdirSync(join(root, 'apps'))
  .filter((f) => f.endsWith('.md') && f !== 'README.md')
  .map((f) => ({ slug: f.replace(/\.md$/, ''), md: readFileSync(join(root, 'apps', f), 'utf8') }));
const stale = staleCaptures(apps);

for (const a of stale) console.log(`check-captures: ${a.name}'s pictures are from ${a.captured}; the site serves ${a.served}. On the Mac: npm run retake -- ${a.slug}`);
if (!stale.length) console.log('check-captures: every app\'s pictures show the version the site serves');

if (process.argv.includes('--issue')) {
  const gh = issues({ repo: process.env.GITHUB_REPOSITORY, token: process.env.GITHUB_TOKEN });
  if (stale.length) {
    const { title, body } = issueText(stale);
    await gh.raise('captures', title, body);
  } else {
    await gh.clear('captures', 'Every app\'s pictures now show the version the site serves.');
  }
}
