"""本人录制第一讲：录音时间轴 → web/self1_data.js"""
import json
p = json.load(open('out/aligned_part3_tight.json', encoding='utf-8'))
FIRST, TAIL = 1.8, 7.0
off = round(FIRST - p['lines'][0]['chars'][0][1], 3)
subs = [dict(p=0, s=round(l['start'] + off, 3), e=round(l['end'] + off, 3), t=l['text']) for l in p['lines']]
chars = [[c, round(t + off, 3)] for l in p['lines'] for c, t in l['chars']]
total = round(subs[-1]['e'] + TAIL, 2)
d = dict(total=total, off=[off], dur=[p['duration']], subs=subs, chars=chars)
open('web/self1_data.js', 'w', encoding='utf-8').write('window.EP = ' + json.dumps(d, ensure_ascii=False) + ';\n')
json.dump(d, open('out/self1_data.json', 'w', encoding='utf-8'), ensure_ascii=False)
print('total', total, 'off', off)
for s in subs: print(f"{s['s']:7.2f} {s['e']:7.2f} {s['t']}")
