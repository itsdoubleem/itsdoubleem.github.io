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
 * every handset. The about page, README.md and apps/logger.md say so in those words.
 *
 * ── The phone branch, and what it does and does not cost ──
 * A PHONE STILL NEVER FETCHES /three.min.js. That is not politeness, it is the whole
 * reason this file exists separately from the scene: the library is 589KB, and a
 * handset should never spend that on decoration. What it fetches instead is
 * /sky-mobile.js, about 7KB over the wire, which draws the same drifting motes with a
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

  /* The gate is read once, at load. A window dragged across 901px keeps whichever field
     it started with until the next navigation — the alternative is tearing down a live
     scene and building the other one mid-drag, which is a lot of machinery for a case
     nobody is in. */
  var wide = window.matchMedia('(min-width: 901px)').matches &&
             window.matchMedia('(pointer: fine)').matches &&
             webgl();

  if (!wide) {
    load('/sky-mobile.js');
    return;
  }

  // Order matters: the scene needs THREE on the window before it runs.
  load('/three.min.js', function () { load('/globe-scene.js'); });
})();
