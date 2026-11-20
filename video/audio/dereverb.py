"""去混响（WPE，加权预测误差法；单声道）：房间的混响是“之前的声音晚到的回声”，可以用前面几十到一百多毫秒的频谱
线性预测出来；把预测出来的那一部分减掉，剩下的就是直达声。只减晚到的（delay 帧以后），说话本身的音色基本不动；
时间轴一个采样都不动，所以画面、字幕不用改。
用法：python3 audio/dereverb.py 输入.wav 输出.wav [taps=10] [delay=3] [iterations=3]
做法同 Nakatani 等（2010）、nara_wpe 的 wpe_v8：逐频率求预测滤波器，用目标信号功率做权重，迭代 3 次。
"""
import sys
import numpy as np, soundfile as sf
from scipy.signal import stft, istft

src, out = sys.argv[1], sys.argv[2]
K = int(sys.argv[3]) if len(sys.argv) > 3 else 10          # 预测用的帧数（taps）
D = int(sys.argv[4]) if len(sys.argv) > 4 else 3           # 跳过最近的几帧（这几帧算直达声和早期反射，不去）
ITER = int(sys.argv[5]) if len(sys.argv) > 5 else 3
x, sr = sf.read(src, dtype='float64'); x = x.mean(1) if x.ndim > 1 else x
N = 1024 if sr >= 32000 else 512; H = N // 4                # 48k：21 ms 一帧、5.3 ms 一跳；10 帧 taps + 3 帧 delay ≈ 16–70 ms 以后的回声
f, t, Y = stft(x, sr, window='hann', nperseg=N, noverlap=N - H, boundary='zeros', padded=True)
F, T = Y.shape
X = Y.copy()
eps = 1e-10
for k in range(F):
    y = Y[k]
    # 延迟过的历史帧矩阵：第 t 帧用 y[t-D], y[t-D-1], ..., y[t-D-K+1]
    Yt = np.zeros((T, K), complex)
    for j in range(K):
        s = D + j
        Yt[s:, j] = y[:T - s]
    xk = y
    for _ in range(ITER):
        lam = np.maximum(np.abs(xk) ** 2, eps)
        w = 1 / lam
        R = (Yt.conj().T * w) @ Yt                              # K×K
        P = (Yt.conj().T * w) @ y                               # K
        g = np.linalg.solve(R + eps * np.eye(K), P)
        xk = y - Yt @ g
    X[k] = xk
_, z = istft(X, sr, window='hann', nperseg=N, noverlap=N - H, boundary=True)
z = z[:len(x)]
if len(z) < len(x): z = np.pad(z, (0, len(x) - len(z)))
peak = np.abs(z).max()
if peak > 0.99: z *= 0.99 / peak
sf.write(out, z.astype(np.float32), sr, subtype='PCM_16')
print(f'wrote {out}: {len(z) / sr:.2f}s  taps {K} delay {D} iter {ITER}')
