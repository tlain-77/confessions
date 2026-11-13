"""Round-trip check: recognize each synthesized cue and compare with the intended text (I cannot listen, so this is the pronunciation check)."""
import sys, json, re, glob, os
import numpy as np, soundfile as sf, sherpa_onnx
tl = json.load(open(sys.argv[1], encoding='utf-8')); spec = {c['id']: c for c in json.load(open(sys.argv[2], encoding='utf-8'))['cues']}
rec = sherpa_onnx.OfflineRecognizer.from_sense_voice(model='models/sensevoice/model.int8.onnx', tokens='models/sensevoice/tokens.txt', language='zh', use_itn=False, num_threads=4)
def norm(s): return ''.join(re.findall(r'[一-鿿]', s))
def lev(a, b):
    d = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        p, d[0] = d[0], i
        for j, cb in enumerate(b, 1):
            p, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, p + (ca != cb))
    return d[-1]
tot = err = 0
for c in tl['cues']:
    x, sr = sf.read(f"out/voice_{tl['engine']}/{c['id']}.wav", dtype='float32')
    st = rec.create_stream(); st.accept_waveform(sr, x); rec.decode_stream(st)
    hyp = norm(st.result.text); ref = norm(spec[c['id']].get('say', spec[c['id']]['sub']))
    e = lev(ref, hyp); tot += len(ref); err += e
    print(('OK ' if e == 0 else f'E{e} '), c['id'], '| 目标:', ref, '' if e == 0 else '\n        识别: ' + hyp)
print(f'CER {err}/{tot} = {err / tot:.1%}')
