"""作曲：钢琴分解和弦 + 弦乐长音（General MIDI 音色，FluidR3 音色库渲染）。
usage: python3 audio/score.py out.mid total_seconds [section_starts_csv] [seed]
每个段落换一组和声进行；速度 60，四拍一小节。"""
import sys, random
import mido
out, total = sys.argv[1], float(sys.argv[2])
secs = [float(x) for x in sys.argv[3].split(',')] if len(sys.argv) > 3 and sys.argv[3] else [0.0]
rnd = random.Random(int(sys.argv[4]) if len(sys.argv) > 4 else 7)
BPM = 60; TPB = 480; SPB = 60 / BPM                      # 一拍 1 秒
# 和声进行（D 大调 / b 小调），每个和弦一小节；数字是 MIDI 音高
D, A, Bm, G, Em, F_m, Gmaj7, Dsus = [50, 57, 62, 66, 69], [45, 52, 57, 61, 64], [47, 54, 59, 62, 66], [43, 50, 55, 59, 62], [40, 47, 52, 55, 59], [42, 49, 54, 57, 61], [43, 50, 54, 59, 62], [50, 57, 62, 64, 69]
PROGS = [[D, A, Bm, G], [Bm, G, D, A], [G, D, Em, A], [D, F_m, Bm, Gmaj7], [Em, G, D, Dsus], [Bm, Em, G, A]]
mid = mido.MidiFile(ticks_per_beat=TPB)
def track(prog, ch, vol, name):
    tr = mido.MidiTrack(); mid.tracks.append(tr)
    tr.append(mido.MetaMessage('track_name', name=name))
    if ch == 0: tr.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(BPM)))
    tr.append(mido.Message('program_change', program=prog, channel=ch))
    tr.append(mido.Message('control_change', control=7, value=vol, channel=ch))
    tr.append(mido.Message('control_change', control=91, value=70, channel=ch))   # 混响
    return tr
ev = {0: [], 1: [], 2: []}                                   # (time_sec, type, note, vel)
nbars = int(total / (4 * SPB)) + 1
def sec_of(t): return max(i for i, s in enumerate(secs) if s <= t + 0.01)
for b in range(nbars):
    t0 = b * 4 * SPB; si = sec_of(t0); prog = PROGS[(si * 2 + (1 if si % 2 else 0)) % len(PROGS)]
    ch = prog[b % 4]; first_bar = any(abs(t0 - s) < 4 * SPB and t0 >= s for s in secs)
    # 弦乐：整小节长音，低音 + 三个声部
    for n in [ch[0] - 12 + 12, ch[2], ch[3]]:
        v = rnd.randint(38, 46); ev[1].append((t0 + 0.02, 'on', n, v)); ev[1].append((t0 + 4 * SPB - 0.05, 'off', n, 0))
    # 钢琴：低音一下，然后上行分解和弦，每小节 6 个音，偶尔省一个，留白
    pat = [0, 2, 3, 4, 3, 2] if b % 2 == 0 else [0, 3, 4, 2, 4, 3]
    times = [0, 1, 1.5, 2, 3, 3.5]
    for k, (ix, bt) in enumerate(zip(pat, times)):
        if k and rnd.random() < 0.18: continue
        n = ch[ix] + (12 if ix >= 2 else 0) if k else ch[0]
        tt = t0 + bt * SPB + rnd.uniform(-0.015, 0.02); v = (52 if k == 0 else rnd.randint(30, 44)) + (8 if first_bar and k == 0 else 0)
        ev[0].append((tt, 'on', n, v)); ev[0].append((tt + (3.6 if k == 0 else 1.6) * SPB, 'off', n, 0))
    # 段落开头：高音区一个铃声般的点缀（钢片琴）
    if first_bar and t0 > 1:
        ev[2].append((t0 + 0.01, 'on', ch[2] + 24, 40)); ev[2].append((t0 + 3.0, 'off', ch[2] + 24, 0))
for chn, (prog, vol, name) in enumerate([(0, 92, 'piano'), (48, 70, 'strings'), (8, 60, 'celesta')]):
    tr = track(prog, chn, vol, name)
    tr.append(mido.Message('control_change', control=64, value=100 if chn == 0 else 0, channel=chn))
    last = 0
    for tt, ty, n, v in sorted(ev[chn], key=lambda e: (e[0], e[1] == 'on')):
        if tt > total: continue
        tick = int(round(tt / SPB * TPB)); d = max(0, tick - last); last = tick
        tr.append(mido.Message('note_on' if ty == 'on' else 'note_off', note=n, velocity=v, channel=chn, time=d))
mid.save(out); print('midi', out, f'{nbars} bars, {len(secs)} sections')
