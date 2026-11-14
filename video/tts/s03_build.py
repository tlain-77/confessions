"""把第三节稿子切成句子，生成合成清单 tts/s03.json"""
import re, json
raw = open('tts/s03_raw.md', encoding='utf-8').read()
CN = {'354': '三百五十四'}
def say_of(s):
    s = re.sub(r'【[^】]*】', '', s)
    for k, v in CN.items(): s = s.replace(k, v)
    s = s.replace('“', '').replace('”', '').replace('"', '').replace('《', '').replace('》', '').replace(' ', '')
    return s.strip()
cues, sec, n = [], None, 0
for block in raw.split('\n\n'):
    b = block.strip()
    if not b or b.startswith('## ') or b.startswith('【'): continue
    if b.startswith('### '):
        sec = b[4:].strip(); continue
    # sentence split, keep end punctuation; keep a quoted list together
    parts = re.findall(r'[^。？！]+[。？！]+[”"」]?|[^。？！]+$', b)
    buf = ''
    for i, p in enumerate(parts):
        buf += p
        if len(re.findall(r'[一-鿿]', buf)) < 9 and i < len(parts) - 1: continue   # 太短的句子并到下一句
        n += 1; last = i == len(parts) - 1
        cues.append(dict(id=f'c{n:03d}', sec=sec, sub=buf.strip(), say=say_of(buf), gap=0.75 if last else 0.32)); buf = ''
for i, c in enumerate(cues[:-1]):
    if cues[i + 1]['sec'] != c['sec']: c['gap'] = 1.5                                    # 小节之间多停一会儿
json.dump(dict(title='第一讲 · 奥古斯丁这个人', cues=cues), open('tts/s03.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(cues), 'cues;', sum(len(re.findall(r'[一-鿿]', c['say'])) for c in cues), 'chars')
print('\n'.join(f"{c['id']} [{c['sec']}] {c['say']}" for c in cues[:6]))
