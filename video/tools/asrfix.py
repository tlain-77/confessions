"""把语音识别的结果对到讲稿上，自动改掉同音错字（拼音不计声调相同、两边都对上的地方），列出其余不一样的地方供人工校对。
用法：python3 tools/asrfix.py out/rec_part5.json tts/s06.json out/part5_review.txt out/part5_auto.txt
  review：每段识别结果一行，下面一行是讲稿里对上的那一段（不一样的地方用【】标出来）
  auto：自动改过同音字的识别文本（每段一行），人工校对就在这个文件上改
"""
import json, re, sys, difflib
from pypinyin import lazy_pinyin
rec = json.load(open(sys.argv[1], encoding='utf-8'))
spec = json.load(open(sys.argv[2], encoding='utf-8'))
isw = lambda c: bool(re.match(r'[一-鿿0-9A-Za-z]', c))
py = lambda c: lazy_pinyin(c)[0] if re.match(r'[一-鿿]', c) else c
segs = [s['text'] for s in rec['segments']]
A = [(si, ci, c) for si, s in enumerate(segs) for ci, c in enumerate(s) if isw(c)]       # 识别出的字
B = [c for cue in spec['cues'] for c in cue['say'] if isw(c)]                            # 讲稿的字
sm = difflib.SequenceMatcher(None, [a[2] for a in A], B, autojunk=False)
fix = {}; pair = {}                                                                       # 识别字下标 → 讲稿字
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == 'equal':
        for k in range(i2 - i1): pair[i1 + k] = B[j1 + k]
    elif tag == 'replace' and i2 - i1 == j2 - j1:
        for k in range(i2 - i1):
            pair[i1 + k] = B[j1 + k]
            if py(A[i1 + k][2]) == py(B[j1 + k]): fix[i1 + k] = B[j1 + k]
out = [list(s) for s in segs]
for k, c in fix.items(): si, ci, _ = A[k]; out[si][ci] = c
auto = [''.join(s) for s in out]
open(sys.argv[4], 'w', encoding='utf-8').write('\n'.join(auto) + '\n')
# 对照：每段识别结果对应的讲稿片段
idx = {}
for k, (si, ci, c) in enumerate(A): idx.setdefault(si, []).append(k)
lines = []
bpos = {}
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    for k in range(i1, i2): bpos[k] = (tag, j1 + (k - i1) if tag in ('equal', 'replace') else j1)
for si, s in enumerate(segs):
    ks = idx.get(si, [])
    if not ks: lines.append(f'{si:3d} {rec["segments"][si]["start"]:7.1f}  {auto[si]}'); continue
    j0 = bpos[ks[0]][1]; j1 = bpos[ks[-1]][1] + 1
    ref = ''.join(B[max(0, j0):j1])
    ok = sum(1 for k in ks if bpos[k][0] == 'equal' or k in fix) / len(ks)
    mark = '  ' if ok > 0.85 else '??'
    lines.append(f'{si:3d} {rec["segments"][si]["start"]:7.1f} {mark} {auto[si]}\n              稿: {ref}')
open(sys.argv[3], 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print(f'{len(segs)} segments, {len(A)} chars; {len(fix)} homophones fixed; matched {sum(1 for t, *_ in sm.get_opcodes() if t == "equal")} blocks')
