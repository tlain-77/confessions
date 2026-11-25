"""去掉录音里的“滋滋”声：电源的嗡声（50 Hz 和它的一长串谐波，100 Hz 的整数倍一直到 8 kHz 以上）和一个 4 kHz 左右的尖鸣。
固定的窄陷波不行：它会把说话里落在这些频缝上的那一点能量抹成前后半秒的拖尾，停顿里反而多了一层“嗡”的残影。
所以用自适应的办法（只动这些谱线，而且只在嗡声占上风的时候动）：
  1) 停顿里的长时频谱（8192 点，5.4 Hz 一格）：每条谱线（50 Hz 的各次谐波、尖鸣）比两边底噪高出的那部分，就是嗡声的功率 B。
  2) 短时频谱逐帧处理（8192 点窗、1024 点一跳）：在这些谱线上，增益 = 1 − 2·B / 这一格的功率（前后三帧平均），
     最少压到 −26 dB，最多不压；再在时间上取三帧中值，免得一闪一闪。说话的谐波盖住某条线的时候，那一格的功率远大于 B，
     增益接近 1，声音不动；停顿里、字与字之间、说话没覆盖到的那些线，嗡声就被压下去。其他频率一概不动。
  3) 然后照常交给 DeepFilterNet 降噪（audio/prep_df.sh），把剩下的底噪一起压掉。
用法：python3 audio/dehum.py 输入.wav 输出.wav [报告.txt]
"""
import sys
import numpy as np, soundfile as sf
from numpy.lib.stride_tricks import sliding_window_view

src, dst = sys.argv[1], sys.argv[2]
x, sr = sf.read(src, dtype='float64'); x = x.mean(1) if x.ndim > 1 else x
T = len(x) / sr
N, H = 8192, 1024
win = np.hanning(N + 1)[:-1]
f = np.fft.rfftfreq(N, 1 / sr)

# 1) 停顿（说话频段能量最低的 20% 的帧，连成段）
hop = int(0.02 * sr); w2 = np.hanning(2048); f2 = np.fft.rfftfreq(2048, 1 / sr); vb = (f2 >= 300) & (f2 < 3000)
ev = np.array([np.mean(np.abs(np.fft.rfft(x[i:i + 2048] * w2))[vb] ** 2) for i in range(0, len(x) - 2048, hop)])
quiet = ev < np.percentile(ev, 20); runs, s0 = [], None
for i, q in enumerate(quiet):
    if q and s0 is None: s0 = i
    if (not q or i == len(quiet) - 1) and s0 is not None:
        if i - s0 >= 12: runs.append((s0 * hop + int(0.03 * sr), i * hop - int(0.03 * sr)))
        s0 = None
acc, k = 0, 0
for a, b in runs:
    for s in range(a, b - N, N // 4): acc = acc + np.abs(np.fft.rfft(x[s:s + N] * win)) ** 2; k += 1
Pp = acc / max(k, 1)
lp = 10 * np.log10(Pp + 1e-30)
floor = 10 ** (np.median(sliding_window_view(np.pad(lp, 12, mode='edge'), 25), axis=1) / 10)

# 嗡声基频（50 Hz 线，整段一起量）和尖鸣
NB = 1 << 17; fb = np.fft.rfftfreq(NB, 1 / sr); wb = np.hanning(NB); accb = 0
for s in range(0, len(x) - NB, NB // 2): accb = accb + np.abs(np.fft.rfft(x[s:s + NB] * wb)) ** 2
def peak(P, fc, w):
    sel = np.where(abs(fb - fc) < w)[0]; i = sel[np.argmax(P[sel])]
    a, b, c = np.log(P[i - 1:i + 2] + 1e-30); d = 0.5 * (a - c) / (a - 2 * b + c)
    return fb[i] + d * (fb[1] - fb[0])
F0 = float(np.clip(peak(accb, 50.0, 0.6), 49.9, 50.1)); FW = peak(accb, 4022.0, 15.0)

# 2) 每条线的嗡声功率 B（只在线中心 ±2 格里，取冒出底噪的那部分）
B = np.zeros_like(f); centers = [F0 * kk for kk in range(1, int(11000 / F0))] + [FW]
for fc in centers:
    j = int(round(fc / (f[1] - f[0])))
    for jj in range(j - 2, j + 3):
        if 0 < jj < len(f): B[jj] = max(B[jj], Pp[jj] - floor[jj])
B[B < 0.4 * floor] = 0                                     # 冒出不到 1.5 dB 的不算（那是底噪自己的起伏）
nl = int(sum(1 for fc in centers if B[int(round(fc / (f[1] - f[0])))] > 0))

# 3) 逐帧处理
pad = np.pad(x, (N, N)); nfr = (len(pad) - N) // H + 1
y = np.zeros_like(pad); wsum = np.zeros_like(pad)
act = np.where(B > 0)[0]
def frame(i): s = i * H; return np.fft.rfft(pad[s:s + N] * win)
# 先算所有帧在线上的功率（只存这些格，省内存）
P_act = np.empty((nfr, len(act)), dtype=np.float32)
for i in range(nfr): P_act[i] = np.abs(frame(i)[act]) ** 2
Pm = P_act.copy(); Pm[1:-1] = (P_act[:-2] + P_act[1:-1] + P_act[2:]) / 3
G = np.clip(1 - 2.0 * B[act] / (Pm + 1e-20), 10 ** (-26 / 20), 1.0).astype(np.float32)
Gs = G.copy(); Gs[1:-1] = np.median(np.stack([G[:-2], G[1:-1], G[2:]]), axis=0)
for i in range(nfr):
    X = frame(i); X[act] *= Gs[i]
    s = i * H; y[s:s + N] += np.fft.irfft(X, N) * win; wsum[s:s + N] += win ** 2
y = (y / np.maximum(wsum, 1e-9))[N:N + len(x)]
sf.write(dst, y.astype(np.float32), sr, subtype='PCM_24')
med_g = 20 * np.log10(np.median(Gs, axis=0) + 1e-9)
rep = [f'{src} → {dst}: {T:.1f} s；停顿 {sum(b - a for a, b in runs) / sr:.0f} s 用来量嗡声',
       f'嗡声基频 {F0:.3f} Hz，尖鸣 {FW:.1f} Hz；冒出底噪的谱线 {nl} 条（{len(act)} 个频格）',
       f'这些频格上增益的中位数：{np.median(med_g):.1f} dB（停顿里压到底 −26 dB，说话盖住时接近 0 dB）']
print('\n'.join(rep))
if len(sys.argv) > 3: open(sys.argv[3], 'w', encoding='utf-8').write('\n'.join(rep) + '\n')
