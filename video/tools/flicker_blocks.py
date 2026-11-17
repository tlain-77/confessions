"""按区域找“闪”：把画面分成 16×9 块，某一块在 k 帧内（k≤8）变了又变回去，就记一次。
能抓到整体平均看不出来的小闪烁（比如字幕一灭一亮、某行字闪一下）。
用法：python3 tools/flicker_blocks.py 视频.mp4 [起始秒 结束秒]
"""
import subprocess, sys
import numpy as np

W, H, BX, BY = 160, 90, 16, 9
src = sys.argv[1]; t0 = float(sys.argv[2]) if len(sys.argv) > 2 else 0; t1 = float(sys.argv[3]) if len(sys.argv) > 3 else 1e9
fps = float(eval(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', src]).decode().strip()))
cmd = ['ffmpeg', '-v', 'error', '-ss', str(t0)] + (['-to', str(t1)] if t1 < 1e8 else []) + ['-i', src, '-vf', f'scale={W}:{H}:flags=area,format=gray', '-f', 'rawvideo', '-']
F = np.frombuffer(subprocess.check_output(cmd), np.uint8).reshape(-1, H, W)
n = len(F)
B = F.reshape(n, BY, H // BY, BX, W // BX).astype(np.float32).mean(axis=(2, 4))      # (n, 9, 16)
ev = []
for k in range(1, 9):
    j = np.arange(1, n - k)
    a = np.abs(B[j] - B[j - 1]); b = np.abs(B[j + k - 1] - B[j + k]); c = np.abs(B[j - 1] - B[j + k])
    sc = (np.minimum(a, b) - c).reshape(len(j), -1)                                   # 每块的分数
    best = sc.max(axis=1); arg = sc.argmax(axis=1)
    for q in np.where(best > 6)[0]:
        ev.append((t0 + j[q] / fps, k, float(best[q]), int(arg[q] // BX), int(arg[q] % BX)))
ev.sort(key=lambda e: -e[2])
out = []
for e in ev:
    if all(abs(e[0] - o[0]) > 0.4 for o in out): out.append(e)
out.sort()
rows = {}
for e in out: rows.setdefault(e[3], []).append(e)
print(f'{src} [{t0:.0f}-{min(t1, t0 + n / fps):.0f}s]: {len(out)} blips')
print('  by grid row (0=top, 8=bottom):', {r: len(v) for r, v in sorted(rows.items())})
for e in out[:400]:
    print(f'  t={e[0]:8.2f}s  len {e[1]}  score {e[2]:5.1f}  block row {e[3]} col {e[4]}')
