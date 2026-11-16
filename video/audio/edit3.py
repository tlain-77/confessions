"""本人录制第一讲：剪掉口误/重复，补一句克隆声音。in rec/part3_clean.wav → rec/part3_fixed.wav"""
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
x, sr = sf.read('rec/part3_clean.wav', dtype='float64')
def qmin(a, b):                                   # 区间里最安静的 10ms
    best = None
    for t in np.arange(a, b, 0.005):
        w = x[int(t * sr):int(t * sr) + int(0.01 * sr)]; e = np.sqrt(np.mean(w ** 2))
        if best is None or e < best[0]: best = (e, t)
    return round(best[1] + 0.005, 3)
def rms(v): return np.sqrt(np.mean(v[np.abs(v) > 0.05 * np.abs(v).max()] ** 2))
y, ysr = sf.read('rec/fix3/a_2.wav', dtype='float64'); y = resample_poly(y, sr, ysr)
# trim synth silence
e = np.abs(y) > 0.02 * np.abs(y).max(); i0 = max(0, np.argmax(e) - int(0.03 * sr)); i1 = min(len(y), len(y) - np.argmax(e[::-1]) + int(0.08 * sr)); y = y[i0:i1]
ops = [  # (a, b, replacement or None)
    (qmin(12.50, 12.84), qmin(14.10, 14.38), 'synth'),   # 他这么祷告的时候 → 他这么祷告的时候，才十几岁。
    (qmin(248.66, 248.78), qmin(248.90, 249.13), None),  # 我还在会想 → 我还会想
    (qmin(275.00, 275.12), qmin(276.20, 276.32), None),  # 什么情况下，什么处境下 → 什么处境下
    (qmin(296.75, 296.90), qmin(297.30, 297.72), None),  # 三十……三十多年 → 三十多年
]
seg_ref = x[int(12.9 * sr):int(14.0 * sr)]
y = y * rms(seg_ref) / rms(y)
f = int(0.015 * sr); out = []; pos = 0
for a, b, r in ops:
    print(f'{a:.3f}-{b:.3f}', 'replace' if r else 'cut')
    out.append(x[pos:int(a * sr)]); 
    if r: out.append(np.zeros(int(0.06 * sr))); out.append(y); out.append(np.zeros(int(0.12 * sr)))
    pos = int(b * sr)
out.append(x[pos:])
z = out[0]
for q in out[1:]:
    if len(q) > 2 * f and len(z) > f:
        w = np.linspace(0, 1, f); z = np.concatenate([z[:-f], z[-f:] * (1 - w) + q[:f] * w, q[f:]])
    else: z = np.concatenate([z, q])
sf.write('rec/part3_fixed.wav', z, sr); print('dur', len(z) / sr)
