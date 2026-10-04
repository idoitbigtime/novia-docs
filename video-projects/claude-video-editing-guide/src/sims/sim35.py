"""3.5 simulation: a round frame, and a product that comes apart into its parts (CSS 3D), one beat per phrase.
B0 the full video's edges pull in, it becomes a circle (light line + glow, soft shadow) and moves to one side
B1 on the other side a generic line-art phone rises from below and hovers, turning up to 25 deg each way
B2 the chosen word (a voice ripple from the circle): the phone swings to a back/side view and its parts come
   apart along the depth axis, each on its own spring (punch-in here)
B3 each main part gets a Hebrew name: dot on the part, a thin line (alternating lengths, alternating sides)
B4 the names gather, the parts return in reverse order with a small click, the phone turns back whole; then the
   product leaves and the circle glides back and opens through a rounded rectangle to the full frame (as it is read)
payoff: the full picture is back: a line of light runs around it, a sweep crosses it, and it holds.
Beat times come from cfg["phr"] (scene-local). The names sit in a flat layer over the 3D, at each part's point
as projected by the same perspective math the CSS uses (the guide's method, prompt 11 step 5)."""
import math

from textlayout import esc
from art import person_svg

# the screen (the full video frame) and the round frame
SX, SY, SW, SH = 20, 30, 760, 640          # screen box in the 800 x 700 canvas
CIRC = (380, 395, 140)                     # circle centre (screen-local) and radius when it forms (head + shoulders)
CIRC_TO = (630, 196, 0.9)                  # where the circle settles (canvas centre) and its scale there
# the product (CSS 3D)
PX, PY, PERSP = 300, 390, 1400             # rig centre in the canvas (= perspective origin)
PW, PH = 176, 360                          # phone size
Z_SHUT = [-7, -3, 1, 7]                    # back, coil, inside, display: assembled depth (px)
Z_OPEN = [-150, -50, 50, 150]              # apart, along the phone's depth axis
POSE = dict(pitch=60, yaw=208)             # the back/side view while apart
# names: (name index, plate, anchor on the plate (phone-local), side, line length)
LABELS = [(0, 0, (48, -138), "L", 82), (1, 1, (-56, 8), "R", 70), (2, 2, (-58, 104), "R", 116), (3, 2, (36, -110), "L", 112)]


def project(pt):
    """Canvas position of a phone-local point (x, y, z) in the apart pose: yaw, then pitch; perspective
    around the rig centre. Same order as the CSS transforms (.s35-pr rotateX > .s35-py rotateY > part z)."""
    x, y, z = pt
    th, ph = math.radians(POSE["yaw"]), math.radians(POSE["pitch"])
    x1, z1 = x * math.cos(th) + z * math.sin(th), -x * math.sin(th) + z * math.cos(th)
    y2, z2 = y * math.cos(ph) - z1 * math.sin(ph), y * math.sin(ph) + z1 * math.cos(ph)
    s = PERSP / (PERSP - z2)
    return PX + x1 * s, PY + y2 * s


def _box(x, y, w, h):
    return f"left:{x}px;top:{y}px;width:{w}px;height:{h}px"


# --- the four parts, thin bright lines (viewBox = the phone, 176 x 360) ---
PART_BACK = ('<svg viewBox="0 0 176 360" aria-hidden="true"><rect class="pb" x="1.5" y="1.5" width="173" height="357" rx="30"/>'
             '<rect class="pm" x="104" y="12" width="62" height="68" rx="17"/><circle class="pl" cx="123" cy="31" r="10.5"/>'
             '<circle class="pl" cx="147" cy="58" r="10.5"/><circle class="pl" cx="123" cy="59" r="5"/><circle class="pd" cx="149" cy="29" r="3.5"/></svg>')
PART_COIL = ('<svg viewBox="0 0 176 360" aria-hidden="true"><rect class="ps" x="10" y="96" width="156" height="210" rx="22"/>'
             + "".join(f'<circle class="pc" cx="88" cy="188" r="{r}"/>' for r in (56, 46, 36, 26))
             + '<path class="pc" d="M88 132V108H120"/></svg>')
CHIP_PINS = "".join(f'<path class="pp" d="M{x} 54v-6M{x} 90v6"/>' for x in (112, 120, 128, 136)) + \
    "".join(f'<path class="pp" d="M106 {y}h-6M142 {y}h6"/>' for y in (60, 68, 76, 84))
PART_IN = ('<svg viewBox="0 0 176 360" aria-hidden="true"><rect class="pg" x="14" y="16" width="148" height="112" rx="14"/>'
           '<path class="pt" d="M28 40h40v22h-26M28 96h30l12 -14h18M150 104h-24l-8 10H96"/>'
           f'{CHIP_PINS}<rect class="pk" x="106" y="54" width="36" height="36" rx="5"/><rect class="pk2" x="115" y="63" width="18" height="18" rx="3"/>'
           '<rect class="pbt" x="22" y="146" width="132" height="196" rx="18"/><path class="pbt2" d="M74 146v-7h28v7"/>'
           '<path class="pt" d="M44 200h88M44 220h88"/></svg>')
PART_DISP = ('<svg viewBox="0 0 176 360" aria-hidden="true"><rect class="pb" x="1.5" y="1.5" width="173" height="357" rx="30"/>'
             '<rect class="pscr" x="9" y="9" width="158" height="342" rx="23"/><circle class="pd" cx="88" cy="26" r="5"/>'
             '<path class="prf" d="M24 300 L132 22 L160 22 L52 300Z"/></svg>')
PARTS = [("s35-back", PART_BACK), ("s35-coil", PART_COIL), ("s35-in", PART_IN), ("s35-disp", PART_DISP)]

RING = '<svg class="s35-ring" viewBox="0 0 288 288" style="{box}" aria-hidden="true"><circle cx="144" cy="144" r="141"/></svg>'
FRAME_LINE = (f'<svg class="s35-fl" viewBox="0 0 {SW + 8} {SH + 8}" style="{_box(SX - 4, SY - 4, SW + 8, SH + 8)}" aria-hidden="true">'
              f'<path d="M{SW / 2 + 4} 4H{SW - 20}a24 24 0 0 1 24 24V{SH - 20}a24 24 0 0 1 -24 24H28a24 24 0 0 1 -24 -24V28a24 24 0 0 1 24 -24Z"/></svg>')
WAVES = ('<svg class="s35-waves" viewBox="0 0 1520 640" aria-hidden="true" preserveAspectRatio="none">'
         + "".join(f'<path class="w{i}" d="M0 {y} C 190 {y - a} 380 {y + a} 570 {y} S 950 {y - a} 1140 {y} S 1520 {y + a} 1520 {y}"/>'
                   for i, (y, a) in enumerate(((150, 60), (330, 80), (470, 56), (560, 70))))
         + '</svg>')


def html(cfg):
    c = cfg["sim35"]
    cx, cy, r = CIRC
    # --- the screen backdrop (brand colours, slow purple waves) and the video that turns into the circle ---
    room = (f'<div class="s35-vid"><i class="s35-lamp"></i><i class="s35-win"><u></u><s></s></i><i class="s35-floor"></i>'
            f'{person_svg("s35-person", "35")}<i class="s35-sw"><b></b></i></div>')
    circ = (f'<div class="s35-circ" style="{_box(SX, SY, SW, SH)}"><i class="s35-shadow" style="{_box(cx - 130, cy + r - 14, 260, 46)}"></i>'
            f'{room}{RING.format(box=_box(cx - 144, cy - 144, 288, 288))}'
            f'<i class="s35-rip" style="{_box(cx - r, cy - r, 2 * r, 2 * r)}"></i><i class="s35-rip" style="{_box(cx - r, cy - r, 2 * r, 2 * r)}"></i></div>')
    # --- the product (3D) ---
    focus = ' data-focus="2"'
    sheen = '<i class="s35-sheen"><b></b></i>'     # a moving reflection on the display while it hovers
    parts = "".join(f'<div class="s35-part {cls}"{focus if cls == "s35-in" else ""}>{svg}{sheen if cls == "s35-disp" else ""}'
                    f'<i class="s35-pf"></i></div>' for cls, svg in PARTS)
    axis = f'<i class="s35-axis" style="width:{Z_OPEN[3] - Z_OPEN[0] + 80}px"></i>'
    # the product lives inside the screen box (it rises into it from below and leaves through it)
    prod = f"""<div class="s35-prod" style="{_box(SX, SY, SW, SH)}"><i class="s35-glow"></i><div class="s35-pv"><div class="s35-pr"><div class="s35-py">
{parts}{axis}
</div></div></div></div>"""
    # --- names: flat layer, at each part's projected point (apart pose) ---
    lab = []
    for k, (ni, plate, (lx, ly), side, L) in enumerate(LABELS):
        ax, ay = project((lx, ly, Z_OPEN[plate]))
        if side == "L":
            line = f"left:{ax - L:.1f}px;top:{ay - 1.25:.1f}px;width:{L}px;transform-origin:100% 50%"
            name = f"right:{800 - (ax - L - 12):.1f}px;top:{ay - 23:.1f}px"
        else:
            line = f"left:{ax:.1f}px;top:{ay - 1.25:.1f}px;width:{L}px;transform-origin:0% 50%"
            name = f"left:{ax + L + 12:.1f}px;top:{ay - 23:.1f}px"
        lab.append(f'<div class="s35-lab"><i class="s35-ln" style="{line}"></i><i class="s35-dot" style="left:{ax - 7:.1f}px;top:{ay - 7:.1f}px"></i>'
                   f'<span class="s35-name" dir="rtl" style="{name}">{esc(c["parts"][ni])}</span></div>')
    return f"""<div class="simwrap sim35">
<div class="s35-bg" style="{_box(SX, SY, SW, SH)}">{WAVES}</div>
{circ}
{prod}
{"".join(lab)}
{FRAME_LINE}
</div>"""


def cues(cfg):
    P = cfg["phr"]
    # the last part clicks in at P[4] + 1.23; the circle opens at P[4] + 2.77 (sims/sim35.js)
    return [("whoosh_soft", P[0] + 0.1), ("swipe", P[1] + 0.1), ("whoosh_soft", P[2] + 0.25),
            ("tick", P[3] + 0.1), ("snap", P[4] + 1.23), ("whoosh_soft", P[4] + 2.77)]
