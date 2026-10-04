"""3.7 simulation: a bouncy zoom on the important word of each sentence, one visual beat per phrase.
B0 the frame arrives as a 3D layer stack; the layers merge and it turns flat: this video needs no 3D
B1 the frame moves aside; three sentences (word blocks), one word in each is the important one
B2 on that word the picture inside the frame punches in by 12% (inside the guide's 10-15% range, on a meter);
   a HUD in the frame rolls 100% -> 112%
B3 the guide's spring curve draws in real time as the next sentence's word is said (punch-in on the graph)
B4 the zoom centre is the face (tracking box); a timeline plays to the next cut and the zoom resets to 100% in
   one frame
payoff: the guide's whole opening: three sentences, a punch-in on each word with the curve redrawn, back to 100%
   at each next sentence, then a slow 3% push on the long last sentence.
Time runs right to left in the plots (the reading direction, as in the reference topic)."""
import math

from textlayout import esc
from art import person_svg

FW, FH = 330, 586                  # the video frame (9:16)
FX0, FX1, FY = 235, 450, 57        # frame left in B0 (centred) and from B1 on; top
FACE = (165, 348)                  # face centre in the frame = the zoom centre
PX, PY, PW, PH = 20, 116, 400, 470 # the left panel
# the spring plot (panel-local): time runs right to left
GX0, GX1, GY0, GY1 = 360, 44, 362, 150     # t = 0 at the right, the end at the left; 100% and 112% heights


def spring(p):
    return (1 - (1 + 7 * p) * math.exp(-7 * p)) / (1 - 8 * math.exp(-7))


def curve_path():
    pts = [(GX0 + (GX1 - GX0) * k / 48, GY0 + (GY1 - GY0) * spring(k / 48)) for k in range(49)]
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts)


SPEAKER = ('<svg class="s37-spk" viewBox="0 0 28 24" aria-hidden="true"><path d="M3 9h5l6-5v16l-6-5H3z" fill="#c9c2ff"/>'
           '<path d="M18 8.5c1.4 1.9 1.4 5.1 0 7M21.5 5.5c3 3.6 3 9.4 0 13" fill="none" stroke="#c9c2ff" stroke-width="2" stroke-linecap="round"/></svg>')
MAG = ('<svg class="s37-mag" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="M15 15l6 6M7 10h6M10 7v6"/></svg>')


def _blocks(ws):
    return "".join(f'<i class="s37-bk" style="width:{w}px"></i>' for w in ws)


# the four sentences of the opening: word blocks, and the important word (None: the long last sentence)
SENT = [((52,), 0, (40, 62)), ((40, 66), 1, (38,)), ((56, 42, 50), 2, ()), ((60, 44, 70), None, (52, 64, 40))]


def caption(i, words, cls):
    pre, w, post = SENT[i]
    word = (f'<span class="s37-kw" dir="rtl">{esc(words[w])}<i class="s37-ul"></i></span>' if w is not None else "")
    return f'<div class="{cls}" dir="rtl">{_blocks(pre)}{word}{_blocks(post)}</div>'


def _odo(digits, cls):
    return f'<span class="s37-odo {cls}"><span class="s37-strip">' + "".join(f"<b>{d}</b>" for d in digits) + "</span></span>"


def html(cfg):
    c = cfg["sim37"]
    words = c["words"]
    fx, fy = FACE
    # --- the frame: three plates (3D at first), the captions, the HUD ---
    effect = "".join(f'<i class="s37-fxd" style="left:{x}px;top:{y}px"></i>' for x, y in ((60, 250), (262, 210), (276, 420), (40, 470), (150, 168)))
    plates = f"""<div class="s37-pl s37-p0"><div class="s37-in"><i class="s37-lamp"></i><i class="s37-win"><u></u><s></s></i><i class="s37-floor"></i></div><i class="s37-edge"></i></div>
<div class="s37-pl s37-p1"><div class="s37-in">{person_svg("s37-person", "37")}
<i class="s37-wave s37-w1"></i><i class="s37-wave s37-w2"></i>
<div class="s37-face" style="left:{fx - 66}px;top:{fy - 80}px"><i class="s37-fc s37-fc0"></i><i class="s37-fc s37-fc1"></i><i class="s37-fc s37-fc2"></i><i class="s37-fc s37-fc3"></i><i class="s37-fdot"></i></div>
</div><i class="s37-edge"></i></div>
<div class="s37-pl s37-p2"><i class="s37-ring"></i>{effect}<i class="s37-edge"></i></div>"""
    caps = "".join(caption(i, words, f"s37-cap s37-c{i}") for i in range(4))
    hud = (f'<div class="s37-hud" dir="ltr">{MAG}<span class="s37-num"><b>1</b>{_odo(["0", "1"], "s37-tens")}'
           f'{_odo([str(k % 10) for k in range(13)], "s37-units")}<b>%</b></span></div>')
    frame = f"""<div class="s37-frame" style="left:{FX0}px;top:{FY}px">
<div class="s37-fv"><div class="s37-rig">{plates}</div></div>
<div class="s37-caps">{caps}</div>{hud}<i class="s37-flash"></i><i class="s37-border"></i>
</div>"""
    # --- the left panel: four contents, one per beat ---
    rows = "".join(f'<div class="s37-row" style="top:{96 + i * 104}px">{SPEAKER}{caption(i, words, "s37-rcap")}</div>' for i in range(3))
    lo, hi = c["zoomRange"]
    mx = lambda v: 356 - v * (316 / 15.0)        # meter: 0% at the right, 15% at the left
    ticks = "".join(f'<i class="s37-tick{" s37-tk5" if v % 5 == 0 else ""}" style="left:{mx(v) - 1:.1f}px"></i>' for v in range(16))
    tlabels = "".join(f'<span class="s37-tl" dir="ltr" style="left:{mx(v) - 40:.1f}px">{v}%</span>' for v in (0, 5, 10, 15))
    meter = f"""<div class="s37-meter"><i class="s37-track" style="left:{mx(15):.1f}px;width:{mx(0) - mx(15):.1f}px"></i>
<i class="s37-band" style="left:{mx(hi):.1f}px;width:{mx(lo) - mx(hi):.1f}px"></i>{ticks}{tlabels}
<div class="s37-mk" style="left:{mx(0):.1f}px"><i class="s37-mkl"></i><i class="s37-mkd"></i><span class="s37-mkv" dir="ltr">{c["zoom"]}%</span></div></div>"""
    push_y = GY0 + (GY1 - GY0) * c["push"] / c["zoom"]
    graph = f"""<div class="s37-graph" data-focus="3"><svg class="s37-gsv" viewBox="0 0 {PW} {PH}" aria-hidden="true">
<path class="s37-ax" d="M{GX0 + 10} {GY0}H{GX1 - 14}M{GX0} {GY0 + 10}V{GY1 - 34}"/>
<path class="s37-tg" d="M{GX0} {GY1}H{GX1 - 6}"/>
<path class="s37-mkt" d="M{GX0} {GY0}V{GY1 - 30}"/></svg>
<div class="s37-gclip"><svg class="s37-gsv" viewBox="0 0 {PW} {PH}" aria-hidden="true"><path class="s37-cv" d="{curve_path()}"/></svg></div>
<div class="s37-gclip2"><svg class="s37-gsv" viewBox="0 0 {PW} {PH}" aria-hidden="true"><path class="s37-pv" d="M{GX0} {GY0}L{GX1} {push_y:.1f}"/></svg></div>
<i class="s37-gdot" style="left:{GX0 - 9}px;top:{GY0 - 9}px"></i>
<span class="s37-gl s37-g100" dir="ltr" style="left:{GX0 - 88}px;top:{GY0 + 14}px">{c["base"]}%</span>
<span class="s37-gl s37-g112" dir="ltr" style="left:{GX1 - 4}px;top:{GY1 - 46}px">{c["base"] + c["zoom"]}%</span>
<span class="s37-gw" style="left:{GX0 - 17}px;top:{GY1 - 70}px">{SPEAKER}</span></div>"""
    # timeline: clip A at the right, the cut, clip B at the left; the zoom level above it
    cut = 196
    tline = f"""<div class="s37-tline"><div class="s37-zclip"><svg class="s37-gsv" viewBox="0 0 {PW} {PH}" aria-hidden="true">
<path class="s37-zl" d="M370 186H{cut}V330H30"/></svg></div>
<i class="s37-clip s37-ca" style="left:{cut + 4}px;width:{370 - cut - 4}px"></i><i class="s37-clip s37-cb" style="left:30px;width:{cut - 34}px"></i>
<i class="s37-cut" style="left:{cut - 1.5}px"></i><span class="s37-cutl" dir="rtl" style="left:{cut - 60}px">{esc(c["cutLabel"])}</span>
<span class="s37-gl s37-t112" dir="ltr" style="left:226px;top:142px">{c["base"] + c["zoom"]}%</span><span class="s37-gl s37-t100" dir="ltr" style="left:30px;top:284px">{c["base"]}%</span>
<i class="s37-ph"></i></div>"""
    panel = f"""<div class="s37-panel" style="left:{PX}px;top:{PY}px;width:{PW}px;height:{PH}px">
<div class="s37-rows">{rows}</div>{meter}{graph}{tline}</div>"""
    return f"""<div class="simwrap sim37">
{panel}
{frame}
</div>"""


def cues(cfg):
    P, pe = cfg["phr"], cfg["phrEnd"]
    out = [("whoosh_soft", P[0] + 0.3), ("swipe", P[1] + 0.05), ("tick", P[1] + 0.6), ("pop", P[2] + 0.65), ("pop", P[3] + 0.45),
           ("snap", P[4] + 1.62)]
    out += [("pop", pe + 0.35 + k * 1.1) for k in range(3)]
    return out
