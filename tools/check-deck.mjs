/* Checks the "From the Big Bang to now" deck in the built homepage.
 *
 *   npm run build && node tools/check-deck.mjs
 *
 * The deck is a radio group with no JavaScript: one hidden radio per chapter, plus a
 * 43rd sentinel, #curio-auto, which is checked on load and means "auto mode". Every
 * visible control is a <label> pointing at one of the real radios, and a checked radio
 * reveals its card through a sibling selector. That design has exactly one way to put
 * NOTHING on the screen, and this check exists because it was reached:
 *
 *   AUTO MODE PLUS FOCUS INSIDE THE DECK IS A BLANK DECK. In auto mode every card is
 *   display:block, visibility:hidden, opacity:0, and the one on screen is whichever
 *   card's curio-cycle animation is inside its window. ":focus-within" pauses those
 *   animations — a WCAG 2.2.2 courtesy, so text does not replace itself under a reader
 *   — and a card paused at currentTime 0 is sitting on the 0% keyframe, which is
 *   opacity: 0. So if the deck can be put back into auto mode while something inside it
 *   has focus, every one of the 42 cards is invisible for as long as focus stays there.
 *
 *   It could be, in one keystroke. "tabindex=-1" and "aria-hidden" take the sentinel off
 *   the tab order and out of the accessibility tree; neither takes it out of the radio
 *   group, and arrow keys walk the group. After any manual interaction, ArrowLeft or
 *   ArrowUp on chapter 1 wrapped onto the sentinel, checked it, and blanked the deck.
 *
 * So the invariant is: THE SENTINEL MUST NOT BE REACHABLE BY THE ARROW WALK, and
 * "disabled" is what keeps it out — a disabled radio still matches ":checked", so auto
 * mode still runs on load, and checking any real radio still takes the check from it.
 *
 * Everything below is a property of the built page rather than of the source, which is
 * why it reads dist/. Exits non-zero, so it can gate a deploy.
 */
import { readFile } from 'node:fs/promises';

const page = new URL('../dist/index.html', import.meta.url);
const problems = [];

let html;
try {
  html = await readFile(page, 'utf8');
} catch {
  console.error('check-deck: no dist/index.html — run `npm run build` first');
  process.exit(1);
}

/* Match the class inside the attribute rather than requiring it to be the whole of it:
 * Astro adds its own data-astro-cid-* attribute and the class could gain a neighbour. */
const deckOpen = html.match(/<div\b[^>]*\bclass="[^"]*\bcurio__deck\b[^"]*"[^>]*>/);
if (!deckOpen) {
  console.error(
    'check-deck: no .curio__deck in dist/index.html.\n' +
    'If the deck merely moved or was renamed, point this check at it. Only if the deck is\n' +
    'gone from the homepage on purpose should this check go with it.',
  );
  process.exit(1);
}

/* Everything from the deck's opening tag to the end of the section it lives in. The deck
 * contains nested divs, and walking to its matching close is not worth the code here:
 * the radios are all immediate children of the opening tag, so the slice only has to be
 * long enough to hold them and short enough not to reach another radio group. There is
 * no other radio on this page, so </section> is a safe stop. */
const sectionEnd = html.indexOf('</section>', deckOpen.index);
const deck = html.slice(deckOpen.index, sectionEnd === -1 ? html.length : sectionEnd);

const radios = [...deck.matchAll(/<input\b[^>]*\btype="radio"[^>]*>/g)].map((m) => m[0]);
const idOf = (tag) => (tag.match(/\bid="([^"]*)"/) || [])[1];
const has = (tag, attr) => new RegExp('\\s' + attr + '(?=[\\s>=])').test(tag);

if (radios.length === 0) {
  console.error('check-deck: the deck has no radios at all — the whole mechanism is gone.');
  process.exit(1);
}

/* 1. The sentinel is first, and it is the one that starts checked. Every auto-mode rule
 *    reaches the cards with a plain sibling combinator from here, so a radio moving above
 *    it silently drops those rules. */
const sentinel = radios[0];
if (idOf(sentinel) !== 'curio-auto') {
  problems.push(
    'the first radio in the deck is "' + idOf(sentinel) + '", not "curio-auto". The ' +
    'sentinel has to stay first or the auto-mode sibling selectors stop reaching the cards.',
  );
}

/* 2. THE FIX ITSELF. Without "disabled" the arrow walk reaches the sentinel and the deck
 *    can be blanked by one keystroke. */
if (!has(sentinel, 'disabled')) {
  problems.push(
    '#curio-auto is not disabled. It is then a member of the radio group that arrow keys ' +
    'walk, so ArrowLeft or ArrowUp on chapter 1 wraps onto it, the deck re-enters auto ' +
    'mode with focus inside itself, :focus-within pauses curio-cycle at its 0% keyframe ' +
    '(opacity: 0) and every card is invisible. "tabindex=-1" and "aria-hidden" do not ' +
    'prevent this — they govern the tab order and the accessibility tree, not the group.',
  );
}
if (!has(sentinel, 'checked')) {
  problems.push('#curio-auto is not checked, so the deck does not start in auto mode.');
}

/* 3. The chapter radios, which must NOT be disabled — that is what would take the deck
 *    off the keyboard altogether. */
const chapters = radios.slice(1);
const disabledChapters = chapters.filter((r) => has(r, 'disabled')).map(idOf);
if (disabledChapters.length) {
  problems.push(
    'these chapter radios are disabled, which takes their chapters off the keyboard and ' +
    'stops their labels working: ' + disabledChapters.join(', '),
  );
}

/* 4. One card per chapter radio. A mismatch means some card can never be shown, or some
 *    radio shows nothing. */
const cards = [...deck.matchAll(/\bclass="[^"]*\bcurio__card--(\d+)\b/g)].map((m) => +m[1]);
if (cards.length !== chapters.length) {
  problems.push(
    'the deck has ' + chapters.length + ' chapter radios but ' + cards.length + ' cards.',
  );
}
for (let i = 0; i < chapters.length; i += 1) {
  if (idOf(chapters[i]) !== 'curio-' + i) {
    problems.push('chapter radio ' + i + ' is "' + idOf(chapters[i]) + '", not "curio-' + i + '".');
    break;
  }
}

/* 5. The injected stylesheet. It is written into the page verbatim by OneTrueThing.astro,
 *    so these are plain substring questions about it. */
const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
const sheet = styles.find((s) => s.includes('#curio-auto:checked'));
if (!sheet) {
  problems.push('no stylesheet in the page carries the #curio-auto rules.');
} else {
  /* THE FLOOR, and it has to stay outside the prefers-reduced-motion query: if the timer
   * cannot run for any reason at all — reduced motion, an engine that drops the
   * animation — chapter 1 is still on screen. Cutting the sheet at the query's opening
   * brace is enough to tell which side of it the rule is on, because that query is the
   * only one in this sheet and nothing follows it. */
  const queryAt = sheet.indexOf('@media (prefers-reduced-motion');
  const outsideQuery = queryAt === -1 ? sheet : sheet.slice(0, queryAt);
  if (!/#curio-auto:checked\s*~\s*\.curio__card--0\s*\{[^}]*display:\s*block/.test(outsideQuery)) {
    problems.push(
      'the floor rule is missing from outside the prefers-reduced-motion query. Without ' +
      '"#curio-auto:checked ~ .curio__card--0 { display: block; }" there, a visitor whose ' +
      'browser never runs the timer gets an empty deck instead of chapter 1.',
    );
  }

  /* A stray copy of the per-card animation rule once sat in this sheet with its ${...}
   * expressions uninterpolated, split one character to a line — 111 lines and 222 bytes
   * of text the browser threw away. A single-character line is ordinary CSS ("}"), but
   * five in a row is not, so that is the shape this looks for rather than the content. */
  const lines = sheet.split('\n');
  let run = 0;
  for (let i = 0; i <= lines.length; i += 1) {
    const short = i < lines.length && lines[i].trim().length <= 1;
    if (short) { run += 1; continue; }
    if (run >= 5) {
      problems.push(
        'the injected stylesheet has ' + run + ' consecutive lines of one character, ' +
        'ending at line ' + i + '. That is the shape of a template literal that was ' +
        'pasted or edited a character at a time; read it before deleting it.',
      );
      break;
    }
    run = 0;
  }

  /* The pause is a WCAG 2.2.2 answer, not a nicety — text must not replace itself under
   * someone reading it. It is also the thing that makes a paused 0% keyframe visible as
   * a blank deck, so anyone fixing that bug by deleting the pause should be stopped. */
  if (!sheet.includes(':focus-within')) {
    problems.push(
      'nothing in the deck stylesheet pauses on :focus-within. A keyboard reader then has ' +
      'no way to hold a chapter still while reading it (WCAG 2.2.2).',
    );
  }
}

if (problems.length) {
  console.error('check-deck: ' + problems.length + ' problem(s) in the homepage deck\n');
  for (const p of problems) console.error('  ✗ ' + p);
  process.exit(1);
}

console.log(
  `check-deck: ${chapters.length} chapters, the sentinel is first, checked and disabled, ` +
  'and the floor rule survives outside the motion query',
);
