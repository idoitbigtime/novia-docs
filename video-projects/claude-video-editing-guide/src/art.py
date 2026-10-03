"""Shared illustration helpers (SVG)."""

def person_svg(cls, uid):
    """Stylised presenter silhouette (illustration, not a real person)."""
    return f"""<svg class="{cls}" viewBox="0 0 312 380" aria-hidden="true">
<defs>
<linearGradient id="pf{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3274"/><stop offset="1" stop-color="#1a1636"/></linearGradient>
<linearGradient id="pr{uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c9c2ff" stop-opacity="0"/><stop offset="0.65" stop-color="#c9c2ff" stop-opacity="0.15"/><stop offset="1" stop-color="#c9c2ff" stop-opacity="0.85"/></linearGradient>
</defs>
<path d="M14 380 C20 300 70 262 120 254 L192 254 C242 262 292 300 298 380 Z" fill="url(#pf{uid})"/>
<rect x="128" y="196" width="56" height="70" rx="22" fill="url(#pf{uid})"/>
<ellipse cx="156" cy="132" rx="58" ry="68" fill="url(#pf{uid})"/>
<path d="M14 380 C20 300 70 262 120 254 L192 254 C242 262 292 300 298 380" fill="none" stroke="url(#pr{uid})" stroke-width="3"/>
<ellipse cx="156" cy="132" rx="58" ry="68" fill="none" stroke="url(#pr{uid})" stroke-width="3"/>
</svg>"""


ARROW_LEFT = ('<svg class="{cls}" viewBox="0 0 46 22" aria-hidden="true"><path d="M44 11 H4 M13 3 L4 11 L13 19" '
              'fill="none" stroke="#c9c2ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>')


