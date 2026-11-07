// The one part of deploy.yml that can be tried without GitHub: moving main to a candidate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();

/* A remote with main at A and sync/candidate at B on top of it, fetched as a job's checkout
 * fetches it. Returns whether pushing the candidate to main works from that checkout. */
function promoteFrom(depth: number) {
  const dir = mkdtempSync(join(tmpdir(), 'promote-'));
  try {
    const remote = join(dir, 'remote.git');
    const work = join(dir, 'work');
    const job = join(dir, 'job');
    execFileSync('git', ['init', '-q', '--bare', '-b', 'main', remote]);
    execFileSync('git', ['init', '-q', '-b', 'main', work]);
    for (const name of ['A', 'B']) {
      writeFileSync(join(work, 'f'), name);
      git(work, 'add', 'f');
      git(work, 'commit', '-qm', name);
      git(work, 'push', '-q', remote, name === 'A' ? 'HEAD:main' : 'HEAD:refs/heads/sync/candidate');
    }
    execFileSync('git', ['init', '-q', job]);
    git(job, 'fetch', '-q', `--depth=${depth}`, `file://${remote}`, 'sync/candidate');
    git(job, 'checkout', '-q', 'FETCH_HEAD');
    return spawnSync('git', ['push', '-q', `file://${remote}`, 'HEAD:refs/heads/main'], { cwd: job }).status === 0;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('promote needs the parent commit on disk, so it fetches two commits', () => {
  // A depth-1 checkout has no main tip to show a fast-forward with, and git refuses the push.
  assert.equal(promoteFrom(1), false);
  assert.equal(promoteFrom(2), true);
  const yml = readFileSync('.github/workflows/deploy.yml', 'utf8');
  const job = yml.slice(yml.indexOf('\n  promote:'), yml.indexOf('\n  build:'));
  assert.match(job, /fetch-depth: 2/);
});
