"""核对合成的句子：识别出的文字、语速、音高，并和您原录音对比。usage: check_takes.py 期望文字 file1 file2 ..."""
import sys, re, numpy as np, soundfile as sf, sherpa_onnx
from scipy.signal import resample_poly
want = ''.join(re.findall(r'[一-鿿]', sys.argv[1]))
rec = sherpa_onnx.OfflineRecognizer.from_sense_voice(model='models/sensevoice/model.int8.onnx', tokens='models/sensevoice/tokens.txt', language='zh', use_itn=False, num_threads=4)
def f0(x, sr):
    n = int(0.04 * sr); out = []
    for i in range(0, len(x) - n, n // 2):
        w = x[i:i + n]
        if np.sqrt(np.mean(w ** 2)) < 0.02 * np.abs(x).max(): continue
        w = w - w.mean(); ac = np.correlate(w, w, 'full')[n - 1:]; lo, hi = int(sr / 400), int(sr / 70); j = lo + np.argmax(ac[lo:hi])
        if ac[j] > 0.45 * ac[0]: out.append(sr / j)
    return np.median(out) if out else 0
for f in ['rec/fix/ref.wav'] + sys.argv[2:]:
    x, sr = sf.read(f, dtype='float32'); x = x.mean(1) if x.ndim > 1 else x
    x16 = resample_poly(x, 16000, sr).astype(np.float32); st = rec.create_stream(); st.accept_waveform(16000, x16 / max(1e-6, np.abs(x16).max()) * 0.8); rec.decode_stream(st)
    hyp = ''.join(re.findall(r'[一-鿿]', st.result.text)); voiced = (np.abs(x) > 0.03 * np.abs(x).max()).mean()
    print(f'{f:28s} {len(x) / sr:5.2f}s  音高 {f0(x, sr):5.0f}Hz  {len(hyp) / (len(x) / sr):4.1f}字/秒  {"✓" if hyp == want else "≠"} {hyp}')
