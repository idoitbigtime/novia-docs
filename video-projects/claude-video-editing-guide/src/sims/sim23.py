"""2.3 simulation: one visual beat per explanation phrase, then the payoff.
B0 (phr0) a fixed crop in the middle (grey dashed); the presenter moves and the 9:16 output loses half the head (X)
B1 (phr1) Claude finds the face in every frame: a scanner, a face box, a filmstrip where every frame gets one
B2 (phr2) the crop turns into the red frame and follows the face with a soft spring; the dead-zone strip
   ("אזור מת: כ-8 אחוז מהרוחב") holds it still for small moves (punch-in here)
B3 (phr3) the output gets the phone's cut edges, the safe lines 140 and 940, and the text settles between them
payoff: the eye line runs through both frames at the upper third; the presenter moves again and the frame
follows softly, so the output stays composed.
The output is a true crop: the same room is drawn twice and the output copy moves with the crop window.
Geometry is static (computed here); scene-local times live in sim23.js."""
from textlayout import esc
from art import person_svg, ARROW_LEFT

OUT = (6, 94, 248, 441)            # 9:16 output (x, y, w, h); both frames sit a few px inside the canvas
SRC = (288, 148, 508, 286)         # 16:9 source (x 288..796)
TAG_SRC_R = 752                    # the 16:9 tag's right edge: >= 30 px inside the frame even under the punch-in
SCALE = OUT[3] / SRC[3]            # output px per source px
CROP_W = SRC[3] * 9 / 16           # the crop uses the full source height
CROP0 = (SRC[2] - CROP_W) / 2      # fixed crop, centred
ZONE_W = 0.08 * SRC[2]             # dead zone: about 8% of the source width (guide, prompt 3)
# presenter: eyes on the upper third, shoulders on the bottom edge (person_svg: eyes ~y125, bottom y380)
PK = (SRC[3] - SRC[3] / 3) / (380 - 125)
PW, PH = 312 * PK, 380 * PK
PTOP = SRC[3] - PH
FACE0 = SRC[2] / 2                 # face centre x (source px) at rest
PLEFT = FACE0 - PW / 2
HEAD_Y = PTOP + 132 * PK
EYE_Y = SRC[1] + SRC[3] / 3        # canvas y of the upper third (same in both frames)
SAFE = (140, 940)                  # safe text area, x of 1080 (guide, prompt 3 and the tip)
EDGE = 100                         # tall phones cut about 100 px from each side (guide)
FILM = 6                           # filmstrip frames


def crop_for(face_x, side):
    """Crop left edge that puts the face on the given edge of the dead zone (side = +1 right, -1 left)."""
    return face_x - side * ZONE_W / 2 - CROP_W / 2


def moves():
    """Person offsets (dx) and crop lefts for every state; read by the JS."""
    return dict(
        dx1=80.0,                                   # B0: the presenter moves; the fixed crop cuts the head
        crop1=round(crop_for(FACE0 + 80, +1), 2),   # B2: the crop follows until the face sits on the zone edge
        sway1=62.0,                                 # B2: a small move inside the zone (the crop holds)
        dx2=150.0,                                  # payoff: a bigger move
        crop2=round(crop_for(FACE0 + 150, +1), 2),
        sway2=132.0,
    )


def room(uid):
    """Illustrated room (source px, 508 x 286): wall light, window, shelf with a plant, a frame, the desk."""
    return f"""<div class="s23-room">
<i class="s23-lamp"></i>
<div class="s23-win"><i></i><b></b></div>
<i class="s23-pic"></i>
<svg class="s23-shelf" viewBox="0 0 130 120" aria-hidden="true">
<path class="s23-leaf" d="M58 62 C40 40 42 18 60 8 C66 30 64 48 58 62Z"/><path class="s23-leaf" d="M62 64 C78 44 98 40 112 46 C98 62 82 68 62 64Z"/>
<path class="s23-leaf" d="M56 64 C38 56 20 58 10 70 C28 78 44 76 56 64Z"/>
<path class="s23-pot" d="M44 64 H76 L71 92 H49 Z"/><path class="s23-board" d="M0 94 H130"/>
<rect class="s23-book" x="92" y="66" width="10" height="28" rx="2"/><rect class="s23-book" x="105" y="72" width="9" height="22" rx="2"/></svg>
</div>"""


def person(cls, uid, facebox=False):
    fb = ""
    if facebox:
        bw, bh = 98, 114
        bx, by = 156 * PK - bw / 2, 132 * PK - bh / 2
        L = 18
        corners = (f"M0 {L}V0H{L}M{bw - L} 0H{bw}V{L}M{bw} {bh - L}V{bh}H{bw - L}M{L} {bh}H0V{bh - L}")
        fb = (f'<svg class="s23-fbox" style="left:{bx:.1f}px;top:{by:.1f}px;width:{bw}px;height:{bh}px" '
              f'viewBox="0 0 {bw} {bh}" aria-hidden="true"><path d="{corners}"/>'
              f'<circle cx="{bw / 2}" cy="{bh / 2 - 4}" r="4.5"/></svg>')
    return (f'<div class="{cls}" style="left:{PLEFT:.2f}px;top:{PTOP:.2f}px;width:{PW:.2f}px;height:{PH:.2f}px">'
            f'{person_svg("s23-psvg", uid)}{fb}</div>')


def film():
    """Filmstrip of frames, each with the presenter in a slightly different place."""
    fw, fh, gap = 74, 42, 8
    total = FILM * fw + (FILM - 1) * gap
    x0 = SRC[0] + (SRC[2] - total) / 2
    offs = (-8, 2, 10, 6, -2, -10)
    out = []
    for i in range(FILM):
        x = x0 + (FILM - 1 - i) * (fw + gap)        # right to left
        hx = fw / 2 + offs[i]
        out.append(f'<div class="s23-fr" style="left:{x:.1f}px"><svg viewBox="0 0 {fw} {fh}" aria-hidden="true">'
                   f'<path class="s23-fsh" d="M{hx - 20} {fh} C{hx - 18} {fh - 10} {hx - 9} {fh - 14} {hx} {fh - 14} '
                   f'C{hx + 9} {fh - 14} {hx + 18} {fh - 10} {hx + 20} {fh}Z"/>'
                   f'<ellipse class="s23-fsh" cx="{hx}" cy="{fh - 24.5}" rx="7.5" ry="8.8"/>'
                   f'<rect class="s23-fbx" x="{hx - 12}" y="{fh - 36}" width="24" height="24" rx="3"/></svg></div>')
    return "".join(out)


def html(cfg):
    c = cfg["sim23"]
    m = moves()
    ox, oy, ow, oh = OUT
    sx, sy, sw, sh = SRC
    safe_x = [ow * v / 1080 for v in SAFE]
    edge_w = ow * EDGE / 1080
    zone_l = CROP_W / 2 - ZONE_W / 2
    # where the dead-zone leader meets the label (canvas), at rest
    lead_x = sx + CROP0 + CROP_W / 2
    data = " ".join(f'data-{k}="{v}"' for k, v in m.items())
    x_svg = ('<svg class="s23-x" viewBox="0 0 120 120" aria-hidden="true"><path d="M30 30 L90 90"/><path d="M90 30 L30 90"/></svg>')
    # the format tags sit toward the middle of the canvas (the 9:16 one on its frame's right corner), so the
    # punch-in on the source never pushes them into the frame's soft edge
    tags = (f'<span class="s23-tag s23-tag-o" dir="ltr" style="right:{800 - ox - ow}px;top:{oy - 46}px">{esc(c["tagOut"])}</span>'
            f'<span class="s23-tag s23-tag-s" dir="ltr" style="right:{800 - TAG_SRC_R}px;top:{sy - 46}px">{esc(c["tagSrc"])}</span>')
    fixlab = (f'<div class="s23-fixl" style="left:{sx + CROP0 + CROP_W / 2:.1f}px;top:{sy - 48}px">'
              f'<span dir="rtl"><i></i>{esc(c["fixLabel"])}</span></div>')
    safe = (f'<i class="s23-edge s23-edge-l" style="width:{edge_w:.1f}px"></i><i class="s23-edge s23-edge-r" style="width:{edge_w:.1f}px"></i>'
            + "".join(f'<i class="s23-sl" style="left:{x - 1:.1f}px"></i>' for x in safe_x))
    # 140 and 940 hang from the feet of their lines, inward (140 to the right of its line, 940 to the left)
    stags = "".join(f'<span class="s23-stag s23-stag{i}" dir="ltr" style="left:{ox + x:.1f}px;top:{oy + oh + 10}px"><i></i><b>{v}</b></span>'
                    for i, (x, v) in enumerate(zip(safe_x, SAFE)))
    bracket = (f'<div class="s23-br" style="left:{ox + safe_x[0]:.1f}px;width:{safe_x[1] - safe_x[0]:.1f}px;top:{oy + oh + 60}px">'
               f'<i class="s23-brl"></i><span dir="rtl">{esc(c["safeLabel"])}</span></div>')
    pill = f'<div class="s23-pill" dir="rtl">{esc(c["textPill"])}</div>'
    zone_lab = (f'<div class="s23-zl" style="left:{sx}px;width:{sw}px;top:{sy + sh + 22}px"><span dir="rtl"><i></i>'
                f'{esc(c["zoneLabel"])}</span></div>')
    zlead = f'<i class="s23-zlead" style="left:{lead_x - 1:.1f}px;top:{sy + sh + 2}px"></i>'
    eye = (f'<i class="s23-eye" style="top:{EYE_Y - 1:.1f}px"></i>'
           f'<div class="s23-el" style="left:{sx + 8}px;top:{sy - 52}px"><span dir="rtl">{esc(c["eyeLabel"])}<i></i></span></div>'
           f'<svg class="s23-elead" viewBox="0 0 800 700" aria-hidden="true"><path d="M{sx + 6} {sy - 32} H{ox + ow + 20} V{EYE_Y - 8:.1f}"/></svg>')
    focus = f'<i class="s23-focus" data-focus="2" style="left:{sx + 90}px;top:{sy + 40}px;width:{sw - 180}px;height:{sh - 80}px"></i>'
    arrow = f'<div class="s23-arr" style="left:{(ox + ow + sx) / 2 - 15:.1f}px;top:{sy + sh - 66}px">{ARROW_LEFT.format(cls="s23-arrow")}</div>'
    return f"""<div class="simwrap sim23" {data} data-scale="{SCALE:.5f}" data-crop0="{CROP0:.3f}" data-facex="{FACE0:.2f}" data-facey="{HEAD_Y:.2f}">
{tags}
<div class="s23-out" style="left:{ox}px;top:{oy}px;width:{ow}px;height:{oh}px">
<div class="s23-ocam" style="transform:scale({SCALE:.5f})"><div class="s23-oin" style="width:{sw}px;height:{sh}px;left:{-CROP0:.3f}px">{room("o")}{person("s23-p s23-pc", "23o")}</div></div>
<div class="s23-ovl">{safe}{pill}</div>
{x_svg}
</div>
<div class="s23-src" style="left:{sx}px;top:{sy}px;width:{sw}px;height:{sh}px">
{room("s")}{person("s23-p s23-ps", "23s", facebox=True)}
{"".join(f'<svg class="s23-ghost" style="left:{CROP0:.3f}px;width:{CROP_W:.3f}px" viewBox="0 0 {CROP_W:.2f} {sh}" preserveAspectRatio="none" aria-hidden="true"><rect x="2" y="2" width="{CROP_W - 4:.2f}" height="{sh - 4}" rx="6"/></svg>' for _ in range(3))}
<div class="s23-crop" style="left:{CROP0:.3f}px;width:{CROP_W:.3f}px">
<i class="s23-dim s23-dim-l"></i><i class="s23-dim s23-dim-r"></i>
<i class="s23-zone" style="left:{zone_l:.2f}px;width:{ZONE_W:.2f}px"></i>
<svg class="s23-cfix" viewBox="0 0 {CROP_W:.2f} {sh}" preserveAspectRatio="none" aria-hidden="true"><rect x="1.5" y="1.5" width="{CROP_W - 3:.2f}" height="{sh - 3}" rx="6"/></svg>
<svg class="s23-cred" viewBox="0 0 {CROP_W:.2f} {sh}" preserveAspectRatio="none" aria-hidden="true"><rect x="2" y="2" width="{CROP_W - 4:.2f}" height="{sh - 4}" rx="6"/></svg>
</div>
</div>
{fixlab}{arrow}
<div class="s23-film">{film()}<i class="s23-fscan" style="left:{sx + sw - 30}px"></i></div>
{zlead}{zone_lab}
{stags}{bracket}
{eye}{focus}
</div>"""


def cues(cfg):
    P, pe = cfg["phr"], cfg["phrEnd"]
    return [("glitch_soft", P[0] + 1.75), ("tick", P[1] + 0.45), ("swipe", P[2] + 0.2),
            ("tick", P[3] + 1.0), ("whoosh_soft", pe + 0.95)]
