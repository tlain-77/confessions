"""03（翻开第一页）口误定位：在校正后的逐字时刻里找到这一句，把前后一段音频单独再识别一遍（带逐字时刻），看实际说了什么。
用法：python3 tts/locate3.py 句中文字 [句中文字 ...]
"""
import json, sys
import numpy as np, soundfile as sf
from faster_whisper import WhisperModel
d = json.load(open('out/self3_data.json'))
CH = d['chars']; S = ''.join(c[0] for c in CH)
x, sr = sf.read('rec/self3_voice.wav', dtype='float32')
m = WhisperModel('large-v3', device='cpu', compute_type='int8', download_root='models/whisper', cpu_threads=4)
for q in sys.argv[1:]:
    i = S.find(q)
    if i < 0: print('NOT FOUND', q); continue
    t0, t1 = CH[i][1] - 1.5, CH[min(len(CH) - 1, i + len(q))][1] + 1.5
    seg = x[int(t0 * sr):int(t1 * sr)]
    from scipy.signal import resample_poly
    a16 = resample_poly(seg, 1, 3).astype(np.float32)
    out, _ = m.transcribe(a16, language='zh', word_timestamps=True, beam_size=5, condition_on_previous_text=False, initial_prompt='以下是普通话的句子。')
    print(f'== {q}  [{t0:.2f} – {t1:.2f}]')
    for s in out:
        print('   ', ' '.join(f'{w.word}@{t0 + w.start:.2f}-{t0 + w.end:.2f}' for w in s.words))
