#!/bin/bash
# 01、02（本人录制）逐句换背景版：每块 180 秒分块渲染（已渲好的块跳过，可以断点续跑），各自两遍编码出成片
# 分块只是中间文件，可以用快一点的编码：CRF=14 PRESET=fast ./render_self12.sh
set -e
cd "$(dirname "$0")"
mkdir -p out/ck8
chunk() {  # 页面 渲到哪一秒
  local P=$1 TO=$2
  for s in $(python3 -c "import math; print(' '.join(str(i * 180) for i in range(math.ceil($TO / 180))))"); do
    local f=out/ck8/${P}_$s.mp4
    [ -f $f ] && continue
    local to=$(python3 -c "print(min($s + 180, $TO))")
    FRAMES_DIR=out/frames_s12 PAGE=$P.html node render.mjs --fps 30 --workers 4 --crf ${CRF:-16} --preset ${PRESET:-slow} --from $s --to $to --audio none --out $f.tmp.mp4 2>&1 | grep --line-buffered -v "warning"
    local n=$(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 $f.tmp.mp4)
    local want=$(python3 -c "print(round($to * 30) - round($s * 30))")
    echo "CHUNK $P $s frames $n (want $want)"; [ "$n" = "$want" ]
    mv $f.tmp.mp4 $f
  done
}
EP=${1:-12}   # ./render_self12.sh 2 只做 02；不带参数 01、02 都做
if [[ $EP == *1* ]]; then chunk self1 301.07; python3 tools/encode_self12.py 1; fi
if [[ $EP == *2* ]]; then chunk self2a 853.1; chunk self2b 566.81; rm -rf out/frames_s12; python3 tools/encode_self12.py 2; fi
echo ALLDONE
