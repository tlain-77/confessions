#!/bin/bash
# 第一讲最后一集：分段渲染（避免磁盘不够），再两遍编码压到约 95 MB
cd "$(dirname "$0")"; set -e
mkdir -p out/chunks5
B=(0 240 480 720 960 1193.93)
for i in 0 1 2 3 4; do
  [ -f out/chunks5/p$i.mp4 ] && continue
  PAGE=ep5.html node render.mjs --fps 60 --workers 3 --crf 16 --from ${B[$i]} --to ${B[$((i+1))]} --audio none --out out/chunks5/p$i.tmp.mp4 2>&1 | grep -v "^  \|warning"
  mv out/chunks5/p$i.tmp.mp4 out/chunks5/p$i.mp4
done
rm -rf out/frames
printf "file 'p0.mp4'\nfile 'p1.mp4'\nfile 'p2.mp4'\nfile 'p3.mp4'\nfile 'p4.mp4'\n" > out/chunks5/list.txt
ffmpeg -v error -y -f concat -safe 0 -i out/chunks5/list.txt -c copy out/chunks5/all.mp4
VB=$(python3 -c "print(int(95e6*8/1193.93/1000 - 128 - 8))"); echo "video kbps $VB"
cd out/chunks5
ffmpeg -v error -y -i all.mp4 -c:v libx264 -preset slow -b:v ${VB}k -pass 1 -pix_fmt yuv420p -x264-params aq-mode=3 -an -f null /dev/null
ffmpeg -v error -y -i all.mp4 -i ../ep5_mix.wav -map 0:v -map 1:a -c:v libx264 -preset slow -b:v ${VB}k -pass 2 -pix_fmt yuv420p -profile:v high -x264-params aq-mode=3 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a 128k -shortest -movflags +faststart "../../../样片/07-第一讲-翻开第一页.mp4"
ls -la "../../../样片/07-第一讲-翻开第一页.mp4"
echo ALLDONE
