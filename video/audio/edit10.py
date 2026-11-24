"""本人录制 · 卷一第五章（上）：通读原文时念错的一个字换成她自己念对的那个字；两处咂嘴声压成静音；列出给 tighten.py 硬剪的一处。
剪口、换字点都按频谱和响度（5 ms 一格，高频/低频能量比看擦音）找在擦音起头、停顿里，接口做 8 ms 交叉淡化。
1) 通读时第一句“谁能使我安息在你怀中”念成了“安心”：Whisper 给“安心”的分比“安息”高将近 5 分（她别处念“安息”都是“安息”高 2—4 分）。
   把“心”（68.517–68.665，从“心”的擦音起头到“在”的擦音起头）换成第 53 段“我们的心如不安息在你怀中”里的“息”
   （150.517 起，取一样长：同样是“安□在你怀中”，前后都接在擦音上）。总长不变。
2) #188、#338 是一下咂嘴声（没有声带振动，很短），片尾 #424 是收尾的一点杂声：压成静音。其他识别成“嗯”“对”“是”的都是换气声，照旧保留。
3) 给 tighten.py 硬剪（打印出来，作为第二个参数）：
   讲收音机那句先说了“没有调到那个阈值”，马上改口“没有调到那个频道”：从“收音机”后面的小停顿剪到第二个“没有”前面的静音（1000.99–1002.52），
   成了“可是你的收音机没有调到那个频道”。
用法：python3 audio/edit10.py rec/part10_clean35.wav rec/part10_clean35m.wav  → 写出改过的录音和 out/rec_part10m.json（识别结果跟着改），打印剪辑区间
"""
import json, sys
import numpy as np, soundfile as sf
REC = json.load(open('out/rec_part10.json', encoding='utf-8'))
SEGS = REC['segments']
x, sr = sf.read(sys.argv[1], dtype='float64'); assert x.ndim == 1
S = lambda t: int(round(t * sr))
y = x.copy(); log = []
# 1) 换字（长度一样，原地替换，两头 8 ms 交叉淡化）
a, b, src = S(68.517), S(68.665), S(150.517)
n, f = b - a, S(0.008)
piece = x[src:src + n].copy(); w = np.ones(n); w[:f] = np.linspace(0, 1, f); w[-f:] = np.linspace(1, 0, f)
m, rp = S(68.600) - a, S(0.012)                     # 借来的“息”擦音比原来“心”的擦音响 4 dB 左右：压到一样响，到元音起头 12 ms 渐回原样
gfr = np.sqrt(np.mean(x[a:a + m] ** 2) / np.mean(piece[:m] ** 2)); g = np.ones(n); g[:m] = gfr; g[m:m + rp] = np.linspace(gfr, 1, rp); piece *= g
y[a:b] = x[a:b] * (1 - w) + piece * w
log.append(f'换字：68.517–68.665 的“心”换成 150.517 起“安息在”的“息”（擦音 {20 * np.log10(gfr):+.1f} dB）')
# 2) 咂嘴声压成静音（边上 30 ms 渐变）
MUTE = {188: (516.40, 516.98), 338: (981.95, 982.62), 424: (1223.30, len(x) / sr - 0.01)}
for i, (t0, t1) in MUTE.items():
    i0, i1, fm = S(t0), S(t1), S(0.03)
    g = np.full(i1 - i0, 10 ** (-60 / 20)); g[:fm] = np.linspace(1, g[fm], fm); g[-fm:] = np.linspace(g[-fm - 1], 1, fm)
    peak = 20 * np.log10(np.abs(y[i0:i1]).max() + 1e-9); y[i0:i1] *= g
    log.append(f'#{i}: 静音 {t0:.2f}–{t1:.2f}（最响 {peak:.0f} dBFS）')
sf.write(sys.argv[2], y.astype(np.float32), sr, subtype='PCM_24')
# 识别结果跟着改（给 tts/align.py 用）
s21 = SEGS[21]; k = s21['tokens'].index('心'); assert s21['tokens'][k - 1] == '安'; s21['tokens'][k] = '息'; s21['text'] = s21['text'].replace('安心', '安息')
s346 = SEGS[346]; i0 = s346['tokens'].index('没'); i1 = s346['tokens'].index('没', i0 + 1)   # 删掉第一个“没有调到那个阈值，”
assert ''.join(s346['tokens'][i0:i1]) == '没有调到那个阈值，'
del s346['tokens'][i0:i1], s346['times'][i0:i1]; s346['text'] = ''.join(s346['tokens'])
json.dump(REC, open('out/rec_part10m.json', 'w', encoding='utf-8'), ensure_ascii=False)
CUTS = [(1000.990, 1002.520)]
log.append('硬剪：' + '，'.join(f'{a:.3f}–{b:.3f}' for a, b in CUTS))
print('\n'.join(log), file=sys.stderr)
print(','.join(f'{a:.3f}-{b:.3f}' for a, b in CUTS))
