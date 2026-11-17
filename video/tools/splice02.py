"""02（本人录制第一讲下半）的“只重渲改过的帧”：
  1. 按 tools/sigdiff.py 给出的帧段，用 render.mjs 把两页里改动过的帧段重新渲染成小段（out/ck4/）；
  2. 旧的整页中间文件（out/ck3/all_self2a.mp4、all_self2b.mp4）里没改的部分原样解码，跟新小段按帧号首尾相接，
     后面接的合成（两页交叉淡化、声音拼接、最终编码）跟 render_full.sh 完全一样。
用法：python3 tools/splice02.py '<self2a 帧段 JSON>' '<self2b 帧段 JSON>'
"""
import json, os, subprocess, sys
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
RA, RB = json.loads(sys.argv[1]), json.loads(sys.argv[2])
CK, CK4 = 'out/ck3', 'out/ck4'; os.makedirs(CK4, exist_ok=True)
NAME = '02-第一讲-奥古斯丁这个人与他为什么这样写（本人录制）'
OUT = f'../本人录制/{NAME}.mp4'
AEND, BEND, XF = 853.1, 566.81, 0.8
NA, NB = round(AEND * 30), round(BEND * 30)          # 两页的总帧数（旧中间文件正好这么多帧）

def frames(path):
    return int(subprocess.check_output(['ffprobe', '-v', 'error', '-count_packets', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', path]).decode().strip())

def segs(page, rng):
    out = []
    for a, b in rng:
        f = f'{CK4}/{page}_{a}_{b}.mp4'
        if not os.path.exists(f):
            subprocess.run(f'PAGE={page}.html node render.mjs --fps 30 --workers 4 --crf 14 --from {a / 30!r} --to {b / 30!r} --audio none --out {f}.tmp.mp4 2>&1 | grep -v "^  \\|warning"', shell=True, check=True)
            os.replace(f + '.tmp.mp4', f)
        n = frames(f); assert n == b - a, (f, n, b - a)
        out.append((a, b, f))
    return out

def pieces(page, total, new):
    """[(input args, frame count)]：旧文件里没改的段 + 新渲染的段，按时间顺序"""
    old, res, cur = f'{CK}/all_{page}.mp4', [], 0
    assert frames(old) == total, (old, frames(old), total)
    for a, b, f in new:
        if a > cur: res.append(((['-ss', f'{(cur - 0.5) / 30:.6f}'] if cur else []) + ['-i', old], a - cur))
        res.append((['-i', f], b - a)); cur = b
    if cur < total: res.append(((['-ss', f'{(cur - 0.5) / 30:.6f}'] if cur else []) + ['-i', old], total - cur))
    return res

A, B = pieces('self2a', NA, segs('self2a', RA)), pieces('self2b', NB, segs('self2b', RB))
args, fl, k = [], [], 0
def chain(ps, label):
    global k
    names = []
    for inp, n in ps:
        args.extend(inp); fl.append(f'[{k}:v]trim=end_frame={n},setpts=PTS-STARTPTS[p{k}]'); names.append(f'[p{k}]'); k += 1
    fl.append(''.join(names) + f'concat=n={len(names)}:v=1:a=0,format=yuv420p,fps=30[{label}]')
chain(A, 'va'); chain(B, 'vb')
ia, ib = k, k + 1; args += ['-i', 'out/self2a_mix.wav', '-i', 'out/self2b_mix.wav']
c = lambda x: round(x, 3)
OFF, TOT, AA = c(AEND - XF), c(AEND + BEND - XF), c(AEND - 0.4)
fl += [f'[va][vb]xfade=transition=fade:duration={XF}:offset={OFF},fade=t=in:st=0:d=0.6,fade=t=out:st={c(TOT - 0.9)}:d=0.9[v]',
       f'[{ia}:a]atrim=0:{AA},asetpts=PTS-STARTPTS,afade=t=in:d=0.15,afade=t=out:st={c(AA - 0.5)}:d=0.5[aa]',
       f'[{ib}:a]atrim=start=0.4,asetpts=PTS-STARTPTS,afade=t=in:d=0.3[ab]',
       f'[aa][ab]concat=n=2:v=0:a=1,afade=t=out:st={c(TOT - 1.2)}:d=1.2[a]']
cmd = ['ffmpeg', '-v', 'error', '-y'] + args + ['-filter_complex', ';'.join(fl), '-map', '[v]', '-map', '[a]',
       '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-maxrate', '8M', '-bufsize', '16M', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-x264-params', 'aq-mode=3',
       '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-movflags', '+faststart', OUT + '.tmp.mp4']
print(f'page A: {len(A)} pieces ({len(RA)} re-rendered), page B: {len(B)} pieces ({len(RB)} re-rendered); final encode…', flush=True)
subprocess.run(cmd, check=True)
os.replace(OUT + '.tmp.mp4', OUT)
print(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size', '-of', 'csv=p=0', OUT]).decode().strip())
print('ALLDONE')
