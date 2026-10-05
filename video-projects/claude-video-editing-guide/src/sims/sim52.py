"""5.2 simulation: one visual beat per explanation phrase around a prepaid wallet, then the connection steps.
B0 (tStage) the wallet draws on, its empty balance cells wait
B1 "ב-fal אין מנוי חובה": a monthly subscription card is struck out (glitch)
B2 "קונים קרדיטים מראש בדשבורד החיובים": the billing dashboard's button sends coins into the wallet, the balance fills
B3 "וכל תוצאה שיצאה בהצלחה יורדת מהיתרה": a result renders, succeeds, and one coin of the balance pays for it
B4 "על שגיאה של השרת או על המתנה בתור לא משלמים": a server error and a queue; their coins come back, stamp (punch-in)
B5 "והקרדיטים תקפים לשנה": a year calendar fills month by month next to the wallet
payoff: Claude Code adds the server, /mcp connects with no API key, the reopen hint, the claude.ai connector.
Beat times come from cfg["phr"] (scene-local); payoff times are relative to cfg["phrEnd"]."""
import re

from textlayout import esc

HEB = re.compile(r"[֐-׿]")
OK = '<svg class="{cls}" viewBox="0 0 30 30" aria-hidden="true"><path d="M8 15.5l5 5 9-10"/></svg>'
COIN = '<svg class="s52-cg" viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="13" r="11.5"/><circle cx="13" cy="13" r="6.5"/></svg>'
PLUG = ('<svg class="s52-plug" viewBox="0 0 32 32" aria-hidden="true"><path d="M11 4v7M21 4v7M7 11h18v5a9 9 0 0 1-18 0z"/>'
        '<path d="M16 25v4"/></svg>')
KEY = ('<svg class="s52-key" viewBox="0 0 48 30" aria-hidden="true"><circle cx="11" cy="15" r="7.5"/><path d="M18.5 15H42M35 15v6M41 15v5"/>'
       '<path class="s52-kx" d="M5 27L43 3"/></svg>')


def mixed(text):
    """Hebrew label with its Latin runs in LTR isolates (so "/mcp" or a URL keeps its order inside RTL).
    Trailing punctuation of a run stays outside the isolate."""
    out, run = [], []

    def flush():
        if run:
            s = " ".join(run)
            m = re.match(r"^(.*?)([.,:;!?]*)$", s)
            out.append(f'<span class="isl" dir="ltr">{esc(m.group(1))}</span>{esc(m.group(2))}')
            run.clear()
    for tok in text.split(" "):
        if HEB.search(tok):
            flush()
            out.append(esc(tok))
        else:
            run.append(tok)
    flush()
    return " ".join(out)


WALLET_FILL = """<svg class="s52-wfill" viewBox="0 0 260 190" aria-hidden="true">
<defs><linearGradient id="s52wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f2864"/><stop offset="1" stop-color="#15122c"/></linearGradient></defs>
<rect class="s52-wc1" x="28" y="10" width="150" height="62" rx="9" transform="rotate(-7 103 41)"/>
<rect class="s52-wc2" x="80" y="3" width="150" height="62" rx="9" transform="rotate(5 155 34)"/>
<rect x="2" y="36" width="256" height="152" rx="24" fill="url(#s52wg)"/>
<rect class="s52-wst" x="13" y="47" width="234" height="130" rx="16"/>
<path class="s52-wtab" d="M258 92 H196 Q178 92 178 110 V122 Q178 140 196 140 H258 Z"/>
<circle class="s52-wbtn" cx="204" cy="116" r="8"/>
</svg>"""
WALLET_LINE = """<svg class="s52-wline" viewBox="0 0 260 190" aria-hidden="true">
<path class="s52-wbody" d="M234 36 H26 A24 24 0 0 0 2 60 V164 A24 24 0 0 0 26 188 H234 A24 24 0 0 0 258 164 V60 A24 24 0 0 0 234 36 Z"/>
<path class="s52-wtabl" d="M258 92 H196 Q178 92 178 110 V122 Q178 140 196 140 H258"/>
</svg>"""

SERVER = """<svg class="s52-ico" viewBox="0 0 72 72" aria-hidden="true">
<rect x="8" y="8" width="56" height="16" rx="5"/><rect x="8" y="28" width="56" height="16" rx="5"/><rect x="8" y="48" width="56" height="16" rx="5"/>
<circle class="s52-led" cx="52" cy="16" r="3.2"/><circle class="s52-led" cx="52" cy="36" r="3.2"/><circle class="s52-led s52-ledx" cx="52" cy="56" r="3.2"/>
<path class="s52-sl" d="M16 16h18M16 36h18M16 56h18"/></svg>"""
HOURGLASS = """<svg class="s52-ico s52-hg" viewBox="0 0 72 72" aria-hidden="true">
<path d="M20 8h32M20 64h32M24 8c0 14 24 18 24 28S24 50 24 64M48 8c0 14-24 18-24 28s24 14 24 28"/>
<path class="s52-sand" d="M28 18h16l-8 13z"/><path class="s52-sand" d="M27 60l9-10 9 10z"/></svg>"""
RESTART = """<svg class="s52-rst" viewBox="0 0 80 80" aria-hidden="true">
<g class="s52-rarr"><path d="M66 40a26 26 0 1 1-8-18.8"/><path d="M60 10l-1.6 12.4L46 21"/></g>
<path class="s52-fold" d="M26 32h10l4 4h14v18H26z"/></svg>"""


def html(cfg):
    c = cfg["sim52"]
    cells = "".join('<i class="s52-cell"><b></b></i>' for _ in range(10))
    rows = "".join(f'<div class="s52-subr" style="top:{92 + k * 62}px"><svg class="s52-pg" viewBox="0 0 34 34" aria-hidden="true"><rect x="4" y="6" width="26" height="24" rx="4"/>'
                   f'<path d="M4 13h26M11 3v6M23 3v6"/></svg><i class="s52-bar" style="width:{w}px"></i>{COIN}</div>' for k, w in enumerate((176, 150, 168)))
    bars = "".join(f'<i style="height:{h}px"></i>' for h in (46, 70, 58, 92, 76, 110, 96))
    queue = "".join("<i></i>" for _ in range(5))
    months = "".join('<i class="s52-mo"><u></u><b></b></i>' for _ in range(12))
    s = c["steps"]
    return f"""<div class="simwrap sim52">
<div class="s52-walu"><div class="s52-wal">{WALLET_FILL}{WALLET_LINE}<span class="s52-wname" dir="ltr">{esc(c["wallet"])}</span></div>
<div class="s52-meter" dir="rtl">{cells}</div>
<div class="s52-bal" dir="rtl"><i></i><span>{esc(c["balance"])}</span></div></div>
<div class="s52-sub"><div class="s52-subh" dir="rtl"><svg class="s52-rep" viewBox="0 0 36 36" aria-hidden="true"><path d="M29 18a11 11 0 1 1-3.4-8"/><path d="M27 4.5v6.5h-6.5"/></svg>
<b dir="rtl">{esc(c["sub"])}</b></div>{rows}
<svg class="s52-strike" viewBox="0 0 410 300" preserveAspectRatio="none" aria-hidden="true"><path d="M384 34 L26 268"/></svg>
<i class="s52-x"><svg viewBox="0 0 30 30" aria-hidden="true"><path d="M10 10l10 10M20 10L10 20"/></svg></i></div>
<div class="s52-dash"><div class="s52-dbar" dir="rtl"><span class="s52-dt" dir="rtl"><i></i>{esc(c["dash"])}</span><span class="s52-dots"><u></u><u></u><u></u></span></div>
<div class="s52-chart">{bars}</div><div class="s52-buy" dir="rtl"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg><b dir="rtl">{esc(c["buy"])}</b></div></div>
<div class="s52-res"><div class="s52-thumb"><svg class="s52-pic" viewBox="0 0 220 220" aria-hidden="true"><circle cx="152" cy="64" r="20"/><path d="M0 220 L0 176 L62 106 L106 152 L140 120 L220 186 L220 220 Z"/></svg>
<i class="s52-gen"></i><svg class="s52-ring" viewBox="0 0 80 80" aria-hidden="true"><circle class="s52-rt" cx="40" cy="40" r="32"/><circle class="s52-rp" cx="40" cy="40" r="32"/></svg>
{OK.format(cls="s52-rok")}</div>
<div class="s52-resl" dir="rtl"><span dir="rtl">{esc(c["ok"])}</span></div></div>
<div class="s52-ca"><div class="s52-cin" dir="rtl">{SERVER}<b dir="rtl">{esc(c["err"])}</b></div><i class="s52-warn"><svg viewBox="0 0 30 30" aria-hidden="true"><path d="M15 8v9M15 21.5v.5"/></svg></i></div>
<div class="s52-cb"><div class="s52-cin" dir="rtl">{HOURGLASS}<b dir="rtl">{esc(c["queue"])}</b></div><div class="s52-q">{queue}</div></div>
<div class="s52-stamp" data-focus="3" dir="rtl"><span dir="rtl">{esc(c["free"])}</span></div>
<div class="s52-cal"><i class="s52-rg s52-rg1"></i><i class="s52-rg s52-rg2"></i>
<div class="s52-calh" dir="rtl"><b dir="rtl">{esc(c["year"])}</b>{OK.format(cls="s52-calok")}</div>
<div class="s52-months" dir="rtl">{months}</div></div>
<div class="s52-term"><div class="s52-tbar" dir="rtl"><span class="s52-tt" dir="ltr"><svg class="s52-tg" viewBox="0 0 32 26" aria-hidden="true"><rect x="1.5" y="1.5" width="29" height="23" rx="5"/><path d="M8 9l5 4-5 4M16 18h8"/></svg>{esc(s["cc"])}</span><span class="s52-dots"><u></u><u></u><u></u></span></div>
<div class="s52-st s52-st1" dir="rtl"><i class="s52-n">1</i><span class="s52-cap" dir="rtl">{mixed(s["s1"])}</span></div>
<div class="s52-in" dir="ltr"><span class="s52-pr">›</span><span class="s52-url"><i class="s52-sel"></i><span class="s52-typed">{esc(s["url"])}</span></span>{OK.format(cls="s52-uok")}</div>
<div class="s52-st s52-st2" dir="rtl"><i class="s52-n">2</i><span class="s52-cap" dir="rtl">{mixed(s["s2"])}</span>{KEY}</div>
<div class="s52-out" dir="ltr"><span class="s52-pr">›</span><span class="s52-cmd">{esc(s["cmd"])}</span><span class="s52-srv"><i class="s52-sdot"></i>{esc(s["srv"])}{OK.format(cls="s52-sok")}</span></div></div>
<div class="s52-hint"><i class="s52-n">3</i><b class="s52-h1" dir="rtl">{mixed(s["s3a"])}</b><span class="s52-h2" dir="rtl">{mixed(s["s3b"])}</span>{RESTART}</div>
<div class="s52-web"><div class="s52-tbar" dir="rtl"><span class="s52-addr" dir="ltr">{esc(s["web"])}</span><span class="s52-dots"><u></u><u></u><u></u></span></div>
<div class="s52-st s52-st4" dir="rtl"><i class="s52-n">4</i><span class="s52-cap" dir="rtl">{mixed(s["s4"])}</span></div>
<div class="s52-chips" dir="rtl"><span class="s52-chip s52-ch1" dir="ltr">{PLUG}{esc(s["chips"][0])}{OK.format(cls="s52-cok")}</span>
<span class="s52-chip s52-ch2" dir="ltr">{PLUG}{esc(s["chips"][1])}{OK.format(cls="s52-cok")}</span></div></div>
</div>"""


def cues(cfg):
    P, pe = cfg["phr"], cfg["phrEnd"]
    c = cfg["sim52"]
    out = [("glitch_soft", P[0] + 0.85), ("tick", P[1] + 0.95), ("pop", P[2] + 1.0), ("snap", P[3] + 0.7),
           ("shimmer", P[4] + 0.6)]
    out += [("tick", pe + c["tTerm"] + 0.85), ("tick", pe + c["tTerm"] + 1.95), ("swipe", pe + c["tHint"]), ("pop", pe + c["tWeb"] + 0.55)]
    return out
