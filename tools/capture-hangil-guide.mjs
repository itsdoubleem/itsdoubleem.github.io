/* Captures the HANGIL guide screenshots straight from the shipping build.
 *
 *   npm run dev                          # serves the app at /hangil/
 *   node tools/capture-hangil-guide.mjs  # writes public/assets/hangil/guide/*.png
 *
 * A separate script from capture-hangil.mjs on purpose. That one shoots the app page's
 * strip from a learner five units in; a guide has to start where a new learner starts,
 * from an app that has never been opened. So there are two passes here:
 *
 *   1. a FRESH app — nothing in storage — for the first-run steps and the first lesson;
 *   2. the same app with a little progress written into its own store, for the screens
 *      that are empty until you have used it (review, weak spots). The guide's captions
 *      say those numbers are a sample, as the app page already does.
 *
 * Re-run it after any change to a screen that appears in guides/hangil.md.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

// index.html spelled out: astro dev does not serve a directory index for files copied
// into public/ — the same reason the other two capture scripts name it.
const BASE = process.env.HANGIL_URL || 'http://localhost:4321/hangil/index.html';
const OUT = 'public/assets/hangil/guide';
await mkdir(OUT, { recursive: true });

/* The day is pinned and Math.random is seeded, for the reasons the notes in
 * capture-logger.mjs (the clock) and capture-hangil.mjs (the shuffle) give: without them
 * the streak, the due items and the order of every question's options change from run to
 * run, and an `alt` written against one run stops describing the next. Monday 09:00 KST. */
const CAPTURE_TIME = new Date('2026-09-28T09:00:00+09:00');
const TODAY = '2026-09-28';

const b = await chromium.launch();

const newPage = async () => {
  const page = await b.newPage({
    viewport: { width: 390, height: 844 },
    // 3, matching the other capture scripts — see the note in capture-logger.mjs.
    deviceScaleFactor: 3, hasTouch: true, isMobile: true,
    colorScheme: 'light',
    // The app's "today" is the LOCAL date, so the pinned moment only means Monday in
    // Korea if the browser is in Korea. Without this, a run elsewhere shifts the day and
    // Review comes back empty.
    timezoneId: 'Asia/Seoul',
  });
  await page.clock.install({ time: CAPTURE_TIME });
  await page.clock.resume();
  await page.addInitScript(() => {
    let s = 20260928 >>> 0;
    Math.random = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  });
  return page;
};

const go = async (page, hash, wait = 700) => {
  await page.goto(BASE + hash, { waitUntil: 'networkidle' });
  await page.waitForTimeout(wait);
};
// Every shot is checked for the words its caption in guides/hangil.md relies on, so a
// change in the app — a renamed topic, a reshuffled question, an empty deck — fails here
// instead of producing a picture the caption no longer describes. Only words the picture
// shows count, each one judged on its own: inside the viewport, inside every box that
// clips it (HANGIL cuts card descriptions at two lines, and the cut words are still laid
// out below), not see-through, and with its centre not under something else, such as the
// sticky top bar or the fixed tab bar. A gap left by a hidden word breaks a phrase. The
// chosen option of a <select> and the text in a text box count too, being drawn without a
// text node. Case-blind, for the same reason as scrollTo. What it still cannot tell: a word
// split across two elements (<b>Start</b>ed) is read as two words.
const inView = (page) => page.evaluate(() => {
  const style = new Map();
  const css = (e) => style.get(e) ?? style.set(e, getComputedStyle(e)).get(e);
  const shows = (el, b) => {
    let l = Math.max(b.left, 0), t = Math.max(b.top, 0);
    let r = Math.min(b.right, innerWidth), btm = Math.min(b.bottom, innerHeight);
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
      const st = css(a);
      if (st.visibility === 'hidden' || st.display === 'none' || st.opacity === '0') return false;
      if (st.overflowX !== 'visible' || st.overflowY !== 'visible') {
        const c = a.getBoundingClientRect();
        l = Math.max(l, c.left); t = Math.max(t, c.top); r = Math.min(r, c.right); btm = Math.min(btm, c.bottom);
      }
    }
    if (r - l < 1 || btm - t < 1) return false;
    const hit = document.elementFromPoint((l + r) / 2, (t + btm) / 2);
    return !!hit && (el.contains(hit) || hit.contains(el));
  };
  const out = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walk.nextNode());) {
    const el = n.parentElement;
    if (!n.textContent.trim() || el.closest('select, option, script, style')) continue;
    const range = document.createRange();
    for (const m of n.textContent.matchAll(/\S+/g)) {
      range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length);
      out.push([...range.getClientRects()].some((b) => shows(el, b)) ? m[0] : '¦');
    }
  }
  const typed = 'select, textarea, input:is(:not([type]), [type=text], [type=search], [type=email], '
    + '[type=tel], [type=url], [type=number], [type=button], [type=submit])';
  for (const c of document.querySelectorAll(typed)) {
    const v = c.tagName === 'SELECT' ? c.selectedOptions[0]?.text : c.value;
    if (v && shows(c, c.getBoundingClientRect())) out.push('¦', v, '¦');
  }
  // A phrase may run from one text node into the next (<b>Weak spot:</b> 에), so words
  // join with a space across nodes; only a hidden word, the ¦, breaks it.
  return out.join(' ');
});
const shot = async (page, name, ...mustShow) => {
  const text = (await inView(page)).toLowerCase();
  const missing = mustShow.filter((t) => !text.includes(t.toLowerCase()));
  if (missing.length) {
    throw new Error(`${name}: ${missing.map((t) => `"${t}"`).join(', ')} not on screen — has the app changed?`);
  }
  // The streak flame on Today pulses forever; stopped, every run takes the same picture.
  await page.screenshot({ path: `${OUT}/${name}.png`, animations: 'disabled' });
  console.log(`  → ${name}.png`);
};
// Bring a heading near the top of the screen, clear of the back-button bar, so the
// step's subject is what the reader sees first. Case-blind, because the app upper-cases
// some headings in CSS only.
const scrollTo = async (page, text) => {
  const found = await page.evaluate((t) => {
    const el = [...document.querySelectorAll('span, h2, h3, p, button, label')]
      .find((e) => e.textContent.trim().toLowerCase().startsWith(t.toLowerCase()));
    if (!el) return false;
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 96);
    return true;
  }, text);
  if (!found) throw new Error(`"${text}" is not on this screen — has the app changed?`);
  await page.waitForTimeout(400);
};

// ── Pass 1: an app that has never been opened ──
const fresh = await newPage();

await go(fresh, '#/');
await shot(fresh, '01-today', '어서 오세요', '404 words');                 // the welcome, pointing at lesson 1

await go(fresh, '#/me');
const trade = fresh.locator('label.field', { hasText: 'Trade' }).locator('select');
await trade.selectOption({ label: '식품가공 — Food processing' });
await fresh.waitForTimeout(500);
await scrollTo(fresh, 'Trade');
await shot(fresh, '02-trade', 'Trade', '식품가공 — Food processing', 'job-related questions on your paper');                 // a trade chosen, and what it changes

await scrollTo(fresh, 'Korean voice');
await shot(fresh, '03-voice', 'Test the voice');                 // the voice, the speed, Test the voice

await go(fresh, '#/course/g01/learn');
await fresh.getByRole('button', { name: 'Next' }).click();
await fresh.waitForTimeout(500);
await shot(fresh, '04-learn', '2 / 14', '학생이에요');                 // a pair card: 학생 / 학생이에요

await go(fresh, '#/course/g01/practice');
// The first option, whatever it is: with the seed fixed it is always the same question
// and the same option, and guides/hangil.md describes the screen that results.
await fresh.locator('button', { hasText: /^A/ }).first().click();
await fresh.waitForTimeout(600);
await shot(fresh, '05-practice', 'Not that one');              // answered: wrong, with the right one shown

// ── Pass 2: a learner with a little progress ──
// Real entries in the app's own store, in its own shape (see Hangil_app/src/js/store.js),
// written before boot and then reloaded — the app reads storage once at start.
const used = await newPage();
await go(used, '#/');
await used.evaluate((t) => {
  const done = { at: t, score: 1 };
  localStorage.setItem('hangil.v1', JSON.stringify({
    lang: 'en', theme: 'light', rate: 1, rom: true,
    letters: Object.fromEntries(['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'].map((id) => [id, done])),
    done: { g01: done, g02: done, g03: { at: t, score: 0.83 }, g04: done, g05: { at: t, score: 0.67 } },
    srs: {
      'u:g03:2': { due: t, ivl: 0, ease: 2.2, reps: 0, lapses: 1 },
      'u:g05:1': { due: t, ivl: 0, ease: 2.4, reps: 0, lapses: 1 },
      'w:월급': { due: t, ivl: 0, ease: 2.2, reps: 0, lapses: 1 },
    },
    tags: {
      'place-particles': { right: 3, wrong: 9 },
      'existence': { right: 6, wrong: 2 },
      'copula': { right: 11, wrong: 1 },
    },
    seen: {}, streak: { last: t, count: 6, best: 6 },
    answered: { right: 74, wrong: 12 }, mocks: [],
  }));
}, TODAY);
await used.reload({ waitUntil: 'networkidle' });
await used.waitForTimeout(600);

// guides/hangil.md tells the reader that Weak spots is reached from a card on Today, which
// appears once a topic is under 80% with six answers. Check that it does, here.
await go(used, '#/');
const card = (await used.evaluate(() => document.body.innerText)).includes('Weak spot: 에 against 에서');
if (!card) throw new Error('no "Weak spot: 에 against 에서" card on Today — has the app changed?');

await go(used, '#/review');
await shot(used, '06-review', '1 / 3', 'monthly wage');                 // what is due today

await go(used, '#/weak');
await shot(used, '07-weak', '에 against 에서', '있다');                   // worst first: 에 against 에서

await go(used, '#/exam');
await shot(used, '08-exam', 'By question type', 'Signs and notices');                   // the exam side, by question type

await go(used, '#/exam/paper/mock1');
await shot(used, '09-paper', 'Start the paper', '모의고사 1회');                  // a timed paper, before it starts

await go(used, '#/me');
await scrollTo(used, 'YOUR PROGRESS');
await shot(used, '10-backup', 'Save a backup', 'Restore a backup');                 // Save a backup / Restore a backup

await b.close();
console.log('captured to', OUT);
