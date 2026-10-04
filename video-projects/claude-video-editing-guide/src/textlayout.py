"""Hebrew RTL text layout for the HyperFrames composition.

Kinetic text: every word becomes its own inline-block span (so it can be animated),
with dir="rtl" so trailing punctuation stays on the correct side. Inline-block words are
bidi-neutral objects, so a run of two or more non-Hebrew tokens ("Claude Code", "x 140",
"14 LUFS") is wrapped in one dir="ltr" island, otherwise it would render reversed.
A single token with a leading minus ("-14") is isolated too, otherwise the minus sign
lands on the wrong side in an RTL line.

Markup inside text: {accent phrase} = accent color + weight 900 + underline drawn
right to left; *strong phrase* = weight 900 only.
"""
import html
import re

HEB = re.compile(r"[֐-׿]")
NEG_NUM_TOKEN = re.compile(r"^-\d")
TRAIL_PUNCT = re.compile(r"^(.*?)([.,:;!?]+)$")
SENTENCE_END = re.compile(r"[.!?:]$")


def esc(s):
    return html.escape(s, quote=True)


def has_heb(tok):
    return bool(HEB.search(tok))


def parse_marked(text):
    """Return a list of (token, style) where style is '', 'acc' or 'str', plus group ids."""
    out = []
    gid = 0
    for m in re.finditer(r"\{([^}]*)\}|\*([^*]*)\*|([^{*]+)", text):
        if m.group(1) is not None:
            gid += 1
            for t in m.group(1).split():
                out.append((t, "acc", gid))
        elif m.group(2) is not None:
            gid += 1
            for t in m.group(2).split():
                out.append((t, "str", gid))
        else:
            for t in m.group(3).split():
                out.append((t, "", 0))
    return out


def word_times(tokens, step=0.2, pause=0.32):
    """Reading rhythm for on-screen kinetic text (no narration): one word every `step`
    seconds, plus a pause after sentence-final punctuation."""
    times = []
    t = 0.0
    for tok, _, _ in tokens:
        times.append(round(t, 3))
        t += step
        if SENTENCE_END.search(tok):
            t += pause
    return times, round(t, 3)


def _word_span(tok, t, style, ltr=False):
    cls = "w" + (" s-str" if style in ("acc", "str") else "")
    d = "ltr" if ltr else "rtl"
    return f'<span class="{cls}" dir="{d}" data-t="{t:.3f}">{esc(tok)}</span>'


PHRASE_END = re.compile(r"[.,:;!?]$")
PUNCT_ONLY = re.compile(r"^[.,:;!?]+$")


def group_times(tokens, gstep=0.8, wstep=0.05, max_words=7):
    """Phrase-group rhythm: words of a phrase spring in together (small stagger), phrases
    arrive gstep apart, so a paragraph is complete early and stays readable longer."""
    times, g, i_in, t = [], 0, 0, 0.0
    for k, (tok, _, _) in enumerate(tokens):
        times.append(round(g * gstep + i_in * wstep, 3))
        i_in += 1
        if PHRASE_END.search(tok) or i_in >= max_words:
            if k < len(tokens) - 1:
                g += 1
            i_in = 0
    return times, round(times[-1] + 0.4 if times else 0.0, 3)


def phrase_index(text):
    """Explanation phrases. '|' in the text marks a phrase break (it is not shown).
    Without markers: break after phrase-final punctuation (at least 3 words in the phrase)
    or after 9 words, never inside an accent/strong group.
    Returns (clean_text, per-token phrase index)."""
    if "|" in text:
        parts = [p.strip() for p in text.split("|") if p.strip()]
        clean = " ".join(parts)
        idx = []
        for i, part in enumerate(parts):
            idx += [i] * len(parse_marked(part))
        assert len(idx) == len(parse_marked(clean)), "phrase markers split a token"
        return clean, idx
    toks = parse_marked(text)
    idx, p, n = [], 0, 0
    for k, (tok, style, gid) in enumerate(toks):
        idx.append(p)
        n += 1
        inside = (gid and k + 1 < len(toks) and toks[k + 1][2] == gid) or (k + 1 < len(toks) and PUNCT_ONLY.match(toks[k + 1][0]))
        if not inside and k < len(toks) - 1 and ((PHRASE_END.search(tok) and n >= 3) or n >= 9):
            p += 1
            n = 0
    return text, idx


def phrase_times(text, t0, per_word=0.25, base=0.45, lo=1.6, hi=3.1, wstep=0.06):
    """Reading-pace phrase timing: each phrase gets clamp(base + per_word * words) seconds,
    its words spring in wstep apart. Returns (clean_text, times, phrase_idx, starts, end)."""
    clean, idx = phrase_index(text)
    nph = (max(idx) + 1) if idx else 0
    counts = [idx.count(i) for i in range(nph)]
    starts, t = [], t0
    for c in counts:
        starts.append(round(t, 3))
        t += min(hi, max(lo, base + per_word * c))
    seen, times = {}, []
    for p in idx:
        j = seen.get(p, 0)
        seen[p] = j + 1
        times.append(round(starts[p] + j * wstep, 3))
    return clean, times, idx, starts, round(t, 3)


def kinetic_html(text, t0=0.0, step=0.2, pause=0.32, groups=False, times=None, end=None, phrases=None):
    """Build kinetic HTML for a text block. Returns (html, end_time, accent_times).
    times/end: explicit absolute per-token times (then t0/step/groups are ignored).
    phrases: per-token phrase index; each phrase is wrapped in <span class="ph" data-p>."""
    tokens = parse_marked(text)
    glue = [bool(PUNCT_ONLY.match(t)) and i > 0 for i, (t, _, _) in enumerate(tokens)]
    if times is None:
        if groups:
            times, end = group_times(tokens, **(groups if isinstance(groups, dict) else {}))
        else:
            times, end = word_times(tokens, step, pause)
            times = [t0 + t for t in times]
        end = t0 + end
    times = list(times)
    for i, g in enumerate(glue):
        if g:
            times[i] = times[i - 1]

    # 1) split into runs: islands of consecutive non-Hebrew tokens
    items = []  # each: ('w', idx) or ('isl', [idx...])
    i = 0
    n = len(tokens)
    while i < n:
        if not has_heb(tokens[i][0]):
            j = i
            while j < n and not has_heb(tokens[j][0]) and tokens[j][2] == tokens[i][2]:
                j += 1
            run = list(range(i, j))
            if len(run) >= 2 or NEG_NUM_TOKEN.match(tokens[i][0]):
                items.append(("isl", run))
            else:
                items.append(("w", i))
            i = j
        else:
            items.append(("w", i))
            i += 1

    # 2) emit, grouping accent/strong phrases into one inline-block with a single underline
    parts = []
    accent_times = []
    k = 0
    while k < len(items):
        kind, val = items[k]
        first_idx = val if kind == "w" else val[0]
        style, gid = tokens[first_idx][1], tokens[first_idx][2]
        if style in ("acc", "str") and gid:
            # collect all items of this group
            grp = []
            while k < len(items):
                kk, vv = items[k]
                fi = vv if kk == "w" else vv[0]
                if tokens[fi][2] != gid:
                    break
                grp.append(items[k])
                k += 1
            inner = " ".join(_emit(it, tokens, times) for it in grp)
            gfirst = grp[0][1] if grp[0][0] == "w" else grp[0][1][0]
            tg = times[gfirst]
            if style == "acc":
                accent_times.append(tg)
                parts.append((gfirst,
                    f'<span class="accgrp" data-t="{tg:.3f}">{inner}'
                    f'<i class="ul" data-t="{tg + 0.18:.3f}"></i></span>'
                ))
            else:
                parts.append((gfirst, f'<span class="strgrp">{inner}</span>'))
            continue
        parts.append((first_idx, _emit(items[k], tokens, times)))
        k += 1
    if phrases is None:
        return "".join(("" if (k == 0 or glue[i0]) else " ") + h for k, (i0, h) in enumerate(parts)), end, accent_times
    out, cur = [], None
    for i0, h in parts:
        ph = phrases[i0]
        if ph != cur:
            if cur is not None:
                out.append("</span> ")
            out.append(f'<span class="ph" data-p="{ph}">')
            cur = ph
        elif not glue[i0]:
            out.append(" ")
        out.append(h)
    if cur is not None:
        out.append("</span>")
    return "".join(out), end, accent_times


def _emit(item, tokens, times):
    kind, val = item
    if kind == "w":
        tok, style, _ = tokens[val]
        return _word_span(tok, times[val], style)
    # island: move trailing punctuation of the last token outside the LTR island
    idxs = val
    last_tok = tokens[idxs[-1]][0]
    suffix = ""
    m = TRAIL_PUNCT.match(last_tok)
    if m and m.group(1):
        last_tok, suffix = m.group(1), m.group(2)
    words = []
    for j, ix in enumerate(idxs):
        tok = tokens[ix][0] if j < len(idxs) - 1 else last_tok
        words.append(_word_span(tok, times[ix], tokens[ix][1], ltr=True))
    out = f'<span class="isl" dir="ltr">{" ".join(words)}</span>'
    if suffix:
        out += f'<span class="w" dir="rtl" data-t="{times[idxs[-1]]:.3f}">{esc(suffix)}</span>'
    return out


# ---------------------------------------------------------------- prompt cards
SECTION_TAG = re.compile(r"^<(/?)(קלט|כיוון|בנייה|מלכודות|התחלה)>$")
NEG_IN_TEXT = re.compile(r"(?<![\w\-/=])(-\d[\d.,]*(?:\s?(?:LUFS|dBTP|dBFS|dB|Hz|kHz|ms))?)")


PREFIX_HYPHEN = re.compile(r"(?<![\w\u0590-\u05FF])([\u05D0-\u05EA]{1,3}-[^\s]+)")


def _nobreak_prefix(s_escaped):
    """A Hebrew prefix joined to the next word with a hyphen ("מ-Google", "ל-940") never
    breaks across lines."""
    return PREFIX_HYPHEN.sub(lambda m: f'<span class="nb">{m.group(1)}</span>', s_escaped)


def _inline_text(s):
    """Escape plain prompt text, isolate negative numbers (bidi), keep prefix-hyphen words whole."""
    out = []
    last = 0
    for m in NEG_IN_TEXT.finditer(s):
        out.append(_nobreak_prefix(esc(s[last:m.start()])))
        out.append(f'<span dir="ltr" class="neg">{esc(m.group(1))}</span>')
        last = m.end()
    out.append(_nobreak_prefix(esc(s[last:])))
    return "".join(out)


INLINE_CODE_MAX = 26


def _code_tokens(seg):
    """Code tokens are unbreakable (no break inside "--language" or "data-has-audio");
    a flag and its value ("--language he") stay together on one line."""
    toks = seg.split(" ")
    groups, i = [], 0
    while i < len(toks):
        tok = toks[i]
        if tok.startswith("-") and i + 1 < len(toks) and toks[i + 1] and not toks[i + 1].startswith("-"):
            groups.append(tok + "\u00a0" + toks[i + 1])
            i += 2
        else:
            groups.append(tok)
            i += 1
    return " ".join(f'<span class="tk">{esc(g)}</span>' for g in groups)


def prompt_line_html(line):
    """One verbatim prompt line. Backtick code stays verbatim (backticks shown, muted).
    Short code is an inline LTR isolate and punctuation after it stays outside, so it lands
    after the code in RTL reading order. Long code gets its own LTR line, with the
    punctuation that follows it kept inside, right after the closing backtick."""
    segs = line.split("`")
    out = []
    for i in range(len(segs)):
        seg = segs[i]
        if i % 2 == 1 and i < len(segs) - 1:
            bt = '<span class="bt">`</span>'
            if len(seg) <= INLINE_CODE_MAX:
                out.append(f'<span class="code" dir="ltr">{bt}{_code_tokens(seg)}{bt}</span>')
            else:
                nxt = segs[i + 1]
                m = re.match(r"^[.,:;!?]+", nxt)
                trail = m.group(0) if m else ""
                segs[i + 1] = nxt[len(trail):].lstrip(" ")
                out.append(f'<span class="codeblock" dir="ltr">{bt}{_code_tokens(seg)}{bt}{esc(trail)}</span>')
        elif i % 2 == 1:
            out.append(_inline_text("`" + seg))
        else:
            out.append(_inline_text(seg))
    return "".join(out)


def prompt_html(text, highlights=()):
    """Verbatim prompt as lines. Returns (html, sections, hl_ids).
    highlights: substrings; the first line containing each gets an id hl{n}."""
    lines = text.split("\n")
    out = []
    sections = []
    hl_ids = []
    used = set()
    for li, ln in enumerate(lines):
        if not ln.strip():
            out.append('<div class="pl pl-empty"></div>')
            continue
        m = SECTION_TAG.match(ln.strip())
        if m:
            sec = m.group(2)
            closing = bool(m.group(1))
            attrs = f' data-sec="{sec}"' if not closing else ""
            if not closing:
                sections.append(sec)
            out.append(f'<div class="pl ptag{" pclose" if closing else ""}" dir="rtl"{attrs}>{esc(ln)}</div>')
            continue
        hid = ""
        for hi, sub in enumerate(highlights):
            if hi in used:
                continue
            if sub in ln:
                hid = f"hl{hi + 1}"
                used.add(hi)
                hl_ids.append(hid)
                break
        idattr = f' data-hl="{hid}"' if hid else ""
        bg = '<i class="hlbg"></i>' if hid else ""
        out.append(f'<div class="pl" dir="rtl"{idattr}>{bg}{prompt_line_html(ln)}</div>')
    missing = [h for i, h in enumerate(highlights) if i not in used]
    if missing:
        raise ValueError(f"highlight substrings not found: {missing}")
    return "\n".join(out), sections, hl_ids
