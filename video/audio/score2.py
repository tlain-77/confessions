"""作曲（第八讲起）：和声骨架跟 score.py 一样（D 大调 / b 小调，速度 60，四拍一小节，每小节一个和弦，每一段换一组和声进行），
声音更丰富一些：
  · 每一段换一种配器：钢琴分解和弦 + 弦乐长音；竖琴琶音 + 慢弦乐 + 大提琴低音；稀疏的钢琴 + 温暖的铺底 + 很轻的人声合唱；
    钢片琴的高音点缀 + 弦乐。说话时配乐压在人声下面（music_mix.py），这些只是底色，不抢话。
  · 段落之间留了一口气（audio/secgap.py），那一两秒里配乐会抬起来：在这里放一个竖琴上行的小过门，落到新一段的第一个字上，
    再加一声钢片琴。
  · 片头：长笛一个三音的小引子；片尾：IV–V–I 的完整收束（竖琴 + 弦乐 + 长笛把旋律落回主音），最后一个长和弦慢慢散掉。
General MIDI 音色，FluidR3 音色库渲染。
usage: python3 audio/score2.py out.mid total_seconds section_starts_csv seed speech_start speech_end
"""
import sys, random
import mido

out, total = sys.argv[1], float(sys.argv[2])
secs = [float(x) for x in sys.argv[3].split(',')] if sys.argv[3] else [0.0]
rnd = random.Random(int(sys.argv[4]))
s0, s1 = float(sys.argv[5]), float(sys.argv[6])           # 第一句话开始、最后一句话结束（秒）
BPM = 60; TPB = 480; SPB = 60 / BPM                      # 一拍 1 秒
D, A, Bm, G, Em, F_m, Gmaj7, Dsus = [50, 57, 62, 66, 69], [45, 52, 57, 61, 64], [47, 54, 59, 62, 66], [43, 50, 55, 59, 62], [40, 47, 52, 55, 59], [42, 49, 54, 57, 61], [43, 50, 54, 59, 62], [50, 57, 62, 64, 69]
PROGS = [[D, A, Bm, G], [Bm, G, D, A], [G, D, Em, A], [D, F_m, Bm, Gmaj7], [Em, G, D, Dsus], [Bm, Em, G, A]]
# 通道：0 钢琴 1 弦乐 2 钢片琴 3 竖琴 4 大提琴 5 慢弦乐 6 温暖铺底 7 合唱 8 长笛
INST = [(0, 92, 'piano'), (48, 66, 'strings'), (8, 60, 'celesta'), (46, 84, 'harp'), (42, 70, 'cello'), (49, 64, 'slow strings'),
        (89, 58, 'warm pad'), (52, 44, 'choir'), (73, 72, 'flute')]
ev = {c: [] for c in range(len(INST))}


def note(ch, t, n, v, d):
    ev[ch].append((t, 'on', n, v)); ev[ch].append((t + d, 'off', n, 0))


def sec_of(t): return max(i for i, s in enumerate(secs) if s <= t + 0.01)


TEX = [0, 1, 2, 3]; rnd.shuffle(TEX)                     # 每一段的配器（按段落序号轮换，起点随种子）
t_out = s1 + 0.5                                         # 片尾收束：最后一句话说完半秒就进来
ob = int(t_out / (4 * SPB)) + 1                          # 常规小节到这里为止
nbars = int(total / (4 * SPB)) + 1
for b in range(min(nbars, ob)):
    t0 = b * 4 * SPB; si = sec_of(t0); prog = PROGS[(si * 2 + (1 if si % 2 else 0)) % len(PROGS)]
    ch = prog[b % 4]; tex = TEX[si % 4]; first_bar = any(abs(t0 - s) < 4 * SPB and t0 >= s for s in secs)
    if tex == 0:                                         # 钢琴分解和弦 + 弦乐长音
        for n in [ch[0], ch[2], ch[3]]: note(1, t0 + 0.02, n, rnd.randint(38, 46), 4 * SPB - 0.07)
        pat = [0, 2, 3, 4, 3, 2] if b % 2 == 0 else [0, 3, 4, 2, 4, 3]
        for k, (ix, bt) in enumerate(zip(pat, [0, 1, 1.5, 2, 3, 3.5])):
            if k and rnd.random() < 0.18: continue
            n = ch[ix] + (12 if ix >= 2 else 0) if k else ch[0]
            note(0, t0 + bt * SPB + rnd.uniform(-0.015, 0.02), n, (52 if k == 0 else rnd.randint(30, 44)), (3.6 if k == 0 else 1.6) * SPB)
    elif tex == 1:                                       # 竖琴八分音符琶音 + 慢弦乐 + 大提琴低音
        note(4, t0 + 0.02, ch[0] - 12, rnd.randint(44, 52), 4 * SPB - 0.1)
        for n in [ch[2], ch[3], ch[4]]: note(5, t0 + 0.03, n, rnd.randint(34, 42), 4 * SPB - 0.08)
        seq = [ch[0], ch[1], ch[2], ch[3], ch[4], ch[3] + 12, ch[4], ch[2] + 12]
        for k, n in enumerate(seq):
            if k and rnd.random() < 0.12: continue
            note(3, t0 + k * 0.5 * SPB + rnd.uniform(-0.01, 0.015), n + (12 if k >= 4 else 0), rnd.randint(34, 46), 2.0 * SPB)
    elif tex == 2:                                       # 稀疏的钢琴 + 温暖的铺底 + 很轻的合唱
        for n in [ch[0], ch[2], ch[3], ch[4]]: note(6, t0 + 0.02, n, rnd.randint(42, 48), 4 * SPB - 0.06)
        note(7, t0 + 0.05, ch[3] + 12, rnd.randint(32, 38), 4 * SPB - 0.1)
        note(0, t0 + 0.01, ch[0], 54, 3.6 * SPB)
        note(0, t0 + 2 * SPB + rnd.uniform(-0.02, 0.02), ch[3] + 12, rnd.randint(32, 40), 1.8 * SPB)
        if rnd.random() < 0.5: note(0, t0 + 3 * SPB, ch[4] + 12, rnd.randint(28, 36), 1.0 * SPB)
    else:                                                # 钢片琴高音点缀 + 弦乐
        for n in [ch[0], ch[2], ch[3]]: note(1, t0 + 0.02, n, rnd.randint(36, 44), 4 * SPB - 0.07)
        for k, ix in enumerate([2, 3, 4, 3]):
            if k and rnd.random() < 0.25: continue
            note(2, t0 + k * SPB + rnd.uniform(-0.01, 0.02), ch[ix] + 24, rnd.randint(26, 36), 1.5 * SPB)
    if first_bar and t0 > 1:                             # 段落开头：钢片琴一声
        note(2, t0 + 0.01, ch[2] + 24, 40, 3.0)

# 常规小节里没奏完的音在收束处收住，免得跟收束的和弦撞在一起
for c in ev:
    ev[c] = [(tt, ty, n, v) if ty == 'on' or tt <= t_out else (t_out, ty, n, v) for tt, ty, n, v in ev[c] if not (ty == 'on' and tt >= t_out)]

# 段落之间的过门：新一段第一个字之前，竖琴从低往高刷一遍当前和弦，落在那个字上；再加一声钢片琴
for s in secs[1:]:
    if s > s1: continue
    b = int(s / (4 * SPB)); si = sec_of(s); prog = PROGS[(si * 2 + (1 if si % 2 else 0)) % len(PROGS)]; ch = prog[b % 4]
    run = [ch[0], ch[1], ch[2], ch[3], ch[4], ch[2] + 12, ch[3] + 12, ch[4] + 12]
    for k, n in enumerate(run):
        note(3, s - 1.05 + k * 0.12, n, 40 + k * 3, 2.2)
    note(2, s - 0.02, ch[3] + 24, 44, 3.0)

# 片头：长笛三音（属音—下中音—属音），竖琴托一个主和弦
t = 0.25
note(3, t, 50, 46, 3.0); note(3, t + 0.15, 57, 44, 3.0); note(3, t + 0.3, 62, 44, 3.0); note(3, t + 0.45, 66, 42, 3.0)
note(8, t + 0.4, 81, 52, 0.75); note(8, t + 1.2, 83, 50, 0.75); note(8, t + 2.0, 81, 48, max(1.0, s0 - t - 2.0 + 1.0))
for n in [50, 57, 62]: note(5, t, n, 38, max(2.5, s0 - t + 1.5))

# 片尾：IV–V–I，每个和弦两拍，最后主和弦长音；长笛 B–C#–D 落回主音
t = t_out
for k, (chd, mel) in enumerate([(G, 83), (A, 85), (D, 86)]):
    tt = t + k * 2 * SPB; last = k == 2; d = 7.0 if last else 2 * SPB
    note(4, tt + 0.02, chd[0] - 12, 50, d)
    for n in [chd[0], chd[2], chd[3], chd[4]]: note(5, tt + 0.03, n, 42, d)
    for j, n in enumerate([chd[0], chd[2], chd[3], chd[4], chd[2] + 12, chd[3] + 12]):
        note(3, tt + j * 0.16, n, 40 + j * 2, d if last else 2.0)
    note(8, tt + 0.05, mel, 54 if last else 50, d if last else 1.9 * SPB)
note(2, t + 4 * SPB + 0.4, 86 + 12, 40, 4.0)

mid = mido.MidiFile(ticks_per_beat=TPB)
for chn, (prog, vol, name) in enumerate(INST):
    if not ev[chn]: continue
    tr = mido.MidiTrack(); mid.tracks.append(tr)
    tr.append(mido.MetaMessage('track_name', name=name))
    if not mid.tracks[:-1]: tr.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(BPM)))
    tr.append(mido.Message('program_change', program=prog, channel=chn))
    tr.append(mido.Message('control_change', control=7, value=vol, channel=chn))
    tr.append(mido.Message('control_change', control=91, value=70, channel=chn))       # 混响
    tr.append(mido.Message('control_change', control=64, value=100 if chn in (0, 3) else 0, channel=chn))
    last = 0
    for tt, ty, n, v in sorted(ev[chn], key=lambda e: (e[0], e[1] == 'on')):
        if tt > total: continue
        tick = int(round(tt / SPB * TPB)); d = max(0, tick - last); last = tick
        tr.append(mido.Message('note_on' if ty == 'on' else 'note_off', note=n, velocity=v, channel=chn, time=d))
mid.save(out)
print('midi', out, f'{nbars} bars, {len(secs)} sections, textures {[TEX[i % 4] for i in range(len(secs))]}')
