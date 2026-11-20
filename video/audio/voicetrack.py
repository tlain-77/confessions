"""剪过的录音 → 整段人声（按页面数据里的 off 往后挪、补到 total 那么长）：python3 audio/voicetrack.py rec/part7_tight.wav out/self5_data.json rec/self5_voice.wav"""
import json, sys
import numpy as np, soundfile as sf
d = json.load(open(sys.argv[2], encoding='utf-8'))
x, sr = sf.read(sys.argv[1], dtype='float64'); assert sr == 48000
x = x.mean(1) if x.ndim > 1 else x
N = int(round(d['total'] * sr)); off = int(round(d['off'] * sr))
v = np.zeros(N)
if off >= 0: v[off:off + len(x)] = x[:max(0, N - off)]
else: v[:len(x) + off] = x[-off:-off + N]
sf.write(sys.argv[3], v.astype(np.float32), sr, subtype='PCM_16')
print('wrote', sys.argv[3], round(N / sr, 2), 's, off', d['off'])
