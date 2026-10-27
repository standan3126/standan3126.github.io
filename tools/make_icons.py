"""Draw GameHub's placeholder home-screen icons into icons/ (run once; the output is committed).

A soft sage background with four cream tiles, one per game colour. Replace the PNGs with real
artwork any time; keep the same file names and sizes.
"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "icons"
TINTS = [(156, 195, 201), (143, 179, 154), (201, 180, 143), (214, 167, 160)]


def draw(size, safe):
    big = size * 4  # draw large, then shrink, for smooth edges
    img = Image.new("RGB", (big, big))
    d = ImageDraw.Draw(img)
    top, bottom = (132, 168, 147), (88, 130, 112)
    for y in range(big):
        t = y / big
        d.line([(0, y), (big, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(top, bottom)))
    # four tiles in a 2x2 grid, kept inside the safe zone (maskable icons get cropped to a circle)
    box = big * safe
    gap = box * 0.08
    tile = (box - gap) / 2
    x0 = y0 = (big - box) / 2
    for i, tint in enumerate(TINTS):
        x = x0 + (i % 2) * (tile + gap)
        y = y0 + (i // 2) * (tile + gap)
        d.rounded_rectangle([x, y + tile * 0.05, x + tile, y + tile * 1.05], radius=tile * 0.24, fill=(70, 105, 90))
        d.rounded_rectangle([x, y, x + tile, y + tile], radius=tile * 0.24, fill=(250, 246, 236))
        r = tile * 0.2
        cx, cy = x + tile / 2, y + tile / 2
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=tint)
    return img.resize((size, size), Image.LANCZOS)


OUT.mkdir(exist_ok=True)
draw(192, 0.66).save(OUT / "icon-192.png")
draw(512, 0.66).save(OUT / "icon-512.png")
draw(512, 0.56).save(OUT / "icon-maskable-512.png")
draw(180, 0.66).save(OUT / "apple-touch-icon.png")
print("icons written to", OUT)
