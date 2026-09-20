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

     The pointer is tracked against a *region* — [data-tilt-area] — rather than against
     the device itself, so the phone responds to the cursor crossing the hero instead of
     only to the cursor being on top of it. A tilt you have to be hovering to trigger
     reads as a hover state; one that answers the whole section reads as parallax.

     ── It was scoped to the device for part of 2026-09-21, and put back ──
     When the globe arrived the worry was that two objects answering one cursor would
     read as out of step, so this briefly measured the device itself and the phone sat
     still unless you were on it. Watched side by side, the opposite is true: the globe
     and the device leaning the same way at the same time is the effect, and a phone that
     ignores the cursor next to a sky that follows it reads as broken rather than calm.
     Both move together. If that ever needs undoing again, the change is this one line —
     measure against `target` instead of `area`. */
  for (const area of document.querySelectorAll('[data-tilt-area]')) {
    const target = area.querySelector('[data-tilt]');
    if (!target) continue;

    area.addEventListener('pointermove', (e) => {
      const r = area.getBoundingClientRect();
      set(target, {
        '--tx': ((e.clientX - r.left) / r.width  * 2 - 1).toFixed(3),
        '--ty': ((e.clientY - r.top)  / r.height * 2 - 1).toFixed(3),
      });
    }, { passive: true });

    // Return to rest rather than freezing mid-tilt. The CSS transition on --tx/--ty is
    // what makes this a glide and not a snap.
    area.addEventListener('pointerleave', () => set(target, { '--tx': '0', '--ty': '0' }), { passive: true });
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
