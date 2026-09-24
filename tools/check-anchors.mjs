/* Checks that every same-page link in the built site lands somewhere.
 *
 *   npm run build && node tools/check-anchors.mjs
 *
 * The update notice's badge is a link to #<notice id>, and nothing about a link to a
 * missing id looks broken — the page simply fails to scroll, and the reader who was
 * told to read something first never finds it. So this reads dist/, collects every id
 * on each page, and fails if any href="#x" on that page has no id="x" to go to.
 *
 * It runs on the output rather than on the content because the ids are made by the
 * templates. Exits non-zero, so it can gate a deploy.
 */
import { readFile, readdir } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
const problems = [];
let pages = 0;

async function* html(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
    if (entry.isDirectory()) yield* html(url);
    else if (entry.name.endsWith('.html')) yield url;
  }
}

try {
  await readdir(dist);
} catch {
  console.error('check-anchors: no dist/ — run `npm run build` first');
  process.exit(1);
}

for await (const file of html(dist)) {
  pages++;
  const page = await readFile(file, 'utf8');
  const all = [...page.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const ids = new Set(all);
  // Two elements with one id and a #link lands on whichever comes first — a notice id
  // of "main" did exactly that, and nothing looked wrong.
  for (const id of new Set(all.filter((id, i) => all.indexOf(id) !== i))) {
    problems.push(`${file.pathname.slice(dist.pathname.length)}: id="${id}" is used more than once`);
  }
  for (const [, target] of page.matchAll(/\shref="#([^"]+)"/g)) {
    if (!ids.has(decodeURIComponent(target))) {
      problems.push(`${file.pathname.slice(dist.pathname.length)}: links to #${target}, which is not on the page`);
    }
  }
}

if (problems.length) {
  console.error(`check-anchors: ${problems.length} problem(s)\n  - ${problems.join('\n  - ')}`);
  process.exit(1);
}
console.log(`check-anchors: ${pages} page(s), every #link lands on exactly one element`);
