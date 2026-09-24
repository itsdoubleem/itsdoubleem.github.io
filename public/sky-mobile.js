/* The orb field, drawn for a device that is not going to be sent 589 KB of WebGL.
 *
 * /globe.js asks one question — wide screen, real pointer, working WebGL context? — and
 * on a yes it loads /three.min.js and /globe-scene.js. This file is the other branch of
 * that same question. It draws the same field in a 2D canvas: the drift of lit motes
 * that sits behind the page on every route, without the globe, without three.js and
 * without a bloom pass.
 *
 * ── Why this exists at all, rather than reusing the real scene ──
 * The WebGL field is 589 KB of library plus 52 KB of scene, and the about page,
 * README.md and src/site.ts all tell the reader that a phone fetches neither. It is
 * also more machine than a phone needs for this: with no cursor there is nothing for the
 * proximity term in the dust shader to answer, so two thirds of what that shader does
 * would be dead code on a handset. What is left is motes drifting in perspective, which
 * a 2D canvas draws with one pre-rendered sprite and a divide.
 *
 * So a phone now downloads this — about 20 KB on disk, about 8 KB over the wire, and most of
 * both is the commentary you are reading — and still never downloads three.js. That is
 * the whole trade, and the four claim sites in rule 4 below say so in those words.
 *
 * ── It is the same field, deliberately, and these are the numbers that make it so ──
 * Every constant under FIELD is lifted from the dust-only mount at the foot of
 * /globe-scene.js: the same radius, the same shell, the same 30° camera, the same
 * `fill` of 0.85. The projection below is what the vertex shader does — size and
 * position over depth — written out longhand. Change one of them there and this drifts
 * out of family; they are listed together so that is at least findable.
 *
 * The one number that is NOT shared is the count. The desktop field generates 200 orbs
 * for a viewport-sized canvas at roughly 1.7 aspect; a phone at 0.46 aspect sees a
 * narrow slice of the same shell, so generating the same 200 lands about 55 on screen —
 * the same density, arrived at by the projection rather than by a second guess.
 *
 * ── Rules this file must keep, the same four /motion.js keeps ──
 *  1. It touches nothing that holds text. It creates one canvas, appends it to <main>
 *     at z-index -1, and paints inside it. It sets no layout property on anything else.
 *     The canvas is `position: fixed` with its box stated in full here — inset, width,
 *     height — so it cannot take part in layout or feed anything's ResizeObserver.
 *  2. The page is complete without it. Below it are the ground, the glow and the grid
 *     from global.css — CSS, and the finished appearance on their own. JS off, no 2D
 *     context, a blocked request: no canvas, no gap, nothing half-drawn, and the front
 *     page keeps the nebula and the star layers this file would otherwise hide.
 *  3. It reads nothing about the visitor and stores nothing. No pointer listener (there
 *     is no pointer), no sensors, no cookies, no storage, no network of any kind.
 *  4. It is a named file in /public, not a bundled /_astro hash, because the about page,
 *     README.md and src/site.ts invite the reader to open their network panel and
 *     count the requests. Those three and src/layouts/Base.astro name this file by path;
 *     it arrived on 2026-09-22 and all four changed in that commit.
 *
 * It needs no CSP grant of its own: `script-src 'self'` covers it, and there is still no
 * connect-src, so this could not phone home if it wanted to.
 */
(function () {
  'use strict';

  var main = document.querySelector('main');
  if (!main) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Lifted from the dust-only mount in /globe-scene.js — see the note above. R is the
     globe's radius even though there is no globe here: it is the unit the shell, the
     mote sizes and the camera distance are all measured in, so dropping it would not
     simplify anything, it would just hide where the numbers came from. */
  var FIELD = {
    R: 1.8,          // world unit
    inner: 0.12,     // DUST_IN — the shell closes in when there is no globe to clear
    spread: 2.6,     // how far out the shell reaches
    fill: 0.85,      // how much world one viewport holds
    fov: 30,         // degrees
    count: 200,      // generated, not drawn: the projection decides what lands on screen
    opacity: 0.9
  };

  /* Bloom is what the desktop field spends four render passes on and this one cannot
     afford, so the base alpha is lifted to stand in for the light it is missing — the
     shader's resting term is 0.34 and this is 0.52. Tuned by looking at it on a phone,
     which is the only way it is tunable. */
  var BASE_ALPHA = 0.52;

  /* A phone's pixel ratio is commonly 3 and sometimes 3.75. Drawing a soft-edged blur at
     3.75 costs four times what it costs at 1.5 and looks identical, because there is no
     edge in any of this for the extra samples to resolve. DESIGN.md § The cosmos has the
     frame measurements that make this the difference between 60 fps and 45. */
  var DPR_CAP = 1.5;

  /* 32 fps, not 60. Nothing here moves fast enough for the difference to be visible —
     the shell turns once in five minutes — and halving the frames halves the battery.
     A missed frame at this rate is also invisible, which is why the field can afford to
     lose one to a scroll.

     With this cap and the one above, measured on the SM-S928N itself — 384 CSS px at
     dpr 3.75, scripted scroll of the homepage, 195 frames — the field runs at 60.0 fps
     against 60.1 with the script blocked, no frame over 33ms either way, and 2.1ms
     between the two worst frames. Retune either cap and take it again on the phone
     rather than in a narrow desktop window; DESIGN.md § The atmosphere has the adb
     recipe and § The cosmos rule 6 has the reason. */
  var FPS = 32;

  var canvas = document.createElement('canvas');
  var ctx;
  try {
    ctx = canvas.getContext('2d', { alpha: true });
  } catch (err) {
    return;
  }
  if (!ctx) return;

  /* ── The front page's CSS sky goes, the same way it goes on a wide screen ──
     /globe-scene.js hides .neb and .sky when it mounts the globe, because the globe
     replaces them. This file shipped on 2026-09-22 NOT hiding them, on the reasoning
     that the nebula and the star tiles were the light the orbs drift in — which is what
     they are on a desktop, where the globe sits in them.

     On a phone they are not that. The section is a 384px column, the nebula is a picture
     cropped to `cover` and the five star tiles are at their densest, so one band of cloud
     and grain belongs to one section and nothing else on the page does. The owner looked
     at it on the device the same day and asked for the orbs alone.

     THE LAYERS STAY IN THE MARKUP AND ARE HIDDEN FROM SCRIPT, which is the arrangement
     /globe-scene.js keeps and for the same reason: with JavaScript off, or with no 2D
     context, the reader gets the nebula and the stars exactly as before rather than a
     section with nothing in it. Deleting them from the component would take that away
     from the one visitor who has no other sky.

     The cost of keeping them is one request. `display: none` arrives from this script,
     which is deferred, and by then the style engine has already started fetching
     /assets/sky/nebula.webp for .neb__drift — measured on the phone, it is still in the
     resource list. 34 KB for a picture the reader will not see, paid so the reader
     without JavaScript still sees it. Moving the background into a `min-width` media
     query would save it and would take the fallback away with it. */
  var style = document.createElement('style');
  style.textContent =
    '.curio .neb,.curio .sky{display:none!important}' +
    '.page-sky{position:fixed;inset:0;width:100%;height:100%;' +
    'z-index:-1;display:block;pointer-events:none}';
  document.head.appendChild(style);

  canvas.className = 'page-sky';
  canvas.setAttribute('aria-hidden', 'true');

  /* Fade the field out at the top and the bottom, so it never crowds the floating header
     bar or runs into the footer's own background. The same mask the interior pages wear
     on the WebGL field. */
  var mask = 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,.4) 9%, ' +
             '#000 26%, #000 84%, rgba(0,0,0,.45) 95%, transparent 100%)';
  canvas.style.webkitMaskImage = mask;
  canvas.style.maskImage = mask;

  /* Inside <main>, which carries `position: relative; z-index: 1`, so z-index -1 puts the
     field behind everything main holds while still sitting above body::before and
     body::after — the glow and the grid. Appended to <body> instead it would go under
     both of those and barely show. */
  main.appendChild(canvas);

  /* ---------------------------------- colour ---------------------------------- */

  var cs = getComputedStyle(document.documentElement);
  var accent = (cs.getPropertyValue('--accent') || '').trim() || '#08DF9C';
  var COL = { violet: accent, cyan: '#6FF3C8', ice: '#DFFBF0' };

  function rgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  var CYAN = rgb(COL.cyan), VIOLET = rgb(COL.violet), ICE = rgb(COL.ice);

  /* ---------------------------------- sprites ---------------------------------- */
  /* One mote, pre-rendered, drawn with `lighter` to get the additive blending the
     WebGL field gets from the GPU. Building the gradient once per sprite rather than
     once per mote per frame is the whole performance story of this file: a
     createRadialGradient in the draw loop is ~200 allocations a frame and was the
     first thing measured and thrown away.
     
     Two axes, both from the dust fragment shader:
       tint     cyan → accent by the mote's seed, with an icy ramp for the few bright
                ones that stand in for the cursor highlights a phone will never get
       softness near motes are a wide blur, far ones a crisp speck — `edge` in the
                shader, mix(0.10, 0.44, soft), read here as where the falloff starts */
  var TINTS = 8, SOFTS = 3, SPRITE = 64;
  var sprites = [];

  function buildSprite(colour, soft) {
    var c = document.createElement('canvas');
    c.width = c.height = SPRITE;
    var g = c.getContext('2d');
    var r = SPRITE / 2;
    var grad = g.createRadialGradient(r, r, 0, r, r, r);
    // soft 0 → core out to 20% then a long falloff; soft 1 → a disc with a thin edge.
    var core = 0.20 + soft * 0.62;
    var rgbs = 'rgba(' + Math.round(colour[0]) + ',' + Math.round(colour[1]) + ',' + Math.round(colour[2]);
    grad.addColorStop(0, rgbs + ',1)');
    grad.addColorStop(core, rgbs + ',' + (0.92 - soft * 0.04).toFixed(3) + ')');
    grad.addColorStop(core + (1 - core) * 0.45, rgbs + ',' + (0.34 + soft * 0.28).toFixed(3) + ')');
    grad.addColorStop(1, rgbs + ',0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, SPRITE, SPRITE);
    return c;
  }

  for (var t = 0; t < TINTS; t++) {
    var base = mix(CYAN, VIOLET, t / (TINTS - 1));
    for (var s = 0; s < SOFTS; s++) sprites.push(buildSprite(base, s / (SOFTS - 1)));
  }
  /* One more row on the end, iced: the handful of motes that read as lit rather than as
     coloured. Without them the field is a single green wash, because the cursor
     highlight that lights the desktop one has nothing to be triggered by here. */
  var ICE_BASE = sprites.length;
  for (var si = 0; si < SOFTS; si++) sprites.push(buildSprite(mix(mix(CYAN, VIOLET, 0.4), ICE, 0.8), si / (SOFTS - 1)));

  /* ---------------------------------- the field ---------------------------------- */
  /* Generated exactly as /globe-scene.js § 9 generates it: a fat shell, biased outward,
     squashed on y and stretched on x so it reads as a drift rather than as a ball. */

  var orbs = [];
  (function build() {
    var R = FIELD.R;
    for (var i = 0; i < FIELD.count; i++) {
      var u = Math.random() * 2 - 1;
      var phi = Math.random() * Math.PI * 2;
      var rr = Math.sqrt(Math.max(0, 1 - u * u));
      var d = R * (FIELD.inner + Math.pow(Math.random(), 0.55) * FIELD.spread);
      // pow 6 on a uniform: mostly zero, occasionally near one. The occasional one is
      // the mote that reads as a star.
      var hot = Math.pow(Math.random(), 6);
      orbs.push({
        x: Math.cos(phi) * rr * d * 1.7,
        y: u * d * 0.9,
        z: Math.sin(phi) * rr * d,
        size: R * (0.0045 + Math.pow(Math.random(), 2.2) * 0.026),
        phase: Math.random() * 6.283,
        tint: Math.min(TINTS - 1, Math.floor(Math.random() * TINTS)),
        hot: hot
      });
    }
  })();

  /* ---------------------------------- the box ---------------------------------- */

  var W = 0, H = 0, dpr = 1, F = 1, dist = 1;

  /* innerWidth/innerHeight, not the canvas's own clientWidth: this runs on every frame
     and reading a layout property off an element is a style flush, where the window's
     own metrics are already to hand. The canvas is `inset: 0` on a fixed box, so the two
     are the same number anyway. */
  function measure() {
    var w = window.innerWidth || document.documentElement.clientWidth || 1;
    var h = window.innerHeight || document.documentElement.clientHeight || 1;
    /* A phone's address bar collapsing changes innerHeight by ~90px on every scroll, and
       reallocating the drawing buffer for that is a stutter in exchange for nothing: the
       browser scales the existing bitmap, and the difference is invisible on a field of
       blurred dots. Width changes — a rotation — are real and always taken. */
    if (w === W && Math.abs(h - H) < 120) return;
    W = w; H = h;
    dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* The projection, longhand. F is CSS pixels per world unit at one unit of depth —
       uH in the shader — and `dist` is where the camera sits so that `fill` of the
       height is one globe across, which is how the desktop field is framed. */
    var halfH = FIELD.R / FIELD.fill;
    F = (H * 0.5) / Math.tan(FIELD.fov * 0.5 * Math.PI / 180);
    dist = halfH / Math.tan(FIELD.fov * 0.5 * Math.PI / 180);
  }

  /* ---------------------------------- the draw ---------------------------------- */

  function draw(time) {
    var cx = W * 0.5, cy = H * 0.5;
    var drift = reduced ? 0.25 : 1;
    /* The shell turns, slowly. The desktop field gets most of its life from the camera
       answering the cursor; with no cursor this is what is left, so it turns a little
       faster than the 0.006 rad/s over there — one revolution in about five minutes,
       which is under the threshold where a background starts asking to be looked at. */
    var spin = time * 0.020 * drift;
    var cosS = Math.cos(spin), sinS = Math.sin(spin);

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    for (var i = 0; i < orbs.length; i++) {
      var o = orbs[i];

      // The per-mote wander, straight from DUST_VERT.
      var px = o.x + Math.sin(time * 0.22 + o.phase) * 0.10 * drift;
      var py = o.y + Math.cos(time * 0.18 + o.phase * 1.7) * 0.09 * drift;
      var pz = o.z + Math.sin(time * 0.15 + o.phase * 0.6) * 0.08 * drift;

      // Turn the shell about its own y axis, then read depth from the camera.
      var rx = px * cosS + pz * sinS;
      var rz = -px * sinS + pz * cosS;
      var depth = dist - rz;
      if (depth < 0.35) continue;

      var scale = F / depth;
      var sx = cx + rx * scale;
      var sy = cy - py * scale;

      var dia = o.size * scale;
      if (dia < 1) dia = 1; else if (dia > 42) dia = 42;

      // vAlpha and vSoft from the shader: near motes fade out, far ones go crisp and dim.
      var near = smoothstep(0.9, 2.6, depth);
      if (near <= 0.01) continue;
      var soft = smoothstep(4.5, 12.0, depth);

      /* The sprite IS the mote, at the mote's own size — the falloff lives inside the
         box, exactly as the shader's disc lives inside its gl_PointSize. Drawn any
         larger and every mote inflates with it: the first version of this used 2.4x
         and turned a field of specks into a field of smudges. */
      var box = dia;
      var half = box * 0.5;
      if (sx + half < 0 || sx - half > W || sy + half < 0 || sy - half > H) continue;

      var alpha = near * FIELD.opacity * BASE_ALPHA * (1 - soft * 0.5) * (1 + o.hot * 0.9);
      if (alpha <= 0.004) continue;
      if (alpha > 1) alpha = 1;

      var row = o.hot > 0.55 ? ICE_BASE : o.tint * SOFTS;
      var sprite = sprites[row + Math.min(SOFTS - 1, Math.round(soft * (SOFTS - 1)))];

      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite, sx - half, sy - half, box, box);

      /* Standing in for the bloom pass. The desktop field spends four full-screen render
         targets on spreading each mote's light into the air around it, and without
         something in that place every mote here reads as a hard speck with the lights
         off — measured against the same page on a wide screen, the field simply went
         quiet. This is the same mote again, soft, at twice the size and a fifth of the
         strength: two draws where the other one does four passes. It is not the same
         thing; at this size it reads as the same thing. */
      ctx.globalAlpha = alpha * 0.22;
      var halo = box * 2.2, hh = halo * 0.5;
      ctx.drawImage(sprites[row], sx - hh, sy - hh, halo, halo);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function smoothstep(a, b, x) {
    var t = (x - a) / (b - a);
    if (t < 0) t = 0; else if (t > 1) t = 1;
    return t * t * (3 - 2 * t);
  }

  /* ---------------------------------- the loop ---------------------------------- */

  var raf = 0, last = 0, clock = 0, frameGap = 1000 / FPS;

  function frame(now) {
    raf = 0;
    if (document.hidden) return;              // resumed by visibilitychange
    var dt = now - last;
    if (dt < frameGap - 1) { raf = requestAnimationFrame(frame); return; }
    last = now;
    clock += Math.min(dt, 200) / 1000;        // a backgrounded tab must not jump the field
    measure();
    draw(clock);
    raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (raf || document.hidden) return;
    last = performance.now() - frameGap;
    raf = requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; }
    else kick();
  });

  window.addEventListener('resize', function () { measure(); if (!raf) { measure(); draw(clock); } }, { passive: true });
  window.addEventListener('orientationchange', function () { W = 0; measure(); }, { passive: true });

  measure();

  if (reduced) {
    /* Somebody who asked their OS to stop moving things gets the field and not the
       drift. The desktop scene answers the same preference by quartering its motion,
       which it can afford because it is already running a frame loop for the globe;
       here the loop exists for nothing else, and a quarter of a drift this slow is not
       motion anyone can see — it is a battery bill with no picture attached. One frame,
       no loop, the same field standing still. */
    draw(0);
  } else {
    kick();
  }

  window.__doubleemSkyMobile = { canvas: canvas, orbs: orbs };
})();
