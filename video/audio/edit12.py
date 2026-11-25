"""本人录制 · 卷一第六章（上）（第八讲）：念原文、经文时念错的地方，用她自己在别处念对的声音换掉。
剪口都按响度表（10 ms 一格，看高频/低频比）找在停顿里、闭塞音的成阻处或擦音、塞擦音起头，接口做 6–15 ms 交叉淡化；
拿不准她到底念了什么的地方，都用 Whisper large-v3 给几种写法打分复核过。
  1) 通读第一句“向你的慈爱说话”念成了“讲话”：换成紧接着那句“请允许我说话”里的“说话”（都在句末）。
  2) 通读“或是生活的死亡中”念成了“生活在死亡中”：“在”换成讲解里“或者‘生活的死亡’”的“的”（前面都是“活”，后面都是“死”）。
  3) 通读“在她身内形成了我”念成了“化成了我”：换成讲第六句时念的“形成了我”。
  4) 讲第一句时“向你的慈爱”念成了“向你的仁慈”：“的仁慈”换成同一段里“因为我是向你的慈爱”的“的慈爱”。
  5) 诗篇 103:13“父亲怎样怜恤他的儿女”念成了“他的女儿”：“的女儿”换成克隆声音合成的“的儿女”（tts/fix15.py，
     样本是同一节后半句她自己念的），前面“父亲怎样怜恤他”还是她的声音。
  6) 讲第四句时又念成了“生活在……死亡中”（“在”后面还顿了一下）：“在”连同那一顿，换成“这就是‘生活的死亡’”的“的”。
  7) 讲第六句时“一如我从生身的父母那里听到的”漏了“身”：整句换成通读时念的那一句（前后都是停顿）。
  8) 讲第八句时“我的乳母”念成了“我的母乳”：整句换成通读时念的“我的乳母”。
  9) “还会请乳母帮着喂孩子”说成了“请母乳帮忙”：“母乳”换成“母亲和乳母”里的“乳母”（落在“帮”的成阻上）。
 10) 讲第九句时“使我在你所赐予之外”念成了“赋予”：换成念第九句原文时的“赐予”。
 11) 讲第十句时“这滋养并不来自她们”念成了“并不是来源于她们”（这一讲讲的就是“来自”和“通过”）：
     整句换成通读时念的“更应说这滋养并不来自她们，而是通过她们”。
另外几处念原文、经文时跟原句不一样，意思没变，照她说的出字幕（见 tts/fix14.py）。
用法：python3 audio/edit12.py rec/part12_clean35.wav rec/part12_clean35m.wav → 改过的录音和 out/rec_part12m.json（识别结果跟着改）
"""
import json, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly

x, sr = sf.read(sys.argv[1], dtype='float64'); assert x.ndim == 1
S = lambda t: int(round(t * sr))
# (起, 止, 换成的片段, 交叉淡化毫秒, 说明)；片段是 (起, 止, 响度倍数 或 None=按两边的响度对齐) 或者 (文件, 响度倍数)
EDITS = [
    (99.315, 99.900, (102.245, 102.900, 1.0), 8, '向你的慈爱讲话 → 说话'),
    (127.955, 128.135, (533.195, 533.275, 1.0), 6, '或是生活在死亡中 → 生活的死亡中（通读）'),
    (142.205, 143.250, (602.305, 603.280, 1.0), 8, '在她身内化成了我 → 形成了我'),
    (251.225, 252.400, (257.585, 258.220, 1.0), 8, '向你的仁慈 → 慈爱'),
    (319.475, 320.060, ('rec/fix15/erny_piece.wav', 1.0), 8, '他的女儿 → 他的儿女（合成）'),
    (480.710, 481.165, (586.480, 586.575, 1.0), 6, '生活在……死亡中 → 生活的死亡中（第四句）'),
    (595.830, 599.150, (135.030, 138.080, None), 10, '一如我从生的父母 → 生身的父母（第六句）'),
    (732.550, 733.300, (152.980, 153.650, None), 10, '我的母乳 → 我的乳母（第八句）'),
    (755.700, 756.140, (799.560, 800.040, 1.0), 15, '还会请母乳帮忙 → 乳母'),
    (863.185, 863.555, (843.235, 843.735, 1.0), 8, '所赋予之外 → 所赐予之外'),
    (934.450, 939.500, (192.950, 197.400, None), 10, '并不是来源于她们 → 并不来自她们（第十句）'),
]
rms = lambda a: np.sqrt(np.mean(a ** 2) + 1e-20)
out = [x[:S(EDITS[0][0])]]; tmap = [(0.0, EDITS[0][0], 0.0)]; log = []; placed = []
def append(seg, xf):
    """接到 out 后面：重叠 xf 个样点做交叉淡化（前一段尾巴淡出、这一段开头淡入）"""
    tail = out[-1]
    if xf > 0 and len(tail) >= xf and len(seg) >= xf:
        w = np.linspace(0, 1, xf); mix = tail[-xf:] * (1 - w) + seg[:xf] * w
        out[-1] = np.r_[tail[:-xf], mix]; out.append(seg[xf:])
    else: out.append(seg)
newlen = lambda: sum(len(o) for o in out)
for k, (a, b, src, xfms, what) in enumerate(EDITS):
    xf = S(xfms / 1000)
    if isinstance(src[0], str):                                  # 外部文件（已经切好、采样率可能不同）
        y, ysr = sf.read(src[0], dtype='float64'); y = y.mean(1) if y.ndim > 1 else y
        if ysr != sr: y = resample_poly(y, sr, ysr)
        piece = np.r_[np.zeros(xf // 2), y * src[1], np.zeros(xf // 2)]; s0 = s1 = None; g = src[1]
    else:
        s0, s1, g = src; piece = x[S(s0) - xf // 2:S(s1) + xf // 2].copy()
        if g is None: g = rms(x[S(a):S(b)]) / rms(x[S(s0):S(s1)])
        piece *= g
    out[-1] = np.r_[out[-1], x[S(a):S(a) + xf // 2]]              # 交叉淡化跨在切点两边
    t_new0 = (newlen() - xf // 2) / sr
    append(piece, xf)
    t_new1 = (newlen() - xf // 2) / sr
    tmap.append((a, b, t_new0, t_new1)); placed.append((s0, t_new0))
    nxt = EDITS[k + 1][0] if k + 1 < len(EDITS) else len(x) / sr
    append(x[S(b) - xf // 2:S(nxt)], xf)
    tmap.append((b, nxt, t_new1))
    src_txt = src[0] if s0 is None else f'{s0:.3f}–{s1:.3f}（{(s1 - s0) * 1000:.0f} ms）'
    log.append(f'{what}：{a:.3f}–{b:.3f}（{(b - a) * 1000:.0f} ms）换成 {src_txt}，响度 ×{g:.2f}')
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

REC = json.load(open('out/rec_part12.json', encoding='utf-8')); SEG = REC['segments']; ORIG = json.loads(json.dumps(SEG))
def edit_tokens(i, fn):
    s = SEG[i]; toks, tms = fn(list(s['tokens']), list(s['times'])); s['tokens'], s['times'] = toks, tms; s['text'] = ''.join(toks)
def sub(old, new, near):
    def f(toks, tms):
        k = min((j for j in range(len(toks)) if toks[j] == old), key=lambda j: abs(tms[j] - near)); toks[k] = new; return toks, tms
    return f
edit_tokens(47, sub('讲', '说', 99.37))
edit_tokens(59, sub('在', '的', 127.98))
edit_tokens(64, sub('化', '形', 142.34))
edit_tokens(104, sub('仁', '慈', 251.66)); edit_tokens(104, sub('慈', '爱', 251.84))
edit_tokens(130, sub('女', '儿', 319.66)); edit_tokens(130, sub('儿', '女', 319.78))
edit_tokens(189, sub('在', '的', 480.71))
edit_tokens(280, sub('母', '乳', 755.81)); edit_tokens(280, sub('乳', '母', 755.99))
edit_tokens(311, sub('赋', '赐', 863.30))
# 整句换掉的：识别结果换成来源那几段的字，时刻按来源片段在新录音里的位置算（先存下来，下面统一按 M 映射别的段时跳过）
whole = {226: ([62], 135.030), 271: ([69], 152.980), 337: ([83, 84], 192.950)}
newpos = {s0: t0 for s0, t0 in placed if s0 is not None}
for i, (srcs, s0) in whole.items():
    toks = [c for j in srcs for c in ORIG[j]['tokens']]; tms = [t for j in srcs for t in ORIG[j]['times']]
    SEG[i]['tokens'] = toks; SEG[i]['times'] = [round(newpos[s0] + (t - s0), 3) for t in tms]; SEG[i]['text'] = ''.join(toks)
    SEG[i]['start'] = round(newpos[s0], 3); SEG[i]['end'] = round(newpos[s0] + (ORIG[srcs[-1]]['end'] - s0), 3)
for i, s in enumerate(SEG):
    if i in whole: continue
    s['times'] = [round(M(t), 3) for t in s['times']]; s['start'] = round(M(s['start']), 3); s['end'] = round(M(s['end']), 3)
json.dump(REC, open('out/rec_part12m.json', 'w', encoding='utf-8'), ensure_ascii=False)
log.append(f'总长 {len(x) / sr:.3f} → {len(y) / sr:.3f} s')
print('\n'.join(log))
for i in [47, 59, 64, 104, 130, 189, 226, 271, 280, 311, 337]: print(i, SEG[i]['text'])
