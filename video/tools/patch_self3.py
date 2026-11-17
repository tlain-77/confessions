"""03（本人录制 · 翻开第一页）修完“闪”之后，只重渲改过的帧，再出成片。
  1. out/ck5/ 里按 240 秒分块的中间文件（旧页面渲的）照旧用；
  2. tools/sigdiff.py 给出的帧段（新旧两版页面逐帧指纹不一样的地方）用新页面重渲成小段，放在 out/ck6/；
  3. 旧分块里没改的部分原样解码，跟新小段按帧号首尾相接，配上人声 + 配乐，两遍编码出成片。
用法：python3 tools/patch_self3.py '<帧段 JSON>' [新页面开始的分块起点秒数，这个分块及以后不用补]
"""
import json, os, subprocess, sys
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
R = json.loads(sys.argv[1]); NEWFROM = float(sys.argv[2]) if len(sys.argv) > 2 else 1e9
CK, CK6 = 'out/ck5', 'out/ck6'; os.makedirs(CK6, exist_ok=True)
NAME = '03-第一讲-翻开第一页（本人录制）'
OUT = f'../本人录制/{NAME}.mp4'
TOT = json.load(open('out/self3_data.json'))['total']

def frames(path):
    return int(subprocess.check_output(['ffprobe', '-v', 'error', '-count_packets', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', path]).decode().strip())

# 分块：起点秒数 → (文件, 起始帧, 帧数)
starts = sorted(int(f[6:-4]) for f in os.listdir(CK) if f.startswith('self3_') and f.endswith('.mp4') and 'tmp' not in f)
chunks, g = [], 0
for s in starts:
    f = f'{CK}/self3_{s}.mp4'; n = frames(f)
    assert round(s * 30) == g, ('chunk gap', f, g); chunks.append((f, g, n)); g += n
N = g
print(f'{len(chunks)} chunks, {N} frames ({N / 30:.2f}s; page total {TOT})', flush=True)
assert abs(N / 30 - TOT) < 0.05, 'chunks do not cover the page'

# 只补旧页面渲的那部分
lim = round(NEWFROM * 30)
R = [[a, min(b, lim, N)] for a, b in R if a < min(lim, N)]
new = []
for a, b in R:
    f = f'{CK6}/self3_{a}_{b}.mp4'
    for wk in (4, 2, 2):                                  # 浏览器偶尔崩（Target crashed）：少开几个进程再试
        if os.path.exists(f): break
        subprocess.run(f'set -o pipefail; FRAMES_DIR=out/frames_s3p PAGE=self3.html node render.mjs --fps 30 --workers {wk} --crf 14 --from {a / 30!r} --to {b / 30!r} --audio none --out {f}.tmp.mp4 2>&1 | grep -v "^  \\|warning"', shell=True, executable='/bin/bash')
        if os.path.exists(f + '.tmp.mp4'): os.replace(f + '.tmp.mp4', f)
        else: print(f'render failed for {a}-{b} with {wk} workers', flush=True)
    n = frames(f); assert n == b - a, (f, n, b - a)
    new.append((a, b, f))
print(f'{len(new)} patched ranges, {sum(b - a for a, b, _ in new)} frames', flush=True)

# 拼：[(输入参数, 帧数)]，按时间顺序
def old_piece(a, b):
    out = []
    for f, g0, n in chunks:
        lo, hi = max(a, g0), min(b, g0 + n)
        if lo < hi: out.append(((['-ss', f'{(lo - g0 - 0.5) / 30:.6f}'] if lo > g0 else []) + ['-i', f], hi - lo))
    return out
pieces, cur = [], 0
for a, b, f in new:
    if a > cur: pieces += old_piece(cur, a)
    pieces.append((['-i', f], b - a)); cur = b
if cur < N: pieces += old_piece(cur, N)
assert sum(n for _, n in pieces) == N

args, fl, names = [], [], []
for k, (inp, n) in enumerate(pieces):
    args += inp; fl.append(f'[{k}:v]trim=end_frame={n},setpts=PTS-STARTPTS[p{k}]'); names.append(f'[p{k}]')
fl.append(''.join(names) + f'concat=n={len(names)}:v=1:a=0,format=yuv420p,fps=30[v]')
FGV = ';'.join(fl)                                     # 第一遍只要画面（-an），图里不能留没接出去的声音
ia = len(pieces); args += ['-i', 'out/self3_mix.wav']
fl.append(f'[{ia}:a]afade=t=in:d=0.15,afade=t=out:st={round(TOT - 1.2, 2)}:d=1.2[a]')
FG = ';'.join(fl)
VB = int(405e6 * 8 / TOT / 1000 - 128 - 6)              # 成片压在 405 MB 左右（发送上限 400 MiB ≈ 419 MB）
X = ['-c:v', 'libx264', '-preset', 'slow', '-b:v', f'{VB}k', '-maxrate', '7M', '-bufsize', '14M', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-x264-params', 'aq-mode=3']
print(f'{len(pieces)} pieces; video {VB} kbps; pass 1…', flush=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y'] + args[:-2] + ['-filter_complex', FGV, '-map', '[v]'] + X + ['-pass', '1', '-passlogfile', f'{CK6}/p', '-an', '-f', 'null', '/dev/null'], check=True)
print('pass 2…', flush=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y'] + args + ['-filter_complex', FG, '-map', '[v]', '-map', '[a]'] + X + ['-pass', '2', '-passlogfile', f'{CK6}/p',
               '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-shortest', '-movflags', '+faststart', OUT + '.tmp.mp4'], check=True)
os.replace(OUT + '.tmp.mp4', OUT)
print(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size', '-of', 'csv=p=0', OUT]).decode().strip())
print('ALLDONE', flush=True)
