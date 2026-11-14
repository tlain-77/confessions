"""Put the corrected transcript on the recording's clock.
The recognizer gives a time for every character it heard; the corrected lines are matched against that character
stream, and characters the recognizer got wrong are placed between their matched neighbours.
usage: python3 tts/align.py out/rec_part1.json rec/part1.txt out/aligned_part1.json
"""
import sys, json, re, difflib
rec = json.load(open(sys.argv[1], encoding='utf-8'))
lines = [l.strip() for l in open(sys.argv[2], encoding='utf-8') if l.strip()]
isw = lambda c: bool(re.match(r'[一-鿿0-9A-Za-z]', c))
# recognized stream: (char, time, is_word)
A = []
for s in rec['segments']:
    for tok, t in zip(s['tokens'], s['times']):
        for c in tok: A.append((c, t, isw(c)))
    A.append(('|', s['end'], False))                      # segment end = a firm "speech stopped" mark
aw = [(i, c) for i, (c, t, w) in enumerate(A) if w]
# corrected stream
F = [(li, ci, c) for li, l in enumerate(lines) for ci, c in enumerate(l) if isw(c)]
sm = difflib.SequenceMatcher(None, [c for _, c in aw], [c for _, _, c in F], autojunk=False)
tm = [None] * len(F); src = [None] * len(F)
for a, b, n in sm.get_matching_blocks():
    for k in range(n): tm[b + k] = A[aw[a + k][0]][1]; src[b + k] = aw[a + k][0]
matched = sum(t is not None for t in tm)
# fill the gaps by interpolation between matched neighbours
known = [i for i, t in enumerate(tm) if t is not None]
for i in range(len(F)):
    if tm[i] is None:
        p = max([k for k in known if k < i], default=None); n = min([k for k in known if k > i], default=None)
        if p is None: tm[i] = tm[n] - 0.18 * (n - i)
        elif n is None: tm[i] = tm[p] + 0.18 * (i - p)
        else: tm[i] = tm[p] + (tm[n] - tm[p]) * (i - p) / (n - p)
# end time of a character = next thing in the recognized stream (next char, punctuation or segment end), capped
def end_of(i):
    if src[i] is not None and src[i] + 1 < len(A): return min(A[src[i] + 1][1], tm[i] + 0.5)
    return tm[i] + 0.3
out = []; k = 0
for li, l in enumerate(lines):
    idx = [i for i, f in enumerate(F) if f[0] == li]
    out.append(dict(text=l, start=round(tm[idx[0]], 3), end=round(max(end_of(idx[-1]), tm[idx[-1]] + 0.2), 3),
                    chars=[[F[i][2], round(tm[i], 3)] for i in idx]))
for a, b in zip(out, out[1:]):                             # no overlaps
    if a['end'] > b['start']: a['end'] = b['start']
json.dump(dict(duration=rec['duration'], lines=out), open(sys.argv[3], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'{sys.argv[2]}: {len(lines)} lines, {matched}/{len(F)} characters matched directly ({matched / len(F):.0%})')
for o in out: print(f"  {o['start']:7.2f} → {o['end']:7.2f}  {o['text']}")
