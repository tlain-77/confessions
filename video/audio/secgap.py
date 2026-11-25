"""段落之间留一口气：每一段（通读、第一句……收尾）开口之前，把停顿放宽到 GAP 秒。
收紧（audio/tighten.py）以后，所有停顿都只有 0.3–0.45 秒，配乐一直压在人声下面；在段落之间放宽到一秒半以上，
配乐就能在这里抬起来、放一个小过门（audio/score2.py），画面也能从容地换到新的一段。
加进去的不是数字静音，是这段停顿自己的底噪：取停顿中间那一截，交叉淡化着循环接长，插在停顿最安静的地方，听起来跟原来的停顿一样。
对齐结果里每一行、每个字的时刻都跟着往后挪。
用法：python3 audio/secgap.py N selfM [GAP=1.7]
  读 rec/partN_tight.wav、out/aligned_partN_tight.json、out/selfM_data.json（先用 SRC=_tight build 一遍：每一句的开始时刻减去 off，
  就是收紧后录音里的时刻；cue 的 sec 一变就是新的一段）
  → rec/partN_tightg.wav、out/aligned_partN_tightg.json、out/partN_secgap.txt；然后用 SRC=_tightg 重新 build。
"""
import json, sys
import numpy as np, soundfile as sf

N, page = sys.argv[1], sys.argv[2]; GAP = float(sys.argv[3]) if len(sys.argv) > 3 else 1.7
x, sr = sf.read(f'rec/part{N}_tight.wav', dtype='float64'); assert x.ndim == 1
al = json.load(open(f'out/aligned_part{N}_tight.json', encoding='utf-8'))
d = json.load(open(f'out/{page}_data.json', encoding='utf-8')); off = d['off']; cues = d['cues']
S = lambda t: int(round(t * sr))
heads = [(c['sec'], c['start'] - off) for i, c in enumerate(cues) if i and c['sec'] != cues[i - 1]['sec']]
hop = int(0.01 * sr); env = np.sqrt(np.convolve(x ** 2, np.ones(2 * hop) / (2 * hop), 'same')[::hop])   # 10 ms 一格的响度

ins = []                                                     # (插入点秒数, 插入的样点)
for sec, t in heads:
    prev_end = max((l['end'] for l in al['lines'] if l['end'] <= t + 0.05 and l['start'] < t - 0.1), default=None)
    if prev_end is None: continue
    # 真正的停顿：从上一句结尾往后、从这一句开头往前，按响度找安静的那一段
    a, b = int(prev_end * 100), int(t * 100)
    if b - a < 6: print(f'  {sec}: 停顿太短（{(t - prev_end):.2f} s），跳过'); continue
    seg = env[a:b]; q = np.argmin(np.convolve(seg, np.ones(5) / 5, 'same')[2:-2]) + 2 + a   # 停顿里最安静的地方
    L = t - prev_end; extra = GAP - L
    if extra < 0.1: continue
    # 底噪：停顿中间那一截（去掉两头各 40 ms）
    r0, r1 = S(prev_end + 0.04), S(t - 0.04)
    tone = x[r0:r1] if r1 - r0 > int(0.08 * sr) else np.random.default_rng(0).normal(0, max(1e-5, env[a:b].min()), int(0.2 * sr))
    xf = min(int(0.02 * sr), len(tone) // 4); need = S(extra); fill = tone.copy()
    while len(fill) < need + 2 * S(0.01):                     # 交叉淡化循环（多留插入处两头各 10 ms）
        w = np.linspace(0, 1, xf); fill = np.r_[fill[:-xf], fill[-xf:] * (1 - w) + tone[:xf] * w, tone[xf:]]
    ins.append((q / 100, fill[:need + 2 * S(0.01)], sec, L))

out, pos, cum, shifts, log = [], 0, 0.0, [], []
xf = int(0.01 * sr); w = np.linspace(0, 1, xf)
for p, fill, sec, L in ins:
    i = S(p); left = x[pos:i]; f = fill.copy()
    f[:xf] = left[-xf:] * (1 - w) + f[:xf] * w               # 插入处两边各 10 ms 交叉淡化
    end = f[-xf:] * (1 - w) + x[i:i + xf] * w
    out += [left[:-xf], f[:-xf], end]; pos = i + xf
    cum += (len(f) - 2 * xf) / sr; shifts.append((p, cum))  # 插入点以后，时刻一律往后挪 cum 秒
    log.append(f'{sec}：停顿 {L:.2f} s → {L + (len(f) - 2 * xf) / sr:.2f} s（插在 {p:.2f} s）')
out.append(x[pos:]); y = np.concatenate(out)


def M(t):
    s = 0.0
    for p, sh in shifts:
        if t >= p: s = sh
    return t + s


for l in al['lines']:
    l['start'] = round(M(l['start']), 3); l['end'] = round(M(l['end']), 3); l['chars'] = [[c, round(M(t), 3)] for c, t in l['chars']]
al['duration'] = round(len(y) / sr, 3)
sf.write(f'rec/part{N}_tightg.wav', y.astype(np.float32), sr, subtype='PCM_16')
json.dump(al, open(f'out/aligned_part{N}_tightg.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
log.append(f'总长 {len(x) / sr:.2f} → {len(y) / sr:.2f} s（{len(shifts)} 处）')
open(f'out/part{N}_secgap.txt', 'w', encoding='utf-8').write('\n'.join(log) + '\n'); print('\n'.join(log))
