#!/usr/bin/env bash
# Final render: composition -> runtime cues -> music for the final timeline -> mix (-14 LUFS, 2-pass)
# -> 1080x1920 render -> mux -> flash/black scan. Run from the project root.
set -euo pipefail
P="$(cd "$(dirname "$0")/.." && pwd)"
TC=/tmp/claude-0/-home-user-novia-docs/4013a57a-c733-5a44-ada2-7ece195cf96c/scratchpad/toolchain
cd "$P"
export NODE_PATH=/opt/node22/lib/node_modules

echo "== 1. composition"
(cd src && python3 build.py full)
echo "== 2. runtime cues (prompt-card holds)"
node src/runtime_cues.mjs
echo "== 3. music for the final timeline"
python3 audio/make_sections.py audio/build/sections.json
python3 audio/gen_music.py audio/build/sections.json audio/build/music_full.wav | tail -2
echo "== 4. mix"
python3 audio/mix.py audio/build/music_full.wav audio/cues-index.json audio/build/final_audio.wav --extra-cues audio/cues-runtime.json
echo "== 5. render 1080x1920"
source "$TC/env.sh"
hyperframes lint | tail -1
HF_SEGMENTED_CAPTURE=true hyperframes render -c index.html --quality looks --workers 3 -o renders/final-silent.mp4
echo "== 6. mux"
ffmpeg -hide_banner -loglevel error -y -i renders/final-silent.mp4 -i audio/build/final_audio.wav -map 0:v -map 1:a \
  -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest renders/final.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,duration -of compact renders/final.mp4
echo "== 7. scan: single-frame flashes, black frames, jumps"
ffmpeg -hide_banner -nostats -i renders/final.mp4 -vf "scale=270:480,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=renders/final-yavg.txt" -an -f null - 2>/dev/null
python3 - <<'EOF'
import re
ts, ys, t = [], [], None
for line in open("renders/final-yavg.txt"):
    m = re.search(r"pts_time:([\d.]+)", line)
    if m: t = float(m.group(1))
    m = re.search(r"YAVG=([\d.]+)", line)
    if m: ts.append(t); ys.append(float(m.group(1)))
fl = [round(ts[i], 2) for i in range(1, len(ys) - 1) if ys[i] - max(ys[i - 1], ys[i + 1]) > 6]
dk = [round(ts[i], 2) for i in range(len(ys)) if ys[i] < 8]
jp = [round(ts[i], 2) for i in range(1, len(ys)) if abs(ys[i] - ys[i - 1]) > 10]
print("frames", len(ys), "flashes", fl[:10], "black", dk[:10], "jumps", jp[:10])
EOF
echo "== done: renders/final.mp4"
