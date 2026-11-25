"""把第三节稿子切成句子，生成合成清单 tts/s03.json"""
import re, json, sys
raw = open(sys.argv[1], encoding='utf-8').read()
CN = {'354': '三百五十四', '397': '三百九十七', '43': '四十三', '145': '一百四十五', '147': '一百四十七', '十一章三十六节': '十一章三十六节', 'ad te': '阿德忒'}
def say_of(s):
    s = re.sub(r'【[^】]*】', '', s)
    s = re.sub(r'^>\s*', '', s.strip()); s = re.sub(r'^(原文|大意)：', '', s)
    for k, v in CN.items(): s = s.replace(k, v)
    s = s.replace('“', '').replace('”', '').replace('"', '').replace("'", '').replace('‘', '').replace('’', '').replace('《', '').replace('》', '').replace(' ', '')
    return s.strip()
cues, sec, n = [], None, 0
for block in raw.split('\n\n'):
    b = block.strip()
    if not b or b.startswith('【'): continue
    if b.startswith('## '):
        sec = re.sub(r'^[一二三四五六七八九十]+、', '', b[3:]).strip(); continue      # 只去掉“一、”这种编号；“第四句、第五句”整个保留
    if b.startswith('### '):
        sec = b[4:].strip(); continue
    # sentence split, keep end punctuation; keep a quoted list together
    b = re.sub(r'^>\s*', '', b); b = re.sub(r'^(原文|大意)：', '', b)
    parts = re.findall(r'[^。？！]+[。？！]+[”"」]?|[^。？！]+$', b)
    buf = ''
    for i, p in enumerate(parts):
        buf += p
        if len(re.findall(r'[一-鿿]', buf)) < 9 and i < len(parts) - 1: continue   # 太短的句子并到下一句
        n += 1; last = i == len(parts) - 1
        cues.append(dict(id=f'c{n:03d}', sec=sec, sub=buf.strip(), say=say_of(buf), gap=0.75 if last else 0.32)); buf = ''
for i, c in enumerate(cues[:-1]):
    if cues[i + 1]['sec'] != c['sec']: c['gap'] = 1.5                                    # 小节之间多停一会儿
json.dump(dict(title=sys.argv[3], cues=cues), open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(cues), 'cues;', sum(len(re.findall(r'[一-鿿]', c['say'])) for c in cues), 'chars')
print('\n'.join(f"{c['id']} [{c['sec']}] {c['say']}" for c in cues[:6]))
