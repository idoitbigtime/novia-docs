#!/usr/bin/env python3
"""place_sfx.py - lay SFX over a music stem at given times (sample-accurate) and write a 24-bit mix.

    place_sfx.py music.wav cues.json out.wav [--sfx-dir sfx] [--ceiling -1] [--report out.json]

cues.json: [{"t": 2.61, "sfx": "pop", "gain_db": -9, "pan": 0.0}, ...]
  t        start time of the SFX file in seconds (whooshes/swipes peak ~40-50 % into the file)
  gain_db  applied to the -6 dBFS-normalised SFX (default -9)
  pan      -1..1 balance (default 0)
Nothing is normalised here (the final video mix is normalised later); if the mix would exceed the
true-peak ceiling the whole mix is turned down and a warning is printed.
"""
import argparse
import json
import math
import os

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy import signal


def true_peak_db(x):
    return 20 * math.log10(float(np.max(np.abs(signal.resample_poly(x, 4, 1, axis=0)))) + 1e-12)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('music')
    ap.add_argument('cues')
    ap.add_argument('out')
    ap.add_argument('--sfx-dir', default=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sfx'))
    ap.add_argument('--ceiling', type=float, default=-1.0)
    ap.add_argument('--report')
    a = ap.parse_args()
    x, fs = sf.read(a.music, always_2d=True)
    cues = json.load(open(a.cues))
    cache = {}
    placed = []
    for c in sorted(cues, key=lambda c: c['t']):
        name = c['sfx']
        if name not in cache:
            y, fs2 = sf.read(os.path.join(a.sfx_dir, name + '.wav'), always_2d=True)
            assert fs2 == fs, f'{name}: sample rate {fs2} != {fs}'
            cache[name] = y
        y = cache[name] * 10 ** (c.get('gain_db', -9.0) / 20)
        p = float(np.clip(c.get('pan', 0.0), -1, 1))
        y = y * np.array([min(1.0, 1.0 - p), min(1.0, 1.0 + p)])[None, :]
        i0 = int(round(c['t'] * fs))
        i1 = min(len(x), i0 + len(y))
        if i0 >= len(x) or i0 < 0:
            print(f"  skip {name} at {c['t']} s (outside the music)")
            continue
        x[i0:i1] += y[:i1 - i0]
        placed.append(dict(t=round(i0 / fs, 4), sfx=name, gain_db=c.get('gain_db', -9.0), pan=p,
                           end=round(i1 / fs, 4)))
    tp = true_peak_db(x)
    trim = 0.0
    if tp > a.ceiling:
        trim = a.ceiling - tp
        x *= 10 ** (trim / 20)
        print(f"  warning: true peak {tp:.2f} dBTP > ceiling, whole mix lowered by {-trim:.2f} dB")
    lsb = 2.0 ** -23
    rng = np.random.default_rng(12345)
    x = np.clip(x + (rng.random(x.shape) - rng.random(x.shape)) * lsb, -1, 1 - lsb)
    sf.write(a.out, x, fs, subtype='PCM_24')
    lufs = pyln.Meter(fs).integrated_loudness(x)
    rep = dict(out=os.path.abspath(a.out), music=os.path.abspath(a.music), cues=placed, lufs=lufs,
               true_peak_dbtp=true_peak_db(x), sample_peak_dbfs=20 * math.log10(np.max(np.abs(x))), trim_db=trim)
    print(f"  {len(placed)} SFX placed -> {a.out}: {lufs:.2f} LUFS, true peak {rep['true_peak_dbtp']:.2f} dBTP")
    for c in placed:
        print(f"    {c['t']:7.3f}-{c['end']:7.3f} s  {c['sfx']:<12} {c['gain_db']:+.1f} dB  pan {c['pan']:+.2f}")
    if a.report:
        with open(a.report, 'w') as f:
            json.dump(rep, f, indent=1)


if __name__ == '__main__':
    main()
