/* Checks every outside link on the built site: the apps' sources, the about page, and each
 * citation in the homepage deck.
 *
 *   node tools/check-links.mjs                  check the links in dist/ (npm run build first)
 *   node tools/check-links.mjs --list           print them as JSON instead, without checking
 *   node tools/check-links.mjs --from <file> --issue
 *                                               check a list made by --list, and keep one Issue
 *                                               open while any is broken (links.yml)
 *
 * What counts as broken is tools/links-lib.mjs. A broken link is asked again a minute later
 * before it is reported, and nothing else is ever reported as broken. Exits 0 either way: an
 * old link is a job to do, and the Issue is the signal. App web builds are skipped; their
 * links belong to the app. */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { externalLinks, issueText, pagePath, readList, verdict } from './links-lib.mjs';
import { issues } from './issues.mjs';
import { releaseField } from './sync-lib.mjs';

const root = join(fileURLToPath(import.meta.url), '../..');
const args = process.argv.slice(2);
const from = args.includes('--from') ? args[args.indexOf('--from') + 1] : null;

function fromDist() {
  const dist = join(root, 'dist');
  if (!existsSync(dist)) throw new Error('no dist/ — run npm run build first');
  const skip = readdirSync(join(root, 'apps'))
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((f) => releaseField(readFileSync(join(root, 'apps', f), 'utf8'), 'web'))
    .filter(Boolean)
    .map((w) => w.replace(/^\/|\/$/g, '') + '/');
  const walk = (d) => readdirSync(d).flatMap((e) => {
    const p = join(d, e);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
  const pages = walk(dist)
    .map((p) => relative(dist, p).replace(/\\/g, '/'))
    .filter((rel) => rel.endsWith('.html') && !skip.some((s) => rel.startsWith(s)))
    .map((rel) => [pagePath(rel), readFileSync(join(dist, rel), 'utf8')]);
  return externalLinks(pages);
}

if (args.includes('--list')) {
  process.stdout.write(JSON.stringify(fromDist()));
  process.exit(0);
}

const list = from ? readList(readFileSync(from, 'utf8')) : fromDist();
const UA = 'Mozilla/5.0 (compatible; doubleem-site-link-check; +https://itsdoubleem.github.io/)';

async function ask(url) {
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, signal: AbortSignal.timeout(20000) });
    await res.body?.cancel();
    return { status: res.status };
  } catch (e) {
    return { error: e.cause?.code ?? e.name ?? 'error' };
  }
}
const why = (a) => (a.error ? a.error : `HTTP ${a.status}`);

// Four at a time: enough to finish in a minute, few enough not to look like an attack.
const results = [];
const queue = [...list];
await Promise.all(Array.from({ length: 4 }, async () => {
  for (let item = queue.shift(); item; item = queue.shift()) {
    const a = await ask(item.url);
    results.push({ ...item, answer: a, verdict: verdict(a) });
  }
}));
// Asked once more, a minute on, before anything is called broken.
const first = results.filter((r) => r.verdict === 'broken');
if (first.length) await new Promise((r) => setTimeout(r, Number(process.env.LINK_RECHECK_MS ?? 60000)));
for (const r of first) {
  const a = await ask(r.url);
  r.answer = a;
  r.verdict = verdict(a);
}

const of = (v) => results.filter((r) => r.verdict === v).map((r) => ({ url: r.url, pages: r.pages, why: why(r.answer) })).sort((a, b) => a.url.localeCompare(b.url));
const broken = of('broken');
const unsure = of('unsure');
for (const r of broken) console.log(`::warning::broken: ${r.url} (${r.why}) on ${r.pages.join(', ')}`);
for (const r of unsure) console.log(`could not check: ${r.url} (${r.why})`);
console.log(`check-links: ${results.length} outside links, ${broken.length} broken, ${unsure.length} could not be checked`);

// Most of the web vanishing at once is this runner's network, not the web.
if (broken.length > 3 && broken.length > results.length / 2) {
  console.log(`::warning::${broken.length} of ${results.length} links look gone, which says more about this run's network than the links. Not reporting.`);
  process.exit(0);
}

if (args.includes('--issue')) {
  const gh = issues({ repo: process.env.GITHUB_REPOSITORY, token: process.env.GITHUB_TOKEN });
  if (broken.length) {
    const { title, body } = issueText(broken, unsure);
    await gh.raise('links', title, body);
  } else if (results.length) {
    // An empty list proves nothing, so it never closes the Issue.
    await gh.clear('links', 'The weekly check found no broken outside links.');
  }
}
