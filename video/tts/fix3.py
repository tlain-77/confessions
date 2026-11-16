"""用本次录音里的一段做样本，克隆声音合成补录句，并用识别核对。usage: fix3.py out.wav "句子" [n]"""
import sys, re, numpy as np, soundfile as sf, sherpa_onnx
from scipy.signal import resample_poly
sys.path.insert(0, 'tts'); import zipvoice as Z
def ref():
    x, sr = sf.read('rec/' + (sys.argv[4] if len(sys.argv) > 4 else 'fix3') + '/ref.wav', dtype='float32')
    return resample_poly(x, 24000, sr).astype(np.float32), 24000, open('rec/' + (sys.argv[4] if len(sys.argv) > 4 else 'fix3') + '/ref.txt', encoding='utf-8').read().strip()
Z.ref = ref
rec = sherpa_onnx.OfflineRecognizer.from_sense_voice(model='models/sensevoice/model.int8.onnx', tokens='models/sensevoice/tokens.txt', language='zh', use_itn=False, num_threads=4)
out, text = sys.argv[1], sys.argv[2]; n = int(sys.argv[3]) if len(sys.argv) > 3 else 4
for k in range(n):
    y, sr = Z.synth(text, 1.0, 8)
    x16 = resample_poly(y, 16000, sr).astype(np.float32); st = rec.create_stream(); st.accept_waveform(16000, x16 / np.abs(x16).max() * 0.8); rec.decode_stream(st)
    f = out.replace('.wav', f'_{k}.wav'); sf.write(f, y, sr); print(f, f'{len(y)/sr:.2f}s', st.result.text)
