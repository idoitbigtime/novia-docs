"""6.2 simulation: a screen recording made with Screen Studio, its own zooms, and a bouncy zoom on top.
B0 Screen Studio records the screen (REC pill, viewfinder) and adds an automatic zoom where the cursor clicks
B1 the recording is already full of zooms: the playhead races along the track and zoom segments appear
B2 the chat bubble: what to tell Claude ("ההקלטה מ-Screen Studio, אז בלי זום קפיצי משלך.")
B3 a bouncy zoom lands on top of every automatic zoom: the picture shakes, doubles, the viewer gets dizzy, red X
   (the engine's punch-in on "מסחררים" lands on the screen)
payoff: the bouncy layer is removed, the same recording plays only with its own zoom, check mark, and the
chat bubble comes back as the instruction to give.
Beat times come from cfg["phr"] (scene-local)."""
import math

from textlayout import esc
from art import person_svg

MAG = ('<svg class="s62-mag" viewBox="0 0 22 22" aria-hidden="true"><circle cx="9" cy="9" r="5.6"/>'
       '<path d="M13.2 13.2 L18.5 18.5"/></svg>')

CURSOR = ('<svg class="s62-cur" viewBox="0 0 24 34" aria-hidden="true">'
          '<path d="M2.5 2.5 L2.5 27 L8.8 21 L13.4 31.2 L17.6 29.2 L13.1 19.4 L21.5 19.4 Z"/></svg>')

# chart line inside the recording (fixed pattern)
CHART = [(12, 80), (46, 66), (80, 72), (114, 50), (148, 58), (182, 38), (216, 46), (250, 30), (284, 40), (318, 22), (348, 28)]

# zoom segments on the recording track: (left, width) in track px; the first one is the B0 zoom
SEGS = [(334, 189), (238, 62), (150, 58), (66, 52), (8, 40)]

# click points (recording px): button, chart, cards, side row 3
CLICKS = [(80, 291), (230, 210), (204, 118), (452, 128)]


def _spiral(cx=27, cy=27, turns=2.5, a=1.2, b=1.55, n=64):
    tmax = turns * 2 * math.pi
    pts = []
    for i in range(n + 1):
        th = tmax * i / n
        r = a + b * th
        pts.append((cx + r * math.cos(th), cy + r * math.sin(th)))
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts)


def _app(ghost=False):
    """The recorded app: a generic dashboard (no real UI)."""
    side = "".join(f'<i class="s62-row{" s62-on" if i == 1 else ""}" style="top:{22 + i * 34}px"><b></b><u></u></i>' for i in range(5))
    cards = "".join(f'<div class="s62-card" style="left:{x}px"><b></b><u></u></div>' for x in (24, 148, 272))
    pts = " ".join(f"{x},{y}" for x, y in CHART)
    extra = ""
    if not ghost:
        rips = "".join(f'<i class="s62-rip" id="s62-rip{i + 1}" style="left:{x}px;top:{y}px"></i>' for i, (x, y) in enumerate(CLICKS))
        extra = rips + CURSOR
    return (f'<div class="s62-app"><div class="s62-top"><i></i><i></i><i></i></div>'
            f'<div class="s62-side">{side}</div><i class="s62-h1"></i><i class="s62-h2"></i>{cards}'
            f'<div class="s62-chart"><svg viewBox="0 0 360 104" preserveAspectRatio="none" aria-hidden="true">'
            f'<polyline class="s62-area" points="12,104 {pts} 348,104"/><polyline class="s62-line" points="{pts}"/></svg></div>'
            f'<div class="s62-btn"><b></b></div>{extra}</div>')


def html(cfg):
    c = cfg["sim62"]
    segs = "".join(f'<div class="s62-seg" style="left:{l}px;width:{w}px">{MAG}</div>' for l, w in SEGS)
    bz = "".join(f'<i class="s62-bz" style="left:{l + 1.5}px;width:{w}px"></i>' for l, w in SEGS)
    vf = ('<svg class="s62-vf" viewBox="0 0 504 314" aria-hidden="true">'
          '<path d="M14 46 V14 H46"/><path d="M458 14 H490 V46"/><path d="M490 268 V300 H458"/><path d="M46 300 H14 V268"/></svg>')
    a1, lat, a1b = c["askL1"]
    # words wrapped in plain inline spans (no bidi change) so the typing can stop at word edges
    wd = lambda t: f'<span class="s62-wd">{esc(t)}</span>'
    ws1 = " ".join(wd(w) for w in a1.split()) + f'<span class="s62-lat" dir="ltr">{" ".join(wd(w) for w in lat.split())}</span>{esc(a1b)}'
    ws2 = " ".join(wd(w) for w in c["askL2"].split())
    return f"""<div class="simwrap sim62">
<i class="s62-glow"></i>
<div class="s62-lid"><i class="s62-cam"></i>
<div class="s62-screen" data-focus="3">
<div class="s62-zb"><div class="s62-za">{_app()}</div><div class="s62-gw"><div class="s62-gz">{_app(ghost=True)}</div></div></div>
{vf}
<div class="s62-hud"><div class="s62-hudp"><i></i><span dir="ltr">{esc(c["recName"])}</span></div></div>
</div>
<div class="s62-no"><svg viewBox="0 0 30 30" aria-hidden="true"><path d="M9.5 9.5l11 11"/><path d="M20.5 9.5l-11 11"/></svg></div>
<div class="s62-ok"><svg viewBox="0 0 30 30" aria-hidden="true"><path d="M6 15.5l6 6 12-13"/></svg></div>
</div>
<div class="s62-base"><i></i></div>
<div class="s62-bzrow">{bz}</div>
<div class="s62-tl"><i class="s62-fill"></i>{segs}<i class="s62-ph"></i></div>
<svg class="s62-lead" viewBox="0 0 20 60" aria-hidden="true"><path d="M10 2 V52"/></svg>
<div class="s62-lbl s62-auto" dir="rtl"><i></i><span>{esc(c["autoLabel"])}</span></div>
<div class="s62-ask"><div class="s62-lbl s62-asklbl" dir="rtl"><i></i><span>{esc(c["askLabel"])}</span></div>
<div class="s62-bub"><div class="s62-ln" dir="rtl"><span class="s62-tx s62-tx1">{ws1}</span></div>
<div class="s62-ln" dir="rtl"><span class="s62-tx s62-tx2">{ws2}</span></div>
<i class="s62-caret s62-c1"></i><i class="s62-caret s62-c2"></i></div></div>
<div class="s62-legend" dir="rtl"><div class="s62-lg s62-lgb"><i></i><span>{esc(c["bouncyLabel"])}</span></div>
<div class="s62-lg s62-lga"><i>{MAG}</i><span>{esc(c["autoLabel"])}</span></div></div>
<div class="s62-viewer">{person_svg("s62-vw", "62")}<svg class="s62-spiral" viewBox="0 0 54 54" aria-hidden="true"><path d="{_spiral()}"/></svg></div>
</div>"""


def cues(cfg):
    P, pe = cfg["phr"], cfg["phrEnd"]
    return [("tick", P[0] + 1.14), ("swipe", P[1] + 0.05), ("pop", P[2] + 0.25),
            ("glitch_soft", P[3] + 1.4), ("shimmer", pe + 0.95), ("whoosh_soft", pe + 2.2)]
