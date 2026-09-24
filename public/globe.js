/* The second script on this site, and the one that decides which field gets drawn.
 *
 * It paints nothing itself. It asks one question — is this a wide screen with a real
 * pointer and a working WebGL context? — and branches on the answer:
 *
 *   yes  /three.min.js and /globe-scene.js, which draw the globe in the sky behind the
 *        story on the front page and, on every other page, the orb field that globe
 *        sits in.
 *   no   /sky-mobile.js, which draws that orb field alone in a 2D canvas — no globe,
 *        no library, no bloom pass.
 *
 * "Wide enough" is two tests, not one: a mouse on a window over 901px, OR any window at
 * all over 1200px. The second is what lets a tablet have the globe — see the note on the
 * gate below for the measurements, and for why a phone holding up a "Desktop site" sign
 * still does not get it.
 *
 * ── It used to ask a second question ──
 * `if (!document.querySelector('.curio')) return;` — no curio deck, no globe, nothing
 * to do. That was right while the scene was only ever a planet. /globe-scene.js now has
 * a dust-only mode and mounts it wherever there is no deck, so the interior pages are
 * no longer a reason to stop: the scene decides what it draws, and this file is back to
 * deciding only whether the device can afford to draw anything at all.
 *
 * The cost of that is the whole of what changed here, and it is real: /three.min.js is
 * now fetched on any wide screen, not only on the front page. It is one request, cached
 * across the site after the first page, and the gate below still keeps it away from
 * every handset. The about page, README.md and src/site.ts say so in those words.
 *
 * ── The phone branch, and what it does and does not cost ──
 * A PHONE STILL NEVER FETCHES /three.min.js. That is not politeness, it is the whole
 * reason this file exists separately from the scene: the library is 589KB, and a
 * handset should never spend that on decoration. What it fetches instead is
 * /sky-mobile.js, about 20KB on disk and 8KB over the wire, which draws the same drifting motes with a
 * pre-rendered sprite and a divide.
 *
 * That branch is new. This file used to load nothing at all on a phone, on the grounds
 * that the CSS sky was the whole picture there and the WebGL one was unaffordable —
 * both still true, and neither was ever an argument for phones having no orbs. The
 * owner asked for the field on 2026-09-22, having seen the globe on a handset and not
 * wanted THAT. So: the orbs, and not the globe, which is exactly what the dust-only
 * mount already draws on every interior page of the wide-screen build.
 *
 * The same branch serves anyone whose browser has no WebGL and anyone on a narrow
 * desktop window. In every one of those cases the page is still complete without EITHER
 * file, which is the rule every decorative layer on this site has to meet: the front
 * page keeps its CSS sky under the orbs, and an interior page keeps the ground, the
 * glow and the grid it always had — nothing is left with a hole in it. See DESIGN.md
 * § The atmosphere.
 */
(function () {
  'use strict';

  function load(src, done) {
    var el = document.createElement('script');
    el.src = src;
    el.defer = true;
    if (done) el.onload = done;
    document.head.appendChild(el);
  }

  function webgl() {
    try {
      var probe = document.createElement('canvas');
      return !!(probe.getContext('webgl') || probe.getContext('experimental-webgl'));
    } catch (err) {
      return false;
    }
  }

  function mq(q) { return window.matchMedia(q).matches; }

  /* ── Two ways to earn the globe, and why it is not one ──
     A mouse on a wide window is a desktop or a laptop. That test is the original and is
     unchanged.

     The second exists because a TABLET fails it. Measured on a Galaxy Tab S10 Ultra
     (SM-X926N) over adb, Chrome in desktop mode, on the live site:

         viewport 1691x882   screen 1692x1056   dpr 1.75   physical 2961x1848
         min-width: 901px  true        pointer: fine  FALSE     pointer: coarse true
         any-pointer: fine true        WebGL  Mali-G720-Immortalis MC12

     `pointer: fine` means a mouse or a trackpad, and it is false on a touch screen
     however large the screen is — so a 14.6-inch tablet with a flagship GPU was taking
     the branch built for handsets. The owner reported it on 2026-09-22 as "the
     background is not the same as the web version", which it was not.

     ── Why 1200 and not 901 ──
     Because the thing this has to keep out is a PHONE in Chrome's "Desktop site" mode,
     which reports a viewport around 980 CSS px and would sail through a 901 test — and
     then a handset downloads the 589KB library, which the about page, README.md and
     src/site.ts all promise it does not. 1200 sits above that and a long way below
     the tablet's 1691, with room on both sides.

     ── What is deliberately NOT used ──
     `any-pointer: fine` is true on the tablet, because of the S Pen. It is also true on
     the owner's S24 Ultra, for the same reason, so it separates nothing.
     `navigator.userAgentData.mobile` is false on the tablet — and is also false on any
     phone in desktop mode, because that is what desktop mode does.
     Physical pixels do not work either: the tablet is 1848 across its short side and the
     phone is 1440, which is not a gap anything should be balanced on.
     A CSS viewport width is the honest measure, because it is also what decides whether
     the page around the globe is the wide layout at all.

     The gate is read once, at load. A window dragged across a threshold keeps whichever
     field it started with until the next navigation — the alternative is tearing down a
     live scene and building the other one mid-drag, which is a lot of machinery for a
     case nobody is in. */
  var wide = (
    (mq('(min-width: 901px)') && mq('(pointer: fine)')) ||   // desktop, laptop
    mq('(min-width: 1200px)')                                // a screen this wide is not a handset
  ) && webgl();

  if (!wide) {
    load('/sky-mobile.js');
    return;
  }

  // Order matters: the scene needs THREE on the window before it runs.
  load('/three.min.js', function () { load('/globe-scene.js'); });
})();
