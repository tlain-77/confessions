"""声纹相似度：和您原录音（另一段）比，看合成的像不像。usage: spk.py file ..."""
import sys, numpy as np, soundfile as sf, sherpa_onnx
from scipy.signal import resample_poly
ex = sherpa_onnx.SpeakerEmbeddingExtractor(sherpa_onnx.SpeakerEmbeddingExtractorConfig(model='models/spk/3dspeaker_speech_campplus_sv_zh_en_16k-common_advanced.onnx', num_threads=4))
def emb(f, a=None, b=None):
    x, sr = sf.read(f, dtype='float32'); x = x.mean(1) if x.ndim > 1 else x
    if a is not None: x = x[int(a * sr):int(b * sr)]
    x = resample_poly(x, 16000, sr).astype(np.float32); s = ex.create_stream(); s.accept_waveform(16000, x); s.input_finished()
    e = np.array(ex.compute(s)); return e / np.linalg.norm(e)
base = emb('rec/part1_clean.wav', 22.0, 50.0)                         # 您另一段真实录音
print(f'您的另一段录音（参照）    {float(base @ emb("rec/part2_clean.wav", 60, 90)):.3f}')
print(f'合成男声（之前样片用的）  {float(base @ emb("out/voice_kokoro68.wav", 10, 40)):.3f}')
for f in sys.argv[1:]: print(f'{f:24s} {float(base @ emb(f)):.3f}')
