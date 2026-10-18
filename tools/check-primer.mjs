/* Checks the primer above the deck in the built homepage.
 *
 *   npm run build && node tools/check-primer.mjs
 *
 * Two bug classes have reached a render of this paragraph, both invisible in the source
 * and both obvious on screen, so they are worth catching on the way out of the build.
 *
 * 1. GLUE. In an .astro template a line break between text and an inline element or an
 *    expression is collapsed away, not turned into a space. This file has shipped
 *    "firmlyHomo sapiens" and "Chapter 24carries the new date" that way. The fix is a
 *    {' '} or keeping the expression on the line of the words touching it — neither of
 *    which anything enforces, so this looks at the rendered text instead.
 *
 * 2. THE CHAPTER NUMBER GOING MISSING. OneTrueThing.astro derives it by matching
 *    PRIMER_SOURCE_URL against curios.ts and the build throws if that match is not
 *    unique — but a template edit could drop {primerChapter} from the markup entirely
 *    and the guard above would still be satisfied. So: the number has to be on the page,
 *    and it has to point at a chapter the deck actually has.
 *
 * It reads dist/ rather than the source because both faults are properties of the output.
 * Exits non-zero, so it can gate a deploy.
 */
import { readFile } from 'node:fs/promises';

const page = new URL('../dist/index.html', import.meta.url);
const problems = [];

let html;
try {
  html = await readFile(page, 'utf8');
} catch {
  console.error('check-primer: no dist/index.html — run `npm run build` first');
  process.exit(1);
}

// Astro adds a data-astro-cid-* attribute to every element it scopes, so the opening
// tag is not bare — match any attributes after the class.
const block = html.match(/<div class="curio__primer"[^>]*>([\s\S]*?)<\/div>/);
if (!block) {
  console.error('check-primer: no .curio__primer on the homepage. If the primer was removed on\n' +
    'purpose, delete this check and the PRIMER_SOURCE_URL guard in OneTrueThing.astro with it.');
  process.exit(1);
}

// Tags out, entities in, whitespace normalised — what a reader sees.
const text = block[1]
  .replace(/<[^>]+>/g, '')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

// A lowercase letter or digit hard against a capital, or a digit hard against a letter,
// is the shape both shipped bugs took. "195,000years" and "firmlyHomo" both match; an
// ordinary word, an em dash and "300,000 years" do not.
for (const m of text.matchAll(/[a-z0-9,](?=[A-Z])|[0-9](?=[a-zA-Z])|[a-zA-Z](?=[0-9])/g)) {
  const at = Math.max(0, m.index - 20);
  problems.push(`two words run together: "...${text.slice(at, m.index + 20)}..."`);
}

const chapter = text.match(/Chapter (\d+)/);
if (!chapter) {
  problems.push('no "Chapter N" in the primer — the derived number is not being printed.');
} else {
  // The counter under the last card reads "N of <total>", so the deck states its own size.
  const total = Number(html.match(/of (\d+)<\/p>/)?.[1] ?? html.match(/ of (\d+)\b/)?.[1]);
  if (Number.isFinite(total) && (+chapter[1] < 1 || +chapter[1] > total)) {
    problems.push(`the primer points at chapter ${chapter[1]}, but the deck has ${total}.`);
  }
}

if (problems.length) {
  console.error('check-primer: ' + problems.length + ' problem(s) in the homepage primer\n');
  for (const p of problems) console.error('  ✗ ' + p);
  process.exit(1);
}

console.log(`check-primer: the primer reads cleanly and points at chapter ${chapter[1]}`);
