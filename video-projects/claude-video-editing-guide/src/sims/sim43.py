"""4.3 simulation: where to put b-rolls and what each one shows.
Layout (800 x 700): the table Claude returns (top) over the talking video's timeline (bottom: a b-roll track over the
speech track; time runs right to left, the reading direction).
B0 the speech is transcribed (a scanner, word chips); the words fly up into a table
B1 its columns fill one by one: the time (a mini timeline per row), the sentence, what is seen (an icon), the source
B2 b-rolls drop onto the track; a "3 שניות" caliper measures every gap of speech: two fit, one is longer (red hole;
   the punch-in lands on the caliper)
B3 each clip is checked against its own sentence; a merely similar clip is rejected, and the row says "חסר"
payoff: the rule tags arrive, each acted out on the track: a face zoom does not count, the same clip may not repeat,
an entry at most a second and a half before the word; the hole stays marked.
Times come from cfg["phr"] / cfg["phrEnd"] (scene-local) in sim43.js. Mock content is abstract (bars, icons)."""
from textlayout import esc

# the timeline: time 0 at x 640, 32 px per second (right to left), 18 seconds
X0, PX = 640, 32
# rows in time order: (b-roll start, end, icon) - row 4 has no fitting clip (the hole); (sentence start, end)
ROWS = [(0.4, 2.6, "scr", 0.2, 3.6), (4.8, 6.8, "anim", 3.8, 7.4), (9.2, 11.0, "ai", 7.6, 11.0),
        (11.0, 16.0, None, 11.2, 15.8), (16.0, 18.0, "file", 16.0, 18.0)]
BARS = [(52, 34, 60), (40, 58, 36), (60, 30, 48), (36, 52, 44), (48, 40, 54)]   # sentence bars (px), abstract words
KEY = (2, 1, 0, 1, 2)                                                            # the key word of each sentence
ICONS = {
    "scr": '<rect x="3" y="5" width="24" height="16" rx="2.5"/><path d="M11 25.5h8M15 21v4.5"/><path d="M13.5 8.5l6 4.5-3.2.7-1.5 2.9z"/>',
    "anim": '<path d="M15 4l2.4 6.2L24 12l-6.6 1.8L15 20l-2.4-6.2L6 12l6.6-1.8z"/><path d="M5 25h5M20 25h5"/>',
    "ai": '<rect x="3" y="7" width="22" height="17" rx="3"/><path d="M11.5 11.5v8l6.5-4z"/><path d="M25.5 2.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>',
    "file": '<path d="M3 9.5a2 2 0 0 1 2-2h6l2.5 2.5H25a2 2 0 0 1 2 2V23a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    "img": '<rect x="3" y="5" width="24" height="20" rx="3"/><path d="M5 22l7-7 4.5 4.5 3.5-3.5 5 5"/><circle cx="20.5" cy="11" r="2.4"/>',
    "zoom": '<circle cx="15" cy="13" r="5.5"/><path d="M8 25c1.6-4 4-6 7-6s5.4 2 7 6"/><path d="M3 9V3h6M21 3h6v6M27 21v6h-6M9 27H3v-6"/>',
    "dup": '<rect x="3" y="10" width="17" height="14" rx="2.5"/><rect x="10" y="4" width="17" height="14" rx="2.5"/>',
    "entry": '<path d="M3 15h11M10.5 11l4 4-4 4"/><path d="M19 6v18"/><path d="M24 11.5l3.5 3.5-3.5 3.5-3.5-3.5z"/>',
}
CHECK = '<svg class="{cls}" viewBox="0 0 30 30" aria-hidden="true"><path d="M7 15.5l5.5 5.5 11-12"/></svg>'
CROSS = '<svg class="{cls}" viewBox="0 0 30 30" aria-hidden="true"><path d="M9.5 9.5l11 11"/><path d="M20.5 9.5l-11 11"/></svg>'


def X(t):
    return X0 - PX * t


def ico(name, cls="s43-ico"):
    return f'<svg class="{cls}" viewBox="0 0 30 30" aria-hidden="true">{ICONS[name]}</svg>'


def _wave():
    """The speech track's waveform: one path of rounded bars (fixed pattern)."""
    hs = [8, 14, 22, 16, 28, 34, 20, 12, 26, 38, 30, 18, 10, 24, 34, 26, 14, 8, 20, 30, 24, 14]
    d = []
    for i in range(72):
        x = 66 + i * 8.05
        h = hs[(i * 7) % len(hs)] * 0.9
        d.append(f"M{x:.1f} {29 - h / 2:.1f}v{h:.1f}")
    return f'<svg class="s43-wave" viewBox="60 0 584 58" preserveAspectRatio="none" aria-hidden="true"><path d="{" ".join(d)}"/></svg>'


def html(cfg):
    c = cfg["sim43"]
    src = {"scr": c["sources"][0], "anim": c["sources"][1], "ai": c["sources"][2], "file": c["sources"][3]}
    rows, blocks, chips = [], [], 0
    for k, ((b0, b1, icon, s0, s1), bars, key) in enumerate(zip(ROWS, BARS, KEY)):
        # time cell: a mini timeline with this row's span (no digits: the times are mock)
        mt = f'<span class="s43-mt"><i style="right:{b0 / 18 * 100:.1f}%;width:{(b1 - b0) / 18 * 100:.1f}%"></i></span>'
        sb = "".join(
            f'<i class="s43-wb{" s43-key" if j == key else ""}" style="width:{w}px" '
            f'data-x="{X(s0 + (j + 0.5) * (s1 - s0) / 3):.1f}"></i>' for j, w in enumerate(bars))
        what = ico(icon) if icon else '<i class="s43-what0"></i>'
        source = (f'<span class="s43-src" dir="rtl">{esc(src[icon])}</span>' if icon else
                  f'<span class="s43-src s43-miss" dir="rtl">{esc(c["missing"])}</span><i class="s43-src0"></i>')
        rows.append(f'<div class="s43-row s43-r{k + 1}"><i class="s43-line"></i><i class="s43-band"></i><span class="s43-c s43-ct">{mt}</span>'
                    f'<span class="s43-c s43-cs">{sb}</span><span class="s43-c s43-cw">{what}</span>'
                    f'<span class="s43-c s43-cx">{source}</span></div>')
        if icon:
            blocks.append(f'<div class="s43-blk s43-b{k + 1}" style="left:{X(b1):.1f}px;width:{X(b0) - X(b1):.1f}px">{ico(icon)}'
                          f'<i class="s43-bok">{CHECK.format(cls="s43-ok")}</i></div>')
    hole_l, hole_w = X(ROWS[3][1]), X(ROWS[3][0]) - X(ROWS[3][1])
    g1 = (X(ROWS[1][0]), X(ROWS[0][1]))     # gap between b-rolls 1 and 2
    g2 = (X(ROWS[2][0]), X(ROWS[1][1]))
    gaps = "".join(f'<i class="s43-gap s43-g{i + 1}" style="left:{a:.1f}px;width:{b - a:.1f}px">{CHECK.format(cls="s43-gok")}</i>'
                   for i, (a, b) in enumerate((g1, g2)))
    heads = "".join(f'<span class="s43-h s43-h{i + 1}" dir="rtl">{esc(h)}</span>' for i, h in enumerate(c["cols"]))
    rules = "".join(f'<div class="s43-rule s43-u{i + 1}" dir="rtl">{ico(n, "s43-rico")}<span>{esc(r)}</span></div>'
                    for i, (r, n) in enumerate(zip(c["rules"], ("zoom", "dup", "entry"))))
    # the hole, the caliper (static at the hole's right edge: 3 seconds), the speech span of each sentence
    cal_l = X(ROWS[3][0]) - 3 * PX
    spans = "".join(f'<i class="s43-span s43-sp{k + 1}" style="left:{X(r[4]):.1f}px;width:{X(r[3]) - X(r[4]):.1f}px"></i>'
                    for k, r in enumerate(ROWS))
    b2r = X(ROWS[1][0])
    return f"""<div class="simwrap sim43">
<div class="s43-table"><i class="s43-tbg"></i><div class="s43-head">{heads}</div>{"".join(rows)}<i class="s43-colhl"></i><svg class="s43-tframe" viewBox="0 0 720 340" preserveAspectRatio="none" aria-hidden="true"><path d="M694 1.5H26A24.5 24.5 0 0 0 1.5 26V314A24.5 24.5 0 0 0 26 338.5H694A24.5 24.5 0 0 0 718.5 314V26A24.5 24.5 0 0 0 694 1.5Z"/></svg></div>
<div class="s43-tl">
<div class="s43-ruler"></div>
<div class="s43-lane s43-lb"></div><div class="s43-lane s43-ls">{_wave()}</div>
<span class="s43-tlbl s43-tl1" dir="rtl">{esc(c["tracks"][0])}</span><span class="s43-tlbl s43-tl2" dir="rtl">{esc(c["tracks"][1])}</span>
{spans}
<i class="s43-scan"></i>
{gaps}
<div class="s43-hole" style="left:{hole_l:.1f}px;width:{hole_w:.1f}px"><span class="s43-hlbl" dir="rtl">{esc(c["missing"])}</span></div>
{"".join(blocks)}
<div class="s43-sim" style="left:{hole_l + 22:.1f}px;width:{hole_w - 44:.1f}px">{ico("img")}<i class="s43-bno">{CROSS.format(cls="s43-no")}</i></div>
<div class="s43-acc s43-az" style="left:{hole_l + 30:.1f}px;width:{hole_w - 60:.1f}px">{ico("zoom")}<i class="s43-strike"></i></div>
<div class="s43-acc s43-ad" style="left:{hole_l + 45:.1f}px;width:{X(ROWS[0][0]) - X(ROWS[0][1]):.1f}px">{ico("scr")}<i class="s43-strike"></i></div>
<i class="s43-pin" style="left:{b2r - 40:.1f}px"><b></b></i>
<svg class="s43-entry" style="left:{b2r - 40:.1f}px" viewBox="0 0 40 16" aria-hidden="true"><path d="M2 3v10M2 8H38M38 3v10"/></svg>
<div class="s43-cal" data-focus="2" style="left:{cal_l:.1f}px;width:{3 * PX}px"><svg viewBox="0 0 96 18" preserveAspectRatio="none" aria-hidden="true"><path class="s43-calg" d="M2 -132V2M94 -132V2"/><path d="M2 2v14M2 9H94M94 2v14"/></svg>
<span class="s43-calt" dir="rtl">{esc(c["gap"])}</span></div>
</div>
{rules}
</div>"""


def cues(cfg):
    P, pe = cfg["phr"], cfg["phrEnd"]
    # one per beat: the words fly into the table, the columns fill, the hole is found, the similar clip is
    # rejected; payoff: the first rule arrives
    return [("whoosh_soft", P[0] + 0.95), ("shimmer", P[1] + 1.0), ("glitch_soft", P[2] + 2.4),
            ("glitch_soft", P[3] + 1.45), ("swipe", pe + 0.35)]
