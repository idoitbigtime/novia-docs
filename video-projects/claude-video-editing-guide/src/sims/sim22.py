"""2.2 simulation: one visual beat per explanation phrase, then the two caption styles.
B1 large-v3 transcribes (waveform -> model chip -> words with time marks)
B2 the default model understands only English (red cross)
B3 the captions are read one by one as whole sentences; the guide's example is flagged (punch-in here)
B4 words that sound the same are fixed (letter pairs from the guide), the phone caption corrects
payoff: white pill switching in one frame, then kinetic words.
Beat times come from cfg["phr"] (scene-local); payoff times in cfg["sim22"] are relative to cfg["phrEnd"]."""
from textlayout import esc, kinetic_html
from art import person_svg

SPEAKER = ('<svg class="s22-spk" viewBox="0 0 28 24" aria-hidden="true"><path d="M3 9h5l6-5v16l-6-5H3z" fill="#c9c2ff"/>'
           '<path d="M18 8.5c1.4 1.9 1.4 5.1 0 7M21.5 5.5c3 3.6 3 9.4 0 13" fill="none" stroke="#c9c2ff" stroke-width="2" stroke-linecap="round"/></svg>')

# a long left arrow (RTL: from the wrong word to the right one) under the letter pair
FIX_ARROW = ('<svg class="s22-farw" viewBox="0 0 112 20" aria-hidden="true"><path d="M108 10 H5 M15 2 L5 10 L15 18" '
             'fill="none" stroke="#c9c2ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>')

# waveform bar heights (fixed pattern, px)
WAVE = [10, 18, 30, 22, 40, 52, 34, 20, 44, 60, 48, 28, 16, 36, 54, 42, 24, 12, 30, 46, 38, 22, 14, 26]


def _wave(cls):
    bars = []
    n = len(WAVE)
    for i, h in enumerate(WAVE):
        x = 10 + i * 16.6
        bars.append(f'<rect x="{x:.1f}" y="{45 - h * 0.6:.1f}" width="9" height="{h * 1.2:.1f}" rx="4.5"/>')
    return f'<svg class="{cls}" viewBox="0 0 410 90" aria-hidden="true">{"".join(bars)}</svg>'


def html(cfg):
    c = cfg["sim22"]
    fixes = []
    for i, (bad, good, pair) in enumerate(c["fixes"]):
        # the letter pair rides on the arrow between the wrong word and the right one
        fixes.append(
            f'<div class="s22-fix" dir="rtl"><span class="s22-bad">{esc(bad)}<i class="s22-strike"></i></span>'
            f'<span class="s22-mid"><span class="s22-pair">{SPEAKER}<b dir="rtl">{esc(pair)}</b></span>{FIX_ARROW}</span>'
            f'<span class="s22-good">{esc(good)}</span></div>'
        )
    blocks = "".join(f'<i class="s22-blk" style="width:{w}px"><u></u></i>' for w in (62, 40, 80, 50, 66, 40))
    pills = "".join(f'<span class="s22-pill" id="t22-p{i + 1}">{esc(p)}</span>' for i, p in enumerate(c["pills"]))
    t_kin = cfg["phrEnd"] + c["kin0"] + 0.25
    kin, _, _ = kinetic_html(c["kin"], t0=t_kin, step=c["kinStep"], pause=0.2)
    cap_w, cap_bad, cap_good = c["capWords"]
    # B3: the caption track, read caption by caption; the third caption is the guide's example
    def blk_row(ws):
        return '<div class="s22-row">' + "".join(f'<i class="s22-rb" style="width:{w}px"></i>' for w in ws) + "</div>"
    rows = (blk_row((96, 58, 120)) + blk_row((70, 112, 64, 52)) +
            f'<div class="s22-row s22-row3" data-focus="2"><span>{esc(cap_w)}</span><span class="s22-r3w">{esc(cap_bad)}'
            f'<svg class="s22-wavy" viewBox="0 0 90 12" aria-hidden="true"><path d="M2 6 Q 9 0 16 6 T 30 6 T 44 6 T 58 6 T 72 6 T 88 6"/></svg></span></div>' +
            blk_row((84, 66, 100)))
    return f"""<div class="simwrap sim22">
<div class="s22-phone"><div class="s22-screen"><div class="s22-lamp"></div><div class="s22-win"><i></i></div>
{person_svg("s22-person", "22")}
<div class="s22-cap3" dir="rtl"><span class="s22-cw">{esc(cap_w)}</span> <span class="s22-cx"><span class="s22-cxbad">{esc(cap_bad)}</span><span class="s22-cxgood">{esc(cap_good)}</span>
<svg class="s22-wavy" viewBox="0 0 90 12" aria-hidden="true"><path d="M2 6 Q 9 0 16 6 T 30 6 T 44 6 T 58 6 T 72 6 T 88 6"/></svg></span></div>
<div class="s22-pillrow">{pills}</div>
<div class="s22-kinrow kin" dir="rtl">{kin}</div>
</div></div>
<div class="s22-p1">
<div class="s22-wavebox">{_wave("s22-wave s22-wdim")}<div class="s22-wclip">{_wave("s22-wave s22-wlit")}</div><i class="s22-head"></i></div>
<div class="s22-flow"><i></i><i></i><i></i></div>
<div class="s22-chips">
<div class="s22-chip s22-big"><svg class="s22-chipo" viewBox="0 0 180 128" aria-hidden="true"><rect x="1.25" y="1.25" width="177.5" height="125.5" rx="23"/></svg>
<span class="s22-chipk" dir="rtl">{esc(c["bigLabel"])}</span><span class="s22-chipn" dir="ltr">large-v3</span>
<svg class="s22-ok" viewBox="0 0 30 30" aria-hidden="true"><path d="M6 15.5l6 6 12-13"/></svg></div>
<div class="s22-chip s22-def"><span class="s22-chipk" dir="rtl">{esc(c["defLabel"])}</span><span class="s22-chipt" dir="rtl">{esc(c["defTag"])}</span>
<svg class="s22-no" viewBox="0 0 30 30" aria-hidden="true"><path d="M9.5 9.5l11 11"/><path d="M20.5 9.5l-11 11"/></svg></div>
<span class="s22-tok" dir="rtl">{esc(c["token"])}</span>
</div>
<div class="s22-blocks">{blocks}</div>
</div>
<div class="s22-p3">{rows}<i class="s22-rd"></i></div>
<div class="s22-fixes">{"".join(fixes)}</div>
<div class="s22-label s22-l1"><i></i><span>{esc(c["label1"])}</span></div>
<div class="s22-label s22-l2"><i></i><span>{esc(c["label2"])}</span></div>
</div>"""


def pill_times(cfg):
    """[(tin, tout)] scene-local: consecutive, no gap, no overlap (prompt 2)."""
    c = cfg["sim22"]
    out = []
    t = cfg["phrEnd"] + c["pills0"]
    for _ in c["pills"]:
        out.append((round(t, 3), round(t + c["pillStep"], 3)))
        t += c["pillStep"]
    return out


def cues(cfg):
    c = cfg["sim22"]
    P = cfg["phr"]
    out = [("tick", P[0] + 1.25), ("glitch_soft", P[1] + 1.15), ("swipe", P[2] + 1.0), ("tick", P[2] + 1.8)]
    out += [("tick", P[3] + c["fix0"] + i * c["fixStep"] + 0.45) for i in range(len(c["fixes"]))]
    out += [("tick", a) for a, _ in pill_times(cfg)]
    return out
