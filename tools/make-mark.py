#!/usr/bin/env python3
"""Prepare the DOUBLEEM mark from the supplied artwork.

    python3 tools/make-mark.py <path-to-artwork.png>

Writes public/assets/mark-256.png, public/favicon-180.png and public/favicon-32.png.

Why this exists rather than the files just being committed: the artwork arrives as an RGB
PNG on a WHITE background with no alpha, and on a near-black site that is a white
rectangle. Three things about converting it are easy to get wrong, and all three were got
wrong once before this script existed:

  1. A HARD white threshold leaves near-white specks behind. Keying only `>= 246` left
     3,681 pixels at level 245 which showed as light dust on the dark ground. The soft
     ramp below fades neutral pixels in proportion to their distance from white, which
     also keeps anti-aliased edges clean instead of leaving a hard fringe.

  2. SATURATION is what separates the artwork from its background, not lightness. The
     shaded inner face of the cube measures (204,213,222) — light enough that any
     brightness test deletes it, but tinted at saturation 18, so the `sat > 10` test keeps
     it. Every other face of the cube is pure white and correctly disappears.

  3. Image.getbbox() TRIMS NOTHING once the soft key has run, because the ramp leaves
     alpha 1-2 across the whole frame and getbbox() counts that as content. It silently
     returns the full 1098px canvas with all its vertical whitespace. Trim against a
     thresholded copy of the alpha channel instead.

A consequence, not a bug: the cube's own faces are white, so they key out with the
background and the cube reads as an open wireframe on a dark ground rather than as the
solid white box it is on a light one. See DESIGN.md § The wordmark.
"""
import sys
import pathlib
from PIL import Image

NEUTRAL_SAT = 10   # at or below this, a pixel is background/white face, not artwork
TRIM_ALPHA  = 12   # alpha below this is haze from the ramp, not content


def prepare(src_path: pathlib.Path) -> Image.Image:
    src = Image.open(src_path).convert("RGB")
    w, h = src.size
    out = Image.new("RGBA", (w, h))
    sp, op = src.load(), out.load()

    for y in range(h):
        for x in range(w):
            r, g, b = sp[x, y]
            if max(r, g, b) - min(r, g, b) <= NEUTRAL_SAT:
                op[x, y] = (r, g, b, max(0, 255 - min(r, g, b)))
            else:
                op[x, y] = (r, g, b, 255)

    mask = out.getchannel("A").point(lambda v: 255 if v >= TRIM_ALPHA else 0)
    box = mask.getbbox()
    if box is None:
        sys.exit("nothing left after keying — is the artwork white-on-white?")
    trimmed = out.crop(box)
    print(f"  keyed and trimmed: {src.size} -> {trimmed.size}")
    return trimmed


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    art = prepare(pathlib.Path(sys.argv[1]))
    pathlib.Path("public/assets").mkdir(parents=True, exist_ok=True)

    # 256px covers the 42px header mark and the 50px footer mark at 3x device pixels.
    for path, px, colors in [
        ("public/assets/mark-256.png", 256, 256),
        ("public/favicon-180.png", 180, 256),
        ("public/favicon-32.png", 32, 128),
    ]:
        im = art.copy()
        im.thumbnail((px, px), Image.LANCZOS)
        im.quantize(colors=colors, method=Image.FASTOCTREE).save(path, optimize=True)
        kb = pathlib.Path(path).stat().st_size / 1024
        print(f"  {path}  {im.size}  {kb:.1f} KB")


if __name__ == "__main__":
    main()
