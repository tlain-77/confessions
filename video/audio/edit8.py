"""本人录制 · 卷一第四章（上）：念经文时说反的两句对调，一处咂嘴声压成静音；再列出给 tighten.py 硬剪的几处。
剪口、对调点都按频谱和响度（10 ms 一格，高频/低频能量比看擦音、塞音）找在停顿或辅音成阻处，前后各做几毫秒淡入淡出。
1) 马太福音 6:26 念成了“也不收，也不种”：两句之间本来就有 0.13 秒停顿，把两句原样对调（总长不变，后面的时间都不动），成了“也不种，也不收”。
2) #621 识别成“嗯”的是一下咂嘴声和气声（最响 32 dB，说话 40 dB 上下）：不剪，两句话之间这段停顿压成静音，停顿长短交给 tighten.py 统一缩短。
3) 给 tighten.py 硬剪（打印出来，作为第二个参数）：
   “太牛逼了”整句（只留“太”的话，剩下 65 毫秒、听着像个残音，所以连“太”一起剪，成了“太大了，太亮了，后面就接不上了”）；
   “我父亲做事”的“亲”（从“父”的韵母落下处剪到“做”的擦音开头）；
   “也不积蓄藏在仓里”的“藏”（留“藏”开头 45 毫秒的擦音，接“在”的韵母，听起来就是“在”的声母）。
用法：python3 audio/edit8.py rec/part8_clean35.wav rec/part8_clean35m.wav  → 写出改过的录音和 out/rec_part8m.json（识别结果里两句也对调），打印剪辑区间
"""
import json, sys
import numpy as np, soundfile as sf
REC = json.load(open('out/rec_part8.json', encoding='utf-8'))
SEGS = REC['segments']
SWAP = (1078.585, 1079.340, 1079.470, 1080.060)      # “也不收”[a, b)，停顿 [b, c)，“也不种”[c, d)
FILLER = [621]
CUTS = [(528.440, 529.150), (883.283, 883.465), (1081.735, 1081.942)]
x, sr = sf.read(sys.argv[1], dtype='float64'); mono = x.mean(1) if x.ndim > 1 else x
y = x.copy(); log = []
# 1) 对调
a, b, c, d = (int(round(t * sr)) for t in SWAP)
def piece(s, e, f=int(0.006 * sr)):
    p = x[s:e].copy(); w = np.linspace(0, 1, f)
    p[:f] = (p[:f].T * w).T; p[-f:] = (p[-f:].T * w[::-1]).T
    return p
new = np.concatenate([piece(c, d), x[b:c], piece(a, b)])
assert len(new) == d - a
y[a:d] = new
log.append(f'对调：“也不收”{SWAP[0]:.3f}–{SWAP[1]:.3f} 和“也不种”{SWAP[2]:.3f}–{SWAP[3]:.3f}')
# 2) 咂嘴声压成静音（找两句话真正落下、起来的地方，各留 120 ms）
hop = sr // 100
db = 20 * np.log10(np.sqrt(np.convolve(mono ** 2, np.ones(hop * 2) / (hop * 2), 'same')[::hop]) + 1e-7)
SPEECH = np.percentile(db, 90) - 12
F = lambda t: int(round(t * 100))
def speech_end(t):
    k = F(t) - 20
    while k < len(db) - 15 and not (db[k:k + 15] < SPEECH).all(): k += 1
    return k / 100
def speech_start(t):
    k = F(t) + 20
    while k > 15 and not (db[k - 15:k] < SPEECH).all(): k -= 1
    return k / 100
for i in FILLER:
    s0 = speech_end(SEGS[i - 1]['end']) + 0.12; s1 = speech_start(SEGS[i + 1]['start']) - 0.12
    assert s1 - s0 > 0.25, (i, s0, s1)
    peak = db[F(s0):F(s1)].max()
    i0, i1, f = int(s0 * sr), int(s1 * sr), int(0.06 * sr)
    g = np.ones(i1 - i0) * 10 ** (-60 / 20); g[:f] = np.linspace(1, g[f], f); g[-f:] = np.linspace(g[-f - 1], 1, f)
    y[i0:i1] = (y[i0:i1].T * g).T
    log.append(f'#{i}: 静音 {s0:.2f}–{s1:.2f}（{s1 - s0:.2f} 秒，里面最响 {peak:.0f} dB，门槛 {SPEECH:.0f} dB）')
sf.write(sys.argv[2], y.astype(np.float32), sr, subtype='PCM_24')
# 识别结果跟着改：对调的两段，字也对调（时刻不动，两句长短差不多），给 tts/align.py 用
s528, s529 = SEGS[528], SEGS[529]
assert s528['tokens'][2] == '收' and s529['tokens'][2] == '重', (s528['tokens'], s529['tokens'])
s528['tokens'][2], s529['tokens'][2] = '种', '收'; s528['text'], s529['text'] = '也不种。', '也不收。'
json.dump(REC, open('out/rec_part8m.json', 'w', encoding='utf-8'), ensure_ascii=False)
log.append('硬剪：' + '，'.join(f'{a:.3f}–{b:.3f}' for a, b in CUTS))
print('\n'.join(log), file=sys.stderr)
print(','.join(f'{a:.3f}-{b:.3f}' for a, b in CUTS))
