"""Copy the built website (repo root, written by source/tools/build_pages.py) into native/www for Capacitor,
and draw the source images for the app icons and splash screens into native/assets/.

Run source/build.py and source/tools/build_pages.py first. Usage (in native/): npm run prepare-www
"""
import os, shutil, stat, sys
from PIL import Image

NATIVE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.dirname(NATIVE)
WWW, ASSETS = os.path.join(NATIVE, 'www'), os.path.join(NATIVE, 'assets')
# everything the app needs offline; no service worker (sw.js) and no web manifest inside the native app
FILES = ['index.html', 'icon.svg', 'icon-192.png', 'icon-512.png', 'impressum.html', 'datenschutz.html',
         'nutzungsbedingungen.html', 'legal.css']

if not os.path.exists(os.path.join(SITE, 'index.html')):
    raise SystemExit('index.html fehlt: erst source/build.py und source/tools/build_pages.py ausführen')
def force_remove(fn, path, _):  # Windows: read-only folders (OneDrive sets the flag) cannot be removed until it is cleared
    os.chmod(path, stat.S_IWRITE); fn(path)
if os.path.isdir(WWW):
    shutil.rmtree(WWW, **{'onexc' if sys.version_info >= (3, 12) else 'onerror': force_remove})
os.makedirs(WWW)
for f in FILES:
    shutil.copy(os.path.join(SITE, f), os.path.join(WWW, f))
shutil.copytree(os.path.join(SITE, 'audio'), os.path.join(WWW, 'audio'))

# icon and splash sources for `npm run icons` (@capacitor/assets): the flag-with-sun icon of the website
os.makedirs(ASSETS, exist_ok=True)
icon = Image.open(os.path.join(SITE, 'icon-1024.png')).convert('RGBA')
flat = icon                                                  # rounded flag icon with transparent corners
# iOS and the stores round the corners themselves and reject transparency: zoom 120 % so the rounded corners fall outside
big = icon.resize((1229, 1229), Image.LANCZOS).crop((102, 102, 1126, 1126))
square = Image.new('RGBA', (1024, 1024), '#FFFFFF')
square.alpha_composite(big)
square.convert('RGB').save(os.path.join(ASSETS, 'icon-only.png'))
fg = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))           # Android adaptive icon: flag with sun, safe zone ~66 %
fg.alpha_composite(flat.resize((700, 700), Image.LANCZOS), (162, 162))
fg.save(os.path.join(ASSETS, 'icon-foreground.png'))
Image.new('RGB', (1024, 1024), '#FFFFFF').save(os.path.join(ASSETS, 'icon-background.png'))
for name, bg in (('splash.png', '#F7F7F4'), ('splash-dark.png', '#0F1311')):
    sp = Image.new('RGBA', (2732, 2732), bg)
    sp.alpha_composite(flat.resize((560, 560), Image.LANCZOS), (1086, 1086))
    sp.convert('RGB').save(os.path.join(ASSETS, name))

size = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(WWW) for f in fs)
print(f'www ready: {len(os.listdir(os.path.join(WWW, "audio")))} audio banks, {size // 1024} KB; icons and splash in assets/')
