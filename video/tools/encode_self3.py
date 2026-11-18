"""03（本人录制 · 翻开第一页，逐句换背景版）出成片：把 out/ck7/ 里按 180 秒渲好的分块首尾相接，配上人声 + 配乐，两遍编码。
成片压在 405 MB 左右（发送上限 400 MiB ≈ 419 MB）。中途被打断时，设 SKIP_PASS1=1 可以直接从第二遍接着来。
用法：python3 tools/encode_self3.py
"""
import json, os, subprocess
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
CK = 'out/ck7'
OUT = '../本人录制/03-第一讲-翻开第一页（本人录制）.mp4'
TOT = json.load(open('out/self3_data.json'))['total']

def frames(path):
    return int(subprocess.check_output(['ffprobe', '-v', 'error', '-count_packets', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', path]).decode().strip())

starts = sorted(int(f[6:-4]) for f in os.listdir(CK) if f.startswith('self3_') and f.endswith('.mp4') and 'tmp' not in f)
g = 0
with open(f'{CK}/list.txt', 'w') as L:
    for s in starts:
        f = f'self3_{s}.mp4'; n = frames(f'{CK}/{f}')
        assert round(s * 30) == g, ('chunk gap', f, g); L.write(f"file '{f}'\n"); g += n
print(f'{len(starts)} chunks, {g} frames ({g / 30:.2f}s; page total {TOT})', flush=True)
assert abs(g / 30 - TOT) < 0.05, 'chunks do not cover the page'

VB = int(405e6 * 8 / TOT / 1000 - 128 - 6)
IN = ['-f', 'concat', '-safe', '0', '-i', f'{CK}/list.txt']
X = ['-c:v', 'libx264', '-preset', 'slow', '-b:v', f'{VB}k', '-maxrate', '7M', '-bufsize', '14M', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-x264-params', 'aq-mode=3']
if not (os.environ.get('SKIP_PASS1') and os.path.exists(f'{CK}/p-0.log.mbtree')):
    print(f'video {VB} kbps; pass 1…', flush=True)
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y'] + IN + ['-vf', 'fps=30,format=yuv420p'] + X + ['-pass', '1', '-passlogfile', f'{CK}/p', '-an', '-f', 'null', '/dev/null'], check=True)
print('pass 2…', flush=True)
subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y'] + IN + ['-i', 'out/self3_mix.wav', '-filter_complex',
               f'[0:v]fps=30,format=yuv420p[v];[1:a]afade=t=in:d=0.15,afade=t=out:st={round(TOT - 1.2, 2)}:d=1.2[a]', '-map', '[v]', '-map', '[a]'] + X +
               ['-pass', '2', '-passlogfile', f'{CK}/p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
                '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-shortest', '-movflags', '+faststart', OUT + '.tmp.mp4'], check=True)
os.replace(OUT + '.tmp.mp4', OUT)
print(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size', '-of', 'csv=p=0', OUT]).decode().strip())
print('ALLDONE', flush=True)
