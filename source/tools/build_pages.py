"""Turn source/dist/pira-ziman.html into the GitHub Pages site in the repo root (index.html, audio/, sw.js, manifest, icons, README)."""
import os, shutil, json, stat, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # source/
SITE = os.environ.get('PIRA_SITE', os.path.dirname(ROOT))  # repo root = GitHub Pages
GENERATED = ['index.html', 'audio', 'sw.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', '.nojekyll', 'README.md']
src = open(ROOT + '/dist/pira-ziman.html', encoding='utf-8').read()
cut = src.index('<div class="app">')
head, body = src[:cut], src[cut:]
head = head.replace('<title>Pira Ziman</title>', '')
VERSION = 'pira-v7'
page = f'''<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Pira Ziman · Kurmancî lernen</title>
<meta name="description" content="Kurmancî (Nordkurdisch) lernen von A1 bis C2, mit Schwerpunkt auf der Sprache in Amed (Diyarbakır) und Êlih (Batman): Lektionen, Karteikarten, Verbtrainer, Lesetexte, natürliche Aussprache zu jedem Wort und ein Aussprache-Trainer mit Aufnahme.">
<meta name="theme-color" content="#D0202A">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon-192.png">
<style>body{{margin:0}}[hidden]{{display:none!important}}img{{max-width:100%}}</style>
{head.strip()}
</head>
<body>
{body.strip()}
<script>
if ('serviceWorker' in navigator && location.protocol === 'https:') {{
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {{}}));
}}
</script>
</body>
</html>
'''
NEW_AUDIO = os.path.isdir(ROOT + '/dist/audio')  # fresh clone without pack_mms run: keep the published audio/
def force_remove(fn, path, _):  # Windows: read-only folders (OneDrive sets the flag) cannot be removed until it is cleared
    os.chmod(path, stat.S_IWRITE); fn(path)
RMTREE_HANDLER = {'onexc' if sys.version_info >= (3, 12) else 'onerror': force_remove}
for f in GENERATED:  # only remove what this script generates; source/, CLAUDE.md, .git stay
    if f == 'audio' and not NEW_AUDIO: continue
    p = os.path.join(SITE, f)
    if os.path.isdir(p): shutil.rmtree(p, **RMTREE_HANDLER)
    elif os.path.exists(p): os.remove(p)
os.makedirs(SITE, exist_ok=True)
open(SITE + '/index.html', 'w', encoding='utf-8').write(page)
if NEW_AUDIO: shutil.copytree(ROOT + '/dist/audio', SITE + '/audio')
open(SITE + '/.nojekyll', 'w').write('')
shutil.copy(ROOT + '/tools/README_site.md', SITE + '/README.md')

# App icon: Kurdish flag (red / white / green) with the golden 21-ray sun, on a rounded square.
import math
def sun_polys(cx, cy, r0, r1, n=21, k=0.6):
    out = []
    for i in range(n):
        a = -math.pi / 2 + i * 2 * math.pi / n; w = math.pi / n * k
        out.append([(cx + r * math.cos(a + d), cy + r * math.sin(a + d)) for r, d in ((r0, -w), (r1, 0), (r0, w))])
    return out
RAYS = sun_polys(256, 256, 70, 132)
icon_svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><clipPath id="r"><rect width="512" height="512" rx="112"/></clipPath>'
            '<g clip-path="url(#r)"><rect width="512" height="171" fill="#ED2024"/><rect y="170" width="512" height="172" fill="#FFFFFF"/><rect y="341" width="512" height="171" fill="#278E43"/>'
            '<g fill="#FEBD11">' + ''.join('<polygon points="%s"/>' % ' '.join('%.1f,%.1f' % q for q in poly) for poly in RAYS) +
            '<circle cx="256" cy="256" r="76"/></g></g></svg>')
open(SITE + '/icon.svg', 'w').write(icon_svg)
from PIL import Image, ImageDraw
for size in (192, 512):
    S4 = size * 4; s = S4 / 512  # draw 4x, then downsample for smooth edges
    im = Image.new('RGBA', (S4, S4), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, S4, 171 * s], fill='#ED2024'); d.rectangle([0, 170 * s, S4, 342 * s], fill='#FFFFFF'); d.rectangle([0, 341 * s, S4, S4], fill='#278E43')
    for poly in RAYS: d.polygon([(x * s, y * s) for x, y in poly], fill='#FEBD11')
    d.ellipse([(256 - 76) * s, (256 - 76) * s, (256 + 76) * s, (256 + 76) * s], fill='#FEBD11')
    mask = Image.new('L', (S4, S4), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, S4 - 1, S4 - 1], radius=int(112 * s), fill=255)
    im.putalpha(mask)
    im.resize((size, size), Image.LANCZOS).save(f'{SITE}/icon-{size}.png')

manifest = {
    'name': 'Pira Ziman · Kurmancî lernen', 'short_name': 'Pira Ziman', 'lang': 'de',
    'description': 'Kurmancî von A1 bis C2 mit Schwerpunkt Amed und Êlih.',
    'start_url': './', 'scope': './', 'display': 'standalone',
    'background_color': '#F4F6F3', 'theme_color': '#D0202A',
    'icons': [{'src': 'icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
              {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
              {'src': 'icon.svg', 'sizes': 'any', 'type': 'image/svg+xml'}]}
json.dump(manifest, open(SITE + '/manifest.webmanifest', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

sw = '''/* Pira Ziman · offline cache. Pages load fresh when online; recordings are kept once heard. */
const V = '%s';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin && u.pathname.includes('/audio/')) {
    e.respondWith(caches.open(V).then(c => c.match(r).then(hit => hit || fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }))));
    return;
  }
  if (u.origin === location.origin) {
    e.respondWith(fetch(r).then(res => { if (res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put(r, copy)); } return res; })
      .catch(() => caches.match(r).then(hit => hit || caches.match('index.html'))));
    return;
  }
  if (/fonts\\.(googleapis|gstatic)\\.com$/.test(u.hostname)) {
    e.respondWith(caches.open(V).then(c => c.match(r).then(hit => hit || fetch(r).then(res => { c.put(r, res.clone()); return res; }))));
  }
});
''' % VERSION
open(SITE + '/sw.js', 'w', encoding='utf-8').write(sw)
total = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(SITE + '/audio') for f in fs) + os.path.getsize(SITE + '/index.html')
print('site ready', SITE, total // 1024, 'KB', len(os.listdir(SITE + '/audio')), 'audio files')
