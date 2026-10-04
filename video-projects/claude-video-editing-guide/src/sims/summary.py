"""Chapter 8 (after its card): what we learned, where to continue, end card.
Texts from the approved script; the four guides and the official docs line from the guide's last section."""
from textlayout import esc, kinetic_html

RECAP = [
    ("עריכה בסיסית", ["חיתוך לפי משמעות", "כתוביות בשני סגנונות", "9:16 עם מעקב פנים", "צבע מותג ועור טבעי", "מינוס 14 LUFS", "החלפת משפט"]),
    ("תלת ממד", ["הוראות בקול", "לוגו על כף היד", "טקסט על הקיר", "פירוק לשכבות", "עיגול ומוצר מתפרק", "סרטונים במסלול", "זום קפיצי"]),
    ("בירולים", ["אנימציה שקופה", "קליפ AI עם הפנים", "איפה לשים בירולים"]),
    ("חיבורים", ["Higgsfield", "fal"]),
    ("הקלטות מסך", ["טשטוש פרטים", "Screen Studio בלי זום"]),
    ("רינדורים", ["טיוטה של 15 שניות", "בדיקת פריימים", "מבקר עצמאי"]),
]
NEXT_LINE = "כל טיפ כאן נשען על כלי שיש עליו מדריך מלא משלו."
CARDS = [
    ("HyperFrames", "התקנה צעד אחרי צעד, והנגן שבו כל שינוי מופיע מיד.", "film"),
    ("מושן גרפיקס", "9 פרומפטים לאנימציות ברמה של סטודיו, עם סקיל חינמי שאורז את כולם.", "spark"),
    ("Remotion", "הכלי השני לעריכת סרטונים ואנימציות בקוד עם Claude\u00a0Code.", "code"),
    ("ניתוח וידאו", "שני סקילים חינמיים שנותנים לקלוד \"עיניים\": אחד מפרק סרטון לפריימים ולכתוביות, והשני מוריד סרטונים מיוטיוב, טיקטוק ואינסטגרם.", "eye"),
]
DOCS = "ובתיעוד הרשמי: hyperframes.heygen.com, וההסברים של Higgsfield ו-fal על החיבור לקלוד."
END_TITLE = "עריכת וידאו עם Claude"
END_LINE = "הסרטון הזה נבנה ב-Claude Code עם HyperFrames, לפי השיטות שמוצגות בו."
END_BADGE = "21 פרומפטים מוכנים"

# the recap is on screen from the first frame and gets its checks a little faster than before, which pays for
# a longer hold on the closing line; each section starts under the outgoing one (no empty frame)
T_RECAP, T_CHK0, CHK_STEP = 0.0, 0.6, 0.27
T_NEXT = 9.65
T_END = T_NEXT + 13.9
D = round(T_END + 5.75, 2)
# 40 px line-art marks before the recap headings (lavender, no text)
MOTIFS = [
    '<path d="M4 20v0M10 13v14M16 7v26M22 15v10M28 4v32M34 11v18"/>',                       # waveform
    '<path d="M6 13l12-7 16 4v18l-12 7-16-4z"/><path d="M6 13l16 4 12-7M22 17v18"/>',          # cube
    '<rect x="3" y="7" width="34" height="26" rx="4"/><path d="M3 13h34M3 27h34M17 16l8 4-8 4z"/>',   # film frame
    '<path d="M14 4v8M26 4v8"/><rect x="9" y="12" width="22" height="14" rx="4"/><path d="M20 26v5c0 4-5 5-5 9"/>',  # plug
    '<rect x="3" y="6" width="34" height="28" rx="4"/><path d="M3 13h34M29 20h-20M29 27h-14"/>',      # browser window
    '<rect x="3" y="9" width="34" height="8" rx="4"/><rect x="3" y="23" width="34" height="8" rx="4"/><path d="M7 13h22M7 27h10"/>',  # render bars
]

ICONS = {
    "film": '<rect x="5" y="9" width="38" height="30" rx="5"/><path d="M5 17h38M5 31h38M14 9v8M24 9v8M34 9v8M14 31v8M24 31v8M34 31v8"/>',
    "spark": '<path d="M24 4l4.5 13.5L42 22l-13.5 4.5L24 40l-4.5-13.5L6 22l13.5-4.5z"/><path d="M38 34l1.8 4.2L44 40l-4.2 1.8L38 46l-1.8-4.2L32 40l4.2-1.8z"/>',
    "code": '<path d="M17 12L5 24l12 12M31 12l12 12-12 12M27 8l-6 32"/>',
    "eye": '<path d="M3 24C9 13 16 8 24 8s15 5 21 16c-6 11-13 16-21 16S9 35 3 24z"/><circle cx="24" cy="24" r="7"/>',
}
CHECK = '<svg class="sm-ck" viewBox="0 0 30 30" aria-hidden="true"><path d="M7 15.5l5.5 5.5L23.5 9"/></svg>'


def _chip(label):
    d = "ltr" if all(ord(ch) < 0x0590 for ch in label.replace(" ", "")) else "rtl"
    return f'<span class="sm-chip">{CHECK}<b dir="{d}">{esc(label)}</b></span>'


def scene(cfg):
    blocks = "".join(f'<div class="sm-blk"><h3 dir="rtl"><svg class="sm-mo" viewBox="0 0 40 40" aria-hidden="true">{MOTIFS[k]}</svg>{esc(ch)}</h3>'
                     f'<div class="sm-chips" dir="rtl">{"".join(_chip(x) for x in items)}</div></div>'
                     for k, (ch, items) in enumerate(RECAP))
    nl, _, _ = kinetic_html(NEXT_LINE, t0=T_NEXT + 0.2, step=0.09, pause=0.0)
    cards = "".join(f'<div class="sm-card" dir="rtl"><svg class="sm-ico" viewBox="0 0 48 48" aria-hidden="true">{ICONS[ic]}</svg>'
                    f'<div><h4 dir="{"ltr" if t.isascii() else "rtl"}">{esc(t)}</h4><p>{esc(d)}</p></div></div>' for t, d, ic in CARDS)
    docs = esc(DOCS).replace("hyperframes.heygen.com", '<span dir="ltr" class="sm-url">hyperframes.heygen.com</span>')
    et, _, _ = kinetic_html(END_TITLE, t0=T_END + 0.05, step=0.12, pause=0.0)
    el, _, _ = kinetic_html(END_LINE, t0=T_END + 1.4, step=0.07, pause=0.0)
    inner = f"""<div class="hdr sm-hdr" dir="rtl"><span class="hdr-ch">פרק 8 · מה למדנו, ולאן ממשיכים</span></div>
<div class="scam"><div class="summary">
<div class="sm-recap"><p class="sm-kick" dir="rtl"><i></i>מה למדנו</p><div class="sm-blocks">{blocks}</div></div>
<div class="sm-next"><p class="sm-kick" dir="rtl"><i></i>לאן ממשיכים</p><p class="sm-nl kin" dir="rtl">{nl}</p><div class="sm-cards">{cards}</div><p class="sm-docs" dir="rtl">{docs}</p></div>
<div class="sm-end"><i class="ch-ring sm-ring"></i><i class="ch-ring ch-ring2 sm-ring"></i><h1 class="sm-tt kin" dir="rtl">{et}</h1><span class="sm-badge" dir="rtl">{esc(END_BADGE)}</span><p class="sm-el kin" dir="rtl">{el}</p></div>
</div></div>"""
    c = dict(cfg)
    c["D"] = D
    n = sum(len(x) for _, x in RECAP)
    js = {"T": {"recap": T_RECAP, "chk0": T_CHK0, "step": CHK_STEP, "next": T_NEXT, "end": T_END}, "n": n}
    cues = [("whoosh_soft", 0.0)] + [("tick", T_CHK0 + i * CHK_STEP + 0.1) for i in range(0, n, 3)]
    cues += [("pop", T_CHK0 + (n - 1) * CHK_STEP + 0.1), ("whoosh_soft", T_NEXT - 0.1), ("shimmer", T_END)]
    return inner, js, cues, c
