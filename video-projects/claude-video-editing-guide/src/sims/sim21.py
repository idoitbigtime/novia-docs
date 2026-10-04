"""2.1 simulation: one visual beat per explanation phrase, then the cuts close up.
B0 (phr0) a playhead turns the waveform into transcript words; Claude reads it sentence by sentence and
   marks what to cut: a silence ("שקט") and an "אמ"; the cuts table opens (punch-in on the reading)
B1 (phr1) a sentence that trails off is struck out whole ("נמחק כולו") -> table row 3
B2 (phr2) the same sentence twice: the first take is struck, the last complete one stays -> row 4
payoff: "מחכה לאישור" -> "אושר"; the cut segments close, the two lines become one tight strip and every
join gets "0.1 שנייה של שקט".
Time runs right to left (Hebrew reading order). All geometry is static and computed here; the JS reads it
from data attributes. Scene-local times live in sim21.js (from cfg.phr / cfg.phrEnd)."""
import math

from textlayout import esc

LINE_TOP = (30, 204)        # each transcript line: words row (40) + wave (56) = 100 px
SEG_H = 100
R_EDGE = 762                # lines are right-aligned, like a Hebrew paragraph
PANEL_X, PANEL_W = 8, 784   # the transcript panel and the table sit inside the canvas with an 8 px margin
GAP = 14                    # between segments
JOIN = 16                   # between segments once the cuts close
PAD = 4                     # inside a segment, each side
WGAP = 8                    # between word chips
DOTS_W, BROKEN_W, MARK_W = 30, 20, 86
WAVE_C = 28                 # wave row centre (row height 56)
PANEL_H, PANEL_H2 = 320, 152  # the final strip's join dots sit on the shrunk panel's bottom edge
TABLE_TOP, TABLE_H = 336, 350   # table 336..686 (bottom >= 14 px inside the canvas)
BTN_TOP, BTN_W, BTN_H = 280, 284, 56   # approval button (table-local)
ROW0, ROW_P = 66, 52        # table rows (table-local)
# table columns, right to left: scissors, זמן, מה נמחק, סיבה (padding 24, gaps 12)
T_PAD, C0_W, C1_W, C2_W, C_GAP = 24, 36, 172, 260, 12
C2_R = PANEL_X + PANEL_W - T_PAD - C0_W - C_GAP - C1_W - C_GAP     # right edge of the 'מה נמחק' cell (canvas)
# doc group shift for the payoff: the closed strip + its label end up centred in the canvas
LABEL_TOP = 206
DOC_DY = 220

# (id, line, kind, word-chip widths); kinds: keep / sil / um / aband / take1
SEGS = [
    ("k1", 0, "keep", (62, 80, 46)),
    ("x1", 0, "sil", ()),
    ("k2", 0, "keep", (54, 70)),
    ("x2", 0, "um", ()),
    ("k3", 0, "keep", (50, 74)),
    ("x3", 1, "aband", (64, 52, 40)),
    ("x4", 1, "take1", (70, 50)),
    ("k4", 1, "keep", (70, 50, 64)),
]
SEEDS = {"k1": 11, "x1": 2, "k2": 23, "x2": 3, "k3": 37, "x3": 41, "x4": 57, "k4": 57}
CUTS = ("x1", "x2", "x3", "x4")     # table rows 1..4, in this order

SCISSORS = ('<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="6.5" r="3.2"/>'
            '<circle cx="6" cy="17.5" r="3.2"/><path d="M8.8 8.4 20.5 18.2M8.8 15.6 20.5 5.8"/></svg>')
CHECK = '<svg class="{cls}" viewBox="0 0 30 30" aria-hidden="true"><path d="M6 15.5l6 6 12-13"/></svg>'
CLOCK = ('<svg class="s21-clock" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="11.5"/>'
         '<path class="s21-hand" d="M15 15V7.5"/><path d="M15 15h5"/></svg>')
CURSOR = ('<svg class="s21-cursor" viewBox="0 0 30 40" aria-hidden="true">'
          '<path d="M3 3 L3 32 L10.5 25 L16 37.5 L21.5 35 L16 23 L26 23 Z"/></svg>')


def seg_w(kind, words):
    if kind in ("sil", "um"):
        return MARK_W
    w = sum(words) + WGAP * (len(words) - 1) + 2 * PAD
    if kind == "aband":
        w += WGAP + DOTS_W
    if kind == "take1":
        w += WGAP + BROKEN_W
    return w


def layout():
    """Segments with their static boxes, the payoff shift of every kept segment and the join positions."""
    segs, x = [], {0: R_EDGE, 1: R_EDGE}
    for sid, line, kind, words in SEGS:
        w = seg_w(kind, words)
        left = x[line] - w
        segs.append(dict(id=sid, line=line, kind=kind, words=words, w=w, left=left, top=LINE_TOP[line]))
        x[line] = left - GAP
    keep = [s for s in segs if s["kind"] == "keep"]
    total = sum(s["w"] for s in keep) + JOIN * (len(keep) - 1)
    xr = (800 + total) / 2
    joins = []
    for i, s in enumerate(keep):
        fl = xr - s["w"]
        s["dx"], s["dy"] = round(fl - s["left"], 1), LINE_TOP[0] - s["top"]
        if i < len(keep) - 1:
            joins.append(round(fl - JOIN / 2, 1))
        xr = fl - JOIN
    return segs, joins


def _rng(seed):
    st = [seed]

    def r():
        st[0] = (st[0] * 1103515245 + 12345) & 0x7FFFFFFF
        return st[0] / 0x7FFFFFFF
    return r


def wave_path(w, kind, seed):
    """Waveform bars as one stroked path. u runs 0 (start, right) -> 1 (end, left)."""
    pitch = 9.0
    n = max(3, int((w - 2 * PAD - 6) // pitch) + 1)
    span = (n - 1) * pitch
    x0 = w - (w - span) / 2
    r = _rng(seed)
    d = []
    for i in range(n):
        u = i / (n - 1)
        edge = min(1.0, 0.35 + 3.0 * min(u, 1 - u))
        rnd = r()
        if kind == "sil":
            h = 1.5
        elif kind == "um":
            h = 6 + 24 * math.sin(math.pi * u)
        else:
            h = (12 + 32 * rnd) * edge
            if kind == "aband":
                h *= 1 - 0.8 * u
            if kind == "take1":
                h *= 1 - 0.85 * max(0.0, (u - 0.62) / 0.38)
        h = max(1.5, h)
        xx = x0 - i * pitch
        d.append(f"M{xx:.1f} {WAVE_C - h / 2:.1f}V{WAVE_C + h / 2:.1f}")
    return "".join(d)


def _words(s, c):
    k, out = s["kind"], []
    if k == "sil":
        return f'<span class="s21-silc" dir="rtl">{esc(c["silLabel"])}</span>'
    if k == "um":
        return f'<span class="s21-w s21-umw" dir="rtl">{esc(c["umWord"])}</span>'
    for i, ww in enumerate(s["words"]):
        a = 0.85
        if k == "aband":
            a = (0.85, 0.66, 0.46)[i]
        out.append(f'<i class="s21-w" style="width:{ww}px;background:rgba(217, 212, 255, {a})"></i>')
    if k == "aband":
        out.append('<span class="s21-w s21-dots"><svg viewBox="0 0 30 26" aria-hidden="true"><circle cx="25" cy="13" r="3"/>'
                   '<circle cx="15" cy="13" r="3"/><circle cx="5" cy="13" r="3"/></svg></span>')
    if k == "take1":
        out.append(f'<i class="s21-w s21-brk" style="width:{BROKEN_W}px"></i>')
    return "".join(out)


def _seg_html(s, c):
    p = wave_path(s["w"], s["kind"], SEEDS[s["id"]])
    svg = f'<svg viewBox="0 0 {s["w"]} 56" preserveAspectRatio="none" aria-hidden="true"><path d="{p}"/></svg>'
    extra = ""
    if s["kind"] != "keep":
        extra += '<i class="s21-cut"></i>'
    if s["kind"] == "um":
        extra += '<i class="s21-st s21-stl"></i>'      # lavender: it plays while the accent phrase is red
    elif s["kind"] in ("aband", "take1"):
        extra += '<i class="s21-st"></i>'
    if s["id"] == "k4":
        extra += '<i class="s21-keep"></i>'
    data = f' data-line="{s["line"]}" data-kind="{s["kind"]}"'
    if s["kind"] == "keep":
        data += f' data-dx="{s["dx"]}" data-dy="{s["dy"]}"'
    cls = "s21-seg s21-k" if s["kind"] == "keep" else "s21-seg s21-x"
    return (f'<div class="{cls}" id="t21-{s["id"]}"{data} style="left:{s["left"]}px;top:{s["top"]}px;width:{s["w"]}px">'
            f'{extra}<div class="s21-words">{_words(s, c)}</div>'
            f'<div class="s21-wave"><div class="s21-wd">{svg}</div><div class="s21-wl">{svg}</div></div></div>')


def _box(segs, pad=8):
    l = min(s["left"] for s in segs) - pad
    r = max(s["left"] + s["w"] for s in segs) + pad
    t = segs[0]["top"] - pad
    return l, t, r - l, SEG_H + 2 * pad


def _pict(kind, c):
    """'מה נמחק' cell: a small picture of what is deleted."""
    if kind == "sil":
        return ('<svg class="s21-pg" viewBox="0 0 132 30" aria-hidden="true"><path class="s21-flat" d="M8 15H125"/></svg>')
    if kind == "um":
        return f'<span class="s21-pum" dir="rtl">{esc(c["umWord"])}</span>'
    ws = (46, 36, 28) if kind == "aband" else (50, 36)
    al = (0.85, 0.62, 0.42) if kind == "aband" else (0.85, 0.85)
    chips = "".join(f'<i style="width:{w}px;background:rgba(217, 212, 255, {a})"></i>' for w, a in zip(ws, al))
    tail = ('<svg class="s21-pdots" viewBox="0 0 26 20" aria-hidden="true"><circle cx="22" cy="10" r="2.6"/><circle cx="13" cy="10" r="2.6"/>'
            '<circle cx="4" cy="10" r="2.6"/></svg>') if kind == "aband" else '<i class="s21-pbrk"></i>'
    return f'<span class="s21-pchips">{chips}{tail}<b class="s21-pst"></b></span>'


def html(cfg):
    c = cfg["sim21"]
    segs, joins = layout()
    by = {s["id"]: s for s in segs}
    lane_y = [LINE_TOP[0] + 44 + WAVE_C, LINE_TOP[1] + 44 + WAVE_C]
    line_l = [min(s["left"] for s in segs if s["line"] == i) for i in (0, 1)]

    seg_html = "".join(_seg_html(s, c) for s in segs)
    lanes = "".join(f'<i class="s21-lane" style="top:{y - 1}px;left:{line_l[i] - 10}px;width:{R_EDGE + 10 - line_l[i] + 10}px"></i>'
                    for i, y in enumerate(lane_y))
    heads = "".join(f'<i class="s21-head s21-h{i + 1}" data-r="{R_EDGE}" data-l="{line_l[i]}" '
                    f'style="left:{R_EDGE}px;top:{LINE_TOP[i] - 10}px"></i>' for i in (0, 1))
    # reading brackets: sentence 1, the silence, sentence 2 (with the "אמ"), the abandoned sentence, both takes
    groups = [("k1",), ("x1",), ("k2", "x2", "k3"), ("x3",), ("x4", "k4")]
    rds = ""
    for i, g in enumerate(groups):
        l, t, w, h = _box([by[k] for k in g])
        rds += f'<i class="s21-rd s21-rd{i + 1}" style="left:{l}px;top:{t}px;width:{w}px;height:{h}px"></i>'

    # lane labels above line 2
    def cx(k):
        return by[k]["left"] + by[k]["w"] / 2
    x3c, x4c, k4c = cx("x3"), cx("x4"), cx("k4")
    lab_t = LINE_TOP[1] - 60
    def lab(n, x, inner):
        return (f'<div class="s21-lab" style="left:{x:.0f}px;top:{lab_t}px"><div class="s21-lp s21-lab{n}" dir="rtl">'
                f'{inner}</div></div>')
    labs = (lab(3, x3c, f'<i class="s21-ldot s21-lav"></i><span>{esc(c["abandLabel"])}</span>') +
            lab(4, (x4c + k4c) / 2, f'<i class="s21-ldot"></i><span>{esc(c["twiceLabel"])}</span>') +
            lab(5, k4c, f'{CHECK.format(cls="s21-lck")}<span>{esc(c["lastLabel"])}</span>'))
    ay = LINE_TOP[1] - 4
    arc = (f'<svg class="s21-arc" viewBox="0 0 800 340" aria-hidden="true"><path d="M{x4c:.0f} {ay} '
           f'C{x4c:.0f} {ay - 46} {k4c:.0f} {ay - 46} {k4c:.0f} {ay}"/>'
           f'<circle cx="{x4c:.0f}" cy="{ay}" r="5"/><circle cx="{k4c:.0f}" cy="{ay}" r="5"/></svg>')

    # payoff: joins, leaders, label, play-through head (doc coordinates, the final strip sits on line 1)
    jtop = LINE_TOP[0] - 8
    jhtml = "".join(f'<i class="s21-join" style="left:{j - 8}px;top:{jtop}px"><b></b><u></u><em></em></i>' for j in joins)
    lead = ""
    for j in joins:
        ex = min(520, max(280, 400 + (j - 400) * 0.45))
        y0 = LINE_TOP[0] + SEG_H + 14
        lead += f'<path d="M{j} {y0} C{j} {y0 + 34} {ex:.0f} {LABEL_TOP - 40} {ex:.0f} {LABEL_TOP - 4}"/>'
    lead_svg = f'<svg class="s21-lead" viewBox="0 0 800 340" aria-hidden="true">{lead}</svg>'
    jl = (f'<div class="s21-jlw" style="top:{LABEL_TOP}px"><div class="s21-jl" dir="rtl"><i class="s21-ldot"></i>'
          f'<span><span class="isl" dir="ltr">{esc(c["joinNum"])}</span> {esc(c["joinLabel"])}</span></div></div>')
    keep = [s for s in segs if s["kind"] == "keep"]
    fr = max(s["left"] + s["dx"] + s["w"] for s in keep)
    fl = min(s["left"] + s["dx"] for s in keep)
    ph = f'<i class="s21-ph" data-span="{fr - fl:.0f}" style="left:{fr + 4:.0f}px;top:{LINE_TOP[0] - 12}px"></i>'
    l1, t1, w1, h1 = _box([by[k] for k in ("k1", "x1", "k2", "x2", "k3")], pad=0)
    focus = f'<i class="s21-focus" data-focus="0" style="left:{l1}px;top:{t1}px;width:{w1}px;height:{h1}px"></i>'

    # cuts table: columns זמן · מה נמחק · סיבה (RTL), one row per cut, then the approval button
    total = (R_EDGE - line_l[0]) + (R_EDGE - line_l[1])
    rows, flies, slots = "", "", ""
    for i, k in enumerate(CUTS):
        s = by[k]
        pos = (R_EDGE - (s["left"] + s["w"] / 2)) + (0 if s["line"] == 0 else R_EDGE - line_l[0])
        u = pos / total
        rw = max(10.0, s["w"] / total * C1_W)
        rr = max(0.0, min(C1_W - rw, u * C1_W - rw / 2))
        slots += f'<i class="s21-slot" style="top:{ROW0 + i * ROW_P}px"></i>'
        rows += (f'<div class="s21-row" id="t21-r{i + 1}" style="top:{ROW0 + i * ROW_P}px">'
                 f'<span class="s21-c0">{SCISSORS.format(cls="s21-rsc")}</span>'
                 f'<span class="s21-c1"><i class="s21-trk"><b style="right:{rr:.1f}px;width:{rw:.1f}px"></b></i></span>'
                 f'<span class="s21-c2">{_pict(s["kind"], c)}</span>'
                 f'<span class="s21-c3" dir="rtl">{esc(c["reasons"][i])}</span></div>')
        # a spark flies from the mark on the transcript to its row
        sx, sy = s["left"] + s["w"] / 2, s["top"] + 20
        tx, ty = C2_R - 60, TABLE_TOP + ROW0 + i * ROW_P + 24
        flies += f'<i class="s21-fly s21-fly{i + 1}" data-dx="{tx - sx:.0f}" data-dy="{ty - sy:.0f}" style="left:{sx:.0f}px;top:{sy:.0f}px"></i>'
    cols = "".join(f'<span class="s21-c{i + 1}" dir="rtl">{esc(t)}</span>' for i, t in enumerate(c["cols"]))
    btn = (f'<div class="s21-btn" style="left:{T_PAD}px;top:{BTN_TOP}px;width:{BTN_W}px;height:{BTN_H}px"><i class="s21-bring"></i><span class="s21-bw" dir="rtl">{CLOCK}<span>{esc(c["wait"])}</span></span>'
           f'<span class="s21-bo" dir="rtl">{CHECK.format(cls="s21-bok")}<span>{esc(c["ok"])}</span></span></div>')
    table = (f'<div class="s21-table" style="left:{PANEL_X}px;top:{TABLE_TOP}px;width:{PANEL_W}px;height:{TABLE_H}px">'
             f'<div class="s21-th"><span class="s21-c0"></span>{cols}</div>'
             f'<i class="s21-tdiv"></i>{slots}{rows}{btn}</div>')
    # the cursor's tip (3, 3 in its box) lands on the right part of the approval button
    cur_x = PANEL_X + T_PAD + BTN_W * 0.8 - 3
    cur_y = TABLE_TOP + BTN_TOP + BTN_H / 2 - 3

    return f"""<div class="simwrap sim21" data-h2="{PANEL_H2}" data-h1="{PANEL_H}" data-docdy="{DOC_DY}">
<div class="s21-doc">
<div class="s21-pbg" style="left:{PANEL_X}px;width:{PANEL_W}px;height:{PANEL_H}px"></div>{lanes}{rds}
{seg_html}
{heads}{arc}{labs}{focus}
{jhtml}{lead_svg}{jl}{ph}
</div>
{table}
{flies}<div class="s21-cur" style="left:{cur_x:.0f}px;top:{cur_y:.0f}px">{CURSOR}<i class="s21-tap"></i></div>
</div>"""


def cues(cfg):
    P, pe = cfg["phr"], cfg["phrEnd"]
    return [("tick", P[0] + 1.55), ("snap", P[1] + 0.4), ("tick", P[2] + 0.9),
            ("pop", pe + 1.0), ("swipe", pe + 1.95)]
