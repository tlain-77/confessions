"""前后两段录音音色不一致时，以后一段为基准，给前一段配一条均衡曲线（再把响度对齐）。
做法：两段各取说话的帧，算长时平均频谱；按 1/3 倍频程平滑后相减，得到每个频段要提要压多少分贝（限 ±12 dB，
整体增益另算、不放在曲线里）；用线性相位 FIR（零相位：时间不移动）滤前一段；最后按说话响度对齐，分界点在停顿里做 60 ms 交叉淡化。
用法：python3 audio/match_eq.py 输入.wav 输出.wav 分界秒数
"""
import sys
import numpy as np, soundfile as sf
from scipy.signal import fftconvolve, firwin2

src, out, T = sys.argv[1], sys.argv[2], float(sys.argv[3])
x, sr = sf.read(src, dtype='float64'); x = x.mean(1) if x.ndim > 1 else x
k = int(T * sr); A, B = x[:k], x[k:]
N = 4096; hop = N // 2; win = np.hanning(N)
fr = np.fft.rfftfreq(N, 1 / sr)

def ltas(s):
    fr_e = [np.sqrt(np.mean(s[i:i + N] ** 2)) for i in range(0, len(s) - N, hop)]
    th = np.percentile(20 * np.log10(np.array(fr_e) + 1e-9), 55)            # 只要说话的帧（比停顿响）
    P = [np.abs(np.fft.rfft(s[i:i + N] * win)) ** 2 for j, i in enumerate(range(0, len(s) - N, hop)) if 20 * np.log10(fr_e[j] + 1e-9) > th]
    return np.mean(P, axis=0), th

PA, thA = ltas(A); PB, thB = ltas(B)
# 1/3 倍频程平滑（再细就会把两段说的内容不同也当成音色差）
def smooth(P):
    out = np.empty_like(P)
    for i, f in enumerate(fr):
        lo, hi = f / 2 ** (1 / 6), f * 2 ** (1 / 6)
        m = (fr >= lo) & (fr <= hi) if f > 0 else (fr <= fr[1])
        out[i] = P[m].mean()
    return out
G = 10 * np.log10(smooth(PB) + 1e-20) - 10 * np.log10(smooth(PA) + 1e-20)
band = (fr >= 300) & (fr <= 3000)
G -= np.average(G[band], weights=1 / np.maximum(fr[band], 1))             # 整体增益不算在曲线里，后面按响度对齐
G = np.clip(G, -12, 12); G[fr < 60] = np.clip(G[fr < 60], -12, 0)           # 60 Hz 以下只许压，不许提（免得把嗡嗡声提上来）
G[fr > 16000] = G[np.argmin(np.abs(fr - 16000))]
for f in [100, 200, 400, 800, 1600, 3200, 5000, 8000, 12000]:
    print(f'  {f:5d} Hz  {G[np.argmin(np.abs(fr - f))]:+5.1f} dB')
# 线性相位 FIR（奇数长度，延迟 (L-1)/2，滤完去掉延迟 → 零相位）
L = 2047
h = firwin2(L, fr / (sr / 2), 10 ** (G / 20), window='hann')
X2 = fftconvolve(x, h)[(L - 1) // 2:(L - 1) // 2 + len(x)]                # 整段都滤一遍（零相位），分界处好做交叉淡化
A2 = X2[:k]
# 按说话响度对齐（前一段滤完后的说话帧 RMS → 后一段）
def speech_rms(s):
    e = np.array([np.sqrt(np.mean(s[i:i + 2048] ** 2)) for i in range(0, len(s) - 2048, 1024)]); db = 20 * np.log10(e + 1e-9)
    return np.sqrt(np.mean(e[db > np.percentile(db, 60)] ** 2))
g = speech_rms(B) / speech_rms(A2); X2 *= g
print(f'level: before {20 * np.log10(speech_rms(A)):.1f} dB → {20 * np.log10(speech_rms(X2[:k])):.1f} dB (after-part {20 * np.log10(speech_rms(B)):.1f} dB), gain {20 * np.log10(g):+.1f} dB')
# 分界点：前面用滤过的、后面用原样的，中间 60 ms 交叉淡化（分界在停顿里）
f = int(0.06 * sr); a0 = k - f // 2; w = np.linspace(0, 1, f)
y = x.copy(); y[:a0] = X2[:a0]; y[a0:a0 + f] = X2[a0:a0 + f] * (1 - w) + x[a0:a0 + f] * w
peak = np.abs(y).max()
if peak > 0.98: y *= 0.98 / peak; print(f'peak limited ({20 * np.log10(peak):+.1f} dBFS)')
sf.write(out, y.astype(np.float32), sr, subtype='PCM_24')
print(f'wrote {out}: {len(y) / sr:.2f}s (split at {T:.2f}s)')
