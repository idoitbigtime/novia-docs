"""2.6 simulation: replacing only the wrong sentence. One visual beat per explanation phrase.
Canvas 800 x 700. Time runs right to left (the reading direction, like sim22's playhead).
B0 the narration waveform; the wrong sentence turns red; under it the loudness graph with a line at every word
   start; the cut points land on whisper's times, then snap to the nearest dip (silence); the sentence is cut out
B1 the new recording flies up into the gap; what comes after it on the narration moves by the length difference
B2 it is matched to the narration around it: background noise, EQ, loudness (three illustrated cards)
B3 a close-up of the join: a click, then a 40 ms fade on each side; the click is gone (punch-in on the close-up)
B4 the mouth is visible on the video: Claude offers a B-roll or another angle; the B-roll flies in and covers it
payoff: the captions, effects and B-roll tracks move by the same difference; a playhead runs through.
Times come from cfg["phr"] / cfg["phrEnd"] (scene-local)."""
import math
import random

from art import person_svg
from textlayout import esc

# geometry (canvas px)
X0, X1, PITCH = 14, 630, 8          # bar centres, right to left
CY, HMAX = 75, 54                   # waveform centre line inside the clip area (local y), max half height
DIP_R, DIP_L = 466, 266             # the silences before and after the wrong sentence (cut points)
DELTA = 80                          # the new sentence is longer by this many px
NEW_L = DIP_L - DELTA               # left edge of the new recording (186)
GH = 120                            # loudness graph inner height

CHECK = '<svg class="{cls}" viewBox="0 0 30 30" aria-hidden="true"><path d="M7 15.5l5.5 5.5L23.5 9"/></svg>'
SPARK = '<svg class="s26-fxi" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.3 6.6 6.7 2.4-6.7 2.4L12 20.5l-2.3-6.6L3 11.5l6.7-2.4z"/></svg>'
MIC = ('<svg class="s26-mic" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="20"/>'
       '<rect x="17.5" y="10" width="9" height="15" rx="4.5"/><path d="M13.5 21.5a8.5 8.5 0 0 0 17 0M22 30v4.5"/></svg>')


def _word(n, rnd, amp):
    return [amp * (0.42 + 0.58 * math.sin(math.pi * (i + 0.5) / n)) * (0.72 + 0.5 * rnd.random()) for i in range(n)]


def _narration():
    """Bar half-heights of the original narration, keyed by bar x, and the x of every word start.
    Words of 4-7 bars with a one-bar gap; four silent bars around each cut point (a real dip)."""
    rnd = random.Random(26)
    xs = list(range(X1, X0 - 1, -PITCH))
    silent = {d + o for d in (DIP_R, DIP_L) for o in (12, 4, -4, -12)}
    sent = [x for x in xs if DIP_L + 12 < x < DIP_R - 12]
    h, starts, k = {}, [], 0
    while k < len(xs):
        x = xs[k]
        if x in silent:
            h[x] = 1.6
            k += 1
            continue
        if x in sent:
            k += 1
            continue
        n = rnd.choice([4, 5, 6, 7])
        run = []
        while k < len(xs) and len(run) < n and xs[k] not in silent and xs[k] not in sent:
            run.append(xs[k])
            k += 1
        for x2, hh in zip(run, _word(len(run), rnd, HMAX * (0.78 + 0.22 * rnd.random()))):
            h[x2] = min(52.0, hh)
        starts.append(run[0])
        if k < len(xs) and xs[k] not in silent and xs[k] not in sent:
            h[xs[k]] = 3 + 3 * rnd.random()       # short gap between words
            k += 1
    # the wrong sentence: 200 · אלף · קמ״ש (21 bars)
    j = 0
    for wi, n in enumerate([6, 6, 7]):
        run = sent[j:j + n]
        starts.append(run[0])
        for x2, hh in zip(run, _word(n, rnd, HMAX * 0.95)):
            h[x2] = min(52.0, hh)
        j += n
        if wi < 2:
            h[sent[j]] = 3.5
            j += 1
    assert j == len(sent), (j, len(sent))
    return h, sorted(set(starts), reverse=True)


def _new_recording():
    """Bars of the new recording (x inside its own 280 px box): a silent bar, 200, אלף, קילומטר, בשנייה, a silent bar."""
    rnd = random.Random(62)
    xs = list(range(DIP_R - NEW_L - 4, 0, -PITCH))      # 276 .. 4
    h, k = {xs[0]: 1.6}, 1
    for wi, n in enumerate([6, 5, 10, 9]):
        for hh in _word(n, rnd, HMAX * 0.95):
            h[xs[k]] = min(50.0, hh)
            k += 1
        if wi < 3:
            h[xs[k]] = 3.2
            k += 1
    while k < len(xs):
        h[xs[k]] = 1.6
        k += 1
    return h


def _bars(items, cy=CY):
    return " ".join(f"M{x:.1f} {cy - hh:.1f}V{cy + hh:.1f}" for x, hh in items)


def _svg(cls, w, hgt, inner):
    return f'<svg class="{cls}" viewBox="0 0 {w} {hgt}" width="{w}" height="{hgt}" aria-hidden="true">{inner}</svg>'


def _broll_art(cls, w, h):
    """Generic line-art B-roll picture: sky, sun, two mountain lines, a ground line."""
    return (f'<svg class="{cls}" viewBox="0 0 {w} {h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
            f'<defs><linearGradient id="{cls}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2558"/>'
            f'<stop offset="0.62" stop-color="#3c2f6e"/><stop offset="1" stop-color="#151229"/></linearGradient></defs>'
            f'<rect width="{w}" height="{h}" fill="url(#{cls}-g)"/>'
            f'<circle cx="{w * 0.68:.1f}" cy="{h * 0.34:.1f}" r="{min(w, h) * 0.11:.1f}" fill="none" stroke="#ffd9b0" stroke-width="2.4" opacity="0.9"/>'
            f'<path d="M0 {h * 0.72:.1f} L{w * 0.22:.1f} {h * 0.5:.1f} L{w * 0.38:.1f} {h * 0.63:.1f} L{w * 0.6:.1f} {h * 0.42:.1f} L{w:.1f} {h * 0.7:.1f}" '
            f'fill="none" stroke="#c9c2ff" stroke-width="2.6" stroke-linejoin="round"/>'
            f'<path d="M0 {h * 0.82:.1f} L{w * 0.3:.1f} {h * 0.66:.1f} L{w * 0.52:.1f} {h * 0.78:.1f} L{w * 0.8:.1f} {h * 0.62:.1f} L{w:.1f} {h * 0.76:.1f}" '
            f'fill="none" stroke="#c9c2ff" stroke-width="2" stroke-linejoin="round" opacity="0.55"/>'
            f'<path d="M{w * 0.1:.1f} {h * 0.9:.1f}H{w * 0.9:.1f}" stroke="#c9c2ff" stroke-width="1.6" opacity="0.35"/></svg>')


def _graph(h, starts):
    """Loudness graph: smoothed level per bar, as a stroke drawn right to left plus a soft fill; word-start lines."""
    xs = sorted(h, reverse=True)
    pts = []
    for i, x in enumerate(xs):
        win = [h[xs[j]] for j in range(max(0, i - 2), min(len(xs), i + 3))]
        v = sum(win) / len(win)
        pts.append((x, GH - 6 - min(GH - 14, v * 2.1)))
    line = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts)
    fill = line + f" L{xs[-1]:.1f} {GH} L{xs[0]:.1f} {GH} Z"
    wl = "".join(f'<path d="M{x + 4:.1f} 6V{GH - 4}"/>' for x in starts)
    return f'<path class="s26-gfill" d="{fill}"/><g class="s26-gwl">{wl}</g><path class="s26-gline" d="{line}"/>'


def _cards(tags):
    """B2: noise floor drops, EQ curve meets the replaced sentence's curve, loudness meets the narration around it."""
    rnd = random.Random(11)
    fuzz = " ".join(f"M{8 + i * 6:.1f} {52 - hh:.1f}V{52 + hh:.1f}" for i, hh in enumerate(4 + 16 * rnd.random() for _ in range(31)))
    noise = (f'<svg class="s26-vis" viewBox="0 0 196 104" aria-hidden="true"><path class="s26-base" d="M4 52H192"/>'
             f'<g class="s26-nzv"><path d="{fuzz}"/></g></svg>')
    ref = "M4 70 C 40 66, 60 34, 98 40 S 160 78, 192 52"
    eq = (f'<svg class="s26-vis" viewBox="0 0 196 104" aria-hidden="true"><path class="s26-eqr" d="{ref}"/>'
          f'<path class="s26-eqa" d="M4 46 C 40 30, 64 86, 98 72 S 156 22, 192 34"/><path class="s26-eqb" d="{ref}"/></svg>')
    loud = ('<svg class="s26-vis" viewBox="0 0 196 104" aria-hidden="true">'
            '<rect class="s26-m1" x="52" y="40" width="34" height="58" rx="6"/>'
            '<g class="s26-m2g"><rect class="s26-m2" x="110" y="12" width="34" height="86" rx="6"/></g>'
            '<path class="s26-mt" d="M36 40H160"/></svg>')
    out = []
    for i, (vis, t) in enumerate(zip((noise, eq, loud), tags)):
        d = "ltr" if t.isascii() else "rtl"
        out.append(f'<div class="s26-mc s26-mc{i + 1}"><div class="s26-vw">{vis}</div>'
                   f'<div class="s26-mcl" dir="rtl">{CHECK.format(cls="s26-ck")}<b dir="{d}">{esc(t)}</b></div></div>')
    return "".join(out)


def _detail(fade):
    """B3 close-up of the right join: the original narration on the right, the new recording on the left."""
    sx = 180                                       # the join inside the panel
    right = [0.22, 0.48, 0.8, 0.95, 0.7, 0.88]     # going away from the join (into the words before it)
    left = [0.3, 0.62, 0.9, 0.76, 0.98, 0.64]
    bars_r = [(sx + 14 + i * 26, 70 * v) for i, v in enumerate(right)]
    bars_l = [(sx - 14 - i * 26, 70 * v) for i, v in enumerate(left)]
    near = bars_r[:2] + bars_l[:2]
    far = bars_r[2:] + bars_l[2:]
    near_html = "".join(f'<path class="s26-dn" d="M{x:.1f} {100 - hh:.1f}V{100 + hh:.1f}"/>' for x, hh in near)
    return (f'<div class="s26-det" data-focus="3">'
            f'<svg class="s26-dsv" viewBox="0 0 360 250" aria-hidden="true">'
            f'<path class="s26-dbar" d="{_bars(far, 100)}"/>{near_html}'
            f'<path class="s26-dclk" d="M{sx} 100 L{sx - 9} 16 L{sx + 10} 186 L{sx - 6} 40 L{sx + 4} 160 L{sx} 100"/>'
            f'<path class="s26-dfo" d="M{sx + 40} 34 C {sx + 16} 34, {sx - 8} 120, {sx - 40} 166"/>'
            f'<path class="s26-dfi" d="M{sx - 40} 34 C {sx - 16} 34, {sx + 8} 120, {sx + 40} 166"/>'
            f'<path class="s26-dbr" d="M{sx + 40} 190 v8 H{sx - 40} v-8"/>'
            f'</svg><i class="s26-dhead"></i>'
            f'<div class="s26-dlabel" dir="rtl"><span dir="ltr">{esc(fade[0])}</span> <span>{esc(fade[1])}</span> '
            f'<span dir="ltr">{esc(fade[2])}</span></div></div>')


def html(cfg):
    c = cfg["sim26"]
    h, starts = _narration()
    xs = sorted(h, reverse=True)
    before = [(x, h[x]) for x in xs if x >= DIP_R]
    sent = [(x, h[x]) for x in xs if DIP_L < x < DIP_R]
    after = [(x, h[x]) for x in xs if x <= DIP_L]
    nitems = sorted(_new_recording().items(), reverse=True)
    rnd = random.Random(7)
    noise = [(x - 4, 2.5 + 5.5 * rnd.random()) for x, _ in nitems if x - 4 > 6]
    w_new = DIP_R - NEW_L
    tracks = c["tracks"]

    def tlabel(txt):
        return f'<div class="s26-tlab" dir="rtl"><i></i><span>{esc(txt)}</span></div>'

    def blocks(spec, cls):
        return "".join(f'<i class="{cls}" style="left:{a}px;width:{b - a}px"></i>' for a, b in spec)

    def fxs(spec):
        return "".join(f'<span class="s26-fx" style="left:{a}px">{SPARK}</span>' for a in spec)

    rows = (
        f'<div class="s26-row s26-r1">{tlabel(tracks[1])}<div class="s26-rca"><div class="s26-rin">'
        f'{blocks([(480, 548), (560, 628)], "s26-cb")}<i class="s26-cb s26-cbs" style="left:272px;width:188px"></i>'
        f'<div class="s26-aft">{blocks([(190, 258), (96, 178)], "s26-cb")}</div></div></div></div>'
        f'<div class="s26-row s26-r2">{tlabel(tracks[2])}<div class="s26-rca"><div class="s26-rin">'
        f'{fxs([590, 500])}<div class="s26-aft">{fxs([210, 120])}</div></div></div></div>'
        f'<div class="s26-row s26-r3">{tlabel(tracks[3])}<div class="s26-rca"><div class="s26-rin">'
        f'<i class="s26-bb" style="left:494px;width:134px">{_broll_art("s26-bbi1", 134, 48)}</i>'
        f'<i class="s26-bb s26-bbn" style="left:192px;width:268px">{_broll_art("s26-bbi2", 268, 48)}</i>'
        f'<div class="s26-aft"><i class="s26-bb" style="left:96px;width:140px">{_broll_art("s26-bbi3", 140, 48)}</i></div>'
        f'</div></div></div>')
    seam = ('<div class="s26-seam" style="left:{x}px">'
            '<svg class="s26-fdg" viewBox="0 0 40 150" aria-hidden="true"><path d="M3 30 C 16 36, 26 102, 37 120"/>'
            '<path d="M3 120 C 14 102, 24 36, 37 30"/></svg></div>')
    return f"""<div class="simwrap sim26">
<div class="s26-call s26-cold" dir="rtl"><span>{esc(c["old"])}</span><i class="s26-lead"></i></div>
<div class="s26-call s26-cnew" dir="rtl"><span>{esc(c["new"])}</span><i class="s26-lead"></i></div>
<div class="s26-nar">
{tlabel(tracks[0])}
<div class="s26-ca"><div class="s26-wall">
<div class="s26-in s26-bef">{_svg("s26-bars", 800, 150, f'<path d="{_bars(before)}"/>')}</div>
<div class="s26-in s26-sen"><i class="s26-oldbox"></i>{_svg("s26-bars s26-red", 800, 150, f'<path d="{_bars(sent)}"/>')}</div>
<div class="s26-in s26-aftw">{_svg("s26-bars", 800, 150, f'<path d="{_bars(after)}"/>')}</div>
{_svg("s26-lvl", 800, 150, f'<path d="M630 {CY - HMAX + 4}H14"/><path d="M630 {CY + HMAX - 4}H14"/>')}
</div><i class="s26-slot"></i></div>
<div class="s26-nwd" style="left:{NEW_L}px;width:{w_new}px"><div class="s26-nw"><i class="s26-nwg"></i>
<div class="s26-nwsc">{_svg("s26-nbars", w_new, 150, f'<path d="{_bars(nitems)}"/>')}</div>
<div class="s26-noise">{_svg("s26-nz", w_new, 150, f'<path d="{_bars(noise)}"/>')}</div>
</div>{MIC}</div>
{seam.format(x=DIP_R)}{seam.format(x=NEW_L)}
</div>
<div class="s26-gr"><div class="s26-gca"><div class="s26-gin">{_svg("s26-gsv", 800, GH, _graph(h, starts))}</div></div>{tlabel(c["graph"])}</div>
<div class="s26-cut s26-cutr"><i class="d"></i><i class="s"></i></div><div class="s26-cut s26-cutl"><i class="d"></i><i class="s"></i></div>
<div class="s26-sil" style="left:{DIP_R}px"><i></i><span dir="rtl">{esc(c["silence"])}</span></div>
<div class="s26-sil" style="left:{DIP_L}px"><i></i><span dir="rtl">{esc(c["silence"])}</span></div>
<div class="s26-cards">{_cards(c["tags"])}</div>
<svg class="s26-wedge" viewBox="0 0 800 700" aria-hidden="true"><path d="M{DIP_R} 298 L408 340"/><path d="M{DIP_R} 298 L760 340"/></svg>
{_detail(c["fade"])}
<div class="s26-phone"><div class="s26-scr"><div class="s26-lamp"></div>
{person_svg("s26-person", "26")}
<svg class="s26-mouth" viewBox="0 0 30 14" aria-hidden="true"><ellipse cx="15" cy="7" rx="11" ry="4.6"/></svg>
<svg class="s26-ring" viewBox="0 0 70 70" aria-hidden="true"><circle cx="35" cy="35" r="30"/></svg>
<div class="s26-broll">{_broll_art("s26-bri", 182, 338)}</div>
</div></div>
<div class="s26-card s26-c1"><div class="s26-th">{_broll_art("s26-cth1", 196, 130)}</div><b dir="rtl">{esc(c["cards"][0])}</b>
{CHECK.format(cls="s26-ok")}</div>
<div class="s26-card s26-c2"><div class="s26-th s26-th2">{person_svg("s26-p2", "26b")}<i class="s26-desk"></i></div><b dir="rtl">{esc(c["cards"][1])}</b></div>
<i class="s26-fly"></i>
<div class="s26-rows">{rows}</div>
<i class="s26-dband"></i>
<div class="s26-dlab" dir="rtl"><i></i><span>{esc(c["diff"])}</span></div>
<i class="s26-head2"></i>
</div>"""


def cues(cfg):
    P, pe = cfg["phr"], cfg["phrEnd"]
    return [("snap", P[0] + 1.35), ("whoosh_soft", P[1] + 0.35), ("tick", P[2] + 1.5),
            ("shimmer", P[3] + 1.35), ("pop", P[4] + 1.6), ("swipe", pe + 0.9)]
