"""Copy the chosen narration timeline into the web player."""
import json, sys
tl = json.load(open(sys.argv[1], encoding='utf-8'))
open('web/timeline.js', 'w', encoding='utf-8').write('window.TIMELINE = ' + json.dumps(tl, ensure_ascii=False) + ';\n')
print('timeline.js', tl['engine'], tl['total'], 's', len(tl['cues']), 'cues')
