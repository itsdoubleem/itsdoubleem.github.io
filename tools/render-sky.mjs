/* Renders the curio deck's nebula to a flat image, deterministically.
 *
 *   node tools/render-sky.mjs        # writes public/assets/sky/nebula.webp
 *
 * ── Why this is a file on disk and not CSS ──
 * DESIGN.md § The cosmos says the sky is "one element per depth, and the tile is an SVG
 * — not a stack of gradients", because a pile of radial-gradients froze a real phone for
 * over a second at a time. A convincing nebula needs domain-warped noise and carved dust
 * lanes, and there is no honest way to ask a browser for that every frame within that
 * budget. So it is computed once, here, and shipped as a picture the browser rasterises
 * like any other. Runtime cost: one decode. No script, no canvas, no WebGL on the page.
 *
 * ── Why the CPU and not a GPU ──
 * § The cosmos rule 2: "if it is generated, it must be generated the same way twice."
 * A WebGL render is at the mercy of the driver — different machine, different bytes, and
 * a diff nobody can review. Everything below is integer hashing and floating-point math
 * in plain JS, so this writes the same file on any machine, every time. Check it with:
 *
 *   shasum public/assets/sky/nebula.webp && node tools/render-sky.mjs && shasum ...
 *
 * ── Why it still looks like the old one ──
 * The three lights are in the same places the CSS gradients put them — accent at 22%/18%,
 * cool blue at 82%/72%, the soft glow along the bottom — so this reads as the same sky
 * rendered properly rather than a different design. If you move them, move them in
 * OneTrueThing.astro's fallback gradients too; that fallback is what shows if the image
 * ever 404s, and it should not be a different picture.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

/* 1920x800 is 2.4:1, close to the deck section's own proportions on a desktop, so the
 * `cover` crop throws almost nothing away there. The first render was 16:9 and the
 * section cropped it to a horizontal band through the middle — which happened to be the
 * emptiest part of the frame, so the composition simply was not on screen. Keep this
 * roughly 2.4:1; a phone crops the sides instead, and the cloud is even enough across
 * that it survives. */
const W = Number(process.env.SKY_W || 1920);
const H = Number(process.env.SKY_H || 800);
const SEED = Number(process.env.SKY_SEED || 20260921);
const OUT = process.env.SKY_OUT || 'public/assets/sky';
const QUALITY = Number(process.env.SKY_Q || 82);

/* ── Integer hash → [0,1) ──
 * Math.imul keeps every step in 32-bit, which is what makes this reproducible: plain `*`
 * would overflow into doubles and lose the low bits that carry the randomness. */
function hash(x, y, s) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/* Quintic fade — 6t^5-15t^4+10t^3. Smoothstep's second derivative is discontinuous at the
 * cell edges, which shows up on a smooth cloud as a faint grid of creases. */
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;

function noise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = fade(xf), v = fade(yf);
  return lerp(
    lerp(hash(xi, yi, s), hash(xi + 1, yi, s), u),
    lerp(hash(xi, yi + 1, s), hash(xi + 1, yi + 1, s), u),
    v,
  );
}

function fbm(x, y, s, oct = 6) {
  let sum = 0, amp = 0.5, freq = 1, norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += amp * noise(x * freq, y * freq, s + i * 1013);
    norm += amp;
    amp *= 0.5;
    freq *= 2.02; // not exactly 2: an exact doubling lines every octave's cells up
  }
  return sum / norm;
}

/* Ridged noise — the sharp-edged kind. This is what carves the dark dust lanes, and the
 * lanes are most of why the result reads as depth rather than as fog. */
function ridged(x, y, s, oct = 5) {
  let sum = 0, amp = 0.5, freq = 1, norm = 0;
  for (let i = 0; i < oct; i++) {
    const n = 1 - Math.abs(noise(x * freq, y * freq, s + i * 7717) * 2 - 1);
    sum += amp * n * n;
    norm += amp;
    amp *= 0.55;
    freq *= 2.02;
  }
  return sum / norm;
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const sstep = (a, b, t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };

/* An elliptical falloff, so a light can be wider than it is tall. */
function bloom(u, v, cx, cy, rx, ry, power) {
  const d = Math.hypot((u - cx) / rx, (v - cy) / ry);
  return Math.pow(clamp01(1 - d), power);
}

console.log(`rendering ${W}x${H}, seed ${SEED}…`);
const t0 = Date.now();

const px = Buffer.alloc(W * H * 3);
const aspect = W / H;

for (let y = 0; y < H; y++) {
  const v = y / (H - 1);
  for (let x = 0; x < W; x++) {
    const u = x / (W - 1);

    /* Aspect-corrected sample point. 3.1 is the number of noise cells across the long
       edge — lower is billowier, higher is wispier and starts to look like static. */
    const px0 = u * aspect * 3.1;
    const py0 = v * 3.1;

    /* ── Domain warping ──
       fbm of a point that has itself been displaced by fbm. One round gives clouds; two
       gives the curled, filamentary structure that a single fbm never produces no matter
       how many octaves you spend on it. */
    const q1 = fbm(px0, py0, SEED, 5);
    const q2 = fbm(px0 + 5.2, py0 + 1.3, SEED + 101, 5);
    const r1 = fbm(px0 + 3.4 * q1 + 1.7, py0 + 3.4 * q2 + 9.2, SEED + 211, 5);
    const r2 = fbm(px0 + 3.4 * q1 + 8.3, py0 + 3.4 * q2 + 2.8, SEED + 307, 5);
    let d = fbm(px0 + 3.2 * r1, py0 + 3.2 * r2, SEED + 401, 6);

    /* Push the midtones down so the cloud has empty sky in it. Without this the whole
       frame is lightly foggy and nothing reads as a shape. */
    d = sstep(0.38, 0.86, d);

    /* ── Where the light is ──
       Same three anchors the CSS gradients used, widened. The first pass used tight
       radii and the result was one bright blob in the top-left corner with the other two
       lights invisible — a lava lamp, not a sky. A nebula wants its lights overlapping
       so the colour transitions happen in the cloud rather than at the edges of three
       separate glows. */
    const lAccent = bloom(u, v, 0.26, 0.20, 0.74, 0.86, 2.4);
    const lBlue   = bloom(u, v, 0.83, 0.70, 0.78, 0.92, 2.2);
    const lFloor  = bloom(u, v, 0.50, 1.02, 1.05, 0.78, 1.8);

    /* ── Dust ──
       Ridged noise, warped by the same field so the lanes follow the cloud instead of
       lying across it. Subtracted, not multiplied over the whole frame: dust only reads
       as dust where there is light behind it to block. */
    const dust = ridged(px0 * 1.45 + 2.0 * r1, py0 * 1.45 + 2.0 * r2, SEED + 977, 5);
    const lanes = sstep(0.42, 0.95, dust);

    /* Emission per light, each shaped by the cloud and then eaten into by the dust. */
    const shape = d * (1 - 0.72 * lanes);
    const eAccent = lAccent * shape;
    const eBlue = lBlue * shape;
    const eFloor = lFloor * (0.35 + 0.65 * shape);

    /* A cold rim on the densest edges — the highlight that stops a cloud looking flat.
       Narrow band, low weight; this is seasoning, not a fourth light. */
    const rim = sstep(0.62, 0.94, d) * (1 - lanes) * 0.16;

    /* ── Colour ──
       Hue and brightness are computed SEPARATELY, and getting that wrong is what made
       the first render look like poster paint. If you scale a saturated colour by
       intensity, the brightest part of the cloud is also the most saturated part — so
       the core reads as a lurid green blob. Real emission does the opposite: the core
       is where the light is strong enough to wash out to white, and the hue lives in the
       mid-densities around it.
       So: mix a hue from the three lights by their RELATIVE weights, then desaturate
       that hue toward white as the TOTAL intensity climbs, and only then scale by
       intensity via the alpha channel. */
    const tot = eAccent + eBlue + eFloor + rim;
    const wsum = tot > 1e-6 ? tot : 1e-6;
    const wA = eAccent / wsum, wB = eBlue / wsum, wF = eFloor / wsum, wR = rim / wsum;

    /* Hues, all muted well below the UI accent. --accent (#08DF9C) at full strength is a
       button colour; a field of it behind body text is not a background, it is a
       highlighter. */
    let R = wA *  38 + wB *  78 + wF *  34 + wR * 198;
    let G = wA * 172 + wB * 132 + wF * 150 + wR * 224;
    let B = wA * 140 + wB * 184 + wF * 126 + wR * 226;

    /* Whiten toward the core. */
    const white = sstep(0.30, 1.05, tot) * 0.72;
    R = lerp(R, 236, white);
    G = lerp(G, 246, white);
    B = lerp(B, 244, white);

    /* ── Encoding: opaque and premultiplied, not RGBA ──
       Measured, same render, 1920x1080:

           RGBA, alpha carries the cloud .... 477.0 KB
           opaque, premultiplied onto black .. 26.9 KB

       Eighteen times, for a pixel-identical result. An alpha channel has to encode the
       whole cloud a second time, and it is the one channel a codec cannot throw detail
       away from without it showing. So brightness is multiplied into the colour here and
       the page screen-blends the result: screen leaves its backdrop untouched wherever
       this image is black, which is most of it, so the page grid still reads through the
       thin parts exactly as an alpha channel would have let it. See the note on .neb in
       OneTrueThing.astro for why that element cannot live inside .sky.

       The 0.62 ceiling is a legibility budget, not a taste call: the section heading and
       the deck's card sit on this. */
    const bright = clamp01(tot * 0.92) * 0.62;

    /* ── Dither ──
       A dark, slow gradient in 8-bit will band, and banding is the single clearest tell
       that a background was generated rather than photographed. One hashed sub-LSB of
       noise per channel costs nothing and removes it. Deterministic like everything
       else here — it is the same hash, not Math.random.
       Keep the amplitude at about one level. Noise is incompressible, so a heavier
       dither is paid for in kilobytes on every visit. */
    const dth = (c) => (hash(x, y, SEED + c) - 0.5) * 1.05;

    const i = (y * W + x) * 3;
    px[i]     = clamp01((R * bright + dth(11)) / 255) * 255;
    px[i + 1] = clamp01((G * bright + dth(23)) / 255) * 255;
    px[i + 2] = clamp01((B * bright + dth(37)) / 255) * 255;
  }
  if (y % 180 === 0) process.stdout.write(`  ${Math.round((y / H) * 100)}%\r`);
}

await mkdir(OUT, { recursive: true });
const file = `${OUT}/nebula.webp`;
const info = await sharp(px, { raw: { width: W, height: H, channels: 3 } })
  /* A soft, dark, low-frequency image is the case WebP handles best. See the size
     table in the header for what the quality knob actually buys here. */
  .webp({ quality: QUALITY, effort: 6 })
  .toFile(file);

console.log(
  `wrote ${file} — ${info.width}x${info.height}, ${(info.size / 1024).toFixed(1)} KB, ` +
  `${((Date.now() - t0) / 1000).toFixed(1)}s`,
);
