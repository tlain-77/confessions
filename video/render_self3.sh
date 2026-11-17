#!/bin/bash
# 本人录制 · 第一讲 · 翻开第一页：整段做成一个视频，不分段。
# 按 240 秒分块渲染（30fps，中间文件 crf 14），接起来，配上人声 + 配乐（out/self3_mix.wav），
# 两遍编码把整片压在 395 MB 左右（画质优先；比 100 MB 大，仓库里用 Git LFS 存）。
set -e
cd "$(dirname "$0")"
CK=out/ck5; mkdir -p $CK
NAME="03-第一讲-翻开第一页（本人录制）"
OUT="../本人录制/$NAME.mp4"
TOT=$(python3 -c "import json;print(json.load(open('out/self3_data.json'))['total'])")
t=0; : > $CK/list.txt
while python3 -c "import sys; sys.exit(0 if $t < $TOT - 0.01 else 1)"; do
  u=$(python3 -c "print(round(min($t + 240, $TOT), 2))"); f=$CK/self3_$t.mp4
  [ -f $f ] || { FRAMES_DIR=out/frames_s3 PAGE=self3.html node render.mjs --fps 30 --workers 4 --crf 14 --from $t --to $u --audio none --out $f.tmp.mp4 2>&1 | grep -v "^  \|warning"; mv $f.tmp.mp4 $f; }
  echo "file '$(basename $f)'" >> $CK/list.txt; t=$u
done
(cd $CK && ffmpeg -v error -y -f concat -safe 0 -i list.txt -c copy all.mp4)
VB=$(python3 -c "print(int(395e6 * 8 / $TOT / 1000 - 128 - 6))"); echo "video kbps $VB"
AF="afade=t=in:d=0.15,afade=t=out:st=$(python3 -c "print(round($TOT - 1.2, 2))"):d=1.2"
X="-c:v libx264 -preset slow -b:v ${VB}k -maxrate 7M -bufsize 14M -pix_fmt yuv420p -profile:v high -x264-params aq-mode=3"
ffmpeg -v error -y -i $CK/all.mp4 $X -pass 1 -passlogfile $CK/p -an -f null /dev/null
ffmpeg -v error -y -i $CK/all.mp4 -i out/self3_mix.wav -map 0:v -map 1:a -af "$AF" $X -pass 2 -passlogfile $CK/p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a 128k -ar 48000 -shortest -movflags +faststart "$OUT.tmp.mp4"
mv "$OUT.tmp.mp4" "$OUT"
ls -la "$OUT"; ffprobe -v error -show_entries format=duration,size -of csv=p=0 "$OUT"
echo ALLDONE
