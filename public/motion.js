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
 *  1. It writes CSS custom properties, plus ONE marker class on <html>. It never sets a
 *     layout property, never inserts an element, never touches text. Everything it does
 *     is composited.
 *
 *     The marker is `has-mouse`, added the first time a real mouse moves. It is here
 *     because no media query can answer the question the CSS needs answered — see § The
 *     mouse that arrives later, below. global.css and OneTrueThing.astro name it.
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
 * The budget is behaviour, not bytes: "moves things", and nothing past it. The file is
 * about 4 KB over the wire — it was 2 KB before the mouse-detection note below was
 * written, and 61 of its 197 lines are code. If the BEHAVIOUR grows past moving things,
 * the four claim sites listed in rule 3 change in the same commit.
 */

/* ── The mouse that arrives later ──
   A pointer effect for a device without a pointer is jank with no payoff, and someone
   who asked their OS to stop moving things asked this too.

   `(pointer: fine)` asks whether the PRIMARY input is a fine one, and that is the right
   question for a phone: an S24 Ultra has an S-Pen, so it answers `hover: hover` and
   `any-pointer: fine` truthfully, and gating on either of those latched the deck's glow
   on for three and a half seconds after a tap. global.css has the measurements, by
   [data-glow].

   It is the WRONG question for a tablet with a mouse plugged into it. Measured on a
   Galaxy Tab S10 Ultra over adb, mouse connected:

       pointer: fine FALSE     pointer: coarse   true
       any-pointer: fine true  any-hover: hover  true

   The primary input is still the touchscreen, so `pointer: fine` is false and stays
   false while you move a real cursor around the screen. The owner reported it on
   2026-09-22: the phone in the hero did not lean, and the deck's card did not light.

   No media query separates that tablet from that phone — both answer `any-pointer: fine`,
   because both have a stylus. So the mouse is not asked about, it is WAITED FOR. On a
   device that could have one, a single listener waits for a `pointermove` whose
   `pointerType` is `mouse`; only then do the effects start and `has-mouse` go on <html>.
   A finger reports `touch` and a stylus reports `pen`, so neither ever trips it, and the
   phone behaves exactly as it did before.

   The cost on a device that never sees a mouse is one passive listener that reads one
   property and returns. A touchscreen with no stylus attaches nothing at all. */
const fine = matchMedia('(pointer: fine)');
const anyFine = matchMedia('(any-pointer: fine)');
const still = matchMedia('(prefers-reduced-motion: reduce)');

// `pointerType` is '' on some synthetic events; only a stated non-mouse type is refused.
const notMouse = (e) => e.pointerType && e.pointerType !== 'mouse';

let armed = false, running = false;

/* Both queries are watched, not just read: a mouse plugged into a tablet mid-visit flips
   `any-pointer: fine` to true, and a page that only looked once would stay inert until
   the next navigation. Listening to a MediaQueryList costs nothing until it changes,
   which is the difference between this and arming a pointer listener on every device. */
arm();
fine.addEventListener('change', arm);
anyFine.addEventListener('change', arm);

function arm() {
  if (running || armed) return;
  if (fine.matches) { mouseIsHere(); return; }   // desktop: no waiting needed
  if (!anyFine.matches) return;                  // no fine pointer exists at all

  armed = true;
  const probe = (e) => {
    if (notMouse(e)) return;                     // a finger says `touch`, a stylus `pen`
    removeEventListener('pointermove', probe);
    mouseIsHere();
  };
  addEventListener('pointermove', probe, { passive: true });
}

function mouseIsHere() {
  if (running) return;
  running = true;

  /* The class the CSS is waiting on. `:hover` on a touch screen is Android's phantom
     hover — it arrives after the finger lifts and overstays — so every hover rule on
     this site is behind `(pointer: fine)` OR this class, and this class is only ever set
     by a real mouse having moved.

     It goes on REGARDLESS of prefers-reduced-motion, and the two effects below do not.
     Revealing a panel under the cursor is not motion; a desktop under that preference
     has always kept it, by way of the media query, and a tablet should not lose it for
     want of a class. What the preference stops is the aiming — the tilt and the
     directional edge — which is the part that moves. */
  document.documentElement.classList.add('has-mouse');
  if (still.matches) return;

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
      if (notMouse(e)) return;   // a finger dragging the page is not aiming anything
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
    if (notMouse(e)) return;
    const el = e.target instanceof Element && e.target.closest('[data-glow]');
    if (!el) return;
    const r = el.getBoundingClientRect();
    set(el, {
      '--gx': ((e.clientX - r.left) / r.width  * 100).toFixed(1) + '%',
      '--gy': ((e.clientY - r.top)  / r.height * 100).toFixed(1) + '%',
    });
  }, { passive: true });
}
