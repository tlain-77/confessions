"""把逐句合成的配音按停顿拼起来，做人声处理和混音，并生成画面用的时间轴 web/ep2_data.js。"""
import json, re, subprocess
import numpy as np, soundfile as sf
from scipy.signal import resample_poly, butter, sosfilt, fftconvolve
spec = json.load(open('tts/s03.json', encoding='utf-8'))
SR = 48000; FIRST = 4.2; TAIL = 7.5
def trim(y, sr):
    a = np.abs(y); thr = 0.02 * a.max(); idx = np.where(a > thr)[0]
    y = y[max(0, idx[0] - int(0.05 * sr)):idx[-1] + int(0.12 * sr)].copy()
    f = int(0.01 * sr); y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f); return y
def rms(y): v = y[np.abs(y) > 0.05 * np.abs(y).max()]; return np.sqrt(np.mean(v ** 2))
chunks, cues, t = [], [], FIRST
for c in spec['cues']:
    y, sr = sf.read(f"out/zv_s03/{c['id']}.wav", dtype='float64'); y = trim(resample_poly(y, SR, sr), SR)
    y *= 0.1 / rms(y)                                                    # 每句音量一致
    d = len(y) / SR
    cues.append(dict(id=c['id'], sec=c['sec'], sub=c['sub'], say=c['say'], start=round(t, 3), end=round(t + d, 3), dur=round(d, 3)))
    chunks.append((t, y)); t += d + c['gap']
total = round(cues[-1]['end'] + TAIL, 2)
v = np.zeros(int(total * SR) + 1)
for st, y in chunks: i = int(st * SR); v[i:i + len(y)] += y
sf.write('rec/ep2_voice_raw.wav', v.astype(np.float32), SR)
subprocess.run(['python3', 'audio/voice.py', 'rec/ep2_voice_raw.wav', 'rec/ep2_voice.wav', '-17'], check=True)
open('web/ep2_data.js', 'w', encoding='utf-8').write('window.EP2 = ' + json.dumps(dict(total=total, cues=cues), ensure_ascii=False) + ';\n')
json.dump(dict(total=total, cues=cues), open('out/ep2_data.json', 'w', encoding='utf-8'), ensure_ascii=False)
# 氛围垫音：与第一讲同一套和声，压在人声下面约 19 dB
N = len(v); tt = np.arange(N) / SR; rng = np.random.default_rng(3)
def voice_(freq, amp, rate, ph0, pan):
    out = np.zeros((N, 2))
    for det, ph in ((-2.5, 0.0), (2.5, 1.7), (0.0, 3.1)):
        f = freq * 2 ** (det / 1200); s = np.sin(2 * np.pi * f * tt + ph) + 0.22 * np.sin(4 * np.pi * f * tt + ph * 2)
        out[:, 0] += s * (0.5 - pan * 0.35); out[:, 1] += s * (0.5 + pan * 0.35)
    return out * (amp * (0.72 + 0.28 * np.sin(2 * np.pi * rate * tt + ph0)))[:, None] / 3
secs = [c['start'] for i, c in enumerate(cues) if i == 0 or cues[i - 1]['sec'] != c['sec']]
B = np.zeros(N)                                                        # 每换一个小节，和声换一次
for i, s in enumerate(secs):
    a = int(s * SR); b = int((secs[i + 1] if i + 1 < len(secs) else total) * SR); B[a:b] = i % 2
k = int(3.0 * SR); w = np.hanning(k); w /= w.sum(); B = np.convolve(np.pad(B, k // 2, mode='edge'), w, mode='same')[k // 2:k // 2 + N]
pad = voice_(73.42, 0.9, 0.031, 0.3, 0) + voice_(146.83, 0.6, 0.043, 1.1, -0.2) + voice_(110.0, 0.45, 0.037, 2.0, 0.25)
pad += (voice_(185.0, 0.34, 0.051, 0.7, -0.5) + voice_(220.0, 0.40, 0.047, 2.4, 0.5) + voice_(329.63, 0.26, 0.061, 4.0, 0.1)) * (1 - B)[:, None]
pad += (voice_(196.0, 0.36, 0.049, 1.9, -0.5) + voice_(246.94, 0.34, 0.053, 0.2, 0.5) + voice_(293.66, 0.28, 0.057, 3.3, -0.1)) * B[:, None]
env = np.interp(tt, [0, 1.5, 3.8, FIRST + 1, total - 7, total - 3.5, total - 0.3, total], [0, 1.6, 1.6, 0.8, 0.8, 1.7, 1.2, 0])
pad *= env[:, None]
ir = rng.standard_normal((int(3 * SR), 2)) * np.exp(-np.arange(int(3 * SR)) / SR * 2.3)[:, None]; ir = sosfilt(butter(2, 4000, 'low', fs=SR, output='sos'), ir, axis=0); ir /= np.sqrt((ir ** 2).sum(0))
pad = pad * 0.75 + np.stack([fftconvolve(pad[:, c], ir[:, c])[:N] for c in (0, 1)], 1) * 0.5
pad = sosfilt(butter(2, 3200, 'low', fs=SR, output='sos'), pad, axis=0)
vc, _ = sf.read('rec/ep2_voice.wav', dtype='float64'); vc = np.pad(vc, (0, max(0, N - len(vc))))[:N]
def rdb(x):
    fr = x[: len(x) // 4800 * 4800].reshape(-1, 4800); r = np.sqrt((fr ** 2).mean(1)); r = r[r > r.max() * 0.1]; return 20 * np.log10(np.sqrt((r ** 2).mean()) + 1e-12)
pad *= 10 ** ((rdb(vc) - 19 - rdb(pad.mean(1))) / 20)
mix = np.stack([vc, vc], 1) + pad; pk = np.abs(mix).max(); mix *= min(1, 0.89 / pk)
sf.write('out/ep2_mix.wav', mix.astype(np.float32), SR)
print(f'{len(cues)} cues, total {total:.1f}s ({total / 60:.1f} min)')
