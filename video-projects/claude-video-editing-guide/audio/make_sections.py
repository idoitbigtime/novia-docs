#!/usr/bin/env python3
"""Music sections from the video plan: one section per chapter, a musical lift on each chapter card."""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "src"))
import build
ENERGY = {"hook": 0.55, "c1": 0.42, "c2": 0.48, "c3": 0.58, "c4": 0.5, "c5": 0.46, "c6": 0.46, "c7": 0.5, "c8": 0.55}
plan = build.plan()
total = plan[-1][2] + plan[-1][3]
starts = [(sid, st) for sid, c, st, d, ok in plan if sid in ENERGY]
secs = []
for i, (sid, st) in enumerate(starts):
    end = starts[i + 1][1] if i + 1 < len(starts) else total
    secs.append({"name": sid, "start": round(st, 3), "end": round(end, 3), "energy": ENERGY[sid], "lift": sid not in ("hook",)})
out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "audio/build/sections.json")
out.write_text(json.dumps(secs, indent=1))
print(out, len(secs), "sections, total", round(total, 2))
