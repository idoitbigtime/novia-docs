import json, sys, numpy as np
from scipy.io import wavfile
sr, a = wavfile.read(sys.argv[1]); a = a.astype(np.float32) / 32768.0
asr = json.load(open(sys.argv[2]))
hop = sr // 100  # 10ms
n = len(a) // hop
rms = np.array([np.sqrt(np.mean(a[i*hop:(i+1)*hop] ** 2) + 1e-12) for i in range(n)])
db = 20 * np.log10(rms)
# smoothed
k = np.ones(3) / 3; dbs = np.convolve(db, k, mode="same")
TH = -42
def onset_near(t, win=0.45):
    i0 = max(0, int((t - win) * 100)); i1 = min(n - 1, int((t + win) * 100))
    # find first frame >= TH that follows >=60ms below TH, closest to t
    cands = [i for i in range(i0 + 6, i1) if dbs[i] >= TH and np.all(dbs[i-6:i] < TH)]
    if not cands: return t
    return min(cands, key=lambda i: abs(i / 100 - t)) / 100
def offset_near(t, win=0.4):
    i0 = max(0, int((t - win) * 100)); i1 = min(n - 7, int((t + win) * 100))
    cands = [i for i in range(i0, i1) if dbs[i] >= TH and np.all(dbs[i+1:i+7] < TH)]
    if not cands: return t
    return min(cands, key=lambda i: abs(i / 100 - t)) / 100
words = []
for s in asr:
    ws = s["words"]
    for j, w in enumerate(ws):
        words.append({"w": w["w"].strip(), "s": round(w["s"], 2), "e": round(w["e"], 2), "seg": len([x for x in asr if x["start"] < s["start"]])})
# refine segment first-word onsets and last-word offsets
for seg_i in sorted(set(w["seg"] for w in words)):
    sw = [w for w in words if w["seg"] == seg_i]
    o = onset_near(sw[0]["s"]); f = offset_near(sw[-1]["e"])
    if o != sw[0]["s"]: print(f"seg{seg_i} onset {sw[0]['s']:.2f} -> {o:.2f}  {sw[0]['w']}")
    sw[0]["s"] = o
    if sw[0]["e"] <= o: sw[0]["e"] = o + 0.15
    sw[-1]["e"] = max(f, sw[-1]["s"] + 0.15)
# per-frame (30fps) envelope 0..1
fps = 30; nf = int(np.ceil(len(a) / sr * fps)) + 1
env = []
for f in range(nf):
    i = int(f / fps * 100)
    v = dbs[i] if i < n else -90
    env.append(round(float(np.clip((v + 50) / 40, 0, 1)), 3))
json.dump({"duration": len(a) / sr, "words": words, "env": env}, open(sys.argv[3], "w"), ensure_ascii=False)
print(len(words), "words", nf, "env frames")
