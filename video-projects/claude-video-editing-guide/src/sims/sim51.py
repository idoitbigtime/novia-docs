"""5.1 simulation: one visual beat per explanation phrase, then the five connection steps.
B0 (tStage) the Higgsfield window draws on, empty model slots
B1 "יש בו יותר מ-30 מודלים ליצירת תמונות וסרטונים": 32 model tiles flip in, a digit-strip counter rolls to 30
B2 "קלוד בוחר את המודל שמתאים לבקשה": a request arrives, image models step back, a ring scans and locks on one clip model
B3 "ובודק כמה קרדיטים הוא יעלה": the chosen model steps forward, get_cost is asked, the price tag rolls to 35 (punch-in here)
payoff: five numbered, illustrated connection steps (cursor clicks, typed fields, the account, /mcp in the terminal).
Beat times come from cfg["phr"] (scene-local); payoff times are relative to cfg["phrEnd"]."""
from textlayout import esc
from art import ARROW_LEFT

# model kinds per row, column 0 = rightmost (v = video model, i = image model)
GRID = ["viiviivi", "iviiviiv", "iiviivii", "viivivii"]
PITCH, TILE = 96, 84
GX, GY = 22, 78          # grid origin in the canvas

IMG = ('<svg class="s51-g" viewBox="0 0 44 44" aria-hidden="true"><circle cx="30" cy="14" r="5"/>'
       '<path d="M5 35 L16 21 L24 30 L30 24 L39 35 Z"/></svg>')
VID = ('<svg class="s51-g" viewBox="0 0 44 44" aria-hidden="true"><rect x="5" y="9" width="34" height="26" rx="6"/>'
       '<path d="M19 16.5 L28 22 L19 27.5 Z"/></svg>')
OK = '<svg class="{cls}" viewBox="0 0 30 30" aria-hidden="true"><path d="M8 15.5l5 5 9-10"/></svg>'
PLUS = '<svg class="s51-plus" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg>'


def _tile_xy(r, c):
    """Top-left of tile (r, c) inside the grid; column 0 is at the right (reading order)."""
    return (7 - c) * PITCH, r * PITCH


def _gear():
    import math
    pts = []
    n = 8
    for k in range(n * 4):
        a = (k / (n * 4)) * 2 * math.pi - math.pi / 2
        rr = 27 if (k % 4) in (1, 2) else 21
        pts.append(f"{32 + rr * math.cos(a):.1f} {32 + rr * math.sin(a):.1f}")
    return ('<svg class="s51-ill s51-gear" viewBox="0 0 64 64" aria-hidden="true">'
            f'<path d="M{" L".join(pts)} Z"/><circle cx="32" cy="32" r="8"/></svg>')


def _strip(cells, cls):
    return f'<span class="s51-dw {cls}"><span class="s51-strip">' + "".join(f"<b>{d}</b>" for d in cells) + "</span></span>"


def _counter(n, cls):
    """Digit strips (transforms only): tens and ones roll together and land on n."""
    tens = [""] + [str(k) for k in range(1, n // 10 + 1)]
    ones = [str(k % 10) for k in range(0, 10 + n % 10 + 1)] if n >= 10 else [str(k) for k in range(n + 1)]
    return f'<span class="s51-num {cls}" dir="ltr">{_strip(tens, "s51-tens")}{_strip(ones, "s51-ones")}</span>'


def html(cfg):
    c = cfg["sim51"]
    # B1: the model wall (empty slots + tiles)
    slots, tiles = [], []
    for r, row in enumerate(GRID):
        for col, kind in enumerate(row):
            x, y = _tile_xy(r, col)
            slots.append(f'<rect x="{x + 1.5}" y="{y + 1.5}" width="{TILE - 3}" height="{TILE - 3}" rx="14"/>')
            tiles.append(f'<i class="s51-tile {kind} b{(r * 3 + col) % 4}" data-r="{r}" data-c="{col}" '
                         f'style="left:{x}px;top:{y}px">{VID if kind == "v" else IMG}</i>')
    hr, hc = c["hero"]
    hx, hy = _tile_xy(hr, hc)
    sr, scc = c["scan"][0]
    sx, sy = _tile_xy(sr, scc)
    count = _counter(c["count"], "s51-cnum")
    price = _counter(c["price"], "s51-pnum")
    a = ARROW_LEFT.format(cls="s51-arr")
    st = c["steps"]
    steps = f"""<div class="s51-steps">
<div class="s51-row s51-r1" dir="rtl"><i class="s51-bd"><b>1</b>{OK.format(cls="s51-ok")}</i>
<div class="s51-ln"><span class="s51-btn s51-c1a" dir="ltr">{esc(st["customize"])}</span>{a}<span class="s51-btn s51-c1b" dir="ltr">{esc(st["connectors"])}</span></div>
<div class="s51-sub" dir="rtl">{esc(st["where"])}</div>{_gear()}</div>
<div class="s51-row s51-r2" dir="rtl"><i class="s51-bd"><b>2</b>{OK.format(cls="s51-ok")}</i>
<div class="s51-ln"><span class="s51-btn s51-pbtn s51-c2a">{PLUS}</span>{a}<span class="s51-btn s51-c2b" dir="ltr">{esc(st["add_custom"])}</span></div></div>
<div class="s51-row s51-r3" dir="rtl"><i class="s51-bd"><b>3</b>{OK.format(cls="s51-ok")}</i>
<div class="s51-ln s51-f1"><span class="s51-fl" dir="rtl">{esc(st["name_lbl"])}</span><span class="s51-field s51-fname" dir="ltr"><span class="s51-typed">{esc(st["name"])}</span><i class="s51-caret"></i></span></div>
<div class="s51-ln s51-f2"><span class="s51-fl" dir="rtl">{esc(st["url_lbl"])}</span><span class="s51-field s51-furl" dir="ltr"><i class="s51-sel"></i><span class="s51-typed">{esc(st["url"])}</span><i class="s51-caret"></i></span></div></div>
<div class="s51-row s51-r4" dir="rtl"><i class="s51-bd"><b>4</b>{OK.format(cls="s51-ok")}</i>
<div class="s51-ln"><span class="s51-btn s51-c4a" dir="ltr">{esc(st["add"])}</span>{a}<span class="s51-btn s51-c4b" dir="ltr">{esc(st["connect"])}</span></div>
<div class="s51-sub" dir="rtl">{esc(st["account"])}</div>
<span class="s51-ill s51-acct"><svg class="s51-av" viewBox="0 0 64 64" aria-hidden="true"><circle class="s51-afr" cx="32" cy="32" r="29"/><circle cx="32" cy="25" r="10"/><path d="M14 52c3-10 10-14 18-14s15 4 18 14"/></svg>{OK.format(cls="s51-aok")}</span></div>
<div class="s51-row s51-r5" dir="rtl"><i class="s51-bd"><b>5</b>{OK.format(cls="s51-ok")}</i>
<div class="s51-ln"><svg class="s51-key" viewBox="0 0 48 30" aria-hidden="true"><circle cx="11" cy="15" r="7.5"/><path d="M18.5 15H42M35 15v6M41 15v5"/><path class="s51-kx" d="M5 27L43 3"/></svg><span class="s51-t5" dir="rtl">{esc(st["nokey"])}</span></div>
<div class="s51-sub" dir="rtl">{esc(st["also"])}</div>
<div class="s51-ill s51-term" dir="ltr"><i class="s51-tdots"><u></u><u></u><u></u></i>
<div class="s51-tl s51-tl1"><span class="s51-pr">&gt;</span> <span class="s51-tcmd">{esc(st["cmd"])}</span></div>
<div class="s51-tl s51-tl2"><i class="s51-tdot"></i>{esc(st["listed"])}</div></div></div>
</div>"""
    return f"""<div class="simwrap sim51">
<div class="s51-hubwrap">
<div class="s51-hub"><svg class="s51-hubo" viewBox="0 0 780 454" aria-hidden="true"><path d="M754.5 1.5 H25.5 A24 24 0 0 0 1.5 25.5 V428.5 A24 24 0 0 0 25.5 452.5 H754.5 A24 24 0 0 0 778.5 428.5 V25.5 A24 24 0 0 0 754.5 1.5 Z"/></svg>
<i class="s51-wd"><u></u><u></u><u></u></i>
<div class="s51-htitle" dir="ltr"><span>{esc(c["hub"])}</span><i></i></div></div>
<svg class="s51-slots" viewBox="0 0 756 372" aria-hidden="true">{"".join(slots)}</svg>
<div class="s51-grid">{"".join(tiles)}</div>
</div>
<div class="s51-count" dir="rtl"><span class="s51-cw" dir="rtl">{esc(c["countPre"])}</span>{count}<span class="s51-cw" dir="rtl">{esc(c["countPost"])}</span></div>
<div class="s51-legend" dir="rtl"><span class="s51-cat">{IMG}<b dir="rtl">{esc(c["cats"][0])}</b></span><span class="s51-cat">{VID}<b dir="rtl">{esc(c["cats"][1])}</b></span></div>
<i class="s51-ring" style="left:{GX + sx - 8}px;top:{GY + sy - 8}px"></i>
<div class="s51-req" dir="rtl"><span class="s51-rtag"><i></i>{esc(c["reqTag"])}</span><span class="s51-rtxt">{VID}<b dir="rtl">{esc(c["req"])}</b></span></div>
<div class="s51-hero v b{(hr * 3 + hc) % 4}" style="left:{GX + hx}px;top:{GY + hy}px">{VID}<i class="s51-hglow"></i>{OK.format(cls="s51-hok")}</div>
<div class="s51-fit" style="left:{GX + hx + TILE / 2}px"><i class="s51-lead"></i><span class="s51-fitl" dir="rtl"><i></i>{esc(c["fitLabel"])}</span></div>
<div class="s51-name" dir="ltr">{esc(c["model"])}</div>
<svg class="s51-conn" viewBox="0 0 4 100" preserveAspectRatio="none" aria-hidden="true"><line x1="2" y1="0" x2="2" y2="100"/></svg>
<div class="s51-gc"><span dir="ltr">{esc(c["getCost"])}</span></div>
<div class="s51-tag" data-focus="2"><svg class="s51-tago" viewBox="0 0 380 150" aria-hidden="true"><path d="M60 2 H356 Q378 2 378 24 V126 Q378 148 356 148 H60 L4 75 Z"/><circle cx="44" cy="75" r="9"/></svg>
<div class="s51-price" dir="rtl">{price}<span class="s51-pw" dir="rtl">{esc(c["priceLabel"])}</span></div></div>
{steps}
<svg class="s51-cur" viewBox="0 0 34 42" aria-hidden="true"><path d="M3 2 L3 33 L11 25.5 L16.5 38 L22 35.5 L16.6 23.4 L28 23 Z"/></svg>
</div>"""


def step_times(cfg):
    """Scene-local start of each payoff step (5 steps)."""
    c = cfg["sim51"]
    return [round(cfg["phrEnd"] + c["steps0"] + k * c["stepGap"], 3) for k in range(5)]


def cues(cfg):
    P = cfg["phr"]
    out = [("tick", P[0] + 1.1), ("pop", P[1] + 0.9), ("shimmer", P[2] + 1.15)]
    out += [("tick", t + 0.8) for t in step_times(cfg)]
    return out
