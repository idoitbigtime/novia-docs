"""Scene content and HTML builders. All texts come from the guide (see script/)."""
import importlib
import json
import pathlib

from textlayout import esc, kinetic_html, parse_marked, prompt_html, word_times

ROOT = pathlib.Path(__file__).resolve().parent.parent
PROMPTS = json.loads((ROOT / "data" / "prompts.json").read_text(encoding="utf-8"))
SECTION_ORDER = ["קלט", "כיוון", "בנייה", "מלכודות", "התחלה"]

# reading rhythm (no narration): seconds per word
STEP_TITLE, STEP_EXP, STEP_FACT, STEP_META, STEP_TIP = 0.13, 0.2, 0.15, 0.13, 0.16


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


def auto_times(cfg):
    """Fill in scene-local times that were not set by hand, from text lengths."""
    c = dict(cfg)
    c.setdefault("tTitle", 0.3)
    c.setdefault("tExp", round(c["tTitle"] + _dur(c["title"], STEP_TITLE, 0.2) + 0.3, 2))
    c.setdefault("tDock", round(c["tExp"] + _dur(c["exp"], STEP_EXP, 0.32) + c.get("readHold", 0.85), 2))
    c.setdefault("tStage", round(c["tDock"] + 0.35, 2))
    t = c["tStage"] + c.get("simDur", 7.2)
    f = c.get("fact")
    if f:
        f = dict(f)
        f.setdefault("t", round(t, 2))
        end = f["t"] + 0.6
        if f.get("line"):
            end = f["t"] + 0.45 + _dur(f["line"], STEP_FACT, 0.25)
        if f.get("meta"):
            f.setdefault("tMeta", round(end + 0.25, 2))
            end = f["tMeta"] + _dur(f["meta"], STEP_META, 0.2)
        c["fact"] = f
        t = end + c.get("factHold", 1.15)
    if c.get("prompt") is not None:
        c.setdefault("tPrompt", round(t + 0.1, 2))
        if "tPromptEnd" not in c:
            if "tTip" in c and c.get("tip"):
                c["tPromptEnd"] = c["tTip"]
            else:
                n = len(prompt_text(c))
                holds = sum(h[1] for h in c.get("hls", []))
                pd = c.get("promptDur") or min(9.6, max(5.5, 2.4 + n / 1000 * 1.15 + holds))
                c["tPromptEnd"] = round(c["tPrompt"] + pd, 2)
        t = c["tPromptEnd"]
    if c.get("tip"):
        c.setdefault("tTip", round(t, 2))
        t = c["tTip"] + 0.4 + _dur(c["tip"], STEP_TIP, 0.25) + c.get("tipHold", 1.05)
    c.setdefault("D", round(t + 0.45, 2))
    return c


def topic_scene(cfg):
    """Return (inner_html, js_cfg, cues, cfg) for a standard topic scene. Times are scene-local."""
    cfg = auto_times(cfg)
    title, _, _ = kinetic_html(cfg["title"], t0=cfg["tTitle"], step=STEP_TITLE, pause=0.2)
    exp, _, _ = kinetic_html(cfg["exp"], t0=cfg["tExp"], step=STEP_EXP, pause=0.32)
    simmod = importlib.import_module("sims." + cfg["sim"])
    sim = simmod.html(cfg)

    fact = ""
    f = cfg.get("fact")
    if f:
        parts = []
        if f.get("pill"):
            parts.append(f'<span class="pill">{esc(f["pill"])}</span>')
        if f.get("line"):
            line, _, _ = kinetic_html(f["line"], t0=f["t"] + 0.45, step=STEP_FACT, pause=0.25)
            parts.append(f'<p class="factline kin" dir="rtl">{line}</p>')
        if f.get("meta"):
            m, _, _ = kinetic_html(f["meta"], t0=f["tMeta"], step=STEP_META, pause=0.2)
            parts.append(f'<p class="metaline kin" dir="rtl">{m}</p>')
        fact = f'<div class="factbox">{"".join(parts)}</div>'

    card = ""
    hl_ids = []
    if cfg.get("prompt") is not None:
        p = cfg["prompt"]
        hl_subs = [h[0] for h in cfg.get("hls", [])]
        body, sections, hl_ids = prompt_html(prompt_text(cfg), hl_subs)
        tabs = ""
        if sections:
            tabs = '<div class="pc-tabs">' + "".join(
                f'<span class="tab" data-sec="{s}">{s}<i class="tul"></i></span>' for s in SECTION_ORDER if s in sections
            ) + "</div>"
        pvp_top = "" if sections else ' style="top:118px"'
        title_txt = cfg.get("promptTitle", "הפרומפט המוכן")
        card = (f'<div class="pcard"><div class="pc-head"><span class="pc-title"><i></i>{esc(title_txt)}</span>'
                f'<span class="pc-num" dir="ltr"><b>{p}</b> / 21</span></div>{tabs}'
                f'<div class="pvp"{pvp_top}><div class="pct" dir="rtl">{body}</div></div></div>')

    tipbox = ""
    if cfg.get("tip"):
        tip, _, _ = kinetic_html(cfg["tip"], t0=cfg["tTip"] + 0.4, step=STEP_TIP, pause=0.25)
        tipbox = (f'<div class="tipwrap"><div class="tipcard"><div class="tip-label"><i></i>{esc(cfg.get("tipLabel", "טיפ"))}</div>'
                  f'<p class="tip-text kin" dir="rtl">{tip}</p></div></div>')

    inner = f"""<div class="hdr" dir="rtl"><span class="hdr-ch">{esc(cfg["chapter"])}</span><span class="hdr-num" dir="ltr">{esc(cfg["num"])}</span></div>
<div class="scam">
<div class="main"><h2 class="ttl kin" dir="rtl">{title}</h2><p class="exp kin" dir="rtl">{exp}</p></div>
<div class="stage"><div class="simtag" dir="rtl"><i></i><span>הדמיה</span></div>{sim}</div>
{fact}
{card}
{tipbox}
</div>"""

    js_cfg = {
        "id": cfg["id"], "sim": cfg["sim"], "D": cfg["D"], "tStage": cfg["tStage"], "tDock": cfg["tDock"],
        "tFact": f["t"] if f else None,
        "tPrompt": cfg.get("tPrompt") if cfg.get("prompt") is not None else None,
        "tPromptEnd": cfg.get("tPromptEnd"),
        "tTip": cfg.get("tTip") if cfg.get("tip") else None,
        "expZoom": cfg.get("expZoom", 0.1), "simDur": cfg.get("simDur", 7.2),
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


def chapter_scene(cfg):
    """Chapter title card: big outlined number, kinetic title + subtitle, chapter dots."""
    c = dict(cfg)
    c.setdefault("tTitle", 0.45)
    title, tend, _ = kinetic_html(c["title"], t0=c["tTitle"], step=0.16, pause=0.2)
    sub, send, _ = kinetic_html(c["sub"], t0=tend + 0.35, step=0.16, pause=0.25)
    end = send
    tag = ""
    if c.get("tag"):
        tg, tgend, _ = kinetic_html(c["tag"], t0=send + 0.3, step=0.12, pause=0.2)
        tag = f'<p class="ch-tag kin" dir="rtl">{tg}</p>'
        end = tgend
    c.setdefault("D", round(end + c.get("hold", 1.3), 2))
    dots = "".join(f'<i class="ch-dot{" on" if i == c["n"] else ""}"></i>' for i in range(1, 9))
    inner = f"""<div class="chap">
<div class="ch-k" dir="rtl">פרק</div>
<div class="ch-n" dir="ltr">{c["n"]}</div>
<h2 class="ch-title kin" dir="rtl">{title}</h2>
<i class="ch-line"></i>
<p class="ch-sub kin" dir="rtl">{sub}</p>
{tag}
<div class="ch-dots" dir="rtl">{dots}</div>
</div>"""
    js = {"id": c["id"], "type": "chapter", "D": c["D"]}
    cues = [("whoosh_soft", 0.0), ("shimmer", 0.35)]
    return inner, js, cues, c
