import sys, json, re
import numpy as np, sherpa_onnx
k = 'models/kokoro'
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
    kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=f'{k}/model.onnx', voices=f'{k}/voices.bin', tokens=f'{k}/tokens.txt', data_dir=f'{k}/espeak-ng-data', dict_dir=f'{k}/dict', lexicon=f'{k}/lexicon-us-en.txt,{k}/lexicon-zh.txt'),
    num_threads=4, provider='cpu'), rule_fsts=','.join(f'{k}/{f}.fst' for f in ['date-zh', 'number-zh', 'phone-zh']), max_num_sentences=1))
rec = sherpa_onnx.OfflineRecognizer.from_sense_voice(model='models/sensevoice/model.int8.onnx', tokens='models/sensevoice/tokens.txt', language='zh', use_itn=False, num_threads=4)
texts = ['一本叫忏悔录的书，开头却没有急着讲自己做错过什么。', '它的第一个字，是，主。', '大家好，今天我们开始一句一句地读奥古斯丁的忏悔录。',
         '先说书名。忏悔两个字，我们一听，就想到认罪。', '主，你是伟大的，你应受一切赞美；你有无上的能力、无限的智慧。', '一个人要对神说第一句话，却发现自己没有话，只能借神给的话来说。',
         '我们对神的赞美，从第一个字起，就是领受来的。']
norm = lambda s: ''.join(re.findall(r'[一-鿿]', s))
def lev(a, b):
    d = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        p, d[0] = d[0], i
        for j, cb in enumerate(b, 1):
            p, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, p + (ca != cb))
    return d[-1]
def f0(x, sr):
    # crude autocorrelation pitch over voiced frames
    n = int(0.04 * sr); out = []
    for i in range(0, len(x) - n, n):
        w = x[i:i + n]
        if np.abs(w).mean() < 0.03: continue
        w = w - w.mean(); ac = np.correlate(w, w, 'full')[n - 1:]
        lo, hi = int(sr / 400), int(sr / 70)
        j = lo + np.argmax(ac[lo:hi])
        if ac[j] > 0.4 * ac[0]: out.append(sr / j)
    return float(np.median(out)) if out else 0
res = []
for sid in [int(s) for s in sys.argv[1].split(',')]:
    err = tot = 0; ps = []; dur = 0; n = 0
    for t in texts:
        a = tts.generate(t, sid=sid, speed=0.95); x = np.asarray(a.samples, dtype=np.float32)
        st = rec.create_stream(); st.accept_waveform(a.sample_rate, x); rec.decode_stream(st)
        err += lev(norm(t), norm(st.result.text)); tot += len(norm(t)); ps.append(f0(x, a.sample_rate)); dur += len(x) / a.sample_rate; n += len(norm(t))
    res.append((err / tot, sid, np.median(ps), n / dur))
    print(f'sid {sid:3d}  CER {err / tot:5.1%}  F0≈{np.median(ps):4.0f}Hz  {n / dur:.1f}字/秒', flush=True)
