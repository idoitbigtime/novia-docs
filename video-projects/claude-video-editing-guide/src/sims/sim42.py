"""4.2 simulation: an AI clip with your real face, through a generic, logo-free "fal.ai" window.
Layout (800 x 700): the platform window at the left, "your" column at the right (the video -> four sharp frames).
B0 four sharp frames are captured from the video (front, two angles, a smile; focus brackets snap) and uploaded
B1 the window fills with lots of image and video models
B2 two versions of an opening frame in a new scene develop; one is chosen
B3 a video model takes the opening frame, with the four real faces as the reference (punch-in on the faces); it plays
payoff: the clip unrolls into a strip of 6 frames; the faces are checked one by one, the last one drifts and is cut
before it; the output is marked "בלי טקסט · בלי מוזיקה · בלי קול".
The people are stylised silhouettes; scene parts are shared <g> in one <defs> and drawn with <use> (DOM budget).
Times come from cfg["phr"] / cfg["phrEnd"] (scene-local) in sim42.js."""
from textlayout import esc
from art import person_svg

DEFS = """<svg class="s42-defs" width="0" height="0" aria-hidden="true"><defs>
<linearGradient id="s42-gpf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3274"/><stop offset="1" stop-color="#1a1636"/></linearGradient>
<linearGradient id="s42-gpf2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a4ea6"/><stop offset="1" stop-color="#2c255c"/></linearGradient>
<linearGradient id="s42-gpr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c9c2ff" stop-opacity="0"/><stop offset=".65" stop-color="#c9c2ff" stop-opacity=".15"/><stop offset="1" stop-color="#c9c2ff" stop-opacity=".85"/></linearGradient>
<linearGradient id="s42-gpl" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#c9c2ff" stop-opacity="0"/><stop offset=".65" stop-color="#c9c2ff" stop-opacity=".15"/><stop offset="1" stop-color="#c9c2ff" stop-opacity=".85"/></linearGradient>
<linearGradient id="s42-gbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2456"/><stop offset=".6" stop-color="#181536"/><stop offset="1" stop-color="#0e0c1f"/></linearGradient>
<linearGradient id="s42-sbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16132f"/><stop offset="1" stop-color="#0b0a19"/></linearGradient>
<radialGradient id="s42-sgl"><stop offset="0" stop-color="#a993ff" stop-opacity=".5"/><stop offset="1" stop-color="#a993ff" stop-opacity="0"/></radialGradient>
<g id="s42-fbg"><rect width="200" height="250" fill="url(#s42-gbg)"/><circle cx="30" cy="20" r="110" fill="url(#s42-sgl)" opacity=".55"/></g>
<g id="s42-fb"><rect x="82" y="136" width="36" height="52" rx="15" fill="url(#s42-gpf)"/>
<path d="M8 250C14 204 50 182 82 178L118 178C150 182 186 204 192 250Z" fill="url(#s42-gpf)"/>
<path d="M8 250C14 204 50 182 82 178L118 178C150 182 186 204 192 250" fill="none" stroke="url(#s42-gpr)" stroke-width="3"/></g>
<g id="s42-hf"><ellipse cx="100" cy="98" rx="44" ry="52" fill="url(#s42-gpf)"/><ellipse cx="100" cy="98" rx="44" ry="52" fill="none" stroke="url(#s42-gpr)" stroke-width="3"/>
<circle cx="84" cy="96" r="3.6" fill="#d9d4ff" fill-opacity=".75"/><circle cx="116" cy="96" r="3.6" fill="#d9d4ff" fill-opacity=".75"/>
<path d="M88 122Q100 128 112 122" fill="none" stroke="#d9d4ff" stroke-opacity=".65" stroke-width="3" stroke-linecap="round"/></g>
<g id="s42-hl"><ellipse cx="91" cy="98" rx="40" ry="52" fill="url(#s42-gpf)"/><ellipse cx="91" cy="98" rx="40" ry="52" fill="none" stroke="url(#s42-gpr)" stroke-width="3"/>
<circle cx="72" cy="96" r="3.1" fill="#d9d4ff" fill-opacity=".75"/><circle cx="100" cy="96" r="3.6" fill="#d9d4ff" fill-opacity=".75"/>
<path d="M75 122Q85 127 95 122" fill="none" stroke="#d9d4ff" stroke-opacity=".65" stroke-width="3" stroke-linecap="round"/><path d="M66 100L59 113L67 115" fill="none" stroke="#d9d4ff" stroke-opacity=".6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>
<g id="s42-hr"><ellipse cx="109" cy="98" rx="40" ry="52" fill="url(#s42-gpf)"/><ellipse cx="109" cy="98" rx="40" ry="52" fill="none" stroke="url(#s42-gpl)" stroke-width="3"/>
<circle cx="100" cy="96" r="3.6" fill="#d9d4ff" fill-opacity=".75"/><circle cx="128" cy="96" r="3.1" fill="#d9d4ff" fill-opacity=".75"/>
<path d="M105 122Q115 127 125 122" fill="none" stroke="#d9d4ff" stroke-opacity=".65" stroke-width="3" stroke-linecap="round"/><path d="M134 100L141 113L133 115" fill="none" stroke="#d9d4ff" stroke-opacity=".6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>
<g id="s42-hs"><ellipse cx="96" cy="98" rx="42" ry="52" fill="url(#s42-gpf)"/><ellipse cx="96" cy="98" rx="42" ry="52" fill="none" stroke="url(#s42-gpr)" stroke-width="3"/>
<path d="M74 97Q80 90 86 97M104 97Q110 90 116 97" fill="none" stroke="#d9d4ff" stroke-opacity=".8" stroke-width="3" stroke-linecap="round"/>
<path d="M78 115Q95 136 112 115" fill="none" stroke="#d9d4ff" stroke-opacity=".8" stroke-width="3.2" stroke-linecap="round"/></g>
<g id="s42-room"><rect width="180" height="320" fill="url(#s42-sbg)"/>
<rect x="118" y="30" width="44" height="66" rx="3" fill="none" stroke="#c9c2ff" stroke-opacity=".16" stroke-width="2"/><path d="M140 30v66" stroke="#c9c2ff" stroke-opacity=".16" stroke-width="2"/>
<rect y="266" width="180" height="54" fill="#0a0916"/><path d="M0 266H180" stroke="#c9c2ff" stroke-opacity=".28" stroke-width="2"/></g>
<g id="s42-body"><path d="M18 304C22 252 54 230 84 226L112 226C142 230 172 252 176 304Z" fill="url(#s42-gpf)"/>
<path d="M58 210C52 150 76 108 99 108C122 108 146 150 140 210C128 226 70 226 58 210Z" fill="#241e50"/>
<path d="M58 210C52 150 76 108 99 108C122 108 146 150 140 210" fill="none" stroke="url(#s42-gpl)" stroke-width="2.5"/></g>
<g id="s42-head"><ellipse cx="99" cy="168" rx="27" ry="33" fill="url(#s42-gpf2)"/>
<circle cx="89" cy="166" r="2.5" fill="#e6e2ff" fill-opacity=".8"/><circle cx="109" cy="166" r="2.5" fill="#e6e2ff" fill-opacity=".8"/>
<path d="M93 182Q99 185 105 182" fill="none" stroke="#e6e2ff" stroke-opacity=".7" stroke-width="2.2" stroke-linecap="round"/></g>
<g id="s42-headx"><ellipse cx="103" cy="174" rx="22" ry="42" fill="url(#s42-gpf2)"/>
<circle cx="92" cy="160" r="2.6" fill="#e6e2ff" fill-opacity=".8"/><circle cx="113" cy="174" r="2.1" fill="#e6e2ff" fill-opacity=".8"/>
<path d="M92 198Q100 193 112 203" fill="none" stroke="#e6e2ff" stroke-opacity=".7" stroke-width="2.2" stroke-linecap="round"/></g>
<g id="s42-lap"><path d="M6 270L74 262L80 272L2 280Z" fill="#2a2452" stroke="#c9c2ff" stroke-opacity=".5" stroke-width="1.5"/>
<path d="M10 264L6 214L64 206L72 258Z" fill="#0d0b1f" stroke="#c9c2ff" stroke-width="2"/>
<g fill="#c9c2ff"><path d="M16 222L40 219L40 223L16 226Z"/><path d="M17 231L52 227L52 231L17 235Z" opacity=".65"/><path d="M22 240L44 237L44 241L22 244Z"/><path d="M18 249L48 245L48 249L18 253Z" opacity=".65"/></g></g>
<g id="s42-iimg"><rect x="3" y="5" width="24" height="20" rx="4"/><path d="M5 22l7-7 4.5 4.5 3.5-3.5 5 5"/><circle cx="20.5" cy="11" r="2.4"/></g>
<g id="s42-ivid"><rect x="3" y="6" width="24" height="18" rx="4"/><path d="M12.5 10.5v9l7-4.5z" class="s42-fillp"/></g>
</defs></svg>"""

HEADS = ("s42-hf", "s42-hl", "s42-hr", "s42-hs")   # front, two angles, a smile (prompt 15 step 2)
PLAY = '<svg class="{cls}" viewBox="0 0 30 30" aria-hidden="true"><path d="M11 8.5v13l10.5-6.5z"/></svg>'
CHECK = '<svg class="{cls}" viewBox="0 0 30 30" aria-hidden="true"><path d="M7 15.5l5.5 5.5 11-12"/></svg>'
CROSS = '<svg class="{cls}" viewBox="0 0 30 30" aria-hidden="true"><path d="M9.5 9.5l11 11"/><path d="M20.5 9.5l-11 11"/></svg>'
# tag icons (text, music, voice), each crossed by one slash
TAG_ICONS = (
    '<path d="M8 8h14M15 8v15"/>',
    '<path d="M12 21V8l11-2.5v12.5"/><circle cx="9.5" cy="21" r="2.8"/><circle cx="20.5" cy="18" r="2.8"/>',
    '<path d="M5 12h4.5l6-5v16l-6-5H5z"/><path d="M19.5 11c1.2 1.8 1.2 4.2 0 6"/>',
)


def _face(k, cls):
    return (f'<svg class="{cls}" viewBox="0 0 200 250" aria-hidden="true"><use href="#s42-fbg"/><use href="#s42-fb"/>'
            f'<use href="#{HEADS[k]}"/></svg>')


def _scene(cls, mirror=False, dx=0, head="s42-head", glow=True):
    """The opening frame's new scene: a dark room, a hooded silhouette, a laptop (stylised)."""
    m = ' transform="matrix(-1 0 0 1 180 0)"' if mirror else ""
    glo = f'<ellipse class="s42-glo" cx="{140 if mirror else 40}" cy="236" rx="84" ry="70" fill="url(#s42-sgl)"/>' if glow else ""
    return (f'<svg class="{cls}" viewBox="0 0 180 320" aria-hidden="true"><use href="#s42-room"/>{glo}'
            f'<g transform="translate({dx} 0)"><use href="#s42-body"/><g class="s42-hd"><use href="#{head}"/></g></g>'
            f'<g{m}><use href="#s42-lap"/></g></svg>')


def html(cfg):
    c = cfg["sim42"]
    slots = "".join(f'<i class="s42-slot"><b class="s42-upc">{_face(k, "s42-fsvg")}</b></i>' for k in range(4))
    tiles = lambda ico: "".join(f'<i class="s42-tile"><svg viewBox="0 0 30 30" aria-hidden="true"><use href="#{ico}"/></svg></i>' for _ in range(10))
    faces = "".join(
        f'<div class="s42-face"><div class="s42-fimg">{_face(k, "s42-fsvg")}</div><i class="s42-fglow"></i>'
        f'<svg class="s42-brk" viewBox="0 0 128 156" aria-hidden="true"><path d="M2 22V2h20"/><path d="M106 2h20v20"/>'
        f'<path d="M126 134v20h-20"/><path d="M22 154H2v-20"/></svg></div>' for k in range(4))
    # B3: four reference lines from the faces (left edge of the grid) into the video model (filled in by JS)
    refs = "".join('<path class="s42-rl"/><path class="s42-rf"/>' for _ in range(4))
    # payoff: the clip's frames 2..6 (frame 1 is the opening frame itself, which travels into the strip)
    strip = "".join(
        f'<div class="s42-sf s42-sf{k}">{_scene("s42-ssvg", dx=dx, head="s42-headx" if k == 6 else "s42-head")}</div>'
        for k, dx in zip(range(2, 7), (-3, -6, -4, 0, 2)))
    badges = "".join(f'<i class="s42-bd s42-bd{k}">{CHECK.format(cls="s42-ok")}</i>' for k in range(1, 6))
    tags = "".join(
        f'<span class="s42-tag"><svg class="s42-tico" viewBox="0 0 30 30" aria-hidden="true">{ico}<path class="s42-slash" d="M5 25L25 5"/></svg>'
        f'<b dir="rtl">{esc(t)}</b></span>' for t, ico in zip(c["tags"], TAG_ICONS))
    return f"""<div class="simwrap sim42">
{DEFS}
<div class="s42-win">
<div class="s42-wbar"><span class="s42-wname" dir="ltr">{esc(c["win"])}</span><span class="s42-dots"><i></i><i></i><i></i></span></div>
<div class="s42-slots">{slots}</div>
<div class="s42-uptag" dir="ltr">{esc(c["upload"])}</div>
<div class="s42-upbar"><i></i></div>
<div class="s42-grid">
<div class="s42-gl s42-gl1" dir="rtl"><i></i><span>{esc(c["groups"][0])}</span></div>
<div class="s42-tiles s42-t1">{tiles("s42-iimg")}</div>
<div class="s42-gl s42-gl2" dir="rtl"><i></i><span>{esc(c["groups"][1])}</span></div>
<div class="s42-tiles s42-t2">{tiles("s42-ivid")}</div>
</div>
<div class="s42-olbl" dir="rtl">{esc(c["open"])}</div>
<div class="s42-chip">{PLAY.format(cls="s42-cplay")}<span dir="rtl">{esc(c["model"])}</span><i class="s42-port"></i></div>
</div>
<div class="s42-col">
<div class="s42-src">{person_svg("s42-person", "42")}<div class="s42-sprog"><i></i></div><i class="s42-flash"></i></div>
<div class="s42-faces" data-focus="3">{faces}</div>
</div>
<div class="s42-rlbl" dir="rtl"><i></i><span>{esc(c["ref"])}</span></div>
<svg class="s42-refs" viewBox="0 0 800 700" aria-hidden="true">{refs}</svg>
<div class="s42-band"></div>
<div class="s42-fr s42-frB"><div class="s42-fin">{_scene("s42-osvg", mirror=True, dx=6)}</div>
<svg class="s42-fo" viewBox="0 0 170 302" preserveAspectRatio="none" aria-hidden="true"><path d="M153.5 1.5H16.5A15 15 0 0 0 1.5 16.5V285.5A15 15 0 0 0 16.5 300.5H153.5A15 15 0 0 0 168.5 285.5V16.5A15 15 0 0 0 153.5 1.5Z"/></svg></div>
<div class="s42-fr s42-frA"><div class="s42-fin">{_scene("s42-osvg")}<i class="s42-gen"></i>
<div class="s42-pbar"><i></i></div></div>
<svg class="s42-fo" viewBox="0 0 170 302" preserveAspectRatio="none" aria-hidden="true"><path d="M153.5 1.5H16.5A15 15 0 0 0 1.5 16.5V285.5A15 15 0 0 0 16.5 300.5H153.5A15 15 0 0 0 168.5 285.5V16.5A15 15 0 0 0 153.5 1.5Z"/></svg>
<i class="s42-pick">{CHECK.format(cls="s42-ok")}</i><i class="s42-bigplay">{PLAY.format(cls="s42-bplay")}</i></div>
<div class="s42-strip">{strip}</div>
<i class="s42-scan"></i>
{badges}<i class="s42-bd s42-bd6">{CROSS.format(cls="s42-no")}</i>
<i class="s42-ring"></i>
<svg class="s42-cut" viewBox="0 0 10 260" aria-hidden="true"><path d="M5 2V258"/></svg>
<svg class="s42-sci" viewBox="0 0 30 30" aria-hidden="true"><circle cx="9" cy="7.5" r="4.2"/><circle cx="21" cy="7.5" r="4.2"/><path d="M11 11L22 27M19 11L8 27"/></svg>
<div class="s42-plbl" dir="rtl">{esc(c["cut"])}</div>
<div class="s42-tags" dir="rtl">{tags}</div>
</div>"""


def cues(cfg):
    P, pe = cfg["phr"], cfg["phrEnd"]
    # one per beat: the upload, the models, the choice, the model at work; payoff: the drifting face, the cut
    return [("whoosh_soft", P[0] + 1.72), ("shimmer", P[1] + 0.12), ("pop", P[2] + 1.3),
            ("swipe", P[3] + 0.86), ("glitch_soft", pe + 2.5), ("snap", pe + 2.82)]
