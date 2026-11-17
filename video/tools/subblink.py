"""数字幕“闪”了几次：看画面底部字幕那一条的亮度，暗下去又在 0.5 秒内亮回来，就算闪一次。
用法：python3 tools/subblink.py 视频.mp4
"""
import subprocess, sys
import numpy as np
src = sys.argv[1]
raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', src, '-vf', 'crop=1300:70:310:975,scale=260:14:flags=area,format=gray', '-f', 'rawvideo', '-'])
F = np.frombuffer(raw, np.uint8).reshape(-1, 14, 260).astype(np.float32)
# 字幕笔画是亮的：取最亮的 3% 像素的平均，代表“字有多亮”
v = np.sort(F.reshape(len(F), -1), axis=1)[:, -110:].mean(axis=1)
base = np.percentile(v, 1)
blinks, i, n = [], 1, len(v)
while i < n - 1:
    ref = v[max(0, i - 8):i].max()
    if ref - base > 25 and v[i] < base + (ref - base) * 0.45:         # 字暗下去（只剩不到一半）
        j = i
        while j < min(n, i + 15) and v[j] < base + (ref - base) * 0.8: j += 1
        if j < min(n, i + 15):                                          # 0.5 秒内又亮回来
            blinks.append(i / 30); i = j; continue
    i += 1
print(f'{src}: {n} frames, subtitle blinks (dark then back within 0.5s): {len(blinks)}')
print('  first few at:', [round(b, 1) for b in blinks[:25]])
