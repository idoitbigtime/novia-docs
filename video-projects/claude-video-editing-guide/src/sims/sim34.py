"""3.4 simulation: the frame breaks into layers in CSS 3D, one visual beat per explanation phrase.
B0 the chosen word; a thin light line runs around the frame; the layers come apart in depth
B1 the four layers, back to front: the empty room, the text on the wall, you without the background, the effects
B2 the camera turns ~40 deg to the side and 9 from above and pulls back x1.4 (top-down map + rolling counter);
   each layer has a light frame and gets its Hebrew name (dot + line, alternating lengths), back to front
B3 the merge word: the layers and the camera return together on one spring and land exactly (punch-in here)
payoff: the landed frame is checked against the original picture: corner marks lock, a scan, "no difference".
Beat times come from cfg["phr"] (scene-local). The names sit in a flat layer over the 3D, at the corner of each
layer as projected by the same perspective math the CSS uses (the guide's own method, prompt 10 step 6)."""
import math

from textlayout import esc
from art import person_svg

W, H = 640, 360            # the video frame (16:9, like the guide's example video)
CX, CY = 400, 322          # frame centre in the 800 x 700 canvas (= perspective origin)
PERSP = 1800               # CSS perspective (px)
SHIFT = (-90, 40)          # camera re-centring while turned, so every name stays inside the canvas
R = 22                     # frame corner radius
# names: (layer, corner, line direction (-1 up / 1 down), line length, the name hangs left/right of its line)
# the lines alternate long / short so no two names meet (guide, prompt 10 step 6)
LABELS = [(0, "tr", -1, 64, "L"), (1, "tr", -1, 20, "L"), (2, "bl", 1, 64, "R"), (3, "bl", 1, 132, "R")]
FL, FT = CX - W // 2, CY - H // 2      # frame box in the canvas


def pose(cfg):
    c = cfg["sim34"]
    return dict(yaw=-c["yaw"], pitch=-c["pitch"], zb=PERSP * (c["pullBack"] - 1.0),
                depth=[d * W for d in c["depth"]], tx=SHIFT[0], ty=SHIFT[1])


def project(pt, p):
    """Canvas position of a point (x, y, z) of the turned rig: yaw, then pitch, then the camera's
    translate3d(tx, ty, -zb); perspective around (CX, CY). Same order as the CSS transforms."""
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
# the effects layer: a generic floating "logo" (hexagonal gem) and an orb with a ring
GEM = ('<svg class="s34-gem" viewBox="0 0 80 80" aria-hidden="true"><path class="g1" d="M40 5 71 22.5v35L40 75 9 57.5v-35z"/>'
       '<path class="g2" d="M40 22 56 31v18L40 58 24 49V31z"/><path class="g3" d="M40 5v17M71 22.5 56 31M71 57.5 56 49M40 75V58M9 57.5 24 49M9 22.5 24 31"/></svg>')
ORB = ('<svg class="s34-orb" viewBox="0 0 90 90" aria-hidden="true"><circle class="o1" cx="45" cy="45" r="17"/>'
       '<ellipse class="o2" cx="45" cy="45" rx="40" ry="13" transform="rotate(-22 45 45)"/><circle class="o3" cx="80" cy="31" r="4.5"/></svg>')
SPARK = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0C11 7 13 9 20 10 13 11 11 13 10 20 9 13 7 11 0 10 7 9 9 7 10 0z"/></svg>'
PLANT = ('<svg class="s34-plant" viewBox="0 0 70 120" aria-hidden="true"><path d="M35 78C33 52 22 34 8 22M35 78C37 50 46 30 62 16M35 78C35 58 34 44 31 30"/>'
         '<path d="M16 78h38l-5 38H21z"/></svg>')
# top-down camera icon: body + lens, the lens points up (towards the layers)
CAM_ICON = ('<svg class="s34-mmcam" viewBox="0 0 44 44" aria-hidden="true"><path d="M16 21 13 9h18l-3 12"/>'
            '<rect x="8" y="20" width="28" height="18" rx="4.5"/></svg>')
# a light sweep band (local: it starts fully outside its plate, so nothing shows at rest)
SW = '<i class="s34-sw"><b></b></i>'
# the cut-out outline traced around the person (same viewBox as art.person_svg)
CUT = ('<svg class="s34-cut" viewBox="0 0 312 380" aria-hidden="true"><path d="M14 380C20 300 70 262 120 254H128V191.5A58 68 0 1 1 184 191.5V254H192C242 262 292 300 298 380"/></svg>')
CHECK = '<svg class="s34-ok" viewBox="0 0 30 30" style="left:{x}px;top:{y}px" aria-hidden="true"><path d="M6 15.5l6 6 12-13"/></svg>'


def _odometer(digits, cls):
    return f'<span class="s34-odo {cls}"><span class="s34-strip">' + "".join(f"<b>{d}</b>" for d in digits) + "</span></span>"


def _box(x, y, w, h):
    return f"left:{x}px;top:{y}px;width:{w}px;height:{h}px"


def html(cfg):
    c = cfg["sim34"]
    names = c["names"]
    p = pose(cfg)
    # --- the four layers (3D) ---
    sparks = "".join(f'<i class="s34-sp" style="{_box(x, y, s, s)}">{SPARK}</i>'
                     for x, y, s in ((176, 70, 22), (404, 236, 18), (58, 172, 16), (264, 30, 14), (586, 262, 20)))
    wall = "".join(f'<span dir="rtl">{esc(t)}</span>' for t in c["wallText"])
    span = p["depth"][3] - p["depth"][0]
    rails = "".join(f'<i class="s34-rail" style="left:{x}px;top:{y}px;width:{span:.0f}px"></i>'
                    for x, y in ((-W // 2, -H // 2), (W // 2, -H // 2), (W // 2, H // 2), (-W // 2, H // 2)))
    layers = f"""<div class="s34-pl s34-room" data-focus="3"><i class="s34-lamp"></i><i class="s34-win"><u></u><s></s></i>
<i class="s34-floor"></i>{PLANT}{SW}{SW}<i class="s34-edge"></i></div>
<div class="s34-pl s34-wall"><div class="s34-wt">{wall}</div>{SW}<i class="s34-edge"></i></div>
<div class="s34-pl s34-me">{person_svg("s34-person", "34")}{CUT}{SW}<i class="s34-edge"></i></div>
<div class="s34-pl s34-fx">{GEM}{ORB}{sparks}{SW}<i class="s34-edge"></i></div>
{rails}"""
    # --- names: a flat layer, at each layer's projected corner in the turned pose ---
    lab = []
    for k, (i, which, sgn, L, side) in enumerate(LABELS):
        ax, ay = corner(cfg, i, which)
        top = ay - L if sgn < 0 else ay
        ny = ay - L - 50 if sgn < 0 else ay + L + 4      # the name box (46 px tall) just past the line end
        pos = f"right:{800 - ax - 12:.1f}px" if side == "L" else f"left:{ax - 12:.1f}px"
        lab.append(
            f'<div class="s34-lab">'
            f'<i class="s34-ln" style="left:{ax - 1.25:.1f}px;top:{top:.1f}px;height:{L}px;transform-origin:50% {"100%" if sgn < 0 else "0%"}"></i>'
            f'<i class="s34-dot" style="left:{ax - 7:.1f}px;top:{ay - 7:.1f}px"></i>'
            f'<span class="s34-name" dir="rtl" style="{pos};top:{ny:.1f}px">{esc(names[i])}</span></div>')
    # --- top-down map of the camera turn (layers seen from above, the camera travels 40 deg around them) ---
    a = math.radians(c["yaw"])
    rr = 54
    bars = "".join(f'<i class="s34-mmb" style="top:{d * 0.072 - 1.5:.1f}px"></i>' for d in p["depth"])
    units = [str(k % 10) for k in range(0, c["yaw"] + 1)]
    tens = [""] + [str(k) for k in range(1, c["yaw"] // 10 + 1)]      # no leading zero
    mm = f"""<div class="s34-mm"><svg class="s34-mmsvg" viewBox="-84 -66 244 158" aria-hidden="true">
<circle class="s34-mmorb" cx="0" cy="0" r="{rr}"/>
<path class="s34-mmarc" d="M0 {rr} A{rr} {rr} 0 0 0 {rr * math.sin(a):.1f} {rr * math.cos(a):.1f}"/></svg>
<div class="s34-mmpiv">{bars}<i class="s34-mmarm"><i class="s34-mmsight"></i>{CAM_ICON}</i></div>
<div class="s34-deg" dir="ltr">{_odometer(tens, "s34-tens")}{_odometer(units, "s34-units")}<span class="s34-degs">°</span></div></div>"""
    # --- the chosen words ---
    chips = "".join(
        f'<div class="s34-chip s34-chip{k}" dir="rtl">{SPEAKER}<span class="s34-cw">{esc(w)}</span><i class="s34-pulse"></i></div>'
        for k, w in enumerate((c["splitWord"], c["mergeWord"])))
    # --- the light line around the frame, payoff marks ---
    ring = (f'<svg class="s34-ring" style="{_box(FL - 4, FT - 4, W + 8, H + 8)}" viewBox="0 0 {W + 8} {H + 8}" aria-hidden="true">'
            f'<path d="M{W / 2 + 4} 4H{W + 4 - R}a{R} {R} 0 0 1 {R} {R}V{H + 4 - R}a{R} {R} 0 0 1 -{R} {R}H{4 + R}'
            f'a{R} {R} 0 0 1 -{R} -{R}V{4 + R}a{R} {R} 0 0 1 {R} -{R}Z"/></svg>')
    regs = "".join(f'<i class="s34-reg s34-g{k}"></i>' for k in range(4))
    return f"""<div class="simwrap sim34">
<div class="s34-in"><div class="s34-view"><div class="s34-cam" data-tx="{p["tx"]}" data-ty="{p["ty"]}" data-zb="{p["zb"]:.1f}" data-yaw="{p["yaw"]}" data-pitch="{p["pitch"]}"><div class="s34-yaw">
{layers}
</div></div></div>
{ring}
<div class="s34-scanbox" style="{_box(FL, FT, W, H)}"><i class="s34-scan"></i></div>
<div class="s34-regs" style="{_box(FL, FT, W, H)}">{regs}</div>
{CHECK.format(x=FL + W - 25, y=FT - 25)}
</div>
{"".join(lab)}
{mm}
<div class="s34-chips" style="top:{FT + H + 28}px">{chips}</div>
<div class="s34-done" dir="rtl" style="top:{FT + H + 36}px"><i></i><span>{esc(c["doneLabel"])}</span></div>
</div>"""


def cues(cfg):
    P = cfg["phr"]
    return [("tick", P[0] + 0.35), ("whoosh_soft", P[0] + 0.95), ("swipe", P[2] + 0.05),
            ("tick", P[3] + 0.56), ("snap", P[3] + 1.45), ("shimmer", cfg["phrEnd"] + 1.75)]
