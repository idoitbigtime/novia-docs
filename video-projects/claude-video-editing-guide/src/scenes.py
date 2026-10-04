"""Scene content and HTML builders. All texts come from the guide (see script/)."""
import importlib
import json
import pathlib

from textlayout import esc, kinetic_html, parse_marked, phrase_times, prompt_html, word_times

ROOT = pathlib.Path(__file__).resolve().parent.parent
PROMPTS = json.loads((ROOT / "data" / "prompts.json").read_text(encoding="utf-8"))
SECTION_ORDER = ["קלט", "כיוון", "בנייה", "מלכודות", "התחלה"]
# line-art light bulb for the tip card (its strokes are drawn on by the engine)
TIP_ICON = ('<svg class="tip-ico" viewBox="0 0 48 48" aria-hidden="true">'
            '<path class="dr" d="M17 30c-3.4-2.6-5.5-6.5-5.5-10.8C11.5 12.2 17.1 6.5 24 6.5s12.5 5.7 12.5 12.7c0 4.3-2.1 8.2-5.5 10.8v4.5H17z"/>'
            '<path class="dr" d="M18.5 39.5h11M20.5 44h7"/>'
            '<path class="dr" d="M24 34.5V24m-4-3.5 4 3.5 4-3.5"/></svg>')

# reading rhythm (no narration): seconds per word
STEP_TITLE, STEP_EXP, STEP_FACT, STEP_META, STEP_TIP = 0.13, 0.2, 0.12, 0.13, 0.16
PAUSE_FACT = 0.2


def _dur(text, step, pause):
    return word_times(parse_marked(text), step, pause)[1]


def prompt_text(cfg):
    """Verbatim prompt text, or an excerpt (whole lines that contain the given substrings)."""
    txt = PROMPTS[str(cfg["prompt"])]
    ex = cfg.get("promptExcerpt")
    if not ex:
        return txt
    lines = [ln for ln in txt.split("\n") if any(s in ln for s in ex)]
    if len(lines) != len(ex):
        raise ValueError(f"excerpt lines not found for prompt {cfg['prompt']}: {ex}")
    return "\n".join(lines)


def _lift_html(body, hid):
    """Inner HTML of the key line (same markup as in the card) for its lifted copy."""
    import re as _re
    m = _re.search(r'<div class="pl" dir="rtl" data-hl="' + hid + r'"><i class="hlbg"></i>(.*?)</div>\n', body + "\n", _re.S)
    return '<i class="hlbg"></i>' + (m.group(1) if m else "")


def auto_times(cfg):
    """Fill in scene-local times that were not set by hand, from text lengths.
    Flow: title -> the illustration enters -> the explanation arrives phrase by phrase while
    the illustration shows each phrase -> payoff -> fact over the dimmed illustration ->
    prompt card -> tip."""
    c = dict(cfg)
    c.setdefault("tTitle", 0.3)
    c.setdefault("tStage", round(c["tTitle"] + _dur(c["title"], STEP_TITLE, 0.2) + 0.1, 2))
    c.setdefault("tExp", round(c["tStage"] + 0.6, 2))
    _, _, _, starts, pend = phrase_times(c["exp"], c["tExp"])
    c["phr"], c["phrEnd"] = starts, pend
    c.setdefault("tSimEnd", round(pend + c.get("payoff", 4.5), 2))
    c["simDur"] = round(c["tSimEnd"] - c["tStage"], 2)
    t = c["tSimEnd"]
    f = c.get("fact")
    if f:
        f = dict(f)
        f.setdefault("t", round(t, 2))
        # the fact screen is complete when its last word has landed; it then holds factHold
        # seconds before it fades (the fade starts 0.3 s before the next beat)
        done = f["t"] + 0.6
        end = f["t"] + 0.45
        if f.get("line"):
            end = f["t"] + 0.45 + _dur(f["line"], STEP_FACT, PAUSE_FACT)
            done = end + 0.1
        if f.get("meta"):
            f.setdefault("tMeta", round(end, 2))
            done = f["tMeta"] + 0.03 * (len(f["meta"].split()) - 1) + 0.35
        c["fact"] = f
        t = done + c.get("factHold", 1.8 if f.get("meta") else 1.6) + 0.2
    if c.get("prompt") is not None:
        c.setdefault("tPrompt", round(t + 0.1, 2))
        if "tPromptEnd" not in c:
            if "tTip" in c and c.get("tip"):
                c["tPromptEnd"] = c["tTip"]
            else:
                n = len(prompt_text(c))
                holds = sum(h[1] for h in c.get("hls", []))
                pd = c.get("promptDur") or min(9.2, max(5.5, 2.2 + n / 1000 * 1.15 + holds))
                c["tPromptEnd"] = round(c["tPrompt"] + pd, 2)
        t = c["tPromptEnd"]
    if c.get("tip"):
        c.setdefault("tTip", round(t, 2))
        t = c["tTip"] + 0.4 + _dur(c["tip"], STEP_TIP, 0.25) + c.get("tipHold", 0.7)
    c.setdefault("D", round(t + 0.45, 2))
    return c


def topic_scene(cfg):
    """Return (inner_html, js_cfg, cues, cfg) for a standard topic scene. Times are scene-local."""
    cfg = auto_times(cfg)
    title, _, _ = kinetic_html(cfg["title"], t0=cfg["tTitle"], step=STEP_TITLE, pause=0.2)
    clean, etimes, eidx, _, eend = phrase_times(cfg["exp"], cfg["tExp"])
    exp, _, _ = kinetic_html(clean, times=etimes, end=eend, phrases=eidx)
    simmod = importlib.import_module("sims." + cfg["sim"])
    sim = simmod.html(cfg)

    fact = ""
    f = cfg.get("fact")
    if f:
        parts = []
        if f.get("pill"):
            parts.append(f'<span class="pill">{esc(f["pill"])}</span>')
        if f.get("line"):
            line, _, _ = kinetic_html(f["line"], t0=f["t"] + 0.45, step=STEP_FACT, pause=PAUSE_FACT)
            parts.append(f'<p class="factline kin" dir="rtl">{line}</p>')
        if f.get("meta"):
            m, _, _ = kinetic_html(f["meta"], t0=f["tMeta"], step=0.03, pause=0.0)
            parts.append(f'<p class="metaline kin" dir="rtl">{m}</p>')
        fact = f'<div class="factbox"><div class="factin"><i class="fscrim"></i>{"".join(parts)}</div></div>'

    card = ""
    hl_ids = []
    if cfg.get("prompt") is not None:
        p = cfg["prompt"]
        hl_subs = [h[0] for h in cfg.get("hls", [])]
        body, sections, hl_ids = prompt_html(prompt_text(cfg), hl_subs)
        lifts = "".join(f'<div class="pl-lift" dir="rtl" data-for="{hid}">{_lift_html(body, hid)}</div>' for hid in hl_ids)
        tabs = ""
        if len(sections) > 1:
            tabs = '<div class="pc-tabs">' + "".join(
                f'<span class="tab" data-sec="{s}">{s}<i class="tul"></i></span>' for s in SECTION_ORDER if s in sections
            ) + '<i class="tabul"></i></div>'
        pvp_top = "" if len(sections) > 1 else ' style="top:110px"'
        title_txt = cfg.get("promptTitle", "הפרומפט המוכן")
        card = (f'<div class="pcard"><div class="pc-head"><span class="pc-title"><i></i>{esc(title_txt)}</span>'
                f'<span class="pc-num" dir="ltr"><b>{p}</b> / 21</span></div>{tabs}'
                f'<div class="pvp"{pvp_top}><div class="pct" dir="rtl"><div class="pbody">{body}</div></div></div></div>'
                f'<div class="plift">{lifts}</div>')

    tipbox = ""
    if cfg.get("tip"):
        tip, _, _ = kinetic_html(cfg["tip"], t0=cfg["tTip"] + 0.4, step=STEP_TIP, pause=0.25)
        tipbox = (f'<div class="tipwrap"><div class="tipcard"><div class="tip-label">{TIP_ICON}{esc(cfg.get("tipLabel", "טיפ"))}</div>'
                  f'<p class="tip-text kin" dir="rtl">{tip}</p></div></div>')

    inner = f"""<div class="hdr" dir="rtl"><span class="hdr-ch">{esc(cfg["chapter"])}</span><span class="hdr-num" dir="ltr">{esc(cfg["num"])}</span></div>
<div class="scam">
<div class="main"><h2 class="ttl kin" dir="rtl">{title}</h2><p class="exp kin" dir="rtl">{exp}</p></div>
<div class="stage"><div class="simtag" dir="rtl"><i></i><span>הדמיה</span></div><div class="stclip"><div class="stcam"><div class="stfit">{sim}</div></div></div></div>
{fact}
{card}
{tipbox}
</div>"""

    js_cfg = {
        "id": cfg["id"], "sim": cfg["sim"], "D": cfg["D"], "tStage": cfg["tStage"], "tExp": cfg["tExp"],
        "phr": cfg["phr"], "phrEnd": cfg["phrEnd"], "tSimEnd": cfg["tSimEnd"],
        "tFact": f["t"] if f else None,
        "tPrompt": cfg.get("tPrompt") if cfg.get("prompt") is not None else None,
        "tPromptEnd": cfg.get("tPromptEnd"),
        "tTip": cfg.get("tTip") if cfg.get("tip") else None,
        "expZoom": cfg.get("expZoom", 0.07), "simDur": cfg["simDur"],
        "hls": [{"id": hid, "hold": h[1], "zoom": h[2]} for hid, h in zip(hl_ids, cfg.get("hls", []))],
    }
    if cfg["sim"] in cfg:
        js_cfg[cfg["sim"]] = cfg[cfg["sim"]]
    cues = [("whoosh_soft", 0.0), ("swipe", cfg["tStage"])]
    if js_cfg["tPrompt"] is not None:
        cues.append(("whoosh_soft", cfg["tPrompt"]))
    if js_cfg["tTip"] is not None:
        cues.append(("pop", cfg["tTip"]))
    if f:
        cues.append(("pop", f["t"]))
    if hasattr(simmod, "cues"):
        cues += list(simmod.cues(cfg))
    return inner, js_cfg, cues, cfg


def _ch_motif(n):
    """180 px line-art motif of chapter n (lavender strokes, no text). Strokes with class "dr" draw
    themselves on; "fl" dots fade in; the "mo-*" parts move during the hold (E.chapter)."""
    dots3 = lambda y: "".join(f'<circle class="fl" cx="{x}" cy="{y}" r="3.4"/>' for x in (22, 34, 46))
    if n == 3:
        # a wireframe cube in CSS 3D that turns slowly
        faces = "".join(f'<i class="mo-face{i}"></i>' for i in range(6))
        return f'<div class="ch-mo ch-mo3"><div class="mo-in"><div class="mo-tilt"><div class="mo-cube">{faces}</div></div></div></div>'
    if n == 1:      # a terminal and a folder (the two tools and the one folder)
        body = ('<rect class="dr" x="8" y="18" width="138" height="104" rx="12"/><path class="dr" d="M8 42h138"/>' + dots3(30)
                + '<path class="dr" d="M26 62l14 12-14 12"/><path class="dr mo-cur" d="M50 88h22"/>'
                '<path class="dr mo-solid" d="M84 104h30l10 11h48v55H84z"/><path class="dr" d="M84 128h88"/>')
    elif n == 2:    # a waveform with a playhead
        hs = (26, 48, 80, 38, 108, 62, 132, 54, 92, 40, 70, 30)
        body = "".join(f'<path class="dr mo-bar" d="M{18 + i * 13} {90 - h / 2:g}v{h}"/>' for i, h in enumerate(hs))
        body += '<path class="mo-ph" d="M8 14v152"/>'
    elif n == 4:    # a film frame with a play mark
        holes = "".join(f'<rect class="dr" x="{22 + i * 25}" y="{y}" width="11" height="10" rx="2"/>' for y in (37, 133) for i in range(6))
        body = ('<rect class="dr" x="12" y="30" width="156" height="120" rx="10"/><path class="dr" d="M12 54h156M12 126h156"/>'
                + holes + '<path class="dr mo-play" d="M78 70l32 20-32 20z"/>')
    elif n == 5:    # a plug that connects to a socket
        body = ('<rect class="dr" x="46" y="10" width="88" height="46" rx="12"/><path class="dr" d="M76 25v16M104 25v16"/>'
                '<g class="mo-plug"><path class="dr" d="M76 66v18M104 66v18"/><rect class="dr" x="56" y="84" width="68" height="44" rx="12"/>'
                '<path class="dr" d="M90 128v12c0 14-18 18-18 34"/></g><circle class="mo-ring" cx="90" cy="48" r="26"/>')
    elif n == 6:    # a browser window: one line gets blurred
        body = ('<defs><filter id="chmo6b" x="-10%" y="-300%" width="120%" height="700%"><feGaussianBlur stdDeviation="3"/></filter></defs>'
                '<rect class="dr" x="8" y="20" width="164" height="140" rx="12"/><path class="dr" d="M8 44h164"/>' + dots3(32)
                + '<path class="dr" d="M152 68h-110M152 90h-76M152 136h-94"/>'
                '<path class="dr mo-sharp" d="M152 113h-118"/><path class="mo-blur" d="M152 113h-118" filter="url(#chmo6b)"/>'
                '<path class="mo-scan" d="M16 48h148"/>')
    elif n == 7:    # two progress bars: the draft is done long before the full render
        body = ('<rect class="dr" x="12" y="52" width="134" height="28" rx="14"/><rect class="dr" x="12" y="104" width="134" height="28" rx="14"/>'
                '<rect class="mo-f mo-f1" x="17" y="57" width="124" height="18" rx="9"/><rect class="mo-f mo-f2" x="17" y="109" width="124" height="18" rx="9"/>'
                '<path class="mo-ck" d="M152 118l7 7 15-16"/>')
    else:           # a checklist (right to left)
        body = "".join(f'<rect class="dr" x="136" y="{30 + i * 48}" width="30" height="30" rx="7"/><path class="dr" d="M120 {45 + i * 48}h-{w}"/>'
                       f'<path class="mo-ck" d="M142 {45 + i * 48}l6 6 12-13"/>' for i, w in enumerate((104, 84, 96)))
    return f'<svg class="ch-mo" viewBox="0 0 180 180" aria-hidden="true">{body}</svg>'


def chapter_scene(cfg):
    """Chapter title card. The number, its rings, the kicker and the dots are on screen from the first
    frame; the title follows at 0.1 s, the subtitle (and the tag) only after the title, and a line-art
    motif of the chapter draws itself beside the number. The hold after the last line scales with the
    number of words on the card (cfg extraHold adds to it)."""
    import re
    from textlayout import PUNCT_ONLY, group_times

    def last_t(h):
        v = re.findall(r'class="w[^"]*" dir="\w+" data-t="([\d.]+)"', h)
        return max(float(x) for x in v) if v else 0.0

    def words(s):
        return len([t for t, _, _ in parse_marked(s) if not PUNCT_ONLY.match(t)]) if s else 0

    c = dict(cfg)
    c.setdefault("tTitle", 0.1)
    title, _, _ = kinetic_html(c["title"], t0=c["tTitle"], step=0.16, pause=0.2)
    t_line = last_t(title)
    lw = t_line
    sub = tag = ""
    if c.get("sub"):
        # the subtitle starts once the title has landed and arrives phrase by phrase
        s0 = round(max(0.62, t_line + 0.38), 2)
        gt, gend = group_times(parse_marked(c["sub"]), gstep=0.42)
        sub, _, _ = kinetic_html(c["sub"], times=[s0 + x for x in gt], end=s0 + gend)
        lw = last_t(sub)
    if c.get("tag"):
        tg, _, _ = kinetic_html(c["tag"], t0=round(lw + 0.45, 2), step=0.12, pause=0.2)
        tag = f'<p class="ch-tag kin" dir="rtl">{tg}</p>'
        lw = last_t(tg)
    # how long the last line stays fully readable: it scales with the words on the card
    if c.get("tag"):
        hold = 1.0 + 0.11 * words(c["tag"]) + 0.05 * words(c["sub"])
    elif c.get("sub"):
        hold = 1.0 + 0.11 * words(c["sub"])
    else:
        hold = 1.8
    if c.get("sub"):
        hold = min(3.3, max(2.6, hold))
    hold += c.get("extraHold", 0.0)
    # last word fully visible after 0.22 s; the 0.22 s exit dims it from D - 0.15
    c.setdefault("D", round(lw + 0.22 + hold + 0.15, 2))
    dots = "".join(f'<i class="ch-dot{" on" if i == c["n"] else ""}"></i>' for i in range(1, 9))
    inner = f"""<div class="chap"><div class="ch-cam">
<div class="ch-k" dir="rtl">פרק</div>
<i class="ch-ring"></i><i class="ch-ring ch-ring2"></i>
{_ch_motif(c["n"])}
<div class="ch-n" dir="ltr">{c["n"]}</div>
<h2 class="ch-title kin" dir="rtl"><span class="ch-tin">{title}</span></h2>
<i class="ch-line"></i>
<p class="ch-sub kin" dir="rtl">{sub}</p>
{tag}
<div class="ch-dots" dir="rtl">{dots}</div>
</div></div>"""
    js = {"id": c["id"], "type": "chapter", "D": c["D"], "n": c["n"],
          "T": {"line": round(t_line + 0.12, 2), "lw": round(lw, 2)}}
    cues = [("whoosh_soft", 0.0), ("shimmer", 0.15)]
    return inner, js, cues, c

def custom_scene(cfg):
    """A scene built entirely by its own module (sims/<sim>.py: scene(cfg) -> (inner, js_cfg, cues, cfg))."""
    mod = importlib.import_module("sims." + cfg["sim"])
    inner, js, cues, c = mod.scene(dict(cfg))
    js.update({"id": cfg["id"], "type": "custom", "sim": cfg["sim"], "D": c["D"]})
    return inner, js, cues, c
