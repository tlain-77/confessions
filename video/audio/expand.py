"""让声音“干”一点：向下扩展（downward expander）。说话时一点不动；一句话说完、声音落到比说话低 THR 分贝以下的那段
混响尾巴和房间底噪，按 1:RATIO 再往下压（最多压 MAXDB）。增益起得快（2 毫秒，不吃字头）、落得慢（先保持 40 毫秒、
再用 80 毫秒落下，不吃字尾）。时间轴不动。
用法：python3 audio/expand.py 输入.wav 输出.wav [THR=22] [RATIO=2.5] [MAXDB=18]
"""
import sys
import numpy as np, soundfile as sf
from scipy.ndimage import maximum_filter1d

src, out = sys.argv[1], sys.argv[2]
THR = float(sys.argv[3]) if len(sys.argv) > 3 else 22.0
RATIO = float(sys.argv[4]) if len(sys.argv) > 4 else 2.5
MAXDB = float(sys.argv[5]) if len(sys.argv) > 5 else 18.0
x, sr = sf.read(src, dtype='float64'); mono = x.mean(1) if x.ndim > 1 else x
hop = sr // 1000                                                    # 1 毫秒一格
n = len(mono) // hop
e = np.sqrt(np.convolve(mono[:n * hop] ** 2, np.ones(hop * 10) / (hop * 10), 'same')[::hop][:n]) + 1e-9   # 10 毫秒 RMS
db = 20 * np.log10(e)
speech = np.percentile(db, 90)
thr = speech - THR
db = maximum_filter1d(db, 40)                                       # 保持 40 毫秒：字尾那一点不被压
g = np.where(db < thr, np.maximum(-(thr - db) * (RATIO - 1), -MAXDB), 0.0)
# 起得快、落得慢：增益往上（开口）用 2 毫秒，往下（收尾）用 80 毫秒
sm = np.empty(n); cur = 0.0
au, ad = 1 - np.exp(-1 / 2.0), 1 - np.exp(-1 / 80.0)
for i in range(n):
    a = au if g[i] > cur else ad
    cur += (g[i] - cur) * a; sm[i] = cur
lin = 10 ** (np.interp(np.arange(len(mono)), np.arange(n) * hop + hop / 2, sm) / 20)
y = (x.T * lin).T if x.ndim > 1 else x * lin
sf.write(out, y.astype(np.float32), sr, subtype='PCM_16')
print(f'wrote {out}: speech {speech:.1f} dB, expand below {thr:.1f} dB at 1:{RATIO}, max -{MAXDB} dB; '
      f'{100 * np.mean(sm < -1):.0f}% of the time pulled down')
