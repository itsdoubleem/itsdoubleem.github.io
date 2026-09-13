/* Captures the LOGGER guide screenshots straight from the shipping app.
 *
 * Run it whenever Logger changes, so the guide never shows a screen that no longer
 * exists:   npm run dev        (in one terminal)
 *           node tools/capture-guide.mjs
 *
 * It drives the real app at /logger/ — it does not mock anything. The app hangs its
 * handlers on plain divs and ignores a synthetic .click(), so each tap marks the tightest
 * visible element carrying a label and lets Playwright issue a real pointer sequence.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const URL = process.env.LOGGER_URL || 'http://localhost:4321/logger/index.html';
const APP = 'logger';
const OUT = 'tools/sample-output';
const NAME = 'Jane Doe';
const COMPANY = '(주) 가나다산업';
await mkdir(OUT, { recursive: true });

const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2, hasTouch: true, isMobile: true, acceptDownloads: true,
});
const page = await ctx.newPage();

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
const shot = async () => {};

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

// invented identity
await tap('SETUP'); await page.waitForTimeout(500);
await tap('My details'); await page.waitForTimeout(700);
for (const [frag, val] of [['as written on your', NAME], ['company name', COMPANY]]) {
  await page.locator(`input[placeholder*="${frag}"]`).first().fill(val, { timeout: 4000 })
    .catch(() => console.log(`  ✗ could not fill ${frag}`));
  await page.waitForTimeout(300);
}
console.log(`  identity: ${NAME} · ${COMPANY}`);

await tap('PAY');
await page.waitForTimeout(1200);
const period = await page.evaluate(() => {
  const t = document.body.innerText; const i = t.indexOf('PAY PERIOD SHOWN');
  return i < 0 ? '?' : t.slice(i, i + 60).replace(/\n+/g, ' ');
});
console.log(`  ${period}`);
for (const [label, file] of [['CREATE A WORK RECORD', 'record.html'], ['CSV', 'records.csv']]) {
  const dl = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
  await tap(label);
  const d = await dl;
  console.log(d ? `  → ${OUT}/${file}` : `  ✗ no download for ${label}`);
  if (d) await d.saveAs(`${OUT}/${file}`);
  await page.waitForTimeout(800);
}
await b.close();
console.log('\ndone');
