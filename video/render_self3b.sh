#!/bin/bash
# 03（本人录制 · 翻开第一页）逐句换背景版：每块 180 秒分块渲染（已渲好的块跳过，可以断点续跑），最后两遍编码出成片
set -e
cd "$(dirname "$0")"
TOT=$(python3 -c "import json;print(json.load(open('out/self3_data.json'))['total'])")
mkdir -p out/ck7
for s in 0 180 360 540 720 900 1080 1260 1440; do
  f=out/ck7/self3_$s.mp4
  [ -f $f ] && continue
  to=$(python3 -c "print(min($s + 180, $TOT))")
  FRAMES_DIR=out/frames_s3 PAGE=self3.html node render.mjs --fps 30 --workers 4 --crf 16 --from $s --to $to --audio none --out $f.tmp.mp4 2>&1 | grep --line-buffered -v "warning"
  n=$(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 $f.tmp.mp4)
  want=$(python3 -c "print(round($to * 30) - round($s * 30))")
  echo "CHUNK $s frames $n (want $want)"; [ "$n" = "$want" ]
  mv $f.tmp.mp4 $f
done
rm -rf out/frames_s3
python3 tools/encode_self3.py
