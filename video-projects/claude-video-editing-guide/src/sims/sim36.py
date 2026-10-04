"""3.6 simulation: the most viewed videos orbit around you (CSS 3D), one visual beat per explanation phrase.
B0 eight vertical cards fly in from the screen's edges into a row; each shows an eye and a views bar (no
   numbers); they sort themselves by views, the most viewed on the right, and it gets a shine
B1 they become small cards that play (play glyph, a running progress bar, the picture slowly moves)
B2 they rise into an arc above the head and to the sides, all behind you
B3 the arc lies down into a tilted orbit around you; a faint light line draws it; the orbit speeds up and the
   near cards pass in front of you, the far ones behind (punch-in here)
payoff: the orbit keeps going; the three most viewed cards get an eye label (the real view count goes there,
   none is invented); then the cards fly out.
Each card is a chain arm(rotateY) > wrap(translateZ R) > billboard(the inverse rotations) > offset(x, y, z in
screen axes) > card, so the cards always face the camera; the person is a plane in the same 3D context, so the
browser puts every card in front of or behind them by its real depth."""
import math

from textlayout import esc
from art import person_svg

SX, SY, SW, SH = 20, 30, 760, 640      # the screen box in the canvas
RX, RY = 400, 430                      # the orbit's centre in the canvas (= perspective origin), at head height
R = 270                                # orbit radius (px)
ARC = (2, -120)                        # the arc pose: rig y and z (centred on the head, behind you)
ROW_Y, ROW_Z, ROW_DX, ROW_S = 588, 40, 92, 0.8      # the row: centre y, depth, spacing, card scale
SLOTS = [3, 6, 1, 8, 2, 5, 7, 4]       # the row before sorting: slot (from the right) -> rank
CW, CH = 96, 170                       # card size (9:16)


def arc_angle(i, n):
    """Arc pose: rank 1 at the right end, through the top, rank n at the left end (all behind you)."""
    return 80 + i * 200 / (n - 1)


def orbit_angle(i, n):
    return 22.5 + i * 360 / n


def _pos(alpha, tilt, ry, rz):
    """Card centre (canvas px, 3D) on the rig: rig + Rx(tilt) . (R sin a, 0, R cos a)."""
    a, t = math.radians(alpha), math.radians(tilt)
    x, z = R * math.sin(a), R * math.cos(a)
    return RX + x, RY + ry - z * math.sin(t), rz + z * math.cos(t)


def row_offset(rank_i, slot, n):
    """Offset (screen axes) from the card's arc position to a row slot."""
    px, py, pz = _pos(arc_angle(rank_i, n), -90, *ARC)
    sx = RX + (n / 2 - 0.5 - slot) * ROW_DX
    return sx - px, ROW_Y - py, ROW_Z - pz


EYE = ('<svg class="s36-eye" viewBox="0 0 28 18" aria-hidden="true"><path d="M2 9C6 3 10 1.5 14 1.5S22 3 26 9C22 15 18 16.5 14 16.5S6 15 2 9Z"/>'
       '<circle cx="14" cy="9" r="4"/></svg>')
PLAY = '<svg class="s36-play" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18"/><path d="M16 12.5v15L28 20z"/></svg>'
# generic thumbnails (no real content): a talking head, a phone, mountains, a laptop, a cup, text blocks, a chart, a ring light
THUMBS = [
    '<ellipse cx="48" cy="70" rx="17" ry="20"/><path d="M14 170C16 128 32 108 48 106 64 108 80 128 82 170Z"/>',
    '<rect x="30" y="40" width="36" height="74" rx="8"/><circle cx="48" cy="50" r="2.5" class="f"/>',
    '<circle cx="66" cy="46" r="11" class="f"/><path d="M0 130 30 86 50 110 66 92 96 130V170H0Z"/>',
    '<rect x="20" y="62" width="56" height="38" rx="4"/><path d="M12 108h72l-6 8H18z"/>',
    '<path d="M28 76h36v34a14 14 0 0 1 -14 14H42a14 14 0 0 1 -14 -14Z"/><path d="M64 84a9 9 0 0 1 0 18" class="o"/>',
    '<rect x="16" y="52" width="64" height="9" rx="4.5" class="f"/><rect x="16" y="70" width="48" height="9" rx="4.5"/><rect x="16" y="88" width="56" height="9" rx="4.5"/>',
    '<path d="M18 120V100M36 120V84M54 120V70M72 120V56" class="o"/>',
    '<circle cx="48" cy="72" r="24" class="o"/><ellipse cx="48" cy="72" rx="9" ry="11"/><path d="M28 130C30 112 38 104 48 103 58 104 66 112 68 130Z"/>',
]
GRADS = [("#4a3a96", "#1d1842"), ("#2f4a8f", "#141d40"), ("#5b3478", "#23143a"), ("#344f86", "#14213c"),
         ("#4f3f8e", "#1f1a46"), ("#3e2d6a", "#17112c"), ("#30449a", "#151d48"), ("#5a3572", "#22143a")]


def html(cfg):
    c = cfg["sim36"]
    n = c["cards"]
    cards = []
    for i in range(n):                       # i = rank - 1
        slot = SLOTS.index(i + 1)
        a = arc_angle(i, n)
        ox, oy, oz = row_offset(i, slot, n)
        side = 1 if slot < n // 2 else -1     # right half flies in from the right edge
        fx = ox + side * 430
        g0, g1 = GRADS[i % len(GRADS)]
        bh = 220 - i * 22                     # views bar above the card: rank order only, no numbers
        # the eye tag of the three most viewed: just the eye (the real view count belongs there; none is invented)
        badge = (f'<span class="s36-badge">{EYE}</span>' if i < c["top"] else "")
        cards.append(
            f'<div class="s36-arm" style="transform:rotateY({a:.2f}deg)"><div class="s36-wrap">'
            f'<div class="s36-bb" style="transform:rotateY({-a:.2f}deg) rotateX(90deg)">'
            f'<div class="s36-off" data-ox="{ox:.1f}" data-oy="{oy:.1f}" data-oz="{oz:.1f}" data-slot="{slot}" '
            f'style="transform:translate3d({fx:.1f}px,{oy:.1f}px,{oz:.1f}px)">'
            f'<div class="s36-card" style="background:linear-gradient(165deg,{g0},{g1})">'
            f'<div class="s36-pic"><svg viewBox="0 0 96 170" aria-hidden="true">{THUMBS[i % len(THUMBS)]}</svg></div>'
            f'<i class="s36-prog"><b></b></i>{PLAY}'
            f'{badge}<i class="s36-sw"><b></b></i></div>'
            f'<div class="s36-vb" style="top:{-76 - bh}px;height:{bh}px"><i class="s36-vfill"></i><span class="s36-veye">{EYE}</span></div>'
            f'</div></div></div></div>')
    ring = f'<div class="s36-orbit" style="left:{-R}px;top:{-R}px;width:{2 * R}px;height:{2 * R}px"><svg viewBox="0 0 {2 * R + 8} {2 * R + 8}" aria-hidden="true"><circle cx="{R + 4}" cy="{R + 4}" r="{R}"/></svg></div>'
    return f"""<div class="simwrap sim36" data-r="{R}" data-arcy="{ARC[0]}" data-arcz="{ARC[1]}" data-ry="{RY}">
<div class="s36-screen" style="left:{SX}px;top:{SY}px;width:{SW}px;height:{SH}px">
<div class="s36-room"><i class="s36-lamp"></i><i class="s36-win"><u></u><s></s></i><i class="s36-floor"></i><i class="s36-spot"></i></div>
<div class="s36-view"><div class="s36-scene">
<div class="s36-person" data-focus="3">{person_svg("s36-psvg", "36")}</div>
<div class="s36-tilt">{ring}<div class="s36-spin">
{"".join(cards)}
</div></div>
</div></div>
</div>
<div class="s36-legend" dir="rtl">{EYE}<span>{esc(c["viewsLabel"])}</span></div>
</div>"""


def cues(cfg):
    P = cfg["phr"]
    pe = cfg["phrEnd"]
    return [("whoosh_soft", P[0] + 0.1), ("shimmer", P[0] + 2.6), ("pop", P[1] + 0.15),
            ("swipe", P[2] + 0.05), ("whoosh_soft", P[3] + 0.05), ("shimmer", pe + 0.3), ("whoosh_soft", pe + 2.85)]
