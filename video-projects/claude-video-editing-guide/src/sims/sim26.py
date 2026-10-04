"""2.6 simulation: replacing only the wrong sentence. One visual beat per explanation phrase.
Canvas 800 x 700. Time runs right to left (reading direction), like sim22's playhead.
B0 the narration waveform with word marks; the wrong sentence is red; the loudness graph with a line at
   every word start; the cut points land on whisper's times, then snap to the nearest dip (silence); cut
B1 the new recording drops into the gap; everything after it on the narration moves by the length difference
B2 matched to the narration around it: background noise, EQ, loudness (tags with check marks)
B3 fade of 40ms on both sides of the join; the click at the join disappears (punch-in on the join)
B4 the mouth is visible on the video: Claude offers a B-roll or another angle; the B-roll covers it
payoff: captions, effects and B-roll tracks move by the same difference; a playhead runs through.
Times come from cfg["phr"] / cfg["phrEnd"] (scene-local)."""
import random

from art import person_svg
from textlayout import esc

# geometry (canvas px)
X0, X1, PITCH = 12, 668, 8          # bar centres, right to left
CY, HMAX = 70, 50                   # waveform centre line inside the clip area (local y), max half height
DIP_R, DIP_L = 464, 264             # the silences before and after the wrong sentence (cut points)
DELTA = 80                          # the new sentence is longer by this many px
NEW_L = DIP_L - DELTA               # left edge of the new recording (184)

CHECK = '<svg class="{cls}" viewBox="0 0 30 30" aria-hidden="true"><path d="M7 15.5l5.5 5.5L23.5 9"/></svg>'
SPARK = ('<svg class="s26-fxi" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.3 6.6 6.7 2.4-6.7 2.4L12 20.5l-2.3-6.6L3 11.5l6.7-2.4z"/></svg>')
MIC = ('<svg class="s26-mic" viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="2.5" width="7" height="12" rx="3.5"/>'
       '<path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5"/></svg>')


def _word_heights(n, rnd, amp):
    import math
    return [amp * (0.42 + 0.58 * math.sin(math.pi * (i + 0.5) / n)) * (0.72 + 0.5 * rnd.random()) for i in range(n)]


def _narration():
    """Bar heights for the original narration, keyed by bar x. Words of 4-8 bars, gaps of one low bar,
    two silent bars at each cut point."""
    rnd = random.Random(26)
    xs = list(range(X1, X0 - 1, -PITCH))
    h = {}
    silent = {DIP_R + 4, DIP_R - 4, DIP_L + 4, DIP_L - 4}
    # the wrong sentence: 3 words (200 · אלף · קמ״ש) between the two silences
    sent = [x for x in xs if DIP_L + 4 < x < DIP_R - 4]
    i, words, starts = 0, [], []
    # before / after parts: free word lengths
    k = 0
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
        for x2, hh in zip(run, _word_heights(len(run), rnd, HMAX * (0.78 + 0.22 * rnd.random()))):
            h[x2] = hh
        starts.append(run[0])
        if k < len(xs) and xs[k] not in silent and xs[k] not in sent:
            h[xs[k]] = 3 + 3 * rnd.random()     # gap between words
            k += 1
    # the sentence: 7 + gap + 6 + gap + 7 bars
    lens = [7, 6, 7]
    j = 0
    for wi, n in enumerate(lens):
        run = sent[j:j + n]
        starts.append(run[0])
        for x2, hh in zip(run, _word_heights(n, rnd, HMAX * 0.95)):
            h[x2] = hh
        j += n
        if wi < len(lens) - 1:
            h[sent[j]] = 3.5
            j += 1
    return h, sorted(set(starts), reverse=True)


def _new_recording():
    """Bars of the new recording (x relative to its own box, 280 px): silence, 200, אלף, קילומטר, בשנייה, silence."""
    rnd = random.Random(62)
    w = DIP_R - NEW_L
    xs = list(range(w - 4, 0, -PITCH))          # 276 .. 4
    h, k = {}, 0
    h[xs[k]] = 1.6
    k += 1
    for wi, n in enumerate([6, 5, 10, 9]):
        for hh in _word_heights(n, rnd, HMAX * 0.95):
            h[xs[k]] = hh
            k += 1
        if wi < 3:
            h[xs[k]] = 3.2
            k += 1
    while k < len(xs):
        h[xs[k]] = 1.6
        k += 1
    return h


def _bars_path(items):
    return " ".join(f"M{x:.1f} {CY - hh:.1f}V{CY + hh:.1f}" for x, hh in items)


def _svg(cls, w, d, extra=""):
    return f'<svg class="{cls}" viewBox="0 0 {w} 140" width="{w}" height="140" aria-hidden="true"><path d="{d}"/>{extra}</svg>'


def _broll_art(cls, w, h):
    """Generic line-art B-roll picture: sky, sun, two mountain lines, ground lines."""
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


def html(cfg):
    c = cfg["sim26"]
    h, starts = _narration()
    xs = sorted(h, reverse=True)
    before = [(x, h[x]) for x in xs if x >= DIP_R]
    sent = [(x, h[x]) for x in xs if DIP_L < x < DIP_R]
    after = [(x, h[x]) for x in xs if x <= DIP_L]
    nh = _new_recording()
    nitems = sorted(nh.items(), reverse=True)
    # background noise of the new recording: low bars between its main bars
    rnd = random.Random(7)
    noise = [(x - 4, 3 + 5 * rnd.random()) for x, _ in nitems if 8 < x - 4]
    # the loudness graph: an envelope over the bar peaks, drawn right to left (smoothed)
    pts = []
    for i, x in enumerate(xs):
        win = [h[xs[j]] for j in range(max(0, i - 1), min(len(xs), i + 2))]
        pts.append((x, CY - (sum(win) / len(win)) - 7))
    env = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts)
    wlines = "".join(f'<path d="M{x + 4:.1f} 8V132"/>' for x in starts)
    w_new = DIP_R - NEW_L
    t1, t2, t3 = c["tags"]
    tracks = c["tracks"]
    fd = c["fade"]

    def tlabel(txt):
        return f'<div class="s26-tlab" dir="rtl"><i></i><span>{esc(txt)}</span></div>'

    def blocks(spec, cls):
        return "".join(f'<i class="{cls}" style="left:{a}px;width:{b - a}px"></i>' for a, b in spec)

    fxs = lambda spec: "".join(f'<span class="s26-fx" style="left:{a}px">{SPARK}</span>' for a in spec)
    rows = (
        # captions: before, the sentence's caption (old timing, widens), after (old timing, moves)
        f'<div class="s26-row s26-r1">{tlabel(tracks[1])}<div class="s26-rca"><div class="s26-rin">'
        f'{blocks([(488, 560), (572, 664)], "s26-cb")}<i class="s26-cb s26-cbs" style="left:272px;width:184px"></i>'
        f'<div class="s26-aft">{blocks([(184, 256), (94, 172)], "s26-cb")}</div></div></div></div>'
        f'<div class="s26-row s26-r2">{tlabel(tracks[2])}<div class="s26-rca"><div class="s26-rin">'
        f'{fxs([600, 360])}<div class="s26-aft">{fxs([200, 110])}</div></div></div></div>'
        f'<div class="s26-row s26-r3">{tlabel(tracks[3])}<div class="s26-rca"><div class="s26-rin">'
        f'<i class="s26-bb" style="left:520px;width:140px">{_broll_art("s26-bbi1", 140, 48)}</i>'
        f'<i class="s26-bb s26-bbn" style="left:192px;width:264px">{_broll_art("s26-bbi2", 264, 48)}</i>'
        f'<div class="s26-aft"><i class="s26-bb" style="left:94px;width:136px">{_broll_art("s26-bbi3", 136, 48)}</i></div>'
        f'</div></div></div>'
    )
    return f"""<div class="simwrap sim26">
<div class="s26-call s26-cold" dir="rtl"><span>{esc(c["old"])}</span><i class="s26-lead"></i></div>
<div class="s26-call s26-cnew" dir="rtl"><span>{esc(c["new"])}</span><i class="s26-lead"></i></div>
<div class="s26-nar">
{tlabel(tracks[0])}
<div class="s26-ca"><div class="s26-wall">
<div class="s26-in s26-bef">{_svg("s26-bars", 800, _bars_path(before))}</div>
<div class="s26-in s26-sen"><i class="s26-oldbox"></i>{_svg("s26-bars s26-red", 800, _bars_path(sent))}</div>
<div class="s26-in s26-aftw">{_svg("s26-bars", 800, _bars_path(after))}</div>
<svg class="s26-env" viewBox="0 0 800 140" width="800" height="140" aria-hidden="true"><g class="s26-wl">{wlines}</g><path class="s26-envp" d="{env}"/></svg>
<svg class="s26-lvl" viewBox="0 0 800 140" width="800" height="140" aria-hidden="true"><path d="M668 {CY - HMAX + 2}H12"/><path d="M668 {CY + HMAX - 2}H12"/></svg>
</div><i class="s26-slot"></i></div>
<div class="s26-nwd" style="left:{NEW_L}px;width:{w_new}px"><div class="s26-nw">
<div class="s26-nwsc">{_svg("s26-nbars", w_new, _bars_path(nitems))}</div>
<div class="s26-noise">{_svg("s26-nz", w_new, _bars_path(noise))}</div>
</div></div>
<div class="s26-cut s26-cutr"><i></i></div><div class="s26-cut s26-cutl"><i></i></div>
<div class="s26-seam" style="left:{DIP_R}px"><svg class="s26-clk" viewBox="0 0 24 140" aria-hidden="true"><path d="M12 70 L6 18 L15 112 L9 36 L12 70"/></svg>
<svg class="s26-fdg" viewBox="0 0 40 140" aria-hidden="true"><path d="M3 28 C 16 34, 26 96, 37 112"/><path d="M3 112 C 14 96, 24 34, 37 28"/></svg></div>
<div class="s26-seam s26-seaml" style="left:{NEW_L}px"><svg class="s26-clk" viewBox="0 0 24 140" aria-hidden="true"><path d="M12 70 L6 18 L15 112 L9 36 L12 70"/></svg>
<svg class="s26-fdg" viewBox="0 0 40 140" aria-hidden="true"><path d="M3 28 C 16 34, 26 96, 37 112"/><path d="M3 112 C 14 96, 24 34, 37 28"/></svg></div>
<i class="s26-head s26-head1"></i>
</div>
<div class="s26-sil" style="left:{DIP_R}px"><i></i><span dir="rtl">{esc(c["silence"])}</span></div>
<div class="s26-sil" style="left:{DIP_L}px"><i></i><span dir="rtl">{esc(c["silence"])}</span></div>
<div class="s26-tags" dir="rtl">
<span class="s26-tag">{CHECK.format(cls="s26-ck")}<b dir="rtl">{esc(t1)}</b></span>
<span class="s26-tag">{CHECK.format(cls="s26-ck")}<b dir="ltr">{esc(t2)}</b></span>
<span class="s26-tag">{CHECK.format(cls="s26-ck")}<b dir="rtl">{esc(t3)}</b></span>
</div>
<div class="s26-fwrap" data-focus="3"><div class="s26-ftag" dir="rtl"><i></i><span dir="ltr">{esc(fd[0])}</span> <span>{esc(fd[1])}</span> <span dir="ltr">{esc(fd[2])}</span></div></div>
<div class="s26-phone"><div class="s26-scr"><div class="s26-lamp"></div>
{person_svg("s26-person", "26")}
<svg class="s26-mouth" viewBox="0 0 30 14" aria-hidden="true"><ellipse cx="15" cy="7" rx="11" ry="4.6"/></svg>
<svg class="s26-ring" viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="26"/></svg>
<div class="s26-broll">{_broll_art("s26-bri", 176, 324)}</div>
</div></div>
<div class="s26-card s26-c1"><div class="s26-th">{_broll_art("s26-cth1", 206, 136)}</div><b dir="rtl">{esc(c["cards"][0])}</b>
{CHECK.format(cls="s26-ok")}</div>
<div class="s26-card s26-c2"><div class="s26-th s26-th2">{person_svg("s26-p2", "26b")}<i class="s26-desk"></i></div><b dir="rtl">{esc(c["cards"][1])}</b></div>
<i class="s26-fly"></i>
<div class="s26-rows">{rows}</div>
<i class="s26-dband"></i>
<div class="s26-dlab" dir="rtl"><i></i><span>{esc(c["diff"])}</span></div>
<i class="s26-head s26-head2"></i>
</div>"""


def cues(cfg):
    P, pe = cfg["phr"], cfg["phrEnd"]
    return [("snap", P[0] + 1.35), ("whoosh_soft", P[1] + 0.07), ("tick", P[2] + 1.45),
            ("shimmer", P[3] + 1.2), ("pop", P[4] + 1.8), ("swipe", pe + 0.9)]
