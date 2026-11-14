"""通用：把逐句合成的配音按停顿拼起来、做人声处理，生成画面时间轴。
usage: python3 build_ep.py tts/s04.json out/zv_s04 ep3   → rec/ep3_voice.wav, web/ep3_data.js (window.EPD), out/ep3_data.json"""
import sys, json, subprocess
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
spec = json.load(open(sys.argv[1], encoding='utf-8')); wd = sys.argv[2]; name = sys.argv[3]
SR = 48000; FIRST = 4.2; TAIL = 7.5
def trim(y):
    a = np.abs(y); idx = np.where(a > 0.02 * a.max())[0]; y = y[max(0, idx[0] - int(0.05 * SR)):idx[-1] + int(0.12 * SR)].copy()
    f = int(0.01 * SR); y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f); return y
def rms(y): v = y[np.abs(y) > 0.05 * np.abs(y).max()]; return np.sqrt(np.mean(v ** 2))
chunks, cues, t = [], [], FIRST
for c in spec['cues']:
    y, sr = sf.read(f"{wd}/{c['id']}.wav", dtype='float64'); y = trim(resample_poly(y, SR, sr)); y *= 0.1 / rms(y); d = len(y) / SR
    cues.append(dict(id=c['id'], sec=c['sec'], sub=c['sub'], say=c['say'], start=round(t, 3), end=round(t + d, 3), dur=round(d, 3)))
    chunks.append((t, y)); t += d + c['gap']
total = round(cues[-1]['end'] + TAIL, 2)
v = np.zeros(int(total * SR) + 1)
for st, y in chunks: i = int(st * SR); v[i:i + len(y)] += y
sf.write(f'rec/{name}_voice_raw.wav', v.astype(np.float32), SR)
subprocess.run(['python3', 'audio/voice.py', f'rec/{name}_voice_raw.wav', f'rec/{name}_voice.wav', '-17'], check=True)
data = dict(title=spec['title'], total=total, cues=cues)
open(f'web/{name}_data.js', 'w', encoding='utf-8').write('window.EPD = ' + json.dumps(data, ensure_ascii=False) + ';\n')
json.dump(data, open(f'out/{name}_data.json', 'w', encoding='utf-8'), ensure_ascii=False)
secs = [0.0] + [round(c['start'] - 0.5, 2) for i, c in enumerate(cues) if i and cues[i - 1]['sec'] != c['sec']] + [round(total - 6.2, 2)]
open(f'out/{name}_secs.txt', 'w').write(','.join(map(str, secs)))
print(f'{name}: {len(cues)} cues, {total:.1f}s ({total / 60:.1f} min)')
