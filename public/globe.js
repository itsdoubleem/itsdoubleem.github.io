/* The third script on this site, and the one that decides whether there is a fourth.
 *
 * It paints nothing itself. It asks one question — is this a wide screen with a real
 * pointer and a working WebGL context? — and only then fetches /three.min.js and
 * /globe-scene.js, which draw the globe in the sky behind the story on the front page.
 *
 * ON A PHONE IT LOADS, FINDS IT HAS NOTHING TO DO AND STOPS. That is not politeness,
 * it is the whole reason this file exists separately from the scene: /three.min.js is
 * 589KB, and a handset should never spend that on decoration it is not going to see.
 * A phone downloads this file — under a kilobyte — and nothing else. The sky it gets is
 * the one that was always there: a picture and a stack of CSS, untouched by any script.
 *
 * The same applies to anyone whose browser has no WebGL, and to a narrow desktop window.
 * In every one of those cases the section is complete without this file, which is the
 * rule every decorative layer on this site has to meet. See DESIGN.md § The atmosphere.
 */
(function () {
  'use strict';

  if (!window.matchMedia('(min-width: 901px)').matches) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (!document.querySelector('.curio')) return;

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
