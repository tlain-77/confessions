#!/bin/bash
# 本人录制 · 第四讲（卷一第四章上）：整段做成一个视频，不分段。
# 按 STEP 秒分块渲染（默认 180；磁盘紧时用 STEP=90 CRF=20：中间的帧和分块都小一半）（30fps；分块只是中间文件，用 crf 16 + fast；已渲好的块跳过，可以断点续跑；每块核对帧数），
# 接起来，配上人声 + 配乐（out/self6_mix.wav），两遍编码把整片压在 395 MB 左右（发送上限 400 MiB，画质优先）。
set -e
cd "$(dirname "$0")"
CK=out/ck12; mkdir -p $CK
NAME="06-第四讲-我的天主你究竟是什么（本人录制）"
OUT="../本人录制/$NAME.mp4"
TOT=$(python3 -c "import json;print(json.load(open('out/self6_data.json'))['total'])")
: > $CK/list.txt
STEP=${STEP:-180}
for s in $(python3 -c "import math; print(' '.join(str(i * $STEP) for i in range(math.ceil($TOT / $STEP))))"); do
  f=$CK/self6_$s.mp4; to=$(python3 -c "print(round(min($s + $STEP, $TOT), 3))")
  if [ ! -f $f ]; then
    FRAMES_DIR=out/frames_s6 PAGE=self6.html node render.mjs --fps 30 --workers 4 --crf ${CRF:-16} --preset ${PRESET:-fast} --from $s --to $to --audio none --out $f.tmp.mp4 2>&1 | grep --line-buffered -v "warning"
    n=$(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 $f.tmp.mp4)
    want=$(python3 -c "print(round($to * 30) - round($s * 30))")
    echo "CHUNK self6 $s frames $n (want $want)"; [ "$n" = "$want" ]
    mv $f.tmp.mp4 $f
  fi
  echo "file '$(basename $f)'" >> $CK/list.txt
done
rm -rf out/frames_s6
N=$(python3 -c "print(round($TOT * 30))")
VB=$(python3 -c "print(int(395e6 * 8 / $TOT / 1000 - 134))"); echo "06: $TOT s, $N frames, video $VB kbps"
AF="afade=t=in:d=0.15,afade=t=out:st=$(python3 -c "print(round($TOT - 1.2, 2))"):d=1.2"
X="-c:v libx264 -preset slow -b:v ${VB}k -maxrate 7M -bufsize 14M -pix_fmt yuv420p -profile:v high -x264-params aq-mode=3"
IN="-f concat -safe 0 -i $CK/list.txt"
[ -n "$SKIP_PASS1" ] && [ -f $CK/p-0.log.mbtree ] || ffmpeg -nostdin -v error -y $IN -vf "fps=30,format=yuv420p" $X -pass 1 -passlogfile $CK/p -an -f null /dev/null
ffmpeg -nostdin -v error -y $IN -i out/self6_mix.wav -map 0:v -map 1:a -vf "fps=30,format=yuv420p" -af "$AF" $X -pass 2 -passlogfile $CK/p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a 128k -ar 48000 -shortest -movflags +faststart "$OUT.tmp.mp4"
mv "$OUT.tmp.mp4" "$OUT"
ls -la "$OUT"; ffprobe -v error -show_entries format=duration,size -of csv=p=0 "$OUT"
echo ALLDONE
