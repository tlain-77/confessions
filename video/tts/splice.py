"""把补录的句子替换进原录音。usage: splice.py <part> id=take ...   (例如 f1=1 f2=1)
in : rec/part{n}_clean.wav, out/aligned_part{n}.json, rec/part{n}.txt, tts/fixes.json, rec/fix/{id}_{take}.wav
out: rec/part{n}_fixed.wav, rec/part{n}_fixed.txt
"""
import sys, json, re, subprocess
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
p = int(sys.argv[1]); pick = dict(a.split('=') for a in sys.argv[2:])
fixes = [f for f in json.load(open('tts/fixes.json', encoding='utf-8')) if f['part'] == p and f['id'] in pick]
x, sr = sf.read(f'rec/part{p}_clean.wav', dtype='float64')
al = json.load(open(f'out/aligned_part{p}.json', encoding='utf-8'))
CH = [c for l in al['lines'] for c in l['chars']]; S = ''.join(c[0] for c in CH)
hop = int(0.01 * sr)
def frame_db(a, b):
    out = []
    for t in np.arange(a, b, 0.01):
        w = x[int(t * sr):int(t * sr) + hop]; out.append((20 * np.log10(np.sqrt(np.mean(w ** 2)) + 1e-9), t))
    return out
def quiet_before(i):                                                               # 上一个字说完、这句开口之前最安静的一点
    t = CH[i][1]; lo = max(0.0, t - 0.4, (CH[i - 1][1] + 0.26) if i > 0 else 0.0)
    return min(frame_db(lo, max(lo + 0.02, t - 0.03)))[1]
def quiet_after(j):                                                                # 这句最后一个字之后、下一个字之前最安静的一点
    t = CH[j - 1][1] + 0.2; hi = min(t + 0.45, (CH[j][1] - 0.03) if j < len(CH) else len(x) / sr)
    return min(frame_db(t, max(t + 0.02, hi)))[1]
def rms(v): return np.sqrt(np.mean(v[np.abs(v) > 0.02 * np.abs(v).max()] ** 2))
edits = []
for f in fixes:
    i = S.index(f['from']); j = S.index(f['to'], i) + len(f['to'])
    a = quiet_before(i); b = quiet_after(j)
    y, ysr = sf.read(f"rec/fix/{f['id']}_{pick[f['id']]}.wav", dtype='float64'); y = y.mean(1) if y.ndim > 1 else y
    y = resample_poly(y, sr, ysr)
    nchar = len(re.findall(r'[一-鿿]', f['say'])); rate = nchar / (len(y) / sr)
    if rate > 4.9:                                                                 # 比您平时语速快的，放慢到接近您的语速
        tmp = f"rec/fix/_{f['id']}.wav"; sf.write(tmp, y, sr); tempo = max(0.86, 4.7 / rate)
        y = np.frombuffer(subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', tmp, '-af', f'atempo={tempo:.3f}', '-f', 'f64le', '-ac', '1', '-'], capture_output=True, check=True).stdout, dtype=np.float64)
    ctx = np.concatenate([x[int(max(0, a - 3) * sr):int(a * sr)], x[int(b * sr):int((b + 3) * sr)]])
    y = y * rms(ctx) / rms(y)                                                       # 音量和前后原声一致
    thr = 0.02 * np.abs(y).max(); idx = np.where(np.abs(y) > thr)[0]; y = y[max(0, idx[0] - int(0.04 * sr)):idx[-1] + int(0.08 * sr)]
    pad = np.zeros(int(0.06 * sr)); y = np.concatenate([pad, y, pad])
    edits.append((a, b, y, f)); print(f"{f['id']}: 原录音 {a:.2f}–{b:.2f}s ({b - a:.2f}s) → 补录 {len(y) / sr:.2f}s  {f['say']}")
edits.sort(key=lambda e: e[0]); out = []; pos = 0; fd = int(0.015 * sr)
def join(seg):
    if out and len(out[-1]) > fd and len(seg) > fd:
        w = np.linspace(0, 1, fd); out[-1][-fd:] = out[-1][-fd:] * (1 - w) + seg[:fd] * w; seg = seg[fd:]
    out.append(seg.copy())
for a, b, y, f in edits:
    join(x[pos:int(a * sr)]); join(y); pos = int(b * sr)
join(x[pos:])
sf.write(f'rec/part{p}_fixed.wav', np.concatenate(out), sr)
txt = open(f'rec/part{p}.txt', encoding='utf-8').read().split('\n')
norm = lambda s: ''.join(re.findall(r'[一-鿿]', s))
for f in fixes:                                                                    # 校对稿里对应的行换成新句子
    keep = []; done = False
    for l in txt:
        n = norm(l)
        if n and n in norm(f['from'] + '|' + f['to']) or (n and norm(f['from']) in n):
            if not done: keep += f['lines']; done = True
            continue
        keep.append(l)
    assert done, f['id']; txt = keep
open(f'rec/part{p}_fixed.txt', 'w', encoding='utf-8').write('\n'.join(txt))
print('rec/part%d_fixed.wav' % p, f'{len(x) / sr:.1f}s → {sum(len(s) for s in out) / sr:.1f}s')
