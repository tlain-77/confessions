"""逐句用克隆声音合成，并用语音识别核对；读错就重来，留最好的一遍。usage: zv_batch.py tts/s03.json out/zv_s03"""
import sys, os, json, re, difflib
import numpy as np, soundfile as sf, sherpa_onnx
from scipy.signal import resample_poly
sys.path.insert(0, 'tts'); import zipvoice as Z
spec = json.load(open(sys.argv[1], encoding='utf-8')); od = sys.argv[2]; os.makedirs(od, exist_ok=True)
rec = sherpa_onnx.OfflineRecognizer.from_sense_voice(model='models/sensevoice/model.int8.onnx', tokens='models/sensevoice/tokens.txt', language='zh', use_itn=False, num_threads=4)
from pypinyin import lazy_pinyin
han = lambda s: ''.join(re.findall(r'[一-鿿]', s))
py = lambda s: lazy_pinyin(han(s))                                      # 用拼音比较：同音字不算错
def score(y, sr, want):
    x16 = resample_poly(y, 16000, sr).astype(np.float32); st = rec.create_stream(); st.accept_waveform(16000, x16 / max(1e-6, np.abs(x16).max()) * 0.8); rec.decode_stream(st)
    a, b = py(want), py(st.result.text); sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    err = sum(max(i2 - i1, j2 - j1) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal')
    return err / max(1, len(a)), st.result.text
log = open(f'{od}/log.txt', 'a', encoding='utf-8')
for c in spec['cues']:
    f = f"{od}/{c['id']}.wav"
    if os.path.exists(f): continue
    best = None
    for k in range(4):
        y, sr = Z.synth(c['say'], 1.0, 4)
        rate = len(han(c['say'])) / (len(y) / sr)
        e, hyp = score(y, sr, c['say'])
        if best is None or e < best[0]: best = (e, y, sr, hyp, rate)
        if e == 0 and 3.6 < rate < 5.6: break
    e, y, sr, hyp, rate = best
    sf.write(f, y, sr)
    print(f"{c['id']} err {e:.2f} {rate:.1f}字/秒 tries {k + 1} | {c['say']}" + ('' if e == 0 else f'\n      识别: {hyp}'), file=log, flush=True)
print('done', file=log, flush=True)
