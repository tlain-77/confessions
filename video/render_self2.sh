#!/bin/bash
# 本人录制第一讲（下半）：两页动画，分 5 段输出，每段两遍编码压在 100 MB 以内
cd "$(dirname "$0")"; set -e
OUTD="../本人录制"; mkdir -p "$OUTD" out/ck2
part() {  # page from to name isfirst islast
  local P=$1 A=$2 B=$3 N=$4 FIRST=$5 LAST=$6 i=0 t=$2
  [ -f "$OUTD/$N.mp4" ] && return
  : > out/ck2/list_$N.txt
  while python3 -c "import sys; sys.exit(0 if $t < $B - 0.01 else 1)"; do
    local u=$(python3 -c "print(min($B, $t + 240))")
    local f=out/ck2/${P}_${t}.mp4
    [ -f $f ] || { PAGE=$P.html node render.mjs --fps 60 --workers 3 --crf 16 --from $t --to $u --audio none --out $f.tmp.mp4 2>&1 | grep -v "^  \|warning"; mv $f.tmp.mp4 $f; rm -rf out/frames; }
    echo "file '$(basename $f)'" >> out/ck2/list_$N.txt; t=$u
  done
  (cd out/ck2 && ffmpeg -v error -y -f concat -safe 0 -i list_$N.txt -c copy all_$N.mp4)
  local D=$(python3 -c "print(round($B - $A, 3))")
  local VB=$(python3 -c "print(min(8000, int(95e6*8/$D/1000 - 128 - 8)))"); echo "$N dur $D video kbps $VB"
  local VF="format=yuv420p"; [ $FIRST = 0 ] && VF="fade=t=in:st=0:d=0.5,$VF"; [ $LAST = 0 ] && VF="fade=t=out:st=$(python3 -c "print($D-0.5)"):d=0.5,$VF"
  local AF="afade=t=in:st=0:d=0.15,afade=t=out:st=$(python3 -c "print($D-0.4)"):d=0.4"
  (cd out/ck2 && ffmpeg -v error -y -i all_$N.mp4 -vf "$VF" -c:v libx264 -preset slow -b:v ${VB}k -pass 1 -passlogfile p_$N -x264-params aq-mode=3 -an -f null /dev/null && \
   ffmpeg -v error -y -i all_$N.mp4 -ss $A -to $B -i ../${P}_mix.wav -map 0:v -map 1:a -vf "$VF" -af "$AF" -c:v libx264 -preset slow -b:v ${VB}k -pass 2 -passlogfile p_$N -profile:v high -x264-params aq-mode=3 \
     -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a 128k -shortest -movflags +faststart "../../$OUTD/$N.mp4")
  ls -la "$OUTD/$N.mp4"
}
part self2a 0 362.81 "02-第一讲-奥古斯丁这个人（上）" 1 0
part self2a 362.81 621.05 "03-第一讲-奥古斯丁这个人（中）" 0 0
part self2a 621.05 859.42 "04-第一讲-奥古斯丁这个人（下）" 0 1
part self2b 0 215.18 "05-第一讲-他为什么这样写（上）" 1 0
part self2b 215.18 566.81 "06-第一讲-他为什么这样写（下）" 0 1
echo ALLDONE
