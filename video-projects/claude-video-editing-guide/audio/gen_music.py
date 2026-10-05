#!/usr/bin/env python3
"""gen_music.py - fully procedural underscore for calm, premium "documentary explainer" videos.

    gen_music.py sections.json out.wav --seed N [--bpm 92] [--lufs -18] [--ceiling -1]
                 [--key A] [--workers 4] [--plan plan.json] [--stems DIR] [--quiet]

sections.json   list of {"name", "start", "end", "energy" (0..1), "lift" (bool)}, times in seconds.
out.wav         48 kHz / stereo / 24-bit PCM, exactly round(last_end * 48000) samples long.

Every sound is synthesised here from oscillators and seeded noise (no samples, no downloads).
Output is bit-for-bit deterministic for a given (sections, seed, options).

Signal flow
  plan  : sections -> beat-snapped section starts -> bars -> 8-bar phrases -> modal chord
          progressions -> voice-led pad chords, sub bass, motif-driven arpeggio, light percussion,
          risers / reverse swells for lift sections, resolving outro; automation curves.
  pass 1: per ~2.7 s block (in worker processes): closed-form pads/bass + sample-bank events
          (Karplus-Strong plucks, felt mallets, FM bells, hats, shakers, soft kick), and the
          reverb / ping-pong-delay sends convolved with synthetic stereo IRs (FFT).
          Main process (stateful, in order): overlap-add of wet tails, pad brightness shelf,
          master EQ, tape saturation, mono-bass M/S tidy, fades, BS.1770 meter -> float32 temp.
  pass 2: loudness normalisation to --lufs, look-ahead true-peak soft limiter, TPDF dither,
          24-bit write.
"""
import argparse
import itertools
import json
import math
import multiprocessing as mp
import os
import shutil
import sys
import tempfile
import time
import zlib
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass, field

import numpy as np
import scipy.fft as sfft
import soundfile as sf
from scipy import signal
from scipy.ndimage import minimum_filter1d, uniform_filter1d

FS = 48000
BLOCK = int(os.environ.get('GENMUSIC_BLOCK', 1 << 17))   # render block (~2.73 s, about a bar at 92 BPM)
DITHER = os.environ.get('GENMUSIC_DITHER', '1') != '0'
TWO_PI = 2.0 * math.pi
TAB = 4096                 # pad wavetable length

# Mix levels in dB (linear gains derived below). Calibrated so that typical material lands a few
# dB under -18 LUFS before normalisation, keeping the tape stage in its gentle range.
LV = dict(pad=-21.0, bass=-22.5, arp=-10.0, bell=-27.0, hat=-21.0, shaker=-29.0, kick=-20.0,
          riser=-27.0, swell=-25.0, rev_return=-1.5, dly_return=-6.5)


# ============================================================================ utilities
def rng_for(seed, *keys):
    """Independent deterministic RNG stream for (seed, keys...) (crc32: stable across processes)."""
    words = [int(seed) & 0xFFFFFFFF] + [zlib.crc32(repr(k).encode('utf-8')) for k in keys]
    return np.random.default_rng(np.random.SeedSequence(words))


def undb(d):
    return 10.0 ** (d / 20.0)


def midi_hz(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


def smoothstep(e0, e1, x):
    u = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return u * u * (3.0 - 2.0 * u)


def pan_gains(p):
    """Constant-power pan, p in [-1, 1]."""
    a = (float(np.clip(p, -1.0, 1.0)) + 1.0) * (math.pi / 4.0)
    return math.cos(a), math.sin(a)


def wchoice(rng, items):
    vals = [v for v, _ in items]
    w = np.array([max(0.0, float(x)) for _, x in items])
    return vals[int(rng.choice(len(vals), p=w / w.sum()))]


def frac(x):
    return x - np.floor(x)


def sin32(cycles):
    """sin(2*pi*cycles) evaluated in float32 after exact float64 range reduction (fast SIMD path)."""
    return np.sin((frac(cycles) * TWO_PI).astype(np.float32))


def cos32(cycles):
    return np.cos((frac(cycles) * TWO_PI).astype(np.float32))


def fade_edges(x, fin, fout):
    """Raised-cosine fade in/out (samples) along the last axis, in place."""
    n = x.shape[-1]
    if fin > 0:
        fin = min(fin, n)
        x[..., :fin] *= np.sin(0.5 * np.pi * np.arange(fin) / fin) ** 2
    if fout > 0:
        fout = min(fout, n)
        x[..., n - fout:] *= np.cos(0.5 * np.pi * (np.arange(fout) + 1) / fout) ** 2
    return x


def rbj_peak(f0, gain_db, q):
    A = 10 ** (gain_db / 40.0)
    w = TWO_PI * f0 / FS
    al = math.sin(w) / (2 * q)
    c = math.cos(w)
    b = [1 + al * A, -2 * c, 1 - al * A]
    a = [1 + al / A, -2 * c, 1 - al / A]
    return np.array([[b[0] / a[0], b[1] / a[0], b[2] / a[0], 1.0, a[1] / a[0], a[2] / a[0]]])


def rbj_shelf(f0, gain_db, kind='high', S=0.8):
    A = 10 ** (gain_db / 40.0)
    w = TWO_PI * f0 / FS
    c, s = math.cos(w), math.sin(w)
    al = s / 2 * math.sqrt((A + 1 / A) * (1 / S - 1) + 2)
    sq = 2 * math.sqrt(A) * al
    if kind == 'high':
        b0 = A * ((A + 1) + (A - 1) * c + sq); b1 = -2 * A * ((A - 1) + (A + 1) * c)
        b2 = A * ((A + 1) + (A - 1) * c - sq); a0 = (A + 1) - (A - 1) * c + sq
        a1 = 2 * ((A - 1) - (A + 1) * c); a2 = (A + 1) - (A - 1) * c - sq
    else:
        b0 = A * ((A + 1) - (A - 1) * c + sq); b1 = 2 * A * ((A - 1) - (A + 1) * c)
        b2 = A * ((A + 1) - (A - 1) * c - sq); a0 = (A + 1) + (A - 1) * c + sq
        a1 = -2 * ((A - 1) + (A + 1) * c); a2 = (A + 1) + (A - 1) * c - sq
    return np.array([[b0 / a0, b1 / a0, b2 / a0, 1.0, a1 / a0, a2 / a0]])


class Curve:
    """Automation: breakpoints (t, v) joined by raised-cosine segments, constant outside."""

    def __init__(self, pts):
        pts = sorted(pts, key=lambda p: p[0]) or [(0.0, 0.0)]
        self.t = np.array([p[0] for p in pts], float)
        self.v = np.array([p[1] for p in pts], float)

    def __call__(self, t):
        scalar = np.isscalar(t)
        t = np.atleast_1d(np.asarray(t, float))
        j = np.searchsorted(self.t, t, side='right')
        i0 = np.clip(j - 1, 0, len(self.t) - 1)
        i1 = np.clip(j, 0, len(self.t) - 1)
        span = self.t[i1] - self.t[i0]
        u = np.clip((t - self.t[i0]) / np.where(span > 0, span, 1.0), 0.0, 1.0)
        out = self.v[i0] + (self.v[i1] - self.v[i0]) * (0.5 - 0.5 * np.cos(np.pi * u))
        return float(out[0]) if scalar else out


# ============================================================================ harmony
PC_NAMES = ('C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B')
NAME_TO_PC = {'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3, 'E': 4, 'F': 5, 'F#': 6, 'GB': 6,
              'G': 7, 'G#': 8, 'AB': 8, 'A': 9, 'A#': 10, 'BB': 10, 'B': 11}
MODE_STEPS = {'ionian': (0, 2, 4, 5, 7, 9, 11), 'dorian': (0, 2, 3, 5, 7, 9, 10),
              'phrygian': (0, 1, 3, 5, 7, 8, 10), 'lydian': (0, 2, 4, 6, 7, 9, 11),
              'mixolydian': (0, 2, 4, 5, 7, 9, 10), 'aeolian': (0, 2, 3, 5, 7, 8, 10)}

# colour: (triad quality, chord intervals, pad-voicing priority (rootless where possible),
#          arpeggio intervals, base weight). Only colours whose notes are diatonic are used.
COLORS = {
    'm':       ('min', (0, 3, 7), (3, 7, 0), (0, 3, 7), 0.2),
    'm7':      ('min', (0, 3, 7, 10), (3, 10, 7, 0), (0, 3, 7, 10), 1.0),
    'madd9':   ('min', (0, 3, 7, 14), (3, 14, 7, 0), (0, 3, 7, 14), 1.0),
    'm9':      ('min', (0, 3, 7, 10, 14), (3, 10, 14, 7, 0), (0, 3, 7, 10, 14), 1.1),
    'm11':     ('min', (0, 3, 7, 10, 14, 17), (3, 10, 17, 14, 7), (0, 3, 7, 10, 17), 0.45),
    'm6':      ('min', (0, 3, 7, 9), (3, 9, 7, 0), (0, 3, 7, 9), 0.4),
    'add9':    ('maj', (0, 4, 7, 14), (4, 14, 7, 0), (0, 4, 7, 14), 1.1),
    'maj7':    ('maj', (0, 4, 7, 11), (4, 11, 7, 0), (0, 4, 7, 11), 1.0),
    'maj9':    ('maj', (0, 4, 7, 11, 14), (4, 11, 14, 7), (0, 4, 7, 11, 14), 0.9),
    '6':       ('maj', (0, 4, 7, 9), (4, 9, 7, 0), (0, 4, 7, 9), 0.5),
    '6/9':     ('maj', (0, 4, 7, 9, 14), (4, 9, 14, 7), (0, 4, 7, 9, 14), 0.7),
    'maj7#11': ('maj', (0, 4, 7, 11, 18), (4, 11, 18, 7), (0, 4, 7, 11), 0.3),
    'sus2':    ('any', (0, 2, 7), (2, 7, 0), (0, 2, 7, 12), 0.4),
    '9sus4':   ('any', (0, 5, 7, 10, 14), (5, 10, 14, 7), (0, 5, 7, 10), 0.35),
}
DISPLAY = {'m': 'm', 'm7': 'm7', 'madd9': 'm(add9)', 'm9': 'm9', 'm11': 'm11', 'm6': 'm6',
           'add9': '(add9)', 'maj7': 'maj7', 'maj9': 'maj9', '6': '6', '6/9': '6/9',
           'maj7#11': 'maj7#11', 'sus2': 'sus2', '9sus4': '9sus4'}


@dataclass(frozen=True)
class Chord:
    root: int
    color: str
    degree: int = 0

    @property
    def pcs(self):
        return frozenset((self.root + i) % 12 for i in COLORS[self.color][1])

    def pad_pcs(self):
        return [(self.root + i) % 12 for i in COLORS[self.color][2]]

    def arp_pcs(self):
        return sorted({(self.root + i) % 12 for i in COLORS[self.color][3]})

    @property
    def name(self):
        return PC_NAMES[self.root] + DISPLAY[self.color]


class Mode:
    def __init__(self, tonic, mode):
        self.tonic = tonic % 12
        self.mode = mode
        self.scale = [(self.tonic + s) % 12 for s in MODE_STEPS[mode]]
        self.coll = frozenset(self.scale)
        self.acc = next(k for k in range(-6, 7)
                        if frozenset(((7 * k) % 12 + s) % 12 for s in MODE_STEPS['ionian']) == self.coll)

    @property
    def name(self):
        return f"{PC_NAMES[self.tonic]} {self.mode}"

    def quality(self, d):
        s = self.scale
        r = s[d % 7]
        if (s[(d + 4) % 7] - r) % 12 != 7:
            return None                                  # diminished: never used
        return 'min' if (s[(d + 2) % 7] - r) % 12 == 3 else 'maj'

    def colors(self, d):
        q = self.quality(d)
        if q is None:
            return []
        r = self.scale[d % 7]
        return [(name, spec[4]) for name, spec in COLORS.items()
                if spec[0] in (q, 'any') and all((r + i) % 12 in self.coll for i in spec[1])]

    def chord(self, d, color):
        return Chord(self.scale[d % 7], color, d % 7)

    def triad_pcs(self, d):
        s = self.scale
        return {s[d % 7], s[(d + 2) % 7], s[(d + 4) % 7]}


CHAR = {'aeolian': {0: 1.2, 5: 1.25, 6: 1.1, 3: 1.0, 2: 0.8, 4: 0.7},
        'dorian': {0: 1.2, 3: 1.3, 1: 0.9, 6: 1.0, 2: 0.8, 4: 0.75}}
STEP_W = {1: 0.8, 2: 0.6, 3: 1.0, 4: 0.7, 5: 0.9, 6: 0.75}   # root motion in scale steps


def trans_w(mode, d1, d2):
    if d1 == d2 or mode.quality(d2) is None:
        return 0.0
    return STEP_W[(d2 - d1) % 7] * CHAR.get(mode.mode, {}).get(d2, 0.6)


def start_weights(mode):
    if mode.mode == 'dorian':
        return [(0, 1.2), (3, 1.2), (6, 0.6), (2, 0.5)]
    return [(0, 1.2), (5, 1.0), (3, 0.8), (2, 0.6)]


def harmonic_rhythm(n, e, rng):
    """Chord durations (in bars) for an n-bar phrase. Calm material changes chord every 2-4 bars."""
    if n >= 8:
        if e < 0.4:
            opts = [([4, 4], 1.0), ([2, 2, 4], 1.0), ([4, 2, 2], 0.8), ([2, 2, 2, 2], 1.2)]
        elif e < 0.65:
            opts = [([2, 2, 2, 2], 2.0), ([2, 2, 2, 1, 1], 0.7), ([2, 1, 1, 2, 2], 0.7),
                    ([4, 2, 2], 0.6), ([2, 2, 4], 0.6), ([1, 1, 2, 2, 2], 0.5)]
        else:
            opts = [([2, 2, 2, 2], 1.5), ([1, 1, 2, 1, 1, 2], 0.8), ([2, 2, 1, 1, 2], 0.6),
                    ([2, 1, 1, 2, 1, 1], 0.6)]
        t = list(wchoice(rng, opts))
        extra = n - 8
        if extra:
            if extra <= 2:
                t[-1] += extra
            else:
                t.append(extra)
        return t
    unit = 4 if (e < 0.35 and n >= 6) else 2
    t, r = [], n
    while r > 0:
        u = min(unit, r)
        t.append(u)
        r -= u
    if e >= 0.6 and len(t) >= 2 and t[0] == 2 and rng.random() < 0.4:
        t = [1, 1] + t[1:]
    return t


def gen_degrees(mode, n, rng, first=None, last_ok=None, avoid_first=None, history=None):
    """Weighted random walk over diatonic degrees with constraints; rejects recent repeats."""
    best = None
    for attempt in range(400):
        if first is not None:
            d = first
        else:
            d = wchoice(rng, start_weights(mode))
            if avoid_first is not None and d == avoid_first and attempt < 300:
                continue
        degs = [d]
        ok = True
        for k in range(1, n):
            c = [(d2, trans_w(mode, degs[-1], d2) * (0.3 if d2 in degs else 1.0)) for d2 in range(7)]
            if k == n - 1:
                c = [(d2, w * (0.25 if d2 == 0 else 1.0)) for d2, w in c]
                if last_ok is not None:
                    c = [(d2, w) for d2, w in c if last_ok(d2)]
            c = [(d2, w) for d2, w in c if w > 0]
            if not c:
                ok = False
                break
            degs.append(wchoice(rng, c))
        if not ok:
            continue
        if n == 1 and last_ok is not None and not last_ok(degs[0]) and first is None:
            continue
        if n >= 3 and len(set(degs)) < 3:
            continue
        if n >= 3 and 0 not in degs and attempt < 380:
            continue                                   # keep the modal centre audible in every phrase
        best = degs
        sig = (mode.name, tuple(degs))
        if history is not None and attempt < 350:
            if sig in history[-6:] or history.count(sig) >= 2:
                continue
        break
    if best is None:
        best = [first if first is not None else 0] + [(5 if mode.mode == 'aeolian' else 3)] * (n - 1)
    return best


def pick_color(mode, d, e, rng, prev_color=None):
    opts = mode.colors(d)
    if not opts:
        return 'sus2'
    out = []
    for name, w in opts:
        if e < 0.4 and name in ('m9', 'maj9', '6/9', 'm11', '9sus4'):
            w *= 0.55
        if e >= 0.6 and name in ('m9', 'maj9', '6/9', 'm11'):
            w *= 1.4
        if name == prev_color:
            w *= 0.5
        out.append((name, w))
    return wchoice(rng, out)


def vl_cost(prev, cur):
    a = sum(min(abs(x - y) for y in prev) for x in cur) / len(cur)
    b = sum(min(abs(x - y) for y in cur) for x in prev) / len(prev)
    return a + b


def choose_voicing(chord, n, prev, rng, lo=50, hi=77, center=63.0):
    """Voice-led pad voicing: n distinct chord tones in [lo, hi], no low clusters, minimal motion."""
    pri = list(dict.fromkeys(chord.pad_pcs()))
    pcs = pri[:n]
    cands = [[m for m in range(lo, hi + 1) if m % 12 == pc] for pc in pcs]
    best, best_cost = None, 1e9
    for combo in itertools.product(*cands):
        notes = sorted(combo)
        bad = False
        for a, b in zip(notes, notes[1:]):
            g = b - a
            if g < 2 or (a < 60 and g < 3) or (a < 55 and g < 5):
                bad = True
                break
        if bad or notes[-1] - notes[0] > 22:
            continue
        cost = 0.0 if not prev else vl_cost(prev, notes)
        cost += 0.3 * abs(float(np.mean(notes)) - center) + rng.uniform(0.0, 0.5)
        if cost < best_cost:
            best, best_cost = notes, cost
    if best is None:
        best = sorted({60 + ((pc - 60) % 12) for pc in pcs})
    return best


# ============================================================================ motifs
RHYTHMS = {
    'eighths':  [(0, 1.00), (2, .30), (4, .72), (6, .42), (8, .90), (10, .33), (12, .68), (14, .48)],
    'dotted':   [(0, 1.00), (3, .62), (6, .70), (8, .88), (11, .55), (14, .58)],
    'qtr8':     [(0, 1.00), (4, .80), (6, .40), (8, .90), (12, .74), (14, .44)],
    'synco':    [(0, 1.00), (3, .55), (6, .76), (10, .62), (12, .82), (14, .36)],
    'lilt':     [(0, 1.00), (2, .46), (6, .72), (8, .90), (10, .44), (14, .64)],
    'sixteen':  [(0, 1.00), (2, .38), (3, .18), (4, .74), (6, .44), (8, .90), (10, .40), (11, .20),
                 (12, .70), (14, .46)],
    'halftime': [(0, 1.00), (6, .62), (8, .86), (14, .52)],
}
CONTOURS = {      # indices into the current chord's tones; adjacent steps never jump by 4 (= octave)
    'up': [0, 1, 2, 3, 4, 5], 'updown': [0, 1, 2, 3, 4, 3, 2, 1],
    'pendulum': [0, 2, 1, 3, 2, 4, 3, 5], 'alberti': [0, 2, 1, 2], 'broken': [0, 2, 3, 5, 3, 1],
    'cascade': [5, 4, 3, 2, 1, 0], 'arch': [0, 2, 3, 5, 4, 2], 'rocking': [1, 0, 2, 0, 3, 0, 2, 0],
    'wave': [2, 0, 3, 1, 4, 2, 3, 1],
}


@dataclass
class Motif:
    steps: list          # (pos16, idx, vel, importance)
    len16: int
    rhythm: str
    contour: str
    center: int
    timbre: float        # 0 = all Karplus-Strong pluck, 1 = all felt mallet
    mid: int = 0
    shift2: int = 2      # contour offset for the answering second bar


def make_motif(rng, prev=None, mid=0):
    rh = wchoice(rng, [(k, 1.0 if (prev is None or k != prev.rhythm) else 0.0)
                       for k in RHYTHMS if k != 'sixteen'] + [('sixteen', 0.35)])
    co = wchoice(rng, [(k, 1.0 if (prev is None or k != prev.contour) else 0.0) for k in CONTOURS])
    nb = 2 if rng.random() < 0.65 else 1
    seq = CONTOURS[co]
    steps, k = [], 0
    for b in range(nb):
        for pos, imp in RHYTHMS[rh]:
            if b == 1 and imp < 0.5 and rng.random() < 0.3:
                continue                                        # second bar: small rhythmic answer
            idx = seq[k % len(seq)] + (1 if (b == 1 and co in ('alberti', 'rocking')) else 0)
            k += 1
            im = float(np.clip(imp + rng.normal(0, 0.05), 0.05, 1.0)) if pos else 1.0
            steps.append((pos + 16 * b, int(idx), 0.62 + 0.38 * im, im))
    if prev is None:
        center = int(rng.integers(62, 67))
    else:
        center = int(np.clip(prev.center + rng.choice([-3, -2, 2, 3, 4]), 60, 69))
    timbre = float(rng.uniform(0.25, 0.8)) if prev is None else \
        float(np.clip(1.0 - prev.timbre + rng.normal(0, 0.12), 0.2, 0.85))
    return Motif(steps, 16 * nb, rh, co, center, timbre, mid, int(rng.integers(1, 4)))


def vary_motif(m, rng):
    """Continuation motif for non-lift sections: same cell, shifted register, nudged accents."""
    steps = [(p, i, v, float(np.clip(im + rng.normal(0, 0.04), 0.05, 1.0)) if p else 1.0)
             for p, i, v, im in m.steps]
    center = int(np.clip(m.center + rng.choice([-2, -1, 1, 2]), 60, 69))
    timbre = float(np.clip(m.timbre + rng.normal(0, 0.1), 0.2, 0.85))
    return Motif(steps, m.len16, m.rhythm, m.contour, center, timbre, m.mid, m.shift2)


def arp_tones(chord, center):
    pcs = set(chord.arp_pcs())
    return [m for m in range(center - 8, center + 22) if m % 12 in pcs]


# ============================================================================ plan structures
@dataclass
class Section:
    idx: int
    name: str
    start: float
    end: float
    energy: float
    lift: bool
    s0: float = 0.0
    s1: float = 0.0
    mode: Mode = None
    motif: Motif = None
    new_motif: bool = False
    first_deg: int = None
    phrases: list = field(default_factory=list)


@dataclass
class Phrase:
    sec: int
    bars: list           # [(t0, t1)]
    k: int               # index inside section
    idx_shift: int = 0
    center_shift: int = 0
    density: float = 0.0
    chords: list = field(default_factory=list)   # [(t0, t1, Chord)]


@dataclass
class PadNote:
    t_on: float
    t_off: float
    midi: int
    gain: float
    attack: float
    release: float
    oscs: list = field(default_factory=list)


@dataclass
class BassNote:
    t_on: float
    t_off: float
    midi: int
    gain: float
    attack: float = 0.035
    release: float = 0.15
    accents: list = field(default_factory=list)   # [(t, depth)] soft re-articulations of a held note
    levels: list = field(default_factory=list)    # [(t, velocity)] velocity schedule of a merged note


class Plan:
    pass


# ============================================================================ sound sources (bank)
def render_pluck(midi, variant, rng):
    """Karplus-Strong pluck: soft low-passed noise excitation, 4-tap loop filter, exact tuning."""
    f0 = midi_hz(midi)
    n = int(2.3 * FS)
    P = FS / f0
    c = (0.24, 0.20, 0.16)[variant]                 # loop low-pass amount (dark .. brighter)
    N = int(math.floor(P - 1.0))
    d = P - 1.0 - N
    w0 = TWO_PI * f0 / FS
    lo, hi = 0.0, 1.0
    for _ in range(40):                             # fractional delay so the loop is exactly P
        b = 0.5 * (lo + hi)
        tau = math.atan2(b * math.sin(w0), (1 - b) + b * math.cos(w0)) / w0
        lo, hi = (b, hi) if tau < d else (lo, b)
    taps = np.convolve([c, 1 - 2 * c, c], [1 - b, b])
    H = abs(np.sum(taps * np.exp(-1j * w0 * np.arange(4))))
    t60 = (1.5, 1.7, 1.9)[variant] * (f0 / 262.0) ** -0.35
    g = min(10 ** (-3.0 / (t60 * f0)) / H, 0.9993)
    L = N
    fc = (800.0, 1100.0, 1500.0)[variant]
    ex = signal.sosfilt(signal.butter(2, fc, 'lp', fs=FS, output='sos'), rng.standard_normal(L + 256))[256:]
    ex = 0.55 * ex / (np.std(ex) + 1e-12) + 0.8 * np.sin(np.pi * np.arange(L) / L)   # noise + soft 'finger'
    ex *= np.hanning(L)
    kk = max(1, int(round(rng.uniform(0.12, 0.28) * L)))
    ex[kk:] -= 0.85 * ex[:-kk].copy()
    ex -= ex.mean()
    x = np.zeros(n)
    x[:L] = ex
    Y = np.zeros(n + N + 3)
    t0, t1, t2, t3 = (float(v) * g for v in taps)
    for s in range(0, n, N):
        e = min(s + N, n)
        Y[s + N + 3:e + N + 3] = x[s:e] + (t0 * Y[s + 3:e + 3] + t1 * Y[s + 2:e + 2]
                                         + t2 * Y[s + 1:e + 1] + t3 * Y[s:e])
    y = Y[N + 3:]
    y = signal.sosfilt(signal.butter(1, 35, 'hp', fs=FS, output='sos'), y)
    y = signal.sosfilt(signal.butter(2, (2800.0, 3100.0, 3400.0)[variant], 'lp', fs=FS, output='sos'), y)
    fade_edges(y, int(0.012 * FS), int(0.25 * FS))     # 12 ms attack: a soft pluck, not a click
    y = tame_transient(y, 5.5)
    y /= np.sqrt(np.mean(y[: int(0.3 * FS)] ** 2)) + 1e-12
    return (0.32 * y * (f0 / 262.0) ** -0.15).astype(np.float32)


def tame_transient(y, max_crest_db=9.0):
    """Cap the attack at max_crest_db over the note's early sustain with a smooth (ms-scale) gain."""
    w = int(0.003 * FS)
    env = uniform_filter1d(np.abs(y), w)
    env = np.maximum(env, minimum_filter1d(env, 1))
    sus = float(np.median(env[int(0.06 * FS):int(0.3 * FS)])) + 1e-12
    lim = sus * undb(max_crest_db) / 1.4                       # envelope ~ peak / 1.4 for tonal signals
    g = np.minimum(1.0, lim / np.maximum(env, 1e-12))
    g = uniform_filter1d(uniform_filter1d(g, w), w)            # smooth gain: no distortion clicks
    return y * g


def render_mallet(midi, variant, rng):
    """Felt-mallet / soft keys: slightly inharmonic partials, fast upper decay, unison beating."""
    f0 = midi_hz(midi)
    n = int(2.4 * FS)
    t = np.arange(n) / FS
    B = 0.00025
    amps = (1.0, 0.40, 0.16, 0.085, 0.045, 0.025)
    hard = (0.75, 1.0)[variant]
    tau1 = 0.62 * (f0 / 262.0) ** -0.3
    y = np.zeros(n)
    for k in range(1, 7):
        fk = k * f0 * math.sqrt(1 + B * k * k)
        if fk > 6500:
            break
        a = amps[k - 1] * (hard if k > 1 else 1.0) / (1 + (fk / 2600.0) ** 4)
        tau = tau1 / k ** 0.85
        env = np.exp(-t / tau)
        y += a * env * sin32(fk * t + rng.uniform())
        if k <= 2:
            y += 0.35 * a * np.exp(-t / (tau * 1.15)) * sin32(fk * (1.0007 + 0.0003 * k) * t + rng.uniform())
    thump = rng.standard_normal(n) * np.exp(-t / 0.006)
    thump = signal.sosfilt(signal.butter(2, 900, 'lp', fs=FS, output='sos'), thump)
    y += 0.05 * thump
    att = int(0.008 * FS)
    y[:att] *= np.sin(0.5 * np.pi * np.arange(att) / att) ** 2
    y /= np.sqrt(np.mean(y[: int(0.3 * FS)] ** 2)) + 1e-12
    fade_edges(y, 0, int(0.5 * FS))
    return (0.30 * y * (f0 / 262.0) ** -0.15).astype(np.float32)


def render_bell(midi, rng):
    """Soft FM glass bell (carrier:modulator 1:3.5, low decaying index)."""
    f0 = midi_hz(midi)
    n = int(3.4 * FS)
    t = np.arange(n) / FS
    idx = 0.6 * np.exp(-t / 0.25) + 0.1
    mod = sin32(3.5 * f0 * t + rng.uniform())
    car = np.sin((TWO_PI * frac(f0 * t + rng.uniform()) + idx * mod).astype(np.float32))
    y = car * np.exp(-t / 0.95) + 0.22 * sin32(2.0 * f0 * t) * np.exp(-t / 0.45)
    y = signal.sosfilt(signal.butter(2, 3200, 'lp', fs=FS, output='sos'), y)
    fade_edges(y, int(0.008 * FS), int(0.6 * FS))
    return (0.3 * y / (np.max(np.abs(y)) + 1e-12)).astype(np.float32)


_SOS_HAT_HP = signal.butter(4, 7000, 'hp', fs=FS, output='sos')
_SOS_HAT_LP = signal.butter(2, 12500, 'lp', fs=FS, output='sos')
_SOS_SHK = signal.butter(2, [6000, 11000], 'bandpass', fs=FS, output='sos')
_SOS_KICK_LP = signal.butter(2, 230, 'lp', fs=FS, output='sos')


def render_hat(variant, rng):
    n = int(0.2 * FS)
    t = np.arange(n) / FS
    x = signal.sosfilt(_SOS_HAT_LP, signal.sosfilt(_SOS_HAT_HP, rng.standard_normal(n + 512)))[512:]
    decay = (0.020, 0.026, 0.032, 0.024, 0.036, 0.028)[variant % 6]
    x *= np.exp(-t / decay)
    fade_edges(x, int(0.0015 * FS), int(0.03 * FS))      # 1.5 ms: a soft tick, not a click
    return (x / np.max(np.abs(x))).astype(np.float32)


def render_shaker(variant, rng):
    n = int(0.24 * FS)
    t = np.arange(n) / FS
    x = signal.sosfilt(_SOS_SHK, rng.standard_normal(n + 512))[512:]
    att = (0.010, 0.014, 0.018, 0.012)[variant % 4]
    env = np.where(t < att, np.sin(0.5 * np.pi * t / att) ** 2, np.exp(-(t - att) / 0.045))
    grain = 1.0 + 0.5 * signal.sosfilt(signal.butter(1, 300, 'lp', fs=FS, output='sos'),
                                       rng.standard_normal(n))
    x *= env * grain
    fade_edges(x, 0, int(0.04 * FS))
    return (x / np.max(np.abs(x))).astype(np.float32)


def render_kick(variant, rng):
    """Very soft, round kick: sine with gentle pitch drop, no click transient."""
    n = int(0.6 * FS)
    t = np.arange(n) / FS
    fe, fs_, td = (56.0, 58.0, 54.0)[variant % 3], 60.0, 0.025
    cyc = fe * t + fs_ * td * (1 - np.exp(-t / td))
    att = 0.004
    env = np.where(t < att, np.sin(0.5 * np.pi * t / att) ** 2, 1.0) * np.exp(-t / 0.11)
    y = signal.sosfilt(_SOS_KICK_LP, sin32(cyc) * env)
    fade_edges(y, 0, int(0.1 * FS))
    return (y / np.max(np.abs(y))).astype(np.float32)


def stft_shape(noise, gain_fn, nper=2048, hop=512):
    """Time-varying spectral shaping of noise (gain_fn(f, t) -> |H|), via STFT/ISTFT."""
    f, tt, Z = signal.stft(noise, fs=FS, nperseg=nper, noverlap=nper - hop)
    Z = Z * gain_fn(f, tt)
    _, y = signal.istft(Z, fs=FS, nperseg=nper, noverlap=nper - hop)
    return y[..., :noise.shape[-1]]


def render_riser(dur, rng):
    """Airy band-passed noise swell rising 220 Hz -> 2.2 kHz, peaking at index dur*FS."""
    tail = 0.5
    n = int((dur + tail) * FS)
    noise = rng.standard_normal((2, n))

    def g(f, tt):
        u = np.clip(tt / dur, 0, 1)
        fc = 220.0 * (1900.0 / 220.0) ** (u ** 1.3)
        G = np.exp(-0.5 * (np.log2((f[:, None] + 20.0) / fc[None, :]) / 0.8) ** 2)
        amp = np.where(tt <= dur, u ** 2.4, np.exp(-(tt - dur) / 0.09))
        return G * amp[None, :] / np.sqrt(fc[None, :] / 220.0)

    y = stft_shape(noise, g)
    y = signal.sosfilt(signal.butter(2, 4500, 'lp', fs=FS, output='sos'), y, axis=-1)
    fade_edges(y, int(0.05 * FS), int(0.2 * FS))
    return (y / (np.max(np.abs(y)) + 1e-12)).astype(np.float32)


def render_reverse_swell(midis, dur, ir, rng):
    """Reverse-reverb swell of the coming chord: soft notes -> reverb -> time-reversed."""
    n = int(0.6 * FS)
    t = np.arange(n) / FS
    x = np.zeros(n)
    for m in midis:
        f = midi_hz(m)
        x += sin32(f * t + rng.uniform()) * np.exp(-t / 0.18)
    fade_edges(x, int(0.004 * FS), int(0.05 * FS))
    wet = np.stack([signal.fftconvolve(x, ir[c]) for c in range(2)])
    rev = wet[:, ::-1]
    pre = int(0.03 * FS)                                # skip the (reversed) pre-delay silence
    rev = rev[:, :rev.shape[1] - pre]
    L = int(dur * FS)
    y = rev[:, -L:].copy() if rev.shape[1] >= L else np.pad(rev, ((0, 0), (L - rev.shape[1], 0)))
    y = signal.sosfilt(signal.butter(2, 3000, 'lp', fs=FS, output='sos'), y, axis=-1)
    fade_edges(y, int(0.35 * L), int(0.03 * FS))
    return (y / (np.max(np.abs(y)) + 1e-12)).astype(np.float32)


def make_reverb_ir(rng, length=3.4, predelay=0.02):
    """Synthetic stereo hall: decorrelated noise with frequency-dependent T60, early reflections."""
    n = int(length * FS)
    noise = rng.standard_normal((2, n))
    fp = np.log([20, 150, 600, 2000, 5000, 10000, 24000])
    tp = [3.0, 3.0, 2.6, 2.0, 1.25, 0.7, 0.4]

    def g(f, tt):
        t60 = np.interp(np.log(np.maximum(f, 20.0)), fp, tp)
        tilt = (1.0 / np.sqrt(1 + (f / 6500.0) ** 4)) * ((f / 170.0) ** 2 / np.sqrt(1 + (f / 170.0) ** 4))
        return np.exp(-6.91 * tt[None, :] / t60[:, None]) * tilt[:, None]

    ir = stft_shape(noise, g, nper=1024, hop=256)
    on = int(0.025 * FS)
    ir[:, :on] *= (np.arange(on) / on) ** 1.5
    er = np.zeros((2, n))
    for k in range(12):
        tt = rng.uniform(0.004, 0.065)
        ch = k % 2
        er[ch, int(tt * FS)] += rng.choice([-1, 1]) * 0.55 * math.exp(-tt / 0.05)
    er = signal.sosfilt(signal.butter(2, 4000, 'lp', fs=FS, output='sos'), er, axis=-1)
    ir = ir / np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True)) + 0.35 * er
    pd = int(predelay * FS)
    ir = np.concatenate([np.zeros((2, pd)), ir[:, :n - pd]], axis=1)
    fade_edges(ir, 0, int(0.25 * FS))
    return ir / np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))


def make_delay_ir(dsec, fb=0.42, n_echo=8):
    """Ping-pong delay as an exact stereo impulse response (L, R, L, ...; darker each repeat)."""
    D = int(round(dsec * FS))
    loop = np.vstack([signal.butter(1, 2800, 'lp', fs=FS, output='sos'),
                      signal.butter(1, 260, 'hp', fs=FS, output='sos')])
    m = 4096
    h = np.zeros((2, D * n_echo + m))
    e = np.zeros(m)
    e[0] = 1.0
    for k in range(1, n_echo + 1):
        e = signal.sosfilt(loop, e)
        h[(k - 1) % 2, k * D:k * D + m] += fb ** (k - 1) * e
    return h


def build_pad_table(midi, rng):
    f0 = midi_hz(midi)
    K = int(min(48, 9000.0 / f0))
    k = np.arange(1, K + 1)
    amp = (1.0 / k) / np.sqrt(1 + (k * f0 / 1900.0) ** 4)
    amp[1::2] *= 0.85
    amp[0] *= 1.3
    spec = np.zeros(TAB // 2 + 1, complex)
    spec[1:K + 1] = amp * np.exp(1j * rng.uniform(0, TWO_PI, K)) * (TAB / 2)
    tab = np.fft.irfft(spec, TAB)
    tab /= np.sqrt(2.0 * np.mean(tab ** 2))
    return np.append(tab, tab[0]).astype(np.float32)


# ============================================================================ composition
def build_plan(raw, seed=1, bpm=92.0, key='A', log=print):
    P = Plan()
    P.seed, P.bpm = seed, bpm
    beat = 60.0 / bpm
    bar = 4 * beat
    P.beat, P.bar = beat, bar
    s16 = beat / 4

    # ---------------------------------------------------------------- sections + beat snapping
    raw = sorted(raw, key=lambda s: float(s['start']))
    secs = [Section(i, str(s.get('name', f'section{i}')), float(s['start']), float(s['end']),
                    float(np.clip(float(s.get('energy', 0.5)), 0.0, 1.0)), bool(s.get('lift', False)))
            for i, s in enumerate(raw)]
    T = max(s.end for s in secs)
    P.T, P.N = T, int(round(T * FS))
    kept, prev_b = [], -1
    for s in secs:
        b = 0 if not kept else max(int(round(s.start / beat)), prev_b + 1)
        if kept and b * beat > T - 0.5 * beat:
            log(f"  note: section '{s.name}' starts too close to the end; merged into the previous one")
            continue
        s.s0, prev_b = b * beat, b
        kept.append(s)
    secs = kept
    for i, s in enumerate(secs):
        s.idx = i
        s.s1 = secs[i + 1].s0 if i + 1 < len(secs) else T
    P.secs = secs
    nsec = len(secs)

    # ---------------------------------------------------------------- tonal centres + motifs
    home = NAME_TO_PC[key.upper()]
    palette = [(Mode(home, 'aeolian'), 1.0), (Mode(home + 5, 'dorian'), 0.9), (Mode(home, 'dorian'), 0.5),
               (Mode(home + 7, 'aeolian'), 0.35), (Mode(home + 5, 'aeolian'), 0.35)]
    HOME = palette[0][0]
    rm = rng_for(seed, 'modes')
    prev_m = None
    for i, s in enumerate(secs):
        if i == 0 or i == nsec - 1:
            s.mode = HOME
        else:
            prev = secs[i - 1].mode
            if rm.random() < (0.3 if s.lift else 0.7):
                s.mode = prev
            else:
                c = [(m, w) for m, w in palette if abs(m.acc - prev.acc) <= 1 and m.name != prev.name]
                s.mode = wchoice(rm, c) if c else prev
        r = rng_for(seed, 'motif', i)
        if i == 0 or s.lift:
            s.motif, s.new_motif = make_motif(r, prev_m, mid=(0 if prev_m is None else prev_m.mid + 1)), True
        else:
            s.motif = vary_motif(prev_m, r)
        prev_m = s.motif
        if i == 0 or s.lift or (i > 0 and s.mode.name != secs[i - 1].mode.name):
            s.first_deg = 0 if r.random() < 0.8 else wchoice(r, start_weights(s.mode)[1:])

    # ---------------------------------------------------------------- bars and phrases
    for s in secs:
        nbeats = (s.s1 - s.s0) / beat
        nfull = int(math.floor(nbeats / 4 + 1e-9))
        rem = nbeats - 4 * nfull
        bars = [[s.s0 + 4 * j * beat, s.s0 + 4 * (j + 1) * beat] for j in range(nfull)]
        if rem > 1e-6:
            if bars:
                bars[-1][1] = s.s1                      # partial bar merged into the last bar
            else:
                bars.append([s.s0, s.s1])
        bars[-1][1] = s.s1
        sizes, nb = [], len(bars)
        while nb > 0:
            sizes.append(min(8, nb))
            nb -= sizes[-1]
        if len(sizes) >= 2 and sizes[-1] <= 3:
            tail = sizes.pop()
            sizes[-1] += tail
        rp = rng_for(seed, 'phrase-var', s.idx)
        j = 0
        for k, sz in enumerate(sizes):
            ph = Phrase(s.idx, [tuple(b) for b in bars[j:j + sz]], k)
            if k > 0:
                ph.idx_shift = int(wchoice(rp, [(0, 1.0), (1, 0.8), (-1, 0.5), (2, 0.4)]))
                ph.center_shift = int(wchoice(rp, [(0, 1.0), (-2, 0.6), (3, 0.6), (5, 0.3)]))
                ph.density = float(wchoice(rp, [(0.0, 1.0), (0.12, 0.45), (-0.06, 0.4)]))
                if k % 4 == 3:
                    ph.density = 0.22                   # breathing phrase: arp thins out
            s.phrases.append(ph)
            j += sz

    # ---------------------------------------------------------------- chord progressions
    pre_tonic_roots = {HOME.scale[5], HOME.scale[6], HOME.scale[3], HOME.scale[4]}
    last = secs[-1]
    outro_short = nsec > 1 and (last.s1 - last.s0) < 5 * bar
    if nsec > 1 and outro_short:
        last.first_deg = 0                      # short outro = the tonic itself
    history = []
    prev_root = None
    prev_color = None
    for i, s in enumerate(secs):
        rr = rng_for(seed, 'prog', i)
        nxt = secs[i + 1] if i + 1 < nsec else None
        for k, ph in enumerate(s.phrases):
            nb = len(ph.bars)
            final_phrase = (k == len(s.phrases) - 1)
            if i == nsec - 1 and nsec > 1 and outro_short:
                ph.chords = [(ph.bars[0][0], ph.bars[-1][1], HOME.chord(0, 'madd9'))]
                continue
            durs = harmonic_rhythm(nb, s.energy, rr)
            last_ok = None
            first = s.first_deg if k == 0 else None
            if final_phrase and nxt is not None:
                nm = nxt.mode
                nf = nm.scale[nxt.first_deg or 0]
                need_pre = (nxt.idx == nsec - 1 and outro_short)

                def last_ok(d, m=s.mode, nm=nm, nf=nf, need_pre=need_pre):
                    pcs = m.triad_pcs(d)
                    if not pcs <= nm.coll or m.scale[d] == nf:
                        return False
                    return (m.scale[d] in pre_tonic_roots) if need_pre else True
            if i == nsec - 1 and final_phrase:
                # resolving cadence: ... -> pre-tonic -> tonic held for >= 2 bars
                if durs[-1] < 2 and len(durs) >= 2:
                    durs[-2] += durs[-1]
                    durs = durs[:-1]
                if len(durs) == 1:
                    durs = [nb] if nb < 4 else [nb - 2, 2]
                if len(durs) == 2 and first == 0 and durs[0] >= 2:
                    durs = [durs[0] - durs[0] // 2, durs[0] // 2, durs[1]]   # i -> pre-tonic -> i
                head = gen_degrees(s.mode, len(durs) - 1, rr, first=first,
                                   last_ok=lambda d, m=s.mode: m.scale[d] in pre_tonic_roots,
                                   history=history) if len(durs) > 1 else []
                degs = head + [0]
            else:
                avoid = s.mode.scale.index(prev_root) if prev_root in s.mode.scale else None
                degs = gen_degrees(s.mode, len(durs), rr, first=first, last_ok=last_ok,
                                   avoid_first=avoid, history=history)
            history.append((s.mode.name, tuple(degs)))
            j = 0
            for d, du in zip(degs, durs):
                if i == nsec - 1 and final_phrase and d == 0 and j + du == nb:
                    col = 'madd9'
                else:
                    col = pick_color(s.mode, d, s.energy, rr, prev_color)
                prev_color = col
                ph.chords.append((ph.bars[j][0], ph.bars[j + du - 1][1], s.mode.chord(d, col)))
                j += du
            prev_root = s.mode.scale[degs[-1]]
    spans = []
    for s in secs:
        for ph in s.phrases:
            for (t0, t1, ch) in ph.chords:
                spans.append((t0, t1, ch, s.idx))
    P.spans = spans
    P.span_t0 = np.array([sp[0] for sp in spans])
    t_final = spans[-1][0]
    P.t_final = t_final

    def chord_at(t):
        j = int(np.searchsorted(P.span_t0, t + 1e-6, side='right') - 1)
        return spans[max(0, j)][2]

    def section_at(t):
        j = 0
        while j + 1 < nsec and secs[j + 1].s0 <= t + 1e-9:
            j += 1
        return secs[j]

    # ---------------------------------------------------------------- automation curves
    def scurve(fn, style='smooth', ramp_bars=1.0, plain='smooth'):
        """Per-section value fn(section) with transitions: `style` at lift boundaries
        ('smooth' | 'jump' | 'breath'), `plain` at other boundaries ('smooth' | 'inside')."""
        pts = [(0.0, fn(secs[0]))]
        for i in range(1, nsec):
            a, b = secs[i - 1], secs[i]
            S, va, vb = b.s0, fn(a), fn(b)
            La, Lb = S - a.s0, b.s1 - b.s0
            if b.lift and style == 'breath':
                pre = min(bar, 0.45 * La)
                pts += [(S - pre, va), (S - min(beat, 0.5 * pre), 0.0), (S - 0.02, 0.0), (S, vb)]
            elif b.lift and style == 'jump':
                pre = min(0.05, 0.2 * La)
                pts += [(S - pre, va), (S, vb)]
            elif plain == 'inside' and not b.lift:  # ramp only inside the section with the higher value
                r = min(ramp_bars * bar, 0.3 * La, 0.3 * Lb)
                pts += [(S - r, va), (S, vb)] if va > vb else [(S, va), (S + r, vb)]
            else:
                r = min(ramp_bars * bar, 0.3 * La, 0.3 * Lb)
                pts += [(S - r, va), (S + r, vb)]
        pts.append((T, fn(secs[-1])))
        return Curve(pts)

    L0 = secs[0].s1
    ks = min(1.0, L0 / (6 * bar))

    def entry(a_bars, b_bars):
        return Curve([(0.0, 0.0), (a_bars * bar * ks, 0.0), (max(b_bars * bar * ks, a_bars * bar * ks + 0.05), 1.0)])

    cur = {}
    cur['energy'] = scurve(lambda s: s.energy, 'jump')
    cur['pad_gain'] = scurve(lambda s: 1.0 - 0.15 * s.energy)
    cur['pad_bright'] = scurve(lambda s: 0.28 + 0.6 * s.energy)
    bm = [(0.0, 0.55), (4 * bar * ks, 1.0)]           # intro: pads open up over ~4 bars
    for s in secs[1:]:
        if s.lift:                                    # lift: close slightly under the riser, bloom on arrival
            R = min(2 * bar, 0.55 * (s.s0 - secs[s.idx - 1].s0))
            bm += [(s.s0 - R, 1.0), (s.s0 - 0.05, 0.75), (s.s0 + 0.6 * beat, 1.15), (s.s0 + min(2 * bar, 0.5 * (s.s1 - s.s0)), 1.0)]
    cur['bright_mod'] = Curve(bm)
    cur['pad_rev'] = scurve(lambda s: 0.30 - 0.12 * s.energy)
    cur['bass'] = scurve(lambda s: smoothstep(0.08, 0.3, s.energy) * (0.85 + 0.3 * s.energy))
    cur['arp'] = scurve(lambda s: smoothstep(0.1, 0.32, s.energy) * (0.72 + 0.4 * s.energy))
    cur['arp_dly'] = scurve(lambda s: 0.34 + 0.12 * (1 - s.energy))
    cur['arp_rev'] = scurve(lambda s: 0.22 + 0.12 * (1 - s.energy))
    cur['hat'] = scurve(lambda s: smoothstep(0.38, 0.52, s.energy) * (0.7 + 0.6 * s.energy), 'breath')
    cur['shaker'] = scurve(lambda s: smoothstep(0.44, 0.62, s.energy) * (0.6 + 0.6 * s.energy), 'breath')
    # kick strictly inside energy >= 0.6 sections: plain boundaries ramp inside the louder section,
    # lift boundaries use the breath (out for the bar before, back on the downbeat)
    cur['kick'] = scurve(lambda s: (0.5 + 1.2 * (s.energy - 0.6)) if s.energy >= 0.6 else 0.0, 'breath',
                         plain='inside')
    cur['e_bass'], cur['e_arp'], cur['e_perc'] = entry(0.5, 1.5), entry(1.5, 3.5), entry(3.0, 4.5)
    # outro: percussion leaves at the final chord, arp hands over to the closing figure
    outro_off = Curve([(0.0, 1.0), (max(0.0, t_final - beat), 1.0), (t_final + 0.5 * beat, 0.0)])
    cur['outro'] = outro_off
    P.cur = cur

    # master fades: soft intro, resolving outro fade ending at exactly T
    fin = min(3.0, 0.5 * L0)
    Fo = float(np.clip(0.55 * (T - t_final), 2.5, 7.0))
    Fo = min(Fo, 0.9 * (T - secs[-1].s0) if nsec > 1 else 0.5 * T)
    P.fade_in, P.fade_out = fin, Fo

    lift_times = [s.s0 for s in secs[1:] if s.lift]
    P.lift_times = lift_times

    def near_lift(t):  # inside the bar before a lift downbeat
        return any(S - bar <= t < S for S in lift_times)

    # ---------------------------------------------------------------- pads (voice-led, tied common tones)
    rp = rng_for(seed, 'pads')
    pad_notes, active, prev_v = [], {}, None
    center = 63.0
    for (t0, t1, ch, si) in spans:
        s = secs[si]
        e = s.energy
        nv = 3 if e < 0.3 else (4 if e < 0.62 else 5)
        nv = min(nv, len(set(ch.pad_pcs())))
        center = float(np.clip(center + rp.normal(0, 0.8), 60.0, 66.0))
        v = choose_voicing(ch, nv, prev_v, rp, center=center)
        prev_v = v
        att = 1.7 - 0.8 * e
        rel = 2.6 - 0.8 * e
        for m in list(active):
            if m not in v:
                active.pop(m).t_off = t0
        for m in v:
            if m in active:
                active[m].t_off = t1
                continue
            oscs = []
            w = 0.5 + 0.3 * e
            for j, (cents, pan) in enumerate(((-7.0, -w), (0.0, 0.0), (7.0, w))):
                oscs.append((2 ** ((cents * rp.uniform(0.8, 1.25)) / 1200.0),
                             float(np.clip(pan + rp.normal(0, 0.08), -0.9, 0.9)), rp.uniform(),
                             rp.uniform(0.05, 0.18), rp.uniform(0.0008, 0.0018), rp.uniform(0, TWO_PI),
                             (0.9, 1.0, 0.9)[j]))
            note = PadNote(max(0.0, t0 - 0.25 * att), t1, m, (midi_hz(m) / 262.0) ** -0.2 / math.sqrt(nv / 4.0),
                           att if t0 > 0 else 3.0, rel, oscs)
            note.br = (rp.uniform(0.05, 0.12), rp.uniform(0, TWO_PI))
            active[m] = note
            pad_notes.append(note)
    for m in list(active):
        active.pop(m).t_off = T + 1.0
    pad_notes.sort(key=lambda n: n.t_on)
    P.pad_notes = pad_notes

    # ---------------------------------------------------------------- bass
    rb = rng_for(seed, 'bass')
    bass = []
    home_bass = 29 + ((HOME.tonic - 29) % 12)
    for k, (t0, t1, ch, si) in enumerate(spans):
        s = secs[si]
        e = s.energy
        m = 29 + ((ch.root - 29) % 12)
        if si == 0 and t0 < 4 * bar * ks and HOME.tonic in ch.pcs | {ch.root} and ch.root != HOME.tonic:
            # tonic pedal under the opening chords (only where it is a chord tone)
            m = home_bass
        end = t1
        if any(abs(t1 - S) < 1e-6 for S in lift_times):
            end = max(t0 + beat, t1 - 1 * beat)         # one-beat breath before a lift downbeat
        if t0 >= t_final - 1e-6:
            bass.append(BassNote(t0, T + 1.0, m, 0.9, 0.08, 0.4))
            continue
        if e < 0.45:
            bass.append(BassNote(t0, end, m, 0.9))
            continue
        nbar = max(1, int(round((t1 - t0) / bar)))
        nxt_root = spans[k + 1][2].root if k + 1 < len(spans) else ch.root
        for j in range(nbar):
            b0 = t0 + j * bar
            b1 = t1 if j == nbar - 1 else b0 + bar
            if b0 >= end - 0.05:
                break
            pick = (j == nbar - 1 and nxt_root != ch.root and end >= b1 - 1e-6 and rb.random() < 0.45)
            stop = min(b1, end) - (0.5 * beat if pick else 0.0)
            if e < 0.7:
                bass.append(BassNote(b0, stop + 0.06, m, 0.9, 0.05, 0.3))       # legato, soft re-attack
            else:
                for off, du, vel in ((0.0, 1.5, 0.95), (1.5, 1.5, 0.72), (3.0, 1.0, 0.8)):
                    tb = b0 + off * beat
                    if tb < stop - 0.05:
                        bass.append(BassNote(tb, min(tb + du * beat + 0.05, stop + 0.06), m, vel, 0.04, 0.25))
            if pick:
                m2 = 29 + ((nxt_root - 29) % 12)
                bass.append(BassNote(b1 - 0.5 * beat, b1 + 0.06, m2, 0.55, 0.04, 0.25))
    # Same-pitch notes that touch are merged into one held, phase-continuous note with soft accents
    # (re-triggering a sine at a new phase while the old one releases would partially cancel).
    bass.sort(key=lambda b: b.t_on)
    merged = []
    for bn in bass:
        pv = merged[-1] if merged else None
        if pv is not None and pv.midi == bn.midi and bn.t_on <= pv.t_off + 0.03:
            pv.accents.append((bn.t_on, 0.2))
            pv.levels.append((bn.t_on, bn.gain))
            pv.t_off = max(pv.t_off, bn.t_off)
        else:
            if pv is not None and bn.t_on < pv.t_off:          # pitch change: short legato overlap
                pv.t_off = bn.t_on + 0.02
                pv.release = 0.12
            bn.levels = [(bn.t_on, bn.gain)]
            merged.append(bn)
    for bn in merged:
        bn.gain = undb(LV['bass'])                            # velocities live in bn.levels
    P.bass_notes = merged

    # ---------------------------------------------------------------- sample-bank events
    events = []                         # (t, key, gain, pan, bus, rev, dly); bus 0 arp, 1 perc, 2 fx
    ra = rng_for(seed, 'arp')
    swing8 = 0.12 * s16
    played = {}                         # section -> [(t, midi, importance, vel)] for bell doubling

    def phrase_at(s, tg):
        return next((p for p in s.phrases if p.bars[0][0] - 1e-6 <= tg < p.bars[-1][1] + 1e-6), s.phrases[-1])

    for s in secs:
        m = s.motif
        seq = CONTOURS[m.contour]
        # 2-bar call/answer periods (a 1-bar motif is played twice, the answer with shifted contour)
        steps = sorted(m.steps) if m.len16 == 32 else sorted(m.steps + [(p + 16, i, v, im) for (p, i, v, im) in m.steps])
        cyc = 0
        while True:
            c0 = s.s0 + cyc * 32 * s16
            if c0 >= min(s.s1, t_final) - 0.02:
                break
            kept = []
            for (pos, _, vel, imp) in steps:          # 1) which steps play (energy-dependent thinning)
                tg = c0 + pos * s16
                if tg >= s.s1 - 0.02 or tg >= t_final - 1e-6:
                    continue
                ph = phrase_at(s, tg)
                e = float(cur['energy'](tg))
                thr = 1.02 - 1.05 * e + ph.density + (0.3 if near_lift(tg) else 0.0)
                if imp < thr:
                    continue
                g = float(cur['arp'](tg)) * float(cur['e_arp'](tg)) * float(cur['outro'](tg))
                if g >= 0.02:
                    kept.append((tg, pos, vel, imp, ph, g))
            n_call = sum(1 for k in kept if k[1] < 16)
            off = m.shift2 + (1 if (n_call + m.shift2) % len(seq) == 0 else 0)  # answer != call
            for j, (tg, pos, vel, imp, ph, g) in enumerate(kept):   # 2) contour over the played notes
                ch = chord_at(tg)
                tones = arp_tones(ch, m.center + ph.center_shift)
                ii = seq[(j + (off if pos >= 16 else 0)) % len(seq)] + ph.idx_shift
                midi = tones[ii % len(tones)] + 12 * (ii // len(tones))
                while midi > 81:
                    midi -= 12                                   # keep the arp below A5
                midi = max(midi, 52)
                t = tg + (swing8 if pos % 4 == 2 else 0.0) + float(np.clip(ra.normal(0, 0.003), -0.008, 0.008))
                amp = undb(LV['arp']) * g * (vel * (0.9 + 0.2 * ra.random())) ** 1.5
                amp *= 1.0 - 0.025 * max(0, midi - 70)              # high notes a touch softer
                pan = float(np.clip(ra.normal(0, 0.2), -0.45, 0.45))
                wp, wm = math.cos(0.5 * math.pi * m.timbre), math.sin(0.5 * math.pi * m.timbre)
                var = 2 if vel > 0.9 else int(ra.integers(0, 2))
                events.append((t, ('pluck', midi, var), amp * wp, pan, 0, 1.0, 1.0))
                events.append((t, ('mallet', midi, int(vel > 0.85)), amp * wm, pan, 0, 1.0, 1.0))
                played.setdefault(s.idx, []).append((tg, midi, imp, vel))
            cyc += 1

    # bells: new-motif statements at lift sections (doubling the arp an octave up), rare recalls in
    # long sections, and a final chime
    rbl = rng_for(seed, 'bell')
    for s in secs:
        starts = []
        if s.new_motif and s.idx > 0:
            starts.append((s.s0, 1.0))
        for ph in s.phrases[2::3]:
            starts.append((ph.bars[0][0], 0.7))
        for (ts, lvl) in starts:
            if ts >= t_final - bar:
                continue
            span = 32 * s16
            heads = [x for x in played.get(s.idx, []) if ts - 1e-6 <= x[0] < ts + span and x[2] >= 0.7][:5]
            for (tg, midi, imp, vel) in heads:
                mb = int(np.clip(midi + 12, 67, 88))
                amp = undb(LV['bell']) * lvl * vel * float(cur['outro'](tg))
                events.append((tg, ('bell', mb), amp, float(rbl.uniform(-0.4, 0.4)), 0, 2.2, 1.4))

    # closing figure: descending tonic arpeggio + soft chime, then everything rings out
    fch = spans[-1][2]
    tones = arp_tones(fch, 64)
    figure = sorted([x for x in tones if 57 <= x <= 76], reverse=True)[:4]
    for j, midi in enumerate(figure):
        tg = t_final + j * 0.5 * beat
        if tg < T - 0.5:
            amp = undb(LV['arp']) * 0.75 * (0.85 - 0.12 * j)
            events.append((tg, ('mallet', midi, 0), amp * 0.8, (-0.2, 0.2)[j % 2], 0, 1.2, 1.3))
            events.append((tg, ('pluck', midi, 0), amp * 0.5, (-0.2, 0.2)[j % 2], 0, 1.2, 1.3))
    if t_final + 2 * beat < T - 0.5:
        midi = int(np.clip(min(x for x in tones if x >= 69) + 12, 69, 88))
        events.append((t_final + 2 * beat, ('bell', midi), undb(LV['bell']) * 0.8, 0.15, 0, 2.5, 1.2))

    # percussion
    rpc = rng_for(seed, 'perc')
    for s in secs:
        k16 = 0
        while True:
            tg = s.s0 + k16 * s16
            if tg >= s.s1 - 0.02:
                break
            pos = k16 % 16
            e = float(cur['energy'](tg))
            ent = float(cur['e_perc'](tg)) * float(cur['outro'](tg))
            ph = next(p for p in s.phrases if p.bars[0][0] - 1e-6 <= tg < p.bars[-1][1] + 1e-6)
            last_bar = (tg >= ph.bars[-1][0] - 1e-6) and len(ph.bars) >= 4
            hum = float(np.clip(rpc.normal(0, 0.003), -0.007, 0.007))
            sw = swing8 if pos % 4 == 2 else 0.0
            # closed-hat ticks
            gh = float(cur['hat'](tg)) * ent
            if gh > 0.01:
                if e < 0.55:
                    hp = {2: .75, 6: .62, 10: .75, 14: .58}
                elif e < 0.72:
                    hp = {0: .30, 2: .78, 4: .28, 6: .66, 8: .30, 10: .78, 12: .28, 14: .62}
                else:
                    hp = {0: .32, 2: .80, 4: .30, 6: .68, 7: .20, 8: .32, 10: .80, 12: .30, 14: .66, 15: .22}
                if pos in hp and not (last_bar and pos >= 12 and ph.k % 2 == 1):
                    amp = undb(LV['hat']) * gh * hp[pos] * (0.88 + 0.24 * rpc.random())
                    events.append((tg + sw + hum, ('hat', int(rpc.integers(0, 6))), amp,
                                   0.3 + 0.05 * rpc.normal(), 1, 0.25, 0.0))
            gs = float(cur['shaker'](tg)) * ent
            if gs > 0.01:
                vel = (0.30, 0.16, 0.55, 0.20)[pos % 4] * (1.3 if (last_bar and pos >= 12) else 1.0)
                amp = undb(LV['shaker']) * gs * vel * (0.85 + 0.3 * rpc.random())
                events.append((tg + sw + hum, ('shaker', int(rpc.integers(0, 4))), amp, -0.35, 1, 0.3, 0.0))
            gk = float(cur['kick'](tg)) * ent
            if gk > 0.01 and pos in (0, 8, 10):
                kv = {0: 1.0, 8: 0.72, 10: 0.42}[pos]
                if pos != 10 or e >= 0.8:
                    events.append((tg + max(0.0, 0.5 * hum), ('kick', int(rpc.integers(0, 3))),
                                   undb(LV['kick']) * gk * kv, 0.0, 1, 0.0, 0.0))
            k16 += 1

    # risers + reverse swells into lift sections
    rr = rng_for(seed, 'reverb')
    P.ir_rev = make_reverb_ir(rr)
    bank = {}
    for s in secs[1:]:
        if not s.lift:
            continue
        a = secs[s.idx - 1]
        R = min(2 * bar, 0.55 * (s.s0 - a.s0))
        if R < beat:
            continue
        rz = rng_for(seed, 'riser', s.idx)
        key_r = ('riser', s.idx)
        bank[key_r] = render_riser(R, rz)
        events.append((s.s0 - R, key_r, undb(LV['riser']), 0.0, 2, 0.6, 0.0))
        first_ch = chord_at(s.s0 + 0.01)
        mids = choose_voicing(first_ch, 4, None, rz, center=67.0)
        Ls = min(bar, R)
        key_s = ('swell', s.idx)
        bank[key_s] = render_reverse_swell(mids, Ls, P.ir_rev, rz)
        events.append((s.s0 - Ls, key_s, undb(LV['swell']), 0.0, 2, 0.15, 0.0))

    # ---------------------------------------------------------------- render the bank (unique keys)
    keys = sorted({ev[1] for ev in events if ev[1] not in bank}, key=repr)
    for kk in keys:
        r = rng_for(seed, 'bank', *kk)
        kind = kk[0]
        if kind == 'pluck':
            bank[kk] = render_pluck(kk[1], kk[2], r)
        elif kind == 'mallet':
            bank[kk] = render_mallet(kk[1], kk[2], r)
        elif kind == 'bell':
            bank[kk] = render_bell(kk[1], r)
        elif kind == 'hat':
            bank[kk] = render_hat(kk[1], r)
        elif kind == 'shaker':
            bank[kk] = render_shaker(kk[1], r)
        elif kind == 'kick':
            bank[kk] = render_kick(kk[1], r)
    P.bank = bank
    events = [ev for ev in events if ev[0] < T and ev[2] > 1e-6]
    events.sort(key=lambda ev: ev[0])
    P.ev_n0 = np.array([int(round(ev[0] * FS)) for ev in events], dtype=np.int64)
    P.ev_len = np.array([bank[ev[1]].shape[-1] for ev in events], dtype=np.int64)
    P.events = events
    P.ev_maxlen = int(P.ev_len.max()) if len(events) else 0
    P.kick_t = np.array(sorted(ev[0] for ev in events if ev[1][0] == 'kick'))
    P.kick_g = np.array([ev[2] for ev in sorted((e for e in events if e[1][0] == 'kick'), key=lambda e: e[0])])

    # ---------------------------------------------------------------- wavetables + wet impulse responses
    rt = rng_for(seed, 'tables')
    P.tables = {m: build_pad_table(m, rt) for m in sorted({n.midi for n in pad_notes})}
    for n in pad_notes:
        n.n_on = int(math.floor(n.t_on * FS))
        n.n_end = int(math.ceil((n.t_off + n.release) * FS)) + 1
    P.pad_on = np.array([n.n_on for n in pad_notes], dtype=np.int64)
    P.pad_end = np.array([n.n_end for n in pad_notes], dtype=np.int64)
    for b in P.bass_notes:
        b.n_on = int(math.floor(b.t_on * FS))
        b.n_end = int(math.ceil((b.t_off + b.release) * FS)) + 1
    P.bass_on = np.array([b.n_on for b in P.bass_notes], dtype=np.int64)
    P.bass_end = np.array([b.n_end for b in P.bass_notes], dtype=np.int64)

    ret = np.vstack([signal.butter(2, 200, 'hp', fs=FS, output='sos'),
                     signal.butter(2, 6500, 'lp', fs=FS, output='sos'), rbj_peak(4000, -3.0, 1.0)])
    ir_rev = signal.sosfilt(ret, P.ir_rev, axis=-1) * undb(LV['rev_return'])
    h_dly = make_delay_ir(0.75 * beat)                 # dotted eighth
    dmono = 0.5 * (h_dly[0] + h_dly[1])
    dly_rev = np.stack([signal.fftconvolve(dmono, P.ir_rev[c]) for c in range(2)])
    h_tot = np.zeros((2, max(h_dly.shape[1], dly_rev.shape[1])))
    h_tot[:, :h_dly.shape[1]] += h_dly
    h_tot[:, :dly_rev.shape[1]] += 0.35 * dly_rev
    h_tot = signal.sosfilt(ret, h_tot, axis=-1) * undb(LV['dly_return'])
    P.wet_len = max(ir_rev.shape[1], h_tot.shape[1])
    P.nfft = sfft.next_fast_len(BLOCK + P.wet_len - 1, real=True)
    P.H_rev = sfft.rfft(ir_rev, P.nfft, axis=-1)
    P.H_dly = sfft.rfft(h_tot, P.nfft, axis=-1)
    P.HOME = HOME
    return P


# ============================================================================ block renderer (workers)
def pad_env(tau, A, dur, R):
    env = np.ones_like(tau)
    m = tau < A
    env[m] = np.sin(0.5 * np.pi * tau[m] / A) ** 2
    lvl_off = math.sin(0.5 * math.pi * min(dur, A) / A) ** 2 if dur < A else 1.0
    r = tau >= dur
    if np.any(r):
        u = np.clip((tau[r] - dur) / R, 0.0, 1.0)
        env[r] = lvl_off * (0.5 + 0.5 * np.cos(np.pi * u))
    return env


def render_block(P, bi):
    b0 = bi * BLOCK
    b1 = min(P.N, b0 + BLOCK)
    L = b1 - b0
    t = (b0 + np.arange(L)) / FS
    pad = np.zeros((2, L))
    arp = np.zeros((2, L))
    perc = np.zeros((2, L))
    fx = np.zeros((2, L))
    bass = np.zeros(L)
    srev = np.zeros(L)
    sdly = np.zeros(L)

    # ---- pads: detuned band-limited wavetable oscillators with slow drift + breathing
    for j in np.nonzero((P.pad_on < b1) & (P.pad_end > b0))[0]:
        nt = P.pad_notes[j]
        s, e = max(b0, nt.n_on), min(b1, nt.n_end)
        if s >= e:
            continue
        tau = (np.arange(s, e) - nt.n_on) / FS
        env = pad_env(tau, nt.attack, nt.t_off - nt.t_on, nt.release) * nt.gain
        env *= 1.0 + 0.07 * sin32(nt.br[0] * tau + nt.br[1] / TWO_PI)
        tab = P.tables[nt.midi]
        f0 = midi_hz(nt.midi)
        accL = np.zeros(e - s)
        accR = np.zeros(e - s)
        for (ratio, pan, ph0, dr, dd, dph, amp) in nt.oscs:
            f = f0 * ratio
            cyc = f * tau + ph0 - (f * dd / (TWO_PI * dr)) * (cos32(dr * tau + dph / TWO_PI) - math.cos(dph))
            x = frac(cyc) * TAB
            i = np.minimum(x.astype(np.int32), TAB - 1)
            fr = (x - i).astype(np.float32)
            a = tab[i]
            y = a + (tab[i + 1] - a) * fr
            gl, gr = pan_gains(pan)
            accL += (amp * gl) * y
            accR += (amp * gr) * y
        k = 1.0 / math.sqrt(3.0)
        pad[0, s - b0:e - b0] += accL * env * k
        pad[1, s - b0:e - b0] += accR * env * k
    pad *= (P.cur['pad_gain'](t) * undb(LV['pad']))[None, :]
    srev += 0.5 * (pad[0] + pad[1]) * P.cur['pad_rev'](t)

    # ---- sub bass: sine + soft 2nd/3rd/4th harmonics (audible on small speakers)
    for j in np.nonzero((P.bass_on < b1) & (P.bass_end > b0))[0]:
        bn = P.bass_notes[j]
        s, e = max(b0, bn.n_on), min(b1, bn.n_end)
        if s >= e:
            continue
        tau = (np.arange(s, e) - bn.n_on) / FS
        c = midi_hz(bn.midi) * (np.arange(s, e) / FS)          # absolute-time phase: coherent re-entries
        s1 = sin32(c)
        c1 = cos32(c)
        s2 = 2 * s1 * c1
        y = s1 + 0.22 * s2 + 0.07 * s1 * (3 - 4 * s1 * s1) + 0.035 * 2 * s2 * (1 - 2 * s1 * s1)
        shape = pad_env(tau, bn.attack, bn.t_off - bn.t_on, bn.release)
        lvl = np.full(len(tau), bn.levels[0][1])
        for k in range(1, len(bn.levels)):                      # velocity changes of a merged note
            ta, v1 = bn.levels[k]
            dv = v1 - bn.levels[k - 1][1]
            if dv != 0.0:
                u = np.clip((tau - (ta - bn.t_on)) / 0.04, 0.0, 1.0)
                lvl += dv * (0.5 - 0.5 * np.cos(np.pi * u))
        env = shape * lvl
        for (ta, depth) in bn.accents:                          # soft re-articulation bump
            d = tau - (ta - bn.t_on)
            m = (d > 0) & (d < 0.6)
            if np.any(m):
                dd = d[m]
                env[m] *= 1.0 + depth * np.minimum(1.0, dd / 0.03) ** 2 * (0.5 + 0.5 * np.cos(np.pi * dd / 0.6))
        bass[s - b0:e - b0] += y * env * bn.gain
    bass *= P.cur['bass'](t) * P.cur['e_bass'](t)
    if len(P.kick_t):                    # gentle 'sidechain': the sub dips ~3 dB under each soft kick
        k0 = int(np.searchsorted(P.kick_t, (b0 / FS) - 0.4))
        k1 = int(np.searchsorted(P.kick_t, b1 / FS))
        if k1 > k0:
            duck = np.ones(L)
            for tk, gk in zip(P.kick_t[k0:k1], P.kick_g[k0:k1]):
                d = t - tk
                m = (d > -0.004) & (d < 0.3)
                dd = d[m]                                         # finite support: exactly 1.0 outside
                w = np.where(dd < 0, np.sin(0.5 * np.pi * (dd + 0.004) / 0.004) ** 2,
                             (0.5 + 0.5 * np.cos(np.pi * dd / 0.3)) ** 1.5)
                duck[m] *= 1.0 - min(0.32, 0.32 * gk / undb(LV['kick'])) * w
            bass *= duck

    # ---- sample-bank events (arp, bells, percussion, risers, swells)
    lo = int(np.searchsorted(P.ev_n0, b0 - P.ev_maxlen, side='left'))
    hi = int(np.searchsorted(P.ev_n0, b1, side='left'))
    buses = (arp, perc, fx)
    for j in range(lo, hi):
        n0, ln = int(P.ev_n0[j]), int(P.ev_len[j])
        if n0 + ln <= b0:
            continue
        _, key, gain, pan, bus, rev, dly = P.events[j]
        smp = P.bank[key]
        s, e = max(b0, n0), min(b1, n0 + ln)
        seg = smp[..., s - n0:e - n0]
        out = buses[bus]
        if seg.ndim == 2:
            out[:, s - b0:e - b0] += gain * seg
            mono = 0.5 * (seg[0] + seg[1])
        else:
            gl, gr = pan_gains(pan)
            out[0, s - b0:e - b0] += (gain * gl) * seg
            out[1, s - b0:e - b0] += (gain * gr) * seg
            mono = seg
        if rev > 0 or dly > 0:
            if bus == 0:
                rs = rev * float(P.cur['arp_rev'](n0 / FS))
                ds = dly * float(P.cur['arp_dly'](n0 / FS))
            else:
                rs, ds = rev, dly
            if rs > 0:
                srev[s - b0:e - b0] += (gain * rs) * mono
            if ds > 0:
                sdly[s - b0:e - b0] += (gain * ds) * mono

    # ---- wet paths: reverb + (ping-pong delay -> reverb) as one FFT convolution each
    Xr = sfft.rfft(srev, P.nfft)
    Xd = sfft.rfft(sdly, P.nfft)
    wl = L + P.wet_len - 1
    wet = np.stack([sfft.irfft(Xr * P.H_rev[c] + Xd * P.H_dly[c], P.nfft)[:wl] for c in range(2)])
    f32 = np.float32
    bright = np.clip(P.cur['pad_bright'](t) * P.cur['bright_mod'](t), 0.05, 1.0)
    return dict(L=L, pad=pad.astype(f32), arp=arp.astype(f32), perc=perc.astype(f32),
                fx=fx.astype(f32), bass=bass.astype(f32), wet=wet.astype(f32),
                bright=bright.astype(f32), mgain=master_gain(P, t).astype(f32))


_PLAN = None
_P2 = None


def _worker(bi):
    return render_block(_PLAN, bi)


def _p2_worker(b0):
    return pass2_block(_P2, b0)


def ordered_map(fn, items, workers):
    """Ordered parallel map over fork()ed workers with a bounded number of blocks in flight."""
    items = list(items)
    if workers <= 1 or len(items) <= 1:
        for it in items:
            yield it, fn(it)
        return
    ctx = mp.get_context('fork')
    with ProcessPoolExecutor(max_workers=workers, mp_context=ctx) as ex:
        futs, nxt = {}, 0
        for k in range(len(items)):
            while nxt < len(items) and nxt < k + 2 * workers:
                futs[nxt] = ex.submit(fn, items[nxt])
                nxt += 1
            yield items[k], futs.pop(k).result()


def iterate_blocks(P, nblocks, workers):
    global _PLAN
    _PLAN = P
    yield from ordered_map(_worker, range(nblocks), workers)


def master_gain(P, t):
    """Soft intro fade-in and a resolving outro fade that reaches exactly zero at the end."""
    g = np.sin(0.5 * np.pi * np.clip(t / P.fade_in, 0, 1)) ** 2
    return g * np.sin(0.5 * np.pi * np.clip((P.T - t) / P.fade_out, 0, 1)) ** 3


# ============================================================================ main-process DSP
KW_SOS = np.array([[1.53512485958697, -2.69169618940638, 1.19839281085285, 1.0, -1.69065929318241, 0.73248077421585],
                   [1.0, -2.0, 1.0, 1.0, -1.99004745483398, 0.99007225036621]])


class LoudnessMeter:
    """Streaming ITU-R BS.1770-4 integrated loudness (K-weighting, 400 ms / 75 % overlap, gating)."""

    def __init__(self):
        self.zi = np.zeros((2, 2, 2))
        self.hop = FS // 10
        self.part = 0.0
        self.cnt = 0
        self.seg = []

    def add(self, x):
        y, self.zi = signal.sosfilt(KW_SOS, x, axis=-1, zi=self.zi)
        p = y[0] ** 2 + y[1] ** 2
        i = 0
        n = p.shape[0]
        while i < n:
            take = min(self.hop - self.cnt, n - i)
            self.part += float(np.sum(p[i:i + take]))
            self.cnt += take
            i += take
            if self.cnt == self.hop:
                self.seg.append(self.part / self.hop)
                self.part, self.cnt = 0.0, 0

    def integrated(self):
        seg = np.array(self.seg)
        if len(seg) < 4:
            return -70.0
        z = np.convolve(seg, np.ones(4) / 4.0, mode='valid')
        lk = -0.691 + 10 * np.log10(z + 1e-30)
        za = z[lk > -70.0]
        if len(za) == 0:
            return -70.0
        rel = -0.691 + 10 * np.log10(np.mean(za)) - 10.0
        zr = z[(lk > -70.0) & (lk > rel)]
        return float(-0.691 + 10 * np.log10(np.mean(zr)))


def tape(x, drive=1.25, bias=0.08):
    """Gentle asymmetric tape-style saturation with unity small-signal gain."""
    tb = math.tanh(drive * bias)
    return (np.tanh(drive * (x + bias)) - tb) / (drive * (1.0 - tb * tb))


class Master:
    def __init__(self, P):
        self.P = P
        self.pad_sos = signal.butter(1, 750, 'lp', fs=FS, output='sos')
        self.pad_zi = np.zeros((1, 2, 2))
        self.eq = np.vstack([signal.butter(2, 28, 'hp', fs=FS, output='sos'),
                             rbj_shelf(95, 0.8, 'low'),          # tape head-bump warmth
                             rbj_peak(300, -1.5, 0.9),           # keep low-mids clear of mud
                             rbj_peak(1900, -1.5, 0.7),          # leave space in the mids
                             rbj_peak(4200, -3.0, 0.9),          # no harshness at 3-6 kHz
                             rbj_shelf(9500, -1.5, 'high')])
        self.eq_zi = np.zeros((self.eq.shape[0], 2, 2))
        self.dc = signal.butter(1, 10, 'hp', fs=FS, output='sos')
        self.dc_zi = np.zeros((1, 2, 2))
        self.side = signal.butter(2, 120, 'hp', fs=FS, output='sos')
        self.side_zi = np.zeros((1, 2))

    def process(self, b0, res, wet, want_stems=False):
        pad = res['pad'].astype(np.float64)
        lp, self.pad_zi = signal.sosfilt(self.pad_sos, pad, axis=-1, zi=self.pad_zi)
        padf = lp + res['bright'][None, :] * (pad - lp)  # variable first-order high shelf
        mix = padf + res['bass'][None, :] + res['arp'] + res['perc'] + res['fx'] + wet
        stems = None
        if want_stems:
            stems = dict(pad=padf, bass=np.repeat(res['bass'][None, :].astype(np.float64), 2, 0),
                         arp=res['arp'], perc=res['perc'], fx=res['fx'], wet=wet)
        mix, self.eq_zi = signal.sosfilt(self.eq, mix, axis=-1, zi=self.eq_zi)
        mix = tape(mix)
        mix, self.dc_zi = signal.sosfilt(self.dc, mix, axis=-1, zi=self.dc_zi)
        mid = 0.5 * (mix[0] + mix[1])
        side = 0.5 * (mix[0] - mix[1])
        side, self.side_zi = signal.sosfilt(self.side, side, zi=self.side_zi)
        side *= 1.06
        g = res['mgain'][None, :]
        mix = np.stack([mid + side, mid - side]) * g
        if stems:
            stems = {k: v * g for k, v in stems.items()}
        return mix, stems


def limiter_gain(x, ceiling_db, la, hold, thr_db=None, knee_db=4.0, ratio=4.0):
    """Look-ahead soft-knee true-peak limiter for x (n, 2). Returns (gain, per-sample 4x peak, exact)."""
    sp = np.abs(x).max(axis=1)
    if 20 * np.log10(float(sp.max()) + 1e-12) < ceiling_db - 9.0:
        return np.ones(len(sp)), sp, False          # far below the knee: unity gain, no oversampling
    up = signal.resample_poly(x, 4, 1, axis=0)
    pk = np.abs(up).max(axis=1)
    pk = pk[: (len(pk) // 4) * 4].reshape(-1, 4).max(axis=1)
    pk = np.maximum(pk, sp[:len(pk)])
    if len(pk) < x.shape[0]:
        pk = np.concatenate([pk, sp[len(pk):]])
    lvl = 20 * np.log10(pk + 1e-12)
    thr = ceiling_db - 2.5 if thr_db is None else thr_db
    over = lvl - thr
    W = knee_db
    G = np.where(over <= -W / 2, 0.0,
                 np.where(over < W / 2, (1 / ratio - 1) * (over + W / 2) ** 2 / (2 * W), (1 / ratio - 1) * over))
    G = np.minimum(G, ceiling_db - lvl)
    g_req = 10 ** (np.minimum(G, 0.0) / 20.0)
    size = hold + la + 1
    g_hold = minimum_filter1d(g_req, size, origin=hold - size // 2, mode='nearest')
    g = uniform_filter1d(g_hold, la + 1, origin=la - (la + 1) // 2, mode='nearest')
    return g, pk, True


def pass2_block(cfg, b0):
    """Normalise + limit + dither one block (reads the float32 pre-master with look-around context)."""
    N, pre, gain = cfg['N'], cfg['pre'], cfg['gain']
    la, hold, lsb = cfg['la'], cfg['hold'], 2.0 ** -23
    ctx = la + hold + 256
    b1 = min(N, b0 + BLOCK)
    c0, c1 = max(0, b0 - ctx), min(N, b1 + ctx)
    x = np.asarray(pre[c0:c1], dtype=np.float64) * gain
    g, pk, exact = limiter_gain(x, cfg['ceiling'], la, hold)
    sl = slice(b0 - c0, b1 - c0)
    y = x[sl] * g[sl, None]
    tp = 20 * math.log10(float(np.max(pk[sl] * g[sl])) + 1e-12)
    gr = float(-20 * np.log10(np.min(g[sl])))
    rng = rng_for(cfg['seed'], 'dither', b0)
    if DITHER:
        y = y + (rng.random(y.shape) - rng.random(y.shape)) * lsb      # TPDF dither, 1 LSB
    y = np.clip(y, -1.0, 1.0 - lsb)
    return y.astype(np.float32), tp, exact, gr


def render(P, out_path, lufs=-18.0, ceiling=-1.0, workers=4, stems_dir=None, log=print, normalize=True):
    global _P2
    N = P.N
    nblocks = (N + BLOCK - 1) // BLOCK
    out_dir = os.path.dirname(os.path.abspath(out_path)) or '.'
    tmpdir = tempfile.mkdtemp(prefix='.genmusic_', dir=out_dir)
    timings = {}
    try:
        # ---- pass 1: synthesis (workers) + stateful bus/master chain (here) -> float32 pre-master
        pre = np.memmap(os.path.join(tmpdir, 'pre.f32'), dtype=np.float32, mode='w+', shape=(N, 2))
        stem_mm = {}
        if stems_dir:
            for k in ('pad', 'bass', 'arp', 'perc', 'fx', 'wet'):
                stem_mm[k] = np.memmap(os.path.join(tmpdir, f'{k}.f32'), dtype=np.float32, mode='w+', shape=(N, 2))
        meter = LoudnessMeter()
        master = Master(P)
        ola = np.zeros((2, BLOCK + P.wet_len))
        t0 = time.perf_counter()
        for bi, res in iterate_blocks(P, nblocks, workers):
            b0 = bi * BLOCK
            L = res['L']
            wet = res['wet']
            ola[:, :wet.shape[1]] += wet                     # overlap-add of reverb/delay tails
            wnow = ola[:, :L].copy()
            ola[:, :-L] = ola[:, L:]
            ola[:, -L:] = 0.0
            mix, stems = master.process(b0, res, wnow, bool(stem_mm))
            pre[b0:b0 + L] = mix.T
            for k, mm in stem_mm.items():
                mm[b0:b0 + L] = stems[k].T
            meter.add(mix)
        pre.flush()
        timings['pass1'] = time.perf_counter() - t0
        I_pre = meter.integrated()
        gain_db = (lufs - I_pre) if normalize else 0.0
        gain = undb(gain_db)
        log(f"  pass 1: pre-master integrated {I_pre:.2f} LUFS -> gain {gain_db:+.2f} dB "
            f"({timings['pass1']:.1f} s)")

        # ---- pass 2: normalise, look-ahead true-peak limiter, dither, 24-bit write (parallel blocks)
        t0 = time.perf_counter()
        _P2 = dict(N=N, pre=pre, gain=gain, ceiling=ceiling, la=int(0.008 * FS), hold=int(0.05 * FS), seed=P.seed)
        meter2 = LoudnessMeter()
        tp_ex, tp_lb, gr_max, peak = -200.0, -200.0, 0.0, 0.0
        with sf.SoundFile(out_path, 'w', FS, 2, 'PCM_24') as f:
            for b0, (y, tp, exact, gr) in ordered_map(_p2_worker, range(0, N, BLOCK), workers):
                f.write(y)
                meter2.add(y.T.astype(np.float64))
                if exact:
                    tp_ex = max(tp_ex, tp)                    # 4x-oversampled true peak
                else:
                    tp_lb = max(tp_lb, tp)                    # block far below ceiling: sample peak
                gr_max = max(gr_max, gr)
                peak = max(peak, float(np.max(np.abs(y))))
        if stems_dir:
            os.makedirs(stems_dir, exist_ok=True)
            lsb = 2.0 ** -23
            for k, mm in stem_mm.items():
                with sf.SoundFile(os.path.join(stems_dir, f'{k}.wav'), 'w', FS, 2, 'PCM_24') as f:
                    for b0 in range(0, N, BLOCK):
                        f.write(np.clip(np.asarray(mm[b0:b0 + BLOCK], np.float64) * gain, -1, 1 - lsb))
        timings['pass2'] = time.perf_counter() - t0
        tp_max = max(tp_ex, tp_lb)
        stats = dict(pre_lufs=I_pre, gain_db=gain_db, lufs=meter2.integrated(), true_peak_dbtp=tp_max,
                     true_peak_exact=bool(tp_ex >= tp_lb),
                     sample_peak_dbfs=20 * math.log10(peak + 1e-12), max_gain_reduction_db=gr_max)
        tps = f"true peak {tp_max:.2f} dBTP" + ("" if tp_ex >= tp_lb else " (sample-peak bound)")
        log(f"  pass 2: {stats['lufs']:.2f} LUFS, {tps}, sample peak {stats['sample_peak_dbfs']:.2f} dBFS, "
            f"limiter max GR {gr_max:.2f} dB ({timings['pass2']:.1f} s)")
        return stats, timings
    finally:
        _P2 = None
        shutil.rmtree(tmpdir, ignore_errors=True)


def plan_json(P):
    return dict(
        bpm=P.bpm, beat_sec=P.beat, bar_sec=P.bar, duration_sec=P.T, samples=P.N, home=P.HOME.name,
        sections=[dict(name=s.name, start=s.start, end=s.end, snapped_start=round(s.s0, 4), energy=s.energy,
                       lift=s.lift, mode=s.mode.name, motif=dict(id=s.motif.mid, rhythm=s.motif.rhythm,
                                                                 contour=s.motif.contour, new=s.new_motif),
                       phrases=[[c[2].name for c in ph.chords] for ph in s.phrases]) for s in P.secs],
        chords=[dict(t=round(sp[0], 4), end=round(sp[1], 4), chord=sp[2].name) for sp in P.spans],
        lifts=[round(t, 4) for t in P.lift_times], final_chord_at=round(P.t_final, 4),
        fade_in_sec=P.fade_in, fade_out_sec=P.fade_out)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('sections')
    ap.add_argument('out')
    ap.add_argument('--seed', type=int, default=1)
    ap.add_argument('--bpm', type=float, default=92.0)
    ap.add_argument('--key', default='A', help='home tonic (minor), default A')
    ap.add_argument('--lufs', type=float, default=-18.0, help='integrated loudness target (default -18)')
    ap.add_argument('--ceiling', type=float, default=-1.0, help='true-peak ceiling dBTP (default -1)')
    ap.add_argument('--no-normalize', action='store_true')
    ap.add_argument('--workers', type=int, default=min(4, os.cpu_count() or 1))
    ap.add_argument('--plan', help='write the musical plan (sections, chords, lifts) as JSON')
    ap.add_argument('--stems', help='also write bus stems (pad/bass/arp/perc/fx/wet) into this dir')
    ap.add_argument('--quiet', action='store_true')
    a = ap.parse_args(argv)
    log = (lambda *x, **k: None) if a.quiet else (lambda *x, **k: print(*x, **k, flush=True))
    with open(a.sections, encoding='utf-8') as f:
        raw = json.load(f)
    if isinstance(raw, dict):
        raw = raw.get('sections', [])
    if not raw:
        sys.exit('sections.json: no sections')
    t0 = time.perf_counter()
    P = build_plan(raw, a.seed, a.bpm, a.key, log=log)
    t_plan = time.perf_counter() - t0
    log(f"gen_music: {P.T:.2f} s, {len(P.secs)} sections, {len(P.spans)} chords, {len(P.events)} events, "
        f"{len(P.pad_notes)} pad notes, plan+bank {t_plan:.1f} s")
    for s in P.secs:
        log(f"  [{s.s0:7.2f}-{s.s1:7.2f}] {s.name:<12} e={s.energy:.2f} lift={int(s.lift)} {s.mode.name:<11} "
            f"motif#{s.motif.mid} {s.motif.rhythm}/{s.motif.contour}  " +
            ' | '.join(' '.join(c[2].name for c in ph.chords) for ph in s.phrases))
    stats, tm = render(P, a.out, a.lufs, a.ceiling, a.workers, a.stems, log, not a.no_normalize)
    total = time.perf_counter() - t0
    stats.update(plan_sec=t_plan, pass1_sec=tm['pass1'], pass2_sec=tm['pass2'], total_sec=total,
                 realtime_factor=P.T / total)
    log(f"  done: {a.out}  total {total:.1f} s ({P.T / total:.1f}x realtime)")
    if a.plan:
        pj = plan_json(P)
        pj['render'] = stats
        with open(a.plan, 'w', encoding='utf-8') as f:
            json.dump(pj, f, indent=1, ensure_ascii=False)
    return stats


if __name__ == '__main__':
    main()
