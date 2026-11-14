"""Episode 1 clock: where each recording sits on the video's timeline, plus subtitles and per-character times.  → web/ep1_data.js"""
import json, re
OFF = [0.8, 86.0]          # global start (s) of recording 1 and 2; between them the title holds
TAIL = 7.0                 # after the last word: closing card and fade
parts = [json.load(open(f'out/aligned_part{i}.json', encoding='utf-8')) for i in (1, 2)]
subs, chars = [], []
for pi, (p, off) in enumerate(zip(parts, OFF)):
    for l in p['lines']:
        subs.append(dict(p=pi, s=round(l['start'] + off, 3), e=round(l['end'] + off, 3), t=l['text']))
        chars += [[c, round(t + off, 3)] for c, t in l['chars']]
total = round(subs[-1]['e'] + TAIL, 2)
data = dict(total=total, off=OFF, dur=[p['duration'] for p in parts], subs=subs, chars=chars)
open('web/ep1_data.js', 'w', encoding='utf-8').write('window.EP = ' + json.dumps(data, ensure_ascii=False) + ';\n')
json.dump(data, open('out/ep1_data.json', 'w', encoding='utf-8'), ensure_ascii=False)
print('total', total, 's | part1 speech', subs[0]['s'], '→', [s for s in subs if s['p'] == 0][-1]['e'], '| part2 speech', [s for s in subs if s['p'] == 1][0]['s'], '→', subs[-1]['e'], '| chars', len(chars))
