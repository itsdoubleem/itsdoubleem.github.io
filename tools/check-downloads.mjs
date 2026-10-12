/* Checks every download the site advertises against the file it actually serves.
 *
 *   node tools/check-downloads.mjs      (or: npm run check, which CI runs)
 *
 * An app's release is described once, in the `release:` block of `apps/<slug>.md` — its
 * version, its APK and that APK's SHA-256 — and the page prints the size by measuring the
 * file (src/release.ts). The build itself refuses a release.sha256 that is not the file's
 * hash. What the build cannot see is README.md, which repeats each hash as the second
 * opinion that lives on github.com rather than on the site. This checks that copy.
 *
 * It also refuses the old habit: a hash or an APK size typed into the page's prose
 * instead of written as {sha256} or {apkSize}. Typed copies are how HANGIL's page came to
 * say 1.4 MB about a 2.6 MB APK — it looked exactly as right as the true number would.
 *
 * And it compares the web app packed inside each APK (assets/www/) with the folder the site
 * serves at release.web, file by file. LOGGER's page says the two hash identically; v1.4.4
 * nearly shipped a /logger/ built one commit past the APK's tag, and nothing here noticed.
 * The site may serve files the APK lacks (HANGIL's sw.js), but not different copies.
 *
 * This is hard rule 1 wearing work clothes — a number on the site that nothing
 * verifies is a number the site is inventing. Exits non-zero, so it can gate a
 * deploy.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/* aapt2 reads the versionName out of an APK. It ships with the Android SDK, which the
 * GitHub runner has and this machine has; where it is missing the version check is
 * skipped with a note rather than failed, because it is a second opinion, not the gate. */
function findAapt2() {
  for (const sdk of [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT, `${homedir()}/Library/Android/sdk`]) {
    const tools = sdk && `${sdk}/build-tools`;
    if (!tools || !existsSync(tools)) continue;
    const latest = readdirSync(tools).sort().pop();
    if (latest && existsSync(`${tools}/${latest}/aapt2`)) return `${tools}/${latest}/aapt2`;
  }
  return null;
}
const aapt2 = findAapt2();

/* unzip lists and reads the APK. macOS and the GitHub runner both have it; where it is
 * missing the web comparison is skipped with a note, like the version check — except in
 * CI, where a skipped comparison would let the deploy through unchecked. */
let unzip = true;
try { execFileSync('unzip', ['-v'], { stdio: 'ignore' }); } catch { unzip = false; }

const root = new URL('..', import.meta.url);
const readme = await readFile(new URL('README.md', root), 'utf8');
const problems = [];
let checked = 0;

for (const name of (await readdir(new URL('apps/', root))).filter((f) => f.endsWith('.md'))) {
  if (name === 'README.md') continue;
  const md = await readFile(new URL(`apps/${name}`, root), 'utf8');
  const front = md.split(/^---$/m)[1] ?? '';

  // The release block, read by pattern rather than by a YAML parser so this runs with
  // nothing installed. It only needs two lines of it.
  const block = front.match(/^release:\n((?:[ \t]+.*\n)+)/m)?.[1] ?? '';
  // Quotes are optional in YAML, so they are optional here too.
  const apk = block.match(/^\s+apk:\s*['"]?([^'"\s]+)/m)?.[1];
  const sha = block.match(/^\s+sha256:\s*['"]?([0-9a-f]{64})/m)?.[1];
  const version = block.match(/^\s+version:\s*['"]?([^'"\s]+)/m)?.[1];
  const web = block.match(/^\s+web:\s*['"]?([^'"\s]+)/m)?.[1];

  // Anything hash-shaped or APK-size-shaped outside the release block is a typed copy —
  // in the frontmatter or in the body below it.
  const rest = md.replace(block, '');
  if (/\b[0-9a-f]{64}\b/.test(rest)) {
    problems.push(`${name}: a hash is typed into the page — write {sha256} instead`);
  }
  if (/APK,\s*[\d.]+\s*MB/.test(rest)) {
    problems.push(`${name}: an APK size is typed into the page — write {apkSize} instead`);
  }

  if (!block) {
    if (/\/downloads\/\S+\.apk/.test(front)) {
      problems.push(`${name}: offers an APK but has no release: block describing it`);
    }
    continue;
  }
  if (!apk || !sha) {
    problems.push(`${name}: release: needs both apk and sha256`);
    continue;
  }

  let file;
  try {
    file = await readFile(new URL(`public${apk}`, root));
  } catch {
    problems.push(`${name}: release.apk is ${apk}, and public${apk} is not there`);
    continue;
  }
  checked++;
  // Absolute, so the tools below run from any folder, not only through npm run check.
  const apkPath = fileURLToPath(new URL(`public${apk}`, root));

  const sum = createHash('sha256').update(file).digest('hex');
  const apkName = apk.split('/').pop();
  if (sum !== sha) {
    problems.push(`${name}: release.sha256 is not this file's\n    page ${sha}\n    file ${sum}`);
  }
  // On the line that names this APK, so two swapped lines cannot pass.
  if (!new RegExp(`^${sum}\\s+${apkName.replace('.', '\\.')}$`, 'm').test(readme)) {
    problems.push(`README.md: no "${sum}  ${apkName}" line — the second-opinion copy is stale`);
  }

  // release.version is typed by hand, and the notice guard trusts it.
  if (aapt2 && version) {
    const badging = execFileSync(aapt2, ['dump', 'badging', apkPath], { encoding: 'utf8' });
    const inApk = badging.match(/versionName='([^']*)'/)?.[1];
    if (inApk !== version) {
      problems.push(`${name}: release.version is ${version}, the APK says versionName ${inApk}`);
    }
  }

  if (unzip && web) {
    const packed = execFileSync('unzip', ['-Z1', apkPath], { encoding: 'utf8' })
      .split('\n').filter((f) => f.startsWith('assets/www/') && !f.endsWith('/'));
    // An APK that packs its web app elsewhere (Capacitor's assets/public/, say) would
    // otherwise compare nothing and still pass.
    if (!packed.length) {
      problems.push(`${name}: release.web is ${web}, but ${apkName} has no assets/www/ to compare it with`);
    }
    // release.web is a site path, read the way publicPath in src/release.ts reads it: no
    // ? or # part, and %20 or %ED%95%9C decoded. The APK's file names below are not.
    let webFolder = web.split(/[?#]/)[0];
    try { webFolder = decodeURIComponent(webFolder); } catch { /* a stray % is part of the name */ }
    const differ = [];
    for (const entry of packed) {
      const rel = entry.slice('assets/www/'.length);
      // A path join, not a URL: a ? # or % in a file name is part of the name here.
      const served = join(fileURLToPath(root), 'public', webFolder, rel);
      // unzip reads the name as a pattern, so a [ or * in a file name is escaped.
      const literal = entry.replace(/[[\]*?\\]/g, '\\$&');
      const inApk = execFileSync('unzip', ['-p', apkPath, literal], { maxBuffer: 1 << 28 });
      let onSite;
      try { onSite = await readFile(served); } catch { differ.push(`${rel} (not served)`); continue; }
      if (!inApk.equals(onSite)) differ.push(rel);
    }
    if (differ.length) {
      problems.push(`${name}: public${web} is not the web app inside ${apkName}: ${differ.join(', ')}\n    copy those files from assets/www/ in the APK (unzip public${apk} 'assets/www/*' -d <a scratch folder>) into public${web}`);
    }
  }
}

if (!checked) {
  console.error('check-downloads: found no APKs to check — has the layout moved?');
  process.exit(1);
}
if (problems.length) {
  console.error(`check-downloads: ${problems.length} problem(s)\n  - ${problems.join('\n  - ')}`);
  process.exit(1);
}
if (!aapt2) console.log('check-downloads: no aapt2 found — APK versions not compared');
if (!unzip && process.env.CI) {
  console.error('check-downloads: no unzip found in CI — web builds cannot be compared with the APKs');
  process.exit(1);
}
if (!unzip) console.log('check-downloads: no unzip found — web builds not compared with the APKs');
console.log(`check-downloads: ${checked} download(s), each matches its release: block and README${unzip ? ', and its web build matches the APK' : ''}`);
