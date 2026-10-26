import glob, os, sys
src = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src')
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist', 'pira-ziman.html')
os.makedirs(os.path.dirname(out), exist_ok=True)
read = lambda p: open(p, encoding='utf-8').read()
html = [read(os.path.join(src, '00-head.html')), read(os.path.join(src, '01-body.html'))]
data = sorted(glob.glob(os.path.join(src, '[5-9]*.js')))
code = sorted(glob.glob(os.path.join(src, '[1-4]*.js')))
js = ['window.PZ = { lessons: [], texts: [], verbs: [], ref: [], proverbs: [], method: "" };']
js += [read(p) for p in data]
import json as _j
idx = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'audio_build', 'index.json')
sil = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'audio_build', 'silent.mp3')
if os.path.exists(idx):
    ix = _j.load(open(idx, encoding='utf-8'))
    import base64 as _b
    js.append('PZ.audio = ' + _j.dumps({'nb': ix['nb'], 'keys': '\n'.join(ix['keys'])}, ensure_ascii=False) + ';')
    js.append('PZ.silent = "' + _b.b64encode(open(sil, 'rb').read()).decode() + '";')
    ipf = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'audio_build', 'ipa.json')
    if os.path.exists(ipf):
        js.append('PZ.ipa = ' + _j.dumps(_j.load(open(ipf, encoding='utf-8')), ensure_ascii=False, separators=(',', ':')) + ';')
js += [read(p) for p in code]
js.append('buildVForms(); boot();')
html.append('<script>\n' + '\n'.join(js) + '\n</script>\n')
open(out, 'w', encoding='utf-8').write('\n'.join(html))
print(out, os.path.getsize(out), 'bytes;', 'data files:', [os.path.basename(p) for p in data])
