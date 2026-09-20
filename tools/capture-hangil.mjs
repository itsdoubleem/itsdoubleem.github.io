/* Captures HANGIL's screenshots from the shipping build — never a mock-up.
 *
 *   node tools/build.mjs                 # so dist/ is current
 *   npm run dev            (in the site) # serves it at /hangil/
 *   node tools/capture-hangil.mjs        # writes into public/assets/hangil/
 *
 * Re-run it after any change to a screen that appears here. A card showing a
 * screen the app no longer has is worse than no card.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

// index.html spelled out: astro dev does not serve a directory index for files
// copied into public/, which is the same reason capture-guide.mjs names it too.
const BASE = process.env.HANGIL_URL || 'http://localhost:4321/hangil/index.html';
const OUT = process.env.HANGIL_OUT || 'public/assets/hangil';
await mkdir(`${OUT}/shots`, { recursive: true });

const b = await chromium.launch();
const page = await b.newPage({
  viewport: { width: 390, height: 844 },
  /* 3, matching tools/capture-guide.mjs — see the long note there. 2 makes a 780px file
     for a 390px layout, which is 1:1 only on a 2x display; on a 3.75x phone that is
     pixel-perfect only up to 208 CSS px, and every place this site draws a capture is
     wider than that. 3 gives 1170 x 2532. */
  deviceScaleFactor: 3, hasTouch: true, isMobile: true,
  colorScheme: 'light',
});

/* ── Math.random is seeded, and it has to be ──
 * HANGIL shuffles: which exercise a unit opens on, and the order of a question's
 * options. Re-run the capture and 04-practice came back as a fill-the-gap question where
 * it had been a matching one, and 08-picture's four drawings came back in a different
 * order. Both are true screens of the real app — and both mean the file on disk changes
 * every run, so no diff of a capture set ever means anything, and an `alt` written
 * against one order quietly stops describing the picture.
 *
 * So the app's randomness is made deterministic before it loads. This is NOT mocking the
 * app: every question, drawing and answer is the app's own, the wage of the thing is
 * untouched, and a reader sees a screen the app really produces. It is only fixed which
 * of them, so that re-running this script twice gives the same files twice.
 *
 * Same purpose as the pinned clock in tools/capture-guide.mjs, for the same reason. */
await page.addInitScript(() => {
  let s = 20260920 >>> 0;
  Math.random = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
});

// A little progress, so the screens show the app in use rather than empty. These
// are real answers written into the app's own store, not drawn-on numbers.
const seed = async () => {
  await page.evaluate(() => {
    const t = new Date().toISOString().slice(0, 10);
    const s = {
      lang: 'en', theme: 'light', rate: 0.85, rom: true,
      done: { g01: { at: t, score: 1 }, g02: { at: t, score: 1 }, g03: { at: t, score: 0.83 },
              g04: { at: t, score: 1 }, g05: { at: t, score: 0.83 } },
      srs: { 'u:g03:2': { due: t, ivl: 0, ease: 2.2, reps: 0, lapses: 1 },
             'w:월급':  { due: t, ivl: 0, ease: 2.2, reps: 0, lapses: 1 },
             'u:g05:1': { due: t, ivl: 0, ease: 2.4, reps: 0, lapses: 1 } },
      seen: {}, streak: { last: t, count: 6, best: 6 },
      answered: { right: 74, wrong: 12 }, mocks: [],
      last: { route: '#/course/g06', label: 'The two sets of numbers' },
    };
    localStorage.setItem('hangil.v1', JSON.stringify(s));
  });
};

const go = async (hash, wait = 700) => {
  await page.goto(BASE + hash, { waitUntil: 'networkidle' });
  await page.waitForTimeout(wait);
};
const shot = (name) => page.screenshot({ path: `${OUT}/shots/${name}.png` });

// Seed, then RELOAD. The app reads localStorage once at boot and holds the state
// in memory, so writing the key under a running app achieves nothing — its next
// save simply puts the old state back. This cost one confusing set of captures.
await page.goto(BASE, { waitUntil: 'networkidle' });
await seed();
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(600);

// Today and the card image come first, before any other screen has a chance to
// write "carry on where you left off" to something the capture did not intend.
await shot('01-today');
await page.screenshot({ path: `${OUT}/card.png` });

await go('#/course');               await shot('02-course');
await go('#/course/g19');           await shot('03-lesson');
await go('#/course/g01/practice');  await shot('04-practice');
await go('#/exam');                 await shot('05-exam');
await go('#/exam/drill/d01');       await shot('06-sign');
await go('#/vocab/v04');            await shot('07-vocab');
await go('#/exam/drill/d08', 900);  await shot('08-picture');

await b.close();
console.log('captured to', OUT);
