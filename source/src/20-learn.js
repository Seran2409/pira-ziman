/* ===== Pira Ziman · lesson player & exercises ===== */
let P = null;
const PRAISE = [['Rast e!', 'Richtig!'], ['Aferîn!', 'Bravo!'], ['Pir baş!', 'Sehr gut!'], ['Gelek xweş!', 'Sehr schön!'], ['Tu jêhatî yî!', 'Du bist begabt!']];
const showKu = s => String(s).split('|')[0];

/* ---------- exercise generation ---------- */
function vocabPool(lv) { const out = []; for (const l of PZ.lessons) if (!lv || l.lv === lv) for (const v of l.vocab || []) out.push(v); return out; }
function distract(correct, pool, field, n = 3) {
  const seen = new Set([norm(correct)]), out = [];
  for (const v of shuffle(pool)) { const c = v[field]; if (!seen.has(norm(c))) { seen.add(norm(c)); out.push(c); } if (out.length >= n) break; }
  return out;
}
function mcItem(v, l, dir) {
  const pool = [...(l.vocab || []), ...vocabPool(l.lv)];
  if (dir === 'kd') return { t: 'mc', dir, p: showKu(v[0]), a: v[1], o: shuffle([v[1], ...distract(v[1], pool, 1)]), key: showKu(v[0]) };
  return { t: 'mc', dir, p: v[1], a: showKu(v[0]), o: shuffle([showKu(v[0]), ...distract(showKu(v[0]), pool.map(x => [showKu(x[0]), x[1]]), 0)]), key: showKu(v[0]) };
}
const toks = s => showKu(s).replace(/[.,!?;:«»"]/g, '').split(/\s+/).filter(Boolean);
function buildItem(s, l) {
  const ans = toks(s[0]), have = new Set(ans.map(norm));
  const others = (l.s || []).filter(x => x !== s).flatMap(x => toks(x[0])).concat((l.vocab || []).map(v => showKu(v[0])).filter(w => !w.includes(' ')));
  const extra = []; for (const w of shuffle(others)) { if (!have.has(norm(w))) { have.add(norm(w)); extra.push(w); } if (extra.length >= Math.min(4, Math.max(2, Math.ceil(ans.length / 2)))) break; }
  return { t: 'build', p: s[1], a: s[0], tiles: shuffle([...ans, ...extra]) };
}
function gapItem(g) { return { t: 'gap', s: g[0], a: g[1], o: g[2] && g[2].length ? shuffle(g[2]) : null, h: g[3] || '' }; }
function buildExercises(l) {
  const V = shuffle(l.vocab || []), items = [];
  if (V.length >= 4) items.push({ t: 'pairs', pairs: V.slice(0, 5).map(v => [showKu(v[0]), v[1]]) });
  V.slice(0, 3).forEach(v => items.push(mcItem(v, l, 'kd')));
  V.slice(3, 6).forEach(v => items.push(mcItem(v, l, 'dk')));
  V.filter(v => showKu(v[0]).split(' ').length <= 2).slice(6, 8).forEach(v => items.push({ t: 'type', p: v[1], a: v[0], key: showKu(v[0]) }));
  pick(l.s || [], 4).forEach(s => items.push(buildItem(s, l)));
  (l.g || []).forEach(g => items.push(gapItem(g)));
  const first = items.filter(x => x.t === 'pairs'), rest = shuffle(items.filter(x => x.t !== 'pairs'));
  return [...first, ...rest];
}
function testExercises(lv) {
  const out = [];
  for (const l of byLevel(lv)) {
    if (l.g?.length) out.push(gapItem(pick(l.g, 1)[0]));
    if (l.s?.length) out.push(buildItem(pick(l.s, 1)[0], l));
    if (l.vocab?.length) out.push(mcItem(pick(l.vocab, 1)[0], l, Math.random() < .5 ? 'kd' : 'dk'));
  }
  return pick(out, 20);
}

/* ---------- player shell ---------- */
function openPlayer(label) {
  $('#overlay').innerHTML = `<div class="player" role="dialog" aria-modal="true" aria-label="${esc(label)}">
    <div class="player-top"><button class="btn ghost sm" id="pClose" aria-label="Schließen">✕</button><div class="bar" aria-hidden="true"><i id="pBar" style="width:0%"></i></div><span class="combo" id="pCombo"></span><button class="btn ghost sm" id="pRate" title="Sprechtempo" aria-label="Sprechtempo ändern">${rateLabel()}</button></div>
    <div class="player-body" id="pScroll"><div class="player-inner" id="pBody"></div></div>
    <div class="player-foot" id="pFoot"><div class="in" id="pFootIn"></div></div></div>`;
  document.body.style.overflow = 'hidden';
  $('#pClose').onclick = closePlayer;
  $('#pRate').onclick = () => { S.rate = S.rate === 1 ? .75 : S.rate === .75 ? .55 : 1; save(); $('#pRate').textContent = rateLabel(); toast('Sprechtempo: ' + rateLabel()); };
}
const rateLabel = () => 'Tempo: ' + (S.rate === .55 ? 'langsam' : S.rate === .75 ? 'ruhig' : 'normal');
function closePlayer() { stopSay(); $('#overlay').innerHTML = ''; document.body.style.overflow = ''; P = null; route(); }
function setBar() { if (!P) return; const tot = P.q.length || 1; $('#pBar').style.width = Math.round(P.i / tot * 100) + '%'; $('#pCombo').textContent = P.combo >= 3 ? P.combo + '× in Folge' : ''; }
function foot(html, cls = '') { const f = $('#pFoot'); f.className = 'player-foot ' + cls; $('#pFootIn').innerHTML = html; }
function body(html) { const b = $('#pBody'); b.innerHTML = html; $('#pScroll').scrollTop = 0; enhanceSay(b); }

/* ---------- lesson flow ---------- */
function startLesson(l) {
  P = { mode: 'lesson', l, q: [], i: 0, first: 0, uniq: 0, wrongKeys: new Set(), combo: 0, best: 0, retried: new Set() };
  openPlayer('Lektion ' + l.title); stepIntro();
}
function lessonNo(l) { return byLevel(l.lv).indexOf(l) + 1; }
function stepIntro() {
  const l = P.l;
  body(`<div class="eyebrow">${l.lv} · Lektion ${lessonNo(l)} von ${byLevel(l.lv).length}</div>
    <h1>${esc(l.title)}</h1><p class="muted" style="font-size:1.05rem">${esc(l.sub)}${l.goal ? ' · ' + esc(l.goal) : ''}</p>
    <div class="theory">${l.th || ''}</div>
    ${l.dia ? `<div class="dialect"><div class="eyebrow">Herêmî · So klingt es in Amed &amp; Êlih</div><div class="theory" style="margin-top:6px">${l.dia}</div></div>` : ''}`);
  foot(`<button class="btn ghost" id="fSkip">Direkt zu den Übungen</button><span class="grow"></span><button class="btn primary big" id="fNext">Weiter zu den Wörtern</button>`);
  $('#fNext').onclick = stepVocab; $('#fSkip').onclick = startExercises; setBar();
}
function stepVocab() {
  const l = P.l;
  body(`<div class="eyebrow">Peyv · Wörter</div><h2>${(l.vocab || []).length} neue Wörter</h2>
    <p class="muted">Hör dir jedes Wort an und sprich es halblaut nach. Decke dann die Übersetzung mit der Hand ab und teste dich. Die blauen Hinweise sind Eselsbrücken.</p>
    <div>${sayListBtn((l.vocab || []).map(v => showKu(v[0])), 'Alle Wörter anhören')}</div>
    <div class="vgrid">${(l.vocab || []).map(v => `<div class="vcard"><span class="row" style="justify-content:space-between;flex-wrap:nowrap"><span class="k">${esc(showKu(v[0]).replace(/\|/g, ' / '))}</span>${sayBtn(showKu(v[0]))}</span>${ipaOf(showKu(v[0])) ? `<span class="ph">[${esc(ipaOf(showKu(v[0])))}]</span>` : ''}<span>${esc(v[1])}</span>${v[2] ? `<span class="tip">${esc(v[2])}</span>` : ''}</div>`).join('')}</div>`);
  foot(`<button class="btn ghost" id="fBack">Zurück</button><span class="grow"></span><button class="btn primary big" id="fNext">${l.dlg?.length ? 'Weiter zum Dialog' : 'Übungen starten'}</button>`);
  $('#fBack').onclick = stepIntro; $('#fNext').onclick = l.dlg?.length ? stepDialog : startExercises;
}
function stepDialog() {
  const l = P.l; let show = false;
  const draw = () => {
    body(`<div class="eyebrow">Axaftin · Dialog</div><h2>Hör dir selbst zu</h2>
      <p class="muted">Lies den Dialog laut, zuerst ohne Übersetzung. Was verstehst du schon? Dann deck die Übersetzung auf. Tipp: Sprich jede Zeile dreimal nach (Shadowing).</p>
      <div>${sayListBtn(l.dlg.map(d => d[1]), 'Ganzen Dialog anhören')}</div>
      <div class="dialog">${l.dlg.map(d => `<div class="line ${d[0] === 'B' ? 'b' : ''}"><span class="who">${esc(d[0])}</span><div class="bub"><div class="ku">${esc(d[1])}</div>${show ? `<div class="tr">${esc(d[2])}</div>` : ''}</div>${sayBtn(d[1])}</div>`).join('')}</div>
      <div><button class="btn sm" id="tgl">${show ? 'Übersetzung verbergen' : 'Übersetzung zeigen'}</button></div>`);
    $('#tgl').onclick = () => { show = !show; draw(); };
  };
  draw();
  foot(`<button class="btn ghost" id="fBack">Zurück</button><span class="grow"></span><button class="btn primary big" id="fNext">Übungen starten</button>`);
  $('#fBack').onclick = stepVocab; $('#fNext').onclick = startExercises;
}
function startExercises() { P.q = buildExercises(P.l); P.uniq = P.q.length; P.i = 0; nextItem(); }

/* ---------- level test ---------- */
function startLevelTest(lv) {
  const q = testExercises(lv); if (!q.length) { toast('Für dieses Niveau gibt es noch keine Übungen.'); return; }
  P = { mode: 'test', lv, q, i: 0, first: 0, uniq: q.length, wrongKeys: new Set(), combo: 0, best: 0, retried: new Set(), noRetry: true };
  openPlayer('Niveautest ' + lv);
  body(`<div class="eyebrow">Ezmûn · Niveautest</div><h1>Test ${lv}: ${LEVEL_INFO[lv].ku}</h1>
    <p class="muted" style="font-size:1.05rem">${q.length} gemischte Aufgaben aus allen Lektionen von ${lv}. Ab 80 % gilt das Niveau als bestanden: Alle Lektionen von ${lv} und das nächste Niveau werden freigeschaltet.</p>
    <div class="panel"><b>Ohne Hilfen.</b> Fehler werden in diesem Test nicht wiederholt. Nimm dir Zeit.</div>`);
  foot(`<span class="grow"></span><button class="btn primary big" id="fNext">Test starten</button>`);
  $('#fNext').onclick = nextItem; setBar();
}

/* ---------- item rendering ---------- */
function nextItem() {
  if (P.i >= P.q.length) return finish();
  const x = P.cur = P.q[P.i]; P.ans = null; P.built = []; P.locked = false;
  setBar();
  let h = '';
  if (x.t === 'mc') h = `<div class="eyebrow">${x.dir === 'kd' ? 'Was bedeutet das?' : 'Wie sagt man das auf Kurmancî?'}</div><div class="row"><div class="prompt">${esc(x.p)}</div>${x.dir === 'kd' ? sayBtn(x.p, 'lg') : ''}</div>
      <div class="choices">${x.o.map((o, i) => `<button class="choice" data-c="${i}"><kbd>${i + 1}</kbd><span>${esc(o)}</span></button>`).join('')}</div>`;
  else if (x.t === 'type') h = `<div class="eyebrow">Schreib es auf Kurmancî</div><div class="prompt">${esc(x.p)}</div>
      <input class="inp" id="pInp" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Kurmancî …" aria-label="Antwort">${keysHTML('pInp')}`;
  else if (x.t === 'build') h = `<div class="eyebrow">Bilde den Satz auf Kurmancî</div><div class="prompt">${esc(x.p)}</div>
      <div class="answer-line" id="pLine" aria-label="Deine Antwort"></div><div class="tiles" id="pTiles">${x.tiles.map((w, i) => `<button class="tile" data-ti="${i}">${esc(w)}</button>`).join('')}</div>`;
  else if (x.t === 'gap') h = `<div class="eyebrow">${x.o ? 'Wähle die richtige Form' : 'Ergänze die Lücke'}</div>
      <div class="gapsent">${esc(x.s).replace('___', '<span class="gap" id="pGap">…</span>')}</div>
      ${x.o ? `<div class="choices">${x.o.map((o, i) => `<button class="choice" data-c="${i}"><kbd>${i + 1}</kbd><span>${esc(o)}</span></button>`).join('')}</div>`
      : `<input class="inp" id="pInp" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Lücke …" aria-label="Antwort">${keysHTML('pInp')}`}`;
  else if (x.t === 'pairs') {
    P.pairsLeft = x.pairs.length; P.pairErr = 0; P.selP = null;
    const L = shuffle(x.pairs.map((p, i) => [p[0], i])), R = shuffle(x.pairs.map((p, i) => [p[1], i]));
    h = `<div class="eyebrow">Finde die Paare</div><div class="prompt">Tippe ein Wort und dann seine Bedeutung</div>
      <div class="pairs"><div class="col">${L.map(([t, i]) => `<button class="pair" data-side="L" data-k="${i}">${esc(t)}</button>`).join('')}</div>
      <div class="col">${R.map(([t, i]) => `<button class="pair" data-side="R" data-k="${i}">${esc(t)}</button>`).join('')}</div></div>`;
  }
  body(h);
  if (x.t === 'pairs') foot(`<span class="fb muted">Ordne alle ${x.pairs.length} Paare zu.</span>`);
  else { foot(`<span class="grow"></span><button class="btn primary big" id="fCheck" disabled>Prüfen</button>`); $('#fCheck').onclick = doCheck; }
  const inp = $('#pInp'); if (inp) { inp.addEventListener('input', () => { P.ans = inp.value; $('#fCheck').disabled = !inp.value.trim(); }); setTimeout(() => inp.focus(), 50); }
  if (x.t === 'mc' && x.dir === 'kd') autoSay(x.p);
}

/* interactions (delegated) */
document.addEventListener('click', e => {
  if (!P || !P.cur || P.locked) return;
  const x = P.cur;
  const c = e.target.closest('#pBody .choice');
  if (c) { $$('#pBody .choice').forEach(b => b.classList.remove('sel')); c.classList.add('sel'); P.ans = x.o[+c.dataset.c]; if ($('#pGap')) $('#pGap').textContent = P.ans; $('#fCheck').disabled = false; if (x.t === 'gap') say(x.s.replace('___', P.ans)); else if (x.dir === 'dk') say(P.ans); return; }
  const t = e.target.closest('#pBody .tile');
  if (t) {
    if (t.parentElement.id === 'pTiles') { P.built.push(+t.dataset.ti); t.classList.add('used'); say(x.tiles[+t.dataset.ti]); }
    else { P.built = P.built.filter(i => i !== +t.dataset.ti); $(`#pTiles .tile[data-ti="${t.dataset.ti}"]`).classList.remove('used'); }
    $('#pLine').innerHTML = P.built.map(i => `<button class="tile" data-ti="${i}">${esc(x.tiles[i])}</button>`).join('');
    $('#fCheck').disabled = !P.built.length; return;
  }
  const p = e.target.closest('#pBody .pair');
  if (p && !p.classList.contains('done')) {
    if (p.dataset.side === 'L') say(p.textContent);
    if (!P.selP || P.selP.dataset.side === p.dataset.side) { $$('#pBody .pair.sel').forEach(b => b.classList.remove('sel')); p.classList.add('sel'); P.selP = p; return; }
    if (P.selP.dataset.k === p.dataset.k) {
      [P.selP, p].forEach(b => { b.classList.remove('sel'); b.classList.add('done'); b.disabled = true; });
      P.selP = null; if (--P.pairsLeft === 0) settle(P.pairErr <= 1 ? 'ok' : 'bad', true);
    } else { P.pairErr++; const a = P.selP; [a, p].forEach(b => { b.classList.add('shake'); setTimeout(() => b.classList.remove('shake', 'sel'), 350); }); P.selP = null; }
  }
});
document.addEventListener('keydown', e => {
  if (!P) return;
  if (e.key === 'Escape') { closePlayer(); return; }
  if (e.key === 'Enter') { const b = $('#fNext') || $('#fCheck'); if (b && !b.disabled) { e.preventDefault(); b.click(); } return; }
  if (/^[1-6]$/.test(e.key) && P.cur && !P.locked && document.activeElement?.id !== 'pInp') { const c = $$('#pBody .choice')[+e.key - 1]; if (c) c.click(); }
});

function doCheck() {
  const x = P.cur; let res;
  if (x.t === 'mc') res = norm(P.ans) === norm(x.a) ? 'ok' : 'bad';
  else if (x.t === 'gap' && x.o) res = check(P.ans, x.a);
  else if (x.t === 'build') res = check(P.built.map(i => x.tiles[i]).join(' '), x.a);
  else res = check(P.ans || '', x.a);
  settle(res);
}
function settle(res, isPairs) {
  const x = P.cur; P.locked = true;
  const good = res !== 'bad', firstTry = !P.retried.has(P.i);
  if (good) { P.combo++; if (firstTry && !x.again) P.first++; }
  else { P.combo = 0; if (x.key) P.wrongKeys.add(x.key); if (!P.noRetry && !x.again) P.q.push({ ...x, again: true, o: x.o ? shuffle(x.o) : x.o, tiles: x.tiles ? shuffle(x.tiles) : x.tiles }); }
  P.best = Math.max(P.best, P.combo);
  // colour choices
  $$('#pBody .choice').forEach(b => { const v = x.o[+b.dataset.c]; if (norm(v) === norm(showKu(x.a)) || String(x.a).split('|').some(a => norm(a) === norm(v))) b.classList.add('right'); else if (b.classList.contains('sel')) b.classList.add('wrong'); b.disabled = true; });
  const pr = PRAISE[Math.floor(Math.random() * PRAISE.length)];
  const sol = String(x.a).split('|')[0];
  let msg;
  if (isPairs) msg = good ? `<b>${pr[0]}</b> <span class="muted">${pr[1]}</span>` : `<b>Fast.</b> <span class="muted">${P.pairErr} Fehlversuche, die Wörter kommen später wieder.</span>`;
  else if (res === 'ok') msg = `<b>${pr[0]}</b> <span class="muted">${pr[1]}</span>`;
  else if (res === 'near') msg = `<b>Fast richtig!</b><div>Achte auf die Sonderzeichen: <span class="ku">${esc(sol)}</span></div>`;
  else msg = `<b>Ne rast e · Nicht ganz</b><div>Richtig: <span class="ku">${esc(x.t === 'mc' && x.dir === 'kd' ? x.a : sol)}</span></div>${x.h ? `<div class="muted" style="font-size:.9rem">${esc(x.h)}</div>` : ''}`;
  if (x.t === 'build' && res === 'ok' && sol !== x.a) msg += `<div class="muted">Auch richtig: ${esc(x.a.split('|').slice(1).join(' / '))}</div>`;
  const solKu = x.t === 'mc' ? (x.dir === 'kd' ? x.p : String(x.a).split('|')[0]) : x.t === 'gap' ? x.s.replace('___', sol) : x.t === 'pairs' ? '' : sol;
  foot(`<div class="fb">${msg}</div>${solKu ? sayBtn(solKu, 'lg', 'Lösung anhören') : ''}<button class="btn primary big" id="fNext">Weiter</button>`, good ? 'ok' : 'bad');
  if (solKu) setTimeout(() => { if (P && P.locked) autoSay(solKu); }, 150);
  $('#fNext').onclick = () => { P.i++; nextItem(); };
  $('#fNext').focus();
}

/* ---------- finish ---------- */
function finish() {
  setBar();
  const acc = Math.round(P.first / Math.max(1, P.uniq) * 100);
  if (P.mode === 'test') {
    const lv = P.lv, passed = acc >= 80, prev = S.levels[lv] || {};
    S.levels[lv] = { passed: prev.passed || passed, best: Math.max(prev.best || 0, acc) };
    addXP(passed ? 25 : 8);
    body(`<div class="stack result"><div class="eyebrow">Ezmûn · ${lv}</div><div class="big">${acc}%</div>
      <h2>${passed ? 'Bestanden! ' + lv + ' ist freigeschaltet.' : 'Noch nicht ganz. Ab 80 % ist der Test bestanden.'}</h2>
      <p class="muted">${passed ? 'Du kannst jetzt jede Lektion dieses Niveaus öffnen und mit dem nächsten Niveau weitermachen.' : 'Wiederhole die Lektionen, in denen du unsicher warst, und versuche es dann noch einmal.'}</p></div>`);
    foot(`<span class="grow"></span><button class="btn primary big" id="fNext">Zum Lernpfad</button>`);
    $('#fNext').onclick = () => { closePlayer(); location.hash = '#path'; };
    return;
  }
  const l = P.l, st = acc >= 90 ? 3 : acc >= 70 ? 2 : 1, prev = S.lessons[l.id];
  const xp = 10 + P.uniq + (st === 3 ? 5 : 0) + (P.best >= 10 ? 5 : 0);
  S.lessons[l.id] = { stars: Math.max(st, prev?.stars || 0), best: Math.max(acc, prev?.best || 0), times: (prev?.times || 0) + 1, last: Date.now() };
  addCards((l.vocab || []).map(v => showKu(v[0])), [...P.wrongKeys]);
  addXP(xp);
  const nl = nextLesson();
  body(`<div class="stack result"><div class="eyebrow">Ders qediya · Lektion geschafft</div>
    <div class="big">+${xp} XP</div><div class="stars" style="font-size:2rem">${stars(st)}</div>
    <h2>${acc}% beim ersten Versuch richtig</h2>
    <p class="muted">${(l.vocab || []).length} Wörter sind jetzt in deinem Kartenstapel. Sie kommen morgen zur Wiederholung${P.wrongKeys.size ? ', ' + P.wrongKeys.size + ' davon schon heute' : ''}.</p>
    <p class="muted">Längste Serie: ${P.best} richtige Antworten in Folge.</p></div>`);
  foot(`<button class="btn" id="fAgain">Nochmal üben</button><button class="btn" id="fPron">Sätze nachsprechen</button><span class="grow"></span>${nl && nl.id !== l.id ? `<button class="btn primary big" id="fNext">Nächste Lektion</button>` : `<button class="btn primary big" id="fNext">Fertig</button>`}`);
  $('#fPron').onclick = () => { PR.lesson = l.id; PR.text = null; PR.res = null; PR.tab = 'nach'; closePlayer(); location.hash = '#pron'; };
  $('#fAgain').onclick = () => { const L = l; P = null; startLesson(L); startExercises(); };
  $('#fNext').onclick = () => { if (nl && nl.id !== l.id) { P = null; startLesson(nl); } else closePlayer(); };
}
