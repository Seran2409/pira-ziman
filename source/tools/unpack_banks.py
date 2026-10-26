"""Restore audio_build/mms/*.mp3 from the published banks (audio/m*.js in the repo root).
Run this in a fresh clone before gen_mms.py, so only new or changed texts get synthesised."""
import json, os, re, sys, base64
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from gen_mms import name_for
SITE = os.environ.get('PIRA_SITE', os.path.dirname(ROOT))
items = json.load(open(ROOT + '/audio_build/items.json', encoding='utf-8'))
text_of = {}
for k, t in items:
    text_of.setdefault(k, t)
out = ROOT + '/audio_build/mms'; os.makedirs(out, exist_ok=True)
n = 0
for f in sorted(os.listdir(SITE + '/audio')):
    raw = open(os.path.join(SITE, 'audio', f), encoding='utf-8').read()
    bank = json.loads(re.match(r'PZA\.add\(\d+,(.*)\);\s*$', raw, re.S).group(1))
    for k, b64 in bank.items():
        if k in text_of:
            p = f'{out}/{name_for(text_of[k])}.mp3'
            if not os.path.exists(p):
                open(p, 'wb').write(base64.b64decode(b64)); n += 1
print('restored', n, 'mp3 files into', out)
