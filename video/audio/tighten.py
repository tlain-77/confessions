"""缩短录音里的长停顿（不动字），并把逐字时间按同样的剪辑重新映射。
usage: python3 audio/tighten.py <part> [extra cut ranges as a-b,...]
in : rec/part{n}_clean.wav, out/aligned_part{n}.json
out: rec/part{n}_tight.wav, out/aligned_part{n}_tight.json
"""
import sys, json, os
SRC = os.environ.get('SRC', '_fixed')   # 默认用补录过口误的版本
import numpy as np, soundfile as sf
p = sys.argv[1]; extra = [tuple(map(float, r.split('-'))) for r in sys.argv[2].split(',')] if len(sys.argv) > 2 else []
x, sr = sf.read(f'rec/part{p}{SRC}.wav', dtype='float64')
# 第一步：口头语（如“嗯”）整段剪掉
hard = sorted(extra); extra = []
def remap0(t):
    r = 0.0
    for a, b in hard:
        if t >= b: r += b - a
        elif t > a: r += t - a
    return t - r
if hard:
    f0 = int(0.012 * sr); parts = []; pos = 0
    for a, b in hard:
        parts.append(x[pos:int(a * sr)].copy()); pos = int(b * sr)
    parts.append(x[pos:].copy())
    y0 = parts[0]
    for q in parts[1:]:
        w = np.linspace(0, 1, f0); y0[-f0:] = y0[-f0:] * (1 - w) + q[:f0] * w; y0 = np.concatenate([y0, q[f0:]])
    x = y0
hop = int(0.01 * sr); win = int(0.03 * sr); n = (len(x) - win) // hop
db = np.array([20 * np.log10(np.sqrt(np.mean(x[i * hop:i * hop + win] ** 2)) + 1e-9) for i in range(n)])
p10, p90 = np.percentile(db, [10, 90]); thr = max(p10 + 10, p90 - 30)
sil = db < thr
for a, b in extra: sil[int(a / 0.01):int(b / 0.01)] = True          # 要剪掉的口头语，当作停顿处理
runs = []; s = None
for i, v in enumerate(sil):
    if v and s is None: s = i
    if not v and s is not None: runs.append((s * 0.01, i * 0.01)); s = None
if s is not None: runs.append((s * 0.01, n * 0.01))

MIN, LEAD, TAIL = 0.40, 0.30, 0.45                                     # 超过 0.4 秒才动；开头留 0.3 秒，结尾留 0.45 秒
def target(L): return min(0.45, 0.30 + 0.2 * (L - 0.40))              # 0.6 秒 → 0.34；1.0 秒 → 0.42；更长 → 0.45
cuts = []                                                              # (cut_start, cut_end) 在原始时间上
for a, b in runs:
    L = b - a
    if a <= 0.001:                                                     # 开头的空白
        if L > LEAD: cuts.append((0.0, L - LEAD)); continue
    if b >= n * 0.01 - 0.02:                                           # 结尾的空白
        if L > TAIL: cuts.append((a + TAIL, len(x) / sr)); continue
    if L >= MIN:
        keep = target(L); m = (a + b) / 2
        cuts.append((m - (L - keep) / 2, m + (L - keep) / 2))
# 拼接：每个剪口两侧 12 ms 交叉淡化，避免爆音
fade = int(0.012 * sr); out = []; pos = 0
for a, b in cuts:
    ia, ib = int(a * sr), int(b * sr)
    seg = x[pos:ia].copy()
    if out and len(seg) > fade and len(out[-1]) > fade:
        prev = out[-1]; w = np.linspace(0, 1, fade)
        prev[-fade:] = prev[-fade:] * (1 - w) + seg[:fade] * w; seg = seg[fade:]
    out.append(seg); pos = ib
seg = x[pos:].copy()
if out and len(seg) > fade and len(out[-1]) > fade:
    w = np.linspace(0, 1, fade); out[-1][-fade:] = out[-1][-fade:] * (1 - w) + seg[:fade] * w; seg = seg[fade:]
out.append(seg)
y = np.concatenate(out)
sf.write(f'rec/part{p}_tight.wav', y, sr)

def remap(t):                                                          # 原始时间 → 剪辑后时间
    removed = 0.0
    for a, b in cuts:
        if t >= b: removed += b - a
        elif t > a: removed += t - a
    return round(t - removed, 3)
al = json.load(open(f'out/aligned_part{p}{SRC}.json', encoding='utf-8'))
R = lambda v: remap(remap0(v))
for l in al['lines']:
    l['start'] = R(l['start']); l['end'] = R(l['end']); l['chars'] = [[c, R(t)] for c, t in l['chars']]
al['duration'] = round(len(y) / sr, 3)
json.dump(al, open(f'out/aligned_part{p}_tight.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'part{p}: {len(x) / sr + sum(b - a for a, b in hard):.1f}s → {len(y) / sr:.1f}s  (剪掉停顿 {sum(b - a for a, b in cuts):.1f}s，{len(cuts)} 处；口头语 {len(hard)} 处)')
