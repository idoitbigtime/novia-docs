#!/usr/bin/env python3
"""analyze_audio.py - "ears-free" review of a rendered WAV: metrics + spectrogram PNGs.

    analyze_audio.py in.wav [--plan plan.json | --sections sections.json] [--cues cues.json]
                     [--out review/prefix] [--width 1800] [--title TEXT] [--no-zoom] [--no-ssm]

Writes  <out>_overview.png  log-frequency spectrogram + spectral centroid, section lines, cue marks,
                            waveform envelope and short-term loudness strips
        <out>_hf.png        linear 1.5-16 kHz spectrogram (harshness check)
        <out>_zoom.png      +-1.2 s around every section boundary (fine resolution) + |dx| trace
        <out>_ssm.png       bar-level self-similarity matrix (static repetition check)
        <out>_metrics.json  loudness (pyloudnorm + ffmpeg ebur128), true peak, crest factor,
                            centroid over time, band energies, stereo, discontinuities, clicks
"""
import argparse
import json
import math
import os
import re
import subprocess

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from PIL import Image, ImageDraw, ImageFont
from scipy import signal
from scipy.ndimage import maximum_filter1d

KW_SOS = np.array([[1.53512485958697, -2.69169618940638, 1.19839281085285, 1.0, -1.69065929318241, 0.73248077421585],
                   [1.0, -2.0, 1.0, 1.0, -1.99004745483398, 0.99007225036621]])
BANDS = [(20, 60), (60, 250), (250, 500), (500, 2000), (2000, 3000), (3000, 6000), (6000, 12000), (12000, 24000)]

_ANCH = np.array([[0, 0, 4], [31, 12, 72], [85, 15, 109], [136, 34, 106], [186, 54, 85], [227, 89, 51],
                  [249, 140, 10], [249, 201, 50], [252, 255, 164]], float)
LUT = np.stack([np.interp(np.linspace(0, 1, 256), np.linspace(0, 1, len(_ANCH)), _ANCH[:, c]) for c in range(3)],
               axis=1).astype(np.uint8)


def font(size=13):
    try:
        return ImageFont.load_default(size=size)
    except Exception:
        return ImageFont.load_default()


# ------------------------------------------------------------------ measurements
def ffmpeg_ebur128(path):
    try:
        r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-filter_complex',
                            'ebur128=peak=true:framelog=quiet', '-f', 'null', '-'],
                           capture_output=True, text=True, timeout=600)
        txt = r.stderr
        summ = txt[txt.rfind('Summary:'):]
        g = lambda pat: float(re.search(pat, summ, re.S).group(1))
        return dict(I=g(r'I:\s+(-?[\d.]+) LUFS'), LRA=g(r'LRA:\s+(-?[\d.]+) LU'),
                    true_peak=g(r'True peak:\s+Peak:\s+(-?[\d.inf]+) dBFS'))
    except Exception as e:
        return dict(error=str(e))


def true_peak_db(x, chunk=1 << 20):
    m = 0.0
    for s in range(0, len(x), chunk):
        seg = x[max(0, s - 64):s + chunk + 64]
        m = max(m, float(np.max(np.abs(signal.resample_poly(seg, 4, 1, axis=0)))))
    return 20 * math.log10(m + 1e-12)


def kweighted_power(x):
    y = signal.sosfilt(KW_SOS, x, axis=0)
    return (y ** 2).sum(axis=1)


def windowed_lufs(p, fs, win, hop):
    c = np.concatenate([[0.0], np.cumsum(p)])
    n = len(p)
    starts = np.arange(0, max(1, n - int(win * fs)) + 1, int(hop * fs))
    ms = (c[np.minimum(starts + int(win * fs), n)] - c[starts]) / (win * fs)
    return (starts + 0.5 * win * fs) / fs, -0.691 + 10 * np.log10(ms + 1e-20)


def centroid_track(mono, fs, hop_s=0.25, nfft=8192):
    hop = int(hop_s * fs)
    w = np.hanning(nfft)
    f = np.fft.rfftfreq(nfft, 1 / fs)
    ts, cs, rms = [], [], []
    for s in range(0, len(mono) - nfft, hop):
        X = np.abs(np.fft.rfft(mono[s:s + nfft] * w)) ** 2
        tot = X.sum()
        ts.append((s + nfft / 2) / fs)
        cs.append(float((f * X).sum() / tot) if tot > 1e-18 else 0.0)
        rms.append(float(np.sqrt(np.mean(mono[s:s + nfft] ** 2))))
    return np.array(ts), np.array(cs), np.array(rms)


def band_fractions(mono, fs):
    nfft = 1 << 15
    f, P = signal.welch(mono, fs, nperseg=nfft, noverlap=nfft // 2)
    tot = P.sum()
    return {f"{a}-{b}": float(P[(f >= a) & (f < b)].sum() / tot) for a, b in BANDS}, f, P


def lpc_residual(x, order=32, frame=4096):
    """Per-frame linear-prediction residual (autocorrelation method). Tonal music is predictable,
    so its residual is small and noise-like; a discontinuity or click leaves a large isolated spike."""
    from scipy.linalg import solve_toeplitz
    n = len(x)
    e = np.zeros(n)
    win = np.hanning(frame + 2 * order)
    for s0 in range(0, n, frame):
        a0, b0 = max(0, s0 - order), min(n, s0 + frame + order)
        seg = x[a0:b0]
        if len(seg) <= 2 * order or not np.any(seg):
            continue
        w = seg * (win[:len(seg)] if len(seg) == len(win) else np.hanning(len(seg)))
        r = np.correlate(w, w, 'full')[len(w) - 1:len(w) + order]
        r[0] *= 1.0 + 1e-6
        r[0] += 1e-12
        try:
            c = solve_toeplitz(r[:order], r[1:order + 1])
        except Exception:
            continue
        aa = np.concatenate([[1.0], -c])
        res = signal.lfilter(aa, [1.0], x[max(0, s0 - order):min(n, s0 + frame)])
        k = s0 - max(0, s0 - order)
        e[s0:min(n, s0 + frame)] = res[k:]
    return e


def click_scan(x, fs, thresh=10.0, spike=5.0):
    """Click detector on the LPC residual (max over channels): a residual peak far above the robust
    residual level of its +-0.25 s neighbourhood AND spiky (peak >> RMS of the surrounding 2 ms;
    note onsets spread over several ms, a discontinuity lasts 1-2 samples).
    Returns ([(t, ratio, spikiness)], (max ratio, max spikiness))."""
    e = np.max(np.abs(np.stack([lpc_residual(x[:, c]) for c in range(x.shape[1])], axis=1)), axis=1)
    hop = int(0.01 * fs)
    nfr = len(e) // hop
    fr = e[: nfr * hop].reshape(-1, hop)
    fmax = fr.max(axis=1)
    farg = fr.argmax(axis=1) + np.arange(nfr) * hop
    fmed = np.median(fr, axis=1)
    k = 25
    bg = np.array([np.median(fmed[max(0, i - k):i + k + 1]) for i in range(nfr)]) * 1.4826
    floor = 1e-7
    ratio = fmax / np.maximum(bg, floor)
    w = int(0.002 * fs)
    rms = np.sqrt(np.convolve(e ** 2, np.ones(w) / w, mode='same'))
    sp = e[farg] / np.maximum(rms[farg], 1e-12)
    idx = np.nonzero((ratio > thresh) & (sp > spike))[0]
    return [(round(float(farg[i] / fs), 4), round(float(ratio[i]), 1), round(float(sp[i]), 1)) for i in idx], \
        (float(np.max(ratio)) if nfr else 0.0, float(np.max(sp)) if nfr else 0.0)


def boundary_jumps(x, fs, times, win=0.06, ctx=2.0):
    out = []
    d1 = np.abs(np.diff(x, axis=0)).max(axis=1)
    for t in times:
        c = int(t * fs)
        a, b = max(0, c - int(win * fs)), min(len(d1), c + int(win * fs))
        if b <= a:
            continue
        lo, hi = max(0, c - int(ctx * fs)), min(len(d1), c + int(ctx * fs))
        bgm = np.concatenate([d1[lo:a], d1[b:hi]])
        ref = float(np.percentile(bgm, 99.9)) if len(bgm) else 1e-9
        mx = float(d1[a:b].max())
        out.append(dict(t=round(t, 4), max_jump=round(mx, 6), ref_p999=round(ref, 6),
                        ratio=round(mx / max(ref, 1e-9), 2)))
    return out


def bar_ssm(mono, fs, bar_sec, offset=0.0):
    """Self-similarity of per-bar 'chroma + coarse spectrum' vectors (cosine)."""
    nb = int((len(mono) / fs - offset) // bar_sec)
    if nb < 2:
        return None, None
    feats = []
    nfft = 8192
    f = np.fft.rfftfreq(nfft, 1 / fs)
    valid = (f > 50) & (f < 5000)
    pc = np.round(12 * np.log2(np.maximum(f, 1) / 440.0)).astype(int) % 12
    edges = np.geomspace(40, 16000, 25)
    for b in range(nb):
        s = int((offset + b * bar_sec) * fs)
        seg = mono[s:s + int(bar_sec * fs)]
        P = np.zeros(nfft // 2 + 1)
        for k in range(0, len(seg) - nfft, nfft // 2):
            P += np.abs(np.fft.rfft(seg[k:k + nfft] * np.hanning(nfft))) ** 2
        chroma = np.array([P[valid & (pc == c)].sum() for c in range(12)])
        chroma /= np.linalg.norm(chroma) + 1e-12
        spec = np.array([P[(f >= edges[i]) & (f < edges[i + 1])].sum() for i in range(24)])
        spec = np.log10(spec + 1e-12)
        spec -= spec.mean()
        spec /= np.linalg.norm(spec) + 1e-12
        feats.append(np.concatenate([chroma, 0.5 * spec]))
    F = np.array(feats)
    F /= np.linalg.norm(F, axis=1, keepdims=True) + 1e-12
    return F @ F.T, F


# ------------------------------------------------------------------ images
def stft_columns(mono, fs, t0, t1, width, nfft):
    """Power spectra for `width` time columns between t0 and t1 (mean-pooled sub-frames)."""
    dt = (t1 - t0) / width
    hop = max(16, min(int(dt * fs), nfft // 4))
    sub = max(1, int(round(dt * fs / hop)))
    w = np.hanning(nfft)
    cols = []
    pad = np.pad(mono, (nfft, nfft))
    for i in range(width):
        c = t0 + (i + 0.5) * dt
        acc = 0
        for k in range(sub):
            cc = int((c - dt / 2 + (k + 0.5) * dt / sub) * fs) + nfft
            seg = pad[cc - nfft // 2: cc + nfft // 2]
            if len(seg) < nfft:
                seg = np.pad(seg, (0, nfft - len(seg)))
            acc = acc + np.abs(np.fft.rfft(seg * w)) ** 2
        cols.append(acc / sub)
    return np.array(cols).T * (2.0 / np.sum(w) ** 2)        # (bins, width), sine of amp A -> A^2/2


def spec_image(P, fs, nfft, fmin, fmax, height, logf=True, db_lo=-110.0, db_hi=-25.0):
    f = np.fft.rfftfreq(nfft, 1 / fs)
    rows = np.geomspace(fmax, fmin, height) if logf else np.linspace(fmax, fmin, height)
    idx = np.interp(rows, f, np.arange(len(f)))
    i0 = np.floor(idx).astype(int)
    fr = idx - i0
    i1 = np.minimum(i0 + 1, len(f) - 1)
    D = 10 * np.log10(P + 1e-20)
    img = D[i0] * (1 - fr)[:, None] + D[i1] * fr[:, None]
    u = np.clip((img - db_lo) / (db_hi - db_lo), 0, 1)
    return LUT[(u * 255).astype(int)], rows


def fy(freq, fmin, fmax, height, logf=True):
    if logf:
        return int(round((math.log(fmax) - math.log(freq)) / (math.log(fmax) - math.log(fmin)) * (height - 1)))
    return int(round((fmax - freq) / (fmax - fmin) * (height - 1)))


def draw_spec_panel(canvas, x0, y0, mono, fs, t0, t1, width, height, fmin, fmax, logf, nfft, title,
                    marks=(), cues=(), centroid=None, db=(-110, -25)):
    P = stft_columns(mono, fs, t0, t1, width, nfft)
    rgb, _ = spec_image(P, fs, nfft, fmin, fmax, height, logf, *db)
    canvas.paste(Image.fromarray(rgb), (x0, y0))
    d = ImageDraw.Draw(canvas)
    fnt = font(12)
    ticks = [50, 100, 200, 500, 1000, 2000, 3000, 6000, 10000] if logf else \
        [2000, 3000, 4000, 6000, 8000, 10000, 12000, 14000, 16000]
    for fq in ticks:
        if fmin < fq < fmax:
            y = y0 + fy(fq, fmin, fmax, height, logf)
            d.line([(x0 - 5, y), (x0, y)], fill=(200, 200, 200))
            d.text((x0 - 48, y - 7), f"{fq / 1000:g}k" if fq >= 1000 else f"{fq}", fill=(220, 220, 220), font=fnt)
            col = (90, 200, 255) if fq in (3000, 6000) else (60, 60, 70)
            for xx in range(x0, x0 + width, 6):
                d.point((xx, y), fill=col)
    tx = lambda t: x0 + int(round((t - t0) / (t1 - t0) * width))
    for t, lab in marks:
        if t0 <= t <= t1:
            x = tx(t)
            for yy in range(y0, y0 + height, 4):
                d.line([(x, yy), (x, yy + 1)], fill=(255, 255, 255))
            d.text((x + 3, y0 + 3), lab, fill=(255, 255, 255), font=fnt)
    for t, lab in cues:
        if t0 <= t <= t1:
            x = tx(t)
            d.polygon([(x - 5, y0 + height - 1), (x + 5, y0 + height - 1), (x, y0 + height - 10)], fill=(0, 255, 140))
            d.text((x - 10, y0 + height - 24), lab, fill=(0, 255, 140), font=font(11))
    if centroid is not None:
        ts, cs = centroid
        pts = [(tx(t), y0 + fy(max(fmin, min(fmax * 0.999, c)), fmin, fmax, height, logf))
               for t, c in zip(ts, cs) if t0 <= t <= t1 and c > 0]
        if len(pts) > 1:
            d.line(pts, fill=(120, 255, 255), width=2)
    d.text((x0, y0 - 18), title, fill=(255, 255, 255), font=font(14))
    span = t1 - t0
    step = next(s for s in (0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120) if span / s <= 16)
    t = math.ceil(t0 / step) * step
    while t <= t1 + 1e-9:
        x = tx(t)
        d.line([(x, y0 + height), (x, y0 + height + 4)], fill=(200, 200, 200))
        lab = f"{t:.2f}" if step < 1 else (f"{int(t)}s" if span < 300 else f"{int(t // 60)}:{int(t % 60):02d}")
        d.text((x - 12, y0 + height + 5), lab, fill=(200, 200, 200), font=fnt)
        t += step


def draw_wave_panel(canvas, x0, y0, x, fs, t0, t1, width, height, title, marks=()):
    d = ImageDraw.Draw(canvas)
    d.rectangle([x0, y0, x0 + width, y0 + height], fill=(18, 18, 24))
    mono = x.mean(axis=1) if x.ndim == 2 else x
    a, b = int(t0 * fs), int(t1 * fs)
    seg = mono[a:b]
    edges = np.linspace(0, len(seg), width + 1).astype(int)
    mid = y0 + height // 2
    sc = (height / 2 - 2)
    for i in range(width):
        s = seg[edges[i]:max(edges[i] + 1, edges[i + 1])]
        if len(s) == 0:
            continue
        lo, hi = float(s.min()), float(s.max())
        r = float(np.sqrt(np.mean(s ** 2)))
        d.line([(x0 + i, mid - int(hi * sc)), (x0 + i, mid - int(lo * sc))], fill=(90, 120, 200))
        d.line([(x0 + i, mid - int(r * sc)), (x0 + i, mid + int(r * sc))], fill=(170, 200, 255))
    for t, lab in marks:
        if t0 <= t <= t1:
            xx = x0 + int((t - t0) / (t1 - t0) * width)
            d.line([(xx, y0), (xx, y0 + height)], fill=(255, 255, 255))
    d.text((x0, y0 - 16), title, fill=(255, 255, 255), font=font(12))


def draw_line_panel(canvas, x0, y0, width, height, series, t0, t1, ylo, yhi, title, hlines=(), marks=()):
    d = ImageDraw.Draw(canvas)
    d.rectangle([x0, y0, x0 + width, y0 + height], fill=(18, 18, 24))
    fnt = font(11)
    for v, col in hlines:
        y = y0 + int((yhi - v) / (yhi - ylo) * height)
        for xx in range(x0, x0 + width, 5):
            d.point((xx, y), fill=col)
        d.text((x0 - 40, y - 7), f"{v:g}", fill=col, font=fnt)
    for ts, vs, col in series:
        pts = [(x0 + int((t - t0) / (t1 - t0) * width), y0 + int((yhi - min(yhi, max(ylo, v))) / (yhi - ylo) * height))
               for t, v in zip(ts, vs) if t0 <= t <= t1 and np.isfinite(v)]
        if len(pts) > 1:
            d.line(pts, fill=col, width=2)
    for t, lab in marks:
        if t0 <= t <= t1:
            xx = x0 + int((t - t0) / (t1 - t0) * width)
            for yy in range(y0, y0 + height, 4):
                d.point((xx, yy), fill=(255, 255, 255))
    d.text((x0, y0 - 16), title, fill=(255, 255, 255), font=font(12))


# ------------------------------------------------------------------ main
def analyze(path, plan=None, sections=None, cues=None, out='review/out', width=1800, title=None,
            zoom=True, ssm=True, zoom_at=None, zoom_span=1.2):
    x, fs = sf.read(path, always_2d=True)
    info = sf.info(path)
    n = len(x)
    T = n / fs
    mono = x.mean(axis=1)
    res = dict(file=os.path.abspath(path), duration_sec=T, samplerate=fs, channels=x.shape[1], subtype=info.subtype)

    # boundaries
    marks, bounds_nominal, bounds_snapped, secinfo = [], [], [], []
    bar_sec, bar_off = None, 0.0
    if plan:
        bar_sec = plan['bar_sec']
        for s in plan['sections']:
            marks.append((s['snapped_start'], s['name']))
            bounds_nominal.append(s['start'])
            bounds_snapped.append(s['snapped_start'])
            secinfo.append((s['name'], s['snapped_start'], s['end']))
    elif sections:
        for s in sections:
            marks.append((s['start'], s['name']))
            bounds_nominal.append(s['start'])
            secinfo.append((s['name'], s['start'], s['end']))
    if secinfo:
        secinfo = [(nm, a, (secinfo[i + 1][1] if i + 1 < len(secinfo) else T)) for i, (nm, a, b) in enumerate(secinfo)]

    # loudness / peaks
    meter = pyln.Meter(fs)
    res['lufs_pyloudnorm'] = float(meter.integrated_loudness(x))
    res['ffmpeg_ebur128'] = ffmpeg_ebur128(path)
    res['sample_peak_dbfs'] = float(20 * np.log10(np.max(np.abs(x)) + 1e-12))
    res['true_peak_dbtp_4x'] = true_peak_db(x)
    rms_all = float(np.sqrt(np.mean(x ** 2)))
    res['rms_dbfs'] = 20 * math.log10(rms_all + 1e-12)
    res['crest_factor_db'] = res['sample_peak_dbfs'] - res['rms_dbfs']
    p = kweighted_power(x)
    tm, lm = windowed_lufs(p, fs, 0.4, 0.1)
    ts3, ls3 = windowed_lufs(p, fs, 3.0, 0.5)
    res['max_momentary_lufs'] = float(np.max(lm))
    res['short_term_lufs_range'] = [float(np.percentile(ls3[ls3 > -70], 5)), float(np.percentile(ls3[ls3 > -70], 95))] \
        if np.any(ls3 > -70) else None
    # short-window crest factor distribution (400 ms)
    w = int(0.4 * fs)
    cfs = []
    for s in range(0, n - w, w):
        seg = x[s:s + w]
        r = np.sqrt(np.mean(seg ** 2))
        if r > 1e-4:
            cfs.append(20 * math.log10(np.max(np.abs(seg)) / r))
    res['crest_400ms_db'] = dict(median=float(np.median(cfs)), p95=float(np.percentile(cfs, 95)),
                                 max=float(np.max(cfs))) if cfs else None
    # spectrum
    fr, fW, PW = band_fractions(mono, fs)
    res['band_energy_fraction'] = fr
    ts, cs, rms = centroid_track(mono, fs)
    act = rms > 1e-3
    res['centroid_hz'] = dict(mean=float(np.mean(cs[act])), p10=float(np.percentile(cs[act], 10)),
                              p90=float(np.percentile(cs[act], 90)), max=float(np.max(cs[act])))
    if secinfo:
        per = []
        for nm, a, b in secinfo:
            m = (ts >= a) & (ts < b) & act
            sa, sb = int(a * fs), int(b * fs)
            seg = x[sa:sb]
            r = float(np.sqrt(np.mean(seg ** 2))) + 1e-12
            psec = p[sa:sb]
            per.append(dict(name=nm, start=round(a, 3), end=round(b, 3),
                            centroid_mean_hz=float(np.mean(cs[m])) if m.any() else None,
                            centroid_std_hz=float(np.std(cs[m])) if m.any() else None,
                            rms_dbfs=20 * math.log10(r),
                            crest_db=float(20 * np.log10(np.max(np.abs(seg)) / r)),
                            lufs_ungated=float(-0.691 + 10 * np.log10(np.mean(psec) + 1e-20))))
        res['sections'] = per
    # stereo
    L, R = x[:, 0], x[:, 1]
    res['stereo_correlation'] = float(np.corrcoef(L, R)[0, 1])
    M, S = 0.5 * (L + R), 0.5 * (L - R)
    res['side_to_mid_db'] = float(10 * np.log10((np.mean(S ** 2) + 1e-20) / (np.mean(M ** 2) + 1e-20)))
    lp = signal.butter(4, 150, 'lp', fs=fs, output='sos')
    Sl, Ml = signal.sosfilt(lp, S), signal.sosfilt(lp, M)
    res['side_to_mid_below150_db'] = float(10 * np.log10((np.mean(Sl ** 2) + 1e-20) / (np.mean(Ml ** 2) + 1e-20)))
    res['dc_offset'] = [float(np.mean(L)), float(np.mean(R))]
    res['first_sample'] = float(np.max(np.abs(x[0])))
    res['last_sample'] = float(np.max(np.abs(x[-1])))
    res['first_10ms_peak'] = float(np.max(np.abs(x[:int(0.01 * fs)])))
    res['last_10ms_peak'] = float(np.max(np.abs(x[-int(0.01 * fs):])))
    # discontinuities
    d1 = np.abs(np.diff(x, axis=0)).max(axis=1)
    res['max_sample_jump'] = float(d1.max())
    res['sample_jump_p9999'] = float(np.percentile(d1, 99.99))
    times = sorted(set([round(t, 4) for t in bounds_nominal[1:] + bounds_snapped[1:]]))
    res['boundary_jumps'] = boundary_jumps(x, fs, times)
    clicks, (max_ratio, max_spike) = click_scan(x, fs)
    res['click_candidates'] = clicks[:50]
    res['click_count'] = len(clicks)
    res['click_scan_max_ratio'] = max_ratio
    res['click_scan_max_spikiness'] = max_spike
    # repetition
    if ssm and bar_sec:
        Smat, F = bar_ssm(mono, fs, bar_sec, 0.0)
        if Smat is not None:
            nb = len(Smat)
            iu = [(i, j) for i in range(nb) for j in range(i + 1, nb)]
            far = np.array([Smat[i, j] for i, j in iu if j - i >= 8]) if nb > 8 else np.array([])
            res['ssm'] = dict(bars=nb, mean_offdiag=float(np.mean([Smat[i, j] for i, j in iu])),
                              far_pairs=int(len(far)),
                              far_pairs_sim_gt_0_98=float(np.mean(far > 0.98)) if len(far) else None,
                              far_pairs_sim_gt_0_995=float(np.mean(far > 0.995)) if len(far) else None)
            sz = max(4, min(12, 900 // nb))
            u = np.clip((Smat - 0.6) / 0.4, 0, 1)
            img = Image.fromarray(LUT[(u * 255).astype(int)]).resize((nb * sz, nb * sz), Image.NEAREST)
            can = Image.new('RGB', (nb * sz + 40, nb * sz + 50), (12, 12, 16))
            can.paste(img, (20, 30))
            ImageDraw.Draw(can).text((20, 6), f"bar self-similarity ({nb} bars, colour 0.6..1.0)",
                                     fill=(255, 255, 255), font=font(13))
            can.save(out + '_ssm.png')

    # ---- overview image
    cue_marks = [(c['t'], c['sfx']) for c in (cues or [])]
    Wd, x0 = width, 70
    H1, H2 = 520, 260
    can = Image.new('RGB', (Wd + x0 + 30, 40 + H1 + 50 + H2 + 50 + 90 + 40 + 90 + 40), (12, 12, 16))
    ttl = title or os.path.basename(path)
    draw_spec_panel(can, x0, 40, mono, fs, 0, T, Wd, H1, 30, 16000, True, 8192,
                    f"{ttl} - log-frequency spectrogram (dB), cyan = spectral centroid, dotted blue = 3k/6k",
                    marks, cue_marks, (ts, cs))
    y = 40 + H1 + 50
    draw_spec_panel(can, x0, y, mono, fs, 0, T, Wd, H2, 1500, 16000, False, 2048,
                    "linear 1.5-16 kHz (harshness check; dotted blue lines = 3 and 6 kHz)", marks, cue_marks,
                    db=(-120, -40))
    y += H2 + 50
    draw_wave_panel(can, x0, y, x, fs, 0, T, Wd, 90, "waveform (peak / RMS)", marks)
    y += 90 + 40
    draw_line_panel(can, x0, y, Wd, 90, [(ts3, ls3, (255, 200, 80)), (tm, lm, (120, 120, 160))], 0, T, -40, -6,
                    "short-term (3 s, orange) and momentary (0.4 s, grey) loudness, LUFS", [(-18, (90, 200, 255))],
                    marks)
    can.save(out + '_overview.png')

    # ---- boundary zooms
    if zoom and (times or zoom_at):
        zt = list(zoom_at) if zoom_at else [t for t in times]
        cols = 2
        rows = math.ceil(len(zt) / cols)
        zw, zh = 760, 300
        can = Image.new('RGB', (cols * (zw + 90) + 20, rows * (zh + 230) + 20), (12, 12, 16))
        for k, t in enumerate(zt):
            cx = 70 + (k % cols) * (zw + 90)
            cy = 30 + (k // cols) * (zh + 230)
            a, b = max(0, t - zoom_span), min(T, t + zoom_span)
            draw_spec_panel(can, cx, cy, mono, fs, a, b, zw, zh, 30, 20000, True, 1024 if zoom_span > 0.5 else 256,
                            f"{'boundary' if not zoom_at else 'zoom'} {t:.3f} s (+-{zoom_span:g} s)",
                            [(tt, '') for tt in times], cue_marks, db=(-115, -30))
            draw_wave_panel(can, cx, cy + zh + 40, x, fs, a, b, zw, 70, "waveform", [(t, '')])
            sa, sb = int(a * fs), int(b * fs)
            dd = d1[sa:sb]
            nb = zw
            e = np.linspace(0, len(dd), nb + 1).astype(int)
            vals = [float(dd[e[i]:max(e[i] + 1, e[i + 1])].max()) for i in range(nb)]
            tt = [a + (i + 0.5) * (b - a) / nb for i in range(nb)]
            vmax = max(1e-6, max(vals))
            draw_line_panel(can, cx, cy + zh + 140, zw, 60, [(tt, vals, (255, 120, 120))], a, b, 0, vmax * 1.1,
                            f"|x[n]-x[n-1]| max per column (peak {vmax:.4f})", (), [(t, '')])
        can.save(out + ('_zoomat.png' if zoom_at else '_zoom.png'))

    with open(out + '_metrics.json', 'w') as f:
        json.dump(res, f, indent=1)
    return res


def summary(res):
    e = res.get('ffmpeg_ebur128', {})
    lines = [
        f"file: {res['file']}  ({res['duration_sec']:.2f} s, {res['samplerate']} Hz, {res['subtype']})",
        f"loudness: pyloudnorm {res['lufs_pyloudnorm']:.2f} LUFS | ffmpeg I {e.get('I')} LUFS, LRA {e.get('LRA')} LU, "
        f"TP {e.get('true_peak')} dBFS | own 4x TP {res['true_peak_dbtp_4x']:.2f} dBTP | sample peak {res['sample_peak_dbfs']:.2f}",
        f"crest factor {res['crest_factor_db']:.1f} dB (400 ms median {res['crest_400ms_db']['median']:.1f}, "
        f"p95 {res['crest_400ms_db']['p95']:.1f}) | max momentary {res['max_momentary_lufs']:.1f} LUFS | "
        f"short-term 5-95% {res['short_term_lufs_range']}",
        "band energy: " + ', '.join(f"{k}: {100 * v:.2f}%" for k, v in res['band_energy_fraction'].items()),
        f"centroid: mean {res['centroid_hz']['mean']:.0f} Hz, p10 {res['centroid_hz']['p10']:.0f}, "
        f"p90 {res['centroid_hz']['p90']:.0f}, max {res['centroid_hz']['max']:.0f}",
        f"stereo: corr {res['stereo_correlation']:.2f}, side/mid {res['side_to_mid_db']:.1f} dB, "
        f"side/mid <150 Hz {res['side_to_mid_below150_db']:.1f} dB, DC {res['dc_offset'][0]:.1e}/{res['dc_offset'][1]:.1e}",
        f"edges: first sample {res['first_sample']:.2e}, last {res['last_sample']:.2e}, first 10 ms peak "
        f"{res['first_10ms_peak']:.2e}, last 10 ms peak {res['last_10ms_peak']:.2e}",
        f"jumps: max |dx| {res['max_sample_jump']:.4f}, p99.99 {res['sample_jump_p9999']:.4f}; click scan: "
        f"{res['click_count']} clicks {res['click_candidates'][:8]} (max bg-ratio {res['click_scan_max_ratio']:.1f}, "
        f"max spikiness {res['click_scan_max_spikiness']:.1f})",
    ]
    for b in res['boundary_jumps']:
        lines.append(f"  boundary {b['t']:8.3f}s: max |dx| {b['max_jump']:.4f} vs local p99.9 {b['ref_p999']:.4f} "
                     f"(ratio {b['ratio']})")
    for s in res.get('sections', []):
        lines.append(f"  section {s['name']:<10} {s['start']:7.2f}-{s['end']:7.2f}: centroid {s['centroid_mean_hz'] or 0:6.0f}"
                     f" +-{s['centroid_std_hz'] or 0:4.0f} Hz, RMS {s['rms_dbfs']:6.1f} dBFS, crest {s['crest_db']:4.1f} dB, "
                     f"{s['lufs_ungated']:6.1f} LUFS(ungated)")
    if 'ssm' in res:
        lines.append(f"repetition: {res['ssm']}")
    return '\n'.join(lines)


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('wav')
    ap.add_argument('--plan')
    ap.add_argument('--sections')
    ap.add_argument('--cues')
    ap.add_argument('--out', default='review/out')
    ap.add_argument('--width', type=int, default=1800)
    ap.add_argument('--title')
    ap.add_argument('--no-zoom', action='store_true')
    ap.add_argument('--no-ssm', action='store_true')
    ap.add_argument('--zoom-at', help='comma-separated times (s) for extra zoom panels')
    ap.add_argument('--zoom-span', type=float, default=1.2)
    a = ap.parse_args()
    plan = json.load(open(a.plan)) if a.plan else None
    secs = json.load(open(a.sections)) if a.sections else None
    cues = json.load(open(a.cues)) if a.cues else None
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    za = [float(v) for v in a.zoom_at.split(',')] if a.zoom_at else None
    r = analyze(a.wav, plan, secs, cues, a.out, a.width, a.title, not a.no_zoom, not a.no_ssm, za, a.zoom_span)
    print(summary(r))
