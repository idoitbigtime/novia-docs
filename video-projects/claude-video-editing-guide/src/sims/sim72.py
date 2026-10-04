"""7.2 simulation: Claude checks frames because it doesn't watch video.
B0 the video's play button is struck out; stills fan out of it and a magnifier (the check) looks at them
B1 after the render: a film strip; markers drop on every text entry, effect and cut; the magnifier visits each frame
B2 around the cut: a callout opens a strip of a frame every 0.1 second (the punch-in lands here)
B3 the magnifier scans the dense strip: two identical frames (freeze) and a title that jumps
payoff: the frame without a caption is marked red, lifts and grows, with the label
"פריים בלי כתובית: הבדיקה האוטומטית פספסה, הפריים תפס."
Beat times come from cfg["phr"] (scene-local)."""
from textlayout import esc

# main strip: 8 frames, right to left (time runs in the reading direction); frames 0-5 scene A, 6-7 scene B
STRIP = dict(x=20, y=116, w=760, h=176)
FW, FSTEP, FRIGHT = 72, 92, 748      # frame width, step, right edge of frame 0 (inside the strip; frames are 72 x 128)
# dense strip around the cut: 9 frames every 0.1 s, d0..d3 before the cut, d4..d8 after it
DW, DSTEP, DRIGHT = 64, 78, 704      # dense strip (at 40, 380, 720 x 214): frames 64 x 114
DTOP = 16

TEXT_ICO = ('<svg class="s72-mi" viewBox="0 0 26 26" aria-hidden="true"><path d="M5 6h16M13 6v15"/></svg>')
FX_ICO = ('<svg class="s72-mi" viewBox="0 0 26 26" aria-hidden="true"><path d="M13 3.5l2.4 6.6 6.6 2.4-6.6 2.4-2.4 6.6-2.4-6.6L4 12.5l6.6-2.4z"/></svg>')
CUT_ICO = ('<svg class="s72-mi" viewBox="0 0 26 26" aria-hidden="true"><circle cx="7" cy="19" r="3.4"/><circle cx="19" cy="19" r="3.4"/>'
           '<path d="M9.4 16.6L19 4M16.6 16.6L7 4"/></svg>')
UP_ICO = ('<svg class="s72-mi" viewBox="0 0 26 26" aria-hidden="true"><path d="M13 21V5M6.5 11.5L13 5l6.5 6.5"/></svg>')
PAUSE_ICO = ('<svg class="s72-mi" viewBox="0 0 26 26" aria-hidden="true"><path d="M9 6v14M17 6v14"/></svg>')
CHECK = '<svg viewBox="0 0 30 30" aria-hidden="true"><path d="M6 15.5l6 6 12-13"/></svg>'


def frame(cls="", style="", extra=""):
    """One generic 9:16 video frame: presenter (or a glowing orb in scene B), a title, a caption, a sparkle."""
    st = f' style="{style}"' if style else ""
    return (f'<div class="s72-fr {cls}"{st}><i class="s72-h"></i><i class="s72-bd"></i><i class="s72-ti"></i>'
            f'<i class="s72-cp"></i><i class="s72-fx"></i>{extra}</div>')


def html(cfg):
    c = cfg["sim72"]
    # B0: the video and the stills that come out of it
    vid = frame("sA s72-vid", "", '<i class="s72-prog"><b></b></i><i class="s72-play"><b></b></i>'
                '<svg class="s72-no" viewBox="0 0 170 302" aria-hidden="true"><path d="M52 118 L118 184"/></svg>')
    stills = "".join(frame(f"sA s72-still s72-st{i}", "", f'<i class="s72-ok">{CHECK}</i>') for i in range(4))
    # B1: the strip
    fr = []
    for k in range(8):
        cls = "sA" if k <= 5 else "sB"
        if k == 0:
            cls += " notitle"
        if k == 3:
            cls += " fxon"
        x = FRIGHT - FSTEP * k - FW
        fr.append(frame(f"{cls} s72-sf", f"left:{x}px;top:24px"))
    holes = "".join(f'<i style="left:{12 + i * 30}px"></i>' for i in range(25))
    # B1: copies of the frames under the markers, taken out of the strip to be looked at
    ex = "".join(frame(f"{cls} s72-ex s72-ex{i}", "", f'<i class="s72-ok">{CHECK}</i>') for i, cls in enumerate(("sA", "sA fxon", "sB")))
    marks = []
    for cls, ico, lab, fx in (("s72-mt", TEXT_ICO, c["markText"], 1), ("s72-mf", FX_ICO, c["markFx"], 3), ("s72-mc", CUT_ICO, c["markCut"], 5.5)):
        cx = STRIP["x"] + FRIGHT - FSTEP * fx - FW / 2 if fx != 5.5 else STRIP["x"] + FRIGHT - FSTEP * 5 - FW - (FSTEP - FW) / 2
        marks.append(f'<div class="s72-mark {cls}" style="left:{cx - 90:.1f}px"><div class="s72-chip" dir="rtl">{ico}<span>{esc(lab)}</span></div>'
                     f'<svg class="s72-stem" viewBox="0 0 4 40" aria-hidden="true"><path d="M2 0 V40"/></svg></div>')
    # B2-B3: the dense strip; d1 and d2 are the same frame (freeze), d4 has no caption, d6's title jumps
    dfr = []
    heads = [0, 5, 5, 10, 0, 0, 0, 0, 0]
    for i in range(9):
        cls = "sA" if i <= 3 else "sB"
        if i == 4:
            cls += " nocap"
        if i == 6:
            cls += " jump"
        x = DRIGHT - DSTEP * i - DW
        hs = f"--hx:{heads[i]}%;" if heads[i] else ""
        dfr.append(frame(f"{cls} s72-df s72-d{i}", f"left:{x}px;top:{DTOP}px;{hs}"))
    ticks = "".join(f'<i style="left:{DRIGHT - DSTEP * i - DW / 2 - 1:.1f}px"></i>' for i in range(9))
    big = frame("sB nocap s72-big", "", '<svg class="s72-ph" viewBox="0 0 186 331" aria-hidden="true"><rect x="35" y="254" width="116" height="30" rx="8"/></svg>')
    return f"""<div class="simwrap sim72">
<div class="s72-b0">{stills}{vid}</div>
<div class="s72-strip"><div class="s72-holes s72-ht">{holes}</div><div class="s72-holes s72-hb">{holes}</div>{"".join(fr)}</div><i class="s72-edge"></i>
{"".join(marks)}
{ex}
<svg class="s72-call" viewBox="0 0 800 700" aria-hidden="true"><path class="s72-cf" d="M190 294 L262 294 L760 380 L40 380 Z"/><path class="s72-cl" d="M190 294 L40 380"/><path class="s72-cl" d="M262 294 L760 380"/></svg>
<div class="s72-dense" data-focus="2">{"".join(dfr)}<div class="s72-ticks">{ticks}</div>
<svg class="s72-dim" viewBox="0 0 82 16" aria-hidden="true"><path d="M2 2 V14 M2 8 H80 M80 2 V14"/></svg>
<div class="s72-step" dir="rtl"><span dir="ltr">{esc(c["step"][0])}</span> {esc(c["step"][1])}</div>
<i class="s72-eq">=</i>
<svg class="s72-red" viewBox="0 0 72 122" aria-hidden="true"><rect x="3" y="3" width="66" height="116" rx="9"/></svg>
<i class="s72-hl s72-hl1"></i><i class="s72-hl s72-hl2"></i><i class="s72-hl s72-hl6"></i>
<svg class="s72-jarrow" viewBox="0 0 30 30" aria-hidden="true"><path d="M15 26V6M8 12l7-7 7 7"/></svg>
</div>
<div class="s72-flag s72-fz" dir="rtl">{PAUSE_ICO}<span>{esc(c["freezeLabel"])}</span></div>
<div class="s72-flag s72-fj" dir="rtl">{UP_ICO}<span>{esc(c["jumpLabel"])}</span></div>
<div class="s72-autorow"><div class="s72-auto" dir="rtl"><span>{esc(c["autoLabel"])}</span><i class="s72-aok">{CHECK}</i></div></div>
{big}
<div class="s72-catch" dir="rtl"><div class="s72-ct1"><i></i><span>{esc(c["catchTitle"])}</span></div><p class="s72-ct2">{esc(c["catchLine"])}</p></div>
<div class="s72-mag"><i class="s72-lens"></i><i class="s72-handle"></i></div>
</div>"""


def cues(cfg):
    P, pe = cfg["phr"], cfg["phrEnd"]
    return [("glitch_soft", P[0] + 0.25), ("whoosh_soft", P[1] + 0.1), ("swipe", P[2] + 0.15),
            ("tick", P[3] + 0.45), ("pop", pe + 0.75), ("shimmer", pe + 1.9)]
