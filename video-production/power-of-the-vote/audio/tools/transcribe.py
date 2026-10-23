import json, sys
from faster_whisper import WhisperModel
audio, out, model_id = sys.argv[1], sys.argv[2], sys.argv[3]
m = WhisperModel(model_id, device="cpu", compute_type="int8", cpu_threads=4)
from scipy.io import wavfile
sr, a = wavfile.read(audio)
import numpy as np
a = a.astype(np.float32) / 32768.0
segs, info = m.transcribe(a, language="he", word_timestamps=True, beam_size=5, vad_filter=False)
res = []
for s in segs:
    res.append({"start": s.start, "end": s.end, "text": s.text,
                "words": [{"w": w.word, "s": w.start, "e": w.end, "p": w.probability} for w in s.words]})
    print(f"{s.start:7.2f}-{s.end:7.2f} {s.text}", flush=True)
json.dump(res, open(out, "w"), ensure_ascii=False, indent=1)
