#!/usr/bin/env python3
"""The public watch page: the final video (HLS segments in netlify-site/v) with every chapter and
topic as an expandable entry (what you see, the explanation, the fact, the tip, the ready prompt
and the guide's links), plus the community invites.
usage: python3 tools/make_site.py   -> netlify-site/index.html
Times come from build.plan(), the same numbers the video was rendered from."""
import html
import importlib
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
import build  # noqa: E402
import scenes as SC  # noqa: E402
from textlayout import _inline_text, prompt_html  # noqa: E402

OUT = ROOT / "netlify-site" / "index.html"
SITE = "https://claude-video-editing-guide.netlify.app"
TPL = ROOT / "tools" / "site_template.html"
PLAYLIST = ROOT / "watch" / "v" / "index.m3u8"

# community invites (filled in when the links are known; an empty value hides that button)
COMMUNITY = {
    "whatsapp": "https://chat.whatsapp.com/DuufM1imt8NEfeP4TpcZu0",
    "facebook": "https://www.facebook.com/share/g/1CsyuSnfek/",
}

CHAPTERS = {0: "פתיחה", 1: "ככה זה עובד", 2: "עריכה בסיסית", 3: "אפקטים בתלת ממד", 4: "בירולים",
            5: "חיבורים: Higgsfield ו-fal", 6: "הקלטות מסך", 7: "חוסכים שעות של רינדורים", 8: "מה למדנו, ולאן ממשיכים"}

# what the viewer sees in the scenes that have no approved visual description in their content file
SEE = {
    "hook": ("שעון מתקתק ושאלה: \"ערב שלם על סרטון של דקה?\". אחריה שש הבזקים קצרים, כל אחד עם הדמיה קטנה משלו: "
             "חיתוך שתיקות, כתוביות בעברית, אפקטים בתלת ממד, בירולים, הקלטות מסך וחיסכון ברינדורים. בסוף משפט אחד, "
             "\"אומרים לו בעברית מה רוצים, ורק מאשרים כל שלב בדרך\", והכותרת עם 21 הפרומפטים המוכנים."),
    "ch1": ("טרמינל של Claude Code עם המודל Claude Opus 5.5 (ברירת המחדל בכל מנוי בתשלום, ואם נבחר מודל אחר כותבים /model). "
            "לידו HyperFrames, כלי חינמי, והסקילים שלו נכנסים לקלוד. לכל סרטון תיקייה אחת, וקלוד שואל שאלות לפני שהוא נוגע "
            "בקבצים. אחר כך כרטיס פרומפט עם חמשת החלקים שלו (קלט, כיוון, בנייה, מלכודות, התחלה), ככה בנויים רוב הפרומפטים "
            "בסרטון, והוא נכנס לטרמינל. בסוף: כל פרומפט נבדק על ידי עותק נפרד של קלוד שקיבל רק אותו."),
    "t22": ("טלפון עם צללית מדברת. ברירת המחדל של HyperFrames מבינה רק אנגלית, ולכן התמלול עובר למודל הגדול (large-v3). "
            "קלוד קורא כל כתובית כמשפט שלם ותופס את \"מחובר עליו\" במקום \"מחובר אליו\", ומתקן מילים שנשמעות אותו דבר "
            "(הקאבל ← הכבל, בסכוכית ← בזכוכית). בסוף שני הסגנונות: גלולות לבנות שמתחלפות בפריים אחד, וכתוביות קינטיות שבהן "
            "כל מילה נכנסת בתנועה."),
    "summary": ("רשימת כל 23 הנושאים מסומנת ב-✓ לפי פרקים. אחריה ארבעה מדריכים להמשך: HyperFrames, מושן גרפיקס, Remotion "
                "וניתוח וידאו, ושורת התיעוד הרשמי. בסוף מסך הסיום: \"עריכת וידאו עם Claude\" ו-21 פרומפטים מוכנים."),
}

LINKS = {
    "ch1": [("התיעוד הרשמי של HyperFrames", "https://hyperframes.heygen.com/introduction")],
    "t24": [("מודל זיהוי הפנים של MediaPipe (blaze_face_short_range)",
             "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite"),
            ("מודל זיהוי העור של MediaPipe (selfie_multiclass_256x256)",
             "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite")],
    "t42": [("כתובת השרת של fal לקלוד", "https://mcp.fal.ai/mcp-relay")],
    "t51": [("כתובת ה-connector של Higgsfield", "https://mcp.higgsfield.ai/mcp"),
            ("ההסבר של Higgsfield על החיבור לקלוד", "https://higgsfield.ai/blog/claude-higgsfield-mcp-creative-studio")],
    "t52": [("כתובת השרת של fal לקלוד", "https://mcp.fal.ai/mcp-relay"),
            ("ההסבר של fal על החיבור לקלוד", "https://fal.ai/docs/documentation/setting-up/mcp")],
    "summary": [("התיעוד הרשמי של HyperFrames", "https://hyperframes.heygen.com/introduction"),
                ("ההסבר של Higgsfield על החיבור לקלוד", "https://higgsfield.ai/blog/claude-higgsfield-mcp-creative-studio"),
                ("ההסבר של fal על החיבור לקלוד", "https://fal.ai/docs/documentation/setting-up/mcp")],
}
PROMPT_NOTE = {"t52": "אין לנושא הזה פרומפט נפרד. זה שלב החיבור ל-fal מתוך פרומפט 15.",
               "t62": "אין לנושא הזה פרומפט נפרד: מספיק להגיד לקלוד שההקלטה מ-Screen Studio, ושלא יוסיף זום קפיצי משלו."}


def plain(text):
    t = re.sub(r"[{}*\[\]]", "", (text or "").replace("|", " "))
    return re.sub(r"\s+", " ", t).strip()


def see_of(sid):
    if sid in SEE:
        return SEE[sid]
    doc = importlib.import_module("content." + sid).__doc__ or ""
    if "Visual (from the approved script):" not in doc:
        return ""
    v = doc.split("Visual (from the approved script):", 1)[1].strip()
    return re.sub(r"\s+", " ", v)


def main():
    plan = build.plan()
    chapters, cur = [], None
    for sid, cfg, st, _d, _b in plan:
        st = round(st, 2)
        if sid == "hook":
            cur = {"n": 0, "title": CHAPTERS[0], "t": st, "sub": "", "items": []}
            chapters.append(cur)
            cur["items"].append({"id": "hook", "num": "", "title": "ערב שלם על סרטון של דקה?", "t": st, "see": see_of("hook"),
                                 "links": [], "exp": "", "fact": "", "tip": "", "prompt": None})
            continue
        if cfg.get("type") == "chapter":
            n = cfg["n"]
            sub = " ".join(plain(x) for x in (cfg.get("sub"), cfg.get("tag")) if x)
            cur = {"n": n, "title": CHAPTERS[n], "t": st, "sub": sub, "items": []}
            chapters.append(cur)
            continue
        if sid in ("ch1", "summary"):
            title = "ככה עובדים עם Claude Code ו-HyperFrames" if sid == "ch1" else "מה למדנו, לאן ממשיכים ומסך הסיום"
            cur["items"].append({"id": sid, "num": "", "title": title, "t": st, "see": see_of(sid),
                                 "links": [{"label": a, "url": b} for a, b in LINKS.get(sid, [])],
                                 "exp": "", "fact": "", "tip": "", "prompt": None})
            continue
        a = SC.auto_times(cfg)
        f = a.get("fact") or {}
        fact = " · ".join(plain(x) for x in (f.get("pill"), f.get("line"), f.get("meta")) if x)
        prompt = None
        if cfg.get("prompt") is not None:
            full = sid != "t52"
            text = SC.PROMPTS[str(cfg["prompt"])] if full else SC.prompt_text(cfg)
            prompt = {"n": cfg["prompt"], "text": text, "note": PROMPT_NOTE.get(sid, "")}
        elif sid in PROMPT_NOTE:
            prompt = {"n": None, "text": "", "note": PROMPT_NOTE[sid]}
        cur["items"].append({
            "id": sid, "num": cfg.get("num", ""), "title": plain(cfg.get("title")), "t": st,
            "see": see_of(sid), "exp": plain(cfg.get("exp")), "fact": fact, "tip": plain(cfg.get("tip")),
            "prompt": prompt, "links": [{"label": x, "url": y} for x, y in LINKS.get(sid, [])],
        })
    for ch in chapters:
        ch["sub"] = _inline_text(ch["sub"]) if ch["sub"] else ""
        for it in ch["items"]:
            for k in ("see", "exp", "fact", "tip"):
                it[k] = _inline_text(it[k]) if it[k] else ""
            if it.get("prompt") and it["prompt"]["text"]:
                it["prompt"]["html"] = prompt_html(it["prompt"]["text"])[0]
    total = round(plan[-1][2] + plan[-1][3], 2)
    data = {"chapters": chapters, "total": total, "community": COMMUNITY, "site": SITE}
    page = TPL.read_text(encoding="utf-8").replace("__SITE__", SITE)
    page = page.replace("__DATA__", json.dumps(data, ensure_ascii=False).replace("</", "<\\/"))
    page = page.replace("__PLAYLIST__", json.dumps(PLAYLIST.read_text()))
    OUT.write_text(page, encoding="utf-8")
    n_topics = sum(1 for c in chapters for i in c["items"] if i["num"])
    n_prompts = len({i["prompt"]["n"] for c in chapters for i in c["items"] if i.get("prompt") and i["prompt"]["n"]})
    print(f"wrote {OUT} ({len(page)} bytes): {len(chapters)} chapters, {n_topics} topics, {n_prompts} prompts, total {total}s")


if __name__ == "__main__":
    main()
