"""Second-opinion transcription with Whisper large-v3 (local, CPU) — word timestamps, used to cross-check the first recognizer."""
import sys, json
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
from faster_whisper import WhisperModel
m = WhisperModel('large-v3', device='cpu', compute_type='int8', cpu_threads=4, download_root='models/whisper')
for p in sys.argv[1:]:
    x, sr = sf.read(f'rec/{p}.wav', dtype='float32'); x = resample_poly(x, 16000, sr).astype(np.float32)
    x = x / max(1e-9, np.abs(x).max()) * 0.9   # the recordings are quiet; bring them up before recognition
    segs, info = m.transcribe(x, language='zh', beam_size=5, word_timestamps=True, vad_filter=False,
                              initial_prompt='以下是普通话的句子，使用简体中文。', condition_on_previous_text=False)
    out = []
    for s in segs:
        out.append(dict(start=round(s.start, 2), end=round(s.end, 2), text=s.text, words=[[w.word, round(w.start, 2), round(w.end, 2)] for w in (s.words or [])]))
        print(f'{p} {s.start:7.2f} → {s.end:7.2f}  {s.text}', flush=True)
    json.dump(out, open(f'out/whisper_{p}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
