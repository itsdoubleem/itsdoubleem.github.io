// Tests for tools/live-lib.mjs and tools/issues.mjs — the watcher's decisions, without the network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appProblems, deployProblems, livePill } from '../tools/live-lib.mjs';
import { issues } from '../tools/issues.mjs';

const app = { slug: 'x', version: '1.1.0', sha256: 'a'.repeat(64), date: '2026-10-21' };
const now = new Date('2026-10-23T00:00:00Z');
const ok = { app, latest: null, liveSha: app.sha256, pill: null, now };

test('a site that matches main and GitHub has no problems', () => {
  assert.deepEqual(appProblems(ok), []);
  assert.deepEqual(appProblems({ ...ok, latest: { tag_name: 'v1.1.0', published_at: '2026-10-21T00:00:00Z', assets: [] } }), []);
});

test('the October failure is reported: a different live APK, and a pill past its days', () => {
  const nov7 = new Date('2026-11-07T00:00:00Z');
  const stale = appProblems({ app, latest: null, liveSha: 'b'.repeat(64), pill: '1.1.0', now: nov7 });
  assert.match(stale[0], /different APK from main/);
  assert.match(stale[1], /still says New · 1\.1\.0/);
});

test('a pill is allowed its seven Korean days and a rebuild, and not a wrong version', () => {
  assert.deepEqual(appProblems({ ...ok, pill: '1.1.0' }), []);
  // Last day is 27 Oct KST; the 28th's rebuild can be late, so the 29th is still inside.
  assert.deepEqual(appProblems({ ...ok, pill: '1.1.0', now: new Date('2026-10-29T00:00:00Z') }), []);
  assert.match(appProblems({ ...ok, pill: '1.1.0', now: new Date('2026-10-30T00:00:00Z') })[0], /still says/);
  assert.match(appProblems({ ...ok, pill: '1.0.9' })[0], /main is on 1\.1\.0/);
});

test('a new release is not late inside the grace, and is named after it', () => {
  const rel = (at: string, assets = [{ name: 'x.apk' }]) => ({ tag_name: 'v1.2.0', published_at: at, assets });
  assert.deepEqual(appProblems({ ...ok, latest: rel('2026-10-22T20:00:00Z') }), []);
  assert.match(appProblems({ ...ok, latest: rel('2026-10-22T00:00:00Z') })[0], /Latest is 1\.2\.0/);
});

test('a late release with no APK says to attach one', () => {
  const latest = { tag_name: 'v1.2.0', published_at: '2026-10-01T00:00:00Z', assets: [] };
  assert.match(appProblems({ ...ok, latest })[0], /no APK attached/);
});

test('an APK that cannot be fetched is a problem, not a pass', () => {
  assert.match(appProblems({ ...ok, liveSha: null })[0], /could not be downloaded/);
});

test('a deploy older than two days is a problem; so is none at all', () => {
  assert.deepEqual(deployProblems({ lastDeploy: '2026-10-22T00:00:00Z', now }), []);
  assert.match(deployProblems({ lastDeploy: '2026-10-10T00:00:00Z', now })[0], /13 days ago/);
  assert.match(deployProblems({ lastDeploy: null, now })[0], /No deployment/);
});

test('the pill is found through markup, and absent means absent', () => {
  assert.equal(livePill('<a class="pill">New · 1.3.0</a>'), '1.3.0');
  assert.equal(livePill('<a>New\n  <span>&middot;</span> 1.3.0</a>'), '1.3.0');
  assert.equal(livePill('<p>What is New in this</p>'), null);
});

// A fake GitHub holding Issues in memory, recording every write.
function fakeGitHub(open: any[] = []) {
  const writes: string[] = [];
  const fetchImpl = async (url: string, init: any = {}) => {
    const path = url.replace('https://api.github.com/repos/o/r', '');
    const method = init.method ?? 'GET';
    if (method !== 'GET') writes.push(`${method} ${path}`);
    const body = method === 'GET' ? open : { number: 1, ...JSON.parse(init.body) };
    return { ok: true, status: 200, json: async () => body } as any;
  };
  return { board: issues({ repo: 'o/r', token: 't', fetchImpl: fetchImpl as any }), writes };
}

test('a problem opens one Issue, repeating it writes nothing, and changing it edits it', async () => {
  const first = fakeGitHub();
  await first.board.raise('k', 'T', 'text');
  assert.deepEqual(first.writes, ['POST /issues']);
  const same = fakeGitHub([{ number: 7, title: 'T', body: 'text\n\n<!-- doubleem:k -->' }]);
  await same.board.raise('k', 'T', 'text');
  assert.deepEqual(same.writes, []);
  const changed = fakeGitHub([{ number: 7, title: 'T', body: 'old\n\n<!-- doubleem:k -->' }]);
  await changed.board.raise('k', 'T', 'text');
  assert.deepEqual(changed.writes, ['PATCH /issues/7']);
});

test('clearing closes only the Issue with the marker, and pull requests never match', async () => {
  const none = fakeGitHub([{ number: 3, body: 'someone else' }, { number: 4, pull_request: {}, body: '<!-- doubleem:k -->' }]);
  await none.board.clear('k');
  assert.deepEqual(none.writes, []);
  const one = fakeGitHub([{ number: 7, body: '<!-- doubleem:k -->' }]);
  await one.board.clear('k');
  assert.deepEqual(one.writes, ['POST /issues/7/comments', 'PATCH /issues/7']);
});
