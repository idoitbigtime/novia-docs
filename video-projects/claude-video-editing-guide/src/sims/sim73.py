"""7.3 simulation: an independent critic, round after round, until the score passes 90.
B0 the builder (a silhouette) beside the video it made: its own explanations, its own checklist all ticked,
   while the caption is cut at the frame's edge (red ring)
B1 the builder turns out to be Claude: the same self-check
B2 a separate copy slides out: the independent critic, behind a divider, with an empty tray (built nothing)
B3 the request and frames from each scene fly into the critic's tray; the explanations hit the divider and are refused
B4 the critic answers with a score out of 100 (68, the first round) and a numeric fix for each defect (punch-in)
payoff: the fixed rubric's tags; seven rounds of the same critic (middle rounds are dots, no numbers);
the gauge passes 90 and lands on 96; then the stopping rule.
Beat times come from cfg["phr"] (scene-local)."""
import math

from textlayout import esc
from art import person_svg, ARROW_LEFT

CHECK = '<svg viewBox="0 0 30 30" aria-hidden="true"><path d="M6 15.5l6 6 12-13"/></svg>'
CROSS = '<svg viewBox="0 0 30 30" aria-hidden="true"><path d="M9.5 9.5l11 11"/><path d="M20.5 9.5l-11 11"/></svg>'
STOP = ('<svg class="s73-stop" viewBox="0 0 40 40" aria-hidden="true"><path d="M13.4 3h13.2L37 13.4v13.2L26.6 37H13.4L3 26.6V13.4z"/>'
        '<path d="M13 20h14"/></svg>')
# gauge: a half circle (centre 170,170 r 150 inside its box), 0 at the right end, 100 at the left end
GC, GR = (170, 170), 150


def _gpt(v, R):
    th = math.radians(180 * v / 100)
    return GC[0] + R * math.cos(th), GC[1] - R * math.sin(th)


def _frame(cls, extra=""):
    """A generic 9:16 video frame (presenter, title, caption)."""
    return (f'<div class="s73-fr {cls}"><i class="s73-h"></i><i class="s73-bd"></i><i class="s73-ti"></i>'
            f'<i class="s73-cp"></i>{extra}</div>')


def _card(cls):
    """Claude as an agent: a card with a terminal prompt glyph (no logo)."""
    return f'<div class="s73-card {cls}"><i class="s73-glow"></i><b dir="ltr">&gt;_</b></div>'


def html(cfg):
    c = cfg["sim73"]
    t = []
    for v in (c["stopAt"], c["target"]):
        a, b = _gpt(v, 138), _gpt(v, 162)
        lx, ly = _gpt(v, 190)
        t.append((v, a, b, lx, ly))
    ticks = "".join(f'<path class="s73-tk s73-tk{v}" d="M{a[0]:.1f} {a[1]:.1f} L{b[0]:.1f} {b[1]:.1f}"/>' for v, a, b, _, _ in t)
    tlabels = "".join(f'<span class="s73-tl s73-tl{v}" dir="ltr" style="left:{lx - 30:.1f}px;top:{ly - 17:.1f}px">{v}</span>' for v, _, _, lx, ly in t)
    arc = f"M{GC[0] + GR} {GC[1]} A{GR} {GR} 0 0 0 {GC[0] - GR} {GC[1]}"
    rows = ""
    for i in range(2):
        rows += (f'<div class="s73-row s73-row{i}">{_frame("s73-th s73-dth" + str(i), "<i class=s73-dm></i>")}'
                 f'{ARROW_LEFT.format(cls="s73-arr")}<div class="s73-sl"><i class="s73-rule"></i><i class="s73-knob"></i></div></div>')
    nodes = "".join(f'<i class="s73-nd{" s73-ndx" if k in (0, 6) else ""}" style="left:{300 - 50 * k}px"></i>' for k in range(7))
    tags = [esc(x) for x in c["rubric"]]
    rub = (f'<div class="s73-tagrow">{"".join(f"<span class=s73-tag>{x}</span>" for x in tags[:3])}</div>'
           f'<div class="s73-tagrow">{"".join(f"<span class=s73-tag>{x}</span>" for x in tags[3:])}</div>')
    thumbs = "".join(_frame(f"s73-th s73-in s73-in{i}") for i in range(3))
    r1, r2 = c["rule"]
    return f"""<div class="simwrap sim73">
<div class="s73-builder">
{_frame("s73-vid", '<i class="s73-cut"></i>')}
<svg class="s73-flaw" viewBox="0 0 92 64" aria-hidden="true"><rect x="3" y="3" width="86" height="58" rx="18"/></svg>
<div class="s73-bub"><i></i><i></i><i></i><span class="s73-expl" dir="rtl">{esc(c["explLabel"])}</span><div class="s73-no">{CROSS}</div></div>
<div class="s73-list"><div class="s73-li">{CHECK}<i></i></div><div class="s73-li">{CHECK}<i></i></div><div class="s73-li">{CHECK}<i></i></div></div>
{person_svg("s73-person", "73")}
{_card("s73-me")}
<div class="s73-name s73-mename" dir="rtl">{esc(c["builderName"])}</div>
</div>
<svg class="s73-div" viewBox="0 0 4 360" aria-hidden="true"><path d="M2 2 V358"/></svg>
<div class="s73-tray"></div>
<div class="s73-doc"><i></i><i></i><i></i><span dir="rtl">{esc(c["reqLabel"])}</span></div>
{thumbs}
{_card("s73-ghost s73-gh2")}{_card("s73-ghost s73-gh1")}{_card("s73-cr")}
<div class="s73-name s73-crname" dir="rtl">{esc(c["criticLabel"])}</div>
<div class="s73-gauge" data-focus="4"><svg class="s73-gsvg" viewBox="0 0 340 200" aria-hidden="true">
<defs><linearGradient id="s73gr" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#9d92f0"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs>
<path class="s73-track" d="{arc}"/><path class="s73-fill" d="{arc}"/>{ticks}</svg>{tlabels}
<div class="s73-score" dir="ltr"><span class="s73-nn"><span class="s73-n s73-n1">{c["scoreFrom"]}</span><span class="s73-n s73-n2">{c["scoreTo"]}</span></span><span class="s73-of">/100</span></div>
<div class="s73-pass">{CHECK}</div></div>
<div class="s73-rows">{rows}</div>
<div class="s73-steps"><i class="s73-line"></i><i class="s73-linef"></i>{nodes}
<span class="s73-sv s73-sv1" dir="ltr">{c["scoreFrom"]}</span><span class="s73-sv s73-sv7" dir="ltr">{c["scoreTo"]}</span>
<span class="s73-slbl" dir="rtl">{esc(c["roundsLabel"])}</span></div>
<div class="s73-lbl s73-rublbl" dir="rtl"><i></i><span>{esc(c["rubricLabel"])}</span></div>
<div class="s73-rub" dir="rtl">{rub}</div>
<div class="s73-rulecard" dir="rtl">{STOP}<div class="s73-rtx"><p>{esc(r1)}</p><p>{esc(r2)}</p></div></div>
</div>"""


def cues(cfg):
    P, pe = cfg["phr"], cfg["phrEnd"]
    return [("tick", P[0] + 0.9), ("glitch_soft", P[1] + 0.08), ("whoosh_soft", P[2] + 0.22),
            ("glitch_soft", P[3] + 1.62), ("pop", P[4] + 0.12), ("shimmer", pe + 3.45), ("swipe", pe + 4.1)]
