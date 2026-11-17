#!/bin/bash
# 本人录音的前处理：源文件 → rec/part{N}.wav（单声道 44.1k）→ 分 240 秒块用 DeepFilterNet3 降噪（限 18 dB）→ rec/part{N}_df18.wav
# → audio/voice.py 去低频、轻压缩、统一响度 → rec/part{N}_clean.wav
# 用法：bash audio/prep_rec.sh 源文件 N
set -e
cd "$(dirname "$0")/.."
SRC=$1; N=$2; CK=out/dfchunks$N
mkdir -p $CK
ffmpeg -v error -y -i "$SRC" -af "pan=mono|c0=0.5*c0+0.5*c1" -ar 44100 rec/part$N.wav 2>/dev/null || ffmpeg -v error -y -i "$SRC" -ac 1 -ar 44100 rec/part$N.wav
ffmpeg -v error -y -i rec/part$N.wav -f segment -segment_time 240 -c copy $CK/c%02d.wav
: > $CK/list.txt
for f in $CK/c[0-9][0-9].wav; do
  o=${f%.wav}_df.wav
  [ -f $o ] || models/dfvenv/bin/python audio/denoise.py $f $o 18
  echo "file '$(basename $o)'" >> $CK/list.txt
done
ffmpeg -v error -y -f concat -safe 0 -i $CK/list.txt -c copy rec/part${N}_df18.wav
python3 audio/voice.py rec/part${N}_df18.wav rec/part${N}_clean.wav
ffprobe -v error -show_entries format=duration -of csv=p=0 rec/part${N}_clean.wav
echo PREPDONE
