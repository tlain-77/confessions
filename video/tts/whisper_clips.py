"""用 Whisper large-v3 只重听几小段（第一遍识别拿不准的地方）。
用法：python3 tts/whisper_clips.py rec/part5_clean.wav out/whisper_clips5.json 起-止 起-止 ...
"""
import sys, json
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
from faster_whisper import WhisperModel
x, sr = sf.read(sys.argv[1], dtype='float32'); x = x.mean(1) if x.ndim > 1 else x
x = resample_poly(x, 16000, sr).astype(np.float32); x = x / max(1e-9, np.abs(x).max()) * 0.9
m = WhisperModel('large-v3', device='cpu', compute_type='int8', cpu_threads=4, download_root='models/whisper')
prompt = '以下是普通话的讲道录音，讲奥古斯丁《忏悔录》，使用简体中文。奥古斯丁，忏悔录，遍体，应受，摩尼教，加尔文，改革宗，安波罗修，诗篇，杭州，深圳，火影忍者，再不斩。'
out = []
for r in sys.argv[3:]:
    a, b = map(float, r.split('-'))
    seg = x[int(max(0, a - 0.3) * 16000):int((b + 0.3) * 16000)]
    segs, _ = m.transcribe(seg, language='zh', beam_size=5, vad_filter=False, initial_prompt=prompt, condition_on_previous_text=False)
    t = ''.join(s.text for s in segs)
    out.append(dict(a=a, b=b, text=t)); print(f'{a:8.2f}-{b:8.2f}  {t}', flush=True)
json.dump(out, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
