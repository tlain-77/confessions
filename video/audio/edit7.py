"""本人录制 · 卷一第三章：语气声和重说的一遍。
1) 九处识别成“嗯”的声音，其实都是很短的咂嘴声、气声（-27 ~ -34 dB，说话是 -10 ~ -20 dB）：不剪，只把前后两句话之间的这段停顿压成静音，
   停顿长短不动，交给 tighten.py 跟别的停顿一起统一缩短。前后两句话的真正起止按 10 ms 一格的响度曲线找，静音离说话各留 120 ms，两头各 60 ms 淡入淡出。
2) “所以，你不用跟别人去抢神……”紧接着又说了一遍（第二遍跟讲稿一样）：剪掉第一遍，从第一遍开口剪到第二遍开口之前（给 tighten.py）。
用法：python3 audio/edit7.py rec/part7_clean.wav rec/part7_cleanm.wav   → 写出压过的录音，打印给 tighten.py 的剪辑区间
"""
import json, sys
import numpy as np, soundfile as sf
SEGS = json.load(open('out/rec_part7.json', encoding='utf-8'))['segments']
FILLER = [9, 33, 60, 97, 249, 261, 330, 365, 419]
RETAKE = (442, 445)                                   # 剪 [442 开口, 445 开口)
x, sr = sf.read(sys.argv[1], dtype='float64'); mono = x.mean(1) if x.ndim > 1 else x
hop = sr // 100
db = 20 * np.log10(np.sqrt(np.convolve(mono ** 2, np.ones(hop * 2) / (hop * 2), 'same')[::hop]) + 1e-7)   # 10 ms 一格
floor = np.percentile(db, 8); SPEECH = np.percentile(db, 90) - 12        # 说话的门槛：比大部分说话轻 12 dB（咂嘴声、气声都在它下面）
F = lambda t: int(round(t * 100))
def speech_end(t):          # t（识别给的句末）附近，说话真正落下去的地方：往后找到连续 150 ms 低于 SPEECH
    k = F(t) - 20
    while k < len(db) - 15 and not (db[k:k + 15] < SPEECH).all(): k += 1
    return k / 100
def speech_start(t):        # t（识别给的句首）附近，说话真正起来的地方：往前找到连续 150 ms 低于 SPEECH
    k = F(t) + 20
    while k > 15 and not (db[k - 15:k] < SPEECH).all(): k -= 1
    return k / 100
y = x.copy(); log = []
for i in FILLER:
    a = speech_end(SEGS[i - 1]['end']) + 0.12; b = speech_start(SEGS[i + 1]['start']) - 0.12
    assert b - a > 0.25, (i, a, b)
    peak = db[F(a):F(b)].max()
    i0, i1, f = int(a * sr), int(b * sr), int(0.06 * sr)
    g = np.ones(i1 - i0) * 10 ** (-60 / 20); g[:f] = np.linspace(1, g[f], f); g[-f:] = np.linspace(g[-f - 1], 1, f)
    y[i0:i1] = (y[i0:i1].T * g).T
    log.append(f'#{i}: 静音 {a:.2f}–{b:.2f}（{b - a:.2f} 秒，里面最响 {peak:.0f} dB，门槛 {SPEECH:.0f} dB，底噪 {floor:.0f} dB）')
sf.write(sys.argv[2], y.astype(np.float32), sr, subtype='PCM_24')
def onset(i):
    return speech_start(SEGS[i]['start']) - 0.03
A, B = onset(RETAKE[0]), onset(RETAKE[1])
log.append(f'重说的一遍: 剪 {A:.2f}–{B:.2f}（{B - A:.2f} 秒）')
print('\n'.join(log), file=sys.stderr)
print(f'{A:.2f}-{B:.2f}')
