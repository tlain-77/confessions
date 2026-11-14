"""第一讲的声音：两段处理过的人声放到时间轴上，下面垫一层很轻的合成氛围音。→ out/ep1_mix.wav"""
import json
import numpy as np, soundfile as sf
from scipy.signal import fftconvolve, butter, sosfilt
EP = json.load(open('out/ep1_data.json', encoding='utf-8'))
SR = 48000; T = EP['total']; N = int(T * SR); t = np.arange(N) / SR
rng = np.random.default_rng(11)
STR = ''.join(c[0] for c in EP['chars'])
at = lambda p, n=0: EP['chars'][[i for i in range(len(STR)) if STR.startswith(p, i)][n]][1]

def env(pts):
    xs, ys = zip(*sorted(pts)); e = np.interp(t, xs, ys); k = int(0.7 * SR); w = np.hanning(k); w /= w.sum()
    return np.convolve(np.pad(e, k // 2, mode='edge'), w, mode='same')[k // 2:k // 2 + N]
def voice(freq, amp, rate, ph0, pan):
    out = np.zeros((N, 2))
    for det, ph in ((-2.5, 0.0), (2.5, 1.7), (0.0, 3.1)):
        f = freq * 2 ** (det / 1200)
        s = np.sin(2 * np.pi * f * t + ph) + 0.22 * np.sin(4 * np.pi * f * t + ph * 2) + 0.07 * np.sin(6 * np.pi * f * t + ph)
        out[:, 0] += s * (0.5 - pan * 0.35 + 0.12 * np.sin(ph)); out[:, 1] += s * (0.5 + pan * 0.35 - 0.12 * np.sin(ph))
    return out * (amp * (0.72 + 0.28 * np.sin(2 * np.pi * rate * t + ph0)))[:, None] / 3

tPray, tName, tPage, tMe, tTitle = at('不要现在'), at('奥古斯丁'), at('在周士良先生的译本里'), at('这不就是我吗'), at('这本书叫忏悔录')
tP2, tShut, tHist, tSaint, tReal, tMap, tGold, tEnd = EP['off'][1], at('然后我就觉得这有点晦涩'), at('但是我在了解教会历史的时候'), at('圣奥古斯丁'), at('很真实'), at('所以在读忏悔录'), at('那么你就会有不同的理解'), EP['subs'][-1]['e']
# 和声：D 持续音上，上面三个声部在 D(add9) 和 G/D 之间慢慢换
B = env([(0, 0), (tName - 1, 0), (tName + 2, 1), (tPage, 1), (tPage + 3, 0), (tMe + 2, 0), (tMe + 6, 1), (tTitle - 1.5, 1), (tTitle + 1, 0), (tP2 + 12, 0), (tP2 + 16, 1), (tP2 + 34, 1), (tP2 + 38, 0),
         (tShut, 0), (tShut + 4, 1), (tHist + 6, 1), (tSaint, 0), (tReal - 3, 0), (tReal + 6, 1), (tMap - 2, 1), (tMap + 2, 0), (T, 0)])
pad = voice(73.42, 0.9, 0.031, 0.3, 0.0) + voice(146.83, 0.6, 0.043, 1.1, -0.2) + voice(110.0, 0.45, 0.037, 2.0, 0.25)
pad += (voice(185.0, 0.34, 0.051, 0.7, -0.5) + voice(220.0, 0.40, 0.047, 2.4, 0.5) + voice(329.63, 0.26, 0.061, 4.0, 0.1)) * (1 - B)[:, None]
pad += (voice(196.0, 0.36, 0.049, 1.9, -0.5) + voice(246.94, 0.34, 0.053, 0.2, 0.5) + voice(293.66, 0.28, 0.057, 3.3, -0.1)) * B[:, None]
sh = env([(0, 0), (tPray - 0.3, 0), (tPray + 0.8, 0.6), (tPray + 4, 0.1), (tName - 0.5, 0.1), (tName + 1, 0.6), (tName + 5, 0.1), (tTitle - 0.5, 0.1), (tTitle + 1.5, 1), (tP2 - 1, 0.6), (tP2 + 3, 0.08),
          (tSaint - 0.5, 0.08), (tSaint + 1, 0.6), (tSaint + 5, 0.08), (tReal - 0.3, 0.08), (tReal + 1, 0.55), (tReal + 5, 0.08), (tGold - 0.5, 0.1), (tGold + 1.5, 1), (T - 2.5, 0.5), (T, 0)])
shim = (voice(587.33, 0.10, 0.11, 0.5, -0.6) + voice(880.0, 0.07, 0.13, 2.2, 0.6) + voice(1318.5, 0.03, 0.17, 1.0, 0.0)) * sh[:, None]
dyn = env([(0, 0), (1.8, 0.75), (tPray + 1, 0.9), (tName - 1, 0.6), (tName + 1.5, 0.8), (tPage, 0.55), (tTitle - 1, 0.6), (tTitle + 1.2, 1.0), (EP['subs'][34]['e'] + 0.6, 1.9), (tP2 - 0.4, 1.7), (tP2 + 1.5, 0.6),
           (tSaint, 0.6), (tSaint + 1, 0.8), (tSaint + 4, 0.55), (tMap, 0.6), (tMap + 2, 0.8), (tGold, 0.7), (tEnd + 0.8, 1.2), (tEnd + 2, 1.9), (T - 2.4, 1.5), (T - 0.3, 0)])
music = (pad + shim) * dyn[:, None]
def boom(a, amp):
    n = int(4.0 * SR); x = np.arange(n) / SR; ph = 2 * np.pi * np.cumsum(46 + 16 * np.exp(-x * 3.0)) / SR
    b = np.zeros(N); i = int(a * SR); m = min(n, N - i); b[i:i + m] = (np.sin(ph) * (1 - np.exp(-x * 60)) * np.exp(-x * 1.5) * amp)[:m]; return np.stack([b, b], 1)
music += boom(tPray, 0.4) + boom(tTitle + 0.6, 0.5) + boom(tGold, 0.45)
def reverb(x, secs, wet, lp=4200):
    n = int(secs * SR); ir = rng.standard_normal((n, 2)) * np.exp(-np.arange(n) / SR * (6.9 / secs))[:, None]
    ir = sosfilt(butter(2, lp, 'low', fs=SR, output='sos'), ir, axis=0); ir /= np.sqrt((ir ** 2).sum(0))
    return x * (1 - wet * 0.5) + np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in (0, 1)], 1) * wet
music = sosfilt(butter(2, 3200, 'low', fs=SR, output='sos'), reverb(music, 3.2, 0.5), axis=0)
v = np.zeros(N)
for i, off in enumerate(EP['off']):
    x, sr = sf.read(f"rec/part{i + 1}{EP.get('suffix', '')}.wav" if EP.get('suffix') else f'rec/part{i + 1}_clean.wav', dtype='float64'); assert sr == SR
    a = int(off * SR); m = min(len(x), N - a); v[a:a + m] += x[:m]
vs = reverb(np.stack([v, v], 1), 0.7, 0.05, lp=6000)
def rms_db(x):
    fr = x[: len(x) // 4800 * 4800].reshape(-1, 4800); r = np.sqrt((fr ** 2).mean(1)); r = r[r > r.max() * 0.1]; return 20 * np.log10(np.sqrt((r ** 2).mean()) + 1e-12)
music *= 10 ** ((rms_db(vs.mean(1)) - 19.0 - rms_db(music.mean(1))) / 20)        # 氛围音压在人声下面约 19 dB
mix = vs + music; pk = np.abs(mix).max()
if pk > 0.89: mix *= 0.89 / pk
sf.write('out/ep1_mix.wav', mix.astype(np.float32), SR)
print(f'mix {T:.1f}s voice {rms_db(vs.mean(1)):.1f} dB music {rms_db(music.mean(1)):.1f} dB peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS')
