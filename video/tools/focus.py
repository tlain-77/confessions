"""给每幅画找几处“值得推近看”的地方（细节最多、彼此不重叠的几块），写成 web/img/focus.js。
逐句换背景时，第一次用整幅，接着推近到这些局部，同一幅画也能换出好几个镜头。
用法：python3 tools/focus.py
"""
import glob, json, os
import numpy as np
from PIL import Image

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
out = {}
for f in sorted(glob.glob('web/img/*.jpg')):
    k = os.path.basename(f)[:-4]
    im = Image.open(f); w, h = im.size
    g = np.asarray(im.convert('L').resize((192, max(8, round(192 * h / w))), Image.BILINEAR), np.float32)
    gy, gx = np.gradient(g); e = np.hypot(gx, gy)
    e = e / (e.mean() + 1e-6)
    H, W = e.shape
    # 画面铺满 1920x1080 时显示的那部分（cover）里，按 1.6 倍推近的窗口大小
    s0 = max(1920 / w, 1080 / h); z = 1.6
    ww = max(4, min(W, round(1920 / (s0 * z) / w * W))); wh = max(4, min(H, round(1080 / (s0 * z) / h * H)))
    I = np.pad(e.cumsum(0).cumsum(1), ((1, 0), (1, 0)))
    S = I[wh:, ww:] - I[:-wh, ww:] - I[wh:, :-ww] + I[:-wh, :-ww]           # 每个窗口的细节总量
    # 偏爱靠中间一点的地方（边角常是画框、暗部）
    yy, xx = np.mgrid[0:S.shape[0], 0:S.shape[1]]
    cy, cx = (S.shape[0] - 1) / 2, (S.shape[1] - 1) / 2
    S = S * (1 - 0.35 * (((yy - cy) / (cy + 1)) ** 2 + ((xx - cx) / (cx + 1)) ** 2) / 2)
    pts = []
    for _ in range(3):
        i = int(np.argmax(S)); y, x = divmod(i, S.shape[1])
        if S[y, x] <= 0: break
        pts.append([round((x + ww / 2) / W, 3), round((y + wh / 2) / H, 3)])
        S[max(0, y - wh):y + wh, max(0, x - ww):x + ww] = -1                 # 下一处别跟这处重叠
    # 整幅画细节的重心（竖幅画铺满时，决定露出哪一段）
    m = e.sum(1); cyy = float((m * np.arange(H)).sum() / m.sum()) / H
    out[k] = [w, h, round(cyy, 3), pts]
    # 柔焦底：清晰度不够铺满全屏的画，居中放原画，后面垫这一张（事先模糊好，渲染时不用再算模糊）
    os.makedirs('web/img/blur', exist_ok=True)
    r = 16 / 9; cw, ch = (w, w / r) if w / h < r else (h * r, h)
    b = im.convert('RGB').crop((round((w - cw) / 2), round((h - ch) / 2), round((w + cw) / 2), round((h + ch) / 2))).resize((480, 270), Image.LANCZOS)
    from PIL import ImageFilter, ImageEnhance
    ImageEnhance.Brightness(b.filter(ImageFilter.GaussianBlur(7))).enhance(0.75).save(f'web/img/blur/{k}.jpg', quality=88)
    # 背景用的柔一点的版本：去掉最细的笔触和噪点（背景压暗后肉眼几乎看不出），压缩时省很多码率
    os.makedirs('web/img/soft', exist_ok=True)
    im.convert('RGB').filter(ImageFilter.GaussianBlur(1.1)).save(f'web/img/soft/{k}.jpg', quality=90)
open('web/img/focus.js', 'w').write('window.FOCUS = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(len(out), 'images')
