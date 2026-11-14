"""配音还没合成完时，用估算时长生成临时时间轴，方便先预览画面。usage: provisional.py tts/s04.json out/zv_s04 ep3"""
import sys, json, re, os, soundfile as sf
spec = json.load(open(sys.argv[1], encoding='utf-8')); t = 4.2; cues = []
for c in spec['cues']:
    f = f"{sys.argv[2]}/{c['id']}.wav"
    d = sf.info(f).duration - 0.15 if os.path.exists(f) else len(re.findall(r'[一-鿿]', c['say'])) / 4.5
    cues.append(dict(id=c['id'], sec=c['sec'], sub=c['sub'], say=c['say'], start=round(t, 3), end=round(t + d, 3), dur=round(d, 3))); t += d + c['gap']
data = dict(title=spec['title'], total=round(cues[-1]['end'] + 7.5, 2), cues=cues)
open(f'web/{sys.argv[3]}_data.js', 'w', encoding='utf-8').write('window.EPD = ' + json.dumps(data, ensure_ascii=False) + ';\n')
json.dump(data, open(f'out/{sys.argv[3]}_data.json', 'w', encoding='utf-8'), ensure_ascii=False); print('provisional', data['total'])
