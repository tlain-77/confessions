"""用 Fish Audio 以您的录音为样本合成句子。usage: python3 tts/fish.py out_prefix "句子" [takes]"""
import sys, json, urllib.request, urllib.error, ormsgpack, time
out, text = sys.argv[1], sys.argv[2]; takes = int(sys.argv[3]) if len(sys.argv) > 3 else 2; first = int(sys.argv[4]) if len(sys.argv) > 4 else 0
ref = open('rec/fix/ref.wav', 'rb').read(); ref_text = open('rec/fix/ref.txt', encoding='utf-8').read().strip()
for k in range(first, first + takes):
    body = ormsgpack.packb({'text': text, 'references': [{'audio': ref, 'text': ref_text}], 'format': 'wav', 'sample_rate': 44100,
                            'normalize': False, 'latency': 'normal', 'temperature': 0.7, 'top_p': 0.7, 'chunk_length': 200})
    req = urllib.request.Request('https://api.fish.audio/v1/tts', data=body, method='POST',
                                 headers={'content-type': 'application/msgpack', 'model': 's1'})
    for attempt in range(6):
        try: data = urllib.request.urlopen(req, timeout=180).read(); break
        except urllib.error.HTTPError as e: print('HTTP', e.code, e.read()[:200], '— 重试'); time.sleep(5 * (attempt + 1))
    else: sys.exit('failed')
    time.sleep(2)
    open(f'{out}_{k}.wav', 'wb').write(data); print('wrote', f'{out}_{k}.wav', len(data), 'bytes')
