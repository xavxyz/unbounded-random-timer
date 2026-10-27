# /// script
# dependencies = ["pillow", "numpy"]
# ///
"""
Cuts the Emblem's frame out of the wallpaper: the case, motto band, screws and
crown, with a transparent centre for the drawn gears to show through
(see docs/adr/0001-emblem-frame-from-wallpaper.md).

    uv run scripts/cut-emblem-frame.py ~/Pictures/onepart.jpg assets/emblem-frame.png
"""
import sys

import numpy as np
from PIL import Image

# The case in the wallpaper: its centre and outer radius, in pixels.
CX, CY, R = 1559, 921, 468
# The frame spans the Emblem's -110..110 drawing units; the case's outer edge is at 99.
HALF = R * 110 / 99
# The inner silver ring's edge, as a share of the case's radius: inside it are the gears.
INNER = 0.755
FEATHER = 2.5
SIZE = 1024

src, out = sys.argv[1], sys.argv[2]
square = Image.open(src).convert('RGB').crop(
    (round(CX - HALF), round(CY - HALF), round(CX + HALF), round(CY + HALF))
)
n = square.size[0]
yy, xx = np.mgrid[0:n, 0:n]
c = n / 2
r = np.hypot(xx - c, yy - c)
alpha = np.clip((R + 3 - r) / FEATHER, 0, 1) * np.clip((r - R * INNER) / FEATHER, 0, 1)
# The crown stands outside the case on the right: keep its lit pixels, not the background.
crown = (xx > c + R - 30) & (xx < c + R + 60) & (np.abs(yy - c) < 62)
alpha = np.maximum(alpha, crown * (np.asarray(square.convert('L')) > 45))
rgba = np.dstack([np.asarray(square), (alpha * 255).astype(np.uint8)])
Image.fromarray(rgba, 'RGBA').resize((SIZE, SIZE), Image.LANCZOS).save(out, optimize=True)
print(out, n, '->', SIZE)
