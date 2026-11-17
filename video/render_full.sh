#!/bin/bash
# 本人录制第一讲（下半）：整段做成一个视频，不分段。
# 两个页面（奥古斯丁这个人 / 他为什么这样写）各自按 ≤240 秒分块渲染（30fps），
# 第一页在“下一讲”片尾出现之前切掉，画面淡入第二页的片头；声音首尾相接，各带一点淡入淡出。
set -e
cd "$(dirname "$0")"
CK=out/ck3; mkdir -p $CK
NAME="02-第一讲-奥古斯丁这个人与他为什么这样写（本人录制）"
OUT="../本人录制/$NAME.mp4"
AEND=853.1; BEND=566.81; XF=0.8
render() { P=$1; FROM=$2; TO=$3; t=$FROM; : > $CK/list_$P.txt
  while python3 -c "import sys; sys.exit(0 if $t < $TO - 0.01 else 1)"; do
    u=$(python3 -c "print(round(min($t + 240, $TO), 2))"); f=$CK/${P}_$t.mp4
    [ -f $f ] || { PAGE=$P.html node render.mjs --fps 30 --workers 4 --crf 14 --from $t --to $u --audio none --out $f.tmp.mp4 2>&1 | grep -v "^  \|warning"; mv $f.tmp.mp4 $f; }
    echo "file '$(basename $f)'" >> $CK/list_$P.txt; t=$u; done
  (cd $CK && ffmpeg -v error -y -f concat -safe 0 -i list_$P.txt -c copy all_$P.mp4); }
render self2a 0 $AEND
render self2b 0 $BEND
calc() { python3 -c "print(round($1, 3))"; }
OFF=$(calc "$AEND - $XF"); TOT=$(calc "$AEND + $BEND - $XF"); AA=$(calc "$AEND - 0.4")
ffmpeg -v error -y -i $CK/all_self2a.mp4 -i $CK/all_self2b.mp4 -i out/self2a_mix.wav -i out/self2b_mix.wav -filter_complex "\
[0:v]trim=0:$AEND,setpts=PTS-STARTPTS,format=yuv420p,fps=30[va];[1:v]setpts=PTS-STARTPTS,format=yuv420p,fps=30[vb];\
[va][vb]xfade=transition=fade:duration=$XF:offset=$OFF,fade=t=in:st=0:d=0.6,fade=t=out:st=$(calc "$TOT - 0.9"):d=0.9[v];\
[2:a]atrim=0:$AA,asetpts=PTS-STARTPTS,afade=t=in:d=0.15,afade=t=out:st=$(calc "$AA - 0.5"):d=0.5[aa];\
[3:a]atrim=start=0.4,asetpts=PTS-STARTPTS,afade=t=in:d=0.3[ab];\
[aa][ab]concat=n=2:v=0:a=1,afade=t=out:st=$(calc "$TOT - 1.2"):d=1.2[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 20 -maxrate 8M -bufsize 16M -pix_fmt yuv420p -profile:v high -x264-params aq-mode=3 \
  -c:a aac -b:a 128k -ar 48000 -movflags +faststart "$OUT"
ls -la "$OUT"; ffprobe -v error -show_entries format=duration,size -of csv=p=0 "$OUT"
echo ALLDONE
