"""本人录制第一讲（下）：剪掉口头语/重复，补两句克隆声音。rec/part4_clean.wav → rec/part4_fixed.wav"""
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
x, sr = sf.read('rec/part4_clean.wav', dtype='float64')
def qmin(a, b):
    best = None
    for t in np.arange(a, b, 0.005):
        w = x[int(t * sr):int(t * sr) + int(0.01 * sr)]; e = np.sqrt(np.mean(w ** 2))
        if best is None or e < best[0]: best = (e, t)
    return round(best[1] + 0.005, 3)
def rms(v): return np.sqrt(np.mean(v[np.abs(v) > 0.05 * np.abs(v).max()] ** 2))
def synth(f, ref_a, ref_b):
    y, ysr = sf.read(f, dtype='float64'); y = resample_poly(y, sr, ysr)
    e = np.abs(y) > 0.02 * np.abs(y).max(); i0 = max(0, np.argmax(e) - int(0.03 * sr)); i1 = min(len(y), len(y) - np.argmax(e[::-1]) + int(0.06 * sr))
    y = y[i0:i1]; return y * rms(x[int(ref_a * sr):int(ref_b * sr)]) / rms(y)
ops = [
    (qmin(97.90, 98.15), qmin(98.60, 98.75), None),       # 哎
    (qmin(111.62, 111.74), qmin(112.06, 112.16), None),   # 分出分析出 → 分析出
    (qmin(169.88, 170.05), qmin(170.45, 170.55), None),   # 嗯
    (qmin(349.10, 349.40), qmin(350.60, 350.80), 'rec/fix4/a_0.wav'),  # 因为做事儿的不要 → 因为做错了事
    (qmin(376.20, 376.50), qmin(378.20, 378.50), None),   # 当时他说。不，
    (qmin(456.30, 456.95), qmin(457.72, 458.05), 'rec/fix4/b_0.wav'),  # 很多天以后 → 很多年以后
    (qmin(533.30, 533.60), qmin(536.15, 536.32), None),   # 他爸到处借钱的这一天。啊，
    (qmin(715.30, 715.85), qmin(716.40, 716.60), None),   # 嗯
    (qmin(811.00, 811.38), qmin(811.90, 812.05), None),   # 这一句这一句话 → 这一句话
    (qmin(859.90, 860.20), qmin(860.75, 861.00), None),   # 嗯
    (qmin(881.50, 881.85), qmin(882.45, 882.70), None),   # 哎
    (qmin(950.10, 950.35), qmin(952.10, 952.60), None),   # 就有很。
    (qmin(1057.40, 1057.86), qmin(1058.10, 1058.23), None),  # 已经已经 → 已经
    (qmin(1142.40, 1142.56), qmin(1142.90, 1143.05), None),  # 挺有挺有趣 → 挺有趣
    (qmin(1168.90, 1169.10), qmin(1169.50, 1169.58), None),  # 是。
    (qmin(1228.70, 1228.79), qmin(1229.00, 1229.20), None),  # 自己自己 → 自己
    (qmin(1375.72, 1375.85), qmin(1377.45, 1378.10), None),  # 嗯。是。
]
f = int(0.015 * sr); out = []; pos = 0
for a, b, r in ops:
    print(f'{a:.3f}-{b:.3f}', r or 'cut')
    out.append(x[pos:int(a * sr)])
    if r: out += [np.zeros(int(0.05 * sr)), synth(r, a - 3, a), np.zeros(int(0.08 * sr))]
    pos = int(b * sr)
out.append(x[pos:])
z = out[0]
for q in out[1:]:
    if len(q) > 2 * f and len(z) > f:
        w = np.linspace(0, 1, f); z = np.concatenate([z[:-f], z[-f:] * (1 - w) + q[:f] * w, q[f:]])
    else: z = np.concatenate([z, q])
sf.write('rec/part4_fixed.wav', z, sr); print('dur', len(z) / sr)
