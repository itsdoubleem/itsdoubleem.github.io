/* Which Dependabot pull request, if any, deps.yml may test and merge by itself. Decided here,
 * without the network, so the rules can be tested. Everything not listed is left for a person:
 *
 *   - opened by dependabot[bot], from this repo, against main, not a draft
 *   - one npm package, named in a title like "bump astro from 7.3.2 to 7.3.3"
 *   - a patch or minor version change (a 0.x minor counts as major, as npm treats it)
 *   - open at least MIN_AGE_DAYS, so a release that is pulled or found bad in its first days
 *     never arrives here
 *   - touches package.json and package-lock.json and nothing else
 *   - one commit, written by dependabot[bot] and signed by GitHub
 *
 * The merge itself is a new commit by the owner's noreply address with the same files, so the
 * repository keeps one contributor: the owner. */
export const MIN_AGE_DAYS = 3;
export const BOT = 'dependabot[bot]';
export const FILES = ['package.json', 'package-lock.json'];
/** Left on a pull request by deps.yml when its commit failed on main, so the next run moves on to
 *  the next one instead of testing it again every day. A rebase is a new commit and is tried. */
export const failedMarker = (sha) => `<!-- doubleem:deps-failed:${sha} -->`;

const VERSION = /^v?(\d+)\.(\d+)\.(\d+)$/;

/** 'patch' | 'minor' | 'major', or null when either side is not a plain x.y.z version. */
export function versionChange(from, to) {
  const a = from.match(VERSION);
  const b = to.match(VERSION);
  if (!a || !b) return null;
  const [, a1, a2, a3] = a.map(Number);
  const [, b1, b2, b3] = b.map(Number);
  if (b1 !== a1) return 'major';
  if (b2 !== a2) return a1 === 0 ? 'major' : 'minor';
  // npm reads ^0.0.x as that version only, so any 0.0 change is breaking.
  if (b3 !== a3) return a1 === 0 && a2 === 0 ? 'major' : 'patch';
  return null;
}

/** { name, from, to } from a Dependabot title, or null for a group, a subfolder or anything else. */
export function parseBump(title) {
  const m = title.match(/^[\w()-]+: [Bb]ump (@?[\w.-]+(?:\/[\w.-]+)?) from (\S+) to (\S+)$/);
  return m ? { name: m[1], from: m[2], to: m[3] } : null;
}

/** Why this pull request may not be merged by itself, or null if it may.
 *  pr is the REST pull object; files are paths; commits are the REST commit objects; comments
 *  are its REST issue comments, read for this workflow's own failure note. */
export function refusal({ pr, files, commits, comments = [], repo, now = Date.now(), minAgeDays = MIN_AGE_DAYS }) {
  if (pr.user?.login !== BOT) return 'not opened by Dependabot';
  if (pr.draft) return 'a draft';
  if (pr.base?.ref !== 'main') return `aimed at ${pr.base?.ref}, not main`;
  if (pr.head?.repo?.full_name !== repo) return 'from another repository';
  if (!pr.head?.ref?.startsWith('dependabot/npm_and_yarn/')) return 'not an npm update';
  const bump = parseBump(pr.title ?? '');
  if (!bump) return 'not a single package at the top level';
  const change = versionChange(bump.from, bump.to);
  if (change !== 'patch' && change !== 'minor') return `a ${change ?? 'non-standard'} version change (${bump.from} → ${bump.to})`;
  const days = (now - Date.parse(pr.created_at)) / 86400000;
  if (!(days >= minAgeDays)) return `open ${Math.max(0, Math.floor(days))} of ${minAgeDays} days`;
  const other = files.filter((f) => !FILES.includes(f));
  if (other.length) return `changes ${other.join(', ')}`;
  if (commits.length !== 1) return `${commits.length} commits, not 1`;
  const [c] = commits;
  if (c.sha !== pr.head.sha) return 'its head moved';
  if (c.author?.login !== BOT || !['web-flow', BOT].includes(c.committer?.login)) return 'a commit not made by Dependabot';
  if (!c.commit?.verification?.verified) return 'a commit GitHub has not verified';
  if (comments.some((m) => m.user?.login === 'github-actions[bot]' && m.body?.includes(failedMarker(pr.head.sha)))) {
    return 'failed on main at this commit; waits for a person, or for Dependabot to rebase it';
  }
  return null;
}

/** The commit message the merge writes: the title, and where it came from. No trailers. */
export function mergeMessage(pr) {
  return `${pr.title}\n\nTested on main and merged by .github/workflows/deps.yml from #${pr.number}.\n`;
}
