"""人声 + 配乐。配乐在说话时压低（约低于人声 20 dB），停顿超过 1.2 秒、片头片尾时抬起。
usage: [SCORE=score2.py] python3 audio/music_mix.py voice.wav out.wav section_starts_csv [seed]"""
import os, sys, subprocess
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
vpath, out, secs = sys.argv[1], sys.argv[2], sys.argv[3]; seed = sys.argv[4] if len(sys.argv) > 4 else '7'
v, sr = sf.read(vpath, dtype='float64'); v = v.mean(1) if v.ndim > 1 else v; assert sr == 48000
T = len(v) / sr
SCORE = os.environ.get('SCORE', 'score.py')                     # 第八讲起用 score2.py（配器更丰富，段落之间有过门，片头片尾有引子和收束）
if SCORE == 'score.py':
    subprocess.run(['python3', 'audio/score.py', out + '.mid', f'{T + 4:.2f}', secs, seed], check=True)
else:                                                            # 新的作曲要知道第一句话从哪里开始、最后一句话在哪里结束
    h = int(0.05 * sr); ee = np.array([np.sqrt(np.mean(v[i * h:(i + 1) * h] ** 2)) for i in range(len(v) // h)]); on = np.where(ee > 0.1 * np.percentile(ee, 95))[0]
    subprocess.run(['python3', f'audio/{SCORE}', out + '.mid', f'{T + 4:.2f}', secs, seed, f'{on[0] * 0.05:.2f}', f'{(on[-1] + 1) * 0.05:.2f}'], check=True)
subprocess.run(['fluidsynth', '-ni', '-q', '-g', '0.6', '-r', '48000', '-F', out + '.music.wav', '/usr/share/sounds/sf2/FluidR3_GM.sf2', out + '.mid'], check=True, capture_output=True)
m, msr = sf.read(out + '.music.wav', dtype='float64'); m = m[:len(v)]; m = np.pad(m, ((0, max(0, len(v) - len(m))), (0, 0)))
# 说话的包络（50 ms 一格）
hop = int(0.05 * sr); n = len(v) // hop
e = np.array([np.sqrt(np.mean(v[i * hop:(i + 1) * hop] ** 2)) for i in range(n)]); act = e > 0.1 * np.percentile(e, 95)
# 短于 1.2 秒的空隙算作还在说话
gap = 0; for_ = act.copy()
idx = np.where(act)[0]
for a, b in zip(idx[:-1], idx[1:]):
    if (b - a) * 0.05 < 1.2: for_[a:b] = True
target = np.where(for_, -20.0, -11.0)                            # 相对人声响度：说话时低 20 dB，空隙低 11 dB
# 平滑：抬起慢（1.0 s），压下快（0.25 s）
g = np.empty(n); g[0] = target[0]
for i in range(1, n):
    k = 0.05 / (0.25 if target[i] < g[i - 1] else 1.0); g[i] = g[i - 1] + (target[i] - g[i - 1]) * min(1, k)
g = np.repeat(g, hop); g = np.pad(g, (0, len(v) - len(g)), mode='edge')
def rdb(x):
    fr = x[: len(x) // 4800 * 4800].reshape(-1, 4800); r = np.sqrt((fr ** 2).mean(1)); r = r[r > r.max() * 0.1]; return 20 * np.log10(np.sqrt((r ** 2).mean()) + 1e-12)
vdb, mdb = rdb(v), rdb(m.mean(1))
m = m * (10 ** ((vdb - mdb + g) / 20))[:, None]
fade = np.ones(len(v)); f = int(2.5 * sr); fade[-f:] = np.linspace(1, 0, f); m *= fade[:, None]
mix = np.stack([v, v], 1) + m
pk = np.abs(mix).max(); mix *= min(1.0, 0.89 / pk)
sf.write(out, mix.astype(np.float32), sr)
print(f'mix {T:.1f}s | voice {vdb:.1f} dB | music under speech {vdb - 20:.1f} dB, in pauses {vdb - 11:.1f} dB | peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS')
