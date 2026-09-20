/* The first script on this site, and the one that moves the page's own furniture.
 * (/globe.js is the other, and it only decides whether to draw the globe.)
 *
 * It exists because exactly two effects need a pointer position and therefore cannot be
 * done in CSS: the 3D tilt on the hero device, and the edge highlight that follows the
 * cursor around a panel. Everything else that moves on this site — the entry stagger,
 * the idle float, the scroll reveals, the image wipes, the carousel — is CSS, and stays
 * CSS. See DESIGN.md § Motion for why that boundary is drawn where it is.
 *
 * ── Rules this file must keep ──
 *  1. It writes CSS custom properties and nothing else. It never sets a layout property,
 *     never inserts an element, never touches text. Everything it does is composited.
 *  2. The page is complete without it. Both effects have a CSS resting state that is the
 *     correct, finished appearance — JavaScript off, touch screen, or a blocked request
 *     all give a page that looks deliberate rather than broken.
 *  3. It reads nothing about the visitor and stores nothing. No cookies, no storage, no
 *     network. The claims on the about page and in apps/logger.md say so, and a visitor
 *     is invited to check them in the network panel.
 *  4. It is served from /public as its own file rather than bundled into an /_astro
 *     hash. That is on purpose: the copy tells people to open the network panel and
 *     count the requests, so the one script has to be findable and named.
 *
 * Keep it under 2 KB. If it needs to grow past "moves things", the four claim sites
 * listed in rule 3 change in the same commit.
 */

// A pointer effect for a device without a pointer is jank with no payoff, and someone
// who asked their OS to stop moving things asked this too. Both bail before any
// listener is attached, so a phone pays the parse cost and nothing else.
const fine = matchMedia('(pointer: fine)');
const still = matchMedia('(prefers-reduced-motion: reduce)');

if (fine.matches && !still.matches) {
  // One rAF for the whole page. Pointer events fire far faster than the compositor
  // draws, so without this the same custom property is written a dozen times between
  // two frames and every write invalidates style for its subtree.
  let queued = false;
  const pending = new Map();

  const flush = () => {
    queued = false;
    for (const [el, props] of pending) for (const k in props) el.style.setProperty(k, props[k]);
    pending.clear();
  };

  const set = (el, props) => {
    pending.set(el, Object.assign(pending.get(el) || {}, props));
    if (!queued) { queued = true; requestAnimationFrame(flush); }
  };

  /* ── The tilt ──
     --tx and --ty are signed, -1 to 1, measured from the centre of the element the
     pointer is being tracked against. The CSS decides how many degrees that is worth,
     which is what lets the media query at 900px flatten the tilt to zero without this
     file knowing anything about breakpoints.

     ── What the pointer is measured against, and why it changed twice ──
     It started as the hero region, [data-tilt-area], so the device answered the cursor
     crossing the section rather than only the cursor being on top of it: a tilt you have
     to hover to trigger reads as a hover state, one that answers a region reads as
     parallax. On 2026-09-21 it was briefly narrowed to the device itself, on the theory
     that the device and the new globe answering one cursor would look out of step. Both
     of those are gone, for the same reason: a listener bound to an element only fires
     while the pointer is over that element, so the device froze the moment you left it —
     first the moment you left the hero, then the moment you left the phone. Beside a sky
     that keeps answering the cursor the whole way down the page, a device that stops
     reads as broken.

     So it is measured against the VIEWPORT and listened for on the window, which is the
     same footing the globe is on. Cursor left edge, device leans left; cursor bottom
     right, it leans down and right; and it keeps answering in the footer, because the
     window never stops sending the events. Rest is the middle of the screen, and a
     pointer that leaves the document entirely resets it rather than freezing it.

     The [data-tilt-area] attribute stays: it is the markup contract that says which
     region owns a tiltable thing, and the loop still uses it to find the target. It is
     simply no longer what the pointer is measured against. */
  for (const area of document.querySelectorAll('[data-tilt-area]')) {
    const target = area.querySelector('[data-tilt]');
    if (!target) continue;

    addEventListener('pointermove', (e) => {
      set(target, {
        '--tx': (e.clientX / innerWidth  * 2 - 1).toFixed(3),
        '--ty': (e.clientY / innerHeight * 2 - 1).toFixed(3),
      });
    }, { passive: true });

    /* Return to rest rather than freezing mid-tilt when the pointer leaves the window.
       The CSS transition on --tx/--ty is what makes this a glide and not a snap.

       `pointerout` with a null relatedTarget, NOT `pointerleave` on the document. The
       latter looks like the right event and is not: it fires on transitions that are
       still inside the page, so the device kept snapping back to centre a moment after
       it had been aimed. A null relatedTarget is the one signal that means the pointer
       actually went outside the window. */
    document.addEventListener('pointerout', (e) => {
      if (e.relatedTarget === null) set(target, { '--tx': '0', '--ty': '0' });
    }, { passive: true });
  }

  /* ── The edge highlight ──
     --gx/--gy are the pointer's position inside the panel, in percent. They default to
     50%/50% in global.css, so with this script absent a hovered panel still lights up —
     evenly, from the middle, instead of from the cursor. Nothing is hidden behind the
     script; it only makes the light directional.

     One delegated listener on the document rather than one per panel: the bento grid
     plus the app cards is a dozen elements, and `closest` on a pointermove is cheaper
     than a dozen live listeners plus the bookkeeping to remove them. */
  document.addEventListener('pointermove', (e) => {
    const el = e.target instanceof Element && e.target.closest('[data-glow]');
    if (!el) return;
    const r = el.getBoundingClientRect();
    set(el, {
      '--gx': ((e.clientX - r.left) / r.width  * 100).toFixed(1) + '%',
      '--gy': ((e.clientY - r.top)  / r.height * 100).toFixed(1) + '%',
    });
  }, { passive: true });
}
