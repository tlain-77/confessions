"""拼接后对帧检查：最终视频里某一段，是不是正好对上它的来源（中间文件或新渲染的小段），不早不晚。
在这段里挑几帧动得最厉害的（跟前后帧都差得多），拿最终视频的对应帧去跟来源的前一帧 / 同一帧 / 后一帧比，
同一帧必须最像。画面不动的地方错一帧也看不出来，所以只在动的地方查。
用法：python3 tools/aligncheck.py 最终.mp4 来源.mp4 来源起始帧 来源结束帧 最终视频里对应来源第0帧的帧号
"""
import subprocess, sys
import numpy as np
final, src, a, b, off = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
def grab(path, n, count, w=320, h=180):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-ss', f'{max(0, n - 0.5) / 30:.6f}', '-i', path, '-frames:v', str(count), '-vf', f'scale={w}:{h}:flags=area,format=gray', '-f', 'rawvideo', '-'])
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
L = grab(src, a, b - a, 160, 90)
d = np.abs(np.diff(L, axis=0)).mean(axis=(1, 2))           # d[i] = 第 a+i 帧和 a+i+1 帧的差
m = np.minimum(d[:-1], d[1:])                                # 第 a+i+1 帧跟前后都不一样的程度
cand = [int(i) + 1 for i in np.argsort(-m)[:40]]
pick = []
for i in cand:
    if 1 <= i < len(L) - 2 and all(abs(i - j) > 15 for j in pick): pick.append(i)
    if len(pick) == 3: break
bad = 0
for i in pick:
    n = a + i
    F = grab(final, off + n, 1)[0]; S = grab(src, n - 1, 3)
    e = [float(((F - S[k]) ** 2).mean()) for k in range(3)]
    ok = int(np.argmin(e)) == 1 and e[1] < 0.6 * min(e[0], e[2])
    bad += not ok
    print(f'  src frame {n:6d} (motion {m[i - 1]:.2f}): mse prev {e[0]:8.2f}  same {e[1]:8.2f}  next {e[2]:8.2f}  {"ok" if ok else "MISMATCH"}')
if not pick: print('  (no moving frames in this piece — nothing to check)')
print('ALIGN OK' if not bad else f'ALIGN PROBLEMS: {bad}')
