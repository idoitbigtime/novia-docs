"""6.1 simulation: one visual beat per explanation phrase over an illustrated screen recording, then the clean result.
B0 (tStage) the recording (a mailbox with fictitious addresses) and its 20-second timeline appear
B1 "קלוד קורא את הטקסט שעל המסך בכל שנייה של ההקלטה": the playhead steps second by second, a scan line reads the screen each time
B2 "מוצא מיילים, טלפונים וכל פרט שביקשתם להסתיר": the addresses get red frames with their time; a new mail at 0:10;
   a popup with a phone number shows for a moment at 0:12 and is caught
B3 "ומטשטש אותו בדיוק בזמן שהוא על המסך": replay with the blur lanes: each blur turns on exactly while its item is on screen
   (the popup's 0.6 s; punch-in on the popup)
B4 "בסוף הוא סורק שוב, כדי לוודא שלא נשאר אף אחד": the re-scan sweeps the whole recording, every blurred spot checks out
payoff: "0 ממצאים" with a check.
Beat times come from cfg["phr"] (scene-local); payoff times are relative to cfg["phrEnd"]."""
from textlayout import esc

OK = '<svg class="{cls}" viewBox="0 0 30 30" aria-hidden="true"><path d="M8 15.5l5 5 9-10"/></svg>'
ENVELOPE = ('<svg class="s61-env" viewBox="0 0 34 26" aria-hidden="true"><rect x="2" y="2" width="30" height="22" rx="4"/>'
            '<path d="M3 4l14 11 14-11"/></svg>')
PHONE = ('<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M10.5 5.5l3.2 5.4-2.4 2.4c1.3 2.9 3.5 5.1 6.4 6.4l2.4-2.4 '
         '5.4 3.2-1.3 4.6c-.3 1-1.3 1.6-2.3 1.4C12.7 25.2 6.8 19.3 5.5 10c-.2-1 .4-2 1.4-2.3z"/></svg>')
ROW_H, LIST_TOP = 66, 62
PX_PER_S, X0 = 29, 30      # timeline: 0..20 s over x 30..610 inside the timeline panel


def _sens(text, tag, cls):
    """A sensitive string: sharp text, its blurred twin (shown when redacted), the finding frame, the time tag, the check."""
    return (f'<span class="s61-sens {cls}" dir="ltr"><b class="s61-sh">{esc(text)}</b>'
            f'<span class="s61-blur" aria-hidden="true"><b>{esc(text)}</b></span><i class="s61-ocr"></i><i class="s61-fr"></i>'
            f'<span class="s61-tag" dir="ltr">{esc(tag)}</span>{OK.format(cls="s61-ck")}</span>')


def html(cfg):
    c = cfg["sim61"]
    rows = []
    for i, (mail, tag, sw) in enumerate(c["mails"]):
        # the new mail (last in the list) arrives at the top slot at its time; the others start in slots 0..3
        slot = 0 if i == len(c["mails"]) - 1 else i
        rows.append(f'<div class="s61-row{" s61-new" if slot == 0 and i else ""}" style="top:{LIST_TOP + slot * ROW_H}px">'
                    f'<i class="s61-av"></i>{_sens(mail, tag, "s61-em")}'
                    f'<span class="s61-subj" style="width:{sw}px"><i class="s61-ocr"></i></span><i class="s61-tm"></i></div>')
    side = "".join('<div class="s61-fold"><i></i><u style="width:{}px"></u></div>'.format(w) for w in (74, 58, 66, 50, 62))
    ticks = "".join(f'<i class="s61-tk{" s61-tk5" if s % 5 == 0 else ""}" style="left:{X0 + s * PX_PER_S}px"></i>' for s in range(21))
    labels = "".join(f'<span class="s61-tl" dir="ltr" style="left:{X0 + s * PX_PER_S}px">0:{s:02d}</span>' for s in (0, 10, 20))
    marks = "".join(f'<i class="s61-mk" style="left:{X0 + s * PX_PER_S}px"></i>' for s in c["marks"])
    segs = "".join(f'<i class="s61-seg s61-seg{k}" style="left:{X0 + a * PX_PER_S:.1f}px;width:{(b - a) * PX_PER_S:.1f}px;top:{8 + k * 20}px"></i>'
                   for k, (a, b) in enumerate(c["segs"]))
    return f"""<div class="simwrap sim61">
<div class="s61-win"><div class="s61-bar" dir="rtl"><span class="s61-title" dir="rtl">{ENVELOPE}<b>{esc(c["app"])}</b></span>
<span class="s61-stat s61-st0" dir="rtl"><i></i>{esc(c["perSec"])}</span><span class="s61-stat s61-st1" dir="rtl"><i></i>{esc(c["rescan"])}</span>
<span class="s61-dots"><u></u><u></u><u></u></span></div>
<div class="s61-side">{side}</div>
<div class="s61-list">{"".join(rows)}</div>
<div class="s61-pop" data-focus="2" dir="rtl"><i class="s61-ph">{PHONE}</i><div class="s61-pt">{_sens(c["phone"], c["phoneTag"], "s61-num")}<i class="s61-pl"></i></div></div>
<i class="s61-scan"></i>
<div class="s61-res" dir="rtl"><span class="s61-rt" dir="rtl">{esc(c["result"])}</span><span class="s61-rok"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="34"/><path d="M24 41l11 11 21-23"/></svg></span></div>
</div>
<svg class="s61-link" viewBox="0 0 4 220" preserveAspectRatio="none" aria-hidden="true"><line x1="2" y1="0" x2="2" y2="220"/></svg>
<div class="s61-tlp"><div class="s61-ruler"><i class="s61-rl"></i>{ticks}{labels}</div>
<div class="s61-lane s61-lmk"><span class="s61-ll" dir="rtl">{esc(c["laneFind"])}</span><i class="s61-lt"></i>{marks}</div>
<div class="s61-lane s61-lsg"><span class="s61-ll" dir="rtl">{esc(c["laneBlur"])}</span>{segs}</div>
<i class="s61-head"><u></u></i></div>
</div>"""


def cues(cfg):
    P, pe = cfg["phr"], cfg["phrEnd"]
    return [("swipe", P[0] + 0.55), ("glitch_soft", P[1] + 1.4), ("whoosh_soft", P[2] + 0.8), ("swipe", P[3] + 0.45),
            ("shimmer", pe + 0.45)]
