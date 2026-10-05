"""2.4 simulation: one visual beat per explanation phrase, then the three strengths.
An illustrated frame (wall, plant, a presenter in a tee under an open black shirt) next to a hue wheel whose
dots are the frame's colours (brand hue at the top).
B0 (phr0) the colours get stronger: the wheel turns vivid, the dots move out, the brand point appears
B1 (phr1) arrows pull the nearby hues to the brand: the wall and the tee turn toward it; the plant (far) does not
B2 (phr2) the skin: a protected wedge (12 degrees, soft to 30), its dot moves a quarter and stops at a cap;
   a meter shows a quarter of the boost with a cap at x1.2 (punch-in here)
B3 (phr3) the grey centre does not move: the black shirt stays black
payoff: three strengths side by side, 1.55 / 1.85 / 2.2; the skin is the same in the medium and the strong one.
Colours follow the guide's rules (prompt 4): saturation x strength, hues within 120 degrees of the brand pulled
toward it on a smooth curve (0 at the brand and at the edge, up to 30 in the middle), skin hue kept and its
boost a quarter, capped at x1.2, near-grey colours untouched, lightness unchanged. Brand: the guide's purple."""
import colorsys
import json
import math

from textlayout import esc, kinetic_html

BRAND_H = 275                      # the guide's example brand: purple
STRENGTHS = (1.55, 1.85, 2.2)      # עדין / בינוני / חזק (guide, prompt 4)
MAIN_K = 1.85                      # the beats show the medium strength
SKIN_CAP = 1.2
# base colours of the illustrated frame (h, s, l); hair and the black shirt are near-grey
BASE = {
    "wall": (262, 26, 36), "tee": (226, 32, 46), "plant": (148, 30, 38),
    "skin": (24, 40, 66), "neck": (22, 36, 55), "ear": (22, 38, 60),
    "black": (248, 7, 14), "hair": (250, 9, 17),
}
SKIN = ("skin", "neck", "ear")
GREY = ("black", "hair")
WHEEL = dict(cx=195, cy=330, r=140)
FRAME = dict(x=400, y=112, w=380, h=428)   # 20 px inside the canvas's right edge
DOT_ITEMS = ("wall", "tee", "plant", "skin", "black")


def hexc(h, s, l):
    r, g, b = colorsys.hls_to_rgb((h % 360) / 360, l / 100, min(100, s) / 100)
    return "#%02x%02x%02x" % (round(r * 255), round(g * 255), round(b * 255))


def ang(h):
    """Wheel angle of a hue: clockwise from the top, the brand at 0."""
    return ((h - BRAND_H + 540) % 360) - 180


def pulled(h):
    a = ang(h)
    d = abs(a)
    if d >= 120:
        return h
    p = min(d, 30 * math.sin(math.pi * d / 120))
    return h - math.copysign(p, a)


def state(name, k, pull=True, skin=True):
    h, s, l = BASE[name]
    if name in GREY:
        return h, s, l
    if name in SKIN:
        return (h, s * min(1 + (k - 1) / 4, SKIN_CAP), l) if skin else (h, s, l)
    return (pulled(h) if pull else h), s * k, l


def states():
    """Colours per beat (hex) and wheel dot positions (angle, radius) per beat."""
    out = {}
    for n in BASE:
        seq = [BASE[n], state(n, MAIN_K, pull=False, skin=False), state(n, MAIN_K, pull=True, skin=False),
               state(n, MAIN_K, pull=True, skin=True)]
        out[n] = dict(c=[hexc(*v) for v in seq], a=[round(ang(v[0]), 2) for v in seq],
                      r=[round(rad(v[1]), 1) for v in seq])
        out[n]["k"] = [hexc(*state(n, k)) for k in STRENGTHS]
    return out


def rad(s):
    return WHEEL["r"] * min(0.92, 0.08 + s / 100 * 1.1)


def scene(cols, uid, cls):
    """The illustrated frame (viewBox 400 x 450). cols: name -> hex."""
    c = cols
    leaves = [("M70 352 C52 318 58 286 82 266 C92 296 90 324 70 352Z", "plant"),
              ("M74 354 C88 322 112 306 136 306 C126 330 104 350 74 354Z", "plant"),
              ("M68 354 C50 336 28 330 10 336 C24 354 46 362 68 354Z", "plant"),
              ("M72 350 C70 316 78 294 100 280 C102 308 92 330 72 350Z", "plant")]
    lv = "".join(f'<path class="c-{n}" d="{d}" style="fill:{c[n]}"/>' for d, n in leaves)
    return f"""<svg class="{cls}" viewBox="0 0 400 450" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<defs><radialGradient id="lt{uid}" cx="0.22" cy="0.12" r="0.95"><stop offset="0" stop-color="#ffffff" stop-opacity="0.17"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
<linearGradient id="vg{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0.5" stop-color="#000000" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity="0.32"/></linearGradient></defs>
<rect class="c-wall" width="400" height="450" style="fill:{c["wall"]}"/>
<rect width="400" height="450" fill="url(#lt{uid})"/>
<rect class="s24-pic" x="262" y="56" width="96" height="74" rx="4"/>
{lv}
<path class="s24-pot" d="M50 354 H96 L90 404 H56 Z"/>
<path class="c-black" d="M58 450 C64 372 116 340 166 334 L234 334 C284 340 336 372 342 450 Z" style="fill:{c["black"]}"/>
<path class="c-tee" d="M174 334 L226 334 L252 450 L148 450 Z" style="fill:{c["tee"]}"/>
<path class="s24-lap" d="M174 334 L148 450 M226 334 L252 450"/>
<rect class="c-neck" x="179" y="262" width="42" height="80" rx="16" style="fill:{c["neck"]}"/>
<ellipse class="c-ear" cx="145" cy="214" rx="9" ry="15" style="fill:{c["ear"]}"/><ellipse class="c-ear" cx="255" cy="214" rx="9" ry="15" style="fill:{c["ear"]}"/>
<ellipse class="c-skin" cx="200" cy="206" rx="56" ry="70" style="fill:{c["skin"]}"/>
<path class="c-hair" d="M144 202 C138 150 166 128 200 128 C236 128 264 150 256 202 C250 172 230 160 200 160 C172 160 150 172 144 202Z" style="fill:{c["hair"]}"/>
<rect width="400" height="450" fill="url(#vg{uid})"/>
</svg>"""


def _pt(a, r, cx=0.0, cy=0.0):
    return cx + r * math.sin(math.radians(a)), cy - r * math.cos(math.radians(a))


def _sector(a0, a1, r0, r1):
    x0, y0 = _pt(a0, r1)
    x1, y1 = _pt(a1, r1)
    x2, y2 = _pt(a1, r0)
    x3, y3 = _pt(a0, r0)
    big = 1 if a1 - a0 > 180 else 0
    return (f"M{x0:.1f} {y0:.1f} A{r1} {r1} 0 {big} 1 {x1:.1f} {y1:.1f} L{x2:.1f} {y2:.1f} "
            f"A{r0} {r0} 0 {big} 0 {x3:.1f} {y3:.1f} Z")


def _arc(a0, a1, r):
    x0, y0 = _pt(a0, r)
    x1, y1 = _pt(a1, r)
    sweep = 1 if a1 > a0 else 0
    return f"M{x0:.1f} {y0:.1f} A{r} {r} 0 0 {sweep} {x1:.1f} {y1:.1f}"


def _head(a, r, toward):
    """Arrow head at angle a on radius r, pointing along the circle toward increasing (+1) or decreasing angle."""
    x, y = _pt(a, r)
    tx, ty = math.cos(math.radians(a)) * toward, math.sin(math.radians(a)) * toward
    nx, ny = math.sin(math.radians(a)), -math.cos(math.radians(a))
    L, W = 11, 7
    bx, by = x - tx * L, y - ty * L
    return f"M{bx + nx * W:.1f} {by + ny * W:.1f} L{x:.1f} {y:.1f} L{bx - nx * W:.1f} {by - ny * W:.1f}"


def html(cfg):
    c = cfg["sim24"]
    st = states()
    W, F = WHEEL, FRAME
    R = W["r"]
    c0 = {n: v["c"][0] for n, v in st.items()}
    # hue wheel: muted and vivid conic gradients (brand at the top), grey centre, wedge, arcs, dots
    def conic(s, l):
        stops = ", ".join(f"{hexc(h, s, l)} {h}deg" for h in range(0, 361, 30))
        return f"conic-gradient(from {-BRAND_H}deg, {stops})"
    skin_a = st["skin"]["a"][0]
    wedge = (f'<path class="s24-wsoft" d="{_sector(skin_a - 30, skin_a + 30, 22, R)}"/>'
             f'<path class="s24-wsolid" d="{_sector(skin_a - 12, skin_a + 12, 22, R)}"/>')
    cap_r = st["skin"]["r"][3]
    cap = f'<path class="s24-cap" d="{_arc(skin_a - 13, skin_a + 13, cap_r + 9)}"/>'
    ar = R + 18
    arcs = (f'<path class="s24-pa" d="{_arc(-112, -9, ar)}"/><path class="s24-pa" d="{_arc(112, 9, ar)}"/>'
            f'<path class="s24-pah" d="{_head(-9, ar, 1)}"/><path class="s24-pah" d="{_head(9, ar, -1)}"/>')
    bx, by = _pt(0, R)
    brand = (f'<circle class="s24-bring" cx="{bx:.1f}" cy="{by:.1f}" r="15"/>'
             f'<circle class="s24-bdot" cx="{bx:.1f}" cy="{by:.1f}" r="10" style="fill:{hexc(BRAND_H, 62, 56)}"/>')
    grey = ('<circle class="s24-g2" cx="0" cy="0" r="30"/><circle class="s24-g1" cx="0" cy="0" r="19"/>'
            '<circle class="s24-gring" cx="0" cy="0" r="30"/>')
    m = 46
    wsvg = (f'<svg class="s24-wsvg" style="left:{-m}px;top:{-m}px;width:{2 * R + 2 * m}px;height:{2 * R + 2 * m}px" '
            f'viewBox="{-R - m} {-R - m} {2 * R + 2 * m} {2 * R + 2 * m}" aria-hidden="true">'
            f'<g class="s24-wedge">{wedge}</g>{cap}{grey}<circle class="s24-rim" cx="0" cy="0" r="{R}"/>{arcs}{brand}</svg>')
    dots = "".join(f'<div class="s24-dw s24-dw-{n}" style="transform:rotate({st[n]["a"][0]}deg)"><i class="s24-dot s24-dot-{n}" '
                   f'style="background:{c0[n]};transform:translateY({-st[n]["r"][0]}px)"></i></div>' for n in DOT_ITEMS)
    wheel = (f'<div class="s24-wheel" style="left:{W["cx"] - R}px;top:{W["cy"] - R}px;width:{2 * R}px;height:{2 * R}px">'
             f'<i class="s24-wh s24-wh0" style="background:{conic(30, 50)}"></i><i class="s24-wh s24-wh1" style="background:{conic(58, 52)}"></i>'
             f'<i class="s24-whc"></i>{wsvg}{dots}</div>')
    # wheel labels
    def tag(cls, x, y, txt):
        return f'<div class="s24-wt {cls}" style="left:{x:.0f}px;top:{y:.0f}px"><b dir="ltr">{txt}</b></div>'
    t12 = _pt(skin_a + 12, R + 30, W["cx"], W["cy"])
    t30 = _pt(skin_a + 32, R + 36, W["cx"], W["cy"])
    wl = (f'<div class="s24-bl" style="left:{W["cx"]}px;top:{W["cy"] - R - 96}px"><span dir="rtl"><i></i>{esc(c["brandLabel"])}</span></div>'
          f'<i class="s24-blead" style="left:{W["cx"] - 1}px;top:{W["cy"] - R - 50}px"></i>'
          + tag("s24-t12", t12[0], t12[1], "12°") + tag("s24-t30", t30[0], t30[1], "30°")
          + f'<div class="s24-gl" style="left:{W["cx"]}px;top:{W["cy"] + R + 34}px"><span dir="rtl"><i></i>{esc(c["greyLabel"])}</span></div>'
          f'<i class="s24-glead" style="left:{W["cx"] - 1}px;top:{W["cy"] + 34}px;height:{R}px"></i>')
    # B2 meter: the colours' boost vs the skin's quarter, capped at x1.2 (vertical bars); it sits high enough that
    # its labels stay clear of the frame's soft edge during the punch-in
    base_y, unit = 606, 118          # px per +1.0 of boost
    full = (MAIN_K - 1) * unit
    skin_q = min((MAIN_K - 1) / 4, SKIN_CAP - 1) * unit
    cap_y = base_y - (SKIN_CAP - 1) * unit
    xs, xc = 74, 322                 # skin bar, colours bar (left edges, bar width 50)
    meter = (f'<div class="s24-meter">'
             f'<i class="s24-mb s24-mb1" style="left:{xc}px;top:{base_y - full:.1f}px;height:{full:.1f}px"></i>'
             f'<i class="s24-mg" style="left:{xs}px;top:{base_y - full:.1f}px;height:{full:.1f}px"></i>'
             f'<i class="s24-mb s24-mb2" style="left:{xs}px;top:{base_y - skin_q:.1f}px;height:{skin_q:.1f}px"></i>'
             f'<i class="s24-mcap" style="left:{xs - 14}px;top:{cap_y - 2:.1f}px"></i>'
             f'<div class="s24-mct" style="left:{(xs + 64 + xc) / 2:.0f}px;top:{cap_y - 50:.1f}px"><span dir="rtl">{esc(c["capLabel"])}</span></div>'
             f'<i class="s24-mbase" style="left:{xs - 22}px;top:{base_y}px;width:{xc + 50 + 22 - xs + 22}px"></i>'
             f'<div class="s24-ml" style="left:{xc + 25}px;top:{base_y + 8}px"><span dir="rtl">{esc(c["colorsLabel"])}</span></div>'
             f'<div class="s24-ml" style="left:{xs + 25}px;top:{base_y + 8}px"><span dir="rtl">{esc(c["skinLabel"])}</span></div></div>')
    # the frame and its labels (frame px = viewBox px * fs). The wall label sits on the wall; the skin label on the
    # wall above the head with a short leader down to the face; the two shirt labels hang under the frame with a
    # thin leader up to the garment, so no label covers what it names
    fs = F["w"] / 400
    fb = F["y"] + F["h"]                       # the frame's bottom edge
    def flab(cls, x, y, txt, up=0, down=0):
        lead = ""
        if up:
            lead = f'<i class="s24-flu" style="height:{up:.0f}px;top:{-22 - up:.0f}px"></i>'
        if down:
            lead = f'<i class="s24-flu" style="height:{down:.0f}px;top:22px"></i>'
        return (f'<div class="s24-fl {cls}" style="left:{x:.0f}px;top:{y:.0f}px">{lead}'
                f'<span dir="rtl"><i class="s24-ld"></i>{esc(txt)}</span></div>')
    def vb(x, y):
        return F["x"] + x * fs, F["y"] + y * fs
    wx, wy = vb(312, 172)
    tx, ty = vb(200, 424)                      # the tee, low on the chest
    kx, ky = vb(200, 124)                      # the top of the face ring
    bx, by = vb(84, 430)                       # the black shirt's left side
    lab_y = fb + 44                            # shirt labels: centred 44 px under the frame
    flabels = (flab("s24-fl-wall", wx, wy, c["wallLabel"]) +
               flab("s24-fl-tee", tx, lab_y, c["teeLabel"], up=lab_y - 22 - ty) +
               flab("s24-fl-skin", kx, ky - 44, c["skinWord"], down=22 - 4) +
               flab("s24-fl-black", bx, lab_y, c["blackLabel"], up=lab_y - 22 - by))
    ring = (f'<svg class="s24-fring" style="left:{F["x"] + 132 * fs:.0f}px;top:{F["y"] + 124 * fs:.0f}px;width:{136 * fs:.0f}px;height:{164 * fs:.0f}px" '
            f'viewBox="0 0 136 164" aria-hidden="true"><ellipse cx="68" cy="82" rx="64" ry="78"/></svg>')
    frame = (f'<div class="s24-frame" style="left:{F["x"]}px;top:{F["y"]}px;width:{F["w"]}px;height:{F["h"]}px">'
             f'{scene(c0, "m", "s24-scene")}</div>{ring}{flabels}')
    focus = f'<i class="s24-focus" data-focus="2" style="left:{W["cx"] + 60}px;top:{F["y"] + 70}px;width:{F["x"] + 250 - W["cx"] - 60}px;height:260px"></i>'
    # payoff: three strengths (x 24..776)
    pw, ph, gap, mx = 224, 252, 40, 24
    minis, plabs, sw = "", "", ""
    for i, k in enumerate(STRENGTHS):
        x = 800 - mx - (i + 1) * pw - i * gap             # right to left: gentle first
        minis += (f'<div class="s24-mini" style="left:{x}px"><div class="s24-mframe">{scene(c0, f"k{i}", "s24-scene")}</div></div>')
        plabs += (f'<div class="s24-pl" style="left:{x}px;width:{pw}px"><span dir="rtl">{esc(c["strengths"][i])} '
                  f'<b dir="ltr">{k}</b></span></div>')
        sw += (f'<div class="s24-sw" style="left:{x + pw / 2 - 31:.0f}px"><i style="background:{c0["skin"]}"></i></div>')
    x_med = 800 - mx - 2 * pw - gap + pw / 2
    x_str = 800 - mx - 3 * pw - 2 * gap + pw / 2
    eq = (f'<svg class="s24-eq" viewBox="0 0 800 120" aria-hidden="true"><path d="M{x_str:.0f} 6 V22 H{x_med:.0f} V6"/></svg>'
          f'<span class="s24-eqs" style="left:{(x_med + x_str) / 2 - 20:.0f}px">=</span>')
    kin, _, _ = kinetic_html(c["payoffLabel"], t0=cfg["phrEnd"] + c["capT"], step=0.1, pause=0.15)
    cap_line = f'<p class="s24-pc kin" dir="rtl">{kin}</p>'
    pay = f'<div class="s24-pay">{minis}{plabs}{sw}{eq}{cap_line}</div>'
    data = json.dumps({n: {"c": v["c"], "a": v["a"], "r": v["r"], "k": v["k"]} for n, v in st.items()})
    return f"""<div class="simwrap sim24" data-st='{data}'>
<div class="s24-main">{wl}{wheel}{meter}{frame}{focus}</div>
{pay}
</div>"""


def cues(cfg):
    P, pe = cfg["phr"], cfg["phrEnd"]
    return [("shimmer", P[0] + 0.6), ("swipe", P[1] + 0.5), ("tick", P[2] + 1.2), ("tick", P[3] + 0.7),
            ("whoosh_soft", pe + 0.45)]
