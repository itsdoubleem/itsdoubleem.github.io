/* The third script on this site, and the one that decides whether there is a fourth.
 *
 * It paints nothing itself. It asks one question — is this a wide screen with a real
 * pointer and a working WebGL context? — and only then fetches /three.min.js and
 * /globe-scene.js, which draw the globe in the sky behind the story on the front page
 * and, on every other page, the orb field that globe sits in.
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
 * ON A PHONE IT LOADS, FINDS IT HAS NOTHING TO DO AND STOPS. That is not politeness,
 * it is the whole reason this file exists separately from the scene: /three.min.js is
 * 589KB, and a handset should never spend that on decoration it is not going to see.
 * A phone downloads this file — under a kilobyte — and nothing else. The sky it gets is
 * the one that was always there: a picture and a stack of CSS, untouched by any script.
 *
 * The same applies to anyone whose browser has no WebGL, and to a narrow desktop window.
 * In every one of those cases the page is complete without this file, which is the rule
 * every decorative layer on this site has to meet: the front page keeps its CSS sky, and
 * an interior page keeps the ground, the glow and the grid it always had — nothing is
 * left with a hole in it. See DESIGN.md § The atmosphere.
 */
(function () {
  'use strict';

  if (!window.matchMedia('(min-width: 901px)').matches) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  try {
    var probe = document.createElement('canvas');
    if (!(probe.getContext('webgl') || probe.getContext('experimental-webgl'))) return;
  } catch (err) {
    return;
  }

  function load(src, done) {
    var el = document.createElement('script');
    el.src = src;
    el.defer = true;
    if (done) el.onload = done;
    document.head.appendChild(el);
  }

  // Order matters: the scene needs THREE on the window before it runs.
  load('/three.min.js', function () { load('/globe-scene.js'); });
})();
