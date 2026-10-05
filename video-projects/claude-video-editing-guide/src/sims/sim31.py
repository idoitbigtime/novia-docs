"""3.1 simulation: saying out loud what to edit, while filming. One visual beat per explanation phrase.
Canvas 800 x 700. Time runs right to left on the transcript (reading direction).
B0 the presenter in the camera frame wants effects (a thought bubble: a 3D logo, text on the wall, layers)
B1 says it while filming: REC, the instruction in a speech bubble word by word, the recording's waveform grows
B2 Claude transcribes: a scanner passes, every word drops under the waveform with a tick on the time ruler
B3 the instruction lights up; its words get a bracket on the ruler; when the playhead reaches them the effect
   (a generic 3D logo over the hand) enters, and it leaves when they end (punch-in on the instruction)
B4 the words fly into a table row: the instruction · time · what happens on screen · how it ends; waiting for approval
payoff: approved -> BRIEF.md -> a scene file and an agent for every instruction -> the independent critic tag.
Times come from cfg["phr"] / cfg["phrEnd"] (scene-local)."""
import math
import random

from textlayout import esc, kinetic_html

FX, FY = 80, 0            # camera frame position on the canvas (640 x 360)


def _hexpath(cx, cy, r, k=0.24):
    """Rounded hexagon (pointy top): corners rounded with quadratic curves."""
    pts = [(cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a))) for a in range(-90, 270, 60)]
    d, n = [], len(pts)
    for i in range(n):
        p0, p1, p2 = pts[i - 1], pts[i], pts[(i + 1) % n]
        a = (p1[0] + (p0[0] - p1[0]) * k, p1[1] + (p0[1] - p1[1]) * k)
        b = (p1[0] + (p2[0] - p1[0]) * k, p1[1] + (p2[1] - p1[1]) * k)
        d.append(("M" if i == 0 else "L") + f"{a[0]:.1f} {a[1]:.1f}Q{p1[0]:.1f} {p1[1]:.1f} {b[0]:.1f} {b[1]:.1f}")
    return " ".join(d) + "Z"


STAR = "M50 30 C 52 44, 56 48, 70 50 C 56 52, 52 56, 50 70 C 48 56, 44 52, 30 50 C 44 48, 48 44, 50 30Z"
# the agent badge: the same 4-point spark inside a 48 px circle
AGENT = "M24 12 C 25 20, 28 23, 36 24 C 28 25, 25 28, 24 36 C 23 28, 20 25, 12 24 C 20 23, 23 20, 24 12Z"


def logo3d(prefix, n=9, depth=20):
    """Generic extruded badge: n stacked layers at different depths (CSS 3D), front face with a spark."""
    hexd = _hexpath(50, 50, 44)
    layers = []
    for i in range(n):
        z = -depth / 2 + depth * i / (n - 1)
        if i == n - 1:
            # the guide describes Claude's logo as orange ("לוגו כתום של קלוד"); orange also keeps red for the accent
            inner = (f'<defs><linearGradient id="{prefix}g" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#ffc27a"/>'
                     f'<stop offset="0.5" stop-color="#ff9f43"/><stop offset="1" stop-color="#f08a24"/></linearGradient></defs>'
                     f'<path d="{hexd}" fill="url(#{prefix}g)"/><path d="{_hexpath(50, 50, 33)}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>'
                     f'<path d="{STAR}" fill="#ffffff"/>')
        elif i == 0:
            inner = f'<path d="{hexd}" fill="#a95416"/>'
        else:
            # the extruded side: darker orange at the back, lighter toward the front face
            inner = f'<path d="{hexd}" fill="#{0xb0 + i * 4:02x}{0x5a + i * 3:02x}{0x16 + i:02x}"/>'
        layers.append(f'<svg class="{prefix}-ly" viewBox="0 0 100 100" style="transform:translateZ({z:.2f}px)" aria-hidden="true">{inner}</svg>')
    return "".join(layers)


def _presenter():
    """Presenter silhouette in the 640 x 360 frame, with an open palm raised on the viewer's right."""
    return """<svg class="s31-pres" viewBox="0 0 640 360" aria-hidden="true">
<defs>
<linearGradient id="pf31" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3274"/><stop offset="1" stop-color="#1a1636"/></linearGradient>
<linearGradient id="pr31" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c9c2ff" stop-opacity="0"/><stop offset="0.65" stop-color="#c9c2ff" stop-opacity="0.15"/><stop offset="1" stop-color="#c9c2ff" stop-opacity="0.85"/></linearGradient>
</defs>
<path d="M180 360 C 188 300, 240 262, 306 256 L 394 256 C 460 262, 512 300, 520 360 Z" fill="url(#pf31)"/>
<rect x="322" y="200" width="56" height="66" rx="22" fill="url(#pf31)"/>
<ellipse cx="350" cy="142" rx="54" ry="64" fill="url(#pf31)"/>
<path d="M180 360 C 188 300, 240 262, 306 256 L 394 256 C 460 262, 512 300, 520 360" fill="none" stroke="url(#pr31)" stroke-width="3"/>
<ellipse cx="350" cy="142" rx="54" ry="64" fill="none" stroke="url(#pr31)" stroke-width="3"/>
<g transform="translate(560 262)">
<path d="M-24 0 L-31 110 L35 110 L26 0 Z" fill="url(#pf31)"/>
<path d="M-27 4 C-29 -14 -31 -26 -32 -36 C-40 -44 -50 -56 -58 -70 C-61 -77 -53 -83 -47 -77 C-42 -69 -36 -61 -31 -57 L-31 -104 C-31 -114 -18 -114 -18 -104 L-18 -86 L-16 -86 L-16 -112 C-16 -122 -2 -122 -2 -112 L-2 -86 L0 -86 L0 -106 C0 -116 13 -116 13 -106 L13 -84 L15 -82 L16 -94 C16 -103 28 -103 28 -94 L27 -66 C30 -44 30 -20 26 4 Z" fill="url(#pf31)"/>
<path d="M-27 4 C-29 -14 -31 -26 -32 -36 C-40 -44 -50 -56 -58 -70 C-61 -77 -53 -83 -47 -77 C-42 -69 -36 -61 -31 -57 L-31 -104 C-31 -114 -18 -114 -18 -104 L-18 -86 L-16 -86 L-16 -112 C-16 -122 -2 -122 -2 -112 L-2 -86 L0 -86 L0 -106 C0 -116 13 -116 13 -106 L13 -84 L15 -82 L16 -94 C16 -103 28 -103 28 -94 L27 -66 C30 -44 30 -20 26 4" fill="none" stroke="url(#pr31)" stroke-width="2.6" stroke-linejoin="round"/>
</g>
</svg>"""


def _icons():
    cube = ('<svg class="s31-ic" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8 L54 20 L54 44 L32 56 L10 44 L10 20 Z"/>'
            '<path d="M10 20 L32 32 L54 20 M32 32 V56"/></svg>')
    wall = ('<svg class="s31-ic" viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="12" width="48" height="40" rx="5"/>'
            '<path d="M16 26 H48 M16 36 H40"/><circle cx="44" cy="46" r="8" class="f"/></svg>')
    lays = ('<svg class="s31-ic" viewBox="0 0 64 64" aria-hidden="true"><path d="M8 40 L32 50 L56 40 L32 30 Z"/>'
            '<path d="M8 30 L32 40 L56 30 L32 20 Z"/><path d="M8 20 L32 30 L56 20 L32 10 Z"/></svg>')
    return cube, wall, lays


def _wave():
    """The recording's waveform across the strip (bars every 8 px, x 790 -> 10)."""
    rnd = random.Random(31)
    bars, x = [], 790
    while x >= 10:
        n = rnd.choice([4, 5, 6, 7])
        amp = 18 + 10 * rnd.random()
        for i in range(n):
            if x < 10:
                break
            h = amp * (0.35 + 0.65 * math.sin(math.pi * (i + 0.5) / n)) * (0.75 + 0.45 * rnd.random())
            bars.append(f"M{x} {30 - h:.1f}V{30 + h:.1f}")
            x -= 8
        if x >= 10:
            bars.append(f"M{x} 28.5V31.5")
            x -= 8
    return " ".join(bars)


def _ruler():
    ticks = " ".join(f"M{x} 0V{8 if (790 - x) % 104 else 14}" for x in range(790, 9, -26))
    return f'<svg class="s31-rul" viewBox="0 0 800 16" aria-hidden="true"><path class="s31-rl" d="M790 0H10"/><path class="s31-rt" d="{ticks}"/></svg>'


def _picto(kind):
    """Small pictograms for the table cells and the scene files."""
    hexs = _hexpath(0, 0, 13)
    if kind == "time":
        return ('<svg class="s31-pic" viewBox="0 0 96 56" aria-hidden="true"><path class="pl" d="M90 34H6"/>'
                '<path class="pt" d="M90 30V38 M70 31V37 M50 31V37 M30 31V37 M10 30V38"/>'
                '<rect class="ph" x="30" y="22" width="40" height="24" rx="6"/></svg>')
    if kind == "logo":
        return (f'<svg class="s31-pic" viewBox="0 0 96 56" aria-hidden="true"><path class="hand" d="M24 46 C 26 38, 70 38, 72 46 C 70 52, 26 54, 24 46 Z"/>'
                f'<g transform="translate(48 20)"><path class="lg" d="{hexs}"/></g><path class="gl" d="M36 44 Q48 36 60 44"/></svg>')
    if kind == "end":
        return (f'<svg class="s31-pic" viewBox="0 0 96 56" aria-hidden="true"><g transform="translate(24 28)"><path class="lg" d="{hexs}"/></g>'
                '<path class="ar" d="M44 28 H60 M55 23 L60 28 L55 33"/><circle class="dot" cx="74" cy="28" r="5"/></svg>')
    if kind == "wall":
        return ('<svg class="s31-pic" viewBox="0 0 96 56" aria-hidden="true"><rect class="wl" x="14" y="8" width="68" height="42" rx="5"/>'
                '<path class="tx" d="M24 22 H64 M24 32 H54"/><circle class="hd" cx="60" cy="44" r="9"/></svg>')
    if kind == "layers":
        return ('<svg class="s31-pic" viewBox="0 0 96 56" aria-hidden="true"><path class="ly" d="M18 38 L48 50 L78 38 L48 26 Z"/>'
                '<path class="ly" d="M18 28 L48 40 L78 28 L48 16 Z"/><path class="ly" d="M18 18 L48 30 L78 18 L48 6 Z"/></svg>')
    if kind == "fade":
        return ('<svg class="s31-pic" viewBox="0 0 96 56" aria-hidden="true"><rect class="fa" x="14" y="14" width="30" height="28" rx="5"/>'
                '<path class="ar" d="M50 28 H64 M59 23 L64 28 L59 33"/><rect class="fb" x="70" y="18" width="16" height="20" rx="4"/></svg>')
    return ""


def html(cfg):
    c = cfg["sim31"]
    P = cfg["phr"]
    words = c["instruction"].split()
    lines, t = [], P[1] + 0.2
    for ws in (words[:3], words[3:6], words[6:]):
        h, _, _ = kinetic_html(" ".join(ws), t0=t, step=0.11, pause=0.0)
        lines.append(f'<span class="ln">{h}</span>')
        t += 0.11 * len(ws)
    say = "".join(lines)
    cube, wall, lays = _icons()
    chips_ins = "".join(f'<span class="s31-iw" dir="rtl"><i class="hl"></i><b>{esc(w)}</b><i class="tk"></i></span>' for w in words)
    chip = lambda w: f'<span class="s31-aw" style="width:{w}px"><i class="tk"></i></span>'
    crow = chip(34) + f'<span class="s31-ins" data-focus="3">{chips_ins}</span>' + chip(30)
    tw = "<br>".join(" ".join(f'<span class="tw">{esc(w)}</span>' for w in ws) for ws in (words[:3], words[3:6], words[6:]))
    cols = c["cols"]
    head = "".join(f'<div class="s31-th" dir="rtl">{esc(t)}</div>' for t in cols)
    bars = lambda a, b: f'<div class="s31-tb"><i style="width:{a}px"></i><i style="width:{b}px"></i></div>'
    rows = (f'<div class="s31-td s31-c1 s31-r1"><div class="s31-tins" dir="rtl">{tw}</div></div>'
            f'<div class="s31-td s31-c2 s31-r1">{_picto("time")}</div><div class="s31-td s31-r1">{_picto("logo")}</div><div class="s31-td s31-r1">{_picto("end")}</div>'
            f'<div class="s31-td s31-c1 s31-r2">{bars(200, 140)}</div><div class="s31-td s31-c2 s31-r2">{_picto("time")}</div>'
            f'<div class="s31-td s31-r2">{_picto("wall")}</div><div class="s31-td s31-r2">{_picto("fade")}</div>'
            f'<div class="s31-td s31-c1 s31-r3">{bars(176, 196)}</div><div class="s31-td s31-c2 s31-r3">{_picto("time")}</div>'
            f'<div class="s31-td s31-r3">{_picto("layers")}</div><div class="s31-td s31-r3">{_picto("fade")}</div>')
    scenes = "".join(
        f'<div class="s31-scn s31-s{i + 1}"><svg class="s31-file" viewBox="0 0 180 170" preserveAspectRatio="none" aria-hidden="true">'
        f'<path d="M14 4 H140 L176 40 V158 a8 8 0 0 1 -8 8 H14 a8 8 0 0 1 -8 -8 V12 a8 8 0 0 1 8 -8 Z"/><path class="fold" d="M140 4 V40 H176"/></svg>'
        f'<div class="s31-sp">{_picto(k)}</div><i class="s31-sl"></i><i class="s31-sl s31-sl2"></i>'
        f'<div class="s31-ag"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/><path d="{AGENT}"/></svg></div>'
        f'<svg class="s31-sr" viewBox="0 0 48 48" aria-hidden="true"><circle class="bg" cx="24" cy="24" r="18"/><circle class="fg" cx="24" cy="24" r="18"/></svg></div>'
        for i, k in enumerate(("logo", "wall", "layers")))
    return f"""<div class="simwrap sim31">
<div class="s31-cam"><div class="s31-fin"><div class="s31-room"><i class="s31-lamp"></i></div>
{_presenter()}
<i class="s31-pg"></i>
<div class="s31-lgw"><i class="s31-lp"></i><div class="s31-lg3">{logo3d("s31l")}</div></div>
<svg class="s31-vf" viewBox="0 0 640 360" aria-hidden="true"><path d="M14 46 V14 H46"/><path d="M594 14 H626 V46"/><path d="M626 314 V346 H594"/><path d="M46 346 H14 V314"/></svg>
<div class="s31-rec"><i></i></div>
<div class="s31-tdots"><i></i><i></i><i></i></div>
<div class="s31-think"><span class="s31-ib">{cube}</span><span class="s31-ib">{wall}</span><span class="s31-ib">{lays}</span></div>
<div class="s31-say"><p class="kin" dir="rtl">{say}</p></div>
<svg class="s31-arcs" viewBox="0 0 60 80" aria-hidden="true"><path d="M44 24 Q36 40 44 56"/><path d="M32 14 Q20 40 32 66"/><path d="M20 4 Q4 40 20 76"/></svg>
</div></div>
<div class="s31-term"><div class="s31-tbar"><i></i><i></i><i></i></div><b class="s31-pr" dir="ltr">&gt;</b>
<i class="s31-tl s31-tl1"></i><i class="s31-tl s31-tl2"></i><i class="s31-cur"></i></div>
<svg class="s31-link" viewBox="0 0 800 700" aria-hidden="true"><path d="M400 494 C 400 380, 670 370, 670 160"/></svg>
<div class="s31-tbl"><div class="s31-grid">{head}{rows}</div></div>
<div class="s31-strip">
<div class="s31-wvc"><svg class="s31-wv" viewBox="0 0 800 60" aria-hidden="true"><path d="{_wave()}"/></svg></div>
<i class="s31-rhead"></i>
<div class="s31-crow" dir="rtl">{crow}</div>
{_ruler()}
<svg class="s31-brk" viewBox="0 0 100 16" preserveAspectRatio="none" aria-hidden="true"><path d="M99 0 V10 H1 V0"/></svg>
<i class="s31-ph"></i><div class="s31-scanbox"><i class="s31-scan"></i></div>
</div>
<div class="s31-ok" dir="rtl"><span class="s31-okr"><i class="okf"></i><svg viewBox="0 0 30 30" aria-hidden="true"><path d="M7 15.5l5.5 5.5L23.5 9"/></svg></span><b>{esc(c["approve"])}</b></div>
<div class="s31-brief"><svg class="s31-bf" viewBox="0 0 64 76" aria-hidden="true"><path d="M8 4 H42 L58 20 V68 a4 4 0 0 1 -4 4 H8 a4 4 0 0 1 -4 -4 V8 a4 4 0 0 1 4 -4 Z"/><path class="fold" d="M42 4 V20 H58"/>
<path class="ln" d="M14 34 H46 M14 44 H40 M14 54 H44"/></svg><b dir="ltr">{esc(c["brief"])}</b></div>
<svg class="s31-links" viewBox="0 0 800 700" aria-hidden="true"><path d="M400 152 C 400 196, 160 196, 160 238"/><path d="M400 152 V238"/><path d="M400 152 C 400 196, 640 196, 640 238"/></svg>
<div class="s31-scns">{scenes}</div>
<div class="s31-cscanbox"><i class="s31-cscan"></i></div>
<div class="s31-aglab" dir="rtl"><i></i><span>{esc(c["agents"])}</span></div>
<div class="s31-crit" dir="rtl"><span class="s31-eye"><svg viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="25"/><path d="M12 28 C 18 18, 38 18, 44 28 C 38 38, 18 38, 12 28 Z"/><circle class="pu" cx="28" cy="28" r="6"/></svg></span>
<b>{esc(c["critic"])}</b></div>
</div>"""


def cues(cfg):
    P, pe = cfg["phr"], cfg["phrEnd"]
    return [("pop", P[0] + 0.45), ("tick", P[1] + 0.05), ("swipe", P[2] + 0.1), ("shimmer", P[3] + 1.12),
            ("whoosh_soft", P[4] + 0.25), ("tick", pe + 0.15), ("pop", pe + 3.0)]
