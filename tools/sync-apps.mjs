/* Brings each app's download up to date with that app's latest GitHub Release.
 *
 *   node tools/sync-apps.mjs [--message-file <path>]
 *
 * deploy.yml runs this every hour. Run by hand, it does the same to your working tree and
 * stops there: nothing is committed or pushed.
 *
 * An app takes part when its `release:` block names a `source:` repo. For each one the
 * Latest release is read from the GitHub API — drafts and pre-releases are never Latest,
 * so a test build is never published here. What happens next is planApp() in
 * sync-lib.mjs, which works the whole update out in memory: the APK must carry the tag's
 * versionName, be signed by the certificate pinned in `signer:`, and ask for no permission
 * the served APK does not. Only when every check has passed are its files written — the
 * APK, its assets/www/ into release.web, its icon, the release block, README.md's hash line and
 * releases/<slug>.md. An app that fails leaves the tree as it found it.
 *
 * What it cannot do is look at the app. The screenshots and LOGGER's sample record are
 * taken from the running app on a Mac (README.md § Shipping an app update), and Linux renders
 * Korean differently, so they are left as they were. The first time it moves an app past
 * its captures it writes `captured:` with the version they were taken from, and
 * check-sample-record.mjs holds the sample record to that instead. Re-capture locally,
 * then delete the `captured:` line.
 *
 * It also carries each app's description. An app whose repo has a LISTING.md on its default
 * branch has its tagline, audience and body taken from there, by the rules in listing-lib.mjs:
 * ordinary prose goes straight on, and a change to a protected section or a number waits for
 * approval. With --issues, a held or refused listing keeps one GitHub Issue open saying why;
 * a listing is approved by naming the id that Issue gives (--approve, or APPROVE_LISTING).
 * Also with --issues, an edit to a release's notes that the site refuses keeps one Issue open
 * (notes-<slug>) until the page can show the release's notes.
 *
 * Exits 1 if any app's release failed; the apps that succeeded are still written. A listing
 * that cannot go on does not fail the run: the page keeps its text and the Issue says why.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectApk, inspectPermissions } from './apk-tools.mjs';
import { issues } from './issues.mjs';
import { LISTING_FILE, planListing } from './listing-lib.mjs';
import { planApp, releaseField } from './sync-lib.mjs';

const root = join(fileURLToPath(import.meta.url), '../..');
const at = (p) => join(root, p);
const msgFile = process.argv.includes('--message-file')
  ? process.argv[process.argv.indexOf('--message-file') + 1]
  : null;
const approved = process.argv.includes('--approve')
  ? process.argv[process.argv.indexOf('--approve') + 1]
  : process.env.APPROVE_LISTING;
const repo = process.env.GITHUB_REPOSITORY ?? 'itsdoubleem/itsdoubleem.github.io';
const board = process.argv.includes('--issues') ? issues({ repo, token: process.env.GITHUB_TOKEN }) : null;

const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'doubleem-site-sync' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
async function get(url, h = headers) {
  const res = await fetch(url, { headers: h });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res;
}

// The Android SDK reads files, so each buffer goes through a scratch folder.
const scratch = mkdtempSync(join(tmpdir(), 'sync-apps-'));
let n = 0;
const onDisk = (buf) => { const f = join(scratch, `${n++}.apk`); writeFileSync(f, buf); return f; };
const io = (apkPath) => ({
  download: async (url) => Buffer.from(await (await get(url, { 'User-Agent': headers['User-Agent'] })).arrayBuffer()),
  inspect: (buf) => inspectApk(onDisk(buf)),
  current: () => ({ permissions: inspectPermissions(at(`public${apkPath}`)) }),
  unpack: (buf) => {
    const f = onDisk(buf);
    const out = join(scratch, `www-${n++}`);
    try {
      execFileSync('unzip', ['-q', '-o', f, 'assets/www/*', '-d', out]);
    } catch {
      return [];
    }
    const base = join(out, 'assets/www');
    const walk = (d) => readdirSync(d).flatMap((e) => {
      const p = join(d, e);
      return statSync(p).isDirectory() ? walk(p) : [[relative(base, p), readFileSync(p)]];
    });
    return existsSync(base) ? walk(base) : [];
  },
  sha256: (buf) => createHash('sha256').update(buf).digest('hex'),
});

/* An Issue that cannot be written is a warning: the listing's own state is already decided. */
async function report(key, act) {
  if (!board) return;
  try { await act(board); } catch (e) { console.log(`::warning::could not update the Issue for ${key}: ${e.message}`); }
}

async function syncListing(slug, source) {
  const res = await fetch(`https://api.github.com/repos/${source}/contents/${LISTING_FILE}`, {
    headers: { ...headers, Accept: 'application/vnd.github.raw+json' },
  });
  if (res.status === 404) return; // this app keeps its description here
  if (!res.ok) throw new Error(`${LISTING_FILE} → HTTP ${res.status}`);
  const file = at(`apps/${slug}.md`);
  const plan = planListing({ slug, md: readFileSync(file, 'utf8'), text: await res.text(), approved });
  const key = `listing-${slug}`;
  if (plan.status === 'publish') {
    writeFileSync(file, plan.md);
    changes.push(`${slug}: description from ${LISTING_FILE}`);
    console.log(`${slug}: description updated from ${LISTING_FILE}`);
  }
  // Not on 'publish': that text has yet to pass verify. The next run finds it 'same'.
  if (plan.status === 'same') {
    await report(key, (b) => b.clear(key, 'The page and LISTING.md agree again.'));
  }
  if (plan.status === 'held') {
    console.log(`::warning::${slug}: ${LISTING_FILE} waits for approval — ${plan.reasons.join('; ')}. To approve: gh workflow run deploy.yml -f approve_listing=${plan.id}`);
    await report(key, (b) => b.raise(key, `${slug}: a description change needs your approval`,
      `${LISTING_FILE} in ${source} changed, and the page has not, because ${plan.reasons.join(' and ')}.\n\n${plan.changes.join('\n\n')}\n\n**To publish exactly this text**, open Actions › Deploy to GitHub Pages › Run workflow and enter \`${plan.id}\`, or run:\n\n\`gh workflow run deploy.yml -f approve_listing=${plan.id}\`\n\n**To reject it**, change ${LISTING_FILE} back. This Issue closes by itself once the two agree.`));
  }
  if (plan.status === 'refused') {
    console.log(`::warning::${slug}: ${LISTING_FILE} refused — ${plan.reasons.join('; ')}`);
    await report(key, (b) => b.raise(key, `${slug}: LISTING.md cannot be published`,
      `${LISTING_FILE} in ${source} cannot go on the page:\n\n${plan.reasons.map((r) => `- ${r}`).join('\n')}\n\nThe page keeps its current text. Approval cannot override this: fix the file. This Issue closes by itself when it is fixed.`));
  }
}

const changes = [];
const failures = [];
try {
  for (const name of readdirSync(at('apps')).filter((f) => f.endsWith('.md') && f !== 'README.md')) {
    const slug = name.replace(/\.md$/, '');
    const md = readFileSync(at(`apps/${name}`), 'utf8');
    const source = releaseField(md, 'source');
    if (!source) continue;
    try {
      const rel = await (await get(`https://api.github.com/repos/${source}/releases/latest`)).json();
      const app = { slug, md, readme: readFileSync(at('README.md'), 'utf8'), notes: existsSync(at(`releases/${slug}.md`)) ? readFileSync(at(`releases/${slug}.md`), 'utf8') : null };
      const plan = await planApp(app, rel, io(releaseField(md, 'apk')));
      if (plan.warning) console.log(`::warning::${slug}: ${plan.warning}`);
      if (plan.log) console.log(`${slug}: ${plan.log}`);
      for (const [path, data] of plan.writes) {
        mkdirSync(dirname(at(path)), { recursive: true });
        writeFileSync(at(path), data);
      }
      if (plan.change) changes.push(plan.change);
      // An edit to a release's notes that the site refused is otherwise one log line in a
      // green run, every hour. One Issue says it until the notes are fixed or a release comes.
      if (plan.notes) {
        const key = `notes-${slug}`;
        if (plan.notes.held) {
          await report(key, (b) => b.raise(key, `${slug}: edited release notes were not published`,
            `The notes of ${rel.tag_name} in ${source} were edited, and the page still shows the earlier ones, because the release's ${plan.notes.held}.\n\nReword the GitHub Release (${rel.html_url}). This Issue closes by itself within the hour once the page can show it.`));
        } else {
          await report(key, (b) => b.clear(key, 'The page shows the release\'s notes again.'));
        }
      }
    } catch (e) {
      failures.push(slug);
      console.error(`::error::${slug}: ${e.message}`);
    }
    // Read after the release step, which may have just rewritten the same file.
    try {
      await syncListing(slug, source);
    } catch (e) {
      console.log(`::warning::${slug}: could not read its listing — ${e.message}`);
    }
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

if (msgFile && changes.length) {
  const subject = changes.length === 1 ? changes[0] : `${changes.length} app updates`;
  writeFileSync(msgFile, `chore(sync): ${subject}\n\nFrom each app's GitHub repo, by tools/sync-apps.mjs.\n\n${changes.map((c) => `- ${c}`).join('\n')}\n`);
}
if (!changes.length) console.log('Nothing to change.');
process.exit(failures.length ? 1 : 0);
