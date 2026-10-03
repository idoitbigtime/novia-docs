"""2.2 simulation: transcription fixes (list + inside the phone), white pill style, kinetic style.
Sim times in cfg["sim22"] are relative to the stage entrance (tStage)."""
from textlayout import esc, kinetic_html
from art import person_svg, ARROW_LEFT


def html(cfg):
    c = cfg["sim22"]
    T0 = cfg["tStage"]
    fixes, caps = [], []
    for i, (bad, good) in enumerate(c["fixes"]):
        fixes.append(
            f'<div class="s22-fix"><span class="s22-bad">{esc(bad)}<i class="s22-strike"></i></span>'
            f'{ARROW_LEFT.format(cls="s22-arrow")}<span class="s22-good">{esc(good)}</span></div>'
        )
        caps.append(
            f'<div class="s22-cap" dir="rtl"><span class="s22-capbad">{esc(bad)}<i class="s22-capstrike"></i></span>'
            f'<span class="s22-capgood">{esc(good)}</span></div>'
        )
    pills = "".join(f'<span class="s22-pill" id="t22-p{i + 1}">{esc(p)}</span>' for i, p in enumerate(c["pills"]))
    kin, _, _ = kinetic_html(c["kin"], t0=T0 + c["kin0"] + 0.2, step=c["kinStep"], pause=0.2)
    return f"""<div class="simwrap sim22">
<div class="s22-phone"><div class="s22-screen"><div class="s22-lamp"></div><div class="s22-win"><i></i></div>
{person_svg("s22-person", "22")}
<div class="s22-caps">{"".join(caps)}</div>
<div class="s22-pillrow">{pills}</div>
<div class="s22-kinrow kin" dir="rtl">{kin}</div>
</div></div>
<div class="s22-fixes">{"".join(fixes)}</div>
<div class="s22-label s22-l1"><i></i><span>{esc(c["label1"])}</span></div>
<div class="s22-label s22-l2"><i></i><span>{esc(c["label2"])}</span></div>
</div>"""


def pill_times(c):
    """[(tin, tout)] relative to the stage: consecutive, no gap, no overlap (prompt 2)."""
    out = []
    t = c["pills0"]
    for _ in c["pills"]:
        out.append((round(t, 3), round(t + c["pillStep"], 3)))
        t += c["pillStep"]
    return out


def cues(cfg):
    c = cfg["sim22"]
    T0 = cfg["tStage"]
    out = [("tick", T0 + c["fix0"] + i * c["fixStep"] + 0.62) for i in range(len(c["fixes"]))]
    out += [("tick", T0 + a) for a, _ in pill_times(c)]
    return out
