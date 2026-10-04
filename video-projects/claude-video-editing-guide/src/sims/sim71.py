"""7.1 simulation: approve 15 low-resolution seconds before the full render.
B0 the whole video's activity strip is scanned, the busiest 15 seconds are bracketed and fly into a small draft frame
B1 the draft is 540x960 inside the outline of the full 1080x1920 frame; the style waits for approval, then a check
B2 the loop "draft -> fix -> draft": every round re-renders the same small, low-resolution draft (the caption grows)
B3 no more fixes: the fix node goes out, one exit arrow, the draft grows into the one full render (punch-in here)
payoff: the race of two progress bars (draft: a minute and a half vs full render: about a quarter hour),
then the single-frame tag (npx hyperframes snapshot --at <second>).
Beat times come from cfg["phr"] (scene-local)."""
from textlayout import esc
from art import person_svg

# activity of the whole video (bar heights, px): the busiest stretch is bars 8..19
ACT = [18, 26, 14, 30, 22, 16, 28, 20, 44, 58, 66, 52, 70, 62, 56, 68, 60, 48, 64, 54,
       24, 18, 30, 22, 16, 26, 34, 20, 14, 28, 22, 18, 30, 24, 16, 22, 28, 18]
BUSY = (8, 19)
BX0, BSTEP, BW, BBOT = 14, 10.3, 6, 86       # bar x0, step, width, baseline (px, inside the strip)
STRIP_L, STRIP_T, SB = 28, 270, 1.5          # the strip's place on the canvas and its border

FILM = ('<svg class="s71-ico" viewBox="0 0 28 28" aria-hidden="true"><rect x="4" y="5" width="20" height="18" rx="3"/>'
        '<path d="M4 10h20M4 18h20M9 5v5M14 5v5M19 5v5M9 18v5M14 18v5M19 18v5"/></svg>')
WRENCH = ('<svg class="s71-ico s71-wr" viewBox="0 0 28 28" aria-hidden="true">'
          '<path d="M17.5 4.5a6 6 0 0 0-5.6 8.1L4.8 19.7a2.2 2.2 0 0 0 3.1 3.1l7.1-7.1a6 6 0 0 0 8.1-5.6l-3.4 3.4-3.6-.9-.9-3.6z"/></svg>')
CHECK = '<svg viewBox="0 0 30 30" aria-hidden="true"><path d="M6 15.5l6 6 12-13"/></svg>'
FRAME_ICO = ('<svg class="s71-fico" viewBox="0 0 30 30" aria-hidden="true"><rect x="4" y="6" width="22" height="18" rx="3"/>'
             '<circle cx="11" cy="13" r="2.5"/><path d="M6 22l6-6 4 4 3-3 5 5"/></svg>')


def _bars(cls, lo=0, hi=None):
    hi = len(ACT) if hi is None else hi
    out = []
    for i in range(lo, hi):
        h = ACT[i]
        x = 8 + (i - lo) * BSTEP if cls == "s71-cb" else BX0 + i * BSTEP
        busy = " s71-hot" if BUSY[0] <= i <= BUSY[1] else ""
        out.append(f'<i class="{cls}{busy}" style="left:{x:.1f}px;top:{BBOT - h}px;height:{h}px"></i>')
    return "".join(out)


def _scene():
    """The draft's picture: a busy 9:16 moment (generic: a presenter, a title, a caption, sparkles)."""
    stars = "".join(f'<i class="s71-sp" style="left:{x}px;top:{y}px"></i>' for x, y in ((22, 70), (112, 58), (100, 112), (30, 128)))
    return (f'<div class="s71-scene"><i class="s71-lamp"></i>{person_svg("s71-pers", "71")}'
            f'<i class="s71-t1"></i><i class="s71-t2"></i>{stars}<div class="s71-cap"><b></b></div></div>')


def html(cfg):
    c = cfg["sim71"]
    x0 = BX0 + BUSY[0] * BSTEP - 8
    x1 = BX0 + BUSY[1] * BSTEP + BW + 8
    brk_w = x1 - x0
    clip_bars = _bars("s71-cb", BUSY[0], BUSY[1] + 1)
    swatch = '<i style="background:#c9c2ff"></i><i style="background:#ff6b61"></i><i style="background:#f5f2ea"></i>'
    return f"""<div class="simwrap sim71">
<div class="s71-ghost"><i class="s71-gsolid"></i>
<div class="s71-draft">{_scene()}<i class="s71-px"></i><i class="s71-scan"></i><i class="s71-scan s71-scan2"></i><i class="s71-scan s71-scanf"></i></div>
<div class="s71-tagrow s71-tr540"><span class="s71-tag" dir="ltr">{esc(c["draftRes"])}</span></div>
<div class="s71-tagrow s71-tr1080"><span class="s71-tag s71-tag2" dir="ltr">{esc(c["fullRes"])}</span></div>
<div class="s71-dok">{CHECK}</div>
</div>
<div class="s71-b0">
<div class="s71-strip"><div class="s71-dim">{_bars("s71-bar")}</div><div class="s71-lit">{_bars("s71-bar")}</div><i class="s71-scanner"></i></div>
<svg class="s71-brk" style="left:{STRIP_L + SB + x0 - 2:.1f}px;width:{brk_w + 4:.1f}px" viewBox="0 0 {brk_w + 4:.1f} 124" aria-hidden="true"><rect x="2" y="2" width="{brk_w:.1f}" height="120" rx="16"/></svg>
<div class="s71-lbl s71-busy" dir="rtl"><i></i><span>{esc(c["busyLabel"])}</span></div>
<div class="s71-p15row"><span class="s71-p15" dir="rtl">{esc(c["secLabel"])}</span></div>
</div>
<div class="s71-clip" style="left:{STRIP_L + SB + x0:.1f}px;top:{STRIP_T + SB}px;width:{brk_w:.1f}px">{clip_bars}</div>
<div class="s71-b1">
<div class="s71-lbl s71-stl" dir="rtl"><i></i><span>{esc(c["styleLabel"])}</span></div>
<div class="s71-style"><b class="s71-glyph">אב</b><span class="s71-sw">{swatch}</span><span class="s71-capx"><b></b></span></div>
<div class="s71-wait"><i></i><i></i><i></i></div>
<div class="s71-sok">{CHECK}</div>
</div>
<div class="s71-loop">
<svg class="s71-arcs" viewBox="0 0 300 300" aria-hidden="true"><path class="s71-arcr" d="M207.4 68.1 A100 100 0 0 1 207.4 231.9"/><path class="s71-arcl" d="M92.6 231.9 A100 100 0 0 1 92.6 68.1"/>
<path class="s71-ah" d="M220.3 230.3 L207.4 231.9 L213.3 220.3"/><path class="s71-ah" d="M79.7 69.7 L92.6 68.1 L86.7 79.7"/></svg>
<div class="s71-arm"><i class="s71-dot s71-tail2"></i><i class="s71-dot s71-tail1"></i><i class="s71-dot"></i></div>
<div class="s71-node s71-nd" dir="rtl">{FILM}<span>{esc(c["loopDraft"])}</span></div>
<div class="s71-node s71-nf" dir="rtl">{WRENCH}<span>{esc(c["loopFix"])}</span><i class="s71-strike"></i></div>
</div>
<div class="s71-fz" data-focus="3"></div>
<svg class="s71-exit" viewBox="0 0 116 24" aria-hidden="true"><path d="M2 12 H108 M98 3 L108 12 L98 21"/></svg><i class="s71-xdot"></i>
<div class="s71-lbl s71-one" dir="rtl"><i></i><span>{esc(c["oneLabel"])}</span></div>
<div class="s71-race">
<div class="s71-lbl s71-rl s71-rl1" dir="rtl"><i></i><span>{esc(c["raceDraft"])}</span></div>
<div class="s71-rb s71-rb1"><i class="s71-rf"></i></div>
<div class="s71-rok">{CHECK}</div>
<div class="s71-lbl s71-rl s71-rl2" dir="rtl"><i></i><span>{esc(c["raceFull"])}</span></div>
<div class="s71-rb s71-rb2"><i class="s71-rf"></i></div>
</div>
<div class="s71-snap"><div class="s71-snl" dir="rtl">{FRAME_ICO}<span>{esc(c["snapLabel"])}</span></div>
<div class="s71-cmd" dir="ltr">{esc(c["snapCmd"])}</div></div>
</div>"""


def cues(cfg):
    P, pe = cfg["phr"], cfg["phrEnd"]
    return [("swipe", P[0] + 1.8), ("pop", P[1] + 1.65), ("tick", P[2] + 0.75),
            ("whoosh_soft", P[3] + 0.65), ("shimmer", pe + 1.9)]   # the tag lands 0.1 s after the draft's check: one sound
