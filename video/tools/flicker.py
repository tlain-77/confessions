"""找视频里“闪一下”的帧：某一帧（或两帧）跟前后都差很多，而前后两帧彼此却很像。
用法：python3 tools/flicker.py 视频.mp4 [输出.json]
"""
import json, subprocess, sys
import numpy as np

W, H = 160, 90
src = sys.argv[1]
fps = float(eval(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', src]).decode().strip()))
raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'scale={W}:{H}:flags=area,format=gray', '-f', 'rawvideo', '-'])
F = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.int16)
n = len(F)
d = lambda a, b: np.abs(F[a] - F[b]).mean(axis=(1, 2))
i = np.arange(1, n - 1)
d_prev, d_next, d_skip = d(i, i - 1), d(i, i + 1), d(i - 1, i + 1)
# k 帧的“闪”：t..t+k-1 跟 t-1、t+k 都不一样，而 t-1 和 t+k 很像（k=1..10）
ev = []
for k in range(1, 11):
    j = np.arange(1, n - k)
    a, b = d(j, j - 1), d(j + k - 1, j + k)
    sc = np.minimum(a, b) - d(j - 1, j + k)
    for q in np.argsort(-sc)[:300]:
        if sc[q] < 0.8: break
        ev.append({'t': round(j[q] / fps, 3), 'frame': int(j[q]), 'score': round(float(sc[q]), 2), 'len': k})
ev.sort(key=lambda e: -e['score'])
# 同一处只留一条
out = []
for e in ev:
    if all(abs(e['t'] - o['t']) > 0.6 for o in out): out.append(e)
# 亮度突跳（整体变亮/变暗再回来）
Y = F.mean(axis=(1, 2))
print(f'{src}: {n} frames, {n / fps:.1f}s; flash events (score>0.8): {len(out)}')
for e in out[:60]:
    print(f"  t={e['t']:8.3f}s  frame {e['frame']:6d}  len {e['len']}  score {e['score']:5.2f}  Y {Y[e['frame'] - 1]:.1f}->{Y[e['frame']]:.1f}->{Y[e['frame'] + e['len']]:.1f}")
if len(sys.argv) > 2: json.dump(out, open(sys.argv[2], 'w'), indent=1)
