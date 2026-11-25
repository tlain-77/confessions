"""从 Wikimedia Commons 取公有领域的画：查文件信息（作者、年代、许可），下载 1920 宽的标准缩略图，存成 web/img/<名>.jpg。
用法：python3 tools/getimg.py 名 "File:xxx.jpg" [宽度]
      python3 tools/getimg.py --search "关键词"        # 列出候选文件名
"""
import json, os, subprocess, sys, urllib.error, urllib.parse, urllib.request

API = 'https://commons.wikimedia.org/w/api.php'
UA = {'User-Agent': 'confessions-video-builder/1.0 (educational, non-commercial)'}

import time
def fetch(url, timeout=60):
    for k in range(6):                                   # 429（请求太频繁）时等一会儿再试
        try: return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout).read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or k == 5: raise
            time.sleep(10 * (k + 1))
def api(**q):
    q.update(format='json')
    return json.loads(fetch(API + '?' + urllib.parse.urlencode(q)))

if sys.argv[1] == '--search':
    r = api(action='query', list='search', srsearch=sys.argv[2], srnamespace=6, srlimit=15)
    for s in r['query']['search']: print(s['title'])
    sys.exit()

name, title = sys.argv[1], sys.argv[2]; width = int(sys.argv[3]) if len(sys.argv) > 3 else 1920   # 只用维基的标准缩略图尺寸（960 / 1280 / 1920 …），别的尺寸会被限流
r = api(action='query', titles=title, prop='imageinfo', iiprop='url|size|extmetadata', iiurlwidth=width)
page = next(iter(r['query']['pages'].values()))
if 'imageinfo' not in page: sys.exit(f'not found: {title}')
ii = page['imageinfo'][0]; md = ii.get('extmetadata', {})
if ii['width'] <= width and os.environ.get('ORIG'):      # ORIG=1：原图本来就小（比如 WGA 的壁画照片），直接要原图，不再缩小
    ii = dict(ii, thumburl=ii['url'])
elif ii['width'] <= width:                                # 原图不够宽：维基会给原图地址（限流很严），改要一个比原图小的标准尺寸
    std = [s for s in (500, 960, 1280, 1920, 2560) if s < ii['width']]
    if std:
        width = std[-1]; r = api(action='query', titles=title, prop='imageinfo', iiprop='url|size|extmetadata', iiurlwidth=width)
        ii = next(iter(r['query']['pages'].values()))['imageinfo'][0]; md = ii.get('extmetadata', {})
lic = md.get('LicenseShortName', {}).get('value', '?'); art = md.get('Artist', {}).get('value', '?'); date = md.get('DateTimeOriginal', {}).get('value', '?')
url = ii.get('thumburl') or ii['url']
print(f'{title}\n  {ii["width"]}x{ii["height"]}  license: {lic}\n  artist: {art[:120]}\n  date: {date[:60]}\n  {url}')
os.makedirs('web/img', exist_ok=True)
raw = f'out/img_{name}.raw'
open(raw, 'wb').write(fetch(url, 120))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-vf', f"scale='min({width},iw)':-2:flags=lanczos", '-q:v', '3', f'web/img/{name}.jpg'], check=True, stdin=subprocess.DEVNULL)   # 不读标准输入（在 while read 循环里会吃掉下一行的字）
os.remove(raw)
print('  saved', f'web/img/{name}.jpg', os.path.getsize(f'web/img/{name}.jpg') // 1024, 'KB')
