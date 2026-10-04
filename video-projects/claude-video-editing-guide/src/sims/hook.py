"""Chapter 0: the 10 s hook (texts from the approved script; the guide's opening paragraph).
0.0  "ערב שלם על סרטון של דקה?" with a clock whose hands race through an evening
2.0  "בסוף הסרטון תדעו לתת לקלוד לערוך:" + six flashes from the chapters, each with a white pill
     that switches in one frame and a bouncy zoom
5.9  "אומרים לו בעברית מה רוצים, ורק מאשרים כל שלב בדרך." + a request bubble and steps being approved
8.5  title: "עריכת וידאו עם Claude" · "21 פרומפטים מוכנים"
"""
from textlayout import esc, kinetic_html
from art import person_svg

Q = "ערב שלם על סרטון של דקה?"
PROMISE = "בסוף הסרטון תדעו לתת לקלוד לערוך:"
PILLS = ["חיתוך שתיקות", "כתוביות בעברית", "אפקטים בתלת ממד", "בירולים", "הקלטות מסך", "חיסכון ברינדורים"]
SENT = "אומרים לו בעברית מה רוצים, ורק מאשרים כל שלב בדרך."
TITLE = "עריכת וידאו עם Claude"
BADGE = "21 פרומפטים מוכנים"
# approved steps, words from the guide's list of what Claude does
STEPS = ["חיתוך", "כתוביות", "אפקטים"]

T_Q, T_PROM, T_F0, F_STEP, T_SENT, T_TITLE, D = 0.2, 2.3, 2.62, 0.6, 6.25, 8.5, 10.6

CHECK = '<svg class="hk-ck" viewBox="0 0 30 30" aria-hidden="true"><path d="M7 15.5l5.5 5.5L23.5 9"/></svg>'


def _wave():
    # three spoken segments separated by two silences (the silences are cut)
    heights = [18, 34, 52, 30, 64, 44, 26, 40, 58, 36, 22]
    segs = []
    x0 = 30
    for k in range(3):
        bars = "".join(f'<rect x="{i * 17}" y="{60 - h / 2}" width="10" height="{h}" rx="5"/>' for i, h in enumerate(heights))
        segs.append(f'<svg class="hk-seg hk-seg{k}" style="left:{x0 + k * (190 + 70)}px" viewBox="0 0 190 120" aria-hidden="true">{bars}</svg>')
    gaps = "".join(f'<i class="hk-gap" style="left:{30 + 190 + k * 260}px"></i>' for k in range(2))
    cuts = "".join(f'<i class="hk-cut" style="left:{30 + 190 + k * 190 - 2}px"></i>' for k in range(2))
    return f'<div class="hk-wave">{"".join(segs)}{gaps}{cuts}<i class="hk-base"></i></div>'


def _cube():
    faces = "".join(f'<i class="hk-face hk-face{i}"></i>' for i in range(6))
    # an open palm seen from the front: four fingers and a thumb
    palm = ('<svg class="hk-palm" viewBox="0 0 300 240" aria-hidden="true"><path d="M92 232 C 78 196 70 168 70 140 L 70 70 '
            'C 70 58 88 58 88 70 L 90 120 L 94 44 C 95 30 114 30 114 44 L 114 116 L 120 34 C 121 20 140 20 141 34 L 140 116 '
            'L 148 46 C 150 33 168 34 167 48 L 162 124 C 172 106 190 92 204 92 C 214 92 218 102 210 110 C 196 126 186 150 180 172 '
            'C 172 200 160 222 150 232"/></svg>')
    return f'<div class="hk-3d"><div class="hk-glowpalm"></div>{palm}<div class="hk-cubewrap"><div class="hk-cube">{faces}</div></div></div>'


def _broll():
    land = ('<svg class="hk-land" viewBox="0 0 400 225" aria-hidden="true"><circle cx="300" cy="62" r="26"/>'
            '<path d="M0 200 L 110 92 L 180 160 L 250 104 L 400 210"/></svg>')
    return (f'<div class="hk-broll"><div class="hk-spk">{person_svg("hk-person", "hk1")}</div>'
            f'<div class="hk-clip">{land}<i class="hk-bar"><b></b></i></div></div>')


def _screen():
    return ('<div class="hk-win"><div class="hk-wbar"><i></i><i></i><i></i></div>'
            '<div class="hk-ln" style="width:420px"></div><div class="hk-ln" style="width:300px"></div>'
            '<div class="hk-mail" dir="ltr">dana@example.com<i class="hk-mbox"></i></div>'
            '<div class="hk-ln" style="width:360px"></div><div class="hk-ln" style="width:240px"></div></div>')


def _render():
    return ('<div class="hk-rend"><div class="hk-big"><span dir="ltr">1080×1920</span></div>'
            f'<div class="hk-small"><span dir="ltr">540×960</span><b dir="rtl">15 שניות</b>{CHECK}</div></div>')


def _phone():
    return (f'<div class="hk-phone"><div class="hk-scr">{person_svg("hk-person2", "hk2")}'
            '<span class="hk-cap">בפריים אחד</span></div></div>')


def scene(cfg):
    q, _, _ = kinetic_html(Q, t0=T_Q, step=0.1, pause=0.1)
    prom, _, _ = kinetic_html(PROMISE, t0=T_PROM, step=0.08, pause=0.0)
    sent, _, _ = kinetic_html("אומרים לו בעברית מה רוצים, | ורק מאשרים כל שלב בדרך.".replace(" |", ""), t0=T_SENT, step=0.11, pause=0.25)
    title, _, _ = kinetic_html(TITLE, t0=T_TITLE + 0.15, step=0.12, pause=0.0)
    flashes = [_wave(), _phone(), _cube(), _broll(), _screen(), _render()]
    fl = "".join(f'<div class="hk-f hk-f{i}"><div class="hk-fin">{h}</div></div>' for i, h in enumerate(flashes))
    pills = "".join(f'<span class="pill hk-pill" id="hk-p{i}">{esc(p)}</span>' for i, p in enumerate(PILLS))
    steps = "".join(f'<div class="hk-step">{CHECK}<span>{esc(s)}</span></div>' for s in STEPS)
    clock = ('<svg class="hk-clock" viewBox="0 0 240 240" aria-hidden="true"><circle class="hk-rim" cx="120" cy="120" r="104"/>'
             + "".join(f'<line x1="120" y1="26" x2="120" y2="{40 if i % 3 else 46}" transform="rotate({i * 30} 120 120)"/>' for i in range(12))
             + '<path class="hk-trail" d="M120 30 A 90 90 0 0 1 210 120"/>'
             '<line class="hk-hh" x1="120" y1="120" x2="120" y2="70"/><line class="hk-mh" x1="120" y1="120" x2="120" y2="44"/>'
             '<circle cx="120" cy="120" r="7" class="hk-pin"/></svg>')
    # the evening of manual work: a crowded timeline, cut marks, crooked caption bars
    clips = "".join(f'<i class="hk-tc" style="left:{x}px;width:{w}px;top:{y}px"></i>' for x, w, y in
                    ((10, 150, 18), (168, 96, 18), (272, 190, 18), (470, 120, 18), (598, 152, 18),
                     (40, 120, 62), (176, 160, 62), (350, 90, 62), (452, 210, 62), (670, 80, 62)))
    caps = "".join(f'<i class="hk-cb" style="left:{x}px;width:{w}px;transform:rotate({r}deg)"></i>' for x, w, r in
                   ((30, 130, -4), (190, 110, 3), (330, 150, -2), (520, 120, 5), (660, 90, -3)))
    cuts = "".join(f'<i class="hk-cm" style="left:{x}px"></i>' for x in (164, 268, 466, 594))
    tline = f'<div class="hk-tline">{clips}{caps}{cuts}<i class="hk-ph"></i></div>'
    inner = f"""<div class="hook">
<div class="hk-qwrap">{clock}<p class="hk-q kin" dir="rtl">{q}</p>{tline}</div>
<p class="hk-prom kin" dir="rtl">{prom}</p>
<div class="hk-fbox">{fl}</div>
<div class="hk-pills">{pills}</div>
<div class="hk-sentwrap"><p class="hk-sent kin" dir="rtl">{sent}</p>
<div class="hk-bubble" dir="rtl"><svg class="hk-mic" viewBox="0 0 30 40" aria-hidden="true"><rect x="9" y="3" width="12" height="22" rx="6"/><path d="M4 19c0 6 5 11 11 11s11-5 11-11M15 30v7M9 37h12"/></svg><i></i><i></i><i></i></div>
<div class="hk-steps" dir="rtl">{steps}</div></div>
<div class="hk-title"><i class="ch-ring hk-ring"></i><i class="ch-ring ch-ring2 hk-ring"></i><h1 class="hk-tt kin" dir="rtl">{title}</h1><span class="hk-badge" dir="rtl">{esc(BADGE)}</span></div>
</div>"""
    c = dict(cfg)
    c["D"] = D
    js = {"T": {"q": T_Q, "prom": T_PROM, "f0": T_F0, "fstep": F_STEP, "sent": T_SENT, "title": T_TITLE}, "n": len(PILLS)}
    cues = [("whoosh_soft", 0.0), ("tick", T_PROM)]
    cues += [("tick", T_F0 + i * F_STEP) for i in range(len(PILLS))]
    cues += [("swipe", T_SENT), ("shimmer", T_TITLE + 0.1)]
    return inner, js, cues, c
