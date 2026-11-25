"""只重渲成片的开头一小段（到第一个关键帧为止），跟原片后面的部分无损接上：关键帧以后的画面、整条声音一个字节都不动。
用于开头的小改动（比如 tools/namesub.py 补上的名字字幕），不用整片重渲、重新两遍编码。
  1. 原片里找“最早拼接秒数”之后的第一个关键帧 K（x264 默认封闭 GOP：关键帧是 IDR，后面的帧不会参考它前面的帧）；
  2. render.mjs 用现在的页面把 0..K 重渲成高质量中间文件；
  3. 用跟原片一样的 x264 参数编码。原片是两遍编码，PPS 里的初始量化参数（pic_init_qp）是码率控制定的，
     每一讲不一样；这里用 CRF 取同一个值，SPS/PPS 就跟原片逐字节相同——不同就停下，不拼；
  4. 新开头 + 原片从 K 起的视频（直接拷贝）+ 原片的音轨（直接拷贝）→ 新成片；
  5. 核对：参数头相同；帧数相同；K 以后每个视频包、所有音频包跟原片逐包 MD5 相同；整片解码没有报错。
用法：python3 tools/headsplice.py selfN 原片.mp4 输出.mp4 [最早拼接秒数，默认 5]
"""
import json, os, subprocess, sys
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
page, src, dst = sys.argv[1], sys.argv[2], sys.argv[3]
tmin = float(sys.argv[4]) if len(sys.argv) > 4 else 5.0
W = f'out/hs_{page}'; os.makedirs(W, exist_ok=True)
run = lambda cmd, **k: subprocess.run(cmd, check=True, **k)
out = lambda cmd: subprocess.check_output(cmd).decode()


def extradata(path):
    """视频流的 avcC（SPS/PPS）字节"""
    txt = out(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_streams', '-show_data', path])
    lines = txt[txt.index('extradata=') + len('extradata='):].split('\n')[1:]
    hx = ''.join(l[10:49].replace(' ', '') for l in lines if l[:8].isalnum() and l[8:10] == ': ')
    return bytes.fromhex(hx)


def init_qp(avcc):
    """avcC 里第一个 PPS 的 pic_init_qp（指数哥伦布码一位一位读）"""
    n_sps = avcc[5] & 31; p = 6
    for _ in range(n_sps): p += 2 + int.from_bytes(avcc[p:p + 2], 'big')
    ln = int.from_bytes(avcc[p + 1:p + 3], 'big'); pps = avcc[p + 3:p + 3 + ln][1:]      # 去掉 NAL 头
    bits = ''.join(f'{b:08b}' for b in pps); i = 0
    def u(n):
        nonlocal i; v = int(bits[i:i + n], 2); i += n; return v
    def ue():
        nonlocal i; z = 0
        while bits[i] == '0': z += 1; i += 1
        i += 1; return (1 << z) - 1 + (u(z) if z else 0)
    def se():
        k = ue(); return (k + 1) // 2 if k % 2 else -(k // 2)
    ue(); ue(); u(1); u(1); assert ue() == 0      # pps_id, sps_id, cabac, bottom_field_pic_order, 只有一个 slice group
    ue(); ue(); u(1); u(2)                          # 参考帧数 l0/l1, weighted_pred, weighted_bipred
    return 26 + se()


def nframes(path):
    return int(out(['ffprobe', '-v', 'error', '-count_packets', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', path]).strip())


def pkt_md5(path, stream, t0=None):
    """逐包 MD5（不解码）：[(pts, md5)]"""
    cmd = ['ffmpeg', '-v', 'error'] + (['-ss', f'{t0:.6f}'] if t0 is not None else []) + ['-i', path, '-map', f'0:{stream}', '-c', 'copy', '-f', 'framemd5', '-']
    rows = [l.split(',') for l in out(cmd).split('\n') if l and not l.startswith('#')]
    return [(int(r[2]), r[5].strip()) for r in rows]


# 1) 拼接点：最早拼接秒数之后的第一个关键帧
keys = [float(l.split(',')[0]) for l in out(['ffprobe', '-v', 'error', '-read_intervals', '%+40', '-select_streams', 'v:0', '-skip_frame', 'nokey',
                                             '-show_entries', 'frame=pts_time', '-of', 'csv=p=0', src]).split() if l.strip(',')]
K = min(k for k in keys if k >= tmin); k = round(K * 30); assert abs(K * 30 - k) < 1e-3, K
N = nframes(src); A0 = extradata(src); qp = init_qp(A0)
print(f'{page}: 原片 {N} 帧；拼接点 = 关键帧 {K:.6f} s（第 {k} 帧）；原片 PPS 初始量化参数 {qp} → CRF {qp}', flush=True)

# 2) 重渲开头
raw = f'{W}/head_src.mp4'
if not os.path.exists(raw):
    run(f'FRAMES_DIR=out/frames_hs PAGE={page}.html node render.mjs --fps 30 --workers 3 --crf 12 --preset fast --from 0 --to {K!r} '
        f'--audio none --out {raw}.tmp.mp4 2>&1 | grep -v "^  \\|warning"', shell=True)
    os.replace(raw + '.tmp.mp4', raw); run(['rm', '-rf', 'out/frames_hs'])
assert nframes(raw) == k, (nframes(raw), k)

# 3) 用原片的参数编码开头，参数头必须逐字节相同
head = f'{W}/head.mp4'
run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', raw, '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', str(qp),
     '-maxrate', '7M', '-bufsize', '14M', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-x264-params', 'aq-mode=3',
     '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-an', head])
assert nframes(head) == k
assert extradata(head) == A0, ('参数头不同，不能直接拼', extradata(head).hex(), A0.hex())

# 4) 新开头 + 原片 K 以后的视频（拷贝）+ 原片音轨（拷贝）。auto_convert 关掉：不然拼接器会往每个关键帧里再塞一份 SPS/PPS
lst = f'{W}/list.txt'
open(lst, 'w').write(f"file '{os.path.abspath(head)}'\nfile '{os.path.abspath(src)}'\ninpoint {K:.6f}\n")
tmp = dst + '.tmp.mp4'
run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-auto_convert', '0', '-i', lst, '-i', src, '-map', '0:v', '-map', '1:a', '-c', 'copy',
     '-movflags', '+faststart', tmp])

# 5) 核对
assert extradata(tmp) == A0, '新成片参数头不对'
assert nframes(tmp) == N, ('帧数不对', nframes(tmp), N)
tbase = lambda f: out(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=time_base', '-of', 'csv=p=0', f]).strip()
assert tbase(tmp) == tbase(src) == tbase(head), (tbase(tmp), tbase(src), tbase(head))
tb = int(tbase(src).split('/')[1])
dts = [int(l.split(',')[0]) for l in out(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'packet=dts', '-of', 'csv=p=0', tmp]).split()]
assert all(b > a for a, b in zip(dts, dts[1:])), '解码时间戳不是一直往前走'
# 原片里从关键帧（按解码顺序）起的那些包，和新成片对应位置的包应该一模一样
va, vb = pkt_md5(src, 'v'), pkt_md5(tmp, 'v')
ka = next(i for i, (p, h) in enumerate(va) if abs(p - K * tb) < tb / 60)
kb = next(i for i, (p, h) in enumerate(vb) if abs(p - K * tb) < tb / 60)
same_v = [h for p, h in va[ka:]] == [h for p, h in vb[kb:]]
same_vt = [p for p, h in va[ka:]] == [p for p, h in vb[kb:]]
aa, ab = pkt_md5(src, 'a'), pkt_md5(tmp, 'a')
same_a = aa == ab
dec = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', tmp, '-f', 'null', '-'], capture_output=True, text=True).stderr.strip()
print(f'关键帧以后的视频包：{len(va) - ka} 个，内容{"相同" if same_v else "不同！"}，时间戳{"相同" if same_vt else "不同！"}；'
      f'音频包 {len(aa)} 个，{"相同" if same_a else "不同！"}；整片解码{"没有报错" if not dec else "报错：" + dec[:300]}', flush=True)
assert same_v and same_vt and same_a and not dec
os.replace(tmp, dst)
print('OK', dst, os.path.getsize(dst))
