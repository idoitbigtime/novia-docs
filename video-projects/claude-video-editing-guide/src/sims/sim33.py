"""3.3 simulation: text on the wall behind you. One visual beat per explanation phrase.
Canvas 800 x 700. The video frame is three stacked layers from the start (CSS 3D): the original clip (room +
presenter), the text, the presenter without the background. Flat they look like one picture; the payoff turns them.
B0 a title pops over the face and hides it (red)
B1 regular footage (tag), no green screen (a green-screen card struck out; punch-in on it)
B2 the presenter is separated from the background in every frame: a scanner, a checkerboard, a strip of frames
B3 the text enters word by word on the wall, behind the presenter (each word whole: rises ~30 px, unblurs)
B4 the hand rises and passes over "לכבד"; it hides only the part behind it, the text stays readable
payoff: a side view of the three layers, bottom to top: the original clip · the text · you without the background.
Times come from cfg["phr"] / cfg["phrEnd"] (scene-local)."""
from textlayout import esc

FX, FY, FW, FH = 10, 40, 780, 439          # the frame on the canvas (16:9)
SC = FW / 640                               # design units (640 x 360) -> px

HAND = ("M-27 4 C-29 -14 -31 -26 -32 -36 C-40 -44 -50 -56 -58 -70 C-61 -77 -53 -83 -47 -77 C-42 -69 -36 -61 -31 -57 "
        "L-31 -104 C-31 -114 -18 -114 -18 -104 L-18 -86 L-16 -86 L-16 -112 C-16 -122 -2 -122 -2 -112 L-2 -86 L0 -86 "
        "L0 -106 C0 -116 13 -116 13 -106 L13 -84 L15 -82 L16 -94 C16 -103 28 -103 28 -94 L27 -66 C30 -44 30 -20 26 4 Z")


def _defs(uid):
    return (f'<defs><linearGradient id="pf{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3274"/><stop offset="1" stop-color="#1a1636"/></linearGradient>'
            f'<linearGradient id="pr{uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c9c2ff" stop-opacity="0"/><stop offset="0.65" stop-color="#c9c2ff" stop-opacity="0.15"/>'
            f'<stop offset="1" stop-color="#c9c2ff" stop-opacity="0.85"/></linearGradient></defs>')


def _person(uid, arm_cls, outline=False):
    """The presenter (design units): bust, head, and a forearm + open hand that can rise into the frame."""
    body = "M316 360 C 324 300, 376 262, 442 256 L 486 256 C 552 262, 604 300, 612 360 Z"
    out = [f'<path d="{body}" fill="url(#pf{uid})"/>',
           f'<rect x="436" y="200" width="56" height="66" rx="22" fill="url(#pf{uid})"/>',
           f'<ellipse cx="464" cy="150" rx="56" ry="66" fill="url(#pf{uid})"/>',
           f'<path d="{body[:-2]}" fill="none" stroke="url(#pr{uid})" stroke-width="3"/>',
           f'<ellipse cx="464" cy="150" rx="56" ry="66" fill="none" stroke="url(#pr{uid})" stroke-width="3"/>']
    if outline:
        out.append(f'<path class="s33-cut" d="M316 360 C 324 300, 376 262, 436 258 L 436 232 C 420 222, 408 196, 408 160 '
                   f'C 404 112, 428 84, 464 84 C 500 84, 524 112, 520 160 C 520 196, 508 222, 492 232 L 492 258 C 552 262, 604 300, 612 360"/>')
    arm = (f'<g class="{arm_cls}" transform="translate(0 230)"><g transform="translate(338 236) scale(0.78)">'
           f'<path d="M-24 0 L-40 190 L30 190 L26 0 Z" fill="url(#pf{uid})"/>'
           f'<path d="{HAND}" fill="url(#pf{uid})"/><path d="{HAND}" fill="none" stroke="url(#pr{uid})" stroke-width="3"/></g></g>')
    out.append(arm)
    return "".join(out)


def _room():
    return ('<svg class="s33-room" viewBox="0 0 640 360" preserveAspectRatio="none" aria-hidden="true">'
            '<defs><linearGradient id="s33wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2456"/><stop offset="1" stop-color="#16132e"/></linearGradient>'
            '<radialGradient id="s33lamp" cx="0.12" cy="0.05" r="0.7"><stop offset="0" stop-color="#a993ff" stop-opacity="0.28"/><stop offset="1" stop-color="#a993ff" stop-opacity="0"/></radialGradient></defs>'
            '<rect width="640" height="360" fill="url(#s33wall)"/><rect width="640" height="360" fill="url(#s33lamp)"/>'
            '<rect x="548" y="34" width="70" height="104" rx="5" fill="none" stroke="rgba(201,194,255,0.18)" stroke-width="2"/>'
            '<path d="M583 34 V138" stroke="rgba(201,194,255,0.18)" stroke-width="2"/>'
            '<path d="M40 262 H232" stroke="rgba(201,194,255,0.26)" stroke-width="3" stroke-linecap="round"/>'
            '<rect x="64" y="226" width="16" height="36" rx="2" fill="rgba(201,194,255,0.16)"/><rect x="84" y="232" width="14" height="30" rx="2" fill="rgba(201,194,255,0.12)"/>'
            '<path d="M178 262 C 172 240, 178 228, 190 224 C 196 236, 200 248, 196 262 Z" fill="rgba(201,194,255,0.16)"/>'
            '<path d="M190 226 C 184 210, 192 200, 202 196 M190 226 C 200 214, 212 212, 220 214" fill="none" stroke="rgba(201,194,255,0.22)" stroke-width="2"/></svg>')


def _mini(i):
    """B2: one frame of the strip: the presenter cut out on a checkerboard."""
    return (f'<div class="s33-mf"><i class="chk"></i><svg viewBox="0 0 160 90" aria-hidden="true">'
            f'<path d="M48 90 C 52 72, 66 64, 82 63 L 94 63 C 110 64, 124 72, 128 90 Z"/><ellipse cx="{88 + (i % 3) * 2 - 2}" cy="40" rx="15" ry="18"/></svg>'
            f'<svg class="ol" viewBox="0 0 160 90" aria-hidden="true"><path d="M48 90 C 52 72, 66 64, 82 63 L 94 63 C 110 64, 124 72, 128 90"/>'
            f'<ellipse cx="{88 + (i % 3) * 2 - 2}" cy="40" rx="15" ry="18"/></svg></div>')


def _wtime(words):
    """B3: the words on a time strip (right to left), each chip where its word is said."""
    import math as _m
    spans = [(570, 670), (388, 478), (206, 286)]          # chip x ranges (canvas px); right edges 192 px apart
    bars, x = [], 686
    segs = [(a - 6, b + 6) for a, b in spans]
    while x >= 120:
        inside = [sg for sg in segs if sg[0] <= x <= sg[1]]
        if inside:
            a, b = inside[0]
            ph = (b - x) / max(1, b - a)
            h = 7 + 15 * _m.sin(_m.pi * ph) * (0.75 + 0.25 * _m.sin(x * 0.37))
        else:
            h = 2.5 + 1.5 * _m.sin(x * 0.9)
        bars.append(f"M{x - 120} {25 - h:.1f}V{25 + h:.1f}")
        x -= 8
    chips = "".join(f'<span class="s33-wc" style="left:{a}px;width:{b - a}px" dir="rtl">{esc(w)}</span>' for (a, b), w in zip(spans, words))
    return (f'<div class="s33-wt"><svg class="s33-wtv" viewBox="0 0 570 50" aria-hidden="true"><path d="{" ".join(bars)}"/></svg>'
            f'{chips}<i class="s33-wph"></i></div>')


def html(cfg):
    c = cfg["sim33"]
    l1, l2 = c["text"]
    words = [(w, 0) for w in l1.split()] + [(w, 1) for w in l2.split()]
    line1 = " ".join(f'<span class="s33-w">{esc(w)}</span>' for w, ln in words if ln == 0)
    line2 = " ".join(f'<span class="s33-w">{esc(w)}</span>' for w, ln in words if ln == 1)
    full = esc(l1 + " " + l2)
    mk = '<i class="s33-mk"></i>'
    labs = "".join(f'<div class="s33-lab s33-lab{i}" dir="rtl"><span>{esc(t)}</span><i></i></div>' for i, t in enumerate(c["layers"]))
    return f"""<div class="simwrap sim33">
<div class="s33-persp">
<div class="s33-stack">
<div class="s33-ly s33-la">{_room()}<i class="s33-chk"></i>
<svg class="s33-pp" viewBox="0 0 640 360" aria-hidden="true">{_defs("33a")}{_person("33a", "s33-arm s33-arma")}</svg>
<i class="s33-edge"></i>{mk}</div>
<div class="s33-ly s33-lb"><div class="s33-text" dir="rtl"><div>{line1}</div><div>{line2}</div></div><i class="s33-edge"></i>{mk}</div>
<div class="s33-ly s33-lc"><svg class="s33-pp" viewBox="0 0 640 360" aria-hidden="true">{_defs("33c")}{_person("33c", "s33-arm s33-armc", outline=True)}</svg>
<i class="s33-edge"></i>{mk}</div>
</div>
<div class="s33-frame"><svg viewBox="0 0 780 439" aria-hidden="true"><path d="M16 56 V16 H56"/><path d="M724 16 H764 V56"/><path d="M764 383 V423 H724"/><path d="M56 423 H16 V383"/></svg></div>
<i class="s33-scan"></i>
<div class="s33-title" dir="rtl"><span>{full}</span><i class="s33-tring"></i></div>
<div class="s33-tag" dir="rtl"><svg viewBox="0 0 30 22" aria-hidden="true"><rect x="1.5" y="4" width="19" height="15" rx="3"/><path d="M20.5 9.5 L28 5.5 V17.5 L20.5 13.5"/></svg><span>{esc(c["regular"])}</span></div>
</div>
<div class="s33-gs" data-focus="1"><svg class="s33-gsv" viewBox="0 0 220 150" aria-hidden="true">
<path class="st" d="M38 140 L58 22 M182 140 L162 22 M30 140 H70 M150 140 H190"/>
<rect class="bd" x="44" y="16" width="132" height="92" rx="4"/><path class="fl" d="M80 16 V108 M140 16 V108"/>
<path class="x" d="M28 6 L192 132"/><path class="x" d="M192 6 L28 132"/></svg><b dir="rtl">{esc(c["green"])}</b></div>
<div class="s33-strip">{"".join(_mini(i) for i in range(5))}<i class="s33-msel"></i></div>
{_wtime([w for w, _ in words])}
<svg class="s33-leads" viewBox="0 0 800 700" aria-hidden="true"><path/><path/><path/></svg>
{labs}
</div>"""


def cues(cfg):
    P, pe = cfg["phr"], cfg["phrEnd"]
    return [("pop", P[0] + 0.15), ("glitch_soft", P[0] + 0.95), ("snap", P[1] + 0.55), ("swipe", P[2] + 0.1),
            ("tick", P[3] + 0.2), ("whoosh_soft", P[4] + 0.1), ("swipe", pe + 0.2), ("pop", pe + 1.35)]
