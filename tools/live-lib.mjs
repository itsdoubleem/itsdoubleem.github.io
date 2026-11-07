/* The decisions of tools/check-live.mjs, kept apart so tests/live.test.ts can reach them
 * without the network. Each function returns plain sentences for the owner to read. */
import { compareVersions } from './sync-lib.mjs';
import { NEW_FOR_DAYS } from '../src/release.ts';

const HOUR = 3600e3;
/* GitHub ran the "hourly" schedule 3–7 times a day in November 2026, with gaps of up to
 * eight hours, so a release is not late until well past that. */
export const RELEASE_GRACE_HOURS = 12;
/* The daily rebuild itself started up to seven hours late in the same weeks. */
export const DEPLOY_MAX_AGE_HOURS = 48;
/* A pill comes down at the first rebuild after its last day. */
const PILL_GRACE_HOURS = 36;

/** The version on a page's "New · 1.2.3" pill, or null. Tags are stripped first because
 *  the page may mark up the separator. */
export function livePill(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&middot;|&#183;/g, '·').replace(/\s+/g, ' ');
  return text.match(/\bNew · v?(\d[\w.]*)/)?.[1] ?? null;
}

/** What is wrong with one app.
 *  app      { slug, version, sha256, date }  what main says, date as YYYY-MM-DD
 *  latest   the GitHub API's Latest release JSON, or null if there is none
 *  liveSha  SHA-256 of the APK the live site serves, or null if it could not be fetched
 *  pill     the version on the live page's pill, or null */
export function appProblems({ app, latest, liveSha, pill, now = new Date() }) {
  const out = [];
  const { slug } = app;
  if (!liveSha) out.push(`${slug}: the live site's APK could not be downloaded`);
  else if (liveSha !== app.sha256) {
    out.push(`${slug}: the live site is serving a different APK from main (${app.version}), so main has not deployed. The page's own hash check will tell readers to delete a good file, because the README on GitHub already shows the new hash.`);
  }

  if (latest) {
    const tag = latest.tag_name.replace(/^v/, '');
    const hours = (now - new Date(latest.published_at)) / HOUR;
    if (compareVersions(tag, app.version) > 0 && hours > RELEASE_GRACE_HOURS) {
      const apks = (latest.assets ?? []).filter((a) => a.name.endsWith('.apk'));
      out.push(apks.length
        ? `${slug}: GitHub's Latest is ${tag} (${Math.round(hours)} hours old) but main is on ${app.version}. Read the sync or verify job's red line in the latest run.`
        : `${slug}: GitHub's Latest is ${tag} but it has no APK attached, so the site cannot publish it. Attach one to the release.`);
    }
  }

  if (pill) {
    // The last day ends at 24:00 in Korea; dates in frontmatter are Korean days.
    const last = new Date(`${app.date}T00:00:00+09:00`).getTime() + NEW_FOR_DAYS * 24 * HOUR;
    if (pill !== app.version) out.push(`${slug}: the live page's pill says New · ${pill} but main is on ${app.version}.`);
    else if (now.getTime() > last + PILL_GRACE_HOURS * HOUR) out.push(`${slug}: the live page still says New · ${pill}, ${NEW_FOR_DAYS} days after ${app.date} has passed. The daily rebuild is not reaching the site.`);
  }
  return out;
}

/** What is wrong with the site as a whole. lastDeploy is an ISO date, or null. */
export function deployProblems({ lastDeploy, now = new Date() }) {
  if (!lastDeploy) return ['No deployment of this site could be found.'];
  const hours = (now - new Date(lastDeploy)) / HOUR;
  return hours > DEPLOY_MAX_AGE_HOURS
    ? [`The last deploy was ${Math.round(hours / 24)} days ago, and one should happen every day. Pills cannot expire and updates cannot arrive until that is fixed. Open the latest run of "Deploy to GitHub Pages" and read its red line.`]
    : [];
}
