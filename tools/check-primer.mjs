/* Checks the primer above the deck in the built homepage.
 *
 *   npm run build && node tools/check-primer.mjs
 *
 * Two bug classes have reached a render of that paragraph, both invisible in the source
 * and both obvious on screen, so they are worth catching on the way out of the build.
 *
 * 1. GLUE. In an .astro template a line break between text and an inline element or an
 *    expression is collapsed away, not turned into a space. OneTrueThing.astro has
 *    shipped "firmlyHomo sapiens" and "Chapter 24carries the new date" that way. The fix
 *    is a {' '}, or keeping the expression on the line of the words touching it — neither
 *    of which anything enforces, so this looks at the rendered output instead.
 *
 *    It does NOT scan the text for suspicious-looking joins. That was the first version
 *    and it only fired when a capital or a digit was involved, so moving the </em> one
 *    word along — "Homo sapienswere about" — slipped straight past the check written to
 *    catch exactly that. Instead it records where each tag was removed and asks whether
 *    the characters either side closed up into one word, which is what collapse does
 *    regardless of case.
 *
 * 2. THE CHAPTER NUMBER GOING MISSING. OneTrueThing.astro derives it by matching
 *    PRIMER_SOURCE_URL against curios.ts, and the build throws if that match is not
 *    unique — but a template edit could drop {primerChapter} from the markup entirely and
 *    that guard would still be satisfied. So the number has to be on the page, and it has
 *    to name a chapter the deck actually has.
 *
 * Everything here is a property of the output, which is why it reads dist/ rather than
 * the source. Exits non-zero, so it can gate a deploy.
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

/* Astro adds a data-astro-cid-* attribute to everything it scopes, and the class could
 * gain a neighbour, so match the class inside the attribute rather than requiring it to
 * be the whole of it — and require the word boundary, or curio__primer-src matches too. */
const open = html.match(/<div\b[^>]*\bclass="[^"]*\bcurio__primer\b(?!-)[^"]*"[^>]*>/);
if (!open) {
  console.error(
    'check-primer: no .curio__primer in dist/index.html.\n' +
    'If the markup merely moved or was renamed, point this check at it. Only if the primer\n' +
    'is gone from the page on purpose should this check go — and then the PRIMER_SOURCE_URL\n' +
    'guard at the top of OneTrueThing.astro goes with it, not before it.',
  );
  process.exit(1);
}

/* Walk to the matching close rather than taking the first </div>. A lazy match would stop
 * at the first nested one, silently check half the paragraph and then blame the chapter
 * number for being absent from the part it never read. */
let depth = 1;
let i = open.index + open[0].length;
const start = i;
const tag = /<(\/?)div\b[^>]*>/g;
tag.lastIndex = i;
for (let m; depth > 0 && (m = tag.exec(html)); ) {
  depth += m[1] ? -1 : 1;
  i = m.index;
}
if (depth !== 0) {
  console.error('check-primer: .curio__primer is never closed in dist/index.html.');
  process.exit(1);
}
const inner = html.slice(start, i);

/* A block-level end is a real line break in the rendered text, so it becomes a newline.
 * Everything else is inline and closes up with no space — which is the whole point: an
 * inline tag is exactly where collapse hides. Replacing those with a space would paper
 * over the bug this check exists for. */
const BLOCK = /<\/(p|div|li|h[1-6]|blockquote)\s*>|<br\s*\/?>/gi;
const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');

for (const block of inner.split(BLOCK)) {
  if (block === undefined) continue;
  // Keep a marker where each inline tag was, so the join it made can be inspected.
  const marked = decode(block.replace(/<[^>]+>/g, '\u0000'));
  for (const m of marked.matchAll(/\u0000+/g)) {
    const before = marked.slice(0, m.index).replace(/\u0000/g, '');
    const after = marked.slice(m.index + m[0].length).replace(/\u0000/g, '');
    // Word character hard against word character across the boundary: two words became one.
    if (/[\p{L}\p{N}]$/u.test(before) && /^[\p{L}\p{N}]/u.test(after)) {
      problems.push(
        'two words run together where a tag was: "' +
        (before.slice(-18) + after.slice(0, 18)).trim() + '"',
      );
    }
  }
}

const text = decode(inner.replace(BLOCK, '\n').replace(/<[^>]+>/g, ''))
  .replace(/[^\S\n]+/g, ' ').trim();

/* An EXPRESSION that collapsed leaves no tag behind — {primerChapter} renders as bare
 * text, so "Chapter 24carries the new date" shipped with nothing in the output to mark
 * where the join happened, and the boundary walk above cannot see it. A digit hard
 * against a letter is that join's shape, and it has no legitimate use in this paragraph:
 * every figure here is followed by a space ("300,000 years", "in June 2017 the"). */
for (const m of text.matchAll(/[0-9](?=\p{L})|\p{L}(?=[0-9])/gu)) {
  const at = Math.max(0, m.index - 16);
  problems.push(
    'a number and a word run together — an expression lost its space: "' +
    text.slice(at, m.index + 16).trim() + '"',
  );
}

const chapter = text.match(/Chapter (\d+)/);
if (!chapter) {
  problems.push('no "Chapter N" in the primer — the derived number is not being printed.');
} else {
  /* The counter under each card reads "N of <total>", so the deck states its own size.
   * If that cannot be read, say so and fail: a range check that quietly switches itself
   * off is worse than none, because the success line goes on claiming it ran. */
  const totals = [...html.matchAll(/\bof\s+(\d+)\s*</g)].map((m) => +m[1]);
  const total = totals.length ? Math.max(...totals) : null;
  if (total === null) {
    problems.push(
      'could not read the deck size from the card counters, so "Chapter ' + chapter[1] +
      '" went unchecked. If the counter markup changed, teach this check its new shape.',
    );
  } else if (+chapter[1] < 1 || +chapter[1] > total) {
    problems.push(`the primer points at chapter ${chapter[1]}, but the deck has ${total}.`);
  }
}

/* The paragraph's claims rest on the one link under it. Without it the primer is an
 * anecdote, and both guards above would stay green. */
if (!/<a\b[^>]*href="http/.test(inner)) {
  problems.push('the primer has no citation link — its claims would stand on nothing.');
}

if (problems.length) {
  console.error('check-primer: ' + problems.length + ' problem(s) in the homepage primer\n');
  for (const p of problems) console.error('  ✗ ' + p);
  process.exit(1);
}

console.log(
  `check-primer: the primer reads cleanly, cites its source and points at chapter ${chapter[1]}`,
);
