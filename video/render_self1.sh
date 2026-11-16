#!/bin/bash
# 本人录制第一讲：渲染画面，再两遍编码压到 100 MB 以内
cd "$(dirname "$0")"; set -e
mkdir -p out/chunks_self1 "../本人录制"
[ -f out/chunks_self1/all.mp4 ] || { PAGE=self1.html node render.mjs --fps 60 --workers 3 --crf 16 --audio none --out out/chunks_self1/all.tmp.mp4 2>&1 | grep -v "^  \|warning"; mv out/chunks_self1/all.tmp.mp4 out/chunks_self1/all.mp4; }
rm -rf out/frames
D=$(python3 -c "import json;print(json.load(open('out/self1_data.json'))['total'])")
VB=$(python3 -c "print(min(6000, int(95e6*8/$D/1000 - 128 - 8)))"); echo "video kbps $VB"
cd out/chunks_self1
ffmpeg -v error -y -i all.mp4 -c:v libx264 -preset slow -b:v ${VB}k -pass 1 -pix_fmt yuv420p -x264-params aq-mode=3 -an -f null /dev/null
ffmpeg -v error -y -i all.mp4 -i ../self1_mix.wav -map 0:v -map 1:a -c:v libx264 -preset slow -b:v ${VB}k -pass 2 -pix_fmt yuv420p -profile:v high -x264-params aq-mode=3 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a 128k -shortest -movflags +faststart "../../../本人录制/01-第一讲-开头与这本书不好读（本人录制）.mp4"
ls -la "../../../本人录制/"
echo ALLDONE
