/* Captures the LOGGER guide screenshots straight from the shipping app.
 *
 * Run it whenever Logger changes, so the guide never shows a screen that no longer
 * exists:   npm run dev        (in one terminal)
 *           node tools/capture-logger.mjs
 *
 * It drives the real app at /logger/ — it does not mock anything. The app hangs its
 * handlers on plain divs and ignores a synthetic .click(), so each tap marks the tightest
 * visible element carrying a label and lets Playwright issue a real pointer sequence.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const URL = process.env.LOGGER_URL || 'http://localhost:4321/logger/index.html';
const APP = 'logger';
const OUT = `public/assets/${APP}/guide`;
await mkdir(OUT, { recursive: true });

const b = await chromium.launch();
const page = await b.newPage({
  viewport: { width: 390, height: 844 },
  /* ── 3, not 2 ──
     These were captured at 2, which makes a 780px file for a 390px layout: pixel-perfect
     on a 2x display and on nothing since. Checked on a Galaxy S24 Ultra at dpr 3.75, a
     780px source is 1:1 only up to 208 CSS px, so every place the site draws a capture
     wider than that was upscaling it — the guide's steps at 289px were running 1.39x.

     3 gives 1170 x 2532, which covers 390 CSS px on a 3x screen and 312 CSS px on this
     one. It does not make 3.75x perfect; it makes the sizes the site actually uses
     correct. Going to 4 would, at 2 MB a file — not worth it for the last 12%.

     Everything downstream assumes only that the file is SOME whole multiple of
     390 x 844 and is never drawn above 390 CSS px. If you change this number, grep for
     "780" — PhoneDevice.astro and DESIGN.md both state the old arithmetic. */
  deviceScaleFactor: 3, hasTouch: true, isMobile: true,
});

/* ── The clock is pinned, and it has to be ──
 * These captures are of a real app that behaves differently on different days. Re-run on
 * a Sunday and LOGGER correctly shows 특근 holiday work with a "Holiday work x1.5" badge
 * and a different explanation — a true screen of a state the guide's copy never mentions,
 * and on card.png, which is the hero image on the front page.
 *
 * That is how a screenshot set drifts without anyone touching the app: the first set was
 * taken on Monday 2026-09-14, the second on a Sunday, and only a side-by-side caught it.
 *
 * So the day is fixed. This is still the real app — nothing is mocked, the wage engine
 * runs exactly as it does for a worker — it is simply told what day it is, which makes
 * the set reproducible instead of depending on when someone happened to run the script.
 * Monday 06:45 is the moment the existing guide copy was written against.
 *
 * `install` freezes time; `resume` lets it tick on from there, which the punch screen's
 * live clock needs. */
const CAPTURE_TIME = new Date('2026-09-14T06:45:00');
await page.clock.install({ time: CAPTURE_TIME });
await page.clock.resume();

const tap = async (text) => {
  const found = await page.evaluate((t) => {
    document.querySelectorAll('[data-pwtap]').forEach(e => e.removeAttribute('data-pwtap'));
    const vis = e => { const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
    const els = [...document.querySelectorAll('div,button,a,span')]
      .filter(e => (e.innerText || '').trim().includes(t) && vis(e));
    els.sort((a, b) => a.innerText.length - b.innerText.length);
    if (!els[0]) return null;
    els[0].setAttribute('data-pwtap', '1');
    els[0].scrollIntoView({ block: 'center' });
    return els[0].innerText.replace(/\n/g, ' ').slice(0, 40);
  }, text);
  await page.waitForTimeout(250);
  if (!found) { console.log(`  ✗ tap(${text}) NOT FOUND`); return false; }
  await page.locator('[data-pwtap]').first().click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(900);
  console.log(`  ✓ tap(${text})`);
  return true;
};

// Full phone-height screenshots, deliberately. Some app screens end above the fold and
// the rest of the frame is empty — that is what the app actually shows, and cropping it
// away would make the guide promise a tighter screen than the reader will meet.
const shot = async (name) => {
  await page.evaluate(() => document.querySelectorAll('[data-pwtap]')
    .forEach(e => e.removeAttribute('data-pwtap')));
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`  → ${name}.png`);
};

const peek = async (tag) => {
  const t = await page.evaluate(() => {
    const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    let top = el; while (top?.parentElement && top.innerText?.length < 200) top = top.parentElement;
    return (top?.innerText || '').replace(/\n{2,}/g, '\n').trim();
  });
  console.log(`\n--- ${tag} ---\n` + t.split('\n').slice(0, 14).join('\n'));
};

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);

await shot('01-language');            // the welcome screen, language grid
await tap('ENGLISH');
await tap('START');

await shot('02-shift');               // 1/4 which shift + when the day shift starts
await tap('Next');

await shot('03-breaks');              // 2/4 unpaid meal break
await tap('Next');

await shot('04-wage');                // 3/4 기본급 basic salary
await tap('Not now');

await shot('05-payperiod');           // 4/4 pay period + payday
await tap('Yes, this is right');

await shot('06-summary');             // setup done
await tap('START PUNCHING');
await shot('07-punch');               // the daily screen, before any record exists

// The homepage card and hero image, emitted from the running app so the picture on the
// front page cannot drift from what the app does. Dismiss the first-run "is this your
// shift?" prompt first: it is correct to show in the guide, but on the card it pushes the
// punch pad — the thing that makes this app recognisable — below the crop.
await tap('Yes, this is right');
await page.waitForTimeout(700);
await page.evaluate(() => document.querySelectorAll('[data-pwtap]')
  .forEach(e => e.removeAttribute('data-pwtap')));
await page.screenshot({ path: `public/assets/${APP}/card.png` });
console.log(`  → ${APP}/card.png`);

// Seed a few finished days. The fingerprint pad cannot run headless, and the 근무내역서
// only exists once days are recorded — so use the app's own "Past shift" entry, which is
// the same path a worker uses when they forget to punch.
await tap('PUNCH');
await page.waitForTimeout(600);
await tap('I clocked in earlier today');
await page.waitForTimeout(500);

const addPastShift = async (day) => {
  // the sheet closes after each CONFIRM, so reopen it every time
  await tap('I clocked in earlier today');
  await tap('Past shift');
  await page.evaluate((d) => {
    document.querySelectorAll('[data-pwtap]').forEach(e => e.removeAttribute('data-pwtap'));
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const cell = [...document.querySelectorAll('div,span,button')]
      .find(e => (e.innerText || '').trim() === String(d) && vis(e));
    if (cell) { cell.setAttribute('data-pwtap', '1'); cell.scrollIntoView({ block: 'center' }); }
  }, day);
  await page.waitForTimeout(300);
  await page.locator('[data-pwtap]').first().click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(700);
  const ok = await tap('CONFIRM');
  console.log(`  · past shift ${day}: ${ok ? 'saved' : 'FAILED'}`);
  await page.waitForTimeout(700);
};
// The CONFIRM button sits below the fold at phone height and the sheet will not scroll
// to it, so seed at a tall viewport and shrink back before taking any more screenshots.
await page.setViewportSize({ width: 390, height: 1400 });
await page.waitForTimeout(400);
for (const d of [8, 9, 10, 11]) await addPastShift(d);
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);

await tap('PAY');
await page.waitForTimeout(700);
await shot('08-pay');                 // what you are owed, with real days behind it

// The 근무내역서 lives at the foot of the PAY tab. Note the label is TRANSLATED —
// "CREATE A WORK RECORD (evidence)" in English, 근무내역서 만들기 (증빙용) in Korean.
// Searching an English app for the Korean string finds nothing and proves nothing.
// tap() scrolls the element into view before clicking, which is the only thing that
// reliably gets this section on screen — the app resets scrollTop on re-render, so
// neither scrollIntoView nor wheel events survive to the screenshot. Clicking also
// produces the "Work record created" line, which is the proof worth showing.
await tap('CREATE A WORK RECORD');
await page.waitForTimeout(1400);
await shot('10-document');            // the document + CSV export

await tap('SETUP');
await page.waitForTimeout(700);
await shot('11-setup');               // the rest of setup: "make it more exact"

await b.close();
console.log('\ndone');
