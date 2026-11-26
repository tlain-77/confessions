"""录音里某句话说到的时刻（页面时间）：python3 tools/at.py self10 '某句话' '[某句话,1]' …（[话,n] 是第 n+1 次）
找不到会说找不到；也会列出这句话前后各几个字，方便挑锚点。"""
import json, sys
pg = sys.argv[1]; d = json.load(open(f'out/{pg}_data.json', encoding='utf-8'))
S = ''.join(c[0] for c in d['chars']); T = [c[1] for c in d['chars']]
for a in sys.argv[2:]:
    p, n = (a[1:-1].rsplit(',', 1)[0], int(a[1:-1].rsplit(',', 1)[1])) if a.startswith('[') else (a, 0)
    i = -1
    for _ in range(n + 1):
        i = S.find(p, i + 1)
        if i < 0: break
    if i < 0: print(f'找不到：{a}'); continue
    j = i + len(p) - 1
    print(f'{T[i]:8.2f}–{T[j]:7.2f}  {a}   …{S[max(0, i - 6):i]}【{p}】{S[j + 1:j + 7]}…')
