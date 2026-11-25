"""本人录制 · 卷一第六章（上）（第八讲）：诗篇 103:13“父亲怎样怜恤他的儿女”念成了“他的女儿”。
“女”“儿”两个字中间是元音接元音，找不到干净的剪口，录音里别处也没有现成的“儿女”，所以用克隆声音合成：
样本用同一节后半句她自己念的“因为他知道我们的本体，思念我们不过是尘土”（同一段经文、同一种念法），
合成整句“父亲怎样怜恤他的儿女”，用的时候只取“的儿女”这一小截（从“的”的成阻处起：前面“他”是元音结尾，成阻处是一段安静），
“父亲怎样怜恤他”还是她自己的声音（audio/edit12.py）。
每版用 Whisper 核对读音，挑读音对、时长最接近原来那一截的。
用法：python3 tts/fix15.py → rec/fix15/erny_t<k>.wav（每一版）、rec/fix15/erny.wav（挑中的）
      python3 tts/fix15.py piece → rec/fix15/erny_piece.wav：从挑中的那版里切出“的儿女”（“的”的成阻 1.985 秒到结尾，
      位置是用 Whisper 逐字时刻 + 响度表找的），响度对齐她原来那一截“的女儿”（319.475–320.06 秒）
"""
import os, re, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SRC = 'rec/part12_clean35.wav'
REF = (324.25, 329.40, '因为他知道我们的本体，思念我们不过是尘土。')
TEXT = '父亲怎样怜恤他的儿女，'
ORIG = (317.50, 320.06)                       # 原来那一句（到逗号的停顿）
os.makedirs('rec/fix15', exist_ok=True)
if sys.argv[1:2] == ['piece']:
    y, ysr = sf.read('rec/fix15/erny.wav', dtype='float64'); piece = y[int(1.985 * ysr):]
    x, sr = sf.read(SRC, dtype='float64'); orig = x[int(319.475 * sr):int(320.06 * sr)]
    rms = lambda a: np.sqrt(np.mean(a ** 2) + 1e-20); g = rms(orig) / rms(piece); piece = piece * g
    n = int(0.005 * ysr); piece[:n] *= np.linspace(0, 1, n)
    sf.write('rec/fix15/erny_piece.wav', piece.astype(np.float32), ysr); print(f'piece {len(piece) / ysr:.3f}s, 响度 ×{g:.2f}'); sys.exit()
sys.path.insert(0, 'tts'); import zipvoice as Z
x, sr = sf.read(SRC, dtype='float32')
r = x[int(REF[0] * sr):int(REF[1] * sr)]; sf.write('rec/fix15/ref.wav', r, sr)
Z.ref = lambda: (resample_poly(r, 24000, sr).astype(np.float32), 24000, REF[2])
from faster_whisper import WhisperModel
wm = WhisperModel('large-v3', device='cpu', compute_type='int8', download_root='models/whisper', cpu_threads=4)
from pypinyin import lazy_pinyin
han = lambda s: re.sub(r'[^一-鿿]', '', s); py = lambda t: ' '.join(lazy_pinyin(han(t)))
target = ORIG[1] - ORIG[0] - 0.1
takes = []
for k, sp in enumerate([1.0, 1.0, 1.0, 1.0, 0.95, 0.95]):
    y, ysr = Z.synth(TEXT, sp, 16)
    nz = np.where(np.abs(y) > 0.02 * np.abs(y).max())[0]; y = y[max(0, nz[0] - int(0.03 * ysr)):nz[-1] + int(0.08 * ysr)]
    segs, _ = wm.transcribe(resample_poly(y, 16000, ysr).astype(np.float32), language='zh', beam_size=5, condition_on_previous_text=False)
    got = ''.join(s.text for s in segs); ok = py(got) == py(TEXT); d = len(y) / ysr
    print(f'take{k} speed {sp} {d:.2f}s (原来 {target:.2f}s)  {"OK " if ok else "?? "}{got}', flush=True)
    sf.write(f'rec/fix15/erny_t{k}.wav', y, ysr); takes.append((k, ok, d))
ok = [t for t in takes if t[1]] or takes
pick = min(ok, key=lambda t: abs(np.log(t[2] / target)))
import shutil; shutil.copy(f'rec/fix15/erny_t{pick[0]}.wav', 'rec/fix15/erny.wav')
print(f'PICK take{pick[0]} {pick[2]:.2f}s')
