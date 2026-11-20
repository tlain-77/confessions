#!/bin/bash
# 换一种降噪力度重做一遍（时间轴不变）：输入单声道 44.1k → 分 240 秒块用 DeepFilterNet3 降噪（限 LIM dB）→ voice.py
# → rec/part{N}_clean{LIM}.wav。prep_rec.sh 默认限 18 dB；限 35 dB 能把句尾的房间混响尾巴多压掉十几 dB，说话本身不变。
# 用法：bash audio/prep_df.sh 输入.wav N LIM
set -e
cd "$(dirname "$0")/.."
SRC=$1; N=$2; LIM=$3; CK=out/dfchunks${N}_$LIM
mkdir -p $CK
ffmpeg -v error -y -i "$SRC" -f segment -segment_time 240 -c copy $CK/c%02d.wav
: > $CK/list.txt
for f in $CK/c[0-9][0-9].wav; do
  o=${f%.wav}_df.wav
  [ -f $o ] || models/dfvenv/bin/python audio/denoise.py $f $o $LIM
  echo "file '$(basename $o)'" >> $CK/list.txt
done
ffmpeg -v error -y -f concat -safe 0 -i $CK/list.txt -c copy rec/part${N}_df$LIM.wav
python3 audio/voice.py rec/part${N}_df$LIM.wav rec/part${N}_clean$LIM.wav
ffprobe -v error -show_entries format=duration -of csv=p=0 rec/part${N}_clean$LIM.wav
echo PREPDONE
