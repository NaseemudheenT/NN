#!/usr/bin/env python3
"""
NN TOWER — plate extraction.

The founder's renders arrive as composite boards: several views laid out on one
sheet with captions, leader lines and annotation columns printed over them. The
website needs each view on its own, clean, with nothing printed on it.

This script cuts them out, heals the printed matter, upscales with Lanczos and
writes WebP into public/assets/tower.

It is an OFFLINE tool. It is not part of `npm run build` and the site never
calls it — the committed .webp files are the product. Re-run it only when the
source boards change:

    python3 scripts/extract-tower-plates.py

Requires Pillow (`pip3 install Pillow`). If the founder re-exports the source
boards at a higher resolution, nothing here changes except the output sharpness:
the crop rectangles are stored as FRACTIONS of the source, not pixels.
"""

import base64, io, json, os, sys
from PIL import Image, ImageFilter

try:
    import numpy as np
except ImportError:
    sys.exit("numpy required: pip3 install numpy")

HOME = os.path.expanduser("~")
BOARD = f"{HOME}/Downloads/NN Tower_ Digital Flagship Concept Board.png"
PAGE  = f"{HOME}/Downloads/NERO NOREN Luxury Menswear Homepage.png"
OUT   = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "tower")

# Crops as fractions of the source image, so a higher-res re-export just works.
BOARD_W, BOARD_H = 1254.0, 1254.0
PAGE_W,  PAGE_H  = 1536.0, 1024.0

def frac(x0, y0, x1, y1, w, h):
    return (x0 / w, y0 / h, x1 / w, y1 / h)

PLATES = [
    # name,     source, fractional crop,                              scale, heal
    # The facade and rear panels carry their caption printed over the sky.
    ("facade",  "board", frac(  0,   0,  461,  383, BOARD_W, BOARD_H), 2.0,
     {"caption": (0.030, 0.026, 0.330, 0.225)}),
    ("rear",    "board", frac(462,   0,  802,  383, BOARD_W, BOARD_H), 2.0,
     {"caption": (0.030, 0.026, 0.430, 0.210)}),
    # The aerial carries BOTH a caption and six annotation leader lines that
    # run from the roof out to a label column. Starting the crop below the
    # caption takes the caption and the top two lines with it — there is only
    # street up there — and the four that remain are healed row by row.
    ("aerial",  "board", frac(803,  88, 1148,  383, BOARD_W, BOARD_H), 2.0,
     {"hlines": (36, 86, 136, 187)}),
    # The cutaway is cropped hard against the dome in the source — the board
    # puts the top-row renders directly above it — so the building had four
    # pixels of sky and met the frame edge as a bright line. `pad` adds real
    # headroom in the page's own black: no invented content, just air.
    ("cutaway", "board", frac(262, 386,  768,  884, BOARD_W, BOARD_H), 2.0,
     {"darkfield": (0.0, 0.0, 0.165, 0.80), "blackpoint": True,
      "pad": (64, 26, 30, 26)}),
    ("street",  "board", frac(124, 902,  622, 1206, BOARD_W, BOARD_H), 2.0, {}),
    ("hall",    "page",  frac(400,  45,  915,  345, PAGE_W,  PAGE_H),  2.0, {}),
]


def heal_rect(arr, box, axis="x"):
    """Erase printed matter by interpolating the clean pixels either side of it.

    Used for the caption burned into the facade plate's sky. Sky is a smooth
    gradient, so a per-row linear blend between the clean pixel to the left and
    the clean pixel to the right is invisible.
    """
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        left = arr[y, max(x0 - 8, 0):max(x0 - 2, 1)].mean(axis=0)
        right = arr[y, x1 + 2:x1 + 10].mean(axis=0)
        n = max(x1 - x0 - 1, 1)
        for i, x in enumerate(range(x0, x1)):
            t = i / n
            arr[y, x] = left * (1 - t) + right * t
    return arr


def heal_bright_on_dark(arr, region, thr=78):
    """Erase leader lines and labels printed on a flat dark field.

    Anything brighter than `thr` inside `region` is replaced with the median of
    the genuinely dark pixels around it. Correct only where the field really is
    flat — here, the night sky behind the cutaway.
    """
    x0, y0, x1, y1 = region
    sub = arr[y0:y1, x0:x1]
    lum = sub.mean(axis=2)
    dark = sub[lum <= 55]
    bg = np.median(dark, axis=0) if len(dark) else np.array([5, 16, 22], np.float32)
    sub[lum > thr] = bg
    arr[y0:y1, x0:x1] = sub
    return arr


def heal_hlines(arr, rows, span=1):
    """Erase a thin printed rule by bridging the picture above and below it.

    A leader line is one or two pixels tall and runs clean across whatever
    it crosses — roof, trees, road. Horizontal interpolation would smear
    those together; averaging the rows three above and three below keeps
    each column's own content and simply closes the gap. It is the same
    move as removing a scratch from a scanned negative.
    """
    h = arr.shape[0]
    for y in rows:
        for dy in range(-span, span + 1):
            r = y + dy
            if 3 <= r < h - 3:
                arr[r] = (arr[r - 3] + arr[r + 3]) / 2
    return arr


def match_black(arr, page=(10, 10, 10), knee=34.0):
    """Pull the plate's background down onto the page's own black.

    The cutaway is rendered against a dark navy, not against #0a0a0a — close
    enough to miss in a thumbnail, far enough that on the site the plate
    announced itself as a lit rectangle with four hard corners. Rather than
    hide that with a heavier mask (which eats the dome and the pavement),
    the darkest pixels are remapped onto the page colour, with a soft ramp
    up to `knee` so nothing bands. Above the knee the picture is untouched.
    """
    lum = arr.mean(axis=2)
    t = np.clip(lum / knee, 0.0, 1.0)[..., None]          # 0 at pure black, 1 at the knee
    target = np.array(page, dtype=np.float32)
    return arr * t + (target * (1.0 - t) + arr * (1.0 - t) * 0.0) * (1.0 - t) + arr * 0.0 \
        if False else arr * t + target * (1.0 - t)


def lqip(img):
    """A 20px blurred base64 of the plate, for Next's blur placeholder."""
    t = img.copy()
    t.thumbnail((20, 20), Image.LANCZOS)
    buf = io.BytesIO()
    t.save(buf, "WEBP", quality=55)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def main():
    for p in (BOARD, PAGE):
        if not os.path.exists(p):
            sys.exit(f"missing source board: {p}")

    os.makedirs(OUT, exist_ok=True)
    sources = {"board": Image.open(BOARD).convert("RGB"),
               "page":  Image.open(PAGE).convert("RGB")}
    manifest = {}

    for name, src, (fx0, fy0, fx1, fy1), scale, heal in PLATES:
        im = sources[src]
        W, H = im.size
        box = (round(fx0 * W), round(fy0 * H), round(fx1 * W), round(fy1 * H))
        arr = np.asarray(im.crop(box)).astype(np.float32)
        h, w, _ = arr.shape

        if "caption" in heal:
            cx0, cy0, cx1, cy1 = heal["caption"]
            arr = heal_rect(arr, (round(cx0 * w), round(cy0 * h),
                                  round(cx1 * w), round(cy1 * h)))
        if "darkfield" in heal:
            dx0, dy0, dx1, dy1 = heal["darkfield"]
            arr = heal_bright_on_dark(arr, (round(dx0 * w), round(dy0 * h),
                                            round(dx1 * w), round(dy1 * h)))
        if "hlines" in heal:
            arr = heal_hlines(arr, heal["hlines"])
        if heal.get("blackpoint"):
            arr = match_black(arr)
        if "pad" in heal:
            pt, pr, pb, pl = heal["pad"]
            canvas = np.zeros((arr.shape[0] + pt + pb, arr.shape[1] + pl + pr, 3), np.float32)
            canvas[:, :] = np.array((10, 10, 10), np.float32)
            canvas[pt:pt + arr.shape[0], pl:pl + arr.shape[1]] = arr
            arr = canvas
            h, w = arr.shape[0], arr.shape[1]

        plate = Image.fromarray(arr.clip(0, 255).astype(np.uint8))

        if name in ("facade", "rear", "cutaway"):
            # feather the healed corner so no seam survives the upscale
            fx, fy = (round(0.19 * w), round(0.67 * h)) if name == "cutaway" else \
                     (round(0.46 * w), round(0.25 * h))
            patch = plate.crop((0, 0, fx, fy)).filter(ImageFilter.GaussianBlur(1.3))
            plate.paste(patch, (0, 0))

        out = plate.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
        # Lanczos upscaling softens; a light unsharp restores the render's edges
        # without the halo that an aggressive pass would print around the dome.
        out = out.filter(ImageFilter.UnsharpMask(radius=1.3, percent=72, threshold=3))

        path = os.path.join(OUT, f"{name}.webp")
        out.save(path, "WEBP", quality=88, method=6)
        manifest[name] = {"w": out.width, "h": out.height, "blur": lqip(plate)}
        print(f"{name:8s} {box} -> {out.width}x{out.height}  {os.path.getsize(path)//1024} kB")

    with open(os.path.join(OUT, "plates.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    print("wrote plates.json")


if __name__ == "__main__":
    main()
