"""本人录制 · 卷一第三章（第三讲）口误替换：用本集后半段的录音做样本，克隆声音合成正确的说法，替换进人声，
严格卡在原来的时间长度里（短了补静音，长了略微加速），画面、字幕的时间都不用动。
  python3 tts/fix9.py synth      # 每处合成几版，识别核对，挑一版 → rec/fix9/<id>.wav
  python3 tts/fix9.py splice     # 替换进人声 rec/self5_voice.wav → rec/self5_voice_fixed.wav
样本两段（都在后半段，前半段的音色已经按后半段调过）：讲述用“奥古斯丁在第三卷里……”，念原文用“你照顾每一个人……”。
"""
import json, os, re, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
VOICE = 'rec/self5_voice.wav'
REFS = {   # 页面时间（秒）、样本里说的话（照实际说的写）
    'say': (838.05, 845.62, '奥古斯丁在第三卷里，讲到他的母亲。那些年，他走得很远，他母亲天天为他哭。'),
    'quote': (853.95, 861.70, '你照顾每一个人，仿佛只照顾一个人，你照顾全人类，犹如照顾一个人。'),
}
# id, 起, 止（页面时间，取自字幕；会自动挪到最近的停顿处），替换成的话，用哪段样本
FIX = [
    ('f01', 86.65, 89.07, '讲第二条诫命的时候说', 'say'),                          # 念成了“讲第二条见面的时候说”
    ('f02', 139.51, 143.94, '是否你充塞天地后，还有不能被天地包容的部分？', 'quote'),   # 念成了“还有不被天地所包容的地方”
    ('f03', 207.59, 210.95, '因为你充塞一切，亦即是包容一切？', 'quote'),           # “亦即是”念成了“一是”（两句连着念，一起换）
    ('f04', 304.60, 308.11, '神也没有被这只瓶子固定住。', 'say'),                  # 说乱了重来：“神也没有被，就是，被这个瓶子固定住”
    ('f05', 396.36, 398.00, '托着你的那一位，', 'say'),                            # “那位托着你的那位”
    ('f06', 658.94, 661.95, '因之占有你的部分多，', 'quote'),                      # 念成了“因之占的比你的部分要多”
    ('f07', 662.29, 666.31, '如此你便为世界各部分所分割，', 'quote'),              # “如此”念成了“因此”（跟后半句连着，一起换）
]
han = lambda s: re.sub(r'[^一-鿿0-9]', '', s)
def choose(takes, target):
    """挑哪一版：读音对的里面，时长最接近原来那一段的（语速最像本人；长了最多压快 10%）；
    加速版合成出来常常一下子短很多，听着赶，所以不按“放得下”挑。takes: (序号, 读音对不对, 时长, 速度)"""
    import math
    ok = [t for t in takes if t[1]] or takes
    fit = [t for t in ok if t[2] / target <= 1.10] or sorted(ok, key=lambda t: t[2])[:1]
    return min(fit, key=lambda t: abs(math.log(t[2] / target)))
os.makedirs('rec/fix9', exist_ok=True)

def edges(x, sr, a, b):
    """把起止挪到附近最安静的地方（起点往前找、止点往后找，各不超过 0.25 秒）"""
    hop = int(0.01 * sr)
    def db(t): w = x[int(t * sr):int(t * sr) + hop * 2]; return 20 * np.log10(np.sqrt(np.mean(w ** 2)) + 1e-9)
    A = min(np.arange(a - 0.25, a + 0.06, 0.01), key=db); B = min(np.arange(b - 0.06, b + 0.25, 0.01), key=db)
    return float(A), float(B), db(A), db(B)

if sys.argv[1] == 'synth':
    sys.path.insert(0, 'tts'); import zipvoice as Z
    x, sr = sf.read(VOICE, dtype='float32')
    refs = {}
    for k, (a, b, t) in REFS.items():
        r = x[int(a * sr):int(b * sr)]; sf.write(f'rec/fix9/ref_{k}.wav', r, sr)
        refs[k] = (resample_poly(r, 24000, sr).astype(np.float32), 24000, t)
    from faster_whisper import WhisperModel
    wm = WhisperModel('large-v3', device='cpu', compute_type='int8', download_root='models/whisper', cpu_threads=4)
    def asr(y, ysr):
        segs, _ = wm.transcribe(resample_poly(y, 16000, ysr).astype(np.float32), language='zh', beam_size=5, condition_on_previous_text=False, initial_prompt='以下是普通话的句子，讲奥古斯丁《忏悔录》。充塞，包容，亦即是，诫命，因之，如此。')
        return ''.join(s.text for s in segs)
    from pypinyin import lazy_pinyin
    py = lambda t: ' '.join(lazy_pinyin(han(t)))      # 只比读音（不比声调、同音字）
    only = sys.argv[2:]
    for fid, a, b, text, rk in FIX:
        if only and fid not in only: continue
        Z.ref = lambda rk=rk: refs[rk]
        A, B, da, dbb = edges(x, sr, a, b); target = B - A - 0.08
        takes = []
        for k, sp in enumerate([1.0, 1.0, 1.0, 1.0, 1.08, 1.08]):
            if k >= 4 and any(t[1] and t[2] <= target + 0.02 for t in takes): break   # 正常语速里已经有放得下的，就不用加速版
            y, ysr = Z.synth(text, sp, 16)
            y = y[int(0.01 * ysr):]; nz = np.where(np.abs(y) > 0.02 * np.abs(y).max())[0]; y = y[max(0, nz[0] - int(0.03 * ysr)):nz[-1] + int(0.08 * ysr)]   # 去掉头尾空白
            d = len(y) / ysr; got = asr(y, ysr); ok = py(got) == py(text)
            print(f'{fid} take{k} speed {sp} {d:.2f}s (slot {target:.2f}s)  {"OK " if ok else "?? "}{got}', flush=True)
            sf.write(f'rec/fix9/{fid}_t{k}.wav', y, ysr); takes.append((k, ok, d, sp))
        pick = choose(takes, target)
        import shutil; shutil.copy(f'rec/fix9/{fid}_t{pick[0]}.wav', f'rec/fix9/{fid}.wav')
        print(f'{fid} PICK take{pick[0]} {pick[2]:.2f}s  [{A:.2f}–{B:.2f}] edge dB {da:.0f}/{dbb:.0f}  {"" if pick[1] else "（读音没对上，要听）"}', flush=True)

if sys.argv[1] == 'repick':                                                   # 按 choose() 的规则，从合成记录里重新挑
    import shutil
    rows = re.findall(r'^(f\d+) take(\d+) speed ([\d.]+) ([\d.]+)s \(slot ([\d.]+)s\)  (OK|\?\?)', open('out/fix9_synth.log', encoding='utf-8').read(), re.M)
    by = {}
    for fid, k, sp, d, slot, ok in rows: by.setdefault(fid, []).append(((int(k), ok == 'OK', float(d), float(sp)), float(slot)))
    for fid, v in by.items():
        takes = [t for t, _ in v]; pick = choose(takes, v[0][1])
        shutil.copy(f'rec/fix9/{fid}_t{pick[0]}.wav', f'rec/fix9/{fid}.wav')
        print(f'{fid} PICK take{pick[0]} {pick[2]:.2f}s (slot {v[0][1]:.2f}s, x{pick[2] / v[0][1]:.2f})')

if sys.argv[1] == 'splice':
    x, sr = sf.read(VOICE, dtype='float64'); y = x.copy(); log = []
    def rms(v): v = v[np.abs(v) > 0.03 * np.abs(v).max()] if len(v) and np.abs(v).max() > 0 else v; return np.sqrt(np.mean(v ** 2)) if len(v) else 0
    from scipy.ndimage import maximum_filter1d, uniform_filter1d
    import subprocess, tempfile
    for fid, a, b, text, rk in FIX:
        A, B, da, dbb = edges(x, sr, a, b); i, j = int(A * sr), int(B * sr); n = j - i
        t, tsr = sf.read(f'rec/fix9/{fid}.wav', dtype='float64'); t = resample_poly(t, sr, tsr)
        if len(t) > n - int(0.06 * sr):                                     # 长了：略微加速塞进去（最多 15%）
            r = len(t) / (n - int(0.06 * sr)); assert r < 1.13, (fid, r)
            with tempfile.TemporaryDirectory() as td:
                sf.write(f'{td}/a.wav', t, sr); subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', f'{td}/a.wav', '-af', f'atempo={r:.4f}', f'{td}/b.wav'], check=True)
                t, _ = sf.read(f'{td}/b.wav', dtype='float64')
        t = t * (rms(x[i:j]) / max(1e-9, rms(t)))                             # 响度跟原来这段一致
        thr = np.abs(x[i:j]).max()                                              # 峰值不超过原来这段，平滑限幅
        env = maximum_filter1d(np.abs(t), int(0.01 * sr)); g = uniform_filter1d(np.minimum(1, thr / np.maximum(env, 1e-9)), int(0.005 * sr))
        t = t * np.minimum(g, uniform_filter1d(g, int(0.02 * sr)))
        new = np.zeros(n); o = int(0.03 * sr); new[o:o + len(t)] = t[:n - o]
        f = int(0.015 * sr); ramp = np.linspace(0, 1, f)                      # 接口处 15 毫秒交叉淡化
        seg = new.copy(); seg[:f] = seg[:f] * ramp + x[i:i + f] * (1 - ramp); seg[-f:] = seg[-f:] * ramp[::-1] + x[j - f:j] * (1 - ramp[::-1])
        y[i:j] = seg; log.append(dict(id=fid, a=round(A, 3), b=round(B, 3), text=text, tts_s=round(len(t) / sr, 2)))
        print(f'{fid} [{A:.2f}–{B:.2f}] {text}  (合成 {len(t) / sr:.2f}s / 槽 {n / sr:.2f}s)', flush=True)
    sf.write('rec/self5_voice_fixed.wav', y.astype(np.float32), sr, subtype='PCM_16')
    json.dump(log, open('rec/fix9/applied.json', 'w'), ensure_ascii=False, indent=1)
    print('SPLICEDONE')
