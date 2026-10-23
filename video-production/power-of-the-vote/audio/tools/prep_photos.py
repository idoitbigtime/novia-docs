# Build web-ready photo variants: main (max 3200px), blur (bokeh), illus (stylized flat-illustration look).
import sys, os, json, glob
import numpy as np
from PIL import Image, ImageFilter, ImageOps, ImageEnhance
src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
out = {}
for f in sorted(glob.glob(os.path.join(src, '*.jpg'))):
    k = os.path.splitext(os.path.basename(f))[0]
    im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
    im.thumbnail((3200, 3200), Image.LANCZOS)
    im.save(os.path.join(dst, k + '.jpg'), quality=90)
    # bokeh/blur variant
    b = im.copy(); b.thumbnail((540, 540), Image.LANCZOS); b = b.filter(ImageFilter.GaussianBlur(9))
    b = ImageEnhance.Color(b).enhance(1.15); b.save(os.path.join(dst, k + '_blur.jpg'), quality=88)
    # illustration variant: bilateral-ish smoothing via median, posterize, ink edges, punchier palette
    s = im.copy(); s.thumbnail((1800, 1800), Image.LANCZOS)
    sm = s.filter(ImageFilter.MedianFilter(7)).filter(ImageFilter.MedianFilter(7))
    sm = ImageEnhance.Color(sm).enhance(1.55); sm = ImageEnhance.Contrast(sm).enhance(1.15)
    q = sm.quantize(colors=14, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    g = ImageOps.grayscale(s.filter(ImageFilter.MedianFilter(5)))
    e = np.asarray(g.filter(ImageFilter.FIND_EDGES), dtype=np.float32)
    e = np.clip((e - 18) * 4.0, 0, 255) / 255.0
    e = np.asarray(Image.fromarray((e * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)), dtype=np.float32) / 255.0
    a = np.asarray(q, dtype=np.float32)
    ink = np.array([12, 18, 40], dtype=np.float32)
    a = a * (1 - e[..., None] * 0.85) + ink * (e[..., None] * 0.85)
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(os.path.join(dst, k + '_illus.jpg'), quality=88)
    out[k] = im.size
    print(k, im.size)
json.dump(out, open(os.path.join(dst, 'sizes.json'), 'w'))
