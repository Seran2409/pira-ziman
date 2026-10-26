/* Runs inside the built page (Playwright). Returns every Kurdish phrase and word that should get audio.
   Output: { items: [[key, text], ...] } where key = audioKey(text). */
(() => {
  const strip = s => String(s).replace(/\([^)]*\)/g, ' ').replace(/[„“"«»]/g, ' ').replace(/…|___/g, ' ');
  const key = s => norm(strip(s));
  const toks = s => key(s).split(' ').filter(Boolean);
  const phrases = new Map(), words = new Set(), lex = new Set();
  const addLex = s => toks(s).forEach(t => lex.add(t));
  const addP = s => { const k = key(s); if (!k) return; if (!phrases.has(k)) phrases.set(k, strip(s).replace(/\s+/g, ' ').trim()); toks(s).forEach(t => words.add(t)); };
  const variants = s => String(s).split('|');
  const known = s => { const t = toks(s); return t.length > 0 && t.every(w => lex.has(w)); };

  // 1. lexicon from unambiguous Kurdish sources
  for (const l of PZ.lessons) {
    (l.vocab || []).forEach(v => variants(v[0]).forEach(addLex));
    (l.s || []).forEach(s => variants(s[0]).forEach(addLex));
    (l.dlg || []).forEach(d => addLex(d[1]));
    (l.g || []).forEach(g => { variants(g[1]).forEach(addLex); (g[2] || []).forEach(addLex); });
  }
  for (const t of PZ.texts) { t.body.forEach(addLex); (t.gloss || []).forEach(g => addLex(g[0])); }
  PZ.proverbs.forEach(p => addLex(p[0]));
  Object.keys(PZ.func).forEach(addLex);
  for (const k of VFORM.keys()) addLex(k);
  for (const v of PZ.verbs) { addLex(v.inf); for (const t of Object.keys(TENSES)) { if (!canTense(v, t)) continue; for (const p of [0, 1, 2, 3, 4, 5, 6]) { if (t === 'imp' && p !== 1 && p !== 5) continue; if (t === 'erg') continue; addLex(phrase(v, t, p)); } } }
  for (const v0 of PZ.verbs) { const v = full(v0); if (!v.tr || v.lvn) continue; for (let s = 0; s < 6; s++) addLex((v.pv || '') + v.pa + pastEnd(v.pa, s)); }
  OBL.forEach(addLex); PRON.forEach(addLex); FUTP.forEach(addLex);
  PZ.alphabet.forEach(a => addLex(a[2].replace(/\(.*\)/, '')));
  (PZ.sounds || []).forEach(s => { s.ex.forEach(e => addLex(e[0])); addLex(s.drill); });
  Object.values(PZ.pairs || {}).flat().forEach(p => { addLex(p[0]); addLex(p[2]); });

  // 2. phrases
  for (const l of PZ.lessons) {
    (l.vocab || []).forEach(v => variants(v[0]).forEach(addP));
    (l.s || []).forEach(s => variants(s[0]).forEach(addP));
    (l.dlg || []).forEach(d => addP(d[1]));
    (l.g || []).forEach(g => { const a = variants(g[1])[0]; variants(g[1]).forEach(addP); (g[2] || []).forEach(o => { if (known(o)) addP(o); });
      const filled = g[0].replace('___', a).replace(/\s*\(.*\)\s*$/, ''); const filled2 = g[0].replace(/(\S*)___(\S*)/, (m, x, y) => x + a + y).replace(/\s*\(.*\)\s*$/, '');
      [filled, filled2].forEach(f => { if (known(f)) addP(f); }); });
  }
  const sentences = p => p.split(/(?<=[.!?…:])\s+/).filter(x => x.trim());
  for (const t of PZ.texts) { t.body.forEach(p => sentences(p).forEach(addP)); addP(t.title); (t.gloss || []).forEach(g => addP(g[0])); if (!['A1', 'A2'].includes(t.lv)) (t.q || []).forEach(q => [q[0], q[1], ...q[2]].forEach(x => { if (known(x)) addP(x); })); }
  PZ.proverbs.forEach(p => addP(p[0]));
  PZ.alphabet.forEach(a => { addP(a[0]); addP(a[2].replace(/\(.*\)/, '')); });
  for (const v of PZ.verbs) addP(v.inf);
  (PZ.sounds || []).forEach(s => { s.ex.forEach(e => addP(e[0])); addP(s.drill); });
  Object.values(PZ.pairs || {}).flat().forEach(p => { addP(p[0]); addP(p[2]); });
  // theory, dialect notes, grammar reference, method page: Kurdish-looking snippets
  const box = document.createElement('div');
  const html = [...PZ.lessons.map(l => (l.th || '') + (l.dia || '')), ...PZ.ref.map(r => r.html), PZ.method].join('\n');
  box.innerHTML = html;
  box.querySelectorAll('.ku, .ex .k, td, i, b, .it .k, .alpha div').forEach(el => {
    let s = el.textContent; s = s.replace(/^\s*\d+\s+/, '');
    s.split(/\s*[\/→·–]\s*|;\s*/).forEach(part => { const c = part.replace(/^(falsch|richtig):?/i, ''); if (known(c)) addP(c); });
  });
  // all words that appear anywhere get word-level audio (used to read any phrase word by word)
  for (const w of lex) words.add(w);
  const items = []; const seen = new Set();
  for (const [k, txt] of phrases) { if (!seen.has(k)) { seen.add(k); items.push([k, txt]); } }
  for (const w of words) { if (!seen.has(w)) { seen.add(w); items.push([w, w]); } }
  return { items, nPhrases: phrases.size, nWords: words.size };
})()
