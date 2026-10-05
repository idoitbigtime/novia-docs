#!/usr/bin/env python3
"""Tile PNG frames into one contact sheet. usage: sheet.py out.png cols width img1 img2 ..."""
import sys
from PIL import Image, ImageDraw
out, cols, w = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
ims = [Image.open(p).convert("RGB") for p in sys.argv[4:]]
h = int(ims[0].height * w / ims[0].width)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * (h + 26)), "black")
d = ImageDraw.Draw(sheet)
for i, (im, p) in enumerate(zip(ims, sys.argv[4:])):
    x, y = (i % cols) * w, (i // cols) * (h + 26)
    sheet.paste(im.resize((w, h)), (x, y + 26))
    d.text((x + 6, y + 6), p.split("/")[-1], fill=(255, 255, 255))
sheet.save(out)
print(out, sheet.size)
