"""Contact sheet of stills for a quick look: python3 sheet.py out/sheet.jpg cols file1 file2 ..."""
import sys
from PIL import Image, ImageDraw
out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
w, h = 640, 360; rows = (len(files) + cols - 1) // cols
S = Image.new('RGB', (cols * w, rows * h), 'black'); d = ImageDraw.Draw(S)
for i, f in enumerate(files):
    im = Image.open(f).resize((w, h), Image.LANCZOS); x, y = (i % cols) * w, (i // cols) * h
    S.paste(im, (x, y)); d.text((x + 8, y + 6), f.split('t_')[-1].replace('.jpg', '') + 's', fill=(120, 255, 120))
S.save(out, quality=88); print(out, S.size)
