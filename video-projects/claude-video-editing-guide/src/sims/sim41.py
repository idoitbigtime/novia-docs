"""4.1 simulation: a word or an icon pops next to the head; it is a transparent MOV layer placed over the video,
and also an MP4 on the brand colour, for editing software that does not read a transparent file.
Layout (800 x 700): the reel at the right (its layers live in a CSS 3D stack), one panel per beat at the left.
B0 the sentence plays (waveform + playhead); at two marked moments the cards "פרומפט" and "סקילים" pop next to the head
B1 the reel splits into layers (3D): the cards sit on a transparent layer (checkerboard) = clip.mov · ProRes 4444;
   it lands back over the video (the punch-in is on that layer)
B2 the same cards fly into a second file on the brand colour, clip-brand.mp4
B3 a generic editor: the MOV is not read (glitch, red cross), the MP4 goes in (check)
payoff: the layers split again, the base is now full green; the clip lands on it: "הרקע נשאר ירוק: השקיפות עובדת".
Times come from cfg["phr"] / cfg["phrEnd"] (scene-local) in sim41.js."""
from textlayout import esc
from art import person_svg

# line icons of the guide's two cards (a page, layers); every path is drawn on separately
PAGE = ('<svg class="s41-ico" viewBox="0 0 46 46" aria-hidden="true">'
        '<path d="M12.5 5H28l9 9v24.5a2.5 2.5 0 0 1-2.5 2.5h-22a2.5 2.5 0 0 1-2.5-2.5v-31A2.5 2.5 0 0 1 12.5 5z"/>'
        '<path d="M28 5v9h9"/><path d="M16 22h15M16 28h15M16 34h9"/></svg>')
LAYERS = ('<svg class="s41-ico" viewBox="0 0 46 46" aria-hidden="true">'
          '<path d="M23 6l17 8.5-17 8.5-17-8.5z"/><path d="M6 22.5l17 8.5 17-8.5"/><path d="M6 30.5l17 8.5 17-8.5"/></svg>')
ICONS = (PAGE, LAYERS)

# waveform bar heights of the sentence (fixed pattern)
WAVE = [12, 20, 34, 26, 44, 56, 36, 22, 46, 62, 50, 30, 18, 38, 56, 44, 26, 14, 32, 48, 40, 24]

CHECK = '<svg class="{cls}" viewBox="0 0 30 30" aria-hidden="true"><path d="M7 15.5l5.5 5.5 11-12"/></svg>'
CROSS = '<svg class="{cls}" viewBox="0 0 30 30" aria-hidden="true"><path d="M9.5 9.5l11 11"/><path d="M20.5 9.5l-11 11"/></svg>'


def _wave(cls):
    bars = []
    for i, h in enumerate(WAVE):
        x = 8 + i * 17.6
        bars.append(f'<rect x="{x:.1f}" y="{45 - h * 0.6:.1f}" width="9" height="{h * 1.2:.1f}" rx="4.5"/>')
    return f'<svg class="{cls}" viewBox="0 0 400 90" aria-hidden="true">{"".join(bars)}</svg>'


def _cards(c, cls):
    out = []
    for i, word in enumerate(c["cards"]):
        out.append(f'<div class="s41-card s41-c{i + 1} {cls}{i + 1}">{ICONS[i]}<span dir="rtl">{esc(word)}</span></div>')
    return "".join(out)


def html(cfg):
    c = cfg["sim41"]
    return f"""<div class="simwrap sim41">
<div class="s41-persp"><div class="s41-stack">
<div class="s41-base">
<div class="s41-room"><div class="s41-lamp"></div><div class="s41-win"><i></i></div>
{person_svg("s41-person", "41")}
<div class="s41-prog"><i></i></div></div>
<div class="s41-green"><span class="s41-hex" dir="ltr">{esc(c["greenHex"])}</span></div>
<i class="s41-gscan"></i>
</div>
<div class="s41-ovl" data-focus="1"><div class="s41-chk"></div>
<svg class="s41-ovlo" viewBox="0 0 324 576" preserveAspectRatio="none" aria-hidden="true"><rect x="2" y="2" width="320" height="572" rx="25"/></svg>
{_cards(c, "s41-hc")}</div>
</div></div>
<div class="s41-tag s41-tmov" dir="ltr"><i class="s41-sw s41-swchk"></i><span>{esc(c["mov"])}</span></div>

<div class="s41-p0">
<div class="s41-lbl" dir="rtl"><i></i><span>{esc(c["sentence"])}</span></div>
<div class="s41-wavebox">{_wave("s41-wave s41-wdim")}<div class="s41-wclip">{_wave("s41-wave s41-wlit")}</div><i class="s41-head"></i></div>
<i class="s41-mk s41-mk1"><b></b></i><i class="s41-mk s41-mk2"><b></b></i>
</div>
<i class="s41-spark s41-sp1"></i><i class="s41-spark s41-sp2"></i>

<div class="s41-p1">
<svg class="s41-lead" viewBox="0 0 170 20" aria-hidden="true"><path d="M2 10H160"/><circle cx="160" cy="10" r="6"/></svg>
<div class="s41-file"><svg class="s41-fileo" viewBox="0 0 96 118" aria-hidden="true"><path d="M14 3H64l29 29v77a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6V9a6 6 0 0 1 6-6z"/><path d="M64 3v29h29"/></svg>
<div class="s41-filechk"></div></div>
<div class="s41-fname" dir="ltr">{esc(c["mov"])}</div>
<div class="s41-ffmt" dir="ltr">{esc(c["movFmt"])}</div>
</div>

<div class="s41-p2">
<div class="s41-mini"><div class="s41-mbg"></div>{_cards(c, "s41-mc")}</div>
<div class="s41-tag s41-tmp4" dir="ltr"><i class="s41-sw s41-swbrand"></i><span>{esc(c["mp4"])}</span></div>
</div>

<div class="s41-p3">
<div class="s41-edhead"><span class="s41-dots"><i></i><i></i><i></i></span><span class="s41-edname" dir="rtl">{esc(c["editor"])}</span></div>
<div class="s41-ruler"></div>
<div class="s41-lane s41-lane2"></div>
<div class="s41-lane s41-lane1"><div class="s41-vblk"><i></i><i></i><i></i><i></i><i></i></div></div>
<i class="s41-ph"></i>
<div class="s41-blk s41-bmov" dir="ltr"><i class="s41-sw s41-swchk"></i><span>{esc(c["mov"])}</span>
{CROSS.format(cls="s41-no")}</div>
<div class="s41-blk s41-bmp4" dir="ltr"><i class="s41-sw s41-swbrand"></i><span>{esc(c["mp4"])}</span>
{CHECK.format(cls="s41-ok")}</div>
</div>

<div class="s41-p4">
<div class="s41-gbadge">{CHECK.format(cls="s41-gchk")}</div>
<div class="s41-gl s41-gl1" dir="rtl">{esc(c["green"][0])}</div>
<div class="s41-gl s41-gl2" dir="rtl">{esc(c["green"][1])}</div>
</div>
</div>"""


def cues(cfg):
    P, pe = cfg["phr"], cfg["phrEnd"]
    return [("pop", P[0] + 1.2), ("pop", P[0] + 2.2), ("whoosh_soft", P[1] + 0.04),
            ("swipe", P[2] + 0.2), ("glitch_soft", P[3] + 0.6), ("tick", P[3] + 1.5),
            ("shimmer", pe + 1.9)]
