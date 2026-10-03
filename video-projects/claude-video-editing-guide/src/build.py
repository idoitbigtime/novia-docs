#!/usr/bin/env python3
"""Generate the HyperFrames composition(s) from the scene data.

usage:
  python3 src/build.py full                 -> index.html (1080x1920, whole video)
  python3 src/build.py window A B [name]    -> variants/<name>.html (540x960, seconds A..B)

The draft variant scales the same 1080x1920 stage by 0.5 and plays the master timeline
from A to B (the guide's "temporary short low-res copy of the composition")."""
import json
import pathlib
import sys

import scenes as SC

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"

# Scene order. Start times are computed sequentially from each scene's duration, so a scene
# that is not built yet (no sim module) still reserves its time and later scenes keep their place.
import importlib

ORDER = ["hook", "ch1",
         "c2", "t21", "t22", "t23", "t24", "t25", "t26",
         "c3", "t31", "t32", "t33", "t34", "t35", "t36", "t37",
         "c4", "t41", "t42", "t43",
         "c5", "t51", "t52",
         "c6", "t61", "t62",
         "c7", "t71", "t72", "t73",
         "summary"]
PLACEHOLDER_D = {"hook": 10.0, "ch1": 45.0, "summary": 36.0}


def load_cfg(name):
    try:
        return importlib.import_module("content." + name).CFG
    except ModuleNotFoundError:
        return None


def scene_builder(c):
    t = c.get("type", "topic")
    return {"chapter": SC.chapter_scene, "topic": SC.topic_scene}.get(t) or getattr(SC, t + "_scene")


def is_buildable(c):
    if c is None:
        return False
    if c.get("type", "topic") == "topic":
        return (SRC / "sims" / (c["sim"] + ".py")).exists()
    return True


def plan():
    """[(id, cfg_or_None, start, duration, buildable)] for the whole video."""
    out, t = [], 0.0
    for sid in ORDER:
        c = load_cfg(sid)
        if c is None:
            d = PLACEHOLDER_D.get(sid, 6.0)
        elif c.get("type", "topic") == "topic":
            d = SC.auto_times(c)["D"]
        else:
            d = c.get("D") or scene_builder(c)(c)[3]["D"]
        out.append((sid, c, round(t, 3), d, is_buildable(c)))
        t = round(t + d, 3)
    return out


def read(p):
    return (SRC / p).read_text(encoding="utf-8")


def build(window=None, name="index", only=None, scale_override=None):
    css = [read("fonts.css"), read("style.css")] + [p.read_text(encoding="utf-8") for p in sorted((SRC / "sims").glob("*.css"))]
    js = [read("engine.js")] + [p.read_text(encoding="utf-8") for p in sorted((SRC / "sims").glob("*.js"))]

    clips, cfgs, cues = [], [], []
    total = 0.0
    full = plan()
    total = full[-1][2] + full[-1][3]
    timeline = [(sid, c, st) for sid, c, st, d, ok in full if ok]
    if only:
        timeline = [(sid, load_cfg(sid), 0.0) for sid in only]
        total = 0.0
    for sid, scfg, start in timeline:
        inner, js_cfg, sc_cues, scfg = scene_builder(scfg)(scfg)
        dur = scfg["D"]
        if only:
            total = max(total, start + dur)
        if window:
            a, b = window
            s0, s1 = max(start, a), min(start + dur, b)
            if s1 <= s0:
                continue
            cstart, cdur = s0 - a, s1 - s0
        else:
            cstart, cdur = start, dur
        clips.append(f'<div id="sc-{sid}" class="clip scene" data-start="{cstart:.3f}" data-duration="{cdur:.3f}" '
                     f'data-track-index="1">{inner}</div>')
        js_cfg["S"] = start
        cfgs.append(js_cfg)
        cues += [{"sfx": n, "t": round(start + t, 3), "scene": sid} for n, t in sc_cues]

    if window:
        W, H, scale, dur = 540, 960, 0.5, window[1] - window[0]
    else:
        W, H, scale, dur = 1080, 1920, 1.0, total
    if scale_override:
        scale = scale_override
        W, H = int(1080 * scale), int(1920 * scale)

    boot = f"""
(function () {{
  const CFGS = {json.dumps(cfgs, ensure_ascii=False)};
  const WINDOW = {json.dumps(list(window) if window else None)};
  const fontsReady = Promise.all([
    document.fonts.load('400 38px Rubik', 'אבג abc 123'),
    document.fonts.load('800 62px Rubik', 'אבג abc'),
    document.fonts.load('900 40px Rubik', 'אבג'),
    document.fonts.load('600 27px "IBM Plex Mono"', 'abc 123'),
    document.fonts.load('400 27px "IBM Plex Sans Hebrew"', 'אבג'),
  ]).then(() => document.fonts.ready);
  fontsReady.then(() => {{
    const stage = document.querySelector('.stagewrap');
    const cam = document.getElementById('cam');
    const master = gsap.timeline({{ paused: true }});
    // slow background drift for the whole video (the "camera that never stops")
    const TOT = {total:.3f};
    master.fromTo('#bg .g1', {{ x: 0, y: 0 }}, {{ x: 260, y: 180, duration: TOT, ease: 'none', immediateRender: false }}, 0);
    master.fromTo('#bg .g2', {{ x: 0, y: 0 }}, {{ x: -300, y: -260, duration: TOT, ease: 'none', immediateRender: false }}, 0);
    for (const cfg of CFGS) {{
      const scene = document.getElementById('sc-' + cfg.id);
      const scam = scene.querySelector('.scam') || cam;
      if (cfg.type === 'chapter') window.ENG.chapter(master, {{ stage, cam: scam, scene }}, cfg);
      else window.ENG.topic(master, {{ stage, cam: scam, scene }}, cfg);
    }}
    let root = master;
    if (WINDOW) {{
      root = gsap.timeline({{ paused: true }});
      root.add(master.tweenFromTo(WINDOW[0], WINDOW[1], {{ duration: WINDOW[1] - WINDOW[0], ease: 'none' }}), 0);
    }}
    window.__ENG_DEBUG.ready = true;
    window.__timelines['main'] = root;
  }});
}})();
"""
    html = f"""<!doctype html>
<html lang="he">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width={W}, height={H}" />
<title>עריכת וידאו עם Claude</title>
<script src="vendor/gsap.min.js"></script>
<style>
{chr(10).join(css)}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{dur:.3f}" data-fps="30" data-width="{W}" data-height="{H}">
<div class="stagewrap" style="transform: scale({scale});">
<div id="bg"><div class="glow g1"></div><div class="glow g2"></div><div class="grain"></div><div class="vig"></div></div>
<div id="cam">
{chr(10).join(clips)}
</div>
</div>
</div>
<script>
{chr(10).join(js)}
{boot}
</script>
</body>
</html>
"""
    out = ROOT / (f"variants/{name}.html" if (window or only) else "index.html")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    (ROOT / "audio").mkdir(exist_ok=True)
    (ROOT / "audio" / f"cues-{name}.json").write_text(json.dumps({"window": window, "total": total, "cues": cues}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {out} ({len(html)} bytes), scenes={len(clips)}, duration={dur:.2f}s")


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a or a[0] == "full":
        build()
    elif a[0] == "window":
        build((float(a[1]), float(a[2])), a[3] if len(a) > 3 else "draft")
    elif a[0] == "window-scene":
        # python3 build.py window-scene t22 13 28 draft  -> window relative to the scene start
        st = {sid: st for sid, c, st, d, ok in plan()}[a[1]]
        build((st + float(a[2]), st + float(a[3])), a[4] if len(a) > 4 else "draft")
    elif a[0] == "plan":
        for sid, c, st, d, ok in plan():
            print(f"{sid:8s} start={st:7.2f}  dur={d:6.2f}  {'built' if ok else '-'}")
        p = plan(); print("TOTAL", round(p[-1][2] + p[-1][3], 2))
    elif a[0] == "scene":
        # python3 build.py scene t21 [half]  -> variants/scene-t21.html, the scene alone from t=0
        build(None, "scene-" + a[1], only=[a[1]], scale_override=0.5 if "half" in a[2:] else None)
