"""Episode 1 clock: where each recording sits on the video's timeline, plus subtitles and per-character times.  → web/ep1_data.js"""
import json, re
import sys
SUF = sys.argv[1] if len(sys.argv) > 1 else '_tight'   # '_tight' = 停顿缩短后的录音
TAIL = 7.0                 # after the last word: closing card and fade
parts = [json.load(open(f'out/aligned_part{i}{SUF}.json', encoding='utf-8')) for i in (1, 2)]
FIRST, TITLE_GAP = 1.8, 4.6  # 第一个字出现在 1.8 秒；片名停留：第一段最后一个字到第二段第一个字 4.6 秒
o1 = FIRST - parts[0]['lines'][0]['chars'][0][1]
OFF = [round(o1, 3), round(o1 + parts[0]['lines'][-1]['chars'][-1][1] + TITLE_GAP - parts[1]['lines'][0]['chars'][0][1], 3)]
subs, chars = [], []
for pi, (p, off) in enumerate(zip(parts, OFF)):
    for l in p['lines']:
        subs.append(dict(p=pi, s=round(l['start'] + off, 3), e=round(l['end'] + off, 3), t=l['text']))
        chars += [[c, round(t + off, 3)] for c, t in l['chars']]
total = round(subs[-1]['e'] + TAIL, 2)
data = dict(suffix=SUF, total=total, off=OFF, dur=[p['duration'] for p in parts], subs=subs, chars=chars)
open('web/ep1_data.js', 'w', encoding='utf-8').write('window.EP = ' + json.dumps(data, ensure_ascii=False) + ';\n')
json.dump(data, open('out/ep1_data.json', 'w', encoding='utf-8'), ensure_ascii=False)
print('total', total, 's | part1 speech', subs[0]['s'], '→', [s for s in subs if s['p'] == 0][-1]['e'], '| part2 speech', [s for s in subs if s['p'] == 1][0]['s'], '→', subs[-1]['e'], '| chars', len(chars))
