"""本人录制 · 卷一第四章（下）：几处念原文、念经文时的口误，用她自己在别处念对的录音换掉；几处咂嘴声压成静音；
再列出给 tighten.py 硬剪的两处。剪口都按频谱和响度（5–10 ms 一格）找在停顿、塞音成阻或擦音起头的地方，接口做 6–10 ms 交叉淡化。
1) 通读原文时“但谁对你默而不言”念成了“沉默不言”：讲到第十五句时她又念了一遍这半句，念对了（1065.6 秒起），
   连同“却是祸事”整句换过去（前后都在停顿里接），响度按原句对齐。这一处比原来长 0.27 秒，后面的时间都跟着挪。
2) “神不愿意把他的心交给会毁掉你的东西”：“把他”换成“同时把你看得清清楚楚”里的“把你”（两头都在塞音成阻处接，
   “把”跟着“你”变调，听着就是“把你的心”）。短 0.06 秒。
3) 撒母耳记上 15:29 “因为他迥非世人”念成了“迥非人世”：两个字对调（“世”从擦音起头处切，“人”后面原来紧接擦音，挪到逗号前，收尾淡出）。总长不变。
4) 以赛亚书 46:10 “我的筹算必立定”念成了“必定立”：两个字对调。“立”原来在句尾、拖得长，挪到中间把尾巴收短；
   “定”原来在中间、短，挪到句尾，把鼻音韵尾按基音周期续长 0.08 秒再淡出（像句尾自然拖出来的样子）。中间补一段“定”前面原有的成阻。总长不变。
5) 咂嘴声、口水声（识别成“嗯”“对”“不”或空白的几段）压成静音；真正的吸气声不动。
6) 给 tighten.py 硬剪（打印出来，作为第二个参数；时间已经换算到改过的录音上）：
   “哥哥们把他们卖到埃及”的“们”（“他”的元音淡出，剪到“卖”前面的停顿里，成了“把他卖到埃及”）；
   “这这辈子”前一个“这”（只出了半个声母，前后都是停顿）。
用法：python3 audio/edit9.py rec/part9_clean35.wav rec/part9_clean35m.wav  → 写出改过的录音和 out/rec_part9m.json（识别结果跟着改），打印剪辑区间
"""
import json, sys
import numpy as np, soundfile as sf
REC = json.load(open('out/rec_part9.json', encoding='utf-8'))
SEGS = REC['segments']
x, sr = sf.read(sys.argv[1], dtype='float64')
assert x.ndim == 1
S = lambda t: int(round(t * sr))
log = []

# ---- 5) 咂嘴声压成静音（原时间轴上做，边上 30 ms 渐变） ----
MUTE = {13: (26.70, 27.16), 47: (102.92, 103.16), 63: (139.05, 139.56), 65: (141.52, 142.28), 176: (550.53, 550.82),
        196: (605.60, 606.40), 214: (653.00, 653.70), 274: (856.45, 857.10), 294: (909.18, 909.45), 314: (972.28, 973.42),
        360: (1117.60, 1118.05), 373: (1173.00, 1173.95)}
x = x.copy()
for i, (a, b) in MUTE.items():
    i0, i1, f = S(a), S(b), S(0.03)
    g = np.full(i1 - i0, 10 ** (-60 / 20)); g[:f] = np.linspace(1, g[f], f); g[-f:] = np.linspace(g[-f - 1], 1, f)
    peak = 20 * np.log10(np.abs(x[i0:i1]).max() + 1e-9)
    x[i0:i1] *= g
    log.append(f'#{i}: 静音 {a:.2f}–{b:.2f}（最响 {peak:.0f} dBFS）')

# ---- 6) 硬剪前的淡出（“他们”的“们”：元音在 452.625 淡出，后面压成静音，硬剪交给 tighten.py） ----
a, b = S(452.600), S(453.045)
f = S(0.025); x[a:a + f] *= np.linspace(1, 0, f); x[a + f:b] *= 10 ** (-60 / 20)
HARD = [(452.650, 453.030), (885.645, 885.865)]                       # 原时间轴

# ---- 1)–4) 换字、对调：在原时间轴上列出“目标区间 ← 新的一段”，拼起来 ----
XF = 0.008
def rms_db(p):
    hop = S(0.01); fr = [np.sqrt(np.mean(p[k:k + hop] ** 2)) for k in range(0, len(p) - hop, hop)]
    fr = np.array(fr); loud = fr[fr > np.percentile(fr, 60)]                   # 只算说话的那些帧
    return 20 * np.log10(np.mean(loud) + 1e-12)
def fadeout(p, d):
    n = S(d); p = p.copy(); p[-n:] *= np.linspace(1, 0, n) ** 1.5; return p
def floor(a, L):                                                      # 一段底噪（就近取停顿里的），用来填空
    return x[S(a):S(a) + S(L)].copy()
def sustain(p, tail, ext, F0=(70, 320)):
    """把 p 最后 tail 秒里的（鼻音）按基音周期往后续 ext 秒，边续边淡出：最后一个完整周期加汉宁窗叠加重复。"""
    seg = p[-S(tail):]
    lo, hi = int(sr / F0[1]), int(sr / F0[0])
    ac = np.correlate(seg - seg.mean(), seg - seg.mean(), 'full')[len(seg) - 1:]
    T = lo + int(np.argmax(ac[lo:hi]))
    grain = p[-2 * T:] * np.hanning(2 * T)
    n = S(ext); out = np.zeros(n + 2 * T)
    for k in range(0, n, T): out[k:k + 2 * T] += grain
    out = out[T:T + n]                                                   # 从第二个周期起，和 p 的结尾接得上
    out *= np.linspace(1, 0, n) ** 2
    q = p.copy(); w = np.linspace(1, 0, T)
    head = out[:T] * (1 - w) + q[-T:] * w                                  # 原结尾最后一个周期和续出的第一个周期叠化
    return np.concatenate([q[:-T], head, out[T:]]), T

h = XF / 2
def join(ps):                                                         # 依次叠化拼接（相邻两段重叠 XF），返回结果和每段在结果里的起点（样本）
    n = S(XF); w = np.linspace(0, 1, n); y = ps[0]; offs = [0]
    for p in ps[1:]:
        offs.append(len(y) - n); y = np.concatenate([y[:-n], y[-n:] * (1 - w) + p[:n] * w, p[n:]])
    return y, offs
def match(src, dst):
    g = float(np.clip(rms_db(dst) - rms_db(src), -3, 3)); return src * 10 ** (g / 20), g

E = []   # (目标起, 目标止, 新的一段, 新段里第一个样本对应的“源时间”, 说明)
# 1) 但谁对你默而不言，却是祸事
src, g = match(x[S(1065.605 - h):S(1069.220 + h)], x[S(130.735):S(134.080)])
E.append((130.735, 134.080, src, 1065.605 - h, f'“沉默不言”整句换成 1065.6 秒处念对的“默而不言，却是祸事”（响度 {g:+.1f} dB）'))
# 2) 把他 → 把你
src, g = match(x[S(179.040 - h):S(179.280 + h)], x[S(236.280):S(236.580)])
E.append((236.280, 236.580, src, 179.040 - h, f'“把他的心”的“把他”换成 179.0 秒处“把你看得清清楚楚”的“把你”（响度 {g:+.1f} dB）'))
# 3) 迥非人世 → 迥非世人：[259.70, 260.40] ← 世 + 人（淡出） + 底噪
shi = x[S(259.905 - h):S(260.205 + h)]
ren = fadeout(x[S(259.700 - h):S(259.900)], 0.040)
fill = floor(260.310, 0.70 - 0.300 - 0.200 + 2 * h)
p3, o3 = join([shi, ren, fill])
E.append((259.700, 260.400, p3, None, '撒母耳记上 15:29“迥非人世”对调成“迥非世人”'))
# 4) 必定立 → 必立定：[473.80, 474.45] ← 立（收短、淡出） + 成阻 + 定（鼻音续长、淡出） + 底噪
li = fadeout(x[S(474.095 - h):S(474.285)], 0.025)
clo = x[S(473.810 - h):S(473.880 + h)]
ding, T = sustain(x[S(473.885 - h):S(474.085)], 0.050, 0.080)
ding = fadeout(ding, 0.050)
used = (len(li) + len(clo) + len(ding)) / sr - 3 * XF
fill = floor(474.460, max(0.03, 0.65 - used) + 2 * h)
p4, o4 = join([li, clo, ding, fill])
E.append((473.800, 474.450, p4, None, f'以赛亚书 46:10“必定立”对调成“必立定”（“定”的鼻音按 {sr / T:.0f} Hz 的周期续长 0.08 秒）'))

# 拼：保留的原段（两头各多取 XF/2）和新的段依次叠化
E.sort(key=lambda e: e[0])
pieces = []; pos = 0.0
for a, b, p, s0, note in E:
    o = max(0.0, pos - h) if pos else 0.0
    pieces.append((x[S(o):S(a + h)], o)); pieces.append((p, None)); pos = b; log.append(note)
pieces.append((x[S(pos - h):], pos - h))
y, offs = join([p for p, _ in pieces])
sf.write(sys.argv[2], y.astype(np.float32), sr, subtype='PCM_24')
kept = [(o0, offs[k] / sr) for k, (p, o0) in enumerate(pieces) if o0 is not None]
starts = {E[j][0]: offs[2 * j + 1] / sr for j in range(len(E))}           # 每处新段在结果里的起点（秒，含前面多取的 XF/2）
def M(t):                                                              # 原时间（在保留的原段里）→ 改过的
    o0, y0 = max((k for k in kept if k[0] <= t + 1e-9), key=lambda k: k[0])
    return y0 + (t - o0)
for a, b, p, s0, note in E:
    assert not any(a + 0.01 < s['start'] < b - 0.01 for s in SEGS), (a, b)
log.append('总长 %.3f → %.3f 秒（%+.3f）' % (len(x) / sr, len(y) / sr, len(y) / sr - len(x) / sr))

# 识别结果跟着改（给 tts/align.py 用）
def seg_set(i, toks):
    s = SEGS[i]; s['tokens'] = [t for t, _ in toks]; s['times'] = [round(v, 3) for _, v in toks]
    s['text'] = ''.join(s['tokens'])
y61 = starts[130.735] - (1065.605 - h)
new61 = [(t, v + y61) for t, v in zip(SEGS[346]['tokens'], SEGS[346]['times']) if v < 1069.22]
new61 += [(t, M(v)) for t, v in zip(SEGS[61]['tokens'], SEGS[61]['times']) if v >= 134.08]
y104 = starts[236.280] - (179.040 - h)
s104 = SEGS[104]; tok104 = [(t, M(v)) for t, v in zip(s104['tokens'], s104['times'])]
k = [t for t, _ in tok104].index('他'); assert tok104[k - 1][0] == '把' and tok104[k + 1][0] == '的'
tok104[k - 1] = ('把', 179.05 + y104); tok104[k] = ('你', 179.17 + y104)
y112 = starts[259.700]
s112 = SEGS[112]; t112 = [(t, M(v)) for t, v in zip(s112['tokens'], s112['times'])]
k = [t for t, _ in t112].index('人'); assert t112[k + 1][0] == '事', t112[k - 2:k + 3]
t112[k] = ('世', y112 + h + 0.015); t112[k + 1] = ('人', y112 + o3[1] / sr + h + 0.02)
y166 = starts[473.800]
s166 = SEGS[166]; t166 = [(t, M(v)) for t, v in zip(s166['tokens'], s166['times'])]
k = [t for t, _ in t166].index('定'); assert t166[k + 1][0] == '立'
t166[k] = ('立', y166 + h + 0.02); t166[k + 1] = ('定', y166 + o4[2] / sr + h + 0.01)
for i, s in enumerate(SEGS):
    toks = {61: new61, 104: tok104, 112: t112, 166: t166}.get(i)
    if i == 61:
        st, en = starts[130.735] + h, M(s['end'])
        seg_set(i, toks); s['start'] = round(st, 3); s['end'] = round(en, 3); continue
    if toks is None: toks = [(t, M(v)) for t, v in zip(s['tokens'], s['times'])]
    seg_set(i, toks); s['start'] = round(M(s['start']), 3); s['end'] = round(M(s['end']), 3)
REC['duration'] = round(len(y) / sr, 3)
json.dump(REC, open('out/rec_part9m.json', 'w', encoding='utf-8'), ensure_ascii=False)
cuts = [(M(a), M(b)) for a, b in HARD]
log.append('硬剪：' + '，'.join(f'{a:.3f}–{b:.3f}' for a, b in cuts))
print('\n'.join(log), file=sys.stderr)
print(','.join(f'{a:.3f}-{b:.3f}' for a, b in cuts))
