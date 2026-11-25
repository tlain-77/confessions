"""本人录制：开头自我介绍“我是 tlain”这一条字幕。
语音识别把名字认成了“T电影”“tline”“t赖”“Tling”，校对时（tts/fix8.py、fix10.py–fix13.py）先去掉了没出字幕；
名字的写法定了（tlain），按实际声音补上：
  · self5、self6（第三讲、第四讲）：先说“我是 tlain。”，停一下再说“那么，我们继续来读……”，名字单独一条；
  · self7、self8、self9（第五到第七讲）：名字和“那么我们继续来读《忏悔录》”是一口气说的，并成一条。
起点是在纯人声轨上量的开口时刻往前 0.03 秒（跟别的字幕一样，字不会比声音先出来）；单独一条时，终点是名字最后一个音的结尾
（下一条离得近，页面上会直接换字，不会一灭一亮）。
只改字幕（subs），不动逐字时刻表（chars）：卡片、动画按 chars 找锚点，往里加字会让后面的锚点错位。
用法：python3 tools/namesub.py self5 self6 …（build_selfN.py 最后会自动调用；重复执行不会重复加）
"""
import json, sys

NAME = 'tlain'
T = {  # 页面: (方式, 起, 止)
    'self5': ('own', 1.50, 2.46), 'self6': ('own', 1.50, 2.51),
    'self7': ('merge', 1.51, None), 'self8': ('merge', 1.51, None), 'self9': ('merge', 1.52, None),
}


def patch(name, d):
    how, s, e = T[name]
    subs = d['subs']
    if NAME in subs[0]['t']:
        return d                                                    # 已经加过了
    if how == 'own':
        assert s < e < subs[0]['s'], (name, subs[0])
        subs.insert(0, dict(s=s, e=e, t=f'我是{NAME}。'))
    else:
        assert s < subs[0]['s'] < s + 1.5 and subs[0]['t'].startswith('那么'), (name, subs[0])
        subs[0] = dict(s=s, e=subs[0]['e'], t=f'我是{NAME}，' + subs[0]['t'])
    return d


def patch_files(name, var='EPD'):
    d = patch(name, json.load(open(f'out/{name}_data.json', encoding='utf-8')))
    open(f'web/{name}_data.js', 'w', encoding='utf-8').write(f'window.{var} = ' + json.dumps(d, ensure_ascii=False) + ';\n')
    json.dump(d, open(f'out/{name}_data.json', 'w', encoding='utf-8'), ensure_ascii=False)
    return d


if __name__ == '__main__':
    for n in sys.argv[1:]:
        print(n, json.dumps(patch_files(n)['subs'][:2], ensure_ascii=False))
