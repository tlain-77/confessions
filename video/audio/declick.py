"""去掉录音里一下一下的“咔哒/滋”声（嘴里的口水声、静电之类）：一两毫秒、峰值却和说话一样响的尖脉冲，
后面拖着一小串 8–10 kHz 的振荡（2–4 ms）。连着几下，听起来就是“滋、滋”。
做法：
  1) 找：用 AR 模型（32 阶，每 2048 点一块）做线性预测，说话是可预测的，咔哒是突然冒出来的，残差里特别大——
     残差超过附近（前后约 25 ms）中位数的 K 倍的样点算可疑，相隔不到 1 ms 的并成一处。
  2) 量长度：从起点往后看 3 kHz 以上的包络，直到回到附近底子的 3 倍以下，整串振荡都算进去；超过 6 ms 的不算咔哒（是辅音、气声），不动。
  3) 把关：这一段里 6–16 kHz 的能量要比前后 20 ms 高出 8 dB 以上才算咔哒（辅音、元音没有这么突兀的超高频）。
  4) 修：把声音分成 3.5 kHz 以下和以上两半，只修上面那一半：用前后各 1024 点估一个 AR 模型，按“预测误差最小”把这几毫秒补出来
     （LSAR 插值）；下面那一半（元音的波形、声门脉冲、辅音的主体）原样不动。
用法：python3 audio/declick.py 输入.wav 输出.wav [K=16] [列表.txt]
"""
import sys
import numpy as np, soundfile as sf
from scipy.linalg import solve_toeplitz
from scipy.signal import lfilter, butter, sosfiltfilt
from scipy.ndimage import median_filter, maximum_filter1d

src, dst = sys.argv[1], sys.argv[2]
K = float(sys.argv[3]) if len(sys.argv) > 3 else 16.0
x, sr = sf.read(src, dtype='float64'); x = x.mean(1) if x.ndim > 1 else x
P, B = 32, 2048

def ar(seg, p=P):
    seg = seg - seg.mean(); r = np.correlate(seg, seg, 'full')[len(seg) - 1:len(seg) + p] / len(seg)
    r[0] = r[0] * 1.0001 + 1e-15
    return np.r_[1.0, -solve_toeplitz(r[:p], r[1:p + 1])]       # 预测误差滤波器 A(z)

def local(v, blk=256, size=9):                                  # 附近的典型大小（每 blk 点一块的中位数，再取前后几块的中位数）
    nb = len(v) // blk; med = np.array([np.median(v[i * blk:(i + 1) * blk]) for i in range(nb)])
    out = np.repeat(median_filter(med, size=size, mode='nearest'), blk)
    return np.r_[out, np.full(len(v) - len(out), out[-1])]

# 1) 残差和可疑点
e = np.zeros_like(x)
for s in range(0, len(x), B):
    a0, a1 = max(0, s - P), min(len(x), s + B)
    seg = x[max(0, s - B // 2):min(len(x), s + B + B // 2)]
    if len(seg) < 4 * P: continue
    e[s:a1] = lfilter(ar(seg), [1.0], x[a0:a1])[s - a0:]
ae = np.abs(e); loc = local(ae)
cand = np.where(ae > K * (loc / 0.6745 + 1e-7))[0]
regions = []
if len(cand):
    st = prev = cand[0]
    for c in cand[1:]:
        if c - prev > int(0.001 * sr): regions.append((st, prev)); st = c
        prev = c
    regions.append((st, prev))

# 2)–4) 分频、量长度、把关、修上半
lp = sosfiltfilt(butter(8, 3500, 'lowpass', fs=sr, output='sos'), x)
hf = x - lp
vhf = sosfiltfilt(butter(6, 6000, 'highpass', fs=sr, output='sos'), x)
h3 = np.abs(sosfiltfilt(butter(4, 3000, 'highpass', fs=sr, output='sos'), x))
env = maximum_filter1d(h3, size=max(3, int(0.0003 * sr))); hloc = local(h3)
y_hf = hf.copy(); fixed, skipped, kept = [], 0, []
qlen, lim6, ctxw = int(0.0005 * sr), int(0.006 * sr), int(0.020 * sr)
last_end = -1
for a, b in regions:
    a = a - 8
    if a <= last_end: continue
    j, run = b, 0
    while j < a + lim6 and j < len(x) - 1:
        run = run + 1 if env[j] < 3.0 * hloc[j] / 0.6745 else 0
        if run >= qlen: break
        j += 1
    b = max(b + 8, j - run + int(0.0003 * sr)); m = b - a + 1
    if m > lim6 or a < 2000 or b > len(x) - 2000: skipped += 1; continue
    ctx = np.r_[vhf[a - ctxw:a], vhf[b + 1:b + 1 + ctxw]]
    rise = 10 * np.log10(np.mean(vhf[a:b + 1] ** 2) / (np.mean(ctx ** 2) + 1e-20) + 1e-20)
    if rise < 8.0: kept.append((a / sr, m / sr * 1000, rise)); continue
    A = ar(np.r_[y_hf[a - 1024:a], y_hf[b + 1:b + 1025]])
    s0, s1 = a - P, b + P + 1; seg = y_hf[s0:s1].copy(); n = len(seg)
    C = np.zeros((n - P, n))
    for i in range(n - P): C[i, i:i + P + 1] = A[::-1]
    unk = np.arange(P, P + m); kn = np.setdiff1d(np.arange(n), unk)
    sol = np.linalg.lstsq(C[:, unk], -C[:, kn] @ seg[kn], rcond=None)[0]
    old = x[a:b + 1].copy(); y_hf[a:b + 1] = sol; last_end = b
    fixed.append((a / sr, m / sr * 1000, rise, 20 * np.log10(np.abs(old).max() + 1e-9), 20 * np.log10(np.abs(lp[a:b + 1] + sol).max() + 1e-9)))
y = lp + y_hf
sf.write(dst, y.astype(np.float32), sr, subtype='PCM_24')
msg = (f'{src} → {dst}: K={K:g}，修了 {len(fixed)} 处咔哒（每分钟 {len(fixed) / (len(x) / sr / 60):.1f} 处），'
       f'{skipped} 处超过 6 ms 没动，{len(kept)} 处超高频不突出（正常语音）没动')
print(msg)
if len(sys.argv) > 4:
    open(sys.argv[4], 'w', encoding='utf-8').write(msg + '\n' + '\n'.join(f'{t:9.3f}s  {d:4.1f} ms  超高频高出 {r:4.1f} dB  峰 {p0:6.1f} → {p1:6.1f} dBFS' for t, d, r, p0, p1 in fixed) + '\n'
                                                 + '\n'.join(f'# 没动 {t:9.3f}s  {d:4.1f} ms  超高频高出 {r:4.1f} dB' for t, d, r in kept) + '\n')
