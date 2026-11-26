"""把几张截图拼成两列的总览图（每格 960×540，左上角标着文件名里的时刻）：python3 tools/tile.py 输出前缀 图1 图2 …
每 8 格一张：输出前缀_00.jpg、输出前缀_01.jpg …"""
import os, re, sys
from PIL import Image, ImageDraw, ImageFont
out, files = sys.argv[1], sys.argv[2:]
W, H = 960, 540
fp = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
font = ImageFont.truetype(fp, 26) if os.path.exists(fp) else None
for n in range(0, len(files), 8):
    part = files[n:n + 8]; rows = (len(part) + 1) // 2
    sh = Image.new('RGB', (W * 2, H * rows), (40, 40, 40)); dr = ImageDraw.Draw(sh)
    for k, f in enumerate(part):
        im = Image.open(f).resize((W, H)); x, y = (k % 2) * W, (k // 2) * H; sh.paste(im, (x, y))
        m = re.search(r'_([\d.]+)\.jpg$', f); lab = m.group(1) if m else os.path.basename(f)
        dr.rectangle([x, y, x + 120, y + 34], fill=(0, 0, 0)); dr.text((x + 6, y + 3), lab, fill=(255, 220, 0), font=font)
    sh.save(f'{out}_{n // 8:02d}.jpg', quality=84)
print(f'{len(files)} 格 → {out}_*.jpg')
