import sys, asyncio, json
from playwright.async_api import async_playwright
PATH = __import__("os").path.abspath(sys.argv[1])
SHOT = sys.argv[2] if len(sys.argv) > 2 else None
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1280, 'height': 900})
        errs = []
        pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
        pg.on('console', lambda m: errs.append('CONSOLE ' + m.type + ' ' + m.text) if m.type in ('error', 'warning') else None)
        await pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        await pg.goto('file://' + PATH)
        await pg.wait_for_timeout(400)
        for h in ['home', 'path', 'review', 'read', 'verbs', 'dict', 'grammar', 'method', 'profile', 'more']:
            await pg.evaluate(f"location.hash='#{h}'"); await pg.wait_for_timeout(120)
        # run every lesson through the player: answer correctly via JS
        res = await pg.evaluate("""() => {
          const out = [];
          for (const l of PZ.lessons) {
            try {
              const ex = buildExercises(l);
              for (const x of ex) {
                if (x.t==='gap' && x.o && !x.o.some(o => String(x.a).split('|').includes(o))) out.push(l.id+' gap answer not in options: '+x.s);
                if (x.t==='build') { const ok = check(x.tiles.filter((t,i)=>true).join(' '), x.a); }
                if (x.t==='mc' && !x.o.includes(x.a)) out.push(l.id+' mc missing answer');
              }
              for (const g of (l.g||[])) if (!g[0].includes('___')) out.push(l.id+' gap without ___: '+g[0]);
              for (const s of (l.s||[])) { const it = buildItem(s,l); const need = toks(s[0]); for (const w of need) if (!it.tiles.includes(w)) out.push(l.id+' tile missing '+w); }
            } catch(e) { out.push(l.id+' ERROR '+e.message); }
          }
          return out;
        }""")
        errs += res
        # open first lesson and click through intro/vocab/dialog
        await pg.evaluate("location.hash='#home'"); await pg.wait_for_timeout(100)
        await pg.evaluate("startLesson(PZ.lessons[0])"); await pg.wait_for_timeout(100)
        for _ in range(3):
            await pg.click('#fNext'); await pg.wait_for_timeout(80)
        # answer all items automatically
        n = 0
        while n < 60:
            n += 1
            done = await pg.evaluate("""() => {
              if (!P || !P.cur) return 'nocur';
              if (P.i >= P.q.length) return 'end';
              const x = P.cur;
              if ($('#fNext') && P.locked) { $('#fNext').click(); return 'next'; }
              if (x.t==='pairs') { for (let i=0;i<x.pairs.length;i++){ $(`.pair[data-side="L"][data-k="${i}"]`).click(); $(`.pair[data-side="R"][data-k="${i}"]`).click(); } return 'pairs'; }
              if (x.t==='mc' || (x.t==='gap' && x.o)) { const i = x.o.findIndex(o => norm(o)===norm(String(x.a).split('|')[0])); $$('#pBody .choice')[i].click(); $('#fCheck').click(); return 'mc'; }
              if (x.t==='build') { const need = toks(x.a); const used=new Set(); for (const w of need){ const i = x.tiles.findIndex((t,j)=>t===w && !used.has(j)); used.add(i); $(`#pTiles .tile[data-ti="${i}"]`).click(); } $('#fCheck').click(); return 'build'; }
              const inp = $('#pInp'); inp.value = String(x.a).split('|')[0]; inp.dispatchEvent(new Event('input')); $('#fCheck').click(); return 'type';
            }""")
            if done in ('end', 'nocur'): break
            await pg.wait_for_timeout(30)
        allp = await pg.evaluate("""() => { const out=[]; 
          const step = () => { const x = P.cur;
              if ($('#fNext') && P.locked) { $('#fNext').click(); return; }
              if (x.t==='pairs') { for (let i=0;i<x.pairs.length;i++){ $(`.pair[data-side="L"][data-k="${i}"]`).click(); $(`.pair[data-side="R"][data-k="${i}"]`).click(); } return; }
              if (x.t==='mc' || (x.t==='gap' && x.o)) { const i = x.o.findIndex(o => norm(o)===norm(String(x.a).split('|')[0])); if (i<0) throw new Error('no answer '+JSON.stringify(x)); $$('#pBody .choice')[i].click(); $('#fCheck').click(); return; }
              if (x.t==='build') { const need = toks(x.a); const used=new Set(); for (const w of need){ const i = x.tiles.findIndex((t,j)=>t===w && !used.has(j)); if (i<0) throw new Error('tile '+w); used.add(i); $(`#pTiles .tile[data-ti="${i}"]`).click(); } $('#fCheck').click(); return; }
              const inp = $('#pInp'); inp.value = String(x.a).split('|')[0]; inp.dispatchEvent(new Event('input')); $('#fCheck').click(); };
          for (const l of PZ.lessons) { try { closePlayer(); startLesson(l); startExercises(); let n=0; while (P && P.i < P.q.length && n++ < 200) step(); if (!S.lessons[l.id]) out.push(l.id+' not finished'); else if (S.lessons[l.id].best < 100) out.push(l.id+' acc '+S.lessons[l.id].best); } catch(e) { out.push(l.id+' '+e.message); } }
          for (const lv of LEVELS) { try { closePlayer(); startLevelTest(lv); $('#fNext').click(); let n=0; while (P && P.i < P.q.length && n++ < 200) step(); if (!S.levels[lv]?.passed) out.push('test '+lv+' not passed '+JSON.stringify(S.levels[lv])); } catch(e) { out.push('test '+lv+' '+e.message); } }
          closePlayer(); return out; }""")
        errs += allp
        game = await pg.evaluate("JSON.stringify({lvl: levelOf(S.xp), zer: S.game.zer, quests: questList().map(q => q.id + ':' + q.v + '/' + q.n + (q.done ? ' done' : '')), chest: S.game.day.chest, badges: Object.keys(S.badges).length})")
        print('GAME', game)
        state = await pg.evaluate("JSON.stringify({lessons:S.lessons, cards:Object.keys(S.cards).length, xp:S.xp, foot: $('#pFootIn') && $('#pFootIn').innerText.slice(0,80), body: $('#pBody') && $('#pBody').innerText.slice(0,120)})")
        print('STATE', state)
        await pg.evaluate("closePlayer()")
        # verb trainer table for all verbs
        vt = await pg.evaluate("""() => { const out=[]; for (const v of PZ.verbs) for (const t of Object.keys(TENSES)) { if (!canTense(v,t)) continue; for (const p of [0,1,2,4]) { try { const o = t==='erg' ? (p===1?0:1) : undefined; const a = phrase(v,t,p,o); if (!a || a.includes('undefined')) out.push(v.inf+' '+t+' '+p+' '+a); } catch(e) { out.push(v.inf+' '+t+' ERR '+e.message); } } } return out; }""")
        errs += vt
        # reader: lookup coverage
        miss = await pg.evaluate("""() => { const out=[]; for (const t of PZ.texts) { RD.id=t.id; const words = t.body.join(' ').match(/[A-Za-zÇçÊêÎîÛûŞşÂâ]+/g); const m = [...new Set(words.filter(w => !lookup(w)))]; out.push(t.id+': '+m.length+' unknown: '+m.join(' ')); } RD.id=null; return out; }""")
        print('\n'.join(miss))
        for h in ['review','read','verbs','dict','profile']:
            await pg.evaluate(f"location.hash='#{h}'"); await pg.wait_for_timeout(100)
        await pg.evaluate("document.querySelectorAll('.fx').forEach(e => e.remove())")
        await pg.evaluate("startReview(Object.keys(S.cards).slice(0,5), false)")
        for i in range(5):
            await pg.click('#fShow'); await pg.click('#pFoot [data-q=\"2\"]')
        await pg.evaluate("closePlayer()")
        if SHOT:
            await pg.evaluate("location.hash='#home'"); await pg.wait_for_timeout(200)
            await pg.screenshot(path=SHOT, full_page=True)
        print('\n'.join(errs) if errs else 'NO ERRORS')
        await b.close()
asyncio.run(main())
