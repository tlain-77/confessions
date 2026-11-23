"""一幅画的“深浅图”（越亮越近）：给画做 2.5D 视差用（近的东西移得多，远的移得少）。
模型：Depth Anything V2 Small（ONNX，models/depth/da2s.onnx），CPU 上一幅一两秒。
用法：python3 tools/depth.py web/img/画.jpg [更多画…]   → web/img/depth/画.png（灰度，长边 1024）
"""
import sys, os
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter
sess = ort.InferenceSession(os.path.join(os.path.dirname(__file__), '..', 'models', 'depth', 'da2s.onnx'), providers=['CPUExecutionProvider'])
MEAN, STD = np.array([0.485, 0.456, 0.406], np.float32), np.array([0.229, 0.224, 0.225], np.float32)
for path in sys.argv[1:]:
    im = Image.open(path).convert('RGB'); W, H = im.size
    k = 770 / max(W, H); w, h = max(14, round(W * k / 14) * 14), max(14, round(H * k / 14) * 14)
    x = (np.asarray(im.resize((w, h), Image.BICUBIC), np.float32) / 255 - MEAN) / STD
    d = sess.run(None, {'pixel_values': x.transpose(2, 0, 1)[None]})[0][0]
    lo, hi = np.percentile(d, 1), np.percentile(d, 99.5)
    d = np.clip((d - lo) / max(1e-6, hi - lo), 0, 1)
    out = Image.fromarray((d * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6))
    k2 = 1024 / max(W, H); out = out.resize((round(W * k2), round(H * k2)), Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.2))
    name = os.path.splitext(os.path.basename(path))[0]; dst = os.path.join(os.path.dirname(path), 'depth', name + '.png')
    out.save(dst); print(dst, out.size)
