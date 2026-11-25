"""本人录制 · 卷一第五章（下）：念经文、原文时念错的几处，用她自己在别处念对的声音换掉；改口重说的地方剪掉前一遍。
剪口、换字点都按响度表（10 ms 一格，看高频/低频比）找在停顿里、闭塞音的成阻处或擦音起头，接口做 6–12 ms 交叉淡化。
拿不准她到底念了什么的地方，都用 Whisper large-v3 给几种写法打分复核过。
  1) 诗篇 27:8“你说：你们当寻求我的面”，念成了“我们当寻求我的面”：
     “我们”（220.475–220.690）换成第 188 段“我深信那在你们心里……”里的“你们”（502.440 起，到“心”的擦音前；音高都在 90–100 Hz）。
  2) 约翰福音 12:24“一粒麦子不落在地里死了”，念成了“一个麦子不落在地里就死了”（多一个“就”，意思就反了）：
     “一个麦子”（264.590–265.420，前后都是停顿）整个换成第 104 段她说的“一粒麦子”（274.480–275.250，前后也是停顿）；
     “就”剪掉（266.740–266.965：从“里”后面停顿的中间，到“就”的元音完、“死”的擦音起头），成了“地里死了”。
     后半句“就结出许多粒子来”（和合本“子粒”）意思一样，没动。
  3) 讲解时引原文“请你加以扩充”，说成了“请你加以扩容”：整句（400.40–401.80，前后都是停顿）换成第 132 段她念的“请你加以扩充”
     （347.06–348.29），响度对齐。
  4) 诗篇 139:1“耶和华啊，你已经鉴察我”：先说了半句“你鉴察”，停了一下重说“你已经鉴察我”——前一遍（887.580–888.555）剪掉。
  5) 第二十四句原文“我决不向你争辩”，念成了“我绝不再向你争辩”：“再”（1066.855–1067.088，从“再”的塞擦音到“向”的擦音前）剪掉。
用法：python3 audio/edit11.py rec/part11_clean35.wav rec/part11_clean35m.wav → 改过的录音和 out/rec_part11m.json（识别结果跟着改）
"""
import json, sys
import numpy as np, soundfile as sf

x, sr = sf.read(sys.argv[1], dtype='float64'); assert x.ndim == 1
S = lambda t: int(round(t * sr))
# (起, 止, 换成的片段 或 None=删掉, 交叉淡化毫秒, 说明)
EDITS = [
    (220.475, 220.690, (502.440, 502.695, 1.0), 10, '我们 → 你们'),
    (264.590, 265.420, (274.480, 275.250, 1.0), 10, '一个麦子 → 一粒麦子'),
    (266.740, 266.965, None, 8, '删“就”'),
    (400.400, 401.800, (347.060, 348.290, None), 10, '请你加以扩容 → 扩充'),
    (887.580, 888.555, None, 10, '删前一遍“你鉴察”'),
    (1066.855, 1067.088, None, 6, '删“再”'),
]
rms = lambda a: np.sqrt(np.mean(a ** 2) + 1e-20)
out = [x[:S(EDITS[0][0])]]; pos = S(EDITS[0][0]); tmap = [(0.0, EDITS[0][0], 0.0)]; log = []
def append(seg, xf):
    """接到 out 后面：重叠 xf 个样点做交叉淡化（前一段尾巴淡出、这一段开头淡入）"""
    global out
    tail = out[-1]
    if xf > 0 and len(tail) >= xf and len(seg) >= xf:
        w = np.linspace(0, 1, xf); mix = tail[-xf:] * (1 - w) + seg[:xf] * w
        out[-1] = np.r_[tail[:-xf], mix]; out.append(seg[xf:])
    else: out.append(seg)
newlen = lambda: sum(len(o) for o in out)
for k, (a, b, src, xfms, what) in enumerate(EDITS):
    xf = S(xfms / 1000)
    if src is not None:
        s0, s1, g = src; piece = x[S(s0) - xf // 2:S(s1) + xf // 2].copy()
        if g is None: g = rms(x[S(a):S(b)]) / rms(x[S(s0):S(s1)])
        piece *= g
        # 把 out 的结尾延长半个淡化长度（原来的、被换掉的那一段的开头），让交叉淡化跨在切点两边
        out[-1] = np.r_[out[-1], x[S(a):S(a) + xf // 2]]
        t_new0 = (newlen() - xf // 2) / sr
        append(piece, xf)
        t_new1 = (newlen() - xf // 2) / sr
        tmap.append((a, b, t_new0, t_new1))
        nxt = EDITS[k + 1][0] if k + 1 < len(EDITS) else len(x) / sr
        rest = x[S(b) - xf // 2:S(nxt)]
        append(rest, xf)
        log.append(f'{what}：{a:.3f}–{b:.3f}（{(b - a) * 1000:.0f} ms）换成 {s0:.3f}–{s1:.3f}（{(s1 - s0) * 1000:.0f} ms），响度 ×{g:.2f}')
        tmap.append((b, nxt, t_new1))
    else:
        out[-1] = np.r_[out[-1], x[S(a):S(a) + xf // 2]]
        t_cut = (newlen() - xf // 2) / sr
        nxt = EDITS[k + 1][0] if k + 1 < len(EDITS) else len(x) / sr
        append(x[S(b) - xf // 2:S(nxt)], xf)
        tmap.append((a, b, t_cut, t_cut)); tmap.append((b, nxt, t_cut))
        log.append(f'{what}：{a:.3f}–{b:.3f}（{(b - a) * 1000:.0f} ms）')
y = np.concatenate(out)
sf.write(sys.argv[2], y.astype(np.float32), sr, subtype='PCM_24')

def M(t):
    for e in tmap:
        if len(e) == 3:
            a, b, n0 = e
            if a <= t < b: return n0 + (t - a)
        else:
            a, b, n0, n1 = e
            if a <= t < b: return n0 + (t - a) / (b - a) * (n1 - n0)
    return tmap[-1][2] + (t - tmap[-1][0])

REC = json.load(open('out/rec_part11.json', encoding='utf-8')); SEG = REC['segments']
def edit_tokens(i, fn):
    s = SEG[i]; toks, tms = fn(list(s['tokens']), list(s['times'])); s['tokens'], s['times'] = toks, tms; s['text'] = ''.join(toks)
def sub(old, new, near):
    def f(toks, tms):
        k = min((j for j in range(len(toks)) if toks[j] == old), key=lambda j: abs(tms[j] - near)); toks[k] = new; return toks, tms
    return f
def drop(chars, near):
    def f(toks, tms):
        for c, t in zip(chars, near):
            k = min((j for j in range(len(toks)) if toks[j] == c), key=lambda j: abs(tms[j] - t)); del toks[k], tms[k]
        return toks, tms
    return f
edit_tokens(80, sub('我', '你', 220.44))
edit_tokens(100, sub('个', '粒', 264.66)); edit_tokens(100, drop(['就'], [266.76]))
edit_tokens(158, sub('容', '充', 401.53))
edit_tokens(322, drop(['你', '践', '查'], [887.57, 887.99, 888.17]))
edit_tokens(388, drop(['再'], [1066.83]))
for s in SEG:
    s['times'] = [round(M(t), 3) for t in s['times']]; s['start'] = round(M(s['start']), 3); s['end'] = round(M(s['end']), 3)
json.dump(REC, open('out/rec_part11m.json', 'w', encoding='utf-8'), ensure_ascii=False)
log.append(f'总长 {len(x) / sr:.3f} → {len(y) / sr:.3f} s')
print('\n'.join(log))
for i in [80, 100, 158, 322, 388]: print(i, SEG[i]['text'])
