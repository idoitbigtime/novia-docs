"""Chapter 1 "ככה זה עובד" (after the chapter card). Texts from the approved script / the guide's opening section.
S1 Claude Code: a terminal that works on your files and runs programs; the model badge (Opus 5.5) and /model
S2 the HyperFrames skills: SKILL.md files go in, a video file comes out; "כלי חינמי"
S3 one folder per video: footage and a logo go in; folder -> Claude Code -> MP4; you talk to it in Hebrew
S4 how to use the prompts: the five sections light up, copy into Claude Code, it asks questions first,
   the commands inside are for Claude; every prompt was checked by a separate copy of Claude.
"""
import json
import pathlib
from textlayout import esc, kinetic_html, phrase_times, _code_tokens

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
TABS = ["קלט", "כיוון", "בנייה", "מלכודות", "התחלה"]

SECTIONS = [
    dict(t0=0.0, kicker="הכלי הראשון · Claude Code",
         text="הגרסה של קלוד שעובדת על הקבצים במחשב שלכם | ומריצה בו תוכנות."),
    dict(t0=10.3, kicker="הכלי השני · הסקילים של HyperFrames",
         text="סקיל הוא קובץ הוראות שקלוד קורא כשצריך. | הסקילים של HyperFrames מלמדים אותו לבנות סרטון | ולהוציא אותו כקובץ וידאו."),
    dict(t0=20.8, kicker="ותיקייה אחת לכל סרטון",
         text="שמים בה את כל הצילומים, | פותחים בה את Claude Code | ומדברים איתו בעברית, כמו עם עורך שיושב לידכם."),
    dict(t0=30.3, kicker="איך משתמשים בפרומפטים",
         text="בכל טיפ יש פרומפט מוכן. | מעתיקים אותו ל-Claude Code, | והוא שואל כמה שאלות על הסרטון לפני שהוא נוגע במשהו. | "
              "את הפקודות שבתוכו לא צריך להבין, הן בשביל קלוד."),
]
NOTE1 = "ברירת המחדל בכל מנוי בתשלום לקלוד."
NOTE2 = "נבחר מודל אחר? כותבים /model ובוחרים בו."
BADGE = "המודל: Claude Opus 5.5"
FREE = "כלי חינמי"
MOST = "ככה בנויים רוב הפרומפטים בסרטון"          # 14 of the guide's 21 prompts have all five sections
FORCLAUDE = "בשביל קלוד"
CLOSE = "כל פרומפט נבדק [על ידי] עותק נפרד של קלוד שקיבל רק אותו."
COPY_LABEL = "עותק נפרד"                         # from the sentence above
D = 44.6

CHECK = '<svg class="c1-ck" viewBox="0 0 30 30" aria-hidden="true"><path d="M7 15.5l5.5 5.5L23.5 9"/></svg>'
DOC = ('<svg class="c1-doc" viewBox="0 0 40 50" aria-hidden="true"><path d="M6 3h20l10 10v34H6z"/><path d="M26 3v10h10"/>'
       '<path d="M12 24h18M12 31h18M12 38h12"/></svg>')
FILM = ('<svg class="c1-film" viewBox="0 0 60 44" aria-hidden="true"><rect x="3" y="3" width="54" height="38" rx="6"/>'
        '<path d="M3 13h54M3 31h54M15 3v10M27 3v10M39 3v10M15 31v10M27 31v10M39 31v10"/><path class="c1-play" d="M25 17l9 5-9 5z"/></svg>')
# Claude Code is typed to: a text caret (no microphone)
CARET = '<b class="c1-caret"></b>'
COPY = ('<svg class="c1-copy" viewBox="0 0 40 40" aria-hidden="true"><rect x="13" y="13" width="22" height="24" rx="4"/>'
        '<path d="M27 13V7a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v18a4 4 0 0 0 4 4h4"/></svg>')
SHIELD = ('<svg class="c1-shield" viewBox="0 0 48 56" aria-hidden="true"><path d="M24 3 6 10v16c0 13 8 22 18 27 10-5 18-14 18-27V10z"/>'
          '<path d="M15 28l6 6 12-13"/></svg>')
FOLDER = ('<svg class="c1-fold" viewBox="0 0 180 140" aria-hidden="true"><path class="c1-fback" d="M8 22h58l14 16h92v94H8z"/></svg>')
LID = ('<svg class="c1-lid" viewBox="0 0 180 110" aria-hidden="true"><path d="M8 6h164v98H8z"/></svg>')


def _cmd():
    """A real command line from the guide's prompts (shown dimmed: it is for Claude)."""
    return "npx hyperframes transcribe <הקובץ> --language he --model large-v3"


def scene(cfg):
    secs = []
    phr_all = []
    for i, s in enumerate(SECTIONS):
        clean, times, idx, starts, end = phrase_times(s["text"], s["t0"] + 0.45)
        html, _, _ = kinetic_html(clean, times=times, end=end, phrases=idx)
        k, _, _ = kinetic_html(s["kicker"], t0=s["t0"] + 0.15, step=0.05, pause=0.0)
        secs.append(f'<div class="c1-sec c1-sec{i}"><p class="c1-kick kin" dir="rtl"><i></i>{k}</p><p class="c1-txt kin" dir="rtl">{html}</p></div>')
        phr_all.append({"t0": s["t0"], "phr": starts, "end": end})
    files = "".join(f'<div class="c1-file" dir="ltr">{DOC}<span>{n}</span></div>' for n in ("take1.mp4", "logo.png", "music.wav"))
    skills = "".join(f'<div class="c1-skill" dir="ltr">{DOC}<span>SKILL.md</span></div>' for _ in range(3))
    tabs = "".join(f'<span class="c1-tab" dir="rtl">{t}</span>' for t in TABS)
    lines = "".join(f'<i class="c1-pl" style="width:{w}px"></i>' for w in (520, 440, 500, 300, 470, 380))
    clips = "".join(f'<div class="c1-clip c1-clip{i}"><i></i></div>' for i in range(3))
    bubbles = "".join(f'<div class="c1-q c1-q{i}" dir="rtl"><b>?</b><i></i><i></i></div>' for i in range(3))
    note2 = esc(NOTE2).replace("/model", '<span class="c1-m" dir="ltr">/model</span>')
    close, _, _ = kinetic_html(CLOSE, t0=39.9, step=0.1, pause=0.2)
    inner = f"""<div class="hdr c1-hdr" dir="rtl"><span class="hdr-ch">פרק 1 · ככה זה עובד</span></div>
<div class="ch1">
{"".join(secs)}
<div class="c1-zc"><div class="c1-cam"><div class="c1-vis">
  <div class="c1-files">{files}</div>
  <div class="c1-note" dir="rtl"><p>{esc(NOTE1)}</p><p>{note2}</p></div>
  <div class="c1-badge" dir="rtl">{esc(BADGE)}</div>
  <div class="c1-skills">{skills}</div>
  <div class="c1-mp4" dir="ltr">{FILM}<span>final.mp4</span><i class="c1-prog"><b></b></i></div>
  <div class="c1-foldwrap"><div class="c1-clips">{clips}<div class="c1-logo"></div></div>{FOLDER}<div class="c1-lidw">{LID}</div></div>
  <svg class="c1-arcs" viewBox="0 0 800 800" aria-hidden="true"><path class="c1-arc1" d="M600 95 C 520 95 470 150 462 241"/><path class="c1-arc2" d="M149 470 C 112 505 140 560 162 594"/></svg>
  <i class="c1-dot c1-dot1"></i><i class="c1-dot c1-dot2"></i>
  <div class="c1-say" dir="rtl">{CARET}<i></i><i></i><span>עברית</span></div>
  <div class="c1-term">
    <div class="c1-tbar"><i></i><i></i><i></i><span dir="ltr">Claude Code</span></div>
    <div class="c1-tbody" dir="ltr">
      <div class="c1-line c1-l1"><b>&gt;</b> <span class="c1-ty c1-ty1">claude</span><i class="c1-cur c1-cur1"></i></div>
      <div class="c1-line c1-l2"><b>&gt;</b> <span class="c1-ty c1-ty2">/model</span><span class="c1-menu">Opus 5.5{CHECK}</span></div>
      <div class="c1-run"><i></i></div>
      <div class="c1-tl"><i></i><i></i><i></i></div>
    </div>
    <div class="c1-tools" dir="ltr"><span class="c1-opus">Opus 5.5{CHECK}</span><span class="c1-skc">{DOC}SKILL.md</span></div>
    <div class="c1-glow"></div>
  </div>
  <div class="c1-free"><span class="pill">{esc(FREE)}</span></div>
  <div class="c1-pcard"><div class="c1-ptabs">{tabs}<i class="c1-tul"></i></div><div class="c1-plines">{lines}</div>{COPY}</div>
  <p class="c1-most" dir="rtl">{esc(MOST)}</p>
  <div class="c1-mini"><div class="c1-tbar"><i></i><i></i><i></i><span dir="ltr">Claude Code</span></div><div class="c1-mbody"></div></div>
  <div class="c1-qs">{bubbles}</div>
  <div class="c1-cmd"><span class="c1-cmdt" dir="ltr">{_code_tokens(_cmd())}</span><span class="c1-fc" dir="rtl">{esc(FORCLAUDE)}</span></div>
</div></div></div>
<div class="c1-close"><div class="c1-cbox">{SHIELD}<p class="c1-ct kin" dir="rtl">{close}</p></div>
<div class="c1-cpic"><div class="c1-cpz"><div class="c1-cmini"><i></i><i></i><i></i><i></i></div>
<svg class="c1-carrow" viewBox="0 0 150 46" aria-hidden="true"><path d="M146 23H8M24 8 8 23l16 15"/></svg>
<div class="c1-cterm"><div class="c1-tbar"><i></i><i></i><i></i><span dir="ltr">Claude Code</span></div><span class="c1-clabel" dir="rtl">{esc(COPY_LABEL)}</span>
<div class="c1-cok"><svg viewBox="0 0 30 30" aria-hidden="true"><path d="M7 15.5l5.5 5.5L23.5 9"/></svg></div></div></div></div></div>
</div>"""
    c = dict(cfg)
    c["D"] = D
    js = {"secs": phr_all}
    cues = [("swipe", 0.4), ("pop", 5.0), ("tick", 7.4), ("whoosh_soft", 10.3), ("tick", 14.9), ("pop", 16.5),
            ("whoosh_soft", 20.8), ("tick", 22.9), ("whoosh_soft", 30.15), ("tick", 32.95), ("pop", 33.8), ("shimmer", 39.85)]
    return inner, js, cues, c
