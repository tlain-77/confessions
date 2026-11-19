"""01、02（本人录制，逐句换背景版）出成片：把 out/ck8/ 里按 180 秒渲好的分块首尾相接，配上原来的混音，两遍编码。
  python3 tools/encode_self12.py 1   # 01：一个页面（self1），压在 98 MB 左右
  python3 tools/encode_self12.py 2   # 02：两个页面（self2a 在片尾预告前切掉，淡入 self2b），跟 render_full.sh 的拼法一样，压在 405 MB 左右（发送上限 400 MiB）
中途被打断时，设 SKIP_PASS1=1 可以直接从第二遍接着来。
"""
import json, os, subprocess, sys
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
CK = 'out/ck8'

def frames(path):
    return int(subprocess.check_output(['ffprobe', '-v', 'error', '-count_packets', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', path]).decode().strip())

def chunks(page, upto):
    starts = sorted(int(f[len(page) + 1:-4]) for f in os.listdir(CK) if f.startswith(page + '_') and f.endswith('.mp4') and 'tmp' not in f)
    g = 0
    with open(f'{CK}/list_{page}.txt', 'w') as L:
        for s in starts:
            f = f'{page}_{s}.mp4'; n = frames(f'{CK}/{f}')
            assert round(s * 30) == g, ('chunk gap', f, g); L.write(f"file '{f}'\n"); g += n
    assert g == round(upto * 30), (page, g, round(upto * 30))
    print(f'{page}: {len(starts)} chunks, {g} frames', flush=True)
    return ['-f', 'concat', '-safe', '0', '-i', f'{CK}/list_{page}.txt']

def run(args):
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y'] + args, check=True)

X = lambda vb: ['-c:v', 'libx264', '-preset', 'slow', '-b:v', f'{vb}k', '-maxrate', '7M', '-bufsize', '14M', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-x264-params', 'aq-mode=3']
COL = ['-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709']
AUD = ['-c:a', 'aac', '-b:a', '128k', '-ar', '48000']
skip1 = lambda log: os.environ.get('SKIP_PASS1') and os.path.exists(log + '-0.log.mbtree')

if sys.argv[1] == '1':
    TOT = json.load(open('out/self1_data.json'))['total']
    OUT = '../本人录制/01-第一讲-开头与这本书不好读（本人录制）.mp4'
    IN = chunks('self1', TOT); VB = int(98e6 * 8 / TOT / 1000 - 134); log = f'{CK}/p1'
    print(f'01: {TOT}s, video {VB} kbps', flush=True)
    if not skip1(log): run(IN + ['-vf', 'fps=30,format=yuv420p'] + X(VB) + ['-pass', '1', '-passlogfile', log, '-an', '-f', 'null', '/dev/null'])
    run(IN + ['-i', 'out/self1_mix.wav', '-map', '0:v', '-map', '1:a', '-vf', 'fps=30,format=yuv420p'] + X(VB) + ['-pass', '2', '-passlogfile', log] + COL + AUD + ['-shortest', '-movflags', '+faststart', OUT + '.tmp.mp4'])
else:
    AEND, BEND, XF = 853.1, 566.81, 0.8
    OUT = '../本人录制/02-第一讲-奥古斯丁这个人与他为什么这样写（本人录制）.mp4'
    IA, IB = chunks('self2a', AEND), chunks('self2b', BEND)
    c = lambda x: round(x, 3)
    OFF, TOT, AA = c(AEND - XF), c(AEND + BEND - XF), c(AEND - 0.4)
    VB = int(405e6 * 8 / TOT / 1000 - 134); log = f'{CK}/p2'
    print(f'02: {TOT}s, video {VB} kbps', flush=True)
    FV = (f'[0:v]trim=0:{AEND},setpts=PTS-STARTPTS,format=yuv420p,fps=30[va];[1:v]setpts=PTS-STARTPTS,format=yuv420p,fps=30[vb];'
          f'[va][vb]xfade=transition=fade:duration={XF}:offset={OFF},fade=t=in:st=0:d=0.6,fade=t=out:st={c(TOT - 0.9)}:d=0.9[v]')
    FA = (f'[2:a]atrim=0:{AA},asetpts=PTS-STARTPTS,afade=t=in:d=0.15,afade=t=out:st={c(AA - 0.5)}:d=0.5[aa];'
          f'[3:a]atrim=start=0.4,asetpts=PTS-STARTPTS,afade=t=in:d=0.3[ab];[aa][ab]concat=n=2:v=0:a=1,afade=t=out:st={c(TOT - 1.2)}:d=1.2[a]')
    if not skip1(log): run(IA + IB + ['-filter_complex', FV, '-map', '[v]'] + X(VB) + ['-pass', '1', '-passlogfile', log, '-an', '-f', 'null', '/dev/null'])
    run(IA + IB + ['-i', 'out/self2a_mix.wav', '-i', 'out/self2b_mix.wav', '-filter_complex', FV + ';' + FA, '-map', '[v]', '-map', '[a]'] + X(VB) + ['-pass', '2', '-passlogfile', log] + COL + AUD + ['-movflags', '+faststart', OUT + '.tmp.mp4'])
os.replace(OUT + '.tmp.mp4', OUT)
print(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size', '-of', 'csv=p=0', OUT]).decode().strip())
print('DONE' + sys.argv[1], flush=True)
