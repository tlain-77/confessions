"""本人录制第一讲（下）：把讲稿分句（s03 / s04）对到录音上 → web/self2a_data.js（奥古斯丁这个人）、web/self2b_data.js（处境·图什么·怎么读）"""
import json, re, difflib
al = json.load(open('out/aligned_part4_tight.json', encoding='utf-8'))
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
    out = []
    for k, c in enumerate(cues):
        h = sorted(A[hit[j]][1] for j, f in enumerate(F) if f[0] == k and j in hit)
        cl = [[h[0]]] if h else []                                  # 按 3 秒以上的空档分簇，取字最多的一簇（避免零星误配把一句拉得很长）
        for t in h[1:]:
            if t - cl[-1][-1] > 3: cl.append([t])
            else: cl[-1].append(t)
        best = max(cl, key=lambda c: (len(c), c[0])) if cl else []
        out.append([best[0], best[-1] + 0.3] if len(best) >= 2 else None)
    for k in range(len(out)):                                       # 没说到的句子：夹在前后两句中间，给一个很短的时长
        if out[k] is None:
            p = next((out[j][1] for j in range(k - 1, -1, -1) if out[j]), lo); n = next((out[j][0] for j in range(k + 1, len(out)) if out[j]), hi)
            out[k] = [p + 0.01, max(p + 0.05, min(n - 0.01, p + 0.6))]
    return out
def build(name, var, sfile, lo, hi, lead, tail):
    spec = json.load(open(f'tts/{sfile}.json', encoding='utf-8'))
    tm = cue_times(spec['cues'], lo, hi)
    first = min(t for c, t in A if t >= lo); off = round(lead - first, 3)
    cues = []
    for c, (s, e) in zip(spec['cues'], tm):
        cues.append(dict(id=c['id'], sec=c['sec'], sub=c['sub'], say=c['say'], start=round(s + off, 3), end=round(e + off, 3), dur=round(e - s, 3)))
    subs = [dict(s=round(l['start'] + off, 3), e=round(l['end'] + off, 3), t=l['text']) for l in al['lines'] if lo <= l['start'] < hi]
    last = max(s['e'] for s in subs); total = round(last + tail, 2)
    chars = [[c, round(t + off, 3)] for c, t in A if lo <= t < hi]
    d = dict(total=total, off=off, rec_from=lo, rec_to=hi, cues=cues, subs=subs, chars=chars)
    open(f'web/{name}_data.js', 'w', encoding='utf-8').write(f'window.{var} = ' + json.dumps(d, ensure_ascii=False) + ';\n')
    json.dump(d, open(f'out/{name}_data.json', 'w', encoding='utf-8'), ensure_ascii=False)
    print(name, 'total', total, 'off', off, 'cues', len(cues))
    return d
S = ''.join(c for c, t in A); split = A[S.index('他的故事讲完了')][1] - 0.2
build('self2a', 'EP2', 's03', 0, split, 1.5, 7.0)
build('self2b', 'EPD', 's04', split, 1e9, 1.5, 7.0)
