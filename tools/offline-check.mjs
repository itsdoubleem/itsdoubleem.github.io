/* Proves HANGIL still works with the network off — the claim the app page makes.
 *
 *   npx astro build && npx astro preview --port 8140
 *   node tools/offline-check.mjs
 *
 * It registers the service worker, cuts the network at the browser context, reloads,
 * and walks three screens that need three different content files. Exits non-zero if
 * any of them fail to render, so it can gate a deploy.
 *
 * Why this exists rather than "it should work": offline has broken twice here, both
 * times silently, and both times the page still loaded enough to look fine.
 *   1. build.mjs stamped the service worker's placeholders by text and hit the comment
 *      naming them, so the worker never parsed.
 *   2. The worker matched the cache without `ignoreVary`. A module script is a CORS-mode
 *      request and carries an Origin header; the precache request does not. Any host
 *      answering static files with `Vary: Origin` therefore missed on js/app.js, and the
 *      only symptom was a page stuck on "Loading…".
 */
import { chromium } from 'playwright';

const BASE = process.env.HANGIL_URL || 'http://localhost:8140/hangil/';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

const reg = await page.evaluate(async () => {
  const r = await navigator.serviceWorker.register('sw.js').catch(e => ({ err: String(e) }));
  if (r.err) return r;
  await navigator.serviceWorker.ready;
  await new Promise(res => setTimeout(res, 1500));
  const keys = await caches.keys();
  const c = await caches.open(keys[0]);
  return { scope: r.scope, cache: keys[0], files: (await c.keys()).length };
});
if (reg.err) { console.error('FAIL — the service worker did not register:', reg.err); process.exit(1); }
console.log(`registered ${reg.cache} — ${reg.files} files precached`);

const problems = [];
page.on('console', m => { if (m.type() === 'error') problems.push(m.text().slice(0, 140)); });

await ctx.setOffline(true);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);

// Three screens, three different content files: the course, the exam paper, the words.
const CHECKS = [
  ['#/course', 'Twenty-four units'],
  ['#/exam/paper/mock1', 'Forty questions'],
  ['#/vocab/v04', '안전'],
];
let failed = 0;
for (const [hash, expect] of CHECKS) {
  const text = await page.evaluate(async (h) => {
    location.hash = h;
    await new Promise(r => setTimeout(r, 450));
    return document.getElementById('app').innerText;
  }, hash);
  const ok = text.includes(expect);
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${hash.padEnd(22)} expected "${expect}"`);
}

await b.close();
if (problems.length) console.log('console errors while offline:\n  ' + problems.join('\n  '));
if (failed) { console.error(`\n${failed} screen(s) did not work offline.`); process.exit(1); }
console.log('\nOffline works. The claim on the app page holds.');
