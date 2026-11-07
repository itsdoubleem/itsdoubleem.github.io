/* Checks the site people actually get against GitHub, and says so where it will be seen.
 *
 *   node tools/check-live.mjs            print what is wrong; exit 1 if anything is
 *   node tools/check-live.mjs --issue    also keep one GitHub Issue open while it is wrong,
 *                                        and close it when it is not; always exit 0, because
 *                                        the Issue is the alarm, not a red run
 *
 * It downloads the live APKs and reads the live pages rather than trusting the repository.
 * Everything the repository said was fine for the twelve days in October 2026 when the live
 * site served an old build under an expired pill: only the deploy job knew, and it told
 * nobody who was looking. Needs nothing installed.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { issues } from './issues.mjs';
import { appProblems, deployProblems, livePill } from './live-lib.mjs';
import { releaseField } from './sync-lib.mjs';

const root = join(fileURLToPath(import.meta.url), '../..');
const SITE = 'https://itsdoubleem.github.io';
const repo = process.env.GITHUB_REPOSITORY ?? 'itsdoubleem/itsdoubleem.github.io';
const token = process.env.GITHUB_TOKEN;
const raise = process.argv.includes('--issue');

const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'doubleem-site-watch', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
const api = async (path) => {
  const res = await fetch(`https://api.github.com/${path}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
};
// A cache-busting query, so a CDN copy cannot make a stale site look fresh or the reverse.
const live = (path) => fetch(`${SITE}${path}?check=${Date.now()}`, { headers: { 'User-Agent': 'doubleem-site-watch' } });

// A deploy in flight is not a site out of date. Its completion runs this check again.
if (raise) {
  try {
    const running = await api(`repos/${repo}/actions/workflows/deploy.yml/runs?status=in_progress&per_page=1`);
    if (running?.total_count) {
      console.log('check-live: a deploy is running, so its finish will check again.');
      process.exit(0);
    }
  } catch (e) {
    console.log(`::warning::could not ask whether a deploy is running — ${e.message}`);
  }
}

const problems = [];
// What could not be checked. It proves nothing either way, so it never closes an alarm.
let unchecked = 0;
for (const name of readdirSync(join(root, 'apps')).filter((f) => f.endsWith('.md') && f !== 'README.md')) {
  const md = readFileSync(join(root, 'apps', name), 'utf8');
  const slug = name.replace(/\.md$/, '');
  const apk = releaseField(md, 'apk');
  if (!apk) continue;
  try {
    const source = releaseField(md, 'source');
    const [latest, apkRes, pageRes] = await Promise.all([
      source ? api(`repos/${source}/releases/latest`) : null,
      live(apk),
      live(`/apps/${slug}/`),
    ]);
    const liveSha = apkRes.ok ? createHash('sha256').update(Buffer.from(await apkRes.arrayBuffer())).digest('hex') : null;
    if (!pageRes.ok) problems.push(`${slug}: the live app page returned HTTP ${pageRes.status}`);
    problems.push(...appProblems({
      app: { slug, version: releaseField(md, 'version'), sha256: releaseField(md, 'sha256'), date: releaseField(md, 'date') },
      latest,
      liveSha,
      pill: pageRes.ok ? livePill(await pageRes.text()) : null,
    }));
  } catch (e) {
    unchecked++;
    console.error(`::warning::${slug}: could not check — ${e.message}`);
  }
}
try {
  const deployments = await api(`repos/${repo}/deployments?environment=github-pages&per_page=1`);
  problems.push(...deployProblems({ lastDeploy: deployments?.[0]?.created_at ?? null }));
} catch (e) {
  unchecked++;
  console.error(`::warning::could not read deployments — ${e.message}`);
}

for (const p of problems) console.log(`- ${p}`);
if (!problems.length) {
  console.log(unchecked
    ? `check-live: nothing wrong found, but ${unchecked} check(s) could not run, so this says nothing.`
    : 'check-live: the live site matches main and GitHub, and no pill has overstayed.');
}

if (raise) {
  const board = issues({ repo, token });
  if (problems.length) {
    await board.raise('site-behind', 'The live site is out of date', `tools/check-live.mjs found this on the live site:\n\n${problems.map((p) => `- ${p}`).join('\n')}\n\nThis Issue closes by itself when the check next passes.`);
  } else if (!unchecked) {
    await board.clear('site-behind', 'The live site matches main and GitHub again.');
  }
  process.exit(0);
}
process.exit(problems.length || unchecked ? 1 : 0);
