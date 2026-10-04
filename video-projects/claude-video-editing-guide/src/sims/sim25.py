"""2.5 simulation: one visual beat per explanation phrase, then the mix.
A LUFS meter stands at the right for the whole scene; the main area at the left changes per beat.
B0 (phr0) a phone feed: one video shouts (big wave, red "נשרף" peaks), a swipe, the next almost whispers;
   the meter jumps from high to low
B1 (phr1) the target: a big "-14 LUFS" readout, the target line on the meter (punch-in here)
B2 (phr2) the unit measures how loud it sounds to the ear: an ear, sound reaching it, the meter's unit glows
B3 (phr3) "מעבר 1: מדידה" scans a weak clip with clipped spikes; "מעבר 2: linear" levels it to the target line
   under the -1 ceiling; a second measurement confirms it
B4 (phr4) the effects' spectrum: a highpass at 200Hz removes the bass
payoff: three channels, speech, music (9 to 13 dB below the speech, dipping 2 to 4 dB more while someone speaks)
and effects without bass; a playhead runs through the mix and the meter holds -14.
Time runs right to left in the lanes (Hebrew reading order); the spectrum keeps the usual low-to-high axis.
Geometry is static (computed here); scene-local times live in sim25.js."""
import math
import re

from textlayout import esc
from art import person_svg

HEB = re.compile(r"[֐-׿]")
MAIN_W = 575
METER = dict(x=600, y=30, w=200, h=640)
M_TOP, M_BOT, M_RANGE = 120, 640, 30.0          # meter scale: 0 dB at the top, -30 at the bottom
TARGET, CEIL = -14, -1


def my(L):
    """Meter / graph y for a loudness value (dB)."""
    return M_TOP + (-L) * (M_BOT - M_TOP) / M_RANGE


def rtl(s):
    """Hebrew label with its Latin/number runs (2+ tokens, or a negative number) in an LTR isolate."""
    toks, out, i = s.split(" "), [], 0
    while i < len(toks):
        if HEB.search(toks[i]) or toks[i] in ("·",):
            out.append(esc(toks[i]))
            i += 1
            continue
        j = i
        while j < len(toks) and not HEB.search(toks[j]) and toks[j] != "·":
            j += 1
        run = toks[i:j]
        if len(run) >= 2 or run[0].startswith("-"):
            out.append(f'<span class="isl" dir="ltr">{esc(" ".join(run))}</span>')
        else:
            out.append(esc(run[0]))
        i = j
    return " ".join(out)


def _rng(seed):
    st = [seed]

    def r():
        st[0] = (st[0] * 1103515245 + 12345) & 0x7FFFFFFF
        return st[0] / 0x7FFFFFFF
    return r


def wave_svg(cls, w, h, amps, clip=None, bar=5.0):
    """Symmetric waveform; amps are 0..1 of h/2. Parts above `clip` (0..1) are drawn red."""
    n = len(amps)
    pitch = w / n
    c = h / 2
    lil, red = [], []
    for i, a in enumerate(amps):
        x = w - (i + 0.5) * pitch               # time runs right to left
        hh = max(1.5, a * c)
        if clip is not None and a > clip:
            k = clip * c
            lil.append(f"M{x:.1f} {c - k:.1f}V{c + k:.1f}")
            red.append(f"M{x:.1f} {c - hh:.1f}V{c - k:.1f}M{x:.1f} {c + k:.1f}V{c + hh:.1f}")
        else:
            lil.append(f"M{x:.1f} {c - hh:.1f}V{c + hh:.1f}")
    rp = f'<path class="s25-wr" d="{"".join(red)}" style="stroke-width:{bar}"/>' if red else ""
    return (f'<svg class="{cls}" viewBox="0 0 {w} {h}" aria-hidden="true"><path class="s25-wl" d="{"".join(lil)}" '
            f'style="stroke-width:{bar}"/>{rp}</svg>')


def speaker(n):
    arcs = "".join(f'<path d="M{17 + 4 * k} {11 - 3 * k}c{2.4 + 1.2 * k} {3 + 1.5 * k} {2.4 + 1.2 * k} {9 + 3 * k} 0 {12 + 6 * k}"/>' for k in range(n))
    return (f'<svg class="s25-spk" viewBox="0 0 36 34" aria-hidden="true"><path class="s25-spb" d="M3 12h6l7-6v22l-7-6H3z"/>'
            f'{arcs}</svg>')


def phone(c):
    """B0: a vertical feed with two full-screen videos (the loud one, then the quiet one)."""
    r = _rng(5)
    loud = [min(1.0, 0.45 + 0.55 * r()) * (0.75 + 0.25 * math.sin(i * 0.9)) for i in range(26)]
    loud = [1.0 if i in (5, 6, 13, 19, 20) else a for i, a in enumerate(loud)]
    quiet = [0.05 + 0.1 * r() for _ in range(26)]
    def card(cls, bg, wave, tag, spk, extra=""):
        return (f'<div class="s25-card {cls}" style="background:{bg}">{person_svg("s25-cp", cls[-1] + "25")}'
                f'<div class="s25-ctop" dir="rtl">{spk}<span>{esc(tag)}</span></div>'
                f'<div class="s25-cw">{wave}</div>{extra}</div>')
    burn = f'<span class="s25-burn" dir="rtl">{esc(c["burnTag"])}</span>'
    a = card("s25-ca", "linear-gradient(180deg, #3b2b6e 0%, #241c4a 60%, #15122e 100%)",
             wave_svg("s25-wv", 200, 110, loud, clip=0.78, bar=4.5), c["loudTag"], speaker(3), burn)
    b = card("s25-cb", "linear-gradient(180deg, #1f2f55 0%, #18213f 60%, #10142a 100%)",
             wave_svg("s25-wv", 200, 110, quiet, bar=4.5), c["quietTag"], speaker(1))
    return (f'<div class="s25-phone"><div class="s25-screen"><div class="s25-feed">{a}{b}</div>'
            f'<i class="s25-swipe"></i></div></div>')


EAR = ('<svg class="s25-ear" viewBox="0 0 140 180" aria-hidden="true">'
       '<path d="M38 70 C38 34 64 12 92 12 C122 12 134 40 128 66 C124 86 108 94 104 112 C100 132 96 152 76 160 C58 168 42 156 40 140"/>'
       '<path d="M62 74 C62 52 76 40 92 40 C108 40 114 56 108 70 C104 80 94 82 92 94"/>'
       '<path d="M80 106 C88 104 94 110 92 118"/></svg>')
ARCS = ('<svg class="s25-arcs" viewBox="0 0 150 160" aria-hidden="true">'
        + "".join(f'<path class="s25-arc s25-arc{k}" d="M{30 + 36 * k} {30 - 4 * k} C{52 + 40 * k} {58} {52 + 40 * k} {102} {30 + 36 * k} {130 + 4 * k}"/>'
                  for k in range(3)) + '</svg>')


def graph():
    """B3: short-term loudness over time (bars up from a baseline): a weak clip with clipped spikes, then levelled."""
    base = 440
    n, pitch, bw = 34, 16, 10
    r = _rng(17)
    spikes = (4, 11, 12, 23, 29)
    before, after = [], []
    tgt = base - my(TARGET)
    ceil = base - my(CEIL)
    for i in range(n):
        if i in spikes:
            b = ceil + 18 + 14 * r()
            a = ceil - 14 - 8 * r()
        else:
            b = 34 + 26 * r()
            a = b * (tgt / 47.0)
            a = min(a, tgt + 14)
        before.append(round(b, 1))
        after.append(round(a, 1))
    bars = []
    for i in range(n):
        x = 560 - (i + 1) * pitch + (pitch - bw)
        red = ""
        if before[i] > ceil:
            red = f'<b style="height:{before[i] - ceil:.1f}px"></b>'
        bars.append(f'<i class="s25-gb" data-b="{before[i]}" data-a="{after[i]}" style="left:{x}px;top:{base - before[i]:.1f}px;'
                    f'height:{before[i]:.1f}px">{red}</i>')
    return "".join(bars), base


def spectrum():
    """B4: the effects' spectrum, low to high frequency (log axis 20 Hz .. 20 kHz across x 20..550)."""
    n, x0, x1, base = 26, 22, 552, 656
    pitch = (x1 - x0) / n
    r = _rng(31)
    cut = x0 + (x1 - x0) / 3.0                    # 200 Hz on the log axis
    bars = []
    for i in range(n):
        x = x0 + i * pitch + 3
        f = i / (n - 1)
        h = (64 - 24 * f + 12 * r()) if f < 0.3 else (38 - 18 * f + 10 * r())
        low = x + (pitch - 6) / 2 < cut
        bars.append(f'<i class="s25-sb{" s25-low" if low else ""}" style="left:{x:.1f}px;top:{base - h:.1f}px;height:{h:.1f}px;width:{pitch - 6:.1f}px"></i>')
    curve = (f'<svg class="s25-hp" viewBox="0 0 575 700" aria-hidden="true"><path d="M{x0} {base} C{cut - 70:.0f} {base} {cut - 40:.0f} {base - 82} {cut:.0f} {base - 86} H{x1}"/></svg>')
    return "".join(bars), cut, curve


def lanes(c):
    """Payoff: speech, music (lower, ducking under speech), effects (small, no bass)."""
    W, n = 560, 56
    r = _rng(41)
    speech_on = [1 if (3 <= i <= 16 or 22 <= i <= 34 or 41 <= i <= 52) else 0 for i in range(n)]
    sp = [(0.35 + 0.6 * r()) * s for i, s in enumerate(speech_on)]
    mu = [(0.34 + 0.08 * math.sin(i * 0.7)) * (0.55 if speech_on[i] else 1.0) for i in range(n)]
    fx = [0.0] * n
    for i, a in ((9, 0.34), (27, 0.3), (46, 0.32)):
        fx[i], fx[i + 1] = a, a * 0.55
    rows = [("s25-l1", c["lanes"][0], wave_svg("s25-lw", W, 80, sp, bar=5)),
            ("s25-l2", f'{c["lanes"][1]} · {c["musicRel"]}', wave_svg("s25-lw", W, 80, mu, bar=5)),
            ("s25-l3", f'{c["lanes"][2]} · {c["sfxRel"]}', wave_svg("s25-lw", W, 80, fx, bar=5))]
    out = []
    for i, (cls, lab, wv) in enumerate(rows):
        out.append(f'<div class="s25-lane {cls}" style="top:{64 + i * 186}px"><div class="s25-lh" dir="rtl"><i></i>{rtl(lab)}</div>'
                   f'<div class="s25-lwv">{wv}</div></div>')
    arrow = ('<svg class="s25-dn" viewBox="0 0 20 22" aria-hidden="true"><path d="M10 2V19M3 12l7 7 7-7"/></svg>')
    duck = (f'<div class="s25-duck" style="top:{64 + 186 + 130}px"><span dir="rtl">{arrow}{rtl(c["duckTag"])}</span></div>')
    # where the music dips: under the speech bursts (x of the first dip, lane coordinates)
    return "".join(out) + duck


def html(cfg):
    c = cfg["sim25"]
    M = METER
    mx = M["x"]
    # meter
    meter = (f'<div class="s25-meter" style="left:{mx}px;top:{M["y"]}px;width:{M["w"]}px;height:{M["h"]}px"></div>'
             f'<div class="s25-mtitle" style="left:{mx}px;width:{M["w"]}px;top:{M["y"] + 18}px" dir="ltr">{esc(c["meterTitle"])}</div>'
             f'<i class="s25-track" style="left:{mx + 112}px;top:{M_TOP}px;height:{M_BOT - M_TOP}px"></i>'
             f'<i class="s25-lvl" style="left:{mx + 112}px;top:{M_TOP}px;height:{M_BOT - M_TOP}px"></i>'
             f'<i class="s25-ticks" style="left:{mx + 168}px;top:{M_TOP}px;height:{M_BOT - M_TOP}px"></i>')
    ty, cy = my(TARGET), my(CEIL)
    lines = (f'<i class="s25-tline" style="left:{mx + 8}px;top:{ty - 1.5:.1f}px"></i>'
             f'<span class="s25-ttag" dir="ltr" style="left:{mx + 12}px;top:{ty - 40:.1f}px">{esc(c["target"])}</span>'
             f'<i class="s25-cline" style="left:{mx + 8}px;top:{cy - 1:.1f}px"></i>'
             f'<span class="s25-ctag" dir="ltr" style="left:{mx + 12}px;top:{cy + 8:.1f}px">{esc(c["ceil"])}</span>'
             f'<div class="s25-ok" style="left:{mx + 136}px;top:{ty - 19:.1f}px"><svg viewBox="0 0 30 30" aria-hidden="true"><path d="M6 15.5l6 6 12-13"/></svg></div>')
    # B1 readout and B2 ear
    readout = (f'<div class="s25-ro" data-focus="1"><i class="s25-halo"></i>'
               f'<svg class="s25-ring" viewBox="0 0 300 300" aria-hidden="true"><circle cx="150" cy="150" r="140"/></svg>'
               f'<b dir="ltr">{esc(c["target"])}</b><span dir="ltr">{esc(c["meterTitle"])}</span></div>')
    ear = f'<div class="s25-earw">{ARCS}{EAR}</div>'
    # B3 graph
    gbars, base = graph()
    gpanel = (f'<div class="s25-gp"><i class="s25-gbg"></i><div class="s25-pills"><span class="s25-pill s25-p1" dir="rtl">{esc(c["pass1"])}</span>'
              f'<span class="s25-pill s25-p2" dir="rtl">{esc(c["pass2"])}</span></div>'
              f'<i class="s25-gbase" style="top:{base}px"></i>{gbars}'
              f'<i class="s25-gl s25-gt" style="top:{ty - 1.5:.1f}px"></i><i class="s25-gl s25-gc" style="top:{cy - 1:.1f}px"></i>'
              + "".join(f'<i class="s25-gscan s25-gs{k}" style="left:566px;top:{my(CEIL) - 34:.1f}px;height:{base - my(CEIL) + 38:.1f}px"></i>' for k in (1, 2))
              + '</div>')
    # B4 spectrum
    sbars, cut, curve = spectrum()
    spanel = (f'<div class="s25-sp"><i class="s25-sbg"></i><div class="s25-sh" dir="rtl"><i></i>{esc(c["sfxTitle"])}</div>{sbars}{curve}'
              f'<i class="s25-cut" style="left:{cut - 1:.1f}px"></i>'
              f'<span class="s25-hpt" dir="ltr" style="left:{cut - 1:.0f}px">{esc(c["hp"])}</span>'
              f'<span class="s25-nb" dir="rtl" style="left:22px">{esc(c["noBass"])}</span></div>')
    return f"""<div class="simwrap sim25">
{meter}
<div class="s25-main">{phone(c)}{readout}{ear}{gpanel}{spanel}<div class="s25-lanes">{lanes(c)}<i class="s25-ph"></i></div></div>
{lines}
</div>"""


def cues(cfg):
    P, pe = cfg["phr"], cfg["phrEnd"]
    return [("swipe", P[0] + 1.05), ("pop", P[1] + 0.25), ("shimmer", P[2] + 0.4), ("tick", P[3] + 1.45),
            ("whoosh_soft", P[4] + 0.6), ("tick", pe + 2.6)]
