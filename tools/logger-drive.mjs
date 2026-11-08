/* Driving the shipping LOGGER app from Playwright — shared by capture-logger.mjs and
 * make-sample-record.mjs, so the two cannot drift apart again.
 *
 * The app hangs its handlers on plain divs and ignores a synthetic .click(), so each tap
 * marks an element carrying the label and lets Playwright issue a real pointer sequence.
 */

/* Which element a tap should hit, run inside the page. Of the visible elements whose text
 * includes the label, take the tightest one that a finger could actually reach — the one
 * on top at its own centre once it is scrolled into view.
 *
 * "On top" is the part that matters since LOGGER 1.4: the welcome screen is an overlay
 * drawn over the live punch screen, so the punch pad's own "START" is visible, sized and
 * shorter than the welcome's "시작하기 START" button. Picking by length alone tapped the
 * pad underneath the overlay, and every later step ran against the welcome screen.
 *
 * Returns a short description of the element it marked, or null. Exported so the test can
 * run it against a plain DOM. */
export function markTarget(label) {
  document.querySelectorAll('[data-pwtap]').forEach((e) => e.removeAttribute('data-pwtap'));
  const vis = (e) => {
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden';
  };
  const els = [...document.querySelectorAll('div,button,a,span')]
    .filter((e) => (e.innerText || '').trim().includes(label) && vis(e));
  els.sort((a, b) => a.innerText.length - b.innerText.length);
  for (const e of els) {
    e.scrollIntoView({ block: 'center' });
    const r = e.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (top && (top === e || e.contains(top) || top.contains(e))) {
      e.setAttribute('data-pwtap', '1');
      return (e.innerText || '').replace(/\n/g, ' ').slice(0, 40);
    }
  }
  return null;
}

export function driver(page) {
  const unmark = () => page.evaluate(() => document.querySelectorAll('[data-pwtap]')
    .forEach((e) => e.removeAttribute('data-pwtap')));

  const tap = async (label) => {
    const found = await page.evaluate(markTarget, label);
    await page.waitForTimeout(250);
    if (!found) { console.log(`  ✗ tap(${label}) NOT FOUND`); return false; }
    try {
      await page.locator('[data-pwtap]').first().click({ timeout: 5000 });
    } catch (err) {
      console.log(`  ✗ tap(${label}) did not click: ${err.message.split('\n')[0]}`);
      return false;
    }
    await page.waitForTimeout(900);
    console.log(`  ✓ tap(${label})`);
    return true;
  };

  return { tap, unmark };
}
