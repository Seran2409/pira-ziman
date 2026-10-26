"""Pack MMS mp3s into hashed JS banks, write index + eSpeak IPA (aligned with the index keys)."""
import json, os, sys, base64, math, subprocess
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_mms import name_for
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # source/
ESPEAK = os.environ.get('ESPEAK_NG', 'espeak-ng')  # espeak-ng binary (only used for the IPA line in the trainer)
ENV = dict(os.environ)
items = json.load(open(sys.argv[1], encoding='utf-8'))
mdir = ROOT + '/audio_build/mms'


def fnv(s):
    h = 0x811c9dc5
    for ch in s:
        h = ((h ^ ord(ch)) * 0x01000193) & 0xffffffff
    return h


have, missing = [], []
for k, t in items:
    p = f'{mdir}/{name_for(t)}.mp3'
    (have if os.path.exists(p) and os.path.getsize(p) > 0 else missing).append((k, t, p))
total = sum(os.path.getsize(p) for _, _, p in have) * 4 / 3
NB = max(1, math.ceil(total / 400000))
buckets = [dict() for _ in range(NB)]
for k, t, p in have:
    buckets[fnv(k) % NB][k] = base64.b64encode(open(p, 'rb').read()).decode()
out = ROOT + '/dist/audio'; os.makedirs(out, exist_ok=True)
for f in os.listdir(out): os.remove(os.path.join(out, f))
for n, b in enumerate(buckets):
    with open(f'{out}/m{n}.js', 'w', encoding='utf-8') as fh:
        fh.write('PZA.add(%d,%s);' % (n, json.dumps(b, ensure_ascii=False, separators=(',', ':'))))


def ipa(t):
    r = subprocess.run([ESPEAK, '-v', 'ku', '-q', '--ipa', '--stdin'], input=t.replace('-', ' ').encode(), env=ENV, capture_output=True)
    return ' '.join(r.stdout.decode('utf-8').split())


with ThreadPoolExecutor(4) as ex:
    ipas = list(ex.map(ipa, [t for _, t, _ in have]))
json.dump({'nb': NB, 'keys': [k for k, _, _ in have]}, open(ROOT + '/audio_build/index.json', 'w', encoding='utf-8'), ensure_ascii=False)
json.dump(ipas, open(ROOT + '/audio_build/ipa.json', 'w', encoding='utf-8'), ensure_ascii=False)
print('packed', len(have), 'missing', len(missing), 'banks', NB, 'MB', round(sum(os.path.getsize(f'{out}/m{n}.js') for n in range(NB)) / 1e6, 1))
if missing: print('first missing:', [t for _, t, _ in missing[:10]])
