"""两版页面的逐帧指纹（tools/framesig.mjs 的输出）对比：列出画面状态不一样的帧段。
用法：python3 tools/sigdiff.py 旧.json 新.json [前后各多算几帧=6] [间隔小于几帧就并成一段=45]
输出：每段 起始帧 结束帧（不含）以及对应的秒数；最后一行是 JSON，给 tools/splice02.py 用。
"""
import json, sys
old, new = (json.load(open(p)) for p in sys.argv[1:3])
pad = int(sys.argv[3]) if len(sys.argv) > 3 else 6
gap = int(sys.argv[4]) if len(sys.argv) > 4 else 45
assert old['f0'] == new['f0'] == 0, 'both signatures must start at frame 0'
n = min(len(old['res']), len(new['res']))
if len(old['res']) != len(new['res']): print(f'warning: lengths differ {len(old["res"])} vs {len(new["res"])}')
diff = [i for i in range(n) if old['res'][i] != new['res'][i]]
rng = []
for i in diff:
    a, b = max(0, i - pad), min(n, i + 1 + pad)
    if rng and a <= rng[-1][1] + gap: rng[-1][1] = max(rng[-1][1], b)
    else: rng.append([a, b])
tot = sum(b - a for a, b in rng)
print(f'{len(diff)} differing frames of {n}; {len(rng)} ranges, {tot} frames ({tot / 30:.1f}s) to re-render')
for a, b in rng: print(f'  frames {a:6d}–{b:6d}   {a / 30:8.2f}s – {b / 30:8.2f}s   ({(b - a) / 30:.1f}s)')
print(json.dumps(rng))
