#!/usr/bin/env python3
"""Audio mix, following prompt 5 of the guide:
music bed + soft SFX (no bass: highpass 200 Hz), then two-pass loudnorm to -14 LUFS,
true peak <= -1 dBTP, linear mode verified, 48 kHz.

usage: mix.py MUSIC.wav CUES.json OUT.wav [--window A B] [--extra-cues more.json]"""
import argparse
import json
import pathlib
import re
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000
HERE = pathlib.Path(__file__).resolve().parent
SFX_DIR = HERE / "sfx"
# per-SFX gain in dB relative to the file's own peak normalisation (-6 dBFS)
SFX_GAIN = {"whoosh_soft": -15, "swipe": -17, "tick": -21, "pop": -16, "shimmer": -18, "snap": -18, "glitch_soft": -22}


def load(path):
    x, sr = sf.read(str(path), always_2d=True, dtype="float64")
    if sr != SR:
        sys.exit(f"{path}: expected {SR} Hz, got {sr}")
    if x.shape[1] == 1:
        x = np.repeat(x, 2, axis=1)
    return x


def loudnorm_two_pass(src, dst, I=-14.0, TP=-1.0, LRA=11.0):
    def run(af):
        r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(src), "-af", af, "-f", "null", "-"],
                           capture_output=True, text=True)
        js = re.findall(r"\{[^{}]*\}", r.stderr, re.S)
        return json.loads(js[-1])
    m = run(f"loudnorm=I={I}:TP={TP}:LRA={LRA}:print_format=json")
    af2 = (f"loudnorm=I={I}:TP={TP}:LRA={LRA}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
           f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:"
           f"linear=true:print_format=json")
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-y", "-i", str(src), "-af", af2, "-ar", str(SR),
                        "-c:a", "pcm_s24le", str(dst)], capture_output=True, text=True)
    out = json.loads(re.findall(r"\{[^{}]*\}", r.stderr, re.S)[-1])
    return m, out


def measure(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af",
                        "loudnorm=I=-14:TP=-1:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    return json.loads(re.findall(r"\{[^{}]*\}", r.stderr, re.S)[-1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("music"); ap.add_argument("cues"); ap.add_argument("out")
    ap.add_argument("--window", nargs=2, type=float)
    ap.add_argument("--extra-cues")
    ap.add_argument("--music-db", type=float, default=0.0)
    ap.add_argument("--music-offset", type=float, default=0.0, help="read the music from window+offset (draft variants)")
    a = ap.parse_args()

    music = load(a.music) * (10 ** (a.music_db / 20))
    cues = json.loads(pathlib.Path(a.cues).read_text(encoding="utf-8"))["cues"]
    if a.extra_cues:
        cues += json.loads(pathlib.Path(a.extra_cues).read_text(encoding="utf-8"))["cues"]
    if a.window:
        A, B = a.window
        seg = music[int((A + a.music_offset) * SR):int((B + a.music_offset) * SR)].copy()
        n = len(seg)
        fade = int(0.35 * SR)
        seg[:fade] *= np.linspace(0, 1, fade)[:, None]
        seg[-fade:] *= np.linspace(1, 0, fade)[:, None]
    else:
        A, B = 0.0, len(music) / SR
        seg = music.copy()
    n = len(seg)
    sos = butter(4, 200, "highpass", fs=SR, output="sos")
    placed = 0
    for c in cues:
        t = c["t"] - A
        if t < -0.05 or t >= (B - A):
            continue
        x = load(SFX_DIR / f"{c['sfx']}.wav")
        x = sosfilt(sos, x, axis=0) * (10 ** ((SFX_GAIN.get(c["sfx"], -18) + c.get("db", 0)) / 20))
        i = max(0, int(round(t * SR)))
        j = min(n, i + len(x))
        seg[i:j] += x[: j - i]
        placed += 1
    tmp = pathlib.Path(a.out).with_suffix(".premix.wav")
    sf.write(str(tmp), seg.astype(np.float32), SR, subtype="FLOAT")
    m1, m2 = loudnorm_two_pass(tmp, a.out)
    print(f"placed {placed} sfx; pass1 I={m1['input_i']} TP={m1['input_tp']} LRA={m1['input_lra']}; "
          f"pass2 type={m2['normalization_type']} out_I={m2['output_i']} out_TP={m2['output_tp']}")
    if m2["normalization_type"] != "linear":
        print("WARNING: dynamic mode, limiting peaks first (alimiter level=false at 192 kHz) and re-running")
        lim = tmp.with_suffix(".lim.wav")
        subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-y", "-i", str(tmp), "-af",
                        "aresample=192000,alimiter=limit=0.7:level=false,aresample=48000", "-c:a", "pcm_f32le", str(lim)],
                       check=True, capture_output=True)
        m1, m2 = loudnorm_two_pass(lim, a.out)
        print(f"retry: type={m2['normalization_type']} out_I={m2['output_i']} out_TP={m2['output_tp']}")
    f = measure(a.out)
    print(f"FINAL measured: I={f['input_i']} LUFS, TP={f['input_tp']} dBTP, LRA={f['input_lra']}")
    tmp.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
