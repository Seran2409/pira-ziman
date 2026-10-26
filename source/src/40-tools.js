/* ===== Pira Ziman · review, reader, dictionary, grammar, method, profile ===== */

/* ---------- Dubare: spaced repetition ---------- */
let RV = { dir: 'mix', typing: false, q: [], i: 0, shown: false, cram: false, res: null, done: 0 };
VIEWS.review = () => {
  const due = dueCards(), total = Object.keys(S.cards).length;
  const hard = Object.values(S.cards).filter(c => c.l >= 2).length;
  return `<div class="page-head"><div class="eyebrow">Dubare · Karteikarten</div><h1>Wiederholen mit System</h1>
    <p>Jedes Wort kommt genau dann zurück, wenn du es fast vergessen hättest. Das ist verteilte Wiederholung (Spaced Repetition): wenige Minuten am Tag, die meisten Wörter bleiben dauerhaft hängen.</p></div>
  <div class="stats"><div class="stat"><b>${due.length}</b><small>heute fällig</small></div><div class="stat"><b>${total}</b><small>Karten gesamt</small></div><div class="stat"><b>${knownWords()}</b><small>sicher (≥ 4 Tage)</small></div><div class="stat"><b>${hard}</b><small>Problemwörter</small></div></div>
  <section class="card stack">
    <div class="row"><span class="eyebrow grow">Richtung</span>
      <div class="seg" role="group" aria-label="Richtung">${[['ku', 'Kurmancî → Deutsch'], ['de', 'Deutsch → Kurmancî'], ['mix', 'Gemischt']].map(([k, n]) => `<button data-rd="${k}" aria-pressed="${RV.dir === k}">${n}</button>`).join('')}</div></div>
    <label class="row" style="font-size:.92rem"><input type="checkbox" id="rvType" ${RV.typing ? 'checked' : ''}> Antwort tippen statt nur aufdecken (stärkerer Lerneffekt)</label>
    <div class="row">
      <button class="btn primary big" id="rvGo" ${due.length ? '' : 'disabled'}>${due.length ? Math.min(due.length, 40) + ' Karten wiederholen' : 'Nichts fällig'}</button>
      <button class="btn" id="rvCram" ${total ? '' : 'disabled'}>Extra-Training (20 zufällige)</button>
      ${hard ? `<button class="btn" id="rvHard">Problemwörter üben</button>` : ''}
    </div>
    ${!total ? '<p class="muted">Dein Stapel ist noch leer. Jede abgeschlossene Lektion legt ihre Wörter hier ab.</p>' : ''}
  </section>
  <section class="stack"><h2>Vorschau: die nächsten 7 Tage</h2>${forecast()}</section>`;
};
function forecast() {
  const now = Date.now(), days = Array.from({ length: 7 }, (_, i) => 0);
  for (const c of Object.values(S.cards)) { const d = Math.max(0, Math.floor((c.d - now) / DAY + (c.d <= now ? 0 : 1))); if (d < 7) days[d]++; }
  const mx = Math.max(1, ...days), names = ['Heute', 'Morgen', '+2', '+3', '+4', '+5', '+6'];
  return `<div class="card"><svg viewBox="0 0 700 150" style="width:100%;height:auto" role="img" aria-label="Fällige Karten pro Tag">
    <line x1="0" y1="120" x2="700" y2="120" stroke="var(--line)"/>
    ${days.map((n, i) => { const h = Math.round(n / mx * 90), x = 20 + i * 98; return `<rect x="${x}" y="${120 - h}" width="60" height="${h}" rx="5" fill="${i ? 'var(--dicle)' : 'var(--hinar)'}" opacity="${i ? .55 : 1}"/><text x="${x + 30}" y="${112 - h}" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)">${n}</text><text x="${x + 30}" y="140" text-anchor="middle" font-size="12" fill="var(--muted)">${names[i]}</text>`; }).join('')}
  </svg></div>`;
}
VIEWS.review.after = () => {
  $$('[data-rd]').forEach(b => b.onclick = () => { RV.dir = b.dataset.rd; route(); });
  $('#rvType').onchange = e => { RV.typing = e.target.checked; };
  $('#rvGo').onclick = () => startReview(dueCards().slice(0, 40), false);
  $('#rvCram').onclick = () => startReview(pick(Object.keys(S.cards).filter(k => DICT.has(k)), 20), true);
  if ($('#rvHard')) $('#rvHard').onclick = () => startReview(Object.entries(S.cards).filter(([k, c]) => c.l >= 2 && DICT.has(k)).map(e => e[0]).slice(0, 30), true);
};
function startReview(keys, cram) {
  if (!keys.length) return;
  RV = { ...RV, q: keys.map(k => ({ k, d: RV.dir === 'mix' ? (Math.random() < .5 ? 'ku' : 'de') : RV.dir })), i: 0, cram, done: 0 };
  P = { mode: 'review', q: RV.q, i: 0, combo: 0 };
  openPlayer('Wiederholung'); rvCard();
}
function rvCard() {
  if (RV.i >= RV.q.length) {
    body(`<div class="stack result"><div class="eyebrow">Dubare qediya</div><div class="big">${RV.done}</div><h2>Karten wiederholt</h2><p class="muted">${RV.cram ? 'Extra-Training verändert deinen Wiederholungsplan nicht.' : 'Die nächsten Termine sind eingeplant. Morgen geht es weiter.'}</p></div>`);
    foot(`<span class="grow"></span><button class="btn primary big" id="fNext">Fertig</button>`); $('#fNext').onclick = closePlayer; P.i = P.q.length; setBar(); return;
  }
  P.i = RV.i; setBar(); RV.shown = false; RV.res = null;
  const it = RV.q[RV.i], w = DICT.get(it.k), front = it.d === 'ku' ? w.ku : w.de;
  body(`<div class="flash"><div class="eyebrow">${it.d === 'ku' ? 'Was bedeutet …' : 'Wie sagt man auf Kurmancî …'}</div><div class="front">${esc(front)}</div>${it.d === 'ku' ? sayBtn(w.ku, 'lg') : ''}<div id="rvBack"></div></div>
    ${RV.typing ? `<input class="inp" id="pInp" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${it.d === 'ku' ? 'Deutsch …' : 'Kurmancî …'}" aria-label="Antwort">${it.d === 'de' ? keysHTML('pInp') : ''}` : ''}`);
  foot(`<span class="grow"></span><button class="btn primary big" id="fShow">${RV.typing ? 'Prüfen' : 'Aufdecken'}</button>`);
  $('#fShow').onclick = rvReveal;
  if (it.d === 'ku') autoSay(w.ku);
  const inp = $('#pInp'); if (inp) { setTimeout(() => inp.focus(), 50); inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); if (!RV.shown) rvReveal(); } }; }
}
function rvReveal() {
  const it = RV.q[RV.i], w = DICT.get(it.k); RV.shown = true;
  let verdict = '';
  if (RV.typing) {
    const v = $('#pInp').value;
    const r = it.d === 'de' ? check(v, w.ku) : (w.de.split(/[\/,;]| oder /).some(x => norm(x).length > 1 && (norm(v) === norm(x) || norm(x).includes(norm(v)) && norm(v).length > 3)) ? 'ok' : 'bad');
    RV.res = r; verdict = `<div class="pill ${r === 'bad' ? 'hot' : 'ok'}">${r === 'ok' ? 'Richtig' : r === 'near' ? 'Fast (Sonderzeichen)' : 'Falsch – sei ehrlich zu dir'}</div>`;
  }
  $('#rvBack').innerHTML = `<hr style="width:60%;border:0;border-top:1px solid var(--line)"><div class="back">${esc(it.d === 'ku' ? w.de : w.ku)}</div>${it.d === 'de' ? sayBtn(w.ku, 'lg') : ''}${w.tip ? `<div class="muted" style="font-size:.9rem">${esc(w.tip)}</div>` : ''}${verdict}<div class="pill lv">${w.lv}</div>`;
  const qs = [[0, 'Nochmal'], [1, 'Schwer'], [2, 'Gut'], [3, 'Leicht']];
  foot(`<div class="rate" style="flex:1">${qs.map(([q, n]) => `<button class="r${q}" data-q="${q}"><span>${n}</span><small>${RV.cram ? (q ? '' : 'nochmal') : nextInterval(it.k, q)}</small><small>Taste ${q + 1}</small></button>`).join('')}</div>`);
  $$('#pFoot [data-q]').forEach(b => b.onclick = () => rvRate(+b.dataset.q));
  if (RV.res === 'bad') $('#pFoot [data-q="0"]').focus();
  if (it.d === 'de') autoSay(w.ku);
}
function rvRate(q) {
  const it = RV.q[RV.i];
  if (!RV.cram) grade(it.k, q); else if (q === 0) RV.q.push({ ...it });
  if (!RV.cram && q === 0) RV.q.push({ ...it });
  RV.done++; RV.i++; addXP(1); rvCard();
}
document.addEventListener('keydown', e => {
  if (!P || P.mode !== 'review') return;
  if (e.key === ' ' && !RV.shown && document.activeElement?.id !== 'pInp') { e.preventDefault(); rvReveal(); }
  else if (RV.shown && /^[1-4]$/.test(e.key)) { e.preventDefault(); rvRate(+e.key - 1); }
});

/* ---------- Xwendin: reader ---------- */
let RD = { id: null, tr: false };
function lookup(word) {
  const k = word.toLowerCase().replace(/[^a-zêîûçşA-ZÊÎÛÇŞ\-]/g, '');
  if (!k) return null;
  const t = PZ.texts.find(x => x.id === RD.id);
  const g = t?.gloss?.find(x => x[0].toLowerCase() === k); if (g) return { ku: g[0], de: g[1], form: '' };
  if (DICT.has(k)) return { ...DICT.get(k), form: '' };
  const fw = PZ.func[k] || PZ.func[word.replace(/[^A-Za-zÇçÊêÎîÛûŞşÂâ]/g, '')];
  if (fw) return { ku: word.replace(/[^A-Za-zÇçÊêÎîÛûŞşÂâ\-]/g, ''), de: fw, form: '' };
  const vb = PZ.verbs.find(v => v.inf === k); if (vb) return { ku: vb.inf, de: vb.de, form: 'Infinitiv', verb: true };
  if (VFORM.has(k)) { const f = VFORM.get(k); return { ku: f.v.inf, de: f.v.de, form: `${TENSES[f.t][0]}${f.neg ? ' verneint' : ''}${f.pl ? ', Objekt im Plural' : ', ' + ['1. Sg.', '2. Sg.', '3. Sg.', '1. Pl.', '2. Pl.', '3. Pl.'][f.s]}`, verb: true }; }
  const suf = ['ekê', 'ekî', 'eke', 'yên', 'ên', 'yê', 'ya', 'an', 'ê', 'a', 'î', 'e', 'ne', 'ye', 'iye', 'in', 'im', 'ek', 'yan'];
  for (const s of suf) if (k.endsWith(s) && k.length > s.length + 1) { const st = k.slice(0, -s.length); for (const c of [...new Set([st, st.replace(/i$/, 'î'), st.replace(/y$/, ''), st.replace(/iy$/, 'î')])]) { if (DICT.has(c)) return { ...DICT.get(c), form: 'Endung -' + s }; const tg = t?.gloss?.find(x => x[0].toLowerCase() === c); if (tg) return { ku: tg[0], de: tg[1], form: 'Endung -' + s }; if (PZ.func[c]) return { ku: c, de: PZ.func[c], form: 'Endung -' + s }; } const cap = word.replace(/[^A-Za-zÇçÊêÎîÛûŞşÂâ]/g, '').slice(0, st.length); if (PZ.func[cap]) return { ku: cap, de: PZ.func[cap], form: 'Oblique/Ezafe -' + s }; if (PZ.func[st]) return { ku: st, de: PZ.func[st], form: 'Endung -' + s }; if (DICT.has(st.replace(/ê/, 'a'))) return { ...DICT.get(st.replace(/ê/, 'a')), form: 'Endung -' + s + ', Stammvokal a → ê' }; }
  const raised = k.replace(/ê(?=[^ê]*$)/, 'a'); if (raised !== k && DICT.has(raised)) return { ...DICT.get(raised), form: 'Oblique mit Stammvokal a → ê' };
  if (/^[A-ZÇÊÎÛŞ]/.test(word)) return { ku: word.replace(/[^A-Za-zÇçÊêÎîÛûŞşÂâ]/g, ''), de: 'wahrscheinlich ein Eigenname (Person oder Ort)', form: '' };
  return null;
}
VIEWS.read = () => {
  if (RD.id) return readerText();
  return `<div class="page-head"><div class="eyebrow">Xwendin · Lesen</div><h1>Lesetexte</h1>
    <p>Verständlicher Input ist der stärkste Motor beim Sprachenlernen. Lies Texte knapp über deinem Niveau. Tippe auf ein unbekanntes Wort, um die Bedeutung zu sehen, und lege es in deinen Kartenstapel.</p></div>
  ${LEVELS.map(lv => { const ts = PZ.texts.filter(t => t.lv === lv); if (!ts.length) return ''; return `<section class="stack level"><div class="level-head"><span class="lv-code" style="font-size:1.6rem">${lv}</span><h2>${LEVEL_INFO[lv].de}</h2></div>
    <div class="grid2">${ts.map(t => `<button class="lesson" data-text="${t.id}"><span class="grow"><span class="t">${esc(t.title)}</span><br><span class="s">${esc(t.de)}</span></span>${S.texts[t.id] ? '<span class="pill ok">gelesen</span>' : ''}</button>`).join('')}</div></section>`; }).join('')}`;
};
function readerText() {
  const t = PZ.texts.find(x => x.id === RD.id);
  const wrap = s => esc(s).replace(/([A-Za-zÇçÊêÎîÛûŞşÂâ’'\-]+)/g, m => `<span class="w${S.cards[m.toLowerCase()] ? ' known' : ''}" tabindex="0">${m}</span>`);
  return `<div><button class="btn sm ghost" id="rdBack">← Alle Texte</button></div>
  <div class="page-head"><div class="row"><span class="pill lv">${t.lv}</span>${S.texts[t.id] ? '<span class="pill ok">gelesen</span>' : ''}</div><h1>${esc(t.title)}</h1><p>${esc(t.de)}${t.intro ? ' · ' + esc(t.intro) : ''}</p></div>
  <div class="row">${sayListBtn(t.body.flatMap(splitSent), 'Ganzen Text anhören')}<span class="muted" style="font-size:.88rem">Tippe auf ein Wort: Bedeutung und Aussprache. Der Knopf vor jedem Absatz liest ihn vor.</span></div>
  <article class="card text" lang="ku">${t.body.map(p => `<p>${sayListBtn(splitSent(p), '').replace('btn sm say-all', 'say say-p')} ${wrap(p)}</p>`).join('')}</article>
  <div class="row"><button class="btn" id="rdTr">${RD.tr ? 'Übersetzung verbergen' : 'Übersetzung zeigen'}</button></div>
  ${RD.tr && t.tr ? `<article class="panel text" style="font-size:1rem">${t.tr.map(p => `<p>${esc(p)}</p>`).join('')}</article>` : ''}
  ${t.q?.length ? `<section class="card stack"><h3>Hast du es verstanden?</h3>${t.q.map((q, i) => { const o = shuffle([q[1], ...q[2]]); return `<div class="stack" style="gap:8px"><b>${esc(q[0])}</b><div class="choices" data-qi="${i}">${o.map(x => `<button class="choice" data-ok="${x === q[1] ? 1 : 0}">${esc(x)}</button>`).join('')}</div></div>`; }).join('')}</section>` : ''}
  <div class="row"><button class="btn primary big" id="rdDone">${S.texts[t.id] ? 'Nochmal als gelesen zählen' : 'Als gelesen markieren (+15 XP)'}</button></div>`;
}
const splitSent = p => p.split(/(?<=[.!?…:])\s+/).filter(x => x.trim());
function closePop() { $('.pop')?.remove(); }
VIEWS.read.after = () => {
  $$('[data-text]').forEach(b => b.onclick = () => { RD.id = b.dataset.text; RD.tr = false; route(); });
  if (!RD.id) return;
  $('#rdBack').onclick = () => { RD.id = null; route(); };
  $('#rdTr').onclick = () => { RD.tr = !RD.tr; route(); };
  $$('[data-qi] .choice').forEach(b => b.onclick = () => { const g = b.parentElement; $$('.choice', g).forEach(x => { x.disabled = true; if (x.dataset.ok === '1') x.classList.add('right'); }); if (b.dataset.ok !== '1') b.classList.add('wrong'); });
  $('#rdDone').onclick = () => { const first = !S.texts[RD.id]; S.texts[RD.id] = { read: Date.now() }; addXP(first ? 15 : 5); toast(first ? 'Aferîn! +15 XP' : '+5 XP'); RD.id = null; route(); };
  $$('.w').forEach(w => { const open = e => { e.stopPropagation(); showPop(w); }; w.onclick = open; w.onkeydown = e => { if (e.key === 'Enter') open(e); }; });
};
function showPop(el) {
  closePop();
  const r = lookup(el.textContent), b = el.getBoundingClientRect(), d = document.createElement('div');
  d.className = 'pop'; d.setAttribute('role', 'dialog');
  const key = !r ? null : !r.verb ? r.ku.toLowerCase() : DICT.has(r.ku.toLowerCase()) ? r.ku.toLowerCase() : null;
  const heard = el.textContent;
  d.innerHTML = (canSay(heard) ? `<div class="row" style="gap:8px;margin-bottom:4px">${sayBtn(heard)}<span style="opacity:.8">${esc(heard)}</span></div>` : '') + (r ? `<b>${esc(r.ku)}</b>${r.form ? ` <span style="opacity:.75">(${esc(r.form)})</span>` : ''}<div>${esc(r.de)}</div>${key && !S.cards[key] ? `<button class="btn sm" id="popAdd">In Karteikarten</button>` : key ? '<div style="opacity:.75;font-size:.85rem;margin-top:4px">Schon in deinem Stapel</div>' : ''}`
    : `<b>${esc(el.textContent)}</b><div>Nicht im Wörterbuch. Wahrscheinlich ein Name oder eine gebeugte Form.</div>`);
  if (canSay(heard)) autoSay(heard);
  document.body.append(d);
  const w = d.offsetWidth; let x = Math.min(window.innerWidth - w - 16, Math.max(16, b.left + b.width / 2 - w / 2)); let y = b.bottom + 8; if (y + d.offsetHeight > window.innerHeight - 16) y = b.top - d.offsetHeight - 8;
  d.style.left = x + 'px'; d.style.top = y + 'px';
  $('#popAdd')?.addEventListener('click', e => { e.stopPropagation(); if (!DICT.has(key)) { const t = PZ.texts.find(x => x.id === RD.id); S.custom[key] = { ku: r.ku, de: r.de, lv: t ? t.lv : 'A1' }; DICT.set(key, { ku: r.ku, de: r.de, tip: 'aus einem Lesetext', lesson: null, lv: S.custom[key].lv }); } addCards([r.ku], [r.ku]); save(); closePop(); toast('„' + r.ku + '“ ist jetzt in deinem Stapel'); el.classList.add('known'); });
}
document.addEventListener('click', e => { if (!e.target.closest('.pop')) closePop(); });
window.addEventListener('scroll', closePop, { passive: true });

/* ---------- Ferheng: dictionary ---------- */
let DQ = { q: '', lv: '' };
VIEWS.dict = () => `<div class="page-head"><div class="eyebrow">Ferheng · Wörterbuch</div><h1>Alle Wörter des Kurses</h1><p>${DICT.size} Einträge, in beide Richtungen durchsuchbar. Mit + legst du ein Wort sofort in deinen Kartenstapel.</p></div>
  <div class="search"><input class="inp" id="dq" placeholder="Suche: z. B. mal, Haus, xwarin …" value="${esc(DQ.q)}" autocomplete="off" aria-label="Suchen">
  <select class="inp" id="dlv" aria-label="Niveau"><option value="">Alle Niveaus</option>${LEVELS.map(l => `<option ${DQ.lv === l ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
  ${keysHTML('dq')}
  <div class="list card" id="dlist" style="padding:6px 16px"></div>`;
VIEWS.dict.after = () => {
  const draw = () => {
    const q = flat(DQ.q); let rows = [...DICT.values()].filter(w => (!DQ.lv || w.lv === DQ.lv) && (!q || flat(w.ku).includes(q) || flat(w.de).includes(q)));
    rows.sort((a, b) => (q ? (flat(a.ku).startsWith(q) ? 0 : 1) - (flat(b.ku).startsWith(q) ? 0 : 1) : 0) || a.ku.localeCompare(b.ku, 'ku'));
    const n = rows.length; rows = rows.slice(0, 250);
    $('#dlist').innerHTML = rows.length ? rows.map(w => `<div class="it">${sayBtn(w.ku)}<span class="k">${esc(w.ku)}</span><span class="grow">${esc(w.de)}${w.tip ? `<br><span class="muted" style="font-size:.85rem">${esc(w.tip)}</span>` : ''}</span><span class="pill lv">${w.lv}</span>${S.cards[w.ku.toLowerCase()] ? '<span class="pill ok">im Stapel</span>' : `<button class="btn sm" data-add="${esc(w.ku)}" aria-label="${esc(w.ku)} hinzufügen">+</button>`}</div>`).join('') + (n > 250 ? `<p class="muted" style="padding:10px 0">${n - 250} weitere Treffer. Verfeinere die Suche.</p>` : '') : '<p class="muted" style="padding:12px 0">Keine Treffer.</p>';
  };
  $('#dq').addEventListener('input', e => { DQ.q = e.target.value; draw(); });
  $('#dlv').onchange = e => { DQ.lv = e.target.value; draw(); };
  $('#dlist').addEventListener('click', e => { const b = e.target.closest('[data-add]'); if (!b) return; addCards([b.dataset.add], [b.dataset.add]); save(); toast('Hinzugefügt: ' + b.dataset.add); draw(); });
  draw();
};

/* ---------- Rêziman: grammar reference ---------- */
VIEWS.grammar = () => `<div class="page-head"><div class="eyebrow">Rêziman · Grammatik</div><h1>Nachschlagen</h1><p>Alle Kernregeln auf einen Blick. Ideal, um vor einer Lektion etwas aufzufrischen.</p></div>
  <nav class="row" aria-label="Inhalt">${PZ.ref.map(r => `<a class="pill" href="#grammar" data-goto="${r.id}">${esc(r.title)}</a>`).join('')}</nav>
  ${PZ.ref.map(r => `<section class="card stack" id="g-${r.id}"><div class="row"><h2 class="grow">${esc(r.title)}</h2>${r.lv ? `<span class="pill lv">${r.lv}</span>` : ''}</div><div class="theory">${r.html}</div></section>`).join('')}`;
VIEWS.grammar.after = () => $$('[data-goto]').forEach(a => a.onclick = e => { e.preventDefault(); document.getElementById('g-' + a.dataset.goto)?.scrollIntoView({ behavior: 'smooth' }); });

/* ---------- Rêbaz: method ---------- */
VIEWS.method = () => `<div class="page-head"><div class="eyebrow">Rêbaz · Lernmethode</div><h1>So lernst du schnell und nachhaltig</h1><p>Diese Techniken stecken in der App. Hier steht, warum sie wirken und wie du sie auch außerhalb nutzt.</p></div>${PZ.method}`;

/* ---------- Profîl: settings & save ---------- */
let RESET = false;
VIEWS.profile = () => `<div class="page-head"><div class="eyebrow">Profîl · Speicherstand</div><h1>Dein Fortschritt</h1>
  <p>Alles wird automatisch in diesem Browser auf deinem Rechner gespeichert${cloud.ok ? ' und zusätzlich mit deinem Konto synchronisiert' : ''}. Lade zur Sicherheit ab und zu eine Sicherungsdatei herunter.</p></div>
  <div class="stats"><div class="stat"><b>${S.xp}</b><small>XP</small></div><div class="stat"><b>${Object.keys(S.lessons).length}/${PZ.lessons.length}</b><small>Lektionen</small></div><div class="stat"><b>${Object.keys(S.cards).length}</b><small>Karten</small></div><div class="stat"><b>${streak()}</b><small>Tage in Folge</small></div></div>
  <section class="card stack"><h2>Einstellungen</h2>
    <label class="stack" style="gap:6px"><span class="eyebrow">Dein Name</span><input class="inp" id="pfName" value="${esc(S.name)}" placeholder="z. B. Rojda" maxlength="30" style="max-width:340px"></label>
    <div class="stack" style="gap:6px"><span class="eyebrow">Tagesziel</span><div class="seg" role="group" aria-label="Tagesziel">${[[10, 'Locker'], [30, 'Normal'], [50, 'Ernsthaft'], [100, 'Intensiv']].map(([n, l]) => `<button data-goal="${n}" aria-pressed="${S.goal === n}">${l} · ${n} XP</button>`).join('')}</div></div>
    <div class="stack" style="gap:6px"><span class="eyebrow">Darstellung</span><div class="seg" role="group" aria-label="Darstellung">${[['auto', 'System'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([k, l]) => `<button data-th="${k}" aria-pressed="${S.theme === k}">${l}</button>`).join('')}</div></div>
    <label class="row" style="font-size:.95rem"><input type="checkbox" id="pfFree" ${S.free ? 'checked' : ''}> Freier Modus: alle Lektionen sofort öffnen (ohne Reihenfolge)</label>
  </section>
  <section class="card stack"><h2>Aussprache</h2>
    <div class="row">${sayBtn('Silav! Tu çawa yî? Ez baş im, spas.', 'lg', 'Beispiel anhören')}<span class="muted">Beispiel: „Silav! Tu çawa yî? Ez baş im, spas.“</span></div>
    <div class="stack" style="gap:6px"><span class="eyebrow">Sprechtempo</span><div class="seg" role="group" aria-label="Sprechtempo">${[[1, 'Normal'], [.75, 'Ruhig'], [.55, 'Langsam']].map(([r, l]) => `<button data-rate="${r}" aria-pressed="${(S.rate || 1) === r}">${l}</button>`).join('')}</div></div>
    <label class="row" style="font-size:.95rem"><input type="checkbox" id="pfAuto" ${S.autoplay !== false ? 'checked' : ''}> Kurdische Wörter in Übungen und Karteikarten automatisch vorlesen</label>
    <p class="muted" style="font-size:.88rem">Die Aufnahmen stammen von einer neuronalen Kurmancî-Stimme: dem frei verfügbaren Sprachmodell MMS-TTS von Meta (Lizenz CC BY-NC 4.0, nur für nicht-kommerzielle Nutzung). Sie wurde mit gesprochenen Kurmancî-Texten trainiert und klingt natürlich, ist aber eine einzelne, eher neutrale Stimme ohne die Färbung von Amed. Echte Sprecher aus der Region hörst du in der Sammlung „The Dialects of Kurdish“ (Link unter Rêbaz). Die Lautschrift im Aussprache-Trainer erzeugt eSpeak NG.</p>
  </section>
  <section class="card stack"><h2>Sichern &amp; Wiederherstellen</h2>
    <p class="muted">Die Sicherungsdatei enthält deinen kompletten Lernstand. Damit kannst du auf einen anderen Rechner oder Browser umziehen.</p>
    <div class="row"><button class="btn primary" id="pfExport">Sicherungsdatei herunterladen</button><button class="btn" id="pfImport">Sicherungsdatei laden</button><button class="btn ghost" id="pfCopy">Als Text kopieren</button></div>
    <div id="pfOut"></div>
    <details><summary class="muted" style="cursor:pointer">Sicherung als Text einfügen</summary><div class="stack" style="margin-top:10px"><textarea class="inp" id="pfPaste" placeholder="Hier den Sicherungstext einfügen …" aria-label="Sicherungstext"></textarea><div><button class="btn sm" id="pfPasteGo">Wiederherstellen</button></div></div></details>
  </section>
  <section class="stack"><h2>Serkeftin · Abzeichen</h2><div class="badges">${BADGES.map(b => `<div class="badge ${S.badges[b[0]] ? 'got' : ''}"><span class="ic">${S.badges[b[0]] ? '✓' : '·'}</span><span><b>${esc(b[1])}</b><small>${esc(b[2])}</small></span></div>`).join('')}</div></section>
  <section class="card stack"><h2>Neu anfangen</h2><p class="muted">Löscht deinen gesamten Lernstand in diesem Browser${cloud.ok ? ' und im Konto' : ''}.</p>
    <div class="row">${RESET ? `<b style="color:var(--bad)">Wirklich alles löschen?</b><button class="btn" id="pfResetYes" style="border-color:var(--bad);color:var(--bad)">Ja, alles löschen</button><button class="btn ghost" id="pfResetNo">Abbrechen</button>` : `<button class="btn" id="pfReset">Fortschritt zurücksetzen</button>`}</div></section>`;
function restore(txt) {
  try { const d = JSON.parse(txt); if (!d || d.v !== 1 || typeof d.cards !== 'object') throw 0; S = merge(fresh(), d); save(); buildDict(); applyTheme(); toast('Lernstand wiederhergestellt'); route(); }
  catch (e) { toast('Die Datei ist keine gültige Pira-Ziman-Sicherung.'); }
}
VIEWS.profile.after = () => {
  $('#pfName').addEventListener('change', e => { S.name = e.target.value.trim(); save(); toast('Gespeichert'); });
  $$('[data-goal]').forEach(b => b.onclick = () => { S.goal = +b.dataset.goal; save(); route(); });
  $$('[data-th]').forEach(b => b.onclick = () => { S.theme = b.dataset.th; applyTheme(); save(); route(); });
  $('#pfFree').onchange = e => { S.free = e.target.checked; save(); };
  $('#pfAuto').onchange = e => { S.autoplay = e.target.checked; save(); };
  $$('[data-rate]').forEach(b => b.onclick = () => { S.rate = +b.dataset.rate; save(); route(); });
  const json = () => JSON.stringify(S);
  const fname = 'pira-ziman-sicherung-' + dkey() + '.json';
  $('#pfExport').onclick = async () => {
    let dl = null; try { dl = window.claude?.use ? await window.claude.use('downloads') : null; } catch (e) { }
    if (dl) { try { await dl.save({ filename: fname, data: json() }); toast('Sicherung gespeichert'); return; } catch (e) { if (e?.code === 'declined') return; } }
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json()], { type: 'application/json' })); a.download = fname; document.body.append(a); a.click(); a.remove(); } catch (e) { }
    $('#pfOut').innerHTML = `<p class="muted" style="font-size:.88rem">Falls kein Download startet: Kopiere diesen Text und speichere ihn in einer Datei.</p><textarea class="inp" readonly aria-label="Sicherung">${esc(json())}</textarea>`;
  };
  $('#pfCopy').onclick = async () => { try { await navigator.clipboard.writeText(json()); toast('Sicherung kopiert'); } catch (e) { $('#pfOut').innerHTML = `<textarea class="inp" readonly aria-label="Sicherung">${esc(json())}</textarea>`; $('#pfOut textarea').select(); } };
  $('#pfImport').onclick = () => $('#importFile').click();
  $('#importFile').onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => restore(r.result); r.readAsText(f); e.target.value = ''; };
  $('#pfPasteGo').onclick = () => restore($('#pfPaste').value);
  if ($('#pfReset')) $('#pfReset').onclick = () => { RESET = true; route(); };
  if ($('#pfResetNo')) $('#pfResetNo').onclick = () => { RESET = false; route(); };
  if ($('#pfResetYes')) $('#pfResetYes').onclick = () => { RESET = false; const keep = { name: S.name, theme: S.theme }; S = { ...fresh(), ...keep }; save(); if (cloud.ref) pushCloud(); toast('Neu gestartet. Serkeftin!'); route(); };
};
