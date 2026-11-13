"""Synthesize narration cues locally and build a timeline.
usage: python3 tts/synth.py tts/s01.json <engine: melo|kokoro> [sid] [speed]
"""
import sys, json, os, re
import numpy as np, soundfile as sf, sherpa_onnx

src = sys.argv[1]; engine = sys.argv[2] if len(sys.argv) > 2 else 'melo'
sid = int(sys.argv[3]) if len(sys.argv) > 3 else 0
speed = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
M = 'models'
if engine == 'melo':
    mc = sherpa_onnx.OfflineTtsModelConfig(
        vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=f'{M}/melo/model.onnx', lexicon=f'{M}/melo/lexicon.txt',
                                                   tokens=f'{M}/melo/tokens.txt', dict_dir=f'{M}/melo/dict'),
        num_threads=4, provider='cpu')
    fsts = ','.join(f'{M}/melo/{f}.fst' for f in ['date', 'number', 'phone', 'new_heteronym'])
else:
    k = f'{M}/kokoro'
    mc = sherpa_onnx.OfflineTtsModelConfig(
        kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=f'{k}/model.onnx', voices=f'{k}/voices.bin', tokens=f'{k}/tokens.txt',
                                                       data_dir=f'{k}/espeak-ng-data', dict_dir=f'{k}/dict',
                                                       lexicon=f'{k}/lexicon-us-en.txt,{k}/lexicon-zh.txt'),
        num_threads=4, provider='cpu')
    fsts = ','.join(f'{k}/{f}.fst' for f in ['date-zh', 'number-zh', 'phone-zh'])
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=mc, rule_fsts=fsts, max_num_sentences=1))

spec = json.load(open(src, encoding='utf-8'))
tag = f'{engine}{sid}'
outdir = f'out/voice_{tag}'; os.makedirs(outdir, exist_ok=True)

def trim(x, sr, thr=0.004, pad=0.14):
    a = np.abs(x); idx = np.where(a > thr)[0]
    if len(idx) == 0: return x
    s = max(0, idx[0] - int(pad * sr)); e = min(len(x), idx[-1] + int(pad * sr))
    y = x[s:e].copy()
    f = int(0.02 * sr)
    y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f)
    return y

t = 0.8  # lead-in silence
cues = []; chunks = []; sr = None
for c in spec['cues']:
    a = tts.generate(c.get('say', c['sub']), sid=sid, speed=speed)
    sr = a.sample_rate
    x = trim(np.asarray(a.samples, dtype=np.float32), sr)
    sf.write(f"{outdir}/{c['id']}.wav", x, sr)
    d = len(x) / sr
    n = len(re.findall(r'[一-鿿]', c.get('say', c['sub'])))
    cues.append(dict(id=c['id'], sub=c['sub'], start=round(t, 3), end=round(t + d, 3), dur=round(d, 3), cps=round(n / d, 2)))
    chunks.append((t, x)); t += d + c.get('gap', 0.4)
total = t + 0.6
mix = np.zeros(int(total * sr) + 1, dtype=np.float32)
for st, x in chunks:
    i = int(st * sr); mix[i:i + len(x)] += x
peak = np.abs(mix).max(); mix *= 0.89 / peak
sf.write(f'out/voice_{tag}.wav', mix, sr)
json.dump(dict(title=spec['title'], engine=tag, sr=sr, total=round(total, 3), cues=cues), open(f'out/timeline_{tag}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for c in cues: print(f"{c['id']} {c['start']:7.2f} → {c['end']:7.2f}  {c['dur']:5.2f}s {c['cps']:4.1f}字/秒  {c['sub']}")
print('total', round(total, 2), 's  sr', sr)
