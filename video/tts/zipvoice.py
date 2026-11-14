"""开源本地声音克隆（ZipVoice，k2-fsa）：以您的录音为样本合成。
usage: zipvoice.py out.wav "句子" [speed] [steps]"""
import sys, numpy as np, soundfile as sf, sherpa_onnx
from scipy.signal import resample_poly
D = 'models/zipvoice/sherpa-onnx-zipvoice-distill-zh-en-emilia'
_tts = None
def tts():
    global _tts
    if _tts is None:
        mc = sherpa_onnx.OfflineTtsModelConfig(zipvoice=sherpa_onnx.OfflineTtsZipvoiceModelConfig(
            tokens=f'{D}/tokens.txt', encoder=f'{D}/text_encoder.onnx', decoder=f'{D}/fm_decoder.onnx', vocoder=f'{D}/vocos_24khz.onnx',
            data_dir=f'{D}/espeak-ng-data', lexicon=f'{D}/pinyin_split.raw'), num_threads=4, provider='cpu')
        _tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=mc, max_num_sentences=1))
    return _tts
def ref():
    x, sr = sf.read('rec/fix/ref.wav', dtype='float32'); x = x.mean(1) if x.ndim > 1 else x
    return resample_poly(x, 24000, sr).astype(np.float32), 24000, open('rec/fix/ref.txt', encoding='utf-8').read().strip()
def synth(text, speed=1.0, steps=8):
    x, sr, rt = ref(); a = tts().generate(text, rt, x.tolist(), sr, speed=speed, num_steps=steps)
    return np.asarray(a.samples, dtype=np.float32), a.sample_rate
if __name__ == '__main__':
    y, sr = synth(sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 1.0, int(sys.argv[4]) if len(sys.argv) > 4 else 8)
    sf.write(sys.argv[1], y, sr); print('wrote', sys.argv[1], f'{len(y) / sr:.2f}s')
