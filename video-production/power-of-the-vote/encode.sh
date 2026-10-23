#!/bin/sh
# Encode rendered frames + audio into the deliverables.
# usage: ./encode.sh <frames_dir> <mix.wav> <voice_only.wav> <out_dir>
set -e
F="$1"; MIX="$2"; VO="$3"; OUT="$4"; mkdir -p "$OUT"
# master for Reels / TikTok / Shorts uploads
ffmpeg -y -framerate 30 -i "$F/f_%05d.jpg" -i "$MIX" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 17 -tune film \
  -pix_fmt yuv420p -profile:v high -level 4.2 -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 320k -ar 48000 -movflags +faststart -metadata title="כולנו יוצאים להצביע" "$OUT/power_of_the_vote_1080x1920.mp4"
# same picture, narration only (no score)
ffmpeg -y -i "$OUT/power_of_the_vote_1080x1920.mp4" -i "$VO" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 \
  -movflags +faststart "$OUT/power_of_the_vote_voice_only.mp4"
# light version for messaging apps (WhatsApp etc.)
ffmpeg -y -i "$OUT/power_of_the_vote_1080x1920.mp4" -vf scale=720:1280:flags=lanczos -c:v libx264 -preset slow -b:v 2800k -maxrate 3500k -bufsize 7000k \
  -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart "$OUT/power_of_the_vote_720x1280_share.mp4"
