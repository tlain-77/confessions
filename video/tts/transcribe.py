"""Transcribe a recording with timestamps: split at pauses, recognize each piece (SenseVoice, local).
usage: python3 tts/transcribe.py rec/part1.wav out/rec_part1.json
"""
import sys, json
import numpy as np, soundfile as sf, sherpa_onnx
from scipy.signal import resample_poly

x, sr = sf.read(sys.argv[1], dtype='float32')
if x.ndim > 1: x = x.mean(1)
x16 = resample_poly(x, 16000, sr).astype(np.float32); SR = 16000
# energy-based speech/pause detection, thresholds relative to this recording's own level
hop = 160; win = 400
n = (len(x16) - win) // hop
e = np.array([np.sqrt(np.mean(x16[i * hop:i * hop + win] ** 2)) for i in range(n)]); db = 20 * np.log10(e + 1e-9)
noise = np.percentile(db, 10); speech = np.percentile(db, 90); thr = noise + 0.35 * (speech - noise)
print(f'level: noise {noise:.1f} dB, speech {speech:.1f} dB, threshold {thr:.1f} dB')
act = db > thr
# close gaps shorter than 0.30 s, drop blips shorter than 0.12 s
def runs(a):
    out = []; s = None
    for i, v in enumerate(a):
        if v and s is None: s = i
        if not v and s is not None: out.append([s, i]); s = None
    if s is not None: out.append([s, len(a)])
    return out
seg = runs(act); merged = []
for s, t in seg:
    if merged and (s - merged[-1][1]) * hop / SR < 0.30: merged[-1][1] = t
    else: merged.append([s, t])
merged = [m for m in merged if (m[1] - m[0]) * hop / SR > 0.12]
rec = sherpa_onnx.OfflineRecognizer.from_sense_voice(model='models/sensevoice/model.int8.onnx', tokens='models/sensevoice/tokens.txt', language='zh', use_itn=True, num_threads=4)
out = []
gain = 10 ** ((-20 - speech) / 20)
for s, t in merged:
    a = max(0, s * hop - int(0.15 * SR)); b = min(len(x16), t * hop + win + int(0.2 * SR))
    st = rec.create_stream(); st.accept_waveform(SR, x16[a:b] * gain); rec.decode_stream(st)
    r = st.result
    toks = list(r.tokens); ts = list(r.timestamps) if hasattr(r, 'timestamps') else []
    out.append(dict(start=round(a / SR, 3), end=round(b / SR, 3), text=r.text, tokens=toks, times=[round(a / SR + v, 3) for v in ts]))
    print(f'{a / SR:7.2f} → {b / SR:7.2f}  {r.text}')
json.dump(dict(duration=round(len(x16) / SR, 3), segments=out), open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('token timestamps available:', bool(out and out[0]['times']), '| segments', len(out))
