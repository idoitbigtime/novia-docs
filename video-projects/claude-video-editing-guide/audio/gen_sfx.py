#!/usr/bin/env python3
"""gen_sfx.py - procedural UI / motion-graphics sound effects (no samples), 48 kHz stereo 24-bit.

    gen_sfx.py [--out sfx] [--seed 3] [--peak -6] [--sheet review/sfx_sheet.png]

Writes <out>/{whoosh_soft,tick,pop,shimmer,snap,swipe,glitch_soft}.wav and <out>/sfx_report.json.

Style guide: SFX have NO bass - they sound like air, a tick or a gentle touch, never a thud.
Every sound is synthesised above ~400 Hz, then an 8th-order (2 x 4th-order Butterworth, causal so
transients get no pre-echo) 200 Hz high-pass is applied as the last filter, and each file is
verified to keep < 1 % of its energy below 200 Hz. Each file is peak-normalised to --peak dBFS.
"""
import argparse
import json
import math
import os
import sys
import zlib

import numpy as np
import soundfile as sf
from scipy import signal

FS = 48000
TWO_PI = 2 * math.pi
HP200 = signal.butter(4, 200, 'hp', fs=FS, output='sos')


def rng_for(seed, *keys):
    words = [int(seed) & 0xFFFFFFFF] + [zlib.crc32(repr(k).encode()) for k in keys]
    return np.random.default_rng(np.random.SeedSequence(words))


def pan_gains(p):
    a = (np.clip(p, -1, 1) + 1) * (math.pi / 4)
    return np.cos(a), np.sin(a)


def raised(n):
    return np.sin(0.5 * np.pi * np.arange(n) / max(1, n)) ** 2


def fade(x, fin, fout):
    n = x.shape[-1]
    fin, fout = min(int(fin), n), min(int(fout), n)
    if fin > 0:
        x[..., :fin] *= raised(fin)
    if fout > 0:
        x[..., n - fout:] *= raised(fout)[::-1]
    return x


def shaped_noise(rng, n, gain_fn, nper=1024, hop=128, stereo_corr=0.6):
    """Stereo noise with a time-varying spectral envelope gain_fn(f, t) (STFT shaping)."""
    a = rng.standard_normal(n + nper)
    b = rng.standard_normal(n + nper)
    k = math.sqrt(1 - stereo_corr ** 2)
    x = np.stack([stereo_corr * a + k * b, stereo_corr * a - k * b])
    f, tt, Z = signal.stft(x, fs=FS, nperseg=nper, noverlap=nper - hop)
    Z = Z * gain_fn(f, tt - nper / 2 / FS)
    _, y = signal.istft(Z, fs=FS, nperseg=nper, noverlap=nper - hop)
    return y[:, nper // 2: nper // 2 + n]


def bandpass_gain(f, fc, bw_oct):
    return np.exp(-0.5 * (np.log2((f[:, None] + 1.0) / fc[None, :]) / bw_oct) ** 2)


# ---------------------------------------------------------------------------- the sounds
def whoosh_soft(rng):
    dur = 0.68
    n = int(dur * FS)

    def g(f, tt):
        u = np.clip(tt / dur, 0, 1)
        bump = np.sin(np.pi * u ** 0.85)
        fc = 420.0 * (1700.0 / 420.0) ** bump                 # rises then falls: a soft pass-by
        amp = np.sin(np.pi * u ** 0.8) ** 2
        air = 0.025 * (f[:, None] / 5000.0) ** 2 / (1 + (f[:, None] / 5000.0) ** 2) / (1 + (f[:, None] / 9000.0) ** 4)
        return (bandpass_gain(f, fc, 0.75) + air) * amp[None, :] / np.sqrt(fc[None, :] / 420.0)

    y = shaped_noise(rng, n, g, stereo_corr=0.5)
    t = np.arange(n) / FS
    gl, gr = pan_gains(-0.55 + 1.1 * (t / dur))           # drifts left -> right
    y = np.stack([y[0] * gl, y[1] * gr])
    return fade(y, 0.01 * FS, 0.06 * FS)


def tick(rng):
    n = int(0.045 * FS)
    t = np.arange(n) / FS
    nz = signal.sosfilt(signal.butter(2, [2000, 6000], 'bandpass', fs=FS, output='sos'), rng.standard_normal(n))
    y = (0.8 * np.sin(TWO_PI * 2250 * t) * np.exp(-t / 0.0040)
         + 0.32 * np.sin(TWO_PI * 3350 * t + 0.4) * np.exp(-t / 0.0022)
         + 0.45 * np.sin(TWO_PI * 1250 * t + 1.1) * np.exp(-t / 0.0060)
         + 0.25 * nz / (np.std(nz) + 1e-12) * np.exp(-t / 0.0012))
    y[: int(0.0004 * FS)] *= raised(int(0.0004 * FS))
    y = fade(y, 0, 0.012 * FS)
    return np.stack([y, y * 0.97])


def pop(rng):
    n = int(0.14 * FS)
    t = np.arange(n) / FS
    f = 430 + (1000 - 430) * (1 - np.exp(-t / 0.018))      # rising pitch: a bubble surfacing
    ph = TWO_PI * np.cumsum(f) / FS
    att = 0.0015
    env = np.where(t < att, np.sin(0.5 * np.pi * t / att) ** 2, np.exp(-(t - att) / 0.028))
    y = np.sin(ph) * env + 0.16 * np.sin(2 * ph + 0.3) * env ** 1.5
    lip = signal.sosfilt(signal.butter(2, [1500, 4000], 'bandpass', fs=FS, output='sos'), rng.standard_normal(n))
    y += 0.10 * lip / (np.std(lip) + 1e-12) * np.exp(-t / 0.0008) * raised(n)[::-1]
    y = fade(y, 0, 0.03 * FS)
    return np.stack([y, y])


def shimmer(rng):
    dur = 0.8
    n = int(dur * FS)
    t = np.arange(n) / FS
    notes = np.array([1760.0, 2093.0, 2349.3, 2637.0, 3136.0, 3520.0, 4186.0])   # A minor pentatonic, A6..C8
    w = np.array([1.0, 1.0, 0.9, 0.8, 0.6, 0.45, 0.3])
    y = np.zeros((2, n))
    K = 18
    for k in range(K):
        t0 = 0.33 * (k / K) ** 0.7 + rng.uniform(0, 0.012)
        f = notes[rng.choice(len(notes), p=w / w.sum())] * 2 ** (rng.normal(0, 3) / 1200)
        a = rng.uniform(0.55, 1.0) * (1760.0 / f) ** 0.6 * (1 - 0.35 * k / K)
        tau = rng.uniform(0.10, 0.26)
        m = t >= t0
        tt = t[m] - t0
        env = np.minimum(1.0, tt / 0.004) ** 2 * np.exp(-tt / tau)
        s = np.sin(TWO_PI * f * tt + rng.uniform(0, TWO_PI)) + 0.3 * np.sin(TWO_PI * f * 1.0017 * tt)
        gl, gr = pan_gains(rng.uniform(-0.6, 0.6))
        y[0, m] += a * gl * env * s
        y[1, m] += a * gr * env * s

    def g(f, tt):
        u = np.clip(tt / dur, 0, 1)
        amp = np.minimum(1, u / 0.06) * np.exp(-np.maximum(0, u - 0.06) / 0.3)
        return ((f[:, None] / 6000.0) ** 2 / (1 + (f[:, None] / 6000.0) ** 2)) / (1 + (f[:, None] / 12000.0) ** 4) * amp[None, :]

    air = shaped_noise(rng, n, g, stereo_corr=0.2)
    y = y / (np.max(np.abs(y)) + 1e-12) + 0.35 * air / (np.max(np.abs(air)) + 1e-12)
    return fade(y, 0.002 * FS, 0.18 * FS)


def snap(rng):
    n = int(0.09 * FS)
    t = np.arange(n) / FS
    nz = signal.sosfilt(signal.butter(2, [1200, 4500], 'bandpass', fs=FS, output='sos'), rng.standard_normal(n))
    y = (0.7 * nz / (np.std(nz) + 1e-12) * np.exp(-t / 0.0030)
         + 0.55 * np.sin(TWO_PI * 1050 * t) * np.exp(-t / 0.012)
         + 0.30 * np.sin(TWO_PI * 1720 * t + 0.7) * np.exp(-t / 0.007)
         + 0.22 * np.sin(TWO_PI * 640 * t + 0.2) * np.exp(-t / 0.018))
    y[: int(0.0003 * FS)] *= raised(int(0.0003 * FS))
    y = fade(y, 0, 0.025 * FS)
    return np.stack([y * 0.98, y])


def swipe(rng):
    dur = 0.35
    n = int(dur * FS)

    def g(f, tt):
        u = np.clip(tt / dur, 0, 1)
        fc = 650.0 * (3200.0 / 650.0) ** (u ** 1.5)
        amp = np.where(u < 0.55, np.sin(0.5 * np.pi * u / 0.55) ** 2, np.cos(0.5 * np.pi * (u - 0.55) / 0.45) ** 2)
        return bandpass_gain(f, fc, 0.85) * amp[None, :] / (fc[None, :] / 650.0) ** 0.5

    y = shaped_noise(rng, n, g, nper=512, hop=64, stereo_corr=0.4)
    t = np.arange(n) / FS
    gl, gr = pan_gains(0.45 - 0.9 * (t / dur))            # right -> left
    y = np.stack([y[0] * gl, y[1] * gr])
    return fade(y, 0.004 * FS, 0.03 * FS)


def glitch_soft(rng):
    n = int(0.2 * FS)
    y = np.zeros((2, n))
    blips = [(0.000, 0.014, 1320.0, 1.00, -0.3), (0.032, 0.009, 1980.0, 0.55, 0.3),
             (0.058, 0.012, 1480.0, 0.70, -0.2), (0.105, 0.018, 2640.0, 0.40, 0.25)]
    for k, (t0, d, f, a, p) in enumerate(blips):
        m = int(d * FS)
        tt = np.arange(m) / FS
        sq = sum(np.sin(TWO_PI * h * f * tt) / h for h in (1, 3, 5) if h * f < 6500)  # band-limited square
        if k == 2:                                              # one 'bit-crushed' blip (sample & hold)
            sq = np.repeat(sq[::3], 3)[:m]
        env = np.ones(m)
        e = int(0.001 * FS)
        env[:e] = raised(e)
        env[-e:] = raised(e)[::-1]
        s = sq * env * a
        gl, gr = pan_gains(p)
        i0 = int(t0 * FS)
        y[0, i0:i0 + m] += gl * s
        y[1, i0:i0 + m] += gr * s
    y = signal.sosfilt(signal.butter(2, 6000, 'lp', fs=FS, output='sos'), y, axis=-1)
    return fade(y, 0, 0.02 * FS)


SFX = {'whoosh_soft': whoosh_soft, 'tick': tick, 'pop': pop, 'shimmer': shimmer, 'snap': snap,
       'swipe': swipe, 'glitch_soft': glitch_soft}


# ---------------------------------------------------------------------------- finishing + checks
def finish(y, peak_db):
    """200 Hz high-pass (8th order, causal) as the last filter; trailing silence trimmed at -70 dB
    (plus a 3 ms fade), then peak-normalised."""
    y = np.concatenate([y, np.zeros((2, int(0.02 * FS)))], axis=1)
    y = signal.sosfilt(HP200, signal.sosfilt(HP200, y, axis=-1), axis=-1)
    a = np.abs(y).max(axis=0)
    end = int(np.nonzero(a > a.max() * 10 ** (-70 / 20))[0][-1]) + int(0.003 * FS)
    y = fade(y[:, :min(end, y.shape[1])].copy(), 0, int(0.003 * FS))
    return y * (10 ** (peak_db / 20) / np.max(np.abs(y)))


def lf_fraction(y, fc=200.0):
    nfft = 1 << int(math.ceil(math.log2(max(y.shape[1], 1 << 16))))
    X = np.abs(np.fft.rfft(y, nfft, axis=-1)) ** 2
    X[:, 1:-1] *= 2
    f = np.fft.rfftfreq(nfft, 1 / FS)
    return float(np.max(X[:, f < fc].sum(axis=1) / X.sum(axis=1))), f, X


def describe(y):
    frac, f, X = lf_fraction(y)
    P = X.sum(axis=0)
    up = signal.resample_poly(y.T, 4, 1, axis=0)
    band = lambda a, b: float(P[(f >= a) & (f < b)].sum() / P.sum())
    return dict(duration_sec=round(y.shape[1] / FS, 4), peak_dbfs=round(20 * math.log10(np.max(np.abs(y))), 2),
                true_peak_dbtp=round(20 * math.log10(np.max(np.abs(up))), 2),
                rms_dbfs=round(20 * math.log10(np.sqrt(np.mean(y ** 2))), 2),
                energy_below_200hz_pct=round(100 * frac, 4),
                energy_200_500hz_pct=round(100 * band(200, 500), 2),
                energy_3k_6k_pct=round(100 * band(3000, 6000), 2),
                centroid_hz=round(float((f * P).sum() / P.sum()), 1))


def sheet(results, path):
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from analyze_audio import draw_spec_panel, draw_wave_panel, font
    from PIL import Image, ImageDraw
    names = list(results)
    cw, ch = 520, 220
    can = Image.new('RGB', (2 * (cw + 90) + 20, 4 * (ch + 150) + 20), (12, 12, 16))
    for k, nm in enumerate(names):
        y = results[nm]['audio']
        x0 = 70 + (k % 2) * (cw + 90)
        y0 = 30 + (k // 2) * (ch + 150)
        mono = y.mean(axis=0)
        T = y.shape[1] / FS
        pad = np.concatenate([np.zeros(int(0.02 * FS)), mono, np.zeros(int(0.02 * FS))])
        d = results[nm]['info']
        draw_spec_panel(can, x0, y0, pad, FS, 0, T + 0.04, cw, ch, 50, 20000, True, 512 if T < 0.2 else 1024,
                        f"{nm}  {d['duration_sec']} s  <200Hz {d['energy_below_200hz_pct']:.3f}%  centroid {d['centroid_hz']:.0f} Hz",
                        db=(-120, -40))
        dr = ImageDraw.Draw(can)
        from analyze_audio import fy
        yy = y0 + fy(200, 50, 20000, ch, True)
        dr.line([(x0, yy), (x0 + cw, yy)], fill=(255, 80, 80))
        draw_wave_panel(can, x0, y0 + ch + 45, np.concatenate([np.zeros((int(0.02 * FS), 2)), y.T,
                                                                 np.zeros((int(0.02 * FS), 2))]),
                        FS, 0, T + 0.04, cw, 60, "waveform (red line above = 200 Hz)")
    can.save(path)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--out', default=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sfx'))
    ap.add_argument('--seed', type=int, default=3)
    ap.add_argument('--peak', type=float, default=-6.0)
    ap.add_argument('--sheet', help='write a spectrogram/waveform contact sheet PNG')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    results, report, ok = {}, {}, True
    for name, fn in SFX.items():
        y = finish(fn(rng_for(a.seed, name)), a.peak)
        info = describe(y)
        info['passes_no_bass'] = info['energy_below_200hz_pct'] < 1.0
        ok &= info['passes_no_bass']
        sf.write(os.path.join(a.out, name + '.wav'), y.T, FS, subtype='PCM_24')
        results[name] = dict(audio=y, info=info)
        report[name] = info
        print(f"{name:<12} {info['duration_sec']:6.3f} s  peak {info['peak_dbfs']:6.2f} dBFS  TP {info['true_peak_dbtp']:6.2f}"
              f"  <200 Hz {info['energy_below_200hz_pct']:7.4f} %  200-500 {info['energy_200_500hz_pct']:5.2f} %"
              f"  3-6k {info['energy_3k_6k_pct']:5.1f} %  centroid {info['centroid_hz']:6.0f} Hz"
              f"  {'OK' if info['passes_no_bass'] else 'FAIL'}")
    with open(os.path.join(a.out, 'sfx_report.json'), 'w') as f:
        json.dump(dict(samplerate=FS, subtype='PCM_24', channels=2, peak_target_dbfs=a.peak, highpass='200 Hz, 8th-order Butterworth (causal)',
                       criterion='energy below 200 Hz < 1 %', all_pass=bool(ok), sfx=report), f, indent=1)
    if a.sheet:
        sheet(results, a.sheet)
    if not ok:
        sys.exit('some SFX failed the no-bass check')


if __name__ == '__main__':
    main()
