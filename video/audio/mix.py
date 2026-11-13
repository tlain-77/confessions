"""Build the soundtrack: narration + a quiet synthesized pad (no samples, no third-party music).
usage: python3 audio/mix.py out/timeline_xxx.json out/voice_xxx.wav out/sample_mix.wav
"""
import sys, json
import numpy as np, soundfile as sf
from scipy.signal import fftconvolve, resample_poly, butter, sosfilt

tl = json.load(open(sys.argv[1], encoding='utf-8')); C = {c['id']: c for c in tl['cues']}
SR = 48000; T = tl['total']; N = int(T * SR); t = np.arange(N) / SR
rng = np.random.default_rng(7)

def env_points(pts):                      # piecewise-linear envelope from (time, value) pairs, smoothed
    xs, ys = zip(*sorted(pts)); e = np.interp(t, xs, ys)
    k = int(0.6 * SR); w = np.hanning(k); w /= w.sum()
    return np.convolve(np.pad(e, k // 2, mode='edge'), w, mode='same')[k // 2:k // 2 + N]

def voice(freq, amp, lfo_rate, lfo_phase, pan):
    out = np.zeros((N, 2))
    for det, ph in ((-2.5, 0.0), (2.5, 1.7), (0.0, 3.1)):          # three slightly detuned oscillators = slow chorus
        f = freq * 2 ** (det / 1200)
        s = np.sin(2 * np.pi * f * t + ph) + 0.22 * np.sin(2 * np.pi * 2 * f * t + ph * 2) + 0.07 * np.sin(2 * np.pi * 3 * f * t + ph)
        out[:, 0] += s * (0.5 - pan * 0.35 + 0.12 * np.sin(ph)); out[:, 1] += s * (0.5 + pan * 0.35 - 0.12 * np.sin(ph))
    lfo = 0.72 + 0.28 * np.sin(2 * np.pi * lfo_rate * t + lfo_phase)
    return out * (amp * lfo)[:, None] / 3

# harmony: a D pedal with the upper voices drifting between D(add9) and G/D, resolving on D at the end
tz = C['A2']['end'] - 0.62; tq = C['F1']['start']; tf = C['G3']['start']
chordB = env_points([(0, 0), (C['B2']['start'], 0), (C['C1']['start'], 1), (C['C4']['end'], 1), (C['D2']['start'], 0), (C['E1']['start'], 0), (C['E1']['end'], 1),
                     (tq - 0.5, 1), (tq + 2.5, 0), (C['F3']['start'], 0), (C['F4']['start'], 1), (C['G1']['start'], 1), (C['G1']['end'], 0), (T, 0)])
chordA = 1 - chordB
pad = voice(73.42, 0.9, 0.031, 0.3, 0.0) + voice(146.83, 0.6, 0.043, 1.1, -0.2) + voice(110.0, 0.45, 0.037, 2.0, 0.25)
padA = voice(185.00, 0.34, 0.051, 0.7, -0.5) + voice(220.00, 0.40, 0.047, 2.4, 0.5) + voice(329.63, 0.26, 0.061, 4.0, 0.1)
padB = voice(196.00, 0.36, 0.049, 1.9, -0.5) + voice(246.94, 0.34, 0.053, 0.2, 0.5) + voice(293.66, 0.28, 0.057, 3.3, -0.1)
pad = pad + padA * chordA[:, None] + padB * chordB[:, None]

# shimmer: high partials that open up at the big moments
shim_env = env_points([(0, 0), (tz - 0.3, 0), (tz + 1.2, 1), (tz + 5, 0.25), (C['B2']['start'], 0.08), (tq - 0.8, 0.08), (tq + 1.0, 0.7), (tq + 6, 0.12),
                       (tf - 0.5, 0.12), (tf + 3.0, 1), (T - 2.5, 0.5), (T, 0)])
shim = (voice(587.33, 0.10, 0.11, 0.5, -0.6) + voice(880.0, 0.07, 0.13, 2.2, 0.6) + voice(1318.5, 0.03, 0.17, 1.0, 0.0)) * shim_env[:, None]

# overall dynamics: low under speech, swelling in the pauses around the reveals
dyn = env_points([(0, 0), (2.5, 0.55), (tz - 1.0, 0.6), (tz + 0.8, 1.35), (C['B1']['start'] + 0.5, 0.8), (C['B2']['start'], 0.6), (C['D2']['end'], 0.75),
                  (C['E1']['start'], 0.6), (tq - 0.9, 0.95), (tq + 0.6, 0.75), (C['F2']['start'], 0.6), (tf, 0.7), (C['G3']['end'] + 1.0, 1.3), (T - 2.2, 0.9), (T - 0.3, 0)])
music = (pad + shim) * dyn[:, None]

# a soft low swell under 「主」
def boom(at, amp):
    n = int(4.0 * SR); x = np.arange(n) / SR
    f = 46 + 16 * np.exp(-x * 3.0); ph = 2 * np.pi * np.cumsum(f) / SR
    e = (1 - np.exp(-x * 60)) * np.exp(-x * 1.5)
    b = np.zeros(N); i = int(at * SR); m = min(n, N - i); b[i:i + m] = (np.sin(ph) * e * amp)[:m]; return np.stack([b, b], 1)
music += boom(tz, 0.55) + boom(tf + C['G3']['dur'] * 0.36, 0.3)

# reverb: exponentially decaying stereo noise, warm
def reverb(x, secs, wet, lp=4200):
    n = int(secs * SR); d = np.exp(-np.arange(n) / SR * (6.9 / secs))
    ir = rng.standard_normal((n, 2)) * d[:, None]
    ir = sosfilt(butter(2, lp, 'low', fs=SR, output='sos'), ir, axis=0); ir /= np.sqrt((ir ** 2).sum(0))
    w = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in (0, 1)], 1)
    return x * (1 - wet * 0.5) + w * wet
music = reverb(music, 3.2, 0.5)
music = sosfilt(butter(2, 3200, 'low', fs=SR, output='sos'), music, axis=0)

# narration: 24 k → 48 k, trim rumble, a touch of room so it sits with the pad
v, vsr = sf.read(sys.argv[2], dtype='float64'); v = resample_poly(v, SR, vsr)
v = sosfilt(butter(2, 70, 'high', fs=SR, output='sos'), v); v = np.pad(v, (0, max(0, N - len(v))))[:N]
vs = reverb(np.stack([v, v], 1), 0.9, 0.07, lp=6000)

def rms_db(x):
    fr = x[: len(x) // 4800 * 4800].reshape(-1, 4800); r = np.sqrt((fr ** 2).mean(1)); r = r[r > r.max() * 0.1]; return 20 * np.log10(np.sqrt((r ** 2).mean()) + 1e-12)
vs *= 10 ** ((-19.0 - rms_db(vs.mean(1))) / 20)          # narration around -19 dBFS RMS while speaking
music *= 10 ** ((-36.0 - rms_db(music.mean(1))) / 20)    # pad well underneath
mix = vs + music
peak = np.abs(mix).max()
if peak > 0.89: mix *= 0.89 / peak
sf.write(sys.argv[3], mix.astype(np.float32), SR)
sf.write(sys.argv[3].replace('.wav', '_music.wav'), (music / max(1e-9, np.abs(music).max()) * 0.5).astype(np.float32), SR)
print(f'mix {T:.2f}s  voice {rms_db(vs.mean(1)):.1f} dB  music {rms_db(music.mean(1)):.1f} dB  peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS')
