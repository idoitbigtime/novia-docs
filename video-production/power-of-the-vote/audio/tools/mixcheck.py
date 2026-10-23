import numpy as np, json, sys
from scipy.io import wavfile
from scipy import signal
d = sys.argv[1]
sr, b = wavfile.read(d + '/bed.wav'); b = b.astype(float).mean(axis=1) / 32768
sr, v = wavfile.read(d + '/voice_only.wav'); v = v.astype(float)[:, 0] / 32768
sos = signal.butter(4, [300, 4000], 'band', fs=sr, output='sos'); bm = signal.sosfilt(sos, b); vm = signal.sosfilt(sos, v)
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
words = json.load(open(sys.argv[2]))['words']
segs = {}
for w in words: segs.setdefault(w['seg'], []).append(w)
worst = []
for k, ws in segs.items():
    a, c = int(ws[0]['s'] * sr), int(ws[-1]['e'] * sr)
    snr = db(vm[a:c]) - db(bm[a:c]); full = db(v[a:c]) - db(b[a:c])
    worst.append((snr, ws[0]['s'], ' '.join(x['w'] for x in ws)[:40], full))
worst.sort()
print("speech-band SNR (voice minus bed, dB) — lowest 10 phrases:")
for snr, t, txt, full in worst[:10]: print(f"  {t:7.2f}s  mid {snr:5.1f}  full {full:5.1f}  {txt}")
print("median mid SNR", np.median([w[0] for w in worst]))
# loudest bed moments in pauses
