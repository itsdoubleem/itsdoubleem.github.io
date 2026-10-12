/* Brings each app's download up to date with that app's latest GitHub Release.
 *
 *   node tools/sync-apps.mjs [--message-file <path>]
 *
 * deploy.yml runs this every hour. Run by hand, it does the same to your working tree and
 * stops there: nothing is committed or pushed.
 *
 * An app takes part when its `release:` block names a `source:` repo. For each one:
 *
 *   · The Latest release is read from the GitHub API. Drafts and pre-releases are never
 *     Latest, so a test build is never published here by accident.
 *   · Older or equal to what the site serves: nothing changes, except that the notes file
 *     (releases/<slug>.md) is written if it is missing.
 *   · Newer: the APK is downloaded — the asset named `asset:`, or the release's only .apk —
 *     and refused unless its versionName is the tag's version AND it is signed by the
 *     certificate pinned in `signer:`. A different key would mean Android refuses to install
 *     it over the old one at best, and a stranger's build at worst, so that is a failure,
 *     not a warning. Then the APK replaces public/downloads/<slug>.apk, the web build is
 *     copied out of its assets/www/ into release.web, and version, sha256 and date are
 *     rewritten, along with the hash in README.md and the notes file.
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
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cleanNotes, compareVersions, kstDate, notesFile, releaseBlock, releaseField, setReleaseField,
} from './sync-lib.mjs';

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

async function gh(url) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'doubleem-site-sync' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res;
}

const changes = [];
const failures = [];

for (const name of readdirSync(at('apps')).filter((f) => f.endsWith('.md') && f !== 'README.md')) {
  const slug = name.replace(/\.md$/, '');
  const file = at(`apps/${name}`);
  let md = readFileSync(file, 'utf8');
  const source = releaseField(md, 'source');
  if (!source) continue;

  try {
    const current = releaseField(md, 'version');
    const rel = await (await gh(`https://api.github.com/repos/${source}/releases/latest`)).json();
    const latest = rel.tag_name.replace(/^v/, '');
    const notesPath = at(`releases/${slug}.md`);
    const notes = () =>
      notesFile({ version: latest, date: kstDate(rel.published_at), url: rel.html_url, notes: cleanNotes(rel.body) });

    if (compareVersions(latest, current) <= 0) {
      if (compareVersions(latest, current) === 0 && !existsSync(notesPath)) {
        writeFileSync(notesPath, notes());
        changes.push(`${slug}: release notes for ${current}`);
        console.log(`${slug}: ${current} is current; wrote its release notes`);
      } else {
        console.log(`${slug}: ${current} is current (latest release ${rel.tag_name})`);
      }
      continue;
    }

    // A notice tied to the old version would fail the build. It was written by a person
    // about one update, so a person decides what happens to it.
    if (/^notice:\n(?:[ \t]+.*\n)*?[ \t]+version:/m.test(md)) {
      throw new Error(`has a notice tied to ${current} — rewrite or delete it, then sync again`);
    }

    const wanted = releaseField(md, 'asset');
    const apks = rel.assets.filter((a) => (wanted ? a.name === wanted : a.name.endsWith('.apk')));
    if (apks.length !== 1) {
      // Not a failure: HANGIL's releases have carried no APK so far, and an hourly job
      // that fails every hour until someone attaches one would only teach people to
      // ignore it. The warning shows on the run.
      console.log(`::warning::${slug}: ${rel.tag_name} has ${apks.length ? 'several' : 'no'} APK ${wanted ? `named ${wanted}` : 'assets'} — attach one to the release to publish it here`);
      continue;
    }

    const tmp = mkdtempSync(join(tmpdir(), `sync-${slug}-`));
    try {
      const apkTmp = join(tmp, 'app.apk');
      const dl = await fetch(apks[0].browser_download_url);
      if (!dl.ok) throw new Error(`${apks[0].browser_download_url} → HTTP ${dl.status}`);
      const buf = Buffer.from(await dl.arrayBuffer());
      writeFileSync(apkTmp, buf);

      const badging = execFileSync(sdkTool('aapt2'), ['dump', 'badging', apkTmp], { encoding: 'utf8' });
      const versionName = badging.match(/versionName='([^']+)'/)?.[1];
      if (versionName !== latest) throw new Error(`${rel.tag_name}'s APK says versionName ${versionName}`);

      const certs = execFileSync(sdkTool('apksigner'), ['verify', '--print-certs', apkTmp], { encoding: 'utf8' });
      const signers = [...certs.matchAll(/certificate SHA-256 digest: ([0-9a-f]{64})/g)].map((m) => m[1]);
      const pinned = releaseField(md, 'signer');
      if (!signers.length || signers.some((s) => s !== pinned)) {
        throw new Error(`${rel.tag_name}'s APK is signed by ${signers.join(', ') || 'nothing'}, not the pinned ${pinned}`);
      }

      const apkPath = releaseField(md, 'apk');
      const oldSha = releaseField(md, 'sha256');
      const sha = createHash('sha256').update(buf).digest('hex');
      writeFileSync(at(`public${apkPath}`), buf);

      const web = releaseField(md, 'web');
      if (web) {
        execFileSync('unzip', ['-q', '-o', apkTmp, 'assets/www/*', '-d', join(tmp, 'x')]);
        cpSync(join(tmp, 'x/assets/www'), at(`public${web}`), { recursive: true });
      }

      if (!releaseField(md, 'captured')) md = setReleaseField(md, 'captured', `'${current}'`);
      md = setReleaseField(md, 'version', latest);
      md = setReleaseField(md, 'sha256', sha);
      md = setReleaseField(md, 'date', kstDate(rel.published_at));
      writeFileSync(file, md);

      const readme = readFileSync(at('README.md'), 'utf8');
      const apkName = apkPath.split('/').pop();
      if (!readme.includes(`${oldSha}  ${apkName}`)) throw new Error(`README.md has no hash line for ${apkName}`);
      writeFileSync(at('README.md'), readme.replace(`${oldSha}  ${apkName}`, `${sha}  ${apkName}`));

      writeFileSync(notesPath, notes());
      changes.push(`${slug}: ${current} → ${latest}`);
      console.log(`${slug}: ${current} → ${latest} (${sha})`);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  } catch (e) {
    failures.push(`${slug}: ${e.message}`);
    console.error(`::error::${slug}: ${e.message}`);
  }
}

if (msgFile && changes.length) {
  const subject = changes.length === 1 ? changes[0] : `${changes.length} app releases`;
  writeFileSync(msgFile, `chore(sync): ${subject}\n\nFrom each app's Latest GitHub Release, by tools/sync-apps.mjs.\n\n${changes.map((c) => `- ${c}`).join('\n')}\n`);
}
if (!changes.length) console.log('Nothing to change.');
process.exit(failures.length ? 1 : 0);
