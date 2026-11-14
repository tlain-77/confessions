"""Clean up a spoken recording: denoised input → rumble filter → gentle compression → target loudness → limiter.
usage: python3 audio/voice.py rec/part1_df18.wav rec/part1_clean.wav [target LUFS, default -17]
"""
import sys, subprocess, re, json
src, dst = sys.argv[1], sys.argv[2]; target = float(sys.argv[3]) if len(sys.argv) > 3 else -17.0
def lufs(path, af=None):
    cmd = ['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', (af + ',' if af else '') + 'ebur128=peak=true', '-f', 'null', '-']
    out = subprocess.run(cmd, capture_output=True, text=True).stderr
    i = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', out)[-1]); pk = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', out)[-1]); lra = float(re.findall(r'LRA:\s+(-?[\d.]+) LU', out)[-1])
    return i, pk, lra
i0, pk0, lra0 = lufs(src)
pre = -20.0 - i0                                              # bring the raw level to a known place before compressing
chain = f'volume={pre:.2f}dB,highpass=f=75:poles=2,acompressor=threshold=-22dB:ratio=2.4:attack=8:release=170:knee=6:makeup=1.5dB'
i1, pk1, lra1 = lufs(src, chain)
post = target - i1
full = chain + f',volume={post:.2f}dB,alimiter=limit=-1.5dB:attack=4:release=60:level=false,afade=t=in:d=0.05'
subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', src, '-af', full, '-ar', '48000', '-ac', '1', dst], check=True)
i2, pk2, lra2 = lufs(dst)
print(f'{src}: in {i0:.1f} LUFS (peak {pk0:.1f}, LRA {lra0:.1f}) → out {i2:.1f} LUFS (peak {pk2:.1f}, LRA {lra2:.1f})')
