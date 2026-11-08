/* Picks the Dependabot pull request deps.yml may test and merge by itself (rules: deps-lib.mjs).
 *
 *   node tools/pick-deps.mjs                    list every open Dependabot PR and the decision
 *   node tools/pick-deps.mjs --recheck <n> <sha>  ask again just before merging; prints the
 *                                                 commit message, or exits 1 if it may not
 *
 * With GITHUB_OUTPUT set, the first form writes every one allowed, oldest first, as
 * `candidates` ("13:<sha> 14:<sha>"). deps.yml takes the first that still applies to main.
 * It reads the GitHub API with GITHUB_TOKEN (pull requests: read) and runs nothing else. */
import { appendFileSync } from 'node:fs';
import { mergeMessage, refusal } from './deps-lib.mjs';

const repo = process.env.GITHUB_REPOSITORY || 'itsdoubleem/itsdoubleem.github.io';
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'doubleem-site-deps' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
const api = async (path) => {
  const res = await fetch(`https://api.github.com/repos/${repo}${path}`, { headers });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
};

const decide = async (pr) => {
  const files = (await api(`/pulls/${pr.number}/files?per_page=100`)).map((f) => f.filename);
  const commits = await api(`/pulls/${pr.number}/commits?per_page=100`);
  return refusal({ pr, files, commits, repo });
};

const args = process.argv.slice(2);
if (args[0] === '--recheck') {
  const [, number, sha] = args;
  const pr = await api(`/pulls/${Number(number)}`);
  const why = pr.state !== 'open' ? `it is ${pr.state}` : pr.head.sha !== sha ? 'its head moved since it was tested' : await decide(pr);
  if (why) {
    console.error(`#${number} may not be merged by itself: ${why}`);
    process.exit(1);
  }
  process.stdout.write(mergeMessage(pr));
  process.exit(0);
}

const open = (await api('/pulls?state=open&per_page=100'))
  .filter((p) => p.user?.login === 'dependabot[bot]')
  .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
const allowed = [];
for (const pr of open) {
  const why = await decide(pr);
  console.log(`#${pr.number} ${pr.title}: ${why ?? 'may merge by itself'}`);
  if (!why) allowed.push(`${pr.number}:${pr.head.sha}`);
}
if (!open.length) console.log('No open Dependabot pull requests.');
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `candidates=${allowed.join(' ')}\n`);
