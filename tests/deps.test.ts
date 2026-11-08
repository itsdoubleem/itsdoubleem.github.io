import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { failedMarker, mergeMessage, parseBump, refusal, versionChange } from '../tools/deps-lib.mjs';

const repo = 'o/site';
const day = 86400000;
const now = Date.parse('2026-11-08T00:00:00Z');
const sha = 'a'.repeat(40);
const pr = (over: Record<string, unknown> = {}) => ({
  number: 34,
  title: 'chore(deps): bump astro from 7.3.2 to 7.3.3',
  user: { login: 'dependabot[bot]' },
  draft: false,
  created_at: new Date(now - 4 * day).toISOString(),
  base: { ref: 'main' },
  head: { ref: 'dependabot/npm_and_yarn/astro-7.3.3', sha, repo: { full_name: repo } },
  ...over,
});
const commit = (over: Record<string, unknown> = {}) => ({
  sha,
  author: { login: 'dependabot[bot]' },
  committer: { login: 'web-flow' },
  commit: { verification: { verified: true } },
  ...over,
});
const decide = (p = pr(), files = ['package.json', 'package-lock.json'], commits = [commit()]) =>
  refusal({ pr: p, files, commits, repo, now });

test('versions: patch and minor are small; a 0.x minor and any major are not', () => {
  assert.equal(versionChange('7.3.2', '7.3.3'), 'patch');
  assert.equal(versionChange('1.8.0', '1.9.1'), 'minor');
  assert.equal(versionChange('0.35.4', '0.35.5'), 'patch');
  assert.equal(versionChange('0.35.4', '0.36.0'), 'major');
  assert.equal(versionChange('7.3.2', '8.0.0'), 'major');
  assert.equal(versionChange('7.3.2', '7.4.0-beta.1'), null);
  assert.equal(versionChange('7.3.2', '7.3.2'), null);
  assert.equal(versionChange('0.0.3', '0.0.4'), 'major'); // ^0.0.3 means exactly 0.0.3
});

test('titles: one package at the top level, scoped names included; groups and folders are not', () => {
  assert.deepEqual(parseBump('chore(deps): bump astro from 7.3.2 to 7.3.3'), { name: 'astro', from: '7.3.2', to: '7.3.3' });
  assert.deepEqual(parseBump('chore(deps-dev): Bump @types/node from 22.1.0 to 22.2.0')?.name, '@types/node');
  assert.equal(parseBump('chore(deps): bump the npm group with 3 updates'), null);
  assert.equal(parseBump('chore(deps): bump vite from 8.3.0 to 8.3.4 in /docs'), null);
});

test('a small, old, signed Dependabot update may merge; every rule refuses on its own', () => {
  assert.equal(decide(), null);
  assert.match(decide(pr({ user: { login: 'someone' } }))!, /not opened by Dependabot/);
  assert.match(decide(pr({ draft: true }))!, /draft/);
  assert.match(decide(pr({ base: { ref: 'dev' } }))!, /not main/);
  assert.match(decide(pr({ head: { ...pr().head, repo: { full_name: 'x/fork' } } }))!, /another repository/);
  assert.match(decide(pr({ head: { ...pr().head, ref: 'dependabot/github_actions/x' } }))!, /not an npm update/);
  assert.match(decide(pr({ title: 'chore(deps): bump astro from 7.3.2 to 8.0.0' }))!, /major/);
  assert.match(decide(pr({ title: 'chore(deps): bump the npm group with 3 updates' }))!, /single package/);
  assert.match(decide(pr({ created_at: new Date(now - 2 * day).toISOString() }))!, /open 2 of 3 days/);
  assert.match(decide(pr({ created_at: 'not a date' }))!, /days/);
  assert.match(decide(pr(), ['package.json', '.github/workflows/deploy.yml'])!, /changes \.github/);
  assert.match(decide(pr(), undefined, [commit(), commit()])!, /2 commits/);
  assert.match(decide(pr(), undefined, [commit({ sha: 'b'.repeat(40) })])!, /head moved/);
  assert.match(decide(pr(), undefined, [commit({ author: { login: 'someone' } })])!, /not made by Dependabot/);
  assert.match(decide(pr(), undefined, [commit({ committer: { login: 'someone' } })])!, /not made by Dependabot/);
  assert.match(decide(pr(), undefined, [commit({ commit: { verification: { verified: false } } })])!, /not verified/);
});

test('an update that failed on main is skipped until Dependabot rebases it, and only this workflow\'s note counts', () => {
  const note = (login: string, s = sha) => ({ user: { login }, body: `failed\n\n${failedMarker(s)}` });
  const withNotes = (comments: object[]) => refusal({ pr: pr(), files: ['package.json'], commits: [commit()], comments, repo, now });
  assert.match(withNotes([note('github-actions[bot]')])!, /failed on main at this commit/);
  assert.equal(withNotes([note('github-actions[bot]', 'b'.repeat(40))]), null); // rebased: a new commit
  assert.equal(withNotes([note('someone')]), null); // a stranger cannot block an update
});

test('the merge message carries no trailer and no other author', () => {
  const m = mergeMessage(pr());
  assert.match(m, /^chore\(deps\): bump astro from 7\.3\.2 to 7\.3\.3\n\n.*#34\.\n$/);
  assert.doesNotMatch(m, /co-authored-by|signed-off-by|dependabot/i);
});

/* tools/apply-dep.sh against a real remote: main, and a Dependabot-style branch off an older main. */
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();
const script = resolve('tools/apply-dep.sh');

function world(depChange: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), 'deps-'));
  const remote = join(dir, 'remote.git');
  const work = join(dir, 'work');
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', remote]);
  execFileSync('git', ['init', '-q', '-b', 'main', work]);
  writeFileSync(join(work, 'package.json'), '{\n  "astro": "7.3.2"\n}\n');
  writeFileSync(join(work, 'package-lock.json'), '{\n  "astro": "7.3.2",\n  "vite": "8.3.0"\n}\n');
  writeFileSync(join(work, 'index.md'), 'one\n');
  git(work, 'add', '-A');
  git(work, 'commit', '-qm', 'base');
  git(work, 'push', '-q', remote, 'HEAD:main');
  git(work, 'checkout', '-qb', 'dep');
  depChange(work);
  git(work, 'commit', '-qam', 'bump');
  const dep = git(work, 'rev-parse', 'HEAD');
  git(work, 'push', '-q', remote, 'HEAD:refs/heads/dep');
  // main moves on in an unrelated file, as it does while a pull request waits.
  git(work, 'checkout', '-q', 'main');
  writeFileSync(join(work, 'index.md'), 'two\n');
  git(work, 'commit', '-qam', 'later');
  git(work, 'push', '-q', remote, 'HEAD:main');
  // A job's checkout: main only, one commit deep, origin set, no credentials.
  const job = join(dir, 'job');
  execFileSync('git', ['clone', '-q', '--depth=1', '-b', 'main', `file://${remote}`, job]);
  const run = () => spawnSync('bash', [script, dep], { cwd: job, encoding: 'utf8' });
  return { dir, remote, job, dep, run, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

const bumpAstro = (w: string) => {
  writeFileSync(join(w, 'package.json'), '{\n  "astro": "7.3.3"\n}\n');
  writeFileSync(join(w, 'package-lock.json'), '{\n  "astro": "7.3.3",\n  "vite": "8.3.0"\n}\n');
};

test('apply-dep: the same main and commit always make the same tree, and that tree pushes as a fast-forward', () => {
  const w = world(bumpAstro);
  try {
    const first = w.run();
    assert.equal(first.status, 0, first.stderr);
    const tree = first.stdout.trim();
    assert.match(tree, /^[0-9a-f]{40}$/);
    assert.match(readFileSync(join(w.job, 'package.json'), 'utf8'), /7\.3\.3/);
    assert.equal(readFileSync(join(w.job, 'index.md'), 'utf8'), 'two\n'); // main's change kept
    git(w.job, 'reset', '-q', '--hard', 'origin/main');
    assert.equal(w.run().stdout.trim(), tree);
    // The merge job's commit on the depth-1 checkout reaches the remote's main.
    git(w.job, 'commit', '-qm', 'chore(deps): bump astro from 7.3.2 to 7.3.3');
    assert.equal(spawnSync('git', ['push', '-q', 'origin', 'HEAD:refs/heads/main'], { cwd: w.job }).status, 0);
    assert.equal(git(w.remote, 'rev-parse', 'main^{tree}'), tree);
  } finally {
    w.cleanup();
  }
});

test('apply-dep: a commit touching anything else is refused and the tree is left alone', () => {
  const w = world((dir) => {
    bumpAstro(dir);
    writeFileSync(join(dir, 'index.md'), 'evil\n');
  });
  try {
    const r = w.run();
    assert.equal(r.status, 1);
    assert.match(r.stderr, /changes index\.md/);
    assert.equal(git(w.job, 'status', '--porcelain'), '');
  } finally {
    w.cleanup();
  }
});

test('apply-dep: a change that no longer applies fails without changing the tree', () => {
  const w = world(bumpAstro);
  try {
    // main has moved the same lines the update changes.
    writeFileSync(join(w.job, 'package-lock.json'), '{\n  "astro": "7.3.2",\n  "vite": "8.3.4"\n}\n');
    git(w.job, 'commit', '-qam', 'vite');
    const before = git(w.job, 'rev-parse', 'HEAD^{tree}');
    const r = w.run();
    assert.notEqual(r.status, 0);
    assert.equal(git(w.job, 'status', '--porcelain'), '');
    assert.equal(git(w.job, 'rev-parse', 'HEAD^{tree}'), before);
  } finally {
    w.cleanup();
  }
});

test('apply-dep: refuses anything that is not a full commit sha', () => {
  const r = spawnSync('bash', [script, 'main; rm -rf /'], { encoding: 'utf8' });
  assert.equal(r.status, 2);
});

test('deps.yml: npm runs only in the job that cannot write; the writing job merges as the owner', () => {
  const yml = readFileSync('.github/workflows/deps.yml', 'utf8');
  // The spliced lockfile is checked by name before the tests run.
  assert.match(yml, /npm ci --ignore-scripts\n(\s+#.*\n)*\s+- run: npm ls --all/);
  const job = (name: string, next?: string) => yml.slice(yml.indexOf(`\n  ${name}:`), next ? yml.indexOf(`\n  ${next}:`) : undefined);
  const [pick, verify, merge] = [job('pick', 'verify'), job('verify', 'merge'), job('merge', 'report')];
  assert.doesNotMatch(pick + merge, /^(?!\s*#).*\bnpm (ci|install|run|test)/m);
  assert.match(verify, /npm ci --ignore-scripts/);
  assert.doesNotMatch(verify, /^(?!\s*#).*write/m);
  assert.match(merge, /user\.email 328792799\+itsdoubleem@users\.noreply\.github\.com/);
  assert.match(merge, /group: sync-promote/);
  assert.match(merge, /--recheck/);
  // The deploy is asked for before anything that could fail after the push.
  assert.ok(merge.indexOf('gh workflow run deploy.yml') < merge.indexOf('gh pr close'));
  assert.match(merge, /gh pr close[\s\S]*\|\| echo "::warning::/);
  const report = yml.slice(yml.indexOf('\n  report:'));
  assert.match(report, /needs\.verify\.result == 'failure'/);
  assert.match(report, /doubleem:deps-failed:\$HEAD_SHA/);
  assert.doesNotMatch(report, /^(?!\s*#).*\b(npm|checkout)/m);
  for (const uses of yml.match(/uses: \S+/g)!) assert.match(uses, /@[0-9a-f]{40}$/);
});
