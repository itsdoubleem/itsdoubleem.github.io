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
 * APK, its assets/www/ into release.web, the release block, README.md's hash line and
 * releases/<slug>.md. An app that fails leaves the tree as it found it.
 *
 * What it cannot do is look at the app. The screenshots and LOGGER's sample record are
 * taken from the running app on a Mac (README.md § Shipping an app update), and Linux renders
 * Korean differently, so they are left as they were. The first time it moves an app past
 * its captures it writes `captured:` with the version they were taken from, and
 * check-sample-record.mjs holds the sample record to that instead. Re-capture locally,
 * then delete the `captured:` line.
 *
 * Exits 1 if any app failed; the apps that succeeded are still written.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { permissionsOf, planApp, releaseField, signersOf } from './sync-lib.mjs';

const root = join(fileURLToPath(import.meta.url), '../..');
const at = (p) => join(root, p);
const msgFile = process.argv.includes('--message-file')
  ? process.argv[process.argv.indexOf('--message-file') + 1]
  : null;

function sdkTool(name) {
  for (const sdk of [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT, `${homedir()}/Library/Android/sdk`]) {
    const tools = sdk && `${sdk}/build-tools`;
    if (!tools || !existsSync(tools)) continue;
    for (const v of readdirSync(tools).sort().reverse()) {
      if (existsSync(`${tools}/${v}/${name}`)) return `${tools}/${v}/${name}`;
    }
  }
  throw new Error(`${name} not found — it ships with the Android SDK build-tools`);
}

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
const badging = (file) => execFileSync(sdkTool('aapt2'), ['dump', 'badging', file], { encoding: 'utf8' });
const io = (apkPath) => ({
  download: async (url) => Buffer.from(await (await get(url, { 'User-Agent': headers['User-Agent'] })).arrayBuffer()),
  inspect: (buf) => {
    const f = onDisk(buf);
    const b = badging(f);
    return {
      versionName: b.match(/versionName='([^']+)'/)?.[1],
      permissions: permissionsOf(b),
      signers: signersOf(execFileSync(sdkTool('apksigner'), ['verify', '--print-certs', f], { encoding: 'utf8' })),
    };
  },
  current: () => ({ permissions: permissionsOf(badging(at(`public${apkPath}`))) }),
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
      const app = { slug, md, readme: readFileSync(at('README.md'), 'utf8'), notesExists: existsSync(at(`releases/${slug}.md`)) };
      const plan = await planApp(app, rel, io(releaseField(md, 'apk')));
      if (plan.warning) console.log(`::warning::${slug}: ${plan.warning}`);
      if (plan.log) console.log(`${slug}: ${plan.log}`);
      for (const [path, data] of plan.writes) {
        mkdirSync(dirname(at(path)), { recursive: true });
        writeFileSync(at(path), data);
      }
      if (plan.change) changes.push(plan.change);
    } catch (e) {
      failures.push(slug);
      console.error(`::error::${slug}: ${e.message}`);
    }
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

if (msgFile && changes.length) {
  const subject = changes.length === 1 ? changes[0] : `${changes.length} app releases`;
  writeFileSync(msgFile, `chore(sync): ${subject}\n\nFrom each app's Latest GitHub Release, by tools/sync-apps.mjs.\n\n${changes.map((c) => `- ${c}`).join('\n')}\n`);
}
if (!changes.length) console.log('Nothing to change.');
process.exit(failures.length ? 1 : 0);
