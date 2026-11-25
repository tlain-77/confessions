"""本人录制 · 卷一第五章（下）：把讲稿 s12（讲稿/卷一/05-第五章-下.md） 的分句对到录音上 → web/self9_data.js
先做页面时可以用没剪过的录音：SRC= python3 build_self7.py（默认 SRC=_tight，剪过、补录过的）"""
import os
SRC = os.environ.get("SRC", "_tight")
import json, re, difflib
al = json.load(open(f'out/aligned_part11{SRC}.json', encoding='utf-8'))
isw = lambda c: bool(re.match(r'[一-鿿0-9]', c))
A = [(c, t) for l in al['lines'] for c, t in l['chars']]          # 录音里每个字（已校正）和时刻
def cue_times(cues, lo, hi):
    idx = [i for i, (c, t) in enumerate(A) if lo <= t < hi]
    S = [A[i][0] for i in idx]
    F = [(k, ch) for k, c in enumerate(cues) for ch in c['say'] if isw(ch)]
    sm = difflib.SequenceMatcher(None, S, [f[1] for f in F], autojunk=False)
    hit = {}
    for a, b, n in sm.get_matching_blocks():
        if n >= 2:
            for j in range(n): hit[b + j] = idx[a + j]
    out = []; CT.clear()
    for k, c in enumerate(cues):
        h = sorted(A[hit[j]][1] for j, f in enumerate(F) if f[0] == k and j in hit)
        cl = [[h[0]]] if h else []                                  # 按 3 秒以上的空档分簇，取字最多的一簇（避免零星误配把一句拉得很长）
        for t in h[1:]:
            if t - cl[-1][-1] > 3: cl.append([t])
            else: cl[-1].append(t)
        best = max(cl, key=lambda c: (len(c), c[0])) if cl else []
        out.append([best[0], best[-1] + 0.3] if len(best) >= 2 else None)
        js = [j for j, f in enumerate(F) if f[0] == k]                  # 这一句每个字：对上了就用录音时刻（限在最佳簇附近），没对上的按前后插值
        ts = [A[hit[j]][1] if j in hit and best and best[0] - 3 <= A[hit[j]][1] <= best[-1] + 15 else None for j in js]   # 一句话被即兴发挥隔成两段时，后一段也要用上
        CT.append(ts)
    USED.update(hit.values())
    for k in range(len(out)):                                       # 没说到的句子：夹在前后两句中间，给一个很短的时长
        if out[k] is None:
            p = next((out[j][1] for j in range(k - 1, -1, -1) if out[j]), lo); n = next((out[j][0] for j in range(k + 1, len(out)) if out[j]), hi)
            out[k] = [p + 0.01, max(p + 0.05, min(n - 0.01, p + 0.6))]
    for k in range(len(out)):                                        # 逐字时刻插值
        ts = CT[k]; s0, e0 = out[k]; e0 -= 0.3 if e0 - s0 > 0.4 else 0
        kn = [(i, t) for i, t in enumerate(ts) if t is not None]
        if not kn: CT[k] = [round(s0 + (e0 - s0) * i / max(1, len(ts)), 3) for i in range(len(ts))]; continue
        r = []
        for i in range(len(ts)):
            if ts[i] is not None: r.append(ts[i]); continue
            pv = max((x for x in kn if x[0] < i), default=None); nx = min((x for x in kn if x[0] > i), default=None)
            if pv and nx:                                              # 两个对上的字之间：没有长空档就照常插值；
                lin = pv[1] + (nx[1] - pv[1]) * (i - pv[0]) / (nx[0] - pv[0])   # 中间夹着一段即兴发挥（长空档）时，按正常语速贴着最近的那个字放，
                if nx[1] - pv[1] <= 0.3 * (nx[0] - pv[0]) + 0.3: r.append(lin)     # 不然字会被摊到空档里，画面就比声音早
                elif i - pv[0] <= nx[0] - i: r.append(min(lin, pv[1] + 0.22 * (i - pv[0])))
                else: r.append(max(lin, nx[1] - 0.22 * (nx[0] - i)))
            elif pv: r.append(pv[1] + 0.22 * (i - pv[0]))
            else: r.append(nx[1] - 0.22 * (nx[0] - i))
        CT[k] = [round(x, 3) for x in r]
    return out
CT = []; USED = set()
# 字幕不要比开口早：停顿之后的一句，按人声能量找真正开口的时刻（对齐偶尔会把第一个字放到停顿里）
import wave, numpy as np
_w = wave.open(f'rec/part11{SRC or "_clean35"}.wav'); _sr = _w.getframerate(); _ch = _w.getnchannels()
_x = np.frombuffer(_w.readframes(_w.getnframes()), np.int16).astype(np.float32); _x = (_x.reshape(-1, _ch).mean(1) if _ch > 1 else _x) / 32768
_hop = _sr // 100; _db = 20 * np.log10(np.sqrt(np.convolve(_x ** 2, np.ones(_hop * 2) / (_hop * 2), 'same')[::_hop]) + 1e-6)
def onset(t):
    k = int(t * 100); pre = _db[max(0, k - 25):k]
    if len(pre) < 20 or pre.max() > -36: return t                              # 开口前 0.25 秒不安静（连着说），不动
    thr = max(-42, np.percentile(pre, 30) + 12)
    seg = _db[k:k + 150]; i = next((i for i in range(len(seg)) if seg[i] > thr), 0)
    return t + max(0, i / 100 - 0.08) if i / 100 > 0.25 else t
def build(name, var, sfile, lo, hi, lead, tail):
    spec = json.load(open(f'tts/{sfile}.json', encoding='utf-8'))
    tm = cue_times(spec['cues'], lo, hi)
    # 开头那句自我介绍没有字幕（名字的写法还要问），所以按声音真正开始的地方定位：人声从第 lead 秒开始
    first = (np.argmax(_db > np.percentile(_db, 90) - 20) / 100) - 0.05; off = round(lead - first, 3)
    cues = []
    for c, (s, e), ct in zip(spec['cues'], tm, CT):
        cues.append(dict(id=c['id'], sec=c['sec'], sub=c['sub'], say=c['say'], start=round(s + off, 3), end=round(e + off, 3), dur=round(e - s, 3), ct=[round(x + off, 3) for x in ct]))
    subs = [dict(s=round(onset(l['start']) + off, 3), e=round(l['end'] + off, 3), t=l['text']) for l in al['lines'] if lo <= l['start'] < hi]
    last = max(s['e'] for s in subs); total = round(last + tail, 2)
    chars = [[c, round(t + off, 3)] for c, t in A if lo <= t < hi]
    d = dict(total=total, off=off, rec_from=lo, rec_to=hi, cues=cues, subs=subs, chars=chars)
    open(f'web/{name}_data.js', 'w', encoding='utf-8').write(f'window.{var} = ' + json.dumps(d, ensure_ascii=False) + ';\n')
    json.dump(d, open(f'out/{name}_data.json', 'w', encoding='utf-8'), ensure_ascii=False)
    print(name, 'total', total, 'off', off, 'cues', len(cues))
    return d
MATCH = {}
d = build('self9', 'EPD', 's12', 0, 1e9, 1.5, 7.0)

