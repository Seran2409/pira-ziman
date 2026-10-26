"""Screenshots of the built app for visual checks (Playwright, Chromium).

Usage: python3 tests/screens.py [dist/pira-ziman.html] [OUTDIR]     (default OUTDIR: tests/out)

Loads a sample learner state (level 4, 5-day streak, 62 Zêr, 6 lessons done) so every widget has
content, then captures:
  desktop-hell-start.png     1280 px, light, home (full page)
  desktop-hell-profil.png    1280 px, light, profile
  handy-hell-start.png       390 px, light, home (full page)
  handy-dunkel-start.png     390 px, dark, home (full page)
  handy-dunkel-mehr.png      390 px, dark, tools page
  handy-hell-lektion.png     390 px, light, result screen of a lesson
  handy-hell-feier.png       390 px, light, level-up celebration after that lesson
Prints page errors and pages that scroll sideways. Exit code 1 if there were any.
Audio requests are blocked, so the run is fast and works without audio banks.
"""
import asyncio, os, sys
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PAGE = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'dist', 'pira-ziman.html'))
OUT = os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'out'))

SEED = """(() => { const now = Date.now(), D = 864e5, k = t => { const d = new Date(t); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
 const s = { v:1, name:'Seran', goal:30, theme:'auto', xp:340, days:{}, lessons:{}, cards:{}, texts:{}, verbs:{n:0,ok:0}, badges:{first:1, streak3:1}, reviews:20, custom:{}, levels:{}, pron:{n:2,best:{},quiz:{}}, updatedAt: now,
   game:{ zer:62, shields:1, frozen:{}, day:null, quests:4, lvSeen:4, chests:1 } };
 for (let i=1;i<=4;i++) s.days[k(now - i*D)] = 40; s.days[k(now)] = 18;
 ['a1-1','a1-2','a1-3','a1-4','a1-5','a1-6'].forEach((id,i)=> s.lessons[id] = {stars: i%2?3:2, best:90, times:1, last: now - (6-i)*D});
 localStorage.setItem('piraziman.v1', JSON.stringify(s)); })()"""


async def main():
    os.makedirs(OUT, exist_ok=True)
    problems = []
    async with async_playwright() as p:
        b = await p.chromium.launch()

        async def page(w, h, scheme):
            pg = await (await b.new_context(viewport={'width': w, 'height': h}, color_scheme=scheme)).new_page()
            pg.on('pageerror', lambda e: problems.append(f'{w}px {scheme}: JS error: {e}'))
            await pg.route('**/audio/**', lambda r: r.abort())
            await pg.route('**/fonts.g*/**', lambda r: r.abort())
            await pg.goto('file://' + PAGE)
            await pg.evaluate(SEED)
            await pg.reload()
            await pg.wait_for_timeout(400)
            return pg

        async def shot(pg, name, full=False):
            sw = await pg.evaluate('document.documentElement.scrollWidth - innerWidth')
            if sw > 1:
                problems.append(f'{name}: page scrolls sideways by {sw}px')
            await pg.screenshot(path=os.path.join(OUT, name), full_page=full)

        async def go(pg, hash_):
            await pg.evaluate(f"location.hash = '{hash_}'")
            await pg.wait_for_timeout(300)

        d = await page(1280, 900, 'light')
        await shot(d, 'desktop-hell-start.png', True)
        await go(d, '#profile'); await shot(d, 'desktop-hell-profil.png')

        m = await page(390, 844, 'light')
        await shot(m, 'handy-hell-start.png', True)
        await m.evaluate("startLesson(lessonById('a1-7')); startExercises(); P.first = P.q.length; P.uniq = P.q.length; P.i = P.q.length; finish()")
        await m.wait_for_timeout(400)
        await m.evaluate("document.querySelectorAll('.fx').forEach(e => e.remove())")
        await shot(m, 'handy-hell-lektion.png')
        await m.evaluate("celebrate('Ast 5', 'Neuer Rang: Xwendekar · Schüler/in', '+10 Zêr', 5)")
        await m.wait_for_timeout(700)
        await shot(m, 'handy-hell-feier.png')

        k = await page(390, 844, 'dark')
        await shot(k, 'handy-dunkel-start.png', True)
        await go(k, '#more'); await shot(k, 'handy-dunkel-mehr.png')
        await b.close()

    print('screenshots in', OUT)
    for f in sorted(os.listdir(OUT)):
        if f.endswith('.png'):
            print(' ', f)
    if problems:
        print('PROBLEMS:')
        for x in problems:
            print('  -', x)
        sys.exit(1)
    print('no page errors, no sideways scrolling')


asyncio.run(main())
