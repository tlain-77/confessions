"""03（本人录制 · 翻开第一页）口误替换：用本集录音里的一段做样本，克隆声音合成正确的说法，替换进人声，
并且严格卡在原来的时间长度里（短了补静音，长了略微加速），画面、字幕的时间都不用动。
  python3 tts/fix6.py synth      # 每处合成几版，识别核对，挑一版 → rec/fix6/<id>.wav
  python3 tts/fix6.py splice     # 替换进人声 → rec/self3_voice_fixed.wav，重混 → out/self3_mix.wav（原混音备份为 out/self3_mix_orig.wav）
"""
import json, os, re, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
REF = ('rec/fix6/refA.wav', '这回不是交稿子了。一个把伟大这个词用在不配的对象身上，用了半辈子的人，总算找到了真配得这个词的那一位。')
# id, [起, 止]（页面时间，近似，会自动挪到最近的停顿处），替换成的话（None：只是删掉，留静音）
FIX = [
    ('f01', 61.05, 64.36, '第一句是诗篇的第一百四十五篇第三节'),          # 说成了 154 篇
    ('f02', 197.58, 201.20, '孩子在哪个学校上学'),                       # 孩子在哪个学校长大的，孩子住在哪个学校
    ('f03', 212.25, 213.75, '这并不丢人'),                               # 这不这并不丢人
    ('f04', 376.75, 379.45, '这句子，几乎又把上文抄了一遍'),                     # 又把上文又抄了一遍
    ('f05', 393.00, 395.95, '身上写着：神阻挡骄傲的人'),                     # 阻挡骄傲的人，神阻挡骄傲的人
    ('f06', 516.60, 519.30, '神在你们心里运行'),                         # 神在你们里面心里运行
    ('f07', 527.62, 528.52, None),                                       # 还赞美，（说了半句又重来）
    ('f08', 660.70, 662.60, '因为你造我们是为了你'),                     # 因为你创造我们
    ('f09', 983.10, 985.62, '请使我得知并理解'),                         # 请你使我
    ('f10', 1264.00, 1265.90, '他并没有一咬牙下定决心'),                   # 一口咬牙
    ('f11', 1391.90, 1394.20, '把气吹进他的鼻孔里'),                     # 把气体吹进
    ('f12', 1492.38, 1497.10, '一个心思压根儿不在内容上的修辞学教授'),   # 一个心思都压根儿都不在内容上的一个修辞学教授
]
VOICE = 'rec/self3_voice.wav'
han = lambda s: re.sub(r'[^一-鿿0-9]', '', s)

def edges(x, sr, a, b):
    """把起止挪到附近最安静的地方（起点往前找、止点往后找，各不超过 0.25 秒）"""
    hop = int(0.01 * sr)
    def db(t): w = x[int(t * sr):int(t * sr) + hop * 2]; return 20 * np.log10(np.sqrt(np.mean(w ** 2)) + 1e-9)
    A = min(np.arange(a - 0.25, a + 0.06, 0.01), key=db); B = min(np.arange(b - 0.06, b + 0.25, 0.01), key=db)
    return float(A), float(B), db(A), db(B)

if sys.argv[1] == 'synth':
    import sherpa_onnx
    sys.path.insert(0, 'tts'); import zipvoice as Z
    def ref():
        r, sr = sf.read(REF[0], dtype='float32'); return resample_poly(r, 24000, sr).astype(np.float32), 24000, REF[1]
    Z.ref = ref
    from faster_whisper import WhisperModel
    wm = WhisperModel('large-v3', device='cpu', compute_type='int8', download_root='models/whisper', cpu_threads=4)
    def asr(y, sr):
        segs, _ = wm.transcribe(resample_poly(y, 16000, sr).astype(np.float32), language='zh', beam_size=5, condition_on_previous_text=False, initial_prompt='以下是普通话的句子。')
        return ''.join(s.text for s in segs)
    from pypinyin import lazy_pinyin
    py = lambda t: ' '.join(lazy_pinyin(han(t).replace('145', '一百四十五').replace('3', '三').replace('儿', '')))   # 只比读音（不比声调、同音字）
    x, sr = sf.read(VOICE, dtype='float32')
    only = sys.argv[2:]
    for fid, a, b, text in FIX:
        if text is None or (only and fid not in only): continue
        A, B, da, dbb = edges(x, sr, a, b); target = B - A - 0.08
        takes = []
        for k, sp in enumerate([1.0, 1.0, 1.0, 1.0, 1.08, 1.08]):
            if k >= 4 and any(t[1] and t[2] <= target + 0.02 for t in takes): break   # 正常语速里已经有放得下的，就不用加速版
            y, ysr = Z.synth(text, sp, 16)
            y = y[int(0.01 * ysr):]; nz = np.where(np.abs(y) > 0.02 * np.abs(y).max())[0]; y = y[max(0, nz[0] - int(0.03 * ysr)):nz[-1] + int(0.08 * ysr)]   # 去掉头尾空白
            d = len(y) / ysr; got = asr(y, ysr); ok = py(got) == py(text)
            print(f'{fid} take{k} speed {sp} {d:.2f}s (slot {target:.2f}s)  {"OK " if ok else "?? "}{got}', flush=True)
            sf.write(f'rec/fix6/{fid}_t{k}.wav', y, ysr); takes.append((k, ok, d, sp))
        # 读音对、放得下的里面，挑时长居中的那一版（最像正常语速）；都放不下就挑最短的
        good = [t for t in takes if t[1] and t[2] <= target + 0.02] or [t for t in takes if t[1]] or takes
        good.sort(key=lambda t: t[2]); pick = good[len(good) // 2] if all(t[2] <= target + 0.02 for t in good) else good[0]
        best = (None, pick[0], pick[2])
        import shutil; shutil.copy(f'rec/fix6/{fid}_t{best[1]}.wav', f'rec/fix6/{fid}.wav')
        print(f'{fid} PICK take{best[1]} {best[2]:.2f}s  [{A:.2f}–{B:.2f}] edge dB {da:.0f}/{dbb:.0f}', flush=True)

if sys.argv[1] == 'splice':
    x, sr = sf.read(VOICE, dtype='float64'); y = x.copy(); log = []
    def rms(v): v = v[np.abs(v) > 0.03 * np.abs(v).max()] if len(v) and np.abs(v).max() > 0 else v; return np.sqrt(np.mean(v ** 2)) if len(v) else 0
    for fid, a, b, text in FIX:
        A, B, da, dbb = edges(x, sr, a, b); i, j = int(A * sr), int(B * sr); n = j - i
        new = np.zeros(n)
        if text is not None:
            t, tsr = sf.read(f'rec/fix6/{fid}.wav', dtype='float64'); t = resample_poly(t, sr, tsr)
            if len(t) > n - int(0.06 * sr):                                     # 长了：略微加速塞进去（最多 15%）
                r = len(t) / (n - int(0.06 * sr)); assert r < 1.15, (fid, r)
                import subprocess, tempfile
                with tempfile.TemporaryDirectory() as td:
                    sf.write(f'{td}/a.wav', t, sr); subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', f'{td}/a.wav', '-af', f'atempo={r:.4f}', f'{td}/b.wav'], check=True)
                    t, _ = sf.read(f'{td}/b.wav', dtype='float64')
            t = t * (rms(x[i:j]) / max(1e-9, rms(t)))                         # 响度跟原来这段一致
            thr = np.abs(x[i:j]).max()                                          # 峰值不超过原来这段（原录音是限过幅的），平滑限幅
            from scipy.ndimage import maximum_filter1d, uniform_filter1d
            env = maximum_filter1d(np.abs(t), int(0.01 * sr)); g = uniform_filter1d(np.minimum(1, thr / np.maximum(env, 1e-9)), int(0.005 * sr))
            t = t * np.minimum(g, uniform_filter1d(g, int(0.02 * sr)))
            o = int(0.03 * sr); new[o:o + len(t)] = t[:n - o]
        f = int(0.015 * sr); ramp = np.linspace(0, 1, f)                      # 接口处 15 毫秒交叉淡化
        seg = new.copy(); seg[:f] = seg[:f] * ramp + x[i:i + f] * (1 - ramp); seg[-f:] = seg[-f:] * ramp[::-1] + x[j - f:j] * (1 - ramp[::-1])
        y[i:j] = seg; log.append(dict(id=fid, a=round(A, 3), b=round(B, 3), text=text))
        print(f'{fid} [{A:.2f}–{B:.2f}] {"（删掉）" if text is None else text}', flush=True)
    sf.write('rec/self3_voice_fixed.wav', y.astype(np.float32), sr, subtype='PCM_16')
    json.dump(log, open('rec/fix6/applied.json', 'w'), ensure_ascii=False, indent=1)
    # 重混：原混音里人声是 0.9779 倍线性叠进去的（另外还有配乐、几处音效、片头片尾淡入淡出），
    # 所以只在改过的片段上加上“新人声 − 旧人声”的差，其余部分一个采样都不动
    if not os.path.exists('out/self3_mix_orig.wav'): os.replace('out/self3_mix.wav', 'out/self3_mix_orig.wav')
    old, msr = sf.read('out/self3_mix_orig.wav', dtype='float64'); assert msr == sr
    mix = old.copy(); mix[:len(y)] += 0.9779 * (y - x)[:, None]
    print('changed samples:', int((np.abs(mix - old).max(1) > 1e-6).sum()), ' peak', float(np.abs(mix).max()))
    sf.write('out/self3_mix.wav', np.clip(mix, -1, 1).astype(np.float32), sr, subtype='PCM_16')
    print('SPLICEDONE')
