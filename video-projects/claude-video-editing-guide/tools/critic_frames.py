#!/usr/bin/env python3
"""Standard frame set + contact sheet of one topic scene for the independent critic.
usage: python3 tools/critic_frames.py <out_dir> t41 [t42 ...]
Frames: entry, every phrase beat (start, middle, just before the next), the payoff, the fact,
the prompt card (entry, first and second key line) and the tip. Scene-local times."""
import importlib
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
import build  # noqa: E402
import scenes as SC  # noqa: E402


def times_for(c):
    a = SC.auto_times(c)
    ts = [0.5, a["tStage"] + 0.4]
    phr = a["phr"] + [a["phrEnd"]]
    for i in range(len(phr) - 1):
        p0, p1 = phr[i], phr[i + 1]
        ts += [p0 + 0.35, (p0 + p1) / 2 + 0.2, p1 - 0.12]
    pe, se = a["phrEnd"], a["tSimEnd"]
    ts += [pe + 0.6, (pe + se) / 2, se - 0.6]
    f = a.get("fact")
    nxt = a.get("tPrompt") or a.get("tTip") or a["D"]
    if f:
        ts += [f["t"] + 0.3, nxt - 0.5]
    if a.get("tPrompt") is not None:
        p0, p1 = a["tPrompt"], a["tPromptEnd"]
        ts += [p0 + 0.6, p0 + (p1 - p0) * 0.42, p0 + (p1 - p0) * 0.78]
    if a.get("tTip") is not None:
        ts += [a["tTip"] + 0.5, a["D"] - 0.55]
    return sorted({round(t, 2) for t in ts if 0 <= t < a["D"]})


def main():
    out = ROOT / sys.argv[1]
    for sid in sys.argv[2:]:
        c = build.load_cfg(sid)
        subprocess.run([sys.executable, "build.py", "scene", sid], cwd=ROOT / "src", check=True, capture_output=True)
        ts = times_for(c)
        d = out / sid
        subprocess.run(["rm", "-rf", str(d)])
        r = subprocess.run(["node", "tools/shoot.mjs", f"variants/scene-{sid}.html", str(d)] + [f"{t:.2f}" for t in ts],
                           cwd=ROOT, capture_output=True, text=True, env={"NODE_PATH": "/opt/node22/lib/node_modules", "PATH": "/usr/bin:/bin:/usr/local/bin"})
        err = [l for l in r.stdout.splitlines() if l.startswith("ERRORS")]
        imgs = sorted(d.glob("t_*.png"), key=lambda p: float(p.stem[2:]))
        subprocess.run([sys.executable, "tools/sheet.py", str(out / f"sheet-{sid}.png"), "7", "250"] + [str(p) for p in imgs],
                       cwd=ROOT, check=True, capture_output=True)
        print(sid, len(ts), "frames", err[0] if err else r.stdout[-300:])


if __name__ == "__main__":
    main()
