"""3.2 simulation: a 3D logo floating over the palm. One visual beat per explanation phrase.
Canvas 800 x 700. CSS 3D only: the hand is a line-art plane that tilts back (palm up); the logo is a stack of layers.
B0 every frame: the hand drawn in thin glowing lines gets its 21 tracking points; a strip of frames, each tracked
B1 the hand lies back (palm up); the palm centre and the hover point are worked out from the points; the logo's place
B2 on the chosen word (a word strip and a playhead) a point of light ignites and the logo grows from it in one turn;
   light in the logo's colour falls on the palm
B3 the hand moves and the logo follows a little late (a graph of the two paths, 0.1 s apart); the light dims as it lags
B4 it floats: a slow bob and a slow turn that shows its depth (punch-in on the logo)
payoff: a big move with the lag and a light trail, then the exit: it shrinks back into a point of light.
Times come from cfg["phr"] / cfg["phrEnd"] (scene-local)."""
import math

from textlayout import esc

# the hand, in design units (wrist at 0,0; y up is negative); MediaPipe's 21 landmarks
LM = [(0, 0), (-40, -40), (-78, -80), (-104, -118), (-124, -150),
      (-48, -178), (-56, -244), (-60, -286), (-63, -322),
      (-10, -186), (-10, -260), (-10, -306), (-10, -346),
      (26, -180), (32, -248), (36, -290), (39, -324),
      (58, -160), (68, -212), (74, -246), (78, -276)]
BONES = [(0, 1), (1, 2), (2, 3), (3, 4), (0, 5), (5, 6), (6, 7), (7, 8), (5, 9), (9, 10), (10, 11), (11, 12),
         (9, 13), (13, 14), (14, 15), (15, 16), (13, 17), (0, 17), (17, 18), (18, 19), (19, 20)]
PALM = [0, 5, 9, 13, 17]
OUTLINE = ("M-56 12 C-58 -10 -70 -40 -96 -70 C-118 -96 -136 -122 -144 -146 C-150 -166 -126 -184 -112 -164 "
           "C-100 -146 -86 -126 -66 -112 C-70 -150 -78 -240 -82 -312 C-84 -338 -44 -342 -42 -318 "
           "C-40 -270 -36 -230 -32 -196 C-34 -250 -35 -320 -34 -346 C-33 -370 14 -370 13 -346 "
           "C12 -300 12 -240 10 -196 C12 -240 14 -290 18 -318 C20 -342 58 -342 58 -318 "
           "C56 -270 50 -230 46 -190 C50 -220 54 -250 58 -272 C62 -296 98 -296 96 -270 "
           "C92 -220 86 -180 82 -150 C78 -100 72 -40 64 12")
# the plane: viewBox 300 x 400 with the wrist at (160, 390), drawn at K x; the wrist sits at canvas (WX, WY)
K, OX, OY, WX, WY = 1.5, 160, 390, 520, 660
TILT, PERSP = 50, 900                      # rotateX of the plane (deg) and the perspective (px)
LOGO = 210                                 # logo box (px)


def proj(dx, h, tilt=TILT):
    """Screen position of a plane point (design units, h up) after the tilt (perspective origin = the wrist)."""
    t = math.radians(tilt)
    z = K * h * math.sin(t)
    s = PERSP / (PERSP + z)
    return WX + K * dx * s, WY - K * h * math.cos(t) * s


PC = (sum(LM[i][0] for i in PALM) / 5, sum(LM[i][1] for i in PALM) / 5)          # palm centre (design)
M25 = ((LM[2][0] + LM[5][0]) / 2, (LM[2][1] + LM[5][1]) / 2)                       # midpoint of points 2 and 5
HX = (PC[0] + M25[0]) / 2                                                          # hover x (design)
PCS = proj(PC[0], -PC[1])                                                          # palm centre on screen
TOPS = proj(-10, 362)                                                              # highest finger on screen
HOV = (proj(HX, -PC[1])[0], TOPS[1] - 12)                                          # hover point on screen (12 px over the fingers)


def _hexpath(cx, cy, r, k=0.24):
    pts = [(cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a))) for a in range(-90, 270, 60)]
    d, n = [], len(pts)
    for i in range(n):
        p0, p1, p2 = pts[i - 1], pts[i], pts[(i + 1) % n]
        a = (p1[0] + (p0[0] - p1[0]) * k, p1[1] + (p0[1] - p1[1]) * k)
        b = (p1[0] + (p2[0] - p1[0]) * k, p1[1] + (p2[1] - p1[1]) * k)
        d.append(("M" if i == 0 else "L") + f"{a[0]:.1f} {a[1]:.1f}Q{p1[0]:.1f} {p1[1]:.1f} {b[0]:.1f} {b[1]:.1f}")
    return " ".join(d) + "Z"


STAR = "M50 28 C 52 44, 56 48, 72 50 C 56 52, 52 56, 50 72 C 48 56, 44 52, 28 50 C 44 48, 48 44, 50 28Z"


def logo3d(n=13, depth=34):
    """Generic extruded badge (rounded hexagon): n layers at different depths; glossy front with a spark."""
    hexd = _hexpath(50, 50, 45)
    out = []
    for i in range(n):
        z = -depth / 2 + depth * i / (n - 1)
        if i == n - 1:
            inner = ('<defs><linearGradient id="s32lg" x1="0" y1="0" x2="0.45" y2="1"><stop offset="0" stop-color="#ffa07e"/>'
                     '<stop offset="0.55" stop-color="#ff5a4c"/><stop offset="1" stop-color="#e8413a"/></linearGradient>'
                     '<linearGradient id="s32ls" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>'
                     '<stop offset="0.45" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>'
                     f'<path d="{hexd}" fill="url(#s32lg)"/><path d="{hexd}" fill="url(#s32ls)"/>'
                     f'<path d="{_hexpath(50, 50, 34)}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>'
                     f'<path d="{STAR}" fill="#ffffff"/>')
        elif i == 0:
            inner = f'<path d="{hexd}" fill="#c4443b"/><path d="{_hexpath(50, 50, 34)}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>'
        else:
            c = (0xa8 + i * 3, 0x33 + i * 2, 0x2e + i * 2)
            inner = f'<path d="{hexd}" fill="#{c[0]:02x}{c[1]:02x}{c[2]:02x}"/>'
        out.append(f'<svg class="s32-ly" viewBox="0 0 100 100" style="transform:translateZ({z:.2f}px)" aria-hidden="true">{inner}</svg>')
    return "".join(out)


def _pt(p):
    return f"{p[0] + OX:.1f} {p[1] + OY:.1f}"


def _plane():
    bones = " ".join(f"M{_pt(LM[a])} L{_pt(LM[b])}" for a, b in BONES)
    dots = "".join(f'<circle class="s32-lm{" s32-pp" if i in PALM else ""}" cx="{LM[i][0] + OX:.1f}" cy="{LM[i][1] + OY:.1f}" r="5.2"/>' for i in range(21))
    spokes = " ".join(f"M{_pt(LM[i])} L{_pt(PC)}" for i in PALM)
    return f"""<svg class="s32-psv" viewBox="0 0 300 400" aria-hidden="true">
<defs><clipPath id="s32clip"><path transform="translate({OX} {OY})" d="{OUTLINE} Z"/></clipPath>
<radialGradient id="s32pl"><stop offset="0" stop-color="#ff7a5f" stop-opacity="0.85"/><stop offset="0.45" stop-color="#ff5a4c" stop-opacity="0.38"/><stop offset="1" stop-color="#ff5a4c" stop-opacity="0"/></radialGradient></defs>
<g clip-path="url(#s32clip)"><ellipse class="s32-light" cx="{PC[0] + OX - 6:.1f}" cy="{PC[1] + OY - 40:.1f}" rx="150" ry="190" fill="url(#s32pl)"/></g>
<path class="s32-fill" transform="translate({OX} {OY})" d="{OUTLINE} Z"/>
<path class="s32-ol" transform="translate({OX} {OY})" d="{OUTLINE}"/>
<path class="s32-bn" d="{bones}"/>
<path class="s32-sp" d="{spokes}"/>
<path class="s32-m25" d="M{_pt(LM[2])} L{_pt(LM[5])}"/>
{dots}
<circle class="s32-pcm" cx="{PC[0] + OX:.1f}" cy="{PC[1] + OY:.1f}" r="9"/>
</svg>"""


def _thumb(dx, dy, rot):
    """A small video frame with the tracked points of one frame."""
    c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    pts = [(x * c - y * s, x * s + y * c) for x, y in LM]
    k, ox, oy = 0.26, 110 + dx, 112 + dy
    P = [(ox + x * k, oy + y * k) for x, y in pts]
    bones = " ".join(f"M{P[a][0]:.1f} {P[a][1]:.1f}L{P[b][0]:.1f} {P[b][1]:.1f}" for a, b in BONES)
    dots = " ".join(f"M{x:.1f} {y:.1f}h0.01" for x, y in P)
    return (f'<div class="s32-th"><svg viewBox="0 0 220 120" aria-hidden="true"><path class="b" d="{bones}"/>'
            f'<path class="d" d="{dots}"/></svg></div>')


def _graph(c):
    """B3: the two paths over time (time runs right to left); the logo's is the hand's, 0.1 s later."""
    def curve(shift):
        pts = []
        for i in range(0, 61):
            x = 250 - i * 3.8 - shift
            y = 70 - 34 * math.sin(i / 60 * math.pi * 1.6)
            pts.append(f"{x:.1f} {y:.1f}")
        return "M" + " L".join(pts)
    return (f'<div class="s32-graph"><svg class="s32-gsv" viewBox="0 0 270 130" aria-hidden="true">'
            f'<path class="ax" d="M258 112 H8"/><path class="gh" d="{curve(0)}"/><path class="gl" d="{curve(30)}"/>'
            f'<path class="br" d="M168 26 v-8 h-30 v8"/></svg>'
            f'<div class="s32-lag" dir="rtl">{esc(c["lag"])}</div>'
            f'<div class="s32-leg" dir="rtl"><span class="h"><i></i>{esc(c["hand"])}</span><span class="l"><i></i>{esc(c["logo"])}</span></div></div>')


def html(cfg):
    c = cfg["sim32"]
    pl_left, pl_top = WX - OX * K, WY - OY * K
    hov_x, hov_y = HOV
    lg_left, lg_top = hov_x - LOGO / 2, hov_y - LOGO
    words = "".join(f'<i class="s32-wd" style="width:{w}px"></i>' for w in (56, 40, 70))
    words_l = "".join(f'<i class="s32-wd" style="width:{w}px"></i>' for w in (58, 76, 46, 64, 70, 52))
    thumbs = "".join(_thumb(*p) for p in ((0, 0, 0), (10, -6, 4), (20, -12, 8), (12, -4, 3)))
    return f"""<div class="simwrap sim32" style="--hx:{hov_x:.1f}px;--hy:{hov_y:.1f}px">
<div class="s32-floor"></div>
<div class="s32-frames">{thumbs}<i class="s32-fsel"></i></div>
<div class="s32-wstrip" dir="rtl">{words}<span class="s32-cw"><i class="hl"></i></span>{words_l}<i class="s32-wph"></i></div>
<div class="s32-wlab" dir="rtl"><i></i><span>{esc(c["word"])}</span></div>
<svg class="s32-wlink" viewBox="0 0 800 700" aria-hidden="true"><path d="M{hov_x:.1f} 118 V{hov_y - 6:.1f}"/></svg>
{_graph(c)}
<div class="s32-mover">
<div class="s32-plane" style="left:{pl_left:.1f}px;top:{pl_top:.1f}px">{_plane()}</div>
<svg class="s32-hl" viewBox="0 0 800 700" aria-hidden="true"><path d="M{PCS[0]:.1f} {PCS[1]:.1f} L{hov_x:.1f} {hov_y + 4:.1f}"/></svg>
<div class="s32-hov" style="left:{hov_x - 16:.1f}px;top:{hov_y - 16:.1f}px"><i></i></div>
<div class="s32-hlab" dir="rtl" style="top:{hov_y + 22:.1f}px"><i></i><span>{esc(c["hover"])}</span></div>
</div>
<div class="s32-plab" dir="rtl"><span>{esc(c["points"])}</span><i></i></div>
<div class="s32-gh s32-gh2" style="left:{lg_left:.1f}px;top:{lg_top:.1f}px"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="{_hexpath(50, 50, 45)}"/></svg></div>
<div class="s32-gh s32-gh1" style="left:{lg_left:.1f}px;top:{lg_top:.1f}px"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="{_hexpath(50, 50, 45)}"/></svg></div>
<div class="s32-fol">
<div class="s32-beam" style="left:{hov_x - 130:.1f}px;top:{hov_y - 8:.1f}px"></div>
<div class="s32-ghost" style="left:{lg_left:.1f}px;top:{lg_top:.1f}px"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="{_hexpath(50, 50, 45)}"/></svg></div>
<div class="s32-lglow" style="left:{hov_x - 160:.1f}px;top:{lg_top - 55:.1f}px"></div>
<div class="s32-lgw" data-focus="4" style="left:{lg_left:.1f}px;top:{lg_top:.1f}px"><div class="s32-lg3">{logo3d()}</div></div>
<i class="s32-lp" style="left:{hov_x - 9:.1f}px;top:{hov_y - 9:.1f}px"></i>
</div>
</div>"""


def cues(cfg):
    P, pe = cfg["phr"], cfg["phrEnd"]
    return [("tick", P[0] + 0.55), ("whoosh_soft", P[1] + 0.05), ("shimmer", P[2] + 1.05), ("swipe", P[3] + 0.25),
            ("swipe", pe + 0.1), ("pop", pe + 2.35)]
