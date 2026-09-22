/* Captures reference stills of the globe, straight from the running site.
 *
 *   npm run dev                      (in one terminal)
 *   node tools/capture-globe.mjs
 *
 * Writes to handoff/reference/ — gitignored, because these are working material for
 * whoever is art-directing the scene, not assets the site serves. Nothing here is
 * referenced by a page and nothing in public/ changes.
 *
 * ── Why this exists ──
 * The globe is procedural: hand-written GLSL in public/globe-scene.js, with no mesh,
 * no texture and no file anyone can open. Somebody working on how it LOOKS — in Blender
 * or anywhere else — has nothing to inspect but the thing running in a browser. These
 * stills are that, at a fixed size, so a proposal can be held up against the real frame
 * instead of against a memory of it.
 *
 * ── The gate is the reason for every setting below ──
 * public/globe.js refuses to load the scene under 901px, without `pointer: fine`, or
 * without WebGL. So: a wide viewport, no `isMobile`, no `hasTouch`. Get any of those
 * wrong and this script captures the CSS sky with no globe in it at all and says nothing
 * about it — which is why assertScene() below is not optional politeness.
 *
 * Reduced motion is NOT set. The scene halves its own motion under it (`motion: 0.25`),
 * and the point here is to show the shipping look.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.SITE_URL || 'http://localhost:4321';
const OUT  = process.env.GLOBE_OUT || 'handoff/reference';

/* 1440x900 is the ordinary laptop this was designed against, and comfortably over the
 * 901px gate. deviceScaleFactor 2 matches the scene's own `dprCap: 2` — asking for 3
 * would not buy more detail, because the renderer caps itself at 2 and the extra pixels
 * would be an upscale of the same buffer. */
const VW = 1440, VH = 900, DPR = 2;

await mkdir(OUT, { recursive: true });

const b = await chromium.launch({
  /* Headless Chromium falls back to SwiftShader for WebGL. That is slower than a real
   * GPU and entirely correct — these are stills, not a frame-rate measurement. */
  args: ['--enable-unsafe-swiftshader'],
});
const page = await b.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: DPR });

/* The scene is the last thing to arrive: /globe.js probes, then fetches 589KB of three.js,
 * then the scene, which walks 46,000 points against every coastline ring before it draws
 * a first frame. `networkidle` is not enough on its own. */
const assertScene = async (wanted) => {
  await page.waitForFunction((cls) => !!document.querySelector(`canvas.${cls}`), wanted,
    { timeout: 30000 });
  await page.waitForTimeout(2500);          // let the rotation settle somewhere representative
  const state = await page.evaluate((cls) => {
    const c = document.querySelector(`canvas.${cls}`);
    return { three: typeof window.THREE, cls: c.className, w: c.width, h: c.height };
  }, wanted);
  if (state.three !== 'object') throw new Error('three.js never loaded — is the viewport over 901px?');
  console.log(`  · canvas .${state.cls} ${state.w}x${state.h}`);
  return state;
};

const shot = async (name, clip) => {
  await page.screenshot({ path: `${OUT}/${name}.png`, clip });
  console.log(`  → ${name}.png`);
};

/* ── The front page ── */
console.log('front page');
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await assertScene('curio-sky');   // the planet, the city lights, the arcs, the ring

/* What a visitor actually meets: the orb field, the header, and the globe's limb rising
 * into the bottom of the frame. The composition starts here, so the reference does too. */
await shot('01-first-view');

/* The globe itself. Its centre is derived the same way the scene derives it — from the
 * hero device's lower edge (see layout() in globe-scene.js) — rather than guessed, so
 * this crop stays correct if the hero is ever re-laid-out. */
const globeBox = await page.evaluate(() => {
  const dev = document.querySelector('.hero__device');
  const curio = document.querySelector('.curio');
  const sy = window.scrollY || 0;
  const d = dev.getBoundingClientRect(), c = curio.getBoundingClientRect();
  const diameter = Math.min(c.height, window.innerHeight) * 0.78;   // TUNE.globeFrac
  return {
    cx: d.left + d.width / 2,
    top: d.bottom + sy,          // the limb meets the device's lower edge
    diameter,
  };
});
/* The hero device sits to the right of centre, so a crop centred on the globe runs off
 * the edge of the viewport. Clamp the window into the frame rather than letting
 * Playwright silently return a narrower image — a reference still that quietly loses a
 * third of the planet is worse than no reference still. */
const pad  = globeBox.diameter * 0.22;
const side = Math.min(VW, VH, globeBox.diameter + pad * 2);
await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, globeBox.top - pad));
await page.waitForTimeout(1200);
await shot('02-globe', {
  x: Math.min(Math.max(0, globeBox.cx - side / 2), VW - side),
  y: 0,
  width: side,
  height: side,
});

/* The junction. The limb meeting the phone's lower edge is the one piece of composition
 * that is not free to move — the scene pins itself to it — so it gets its own frame. */
await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, globeBox.top - VH * 0.55));
await page.waitForTimeout(1200);
await shot('03-limb-and-device');

/* The whole section, as one picture: nebula, star layers, orbit ring, arcs, city lights. */
await page.evaluate(() => document.querySelector('.curio').scrollIntoView({ block: 'center' }));
await page.waitForTimeout(1200);
await shot('04-curio-section');

/* ── An interior page: the same scene with `dustOnly: true` ── */
console.log('about page');
await page.goto(`${BASE}/about`, { waitUntil: 'networkidle' });
await assertScene('page-sky');    // the same scene with `dustOnly: true` — orbs only
await shot('05-orb-field');

await b.close();
console.log(`\ndone → ${OUT}/`);
