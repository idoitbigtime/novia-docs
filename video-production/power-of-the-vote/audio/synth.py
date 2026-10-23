"""Original score + sound design for the film, synthesized from scratch (no samples).
Writes music_bed.wav (score+sfx, ducked under the narration) and the final mix.
The narration (master audio) is added untouched; only the bed is shaped around it.
usage: python synth.py master.wav timing.json outdir
"""
import json, sys, os
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
master_path, timing_path, outdir = sys.argv[1], sys.argv[2], sys.argv[3]
TOTAL = 116.5
N = int(SR * TOTAL)
rs = np.random.RandomState(7)

MUS = np.zeros((2, N)); SFX = np.zeros((2, N)); VERB = np.zeros((2, N))

def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
NOTE = {n: i for i, n in enumerate(['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'])}
def nf(s):  # 'D3' -> Hz
    name, octv = s[:-1], int(s[-1]); return mtof(12 * (octv + 1) + NOTE[name])

def put(bus, sig, t0, pan=0.0, gain=1.0, verb=0.0):
    sig = np.asarray(sig, dtype=np.float64)
    if sig.ndim == 1:
        l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
        sig = np.vstack([sig * l * 1.414, sig * r * 1.414]) * 0.7071
    i0 = int(round(t0 * SR));
    if i0 >= N: return
    s0 = 0
    if i0 < 0: s0 = -i0; i0 = 0
    n = min(sig.shape[1] - s0, N - i0)
    if n <= 0: return
    bus[:, i0:i0 + n] += sig[:, s0:s0 + n] * gain
    if verb > 0: VERB[:, i0:i0 + n] += sig[:, s0:s0 + n] * gain * verb

def tt(d): return np.arange(int(d * SR)) / SR
def env_exp(d, tau): t = tt(d); return np.exp(-t / tau)
def adsr(d, a, r, curve=1.0):
    n = int(d * SR); e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** curve
    e[-nr:] *= np.linspace(1, 0, nr) ** 1.5
    return e
def lp(x, f, o=2): return signal.sosfilt(signal.butter(o, min(f, SR / 2 * 0.95), 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, f1, f2, o=2): return signal.sosfilt(signal.butter(o, [f1, min(f2, SR / 2 * 0.95)], 'band', fs=SR, output='sos'), x)
def noise(d): return rs.randn(int(d * SR))
def saw_ph(ph): return 2.0 * (ph - np.floor(ph + 0.5))
def osc_saw(freq, d, ph0=None):
    t = tt(d); f = np.broadcast_to(freq, t.shape) if np.ndim(freq) else np.full(t.shape, freq)
    ph = np.cumsum(f) / SR + (rs.rand() if ph0 is None else ph0)
    return saw_ph(ph)
def osc_sin(freq, d, ph0=0.0):
    t = tt(d); f = np.broadcast_to(freq, t.shape) if np.ndim(freq) else np.full(t.shape, freq)
    return np.sin(2 * np.pi * (np.cumsum(f) / SR + ph0))
def sweep_filter(x, f_start, f_end, kind='band', q=1.5, block=512, curve='exp'):
    """Block-wise time-varying filter (bandpass or lowpass)."""
    y = np.zeros_like(x); zi = None; nb = int(np.ceil(len(x) / block))
    for b in range(nb):
        u = b / max(1, nb - 1)
        f = f_start * (f_end / f_start) ** u if curve == 'exp' else f_start + (f_end - f_start) * u
        f = float(np.clip(f, 30, SR / 2 * 0.9))
        if kind == 'band':
            bw = f / q; sos = signal.butter(2, [max(20, f - bw / 2), min(SR / 2 * 0.95, f + bw / 2)], 'band', fs=SR, output='sos')
        else:
            sos = signal.butter(2, f, 'low', fs=SR, output='sos')
        if zi is None: zi = np.zeros((sos.shape[0], 2))
        seg = x[b * block:(b + 1) * block]
        y[b * block:b * block + len(seg)], zi = signal.sosfilt(sos, seg, zi=zi)
    return y

# ------------------------------------------------------------------ instruments
def supersaw(freqs, d, voices=5, det=0.14, cutoff=1800, vib=0.0):
    out = np.zeros(int(d * SR)); t = tt(d)
    for f in freqs:
        for v in range(voices):
            cents = (v - (voices - 1) / 2) / max(1, (voices - 1) / 2) * det * 100
            fv = f * 2 ** (cents / 1200) * (1 + vib * 0.004 * np.sin(2 * np.pi * (5.2 + v * 0.13) * t + v))
            out += osc_saw(fv, d)
    out /= (len(freqs) * voices) ** 0.5
    return lp(out, cutoff, 2)

def pad(bus, t0, t1, notes, gain=0.25, a=1.2, r=1.5, cutoff=1500, pan_w=0.5, verb=0.6, vib=1.0, voices=5):
    d = t1 - t0 + r
    fs = [nf(n) if isinstance(n, str) else n for n in notes]
    L = supersaw(fs, d, voices, 0.12, cutoff, vib) * adsr(d, a, r)
    R = supersaw(fs, d, voices, 0.13, cutoff, vib) * adsr(d, a, r)
    put(bus, np.vstack([L * (1 + pan_w) / 2 + R * (1 - pan_w) / 2, R * (1 + pan_w) / 2 + L * (1 - pan_w) / 2]), t0, gain=gain, verb=verb)

def choir(bus, t0, t1, notes, gain=0.2, a=0.8, r=1.5, verb=0.7):
    d = t1 - t0 + r
    fs = [nf(n) for n in notes]
    x = supersaw(fs, d, 6, 0.18, 4000, 1.2)
    y = 0.9 * bp(x, 650, 850) + 0.6 * bp(x, 1100, 1350) + 0.25 * bp(x, 2400, 2800)
    y *= adsr(d, a, r) * 2.2
    put(bus, y, t0, pan=-0.2, gain=gain, verb=verb); put(bus, y[::-1][::-1], t0 + 0.012, pan=0.25, gain=gain * 0.8, verb=verb)

def brass(bus, t0, d, notes, gain=0.35, verb=0.5, open_t=0.12, bright=2600, sub=True):
    t = tt(d + 0.6); n = len(t)
    out = np.zeros(n)
    for s in notes:
        f = nf(s); scoop = 2 ** (-0.35 / 12 * np.exp(-t / 0.05))
        for v in range(3):
            out += osc_saw(f * scoop * 2 ** ((v - 1) * 0.08 / 12), d + 0.6)
        if sub: out += 0.5 * osc_saw(f / 2 * scoop, d + 0.6)
    fenv_start, fenv_end = 250, bright
    y = np.zeros(n); blk = 256; zi = None
    for b in range(0, n, blk):
        u = b / SR
        fc = fenv_start + (fenv_end - fenv_start) * (1 - np.exp(-u / open_t)) * (0.75 + 0.25 * np.exp(-u / 0.6))
        sos = signal.butter(2, fc, 'low', fs=SR, output='sos')
        if zi is None: zi = np.zeros((sos.shape[0], 2))
        y[b:b + blk], zi = signal.sosfilt(sos, out[b:b + blk], zi=zi)
    y = np.tanh(y * 0.9) * adsr(d + 0.6, 0.03, 0.6)
    put(bus, y, t0, pan=-0.15, gain=gain, verb=verb); put(bus, y, t0 + 0.008, pan=0.2, gain=gain * 0.85, verb=verb)

def piano(bus, t0, s, d=3.0, vel=0.6, pan=0.0, verb=0.5, gain=0.3):
    f = nf(s) if isinstance(s, str) else s; t = tt(d); B = 0.0004
    y = np.zeros_like(t)
    for k in range(1, 14):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > 16000: break
        amp = (1 / k ** 1.25) * (0.6 + 0.4 * vel) * (1 if k < 4 else vel)
        dec = (2.8 / (1 + 0.35 * k)) * (220 / max(110, f)) ** 0.4
        y += amp * np.sin(2 * np.pi * fk * t + rs.rand() * 6.28) * np.exp(-t / dec)
    ham = lp(noise(0.02), 3000) * env_exp(0.02, 0.004) * 0.3 * vel
    y[:len(ham)] += ham
    y *= np.minimum(1, t / 0.003) * adsr(d, 0.002, 0.3)
    put(bus, y * vel, t0, pan=pan, gain=gain, verb=verb)

def pluck(f, d=1.2, bright=0.6, decay=0.996):
    L = max(2, int(round(SR / f)))
    exc = lp(rs.randn(L), 1200 + 6000 * bright) * np.hanning(L)
    x = np.zeros(int(d * SR)); x[:len(exc)] = exc
    a = np.zeros(L + 2); a[0] = 1; a[L] = -decay * 0.5; a[L + 1] = -decay * 0.5
    y = signal.lfilter([1], a, x)
    return y / (np.max(np.abs(y)) + 1e-9)

def oud(bus, t0, s, d=1.4, gain=0.35, pan=0.15, verb=0.45, vel=1.0):
    f = nf(s); y = pluck(f, d, 0.5, 0.993)
    body = 0.6 * bp(y, 180, 420) + 0.5 * bp(y, 900, 1500) + 0.4 * y
    body *= adsr(d, 0.002, 0.25) * vel
    put(bus, body, t0, pan=pan, gain=gain, verb=verb)

def pizz(bus, t0, s, gain=0.35, pan=0.0, verb=0.4):
    f = nf(s); y = pluck(f, 0.7, 0.25, 0.985) * env_exp(0.7, 0.25)
    put(bus, lp(y, 2500), t0, pan=pan, gain=gain, verb=verb)

def harp(bus, t0, s, gain=0.22, pan=0.0, verb=0.6):
    f = nf(s); y = pluck(f, 1.8, 0.35, 0.997)
    put(bus, y * adsr(1.8, 0.002, 0.4), t0, pan=pan, gain=gain, verb=verb)

def bell(bus, t0, s, gain=0.15, pan=0.0, verb=0.8, d=2.2):
    f = nf(s) if isinstance(s, str) else s; t = tt(d)
    m = np.sin(2 * np.pi * f * 3.5 * t) * 2.2 * np.exp(-t / 0.4)
    y = np.sin(2 * np.pi * f * t + m) * np.exp(-t / 0.9) + 0.3 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t / 0.5)
    put(bus, y * adsr(d, 0.002, 0.3), t0, pan=pan, gain=gain, verb=verb)

def violin(bus, t0, notes, gain=0.16, pan=-0.25, verb=0.7):
    """notes: list of (start, dur, 'A4')"""
    for st, du, s in notes:
        f = nf(s); t = tt(du + 0.3)
        vib = 1 + 0.006 * np.sin(2 * np.pi * 5.6 * t) * np.minimum(1, t / 0.25)
        slide = 2 ** (-0.25 / 12 * np.exp(-t / 0.06))
        x = osc_saw(f * vib * slide, du + 0.3) + 0.4 * osc_saw(f * 1.003 * vib, du + 0.3)
        y = 0.8 * bp(x, 400, 700) + 0.7 * bp(x, 1500, 3200) + 0.3 * bp(x, 250, 400)
        y += 0.03 * hp(noise(du + 0.3), 3000)
        y *= adsr(du + 0.3, 0.09, 0.3)
        put(bus, y, t0 + st, pan=pan, gain=gain, verb=verb)

# ---- percussion
def taiko(bus, t0, gain=0.6, pitch=1.0, verb=0.5, pan=0.0):
    d = 1.2; t = tt(d)
    f = (52 + 40 * np.exp(-t / 0.05)) * pitch
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.42)
    y += 0.6 * lp(noise(d), 350) * np.exp(-t / 0.06)
    y += 0.25 * hp(noise(d), 1500) * np.exp(-t / 0.015)
    put(bus, np.tanh(y * 1.6), t0, pan=pan, gain=gain, verb=verb)

def boom(bus, t0, gain=0.8, f0=62, f1=28, d=3.0, verb=0.25):
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t / 0.35)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 1.1)
    y += 0.5 * lp(noise(d), 180) * np.exp(-t / 0.12)
    y += 0.3 * hp(noise(d), 2000) * np.exp(-t / 0.01)
    put(bus, np.tanh(y * 2.0) * 0.8, t0, gain=gain, verb=verb)

def crash(bus, t0, gain=0.25, d=3.5, verb=0.4, rev=False):
    t = tt(d); fr = [205.3, 304.4, 369.6, 522.7, 540.0, 800.0]
    m = sum(np.sign(np.sin(2 * np.pi * f * 3.1 * t + rs.rand() * 6)) for f in fr)
    y = 0.4 * bp(m, 6000, 12000) + 0.8 * hp(noise(d), 5000)
    y *= np.exp(-t / 1.0)
    if rev: y = y[::-1] * np.linspace(0, 1, len(y)) ** 2
    yl = y; yr = np.roll(y, 37)
    put(bus, np.vstack([yl, yr]), t0 - (d if rev else 0), gain=gain, verb=verb)

def snare_roll(bus, t0, t1, gain=0.2, verb=0.35):
    t = t0; k = 0
    while t < t1:
        u = (t - t0) / (t1 - t0); iv = 0.18 * (1 - u) + 0.035 * u
        d = 0.18; tq = tt(d)
        y = 0.7 * bp(noise(d), 1500, 8000) * np.exp(-tq / 0.05) + 0.4 * np.sin(2 * np.pi * 190 * tq) * np.exp(-tq / 0.03)
        put(bus, y, t, pan=(-0.2 if k % 2 else 0.2), gain=gain * (0.4 + 0.6 * u), verb=verb)
        t += iv; k += 1

def darb(bus, t0, kind, gain=0.35, pan=0.1, verb=0.2):
    d = 0.4; t = tt(d)
    if kind == 'D':
        f = 95 + 60 * np.exp(-t / 0.02); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22) + 0.3 * lp(noise(d), 500) * np.exp(-t / 0.03)
    elif kind == 'T':
        y = 0.9 * hp(noise(d), 2200) * np.exp(-t / 0.025) + 0.5 * np.sin(2 * np.pi * 1150 * t) * np.exp(-t / 0.05)
    else:
        y = 0.5 * hp(noise(d), 3000) * np.exp(-t / 0.018) + 0.25 * np.sin(2 * np.pi * 1450 * t) * np.exp(-t / 0.03)
    put(bus, y, t0, pan=pan, gain=gain, verb=verb)

def maqsum(bus, t0, t1, bpm=120, gain=0.3, fill_last=True):
    e = 60 / bpm / 2  # eighth
    pat = ['D', 'T', None, 'T', 'D', None, 'T', None]
    t = t0; i = 0
    while t < t1 - 1e-6:
        k = pat[i % 8]
        if k: darb(bus, t, k, gain=gain)
        if i % 8 in (2, 5, 7): darb(bus, t + e / 2 * 0, 'k', gain=gain * 0.35)
        t += e; i += 1

def kick(bus, t0, gain=0.5):
    d = 0.5; t = tt(d); f = 48 + 90 * np.exp(-t / 0.03)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18)
    put(bus, np.tanh(y * 1.5), t0, gain=gain)

# ---- sfx
def whoosh(bus, t0, d=0.6, gain=0.35, f0=300, f1=4000, pan0=-0.6, pan1=0.6, verb=0.25, peak=0.65):
    x = noise(d); y1 = sweep_filter(x, f0, f1, 'band', q=1.2)
    t = tt(d); u = t / d
    e = np.where(u < peak, (u / peak) ** 2, ((1 - u) / (1 - peak)) ** 1.5)
    y = y1 * e
    pans = pan0 + (pan1 - pan0) * u
    l = np.cos((pans + 1) * np.pi / 4); r = np.sin((pans + 1) * np.pi / 4)
    put(bus, np.vstack([y * l, y * r]) * 1.4, t0, gain=gain, verb=verb)

def riser(bus, t0, t1, gain=0.3, f0=300, f1=7000, verb=0.3, tone=True):
    d = t1 - t0; x = noise(d); y = sweep_filter(x, f0, f1, 'band', q=2.0) * 2.0
    t = tt(d); u = t / d
    if tone: y += 0.25 * osc_saw(110 * 2 ** (2.5 * u), d) * u
    y *= (u ** 2.2)
    put(bus, y, t0, gain=gain, verb=verb)

def rev_swell(bus, t1, d=1.0, gain=0.3, s='D4'):
    f = nf(s); t = tt(d); y = (osc_saw(f, d) + osc_saw(f * 1.5, d) + osc_saw(f * 2, d)) / 3
    y = lp(y, 2500) * (t / d) ** 3
    put(bus, y, t1 - d, gain=gain, verb=0.6)

def shatter(bus, t0, gain=0.4):
    d = 1.4; out = np.zeros(int(d * SR))
    crack = hp(noise(0.25), 2500) * env_exp(0.25, 0.04); out[:len(crack)] += crack * 0.9
    for _ in range(140):
        st = rs.exponential(0.18);
        if st > 1.1: continue
        f = rs.uniform(2500, 9500); dd = rs.uniform(0.02, 0.25); tq = tt(dd)
        p = np.sin(2 * np.pi * f * tq) * np.exp(-tq / (dd / 3)) * rs.uniform(0.1, 0.5)
        i = int(st * SR); out[i:i + len(p)] += p[:len(out) - i]
    put(bus, out, t0, pan=-0.1, gain=gain, verb=0.4); put(bus, np.roll(out, 400), t0, pan=0.3, gain=gain * 0.7, verb=0.4)

def pop(bus, t0, gain=0.25, pan=0.0, f0=420, f1=1300):
    d = 0.09; t = tt(d); f = f0 + (f1 - f0) * (t / d); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.025)
    put(bus, y, t0, pan=pan, gain=gain, verb=0.15)

def boing(bus, t0, gain=0.18, pan=0.0):
    d = 0.45; t = tt(d); f = 260 * (1 + 0.25 * np.sin(2 * np.pi * 16 * t) * np.exp(-t / 0.2)) * (1 - 0.3 * t)
    put(bus, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.15), t0, pan=pan, gain=gain, verb=0.2)

def stinger_wah(bus, t0, gain=0.22, s='D3'):  # comic trombone "wah-wah"
    d = 0.55; t = tt(d); f = nf(s) * 2 ** (-2 * (t / d) ** 1.5 / 12 * 3)
    x = osc_saw(f, d); y = sweep_filter(x, 1800, 350, 'low') * adsr(d, 0.02, 0.15)
    put(bus, y, t0, pan=0.1, gain=gain, verb=0.3)

def tape_stop(bus, t0, gain=0.35, notes=('D3', 'F3', 'A3', 'D4')):
    d = 0.55; t = tt(d); k = np.exp(-t * 5.5)
    y = sum(osc_saw(nf(s) * k, d) for s in notes) / len(notes)
    y = sweep_filter(y, 3000, 120, 'low') * (1 - t / d) ** 1.2
    put(bus, y, t0, gain=gain, verb=0.1)

def thud(bus, t0, gain=0.5):
    d = 0.4; t = tt(d); y = np.sin(2 * np.pi * 85 * t) * np.exp(-t / 0.09) + 0.6 * bp(noise(d), 500, 1600) * np.exp(-t / 0.02)
    put(bus, y, t0, gain=gain, verb=0.25)

def clank(bus, t0, gain=0.35, base=380):
    d = 2.2; t = tt(d); y = np.zeros_like(t)
    for m, dc in zip([1, 2.76, 5.40, 8.93, 13.34], [1.4, 0.9, 0.5, 0.3, 0.2]):
        y += np.sin(2 * np.pi * base * m * t + rs.rand()) * np.exp(-t / dc) / m ** 0.6
    y += hp(noise(d), 3000) * np.exp(-t / 0.01) * 0.5
    put(bus, y, t0, pan=-0.3, gain=gain, verb=0.5)

def chime(bus, t0, gain=0.14, notes=('E6', 'B6'), pan=0.2):
    for i, s in enumerate(notes): bell(bus, t0 + i * 0.08, s, gain=gain, pan=pan, verb=0.35, d=1.0)

def buzz(bus, t0, gain=0.25):
    for k in range(3):
        d = 0.13; t = tt(d); y = np.tanh(5 * np.sin(2 * np.pi * 150 * t)) * adsr(d, 0.005, 0.02)
        put(bus, lp(y, 900), t0 + k * 0.2, pan=0.15, gain=gain)

def tap(bus, t0, gain=0.25):
    d = 0.03; put(bus, hp(noise(d), 2500) * env_exp(d, 0.004), t0, gain=gain)

def sparkle(bus, t0, d=0.8, gain=0.12, base='D6', scale=(0, 2, 4, 7, 9, 12, 14, 16)):
    n = 9
    for i in range(n):
        s = nf(base) * 2 ** (scale[i % len(scale)] / 12)
        bell(bus, t0 + i * d / n, s, gain=gain * (1 - i / (n + 2)), pan=-0.6 + 1.2 * i / n, verb=0.7, d=1.2)

def heartbeat(bus, t0, gain=0.45):
    for k, a in ((0, 1.0), (0.18, 0.7)):
        d = 0.35; t = tt(d); y = np.sin(2 * np.pi * (50 + 30 * np.exp(-t / 0.03)) * t) * np.exp(-t / 0.09)
        put(bus, y, t0 + k, gain=gain * a)

def rain(bus, t0, t1, gain=0.06):
    d = t1 - t0; y = bp(noise(d), 1500, 9000) * adsr(d, 0.8, 1.0)
    y += np.convolve((rs.rand(int(d * SR)) > 0.9995).astype(float) * rs.randn(int(d * SR)), np.exp(-np.arange(200) / 30), 'same') * 0.5
    put(bus, np.vstack([y, np.roll(y, 911)]), t0, gain=gain)

def impact(t0, big=1.0, pitch=1.0):
    boom(SFX, t0, gain=0.75 * big); taiko(SFX, t0, gain=0.55 * big, pitch=pitch, verb=0.6)
    crash(SFX, t0, gain=0.12 * big)

def ostinato(bus, t0, t1, root='D2', bpm=120, gain=0.16, pattern=(0, 0, 12, 0, 0, 12, 0, 7), cutoff=1400):
    s16 = 60 / bpm / 4; t = t0; i = 0; rf = nf(root)
    while t < t1 - 1e-6:
        f = rf * 2 ** (pattern[i % len(pattern)] / 12); d = s16 * 0.9
        y = (osc_saw(f, d + 0.05) + osc_saw(f * 1.004, d + 0.05)) * adsr(d + 0.05, 0.004, 0.05)
        put(bus, lp(y, cutoff), t, pan=(-0.25 if i % 2 else 0.25), gain=gain * (1.25 if i % 4 == 0 else 1.0), verb=0.2)
        t += s16; i += 1

def arp(bus, t0, t1, notes, bpm=120, div=2, gain=0.16, inst='harp', pan_w=0.5):
    step = 60 / bpm / div; t = t0; i = 0
    while t < t1 - 1e-6:
        s = notes[i % len(notes)]
        if inst == 'harp': harp(bus, t, s, gain=gain, pan=pan_w * (-1 if i % 2 else 1))
        elif inst == 'pizz': pizz(bus, t, s, gain=gain, pan=pan_w * (-1 if i % 2 else 1))
        elif inst == 'oud': oud(bus, t, s, d=0.6, gain=gain)
        t += step; i += 1

# ================================================================== SCORE
# --- S1 HOOK (0–4.65)
pad(MUS, 0.0, 4.4, ['D1', 'D2', 'A2'], gain=0.30, a=1.5, r=0.4, cutoff=380, verb=0.4)
for s, tq in (('A5', 0.15), ('D6', 0.45), ('E6', 0.8), ('A6', 1.2)): bell(MUS, tq, s, gain=0.06, verb=0.9)
heartbeat(SFX, 0.55, 0.35); heartbeat(SFX, 1.55, 0.4)
whoosh(SFX, 0.55, 0.9, gain=0.22, f0=200, f1=2500)
whoosh(SFX, 2.05, 0.35, gain=0.3, f0=600, f1=6000); thud(SFX, 2.36, 0.4); boom(SFX, 2.36, gain=0.35, d=1.6)
pad(MUS, 2.36, 4.1, ['D2', 'A2', 'Eb3'], gain=0.16, a=0.3, r=0.3, cutoff=900, verb=0.5)
riser(SFX, 2.6, 4.6, gain=0.22, f0=200, f1=5000)
rev_swell(MUS, 4.62, 1.2, 0.18, 'D3')
# --- S2 IMPACT (4.65–7.95)
impact(4.65, 1.15); shatter(SFX, 4.65, 0.45)
brass(MUS, 4.65, 1.1, ['D2', 'A2', 'D3', 'F3'], gain=0.30)
ostinato(MUS, 4.70, 7.40, 'D2', gain=0.15)
pad(MUS, 4.65, 7.3, ['D3', 'F3', 'A3'], gain=0.12, a=0.4, r=0.5, cutoff=1300)
whoosh(SFX, 5.22, 0.6, gain=0.35, f0=250, f1=6000, pan0=0, pan1=0)
brass(MUS, 5.84, 0.3, ['Bb2', 'D3', 'F3'], gain=0.24)
thud(SFX, 6.18, 0.7); taiko(SFX, 6.18, 0.5); brass(MUS, 6.18, 1.0, ['A2', 'C#3', 'E3', 'A3'], gain=0.30)
riser(SFX, 7.0, 7.9, gain=0.12, f0=400, f1=3000)
# --- listen (7.95–9.22)
pad(MUS, 7.95, 9.2, ['D3', 'A3', 'E4'], gain=0.10, a=0.3, r=0.6, cutoff=1200, verb=0.8)
for tq in (8.0, 8.45, 8.9): bell(SFX, tq, 'A5', gain=0.06, verb=0.9)
# --- S3 EVERYONE (9.22–14.0) — playful hijaz groove
maqsum(MUS, 9.25, 11.95, gain=0.22)
arp(MUS, 9.25, 11.95, ['D2', 'D2', 'A2', 'D2'], bpm=120, div=2, gain=0.22, inst='pizz', pan_w=0.1)
for i, s in enumerate(['D4', 'Eb4', 'F#4', 'G4', 'A4', 'G4', 'F#4', 'Eb4', 'D4', 'Eb4', 'F#4', 'A4', 'G4', 'F#4', 'Eb4', 'D4']):
    oud(MUS, 9.30 + i * 0.165, s, gain=0.20, vel=0.8 + 0.2 * (i % 4 == 0))
whoosh(SFX, 10.0, 0.45, gain=0.38, pan0=-0.9, pan1=0.9)       # ימין → right
whoosh(SFX, 10.75, 0.45, gain=0.38, pan0=0.9, pan1=-0.9)      # שמאל → left
whoosh(SFX, 11.30, 0.4, gain=0.25, pan0=-0.8, pan1=-0.1); whoosh(SFX, 11.30, 0.4, gain=0.25, pan0=0.8, pan1=0.1)
chime(SFX, 11.42, 0.12, ('D6', 'A6'), 0)
for i in range(7): pop(SFX, 11.96 + i * 0.09, gain=0.22, pan=(-0.6 + 0.2 * i), f0=380 + i * 60, f1=1100 + i * 90)
boing(SFX, 12.25, 0.15, -0.4); boing(SFX, 12.6, 0.14, 0.5)
maqsum(MUS, 11.95, 12.95, gain=0.18)
stinger_wah(MUS, 12.42, 0.18, 'A3')
whoosh(SFX, 12.9, 0.55, gain=0.35, f0=300, f1=5000, pan0=-1, pan1=1)
for k in range(6): pop(SFX, 13.0 + k * 0.06, gain=0.08, f0=900, f1=1800)
crash(SFX, 13.42, 0.08, d=1.2); pop(SFX, 13.42, 0.25, 0, 200, 900)
riser(SFX, 13.5, 14.06, gain=0.16, f0=800, f1=8000, tone=False)
# --- S4 COMMAND (14.0–17.85)
impact(14.09, 1.2); brass(MUS, 14.09, 0.45, ['D2', 'A2', 'D3', 'F3'], gain=0.32)
impact(14.58, 1.2, 1.08); brass(MUS, 14.58, 0.8, ['Bb1', 'F2', 'Bb2', 'D3'], gain=0.32); sparkle(SFX, 14.62, 0.5, 0.10)
whoosh(SFX, 14.70, 0.7, gain=0.25, f0=1500, f1=9000, pan0=-1, pan1=1)
impact(15.42, 1.2, 1.15); brass(MUS, 15.42, 0.6, ['G1', 'D2', 'G2', 'Bb2'], gain=0.30)
riser(SFX, 15.55, 16.10, gain=0.32, f0=400, f1=9000); whoosh(SFX, 15.7, 0.45, gain=0.35, f0=500, f1=8000, pan0=0, pan1=0)
impact(16.12, 1.45, 0.95); brass(MUS, 16.12, 0.82, ['A1', 'E2', 'A2', 'C#3', 'E3'], gain=0.40, bright=3200)
choir(MUS, 16.12, 16.9, ['A3', 'C#4', 'E4'], gain=0.18, a=0.05, r=0.08)
pad(MUS, 16.12, 16.86, ['A2', 'E3', 'A3', 'C#4'], gain=0.18, a=0.02, r=0.08, cutoff=2600)
thud(SFX, 16.54, 0.45); bell(SFX, 16.55, 'A5', gain=0.08)
# 16.94 → 17.85 : dramatic stop (silence; the bed is hard-gated below)
# --- S5 THE DISAPPEARING VOICE (17.85–26.95) — intimate piano
pad(MUS, 17.9, 23.2, ['D2', 'A2', 'F3'], gain=0.10, a=1.5, r=1.2, cutoff=900, verb=0.8)
for tq, s in ((17.95, 'A4'), (18.7, 'F4'), (19.15, 'D4'), (20.1, 'E4'), (20.88, 'F4'), (21.6, 'A4'), (22.1, 'G4'), (22.85, 'E4')):
    piano(MUS, tq, s, d=3.0, vel=0.5, gain=0.26, pan=0.1)
for tq, s in ((17.95, 'D3'), (20.88, 'Bb2')): piano(MUS, tq, s, d=4.0, vel=0.45, gain=0.22)
pad(MUS, 23.18, 25.6, ['Bb1', 'F2', 'D3'], gain=0.11, a=0.8, r=0.9, cutoff=700, verb=0.8)
for tq, s in ((23.2, 'D4'), (24.28, 'C4'), (24.78, 'Bb3')): piano(MUS, tq, s, d=3.0, vel=0.45, gain=0.24)
for i in range(12): bell(SFX, 25.56 + i * 0.07, nf('A6') * 2 ** (-i / 12 * 1.5), gain=0.05 * (1 - i / 13), pan=-0.5 + i / 12, verb=0.9, d=1.2)
whoosh(SFX, 25.4, 1.2, gain=0.12, f0=6000, f1=800, pan0=0.3, pan1=-0.3)
pad(MUS, 25.6, 26.9, ['D1', 'A1'], gain=0.12, a=0.4, r=0.6, cutoff=250)
# --- S6 WEIGHT (26.95–31.85)
for i in range(7): bell(SFX, 27.27 + i * 0.14, 'D5', gain=0.035, verb=0.3, d=0.4, pan=-0.6 + i * 0.18)
pad(MUS, 27.0, 30.0, ['G2', 'D3', 'Bb3'], gain=0.14, a=1.6, r=0.3, cutoff=1500, verb=0.6)
ostinato(MUS, 28.86, 30.0, 'G2', gain=0.09, pattern=(0, 7, 12, 7), cutoff=1100)
for i in range(3): bell(SFX, 28.86 + i * 0.08, 'A5', gain=0.06, d=0.8); thud(SFX, 29.85 + i * 0.12, 0.2)
riser(SFX, 29.0, 30.0, gain=0.15, f0=300, f1=4000)
clank(SFX, 30.02, 0.4); impact(30.02, 0.85); brass(MUS, 30.02, 1.4, ['D2', 'A2', 'D3', 'F3', 'A3'], gain=0.28)
pad(MUS, 30.05, 31.6, ['D3', 'F3', 'A3'], gain=0.10, a=0.1, r=0.8, cutoff=1200)
# --- S7 MORNING AFTER (31.85–40.1)
for i, s in enumerate(['F#5', 'A5', 'D6', 'E6', 'F#6']): bell(MUS, 31.95 + i * 0.22, s, gain=0.07, verb=0.8)
pad(MUS, 31.9, 35.7, ['D3', 'F#3', 'A3', 'E4'], gain=0.12, a=1.0, r=0.6, cutoff=2200, verb=0.7)
maqsum(MUS, 33.39, 35.7, gain=0.15)
arp(MUS, 33.39, 35.7, ['D3', 'A2', 'D3', 'F#3'], bpm=120, div=2, gain=0.18, inst='pizz')
for i, s in enumerate(['A4', 'B4', 'C5', 'B4', 'A4', 'F#4', 'G4', 'A4', 'F#4', 'E4', 'D4']):
    oud(MUS, 33.45 + i * 0.2, s, gain=0.17)
whoosh(SFX, 33.30, 0.25, gain=0.15); whoosh(SFX, 34.55, 0.25, gain=0.15, pan0=0.6, pan1=-0.6)
pizz(MUS, 35.78, 'D2', gain=0.35); pizz(MUS, 36.22, 'Eb2', gain=0.35); pizz(MUS, 36.84, 'D2', gain=0.3)
pad(MUS, 35.78, 37.75, ['D2', 'Eb3', 'A3'], gain=0.08, a=0.2, r=0.3, cutoff=900)
maqsum(MUS, 37.79, 40.1, gain=0.22)
arp(MUS, 37.79, 40.1, ['D2', 'A2', 'Bb2', 'A2'], bpm=120, div=2, gain=0.22, inst='pizz')
stinger_wah(MUS, 37.92, 0.2, 'D3'); stinger_wah(MUS, 38.2, 0.2, 'C3'); stinger_wah(MUS, 38.48, 0.22, 'Bb2')
pop(SFX, 37.92, 0.22); pop(SFX, 38.08, 0.22, -0.3); pop(SFX, 38.42, 0.25, 0.3)
for i in range(3): whoosh(SFX, 37.72 + i * 0.14, 0.25, gain=0.12, pan0=(1 if i % 2 else -1), pan1=0)
# --- S8 WHAT IF (40.1–47.65)
tape_stop(SFX, 40.16, 0.42); pad(SFX, 40.2, 40.75, ['D2'], gain=0.05, a=0.01, r=0.2, cutoff=300)
whoosh(SFX, 40.75, 0.5, gain=0.25, f0=3000, f1=400, pan0=0, pan1=0)
pad(MUS, 41.3, 44.0, ['D2', 'A2', 'E3'], gain=0.09, a=1.2, r=0.8, cutoff=900, verb=0.8)
pad(MUS, 43.0, 46.5, ['Bb2', 'F3', 'D4'], gain=0.12, a=1.6, r=0.6, cutoff=1800, verb=0.8)
pad(MUS, 44.13, 47.4, ['F2', 'C3', 'A3', 'F4'], gain=0.15, a=1.4, r=0.5, cutoff=2400, verb=0.8)
arp(MUS, 44.13, 46.9, ['F4', 'A4', 'C5', 'F5'], bpm=120, div=4, gain=0.07)
riser(SFX, 46.0, 47.65, gain=0.2, f0=400, f1=9000); crash(SFX, 47.65, 0.12, rev=True, d=1.6)
# --- S9 ALTERNATE REALITY (47.65–54.15) — hope, D major
pad(MUS, 47.65, 49.12, ['D3', 'A3', 'F#4'], gain=0.15, a=0.3, r=0.6, cutoff=2400)
pad(MUS, 49.12, 50.78, ['B2', 'F#3', 'D4'], gain=0.15, a=0.3, r=0.6, cutoff=2400)
pad(MUS, 50.78, 52.08, ['G2', 'D3', 'B3'], gain=0.16, a=0.3, r=0.6, cutoff=2600)
pad(MUS, 52.08, 54.1, ['A2', 'E3', 'C#4', 'E4'], gain=0.17, a=0.3, r=0.4, cutoff=2800)
violin(MUS, 48.1, [(0.0, 0.9, 'F#5'), (1.1, 0.9, 'E5'), (2.1, 0.9, 'D5'), (3.0, 1.5, 'A5'), (4.7, 1.2, 'G5')], gain=0.09)
for tq in (49.12, 49.9, 51.1, 51.42, 51.75, 52.08, 52.4, 52.7):
    whoosh(SFX, tq - 0.1, 0.35, gain=0.12, f0=800, f1=7000, pan0=-0.5, pan1=0.5); bell(SFX, tq, 'A6', gain=0.04, d=1.0)
sparkle(SFX, 52.7, 1.2, 0.08, 'A5'); riser(SFX, 53.0, 54.22, gain=0.18, f0=300, f1=6000)
# --- S10 BUILD-UP (54.15–63.7)
impact(54.26, 0.8); pad(MUS, 54.26, 55.7, ['D2', 'A2', 'D3', 'F3'], gain=0.15, a=0.05, r=0.3, cutoff=1800)
ostinato(MUS, 54.26, 55.7, 'D2', gain=0.12); whoosh(SFX, 54.3, 1.2, gain=0.2, f0=400, f1=3000, pan0=0, pan1=0)
impact(55.71, 0.9); pad(MUS, 55.71, 57.8, ['Bb1', 'F2', 'D3', 'F3'], gain=0.16, a=0.05, r=0.3, cutoff=2000)
ostinato(MUS, 55.71, 57.8, 'Bb1', gain=0.13); maqsum(MUS, 55.71, 63.6, gain=0.2)
for tq in (55.6, 56.12, 56.65, 57.2): whoosh(SFX, tq - 0.08, 0.22, gain=0.18, pan0=-0.8, pan1=0.8)
impact(57.81, 1.0); brass(MUS, 57.81, 1.6, ['F2', 'C3', 'F3', 'A3'], gain=0.26)
ostinato(MUS, 57.81, 59.7, 'F2', gain=0.14); pad(MUS, 57.81, 59.7, ['F2', 'C3', 'A3'], gain=0.15, a=0.05, r=0.3, cutoff=2200)
brass(MUS, 59.70, 1.6, ['C2', 'G2', 'C3', 'E3', 'G3'], gain=0.28); impact(59.70, 0.9)
ostinato(MUS, 59.7, 61.42, 'C2', gain=0.15); choir(MUS, 59.7, 61.4, ['C4', 'E4', 'G4'], gain=0.12)
for i in range(16): taiko(SFX, 59.7 + i * 0.25, gain=0.18 + 0.01 * i, pitch=1.1 if i % 2 else 1.0, verb=0.3)
brass(MUS, 61.42, 1.0, ['G1', 'D2', 'G2', 'Bb2', 'D3'], gain=0.28); ostinato(MUS, 61.42, 62.4, 'G1', gain=0.16)
brass(MUS, 62.40, 1.2, ['A1', 'E2', 'A2', 'C#3', 'E3'], gain=0.30); ostinato(MUS, 62.4, 63.6, 'A1', gain=0.17)
choir(MUS, 61.42, 63.6, ['D4', 'G4', 'Bb4'], gain=0.14)
snare_roll(SFX, 61.6, 63.65, gain=0.22); riser(SFX, 61.9, 63.7, gain=0.32, f0=250, f1=9000); crash(SFX, 63.77, 0.2, rev=True, d=2.0)
# --- S11 CLIMAX (63.7–67.55)
impact(63.77, 1.5, 0.9); brass(MUS, 63.77, 1.0, ['D2', 'A2', 'D3', 'F3', 'A3', 'D4'], gain=0.40, bright=3400)
choir(MUS, 63.77, 65.35, ['D4', 'F4', 'A4', 'D5'], gain=0.18, a=0.1)
pad(MUS, 63.77, 65.35, ['D2', 'A2', 'D3', 'F3', 'A3'], gain=0.20, a=0.05, r=0.3, cutoff=3000)
for i in range(6): taiko(SFX, 63.77 + 0.25 * i, 0.3, pitch=0.95 + 0.04 * (i % 3))
brass(MUS, 64.80, 0.55, ['Bb1', 'F2', 'Bb2', 'D3', 'F3'], gain=0.34)
whoosh(SFX, 64.6, 0.65, gain=0.4, f0=300, f1=8000, pan0=0, pan1=0)
impact(65.40, 1.4, 0.95); brass(MUS, 65.40, 2.1, ['F2', 'C3', 'F3', 'A3', 'C4'], gain=0.40, bright=3400)
choir(MUS, 65.40, 67.3, ['F4', 'A4', 'C5'], gain=0.18, a=0.08, r=1.6)
pad(MUS, 65.40, 67.2, ['F2', 'C3', 'F3', 'A3', 'C4'], gain=0.20, a=0.05, r=1.2, cutoff=3200)
brass(MUS, 65.86, 1.3, ['C2', 'G2', 'C3', 'E3', 'G3'], gain=0.30)
sparkle(SFX, 66.0, 0.7, 0.07, 'C6')
# --- S12 HUMAN MOMENT (67.55–74.1) — piano + strings
melody12 = [(67.67, 'A4'), (68.22, 'C5'), (68.95, 'D5'), (69.54, 'C5'), (69.9, 'A4'), (70.78, 'G4'), (71.12, 'A4'), (71.6, 'F4')]
for tq, s in melody12: piano(MUS, tq, s, d=3.0, vel=0.55, gain=0.28, pan=0.12)
for tq, s in ((67.67, 'F2'), (67.67, 'C3'), (68.95, 'D2'), (68.95, 'A2'), (70.2, 'Bb1'), (70.2, 'F2'), (71.4, 'C2'), (71.4, 'G2')): piano(MUS, tq, s, d=3.4, vel=0.45, gain=0.22)
pad(MUS, 67.7, 72.2, ['F2', 'C3', 'A3'], gain=0.08, a=1.5, r=0.4, cutoff=1300, verb=0.8)
crash(SFX, 72.19, 0.08, rev=True, d=1.4)
impact(72.19, 0.55); pad(MUS, 72.19, 74.0, ['Bb2', 'F3', 'D4', 'F4'], gain=0.18, a=0.08, r=0.6, cutoff=3000)
brass(MUS, 72.19, 0.7, ['Bb2', 'D3', 'F3'], gain=0.18, bright=1800, sub=False)
taiko(SFX, 72.92, 0.35); pad(MUS, 72.92, 74.1, ['F2', 'C3', 'A3', 'C4'], gain=0.18, a=0.1, r=0.6, cutoff=3000)
brass(MUS, 72.92, 1.2, ['F2', 'C3', 'F3', 'A3'], gain=0.22, bright=2200)
violin(MUS, 72.25, [(0, 0.65, 'D5'), (0.67, 1.3, 'C5')], gain=0.10)
# --- S13 REPRESENTATION (74.1–82.55) — pulsing hope
prog13 = [(74.1, ['F2', 'C3', 'A3'], ['F4', 'A4', 'C5', 'A4']), (76.24, ['C2', 'G2', 'E3'], ['E4', 'G4', 'C5', 'G4']), (78.06, ['D2', 'A2', 'F3'], ['D4', 'F4', 'A4', 'F4']), (79.78, ['Bb1', 'F2', 'D3'], ['D4', 'F4', 'Bb4', 'F4'])]
for i, (t0, pc, ar) in enumerate(prog13):
    t1 = prog13[i + 1][0] if i + 1 < len(prog13) else 81.4
    pad(MUS, t0, t1, pc, gain=0.13 + i * 0.01, a=0.4, r=0.5, cutoff=1800 + 300 * i)
    arp(MUS, t0, t1, ar, bpm=120, div=4, gain=0.09)
    kick(MUS, t0, 0.25)
for i in range(int((81.3 - 75.0) / 0.5)): kick(MUS, 75.0 + i * 0.5, 0.12 + 0.01 * i)
choir(MUS, 79.78, 81.3, ['D4', 'F4', 'Bb4'], gain=0.10)
riser(SFX, 80.3, 81.3, gain=0.12, f0=600, f1=6000); crash(SFX, 81.34, 0.1, d=2.5); pad(MUS, 81.34, 82.5, ['F2', 'C3', 'A3', 'F4'], gain=0.15, a=0.05, r=0.8, cutoff=3000)
sparkle(SFX, 81.3, 0.9, 0.06, 'F6')
# --- S14 SHARE (82.55–97.75)
pad(MUS, 82.6, 86.3, ['F3', 'A3', 'C4', 'E4'], gain=0.09, a=1.0, r=0.4, cutoff=2000, verb=0.7)
for tq, s in ((82.7, 'C5'), (83.4, 'A4'), (84.2, 'F4'), (85.2, 'G4')): piano(MUS, tq, s, d=2.0, vel=0.45, gain=0.2)
whoosh(SFX, 82.65, 0.8, gain=0.18, f0=200, f1=2500, pan0=0, pan1=0)
tap(SFX, 86.55, 0.3); whoosh(SFX, 86.62, 0.3, gain=0.15, f0=800, f1=4000, pan0=0, pan1=0)
maqsum(MUS, 86.4, 91.5, gain=0.17)
arp(MUS, 86.4, 91.5, ['F3', 'C4', 'A3', 'C4'], bpm=120, div=2, gain=0.13)
pad(MUS, 86.4, 88.26, ['F2', 'C3', 'A3'], gain=0.12, a=0.1, r=0.3, cutoff=2200); pad(MUS, 88.26, 90.13, ['D2', 'A2', 'F3'], gain=0.12, a=0.1, r=0.3, cutoff=2200)
pad(MUS, 90.13, 91.55, ['Bb1', 'F2', 'D3'], gain=0.12, a=0.1, r=0.3, cutoff=2200)
for i in range(3):
    whoosh(SFX, 88.27 + i * 0.3, 0.35, gain=0.2, f0=500, f1=6000, pan0=-0.6, pan1=0.6); chime(SFX, 88.62 + i * 0.3, 0.11)
sparkle(SFX, 89.2, 0.9, 0.06, 'C6')
for tq in (90.55, 90.85, 91.15): chime(SFX, tq, 0.09, ('G6', 'C7'), -0.1)
riser(SFX, 91.2, 91.55, gain=0.05, f0=2000, f1=400, tone=False)
# 91.53: drop
rain(SFX, 92.3, 97.0, 0.08)
pad(MUS, 92.4, 95.3, ['D2', 'A2', 'F3'], gain=0.07, a=1.0, r=0.4, cutoff=700, verb=0.8)
for tq, s in ((92.5, 'A4'), (93.4, 'F4'), (94.3, 'E4'), (94.9, 'D4')): piano(MUS, tq, s, d=2.6, vel=0.4, gain=0.22)
buzz(SFX, 94.56, 0.22); chime(SFX, 95.1, 0.08)
pad(MUS, 95.34, 97.7, ['D3', 'F#3', 'A3', 'D4'], gain=0.15, a=1.0, r=0.4, cutoff=2600, verb=0.7)
for tq, s in ((95.4, 'F#4'), (95.9, 'A4'), (96.4, 'D5')): piano(MUS, tq, s, d=2.5, vel=0.55, gain=0.24)
sparkle(SFX, 96.3, 0.8, 0.07, 'D6'); riser(SFX, 96.9, 97.7, gain=0.2, f0=500, f1=8000)
# --- S15 FINALE
pad(MUS, 97.84, 102.8, ['D2', 'A2', 'F#3', 'A3'], gain=0.13, a=2.2, r=0.5, cutoff=1600, verb=0.8)
for i, s in enumerate(['A4', 'B4', 'C#5', 'D5', 'E5', 'D5', 'B4', 'A4']): oud(MUS, 98.95 + i * 0.32, s, gain=0.12, vel=0.9)
violin(MUS, 99.7, [(0.0, 0.9, 'F#5'), (0.9, 0.9, 'G5'), (1.8, 1.4, 'A5')], gain=0.10)
riser(SFX, 102.3, 104.08, gain=0.32, f0=200, f1=10000); crash(SFX, 104.08, 0.18, rev=True, d=2.2); snare_roll(SFX, 103.1, 104.0, gain=0.16)
impact(104.08, 1.5, 0.9); brass(MUS, 104.08, 1.2, ['D2', 'A2', 'D3', 'F#3', 'A3'], gain=0.38, bright=3400)
choir(MUS, 104.08, 107.4, ['D4', 'F#4', 'A4'], gain=0.16, a=0.1)
pad(MUS, 104.08, 105.34, ['D2', 'A2', 'D3', 'F#3'], gain=0.18, a=0.05, r=0.2, cutoff=3000)
pad(MUS, 105.34, 106.7, ['Bb1', 'F2', 'Bb2', 'D3'], gain=0.18, a=0.05, r=0.2, cutoff=3000); brass(MUS, 105.34, 0.5, ['Bb1', 'F2', 'Bb2', 'D3'], gain=0.32)
brass(MUS, 105.82, 0.85, ['C2', 'G2', 'C3', 'E3'], gain=0.33)
ostinato(MUS, 104.08, 106.7, 'D2', gain=0.14)
for i in range(11): taiko(SFX, 104.08 + i * 0.25, 0.22 + 0.01 * i, pitch=1.0 + 0.06 * (i % 2))
for tq in (104.6, 105.1, 105.34, 105.82, 106.3): whoosh(SFX, tq - 0.1, 0.25, gain=0.25, f0=600, f1=7000, pan0=-0.8, pan1=0.8); taiko(SFX, tq, 0.3)
impact(106.70, 1.6, 0.9); crash(SFX, 106.70, 0.25, d=4.0)
brass(MUS, 106.70, 1.8, ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'], gain=0.40, bright=3600)
pad(MUS, 106.70, 108.9, ['D2', 'A2', 'D3', 'F#3', 'A3'], gain=0.18, a=0.05, r=0.5, cutoff=3000); choir(MUS, 106.7, 108.9, ['D4', 'F#4', 'A4', 'D5'], gain=0.16, a=0.05)
sparkle(SFX, 106.75, 1.2, 0.08, 'D6')
snare_roll(SFX, 107.8, 108.85, gain=0.2); riser(SFX, 107.9, 108.88, gain=0.25, f0=300, f1=9000)
# yalla → final groove
impact(108.88, 1.2); crash(SFX, 108.88, 0.18)
maqsum(MUS, 108.88, 112.8, gain=0.26)
for i in range(16): taiko(SFX, 108.88 + i * 0.25, 0.2, pitch=1.0 + 0.05 * (i % 2))
pad(MUS, 108.88, 110.7, ['G2', 'D3', 'B3', 'D4'], gain=0.16, a=0.05, r=0.3, cutoff=3000)
pad(MUS, 110.7, 111.54, ['Bb2', 'F3', 'D4'], gain=0.17, a=0.05, r=0.2, cutoff=3000); brass(MUS, 110.70, 0.8, ['Bb1', 'F2', 'Bb2', 'D3'], gain=0.34)
pad(MUS, 111.54, 112.12, ['C3', 'G3', 'E4'], gain=0.18, a=0.05, r=0.2, cutoff=3000); brass(MUS, 111.54, 0.55, ['C2', 'G2', 'C3', 'E3'], gain=0.34)
brass(MUS, 112.12, 0.66, ['D2', 'A2', 'D3', 'F#3', 'A3'], gain=0.36); taiko(SFX, 112.12, 0.5)
for i, s in enumerate(['A4', 'D5', 'E5', 'F#5', 'A5', 'F#5', 'E5', 'D5']): oud(MUS, 109.0 + i * 0.25, s, gain=0.14)
violin(MUS, 109.7, [(0, 1.0, 'A5'), (1.0, 0.84, 'B5'), (1.84, 0.58, 'C6'), (2.42, 1.0, 'D6')], gain=0.10)
# final hit + quick decay, then ~1s of silence
impact(112.82, 1.7, 0.85); crash(SFX, 112.82, 0.3, d=3.0)
brass(MUS, 112.82, 1.3, ['D1', 'D2', 'A2', 'D3', 'F#3', 'A3', 'D4'], gain=0.42, bright=3600)
choir(MUS, 112.82, 114.0, ['D4', 'F#4', 'A4', 'D5'], gain=0.18, a=0.02, r=0.9)
pad(MUS, 112.82, 114.0, ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'], gain=0.20, a=0.02, r=0.9, cutoff=3200)
sparkle(SFX, 112.9, 1.0, 0.08, 'D6')

# ================================================================== reverb, gating, ducking, limiting
def make_ir(d=3.2, pre=0.02):
    n = int(d * SR); t = np.arange(n) / SR
    irs = []
    for ch in range(2):
        x = rs.randn(n)
        bright = x * np.exp(-t / 0.35); dark = lp(x, 2500) * np.exp(-t / 1.1)
        ir = 0.6 * bright + dark; ir[:int(pre * SR)] = 0
        irs.append(ir / np.sqrt(np.sum(ir ** 2)))
    return irs
irs = make_ir()
wet = np.vstack([signal.fftconvolve(VERB[c], irs[c])[:N] for c in range(2)])
bed_mus = MUS + 0.55 * wet * 0.6
bed_sfx = SFX + 0.45 * wet * 0.4
bed = 0.95 * bed_mus + bed_sfx
bed = hp(bed, 28, 2)

# gain automation: hard stops / drops
t_axis = np.arange(N) / SR
def gate(t0, t1, ramp_in=0.04, ramp_out=0.06, floor=0.0):
    g = np.ones(N)
    a = int(t0 * SR); b = int(t1 * SR); ra = int(ramp_in * SR); rb = int(ramp_out * SR)
    g[a:a + ra] = np.linspace(1, floor, ra); g[a + ra:b] = floor; g[b:b + rb] = np.linspace(floor, 1, rb)
    return g
G = gate(16.94, 17.86, 0.05, 0.05) * gate(91.55, 92.35, 0.5, 0.3, floor=0.15)
G *= np.clip((115.2 - t_axis) / 0.5, 0, 1)     # quick fade, then silence to the end
bed *= G

# narration-driven, level-aware 3-band ducking (bed only; the voice is never processed)
sr0, v = wavfile.read(master_path); v = v.astype(np.float64) / 32768.0
if v.ndim > 1: v = v.mean(axis=1)
if sr0 != SR: v = signal.resample_poly(v, SR, sr0)
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]

# section gain automation (seconds, gain)
pts = [(0, 1.0), (97.6, 1.0), (97.9, 0.55), (106.6, 0.55), (106.7, 0.8), (107.5, 0.95), (108.8, 0.95), (108.9, 0.85), (113.2, 0.85), (113.5, 1.0)]
bed *= np.interp(t_axis, [p[0] for p in pts], [p[1] for p in pts])[None, :] * 0.72

def lr4_lp(x, f): return lp(lp(x, f, 2), f, 2)
def lr4_hp(x, f): return hp(hp(x, f, 2), f, 2)
low = np.vstack([lr4_lp(bed[c], 250) for c in range(2)])
high = np.vstack([lr4_hp(bed[c], 5000) for c in range(2)])
mid = bed - low - high

def env_db(x, win=0.05):
    w = int(win * SR); e = np.sqrt(np.convolve(x ** 2, np.ones(w) / w, mode='same') + 1e-12)
    return 20 * np.log10(e)
def follow(gdb, att=0.02, rel=0.35):
    """smooth a gain curve (dB): fast to duck, slow to recover"""
    ga, gr = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    # decimate for speed, follow, interpolate back
    hop = 48; g = gdb[::hop]; out = np.empty_like(g); y = 0.0
    ga, gr = np.exp(-hop / (att * SR)), np.exp(-hop / (rel * SR))
    for i, x in enumerate(g):
        y = ga * y + (1 - ga) * x if x < y else gr * y + (1 - gr) * x
        out[i] = y
    return np.interp(np.arange(len(gdb)), np.arange(len(g)) * hop, out)
vdb = env_db(voice, 0.08)
# hold voice level through short gaps between words (300 ms)
from scipy.ndimage import maximum_filter1d
vdb_h = maximum_filter1d(vdb[::48], size=int(0.3 * SR / 48)); vdb_h = np.interp(np.arange(N), np.arange(len(vdb_h)) * 48, vdb_h)
active = vdb_h > -46
for band, margin, floor in ((mid, 14.0, -30.0), (low, 4.0, -18.0), (high, 9.0, -24.0)):
    bdb = env_db(band.mean(axis=0) * 1.41, 0.08)
    over = (bdb - (vdb_h - margin))                 # dB above allowed level
    gdb = np.where(active, -np.clip(over, 0, -floor), 0.0)
    gdb = np.minimum(gdb, np.where(active, -4.0, 0.0))   # always leave a little room for the voice
    g = 10 ** (follow(gdb) / 20)
    band *= g[None, :]
bed = low + mid + high

# headroom limiter on the bed only: |voice| + |bed| must stay below the ceiling
CEIL = 0.97
peak_b = np.max(np.abs(bed), axis=0)
need = np.minimum(1.0, (CEIL - np.abs(voice)).clip(1e-4) / np.maximum(peak_b, 1e-9))
from scipy.ndimage import minimum_filter1d, uniform_filter1d
win = int(0.010 * SR)
g = uniform_filter1d(minimum_filter1d(need, size=2 * win + 1), size=win)  # lookahead min, then smooth (stays <= need)
g = np.minimum(g, need)
bed *= g

os.makedirs(outdir, exist_ok=True)
mix = bed + voice[None, :]
print('bed peak', np.max(np.abs(bed)), 'mix peak', np.max(np.abs(mix)), 'limiter min gain', g.min())
assert np.max(np.abs(mix)) <= 1.0
def save(path, x): wavfile.write(path, SR, np.clip(np.round(x.T * 32768), -32768, 32767).astype(np.int16))
save(os.path.join(outdir, 'bed.wav'), bed)
save(os.path.join(outdir, 'mix.wav'), mix)
save(os.path.join(outdir, 'voice_only.wav'), np.vstack([voice, voice]))
print('done')
