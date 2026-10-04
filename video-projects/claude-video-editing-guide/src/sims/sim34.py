"""3.4 simulation: the frame breaks into layers in CSS 3D, one visual beat per explanation phrase.
B0 the chosen word; a thin light line runs around the frame; the layers come apart in depth
B1 the four layers, back to front: the empty room, the text on the wall, you without the background, the effects
B2 the camera turns ~40 deg to the side and 9 from above and pulls back x1.4 (top-down map + digit counter);
   each layer gets a light frame and its Hebrew name (dot + line, alternating lengths), back to front
B3 the merge word: the layers and the camera return together on one spring and land exactly (punch-in here)
payoff: the landed frame is checked against the original: corner marks lock, a scan passes, "no difference".
Beat times come from cfg["phr"] (scene-local). The names sit in a flat layer over the 3D, at the corner of
each layer as projected by the same perspective math the CSS uses (the guide's own method)."""
import math

from textlayout import esc
from art import person_svg

W, H = 600, 338            # the video frame (16:9, like the guide's example video)
CX, CY = 400, 300          # frame centre in the 800 x 700 canvas (= perspective origin)
PERSP = 1800               # CSS perspective (px)
SHIFT = (-74, 6)           # camera re-centring while turned (keeps every name inside the canvas)
# names: (layer index, corner, line direction, line length); alternating lengths so no two names meet
LABELS = [(0, "tr", -1, 118), (1, "tr", -1, 52), (2, "bl", 1, 138), (3, "bl", 1, 58)]


def pose(cfg):
    c = cfg["sim34"]
    return dict(yaw=-c["yaw"], pitch=-c["pitch"], zb=PERSP * (c["pullBack"] - 1.0),
                depth=[d * W for d in c["depth"]], tx=SHIFT[0], ty=SHIFT[1])


def project(pt, p):
    """Screen position (canvas px) of a point (x, y, z) of the turned rig: yaw, then pitch, then the
    camera's translate3d(tx, ty, -zb); perspective around (CX, CY). Same order as the CSS transforms."""
    x, y, z = pt
    th, ph = math.radians(p["yaw"]), math.radians(p["pitch"])
    x1, z1 = x * math.cos(th) + z * math.sin(th), -x * math.sin(th) + z * math.cos(th)
    y2, z2 = y * math.cos(ph) - z1 * math.sin(ph), y * math.sin(ph) + z1 * math.cos(ph)
    x3, y3, z3 = x1 + p["tx"], y2 + p["ty"], z2 - p["zb"]
    s = PERSP / (PERSP - z3)
    return CX + x3 * s, CY + y3 * s


def corner(cfg, i, which):
    p = pose(cfg)
    x = W / 2 if which[1] == "r" else -W / 2
    y = -H / 2 if which[0] == "t" else H / 2
    return project((x, y, p["depth"][i]), p)


SPEAKER = ('<svg class="s34-spk" viewBox="0 0 28 24" aria-hidden="true"><path d="M3 9h5l6-5v16l-6-5H3z" fill="#c9c2ff"/>'
           '<path d="M18 8.5c1.4 1.9 1.4 5.1 0 7M21.5 5.5c3 3.6 3 9.4 0 13" fill="none" stroke="#c9c2ff" stroke-width="2" stroke-linecap="round"/></svg>')
# a generic floating "logo" (hexagonal gem) and an orb with a ring: the effects layer
GEM = ('<svg class="s34-gem" viewBox="0 0 80 80" aria-hidden="true"><path class="g1" d="M40 5 71 22.5v35L40 75 9 57.5v-35z"/>'
       '<path class="g2" d="M40 22 56 31v18L40 58 24 49V31z"/><path class="g3" d="M40 5v17M71 22.5 56 31M71 57.5 56 49M40 75V58M9 57.5 24 49M9 22.5 24 31"/></svg>')
ORB = ('<svg class="s34-orb" viewBox="0 0 90 90" aria-hidden="true"><circle class="o1" cx="45" cy="45" r="17"/>'
       '<ellipse class="o2" cx="45" cy="45" rx="40" ry="13" transform="rotate(-22 45 45)"/><circle class="o3" cx="80" cy="31" r="4.5"/></svg>')
SPARK = '<svg class="s34-spark" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0C11 7 13 9 20 10 13 11 11 13 10 20 9 13 7 11 0 10 7 9 9 7 10 0z"/></svg>'
# top-down camera icon: body + lens pointing up (towards the layers)
CAM_ICON = ('<svg class="s34-mmcam" viewBox="0 0 44 44" aria-hidden="true"><rect x="9" y="20" width="26" height="18" rx="4"/>'
            '<path d="M15 20 12 9h20l-3 11"/></svg>')
CHECK = '<svg class="s34-ok" viewBox="0 0 30 30" aria-hidden="true"><path d="M6 15.5l6 6 12-13"/></svg>'


def _odometer(digits, cls):
    return f'<span class="s34-odo {cls}"><span class="s34-strip">' + "".join(f"<b>{d}</b>" for d in digits) + "</span></span>"


def html(cfg):
    c = cfg["sim34"]
    names = c["names"]
    # --- the four layers (3D) ---
    sparks = "".join(f'<i class="s34-sp" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px">{SPARK}</i>'
                     for x, y, s in ((150, 64, 22), (372, 212, 18), (58, 150, 16), (290, 36, 14), (546, 250, 20)))
    wall = "".join(f'<span class="s34-wt{i + 1}" dir="rtl">{esc(t)}</span>' for i, t in enumerate(c["wallText"]))
    rails = "".join(f'<i class="s34-rail s34-r{k}"></i>' for k in range(4))
    layers = f"""<div class="s34-pl s34-room" data-focus="3"><i class="s34-lamp"></i><i class="s34-win"><u></u><s></s></i>
<i class="s34-floor"></i><i class="s34-plant"><u></u><s></s><b></b></i><i class="s34-edge"></i></div>
<div class="s34-pl s34-wall"><div class="s34-wt">{wall}</div><i class="s34-edge"></i></div>
<div class="s34-pl s34-me">{person_svg("s34-person", "34")}<i class="s34-edge"></i></div>
<div class="s34-pl s34-fx">{GEM}{ORB}{sparks}<i class="s34-edge"></i></div>
{rails}"""
    # --- names: flat layer, at each layer's projected corner (exploded pose) ---
    lab = []
    for k, (i, which, sgn, L) in enumerate(LABELS):
        ax, ay = corner(cfg, i, which)
        top = ay - L if sgn < 0 else ay
        ny = ay - L - 50 if sgn < 0 else ay + L + 4      # name box (46 px tall) just past the line end
        lab.append(
            f'<div class="s34-lab s34-lab{k}">'
            f'<i class="s34-ln" style="left:{ax - 1.25:.1f}px;top:{top:.1f}px;height:{L}px;transform-origin:50% {"100%" if sgn < 0 else "0%"}"></i>'
            f'<i class="s34-dot" style="left:{ax - 7:.1f}px;top:{ay - 7:.1f}px"></i>'
            f'<span class="s34-name" dir="rtl" style="right:{800 - ax - 12:.1f}px;top:{ny:.1f}px">{esc(names[i])}</span></div>')
    # --- top-down map of the camera turn ---
    a = math.radians(c["yaw"])
    r_arc = 54
    ax0, ay0 = 0, r_arc
    ax1, ay1 = r_arc * math.sin(a), r_arc * math.cos(a)
    bars = "".join(f'<i class="s34-mmb" style="top:{-d * 0.075 - 1.5:.1f}px"></i>' for d in pose(cfg)["depth"])
    units = [str(k % 10) for k in range(0, c["yaw"] + 1)]
    tens = [str(k) for k in range(0, c["yaw"] // 10 + 1)]
    mm = f"""<div class="s34-mm"><svg class="s34-mmsvg" viewBox="-110 -60 220 200" aria-hidden="true">
<circle class="s34-mmorb" cx="0" cy="0" r="92"/>
<path class="s34-mmarc" d="M{ax0:.1f} {ay0:.1f} A{r_arc} {r_arc} 0 0 0 {ax1:.1f} {ay1:.1f}"/></svg>
<div class="s34-mmpiv">{bars}<i class="s34-mmarm">{CAM_ICON}</i></div>
<div class="s34-deg" dir="ltr">{_odometer(tens, "s34-tens")}{_odometer(units, "s34-units")}<span class="s34-degs">°</span></div></div>"""
    # --- the chosen words ---
    chips = "".join(
        f'<div class="s34-chip s34-chip{k}" dir="rtl">{SPEAKER}<span class="s34-cw">{esc(w)}</span><i class="s34-pulse"></i></div>'
        for k, w in enumerate((c["splitWord"], c["mergeWord"])))
    # --- payoff: registration marks, scan, check, label ---
    regs = "".join(f'<i class="s34-reg s34-g{k}"></i>' for k in range(4))
    ring = (f'<svg class="s34-ring" viewBox="0 0 {W + 8} {H + 8}" aria-hidden="true">'
            f'<path d="M{W / 2 + 4} 4H{W - 18}a22 22 0 0 1 22 22V{H - 18}a22 22 0 0 1 -22 22H26a22 22 0 0 1 -22 -22V26a22 22 0 0 1 22 -22Z"/></svg>')
    return f"""<div class="simwrap sim34">
<div class="s34-in"><div class="s34-view"><div class="s34-cam"><div class="s34-yaw">
{layers}
</div></div></div>
{ring}
<div class="s34-regs">{regs}<i class="s34-scan"></i></div>
{CHECK}
</div>
{"".join(lab)}
{mm}
{chips}
<div class="s34-done" dir="rtl"><i></i><span>{esc(c["doneLabel"])}</span></div>
</div>"""


def cues(cfg):
    P = cfg["phr"]
    return [("tick", P[0] + 0.4), ("whoosh_soft", P[0] + 0.95), ("swipe", P[2] + 0.05),
            ("pop", P[2] + 0.95), ("tick", P[3] + 0.1), ("snap", P[3] + 1.25), ("shimmer", cfg["phrEnd"] + 1.1)]
