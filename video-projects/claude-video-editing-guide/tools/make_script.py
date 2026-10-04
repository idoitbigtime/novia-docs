#!/usr/bin/env python3
"""Final script with timestamps + the coverage checklist, generated from the scene plan.
usage: python3 tools/make_script.py  -> script/script-final.html
Every time comes from build.plan() (the same numbers the video is rendered from)."""
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
from textlayout import phrase_index  # noqa: E402

PROMPTS = json.loads((ROOT / "data" / "prompts.json").read_text(encoding="utf-8"))
CHAPTERS = {1: "ככה זה עובד", 2: "עריכה בסיסית", 3: "אפקטים בתלת ממד", 4: "בירולים", 5: "חיבורים: Higgsfield ו-fal",
            6: "הקלטות מסך", 7: "חוסכים שעות של רינדורים", 8: "מה למדנו, ולאן ממשיכים"}
# topics whose prompt is shown on another topic's card, or not at all (as in the approved script)
PROMPT_NOTE = {"t52": "אין פרומפט נפרד: מוצג מילה במילה שלב החיבור ל-fal מתוך פרומפט 15", "t62": "אין פרומפט נפרד לנושא הזה"}


def esc(s):
    return html.escape(s, quote=True)


def plain(text):
    """Display text: markup ({} * |) removed."""
    t = re.sub(r"[{}*]", "", text.replace("|", " "))
    return re.sub(r"\s+", " ", t).strip()


def mmss(t):
    t = int(round(t))
    return f"{t // 60}:{t % 60:02d}"


def main():
    plan = build.plan()
    total = plan[-1][2] + plan[-1][3]
    rows, toc, check = [], [], []
    prompt_at = {}
    for sid, c, st, d, ok in plan:
        if c is None:
            continue
        typ = c.get("type", "topic")
        if typ == "chapter":
            toc.append((c["n"], CHAPTERS.get(c["n"], c["title"]), st))
            sub = f'<p class="sub">{esc(plain(c["sub"]))}</p>' if c.get("sub") else ""
            tag = f'<p class="note">{esc(plain(c["tag"]))}</p>' if c.get("tag") else ""
            rows.append(f'<h2 id="ch{c["n"]}"><span class="tc">{mmss(st)}</span>פרק {c["n"]} · {esc(c["title"])}</h2>{sub}{tag}')
        elif typ == "custom":
            mod = importlib.import_module("sims." + c["sim"])
            rows.append(custom_block(sid, mod, st, d))
            if sid == "hook":
                toc.insert(0, (0, "פתיחה", st))
        else:
            a = SC.auto_times(c)
            p = c.get("prompt")
            if p is not None:
                prompt_at.setdefault(str(p), []).append((c["num"], st + a["tPrompt"]))
            rows.append(topic_block(c, a, st))
            check.append((c["num"], c["title"], st, p, PROMPT_NOTE.get(sid, "")))
    toc_html = "".join(f'<tr><td>{"פרק " + str(n) if n else "פרק 0"}</td><td>{esc(name)}</td><td class="t">{mmss(t)}</td></tr>' for n, name, t in toc)
    check_html = "".join(
        f'<tr><td>{esc(num)}</td><td>{esc(title)}</td><td class="t">{mmss(t)}</td><td>{p if p is not None else "–"}</td>'
        f'<td>{esc(note)}</td><td class="ok">✓</td></tr>' for num, title, t, p, note in check)
    prompts_html = "".join(
        f'<tr><td>{k}</td><td>{", ".join(f"נושא {num} ({mmss(t)})" for num, t in prompt_at.get(k, [])) or "–"}</td><td class="ok">✓</td></tr>'
        for k in sorted(PROMPTS, key=int))
    out = TEMPLATE.format(total=mmss(total), secs=f"{total:.1f}", toc=toc_html, check=check_html, prompts=prompts_html,
                          ntopics=len(check), nprompts=sum(1 for k in PROMPTS if k in prompt_at), body="\n".join(rows))
    dst = ROOT / "script" / "script-final.html"
    dst.write_text(out, encoding="utf-8")
    print("wrote", dst, len(out), "topics", len(check), "prompts on screen", sum(1 for k in PROMPTS if k in prompt_at), "total", mmss(total))


def topic_block(c, a, st):
    clean, idx = phrase_index(c["exp"])
    parts = [f'<h3><span class="tc">{mmss(st)}</span>{esc(c["num"])} · {esc(plain(c["title"]))}</h3>']
    parts.append(f'<p class="lbl">הסבר <span class="tc2">{mmss(st + a["tExp"])}</span></p><p>{esc(plain(clean))}</p>')
    doc = (importlib.import_module("content." + c["id"]).__doc__ or "").strip()
    vis = doc.split("Visual (from the approved script):", 1)[-1].strip() if "Visual" in doc else ""
    if vis:
        parts.append(f'<p class="lbl">הדמיה <span class="tc2">{mmss(st + a["tStage"])}</span></p><p class="vis">{esc(vis)}</p>')
    f = a.get("fact")
    if f:
        line = " · ".join(esc(plain(x)) for x in (f.get("pill"), f.get("line"), f.get("meta")) if x)
        parts.append(f'<p class="lbl">עובדה <span class="tc2">{mmss(st + f["t"])}</span></p><p>{line}</p>')
    if c.get("prompt") is not None:
        parts.append(f'<p class="lbl">הפרומפט המוכן ({c["prompt"]} מתוך 21) <span class="tc2">{mmss(st + a["tPrompt"])}</span></p>'
                     f'<pre dir="rtl">{esc(PROMPTS[str(c["prompt"])])}</pre>')
    if c.get("tip"):
        parts.append(f'<p class="lbl">טיפ <span class="tc2">{mmss(st + a["tTip"])}</span></p><p>{esc(plain(c["tip"]))}</p>')
    return '<section class="topic">' + "".join(parts) + "</section>"


def custom_block(sid, mod, st, d):
    names = {"hook": "פתיחה (פרק 0)", "ch1": "פרק 1 · ככה זה עובד", "summary": "סיכום ולאן ממשיכים"}
    doc = esc((mod.__doc__ or "").strip())
    return f'<section class="topic"><h3><span class="tc">{mmss(st)}</span>{esc(names.get(sid, sid))}</h3><p class="vis">{doc}</p></section>'


TEMPLATE = """<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>עריכת וידאו עם Claude: תסריט סופי</title>
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>
:root {{ --bg:#ffffff; --fg:#17151f; --muted:#5d5a6b; --line:#e4e1ec; --accent:#e5322b; --card:#f7f6fb; --code:#f1eff8; }}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ --bg:#0f0e15; --fg:#efedf6; --muted:#a6a3b5; --line:#2a2836; --accent:#ff5a4f; --card:#17161f; --code:#1b1a26; }} }}
html {{ background: var(--bg); }}
body {{ margin: 0 auto; max-width: 900px; padding: 24px 16px 80px; background: var(--bg); color: var(--fg); font-family: Rubik, "Segoe UI", Arial, sans-serif; font-size: 17px; line-height: 1.7; }}
h1 {{ font-size: 28px; line-height: 1.3; font-weight: 800; margin: 8px 0 6px; }}
h2 {{ font-size: 23px; font-weight: 800; margin: 44px 0 8px; padding-top: 14px; border-top: 2px solid var(--line); }}
h3 {{ font-size: 19px; font-weight: 700; margin: 0 0 8px; color: var(--accent); }}
.tc {{ display: inline-block; direction: ltr; unicode-bidi: isolate; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.82em; color: var(--fg); background: var(--card); border: 1px solid var(--line); border-radius: 6px; padding: 0 7px; margin-left: 10px; }}
.tc2 {{ direction: ltr; unicode-bidi: isolate; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.86em; color: var(--muted); margin-right: 6px; }}
.sub {{ font-size: 18px; }}
.note, .vis {{ color: var(--muted); }}
.lbl {{ margin: 14px 0 2px; font-weight: 700; font-size: 15px; color: var(--muted); }}
.topic {{ margin: 22px 0; padding: 18px 20px; background: var(--card); border: 1px solid var(--line); border-radius: 14px; }}
.topic p {{ margin: 0 0 4px; }}
pre {{ white-space: pre-wrap; word-wrap: break-word; background: var(--code); border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; font-family: Rubik, "Segoe UI", Arial, sans-serif; font-size: 15px; line-height: 1.65; margin: 6px 0; overflow-x: auto; }}
table {{ width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 15px; }}
th, td {{ border: 1px solid var(--line); padding: 6px 10px; text-align: right; vertical-align: top; }}
th {{ background: var(--card); font-weight: 700; }}
td.t {{ direction: ltr; text-align: right; font-family: ui-monospace, Menlo, Consolas, monospace; }}
td.ok {{ color: #1f9d55; font-weight: 800; text-align: center; }}
.meta {{ color: var(--muted); font-size: 15px; }}
.wrap {{ overflow-x: auto; }}
</style>
</head>
<body>
<h1>עריכת וידאו עם Claude: תסריט סופי עם זמנים</h1>
<p class="meta">9:16 · 1080×1920 · 30 פריימים לשנייה · אורך {total} ({secs} שניות) · בלי קריינות: מוזיקה מקורית וכתוביות · כל התוכן מתוך המדריך בלבד</p>

<h2>ציר הזמן לפי פרקים</h2>
<div class="wrap"><table><tr><th>פרק</th><th>שם</th><th>מתחיל ב-</th></tr>{toc}</table></div>

<h2>צ'קליסט כיסוי: {ntopics} נושאים</h2>
<div class="wrap"><table><tr><th>#</th><th>נושא</th><th>זמן</th><th>פרומפט</th><th>הערה</th><th>מכוסה</th></tr>{check}</table></div>

<h2>צ'קליסט: {nprompts} מתוך 21 הפרומפטים מוצגים במלואם על המסך</h2>
<div class="wrap"><table><tr><th>פרומפט</th><th>איפה בסרטון</th><th>מוצג</th></tr>{prompts}</table></div>

<h2>התסריט המלא</h2>
{body}
</body>
</html>
"""

if __name__ == "__main__":
    main()
