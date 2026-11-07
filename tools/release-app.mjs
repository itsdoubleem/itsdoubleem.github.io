/* One release command for every app, run on the Mac that holds the signing keys.
 *
 *   node tools/release-app.mjs <slug>                  build and check, publish nothing
 *   node tools/release-app.mjs <slug> --publish        build, check, then publish
 *
 *   --dir <path>         the app's folder (default: ~/<repo name>)
 *   --notes-file <path>  the release notes (default: the CHANGELOG.md section naming the version)
 *   --no-build           check the APK that is already there; cannot be used with --publish,
 *                        because nothing ties that file to the commit it would be released as
 *
 * It takes the version from the app's build.gradle, so bump that first and push it. It refuses
 * unless the folder is clean and level with the default branch, the version is new, there are
 * notes, and the APK passes the checks the sync will apply. Then it creates the GitHub Release
 * with the APK attached, sets the repo's About line from LISTING.md if there is one, and tells
 * the site to update now. It changes no file in the app's folder.
 */
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectApk, inspectPermissions } from './apk-tools.mjs';
import { LISTING_FILE, parseListing } from './listing-lib.mjs';
import { changelogSection, gradleVersion, releaseProblems, siteProblems } from './release-lib.mjs';
import { cleanNotes, releaseBlock, releaseField } from './sync-lib.mjs';

const root = join(fileURLToPath(import.meta.url), '../..');
const SITE_REPO = 'itsdoubleem/itsdoubleem.github.io';
const argv = process.argv.slice(2);
const flag = (name) => { const i = argv.indexOf(name); return i < 0 ? null : argv[i + 1]; };
const slug = argv[0];
const die = (m) => { console.error(m); process.exit(1); };

if (argv.includes('--no-build') && argv.includes('--publish')) die('--no-build cannot publish: a release is always built from the commit it names');
if (!slug || slug.startsWith('-') || !existsSync(join(root, 'apps', `${slug}.md`))) {
  die('usage: node tools/release-app.mjs <slug> [--publish] [--dir <path>] [--notes-file <path>] [--no-build]');
}
const md = readFileSync(join(root, 'apps', `${slug}.md`), 'utf8');
const source = releaseField(md, 'source');
const asset = releaseField(md, 'asset');
if (!source || !asset) die(`apps/${slug}.md needs release.source and release.asset`);
const dir = flag('--dir') ?? join(homedir(), source.split('/')[1]);
if (!existsSync(join(dir, '.git'))) die(`${dir} is not the app's git folder — pass --dir`);

const git = (...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' }).trim();
const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8' }).trim();

git('fetch', '-q', '--tags', 'origin');
const defaultBranch = git('symbolic-ref', '--short', 'refs/remotes/origin/HEAD').replace(/^origin\//, '');
const head = git('rev-parse', 'HEAD');
const gradle = join(dir, 'android/app/build.gradle');
const version = existsSync(gradle) ? gradleVersion(readFileSync(gradle, 'utf8')) : null;
if (!version) die(`could not read versionName from ${gradle}`);
const tag = `v${version}`;
const changelog = join(dir, 'CHANGELOG.md');
const notesFile = flag('--notes-file');
const notes = notesFile
  ? readFileSync(notesFile, 'utf8')
  : existsSync(changelog) ? changelogSection(readFileSync(changelog, 'utf8'), version) : '';

// An app's first release has no Latest to compare with.
function latestRelease() {
  try {
    return JSON.parse(gh('release', 'view', '-R', source, '--json', 'tagName')).tagName.replace(/^v/, '');
  } catch {
    return null;
  }
}

const state = {
  version,
  tagExists: git('tag', '--list', tag) === tag,
  latest: latestRelease(),
  clean: git('status', '--porcelain') === '',
  branch: git('rev-parse', '--abbrev-ref', 'HEAD'),
  defaultBranch,
  inSync: head === git('rev-parse', `origin/${defaultBranch}`),
  notes,
  signer: releaseField(md, 'signer'),
  had: inspectPermissions(join(root, `public${releaseField(md, 'apk')}`)),
};

// Everything a build cannot change is refused first; a release build takes minutes.
const before = releaseProblems({ ...state, apk: { versionName: version, signers: [state.signer], permissions: [] } });
if (before.length && !argv.includes('--no-build')) die(`${slug} ${version}: not building\n  - ${before.join('\n  - ')}`);

if (!argv.includes('--no-build')) {
  const build = releaseBlock(md).match(/^\s+build:\s*(.+?)\s*$/m)?.[1] ?? './build_apk.sh release';
  console.log(`Building: ${build}`);
  execSync(build, { cwd: dir, stdio: 'inherit' });
}
const apkFile = join(dir, asset);
const apk = existsSync(apkFile) ? inspectApk(apkFile) : null;
const problems = releaseProblems({ ...state, apk });
if (git('status', '--porcelain') !== '' && state.clean) problems.push('the build changed tracked files in the app folder — commit or ignore them first');
if (git('rev-parse', 'HEAD') !== head) problems.push('a commit landed in the app folder during the build, so the APK matches no single commit');
const apkPath = releaseField(md, 'apk');
problems.push(...siteProblems({
  md,
  readme: readFileSync(join(root, 'README.md'), 'utf8'),
  apkEntries: apk ? execFileSync('unzip', ['-Z1', apkFile], { encoding: 'utf8', maxBuffer: 1 << 26 }).split('\n') : null,
  oldSha: releaseField(md, 'sha256'),
  apkName: apkPath.split('/').pop(),
  web: releaseField(md, 'web'),
}));
if (problems.length) die(`${slug} ${version}: refused\n  - ${problems.join('\n  - ')}`);

console.log(`${slug} ${version} passes every check: ${asset}, signed by the pinned key, no new permissions.`);
console.log(`\nRelease notes as the site will show them:\n\n${cleanNotes(notes)}\n`);
if (!argv.includes('--publish')) {
  console.log('Nothing published. Add --publish to create the release.');
  process.exit(0);
}

const scratch = mkdtempSync(join(tmpdir(), 'release-app-'));
try {
  const file = join(scratch, 'notes.md');
  writeFileSync(file, notes);
  gh('release', 'create', tag, apkFile, '-R', source, '--target', head, '--title', tag, '--notes-file', file, '--latest');
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
console.log(`Released ${tag} on ${source}.`);

// The release is out, so neither of these undoes it: the schedule finds the release anyway.
const listing = join(dir, LISTING_FILE);
if (existsSync(listing)) {
  try {
    gh('repo', 'edit', source, '--description', parseListing(readFileSync(listing, 'utf8')).fields.tagline);
  } catch (e) {
    console.log(`Could not update the repo's About line: ${e.message}`);
  }
}
try {
  gh('api', `repos/${SITE_REPO}/dispatches`, '-f', 'event_type=app-release');
  console.log('Told the site to update now.');
} catch (e) {
  console.log(`Could not signal the site (${e.message}). Its next scheduled sync will find the release.`);
}
