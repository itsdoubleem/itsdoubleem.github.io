/* The decisions of tools/release-app.mjs, kept apart so tests/release-app.test.ts can reach
 * them without an app repo, the Android SDK or GitHub. */
import { apkRefusal, cleanNotes, compareVersions } from './sync-lib.mjs';

/** versionName from an app's android/app/build.gradle, or null. */
export const gradleVersion = (gradle) => gradle.match(/^\s*versionName\s+['"]([^'"]+)['"]/m)?.[1] ?? null;

/** The part of a changelog under the heading that names this version, or ''. A heading names
 *  it as a whole word, so 1.2 does not match 1.2.3. It ends at the next heading of its level. */
export function changelogSection(text, version) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const named = new RegExp(`(^|[^\\d.])v?${version.replace(/\./g, '\\.')}(?![\\d.]*\\d)`);
  const start = lines.findIndex((l) => /^#{1,6}\s/.test(l) && named.test(l));
  if (start < 0) return '';
  const level = lines[start].match(/^#+/)[0].length;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => { const m = l.match(/^(#+)\s/); return m && m[1].length <= level; });
  return (end < 0 ? rest : rest.slice(0, end)).join('\n').trim();
}

/** Why this release must not go out, as a list of sentences. Empty means it can.
 *  state { version, tagExists, latest, clean, branch, defaultBranch, inSync, notes,
 *          apk: {versionName, signers, permissions}|null, signer, had } */
export function releaseProblems(s) {
  const out = [];
  if (!s.version) return ['could not read versionName from android/app/build.gradle'];
  const tag = `v${s.version}`;
  if (!s.clean) out.push('the app folder has uncommitted changes, so the APK would not match any commit');
  if (s.branch !== s.defaultBranch) out.push(`the app folder is on ${s.branch}, not ${s.defaultBranch}`);
  if (!s.inSync) out.push(`the app folder is not level with origin/${s.defaultBranch} — push or pull first`);
  if (s.tagExists) out.push(`${tag} already exists — bump the version first`);
  else if (s.latest && compareVersions(s.version, s.latest) <= 0) out.push(`${s.version} is not newer than the Latest release, ${s.latest}`);
  if (!cleanNotes(s.notes)) out.push(`no release notes: add a heading naming ${s.version} to CHANGELOG.md, or pass --notes-file`);
  if (!s.apk) out.push('the APK is missing — the build did not produce the file named by release.asset');
  else {
    const refusal = apkRefusal(s.apk, { tag, version: s.version, signer: s.signer, had: s.had });
    if (refusal) out.push(refusal);
  }
  return out;
}
