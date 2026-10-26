/* ===== Pira Ziman · verb engine & trainer ===== */
const PRON = ['ez', 'tu', 'ew', 'ew', 'em', 'hûn', 'ew'];
const OBL = ['min', 'te', 'wî', 'wê', 'me', 'we', 'wan'];
const DE_P = ['ich', 'du', 'er', 'sie (Sg.)', 'wir', 'ihr', 'sie (Pl.)'];
const FUTP = ['ê', 'yê', 'ê', 'ê', 'ê', 'ê', 'ê'];
const SLOT = [0, 1, 2, 2, 3, 4, 5];
const isV = s => /[aeêiîouû]$/.test(s);
const TENSES = {
  prs: ['Präsens', 'A1'], neg: ['Präsens verneint', 'A1'], imp: ['Imperativ', 'A2'], sub: ['Subjunktiv', 'A2'], fut: ['Futur', 'A2'],
  pst: ['Vergangenheit', 'A2'], prog: ['Verlaufsform Vergangenheit', 'B1'], prf: ['Perfekt', 'B1'], plp: ['Plusquamperfekt', 'B1'], erg: ['Ergativ mit Objekt', 'B1']
};
/* a "form" is [prefix, stem, ending]; returned per slot 0..5 */
function presEnd(stem, s) {
  if (!isV(stem)) return ['im', 'î', 'e', 'in', 'in', 'in'][s];
  if (/î$/.test(stem)) return ['m', '', '', 'n', 'n', 'n'][s];
  return ['m', 'yî', '', 'n', 'n', 'n'][s];
}
function pastEnd(stem, s) {
  if (!isV(stem)) return ['im', 'î', '', 'in', 'in', 'in'][s];
  if (/î$/.test(stem)) return ['m', '', '', 'n', 'n', 'n'][s];
  return ['m', 'yî', '', 'n', 'n', 'n'][s];
}
function full(v) { // resolve light verbs onto base verb
  if (!v.base) return v;
  const b = PZ.verbs.find(x => x.inf === v.base); return { ...b, ...v, lvn: v.lvn };
}
function vForms(v0, tense) {
  const v = full(v0), pv = v.pv || '';
  const out = [];
  for (let s = 0; s < 6; s++) {
    let f;
    switch (tense) {
      case 'prs': f = v.prs ? ['', v.prs[s], ''] : [pv + 'di', v.pr, presEnd(v.pr, s)]; break;
      case 'neg': f = v.negs ? ['', v.negs[s], ''] : [pv + (v.ng || 'na'), v.pr, presEnd(v.pr, s)]; break;
      case 'sub': { const st = v.sb ? v.sb : (pv ? pv : 'bi') + v.pr; const k = v.sb ? '' : (pv || 'bi'); f = [k, st.slice(k.length), presEnd(st, s)]; break; }
      case 'pst': f = [pv, v.pa, v.tr ? '' : pastEnd(v.pa, s)]; break;
      case 'prog': f = [pv + 'di', v.pa, v.tr ? '' : pastEnd(v.pa, s)]; break;
      case 'prf': { const base = /î$/.test(v.pa) ? v.pa.slice(0, -1) + 'i' : v.pa; const e = isV(v.pa) && !/î$/.test(v.pa) ? ['me', 'yî', 'ye', 'ne', 'ne', 'ne'] : ['me', 'yî', 'ye', 'ne', 'ne', 'ne'];
        const stem = isV(base) ? base : base + 'i'; f = [pv, stem, v.tr ? 'ye' : e[s]]; break; }
      case 'plp': f = [pv, v.pa + (isV(v.pa) ? '' : 'i'), v.tr ? 'bû' : ['bûm', 'bûyî', 'bû', 'bûn', 'bûn', 'bûn'][s]]; break;
    }
    out.push(f);
  }
  return out;
}
const ftxt = f => f.join('');
const fhtml = f => `<span class="m-pre">${esc(f[0])}</span>${esc(f[1])}<span class="m-end">${esc(f[2])}</span>`;
const lvPre = v => v.lvn ? v.lvn + ' ' : '';
const lvPreH = v => v.lvn ? esc(v.lvn) + ' ' : '';
function canTense(v0, t) {
  const v = full(v0);
  if (t === 'erg') return !!v.tr && !v.lvn;
  if (t === 'neg' && v.noNeg) return false;
  if (t === 'imp') return !v.noImp;
  if ((t === 'prf') && !v.tr && /î$/.test(v.pa)) return false;
  return true;
}
/* phrase for person p (0..6) */
function phrase(v0, t, p, o) {
  const v = full(v0), s = SLOT[p];
  if (t === 'imp') { const r = impForms(v); return lvPre(v) + (p === 1 ? r[0] : r[1]); }
  if (t === 'erg') { const os = SLOT[o]; const f = [v.pv || '', v.pa, pastEnd(v.pa, os)]; return OBL[p] + ' ' + PRON[o] + ' ' + ftxt(f); }
  if (t === 'fut') { return PRON[p] + ' ' + FUTP[p] + ' ' + lvPre(v) + ftxt(vForms(v, 'sub')[s]); }
  const f = vForms(v, t)[s];
  const subj = (v.tr && ['pst', 'prog', 'prf', 'plp'].includes(t)) ? OBL[p] : PRON[p];
  return subj + ' ' + lvPre(v) + ftxt(f);
}
function impForms(v) {
  if (v.imp) return v.imp;
  const pv = v.pv || '', st = v.sb || (pv || 'bi') + v.pr;
  return isV(st) ? [st, st + 'n'] : [st + 'e', st + 'in'];
}
function phraseHTML(v0, t, p, o) {
  const v = full(v0), s = SLOT[p];
  if (t === 'imp') return lvPreH(v) + `<span class="m-pre">${esc(impForms(v)[p === 1 ? 0 : 1])}</span>`;
  if (t === 'erg') { const os = SLOT[o]; return `<span class="m-erg">${OBL[p]}</span> ${PRON[o]} ${fhtml([v.pv || '', v.pa, pastEnd(v.pa, os)])}`; }
  if (t === 'fut') return `${PRON[p]} <span class="m-erg">${FUTP[p]}</span> ${lvPreH(v)}${fhtml(vForms(v, 'sub')[s])}`;
  const f = vForms(v, t)[s], erg = v.tr && ['pst', 'prog', 'prf', 'plp'].includes(t);
  return `${erg ? `<span class="m-erg">${OBL[p]}</span>` : PRON[p]} ${lvPreH(v)}${fhtml(f)}`;
}
function answers(v, t, p, o) {
  const a = phrase(v, t, p, o), alts = [a];
  if (t === 'fut') alts.push(a.replace(/^(\S+) (y?ê) /, '$1$2 '), a.replace(/ y?ê /, ' dê '));
  const fv = full(v);
  if (SLOT[p] === 1 && ((/î$/.test(fv.pr || '') && ['prs', 'neg'].includes(t)) || (!fv.tr && /î$/.test(fv.pa || '') && ['pst', 'prog'].includes(t)))) alts.push(a + 'yî', a.replace(/î$/, 'iyî'));
  if (fv.alt && fv.alt[t]) alts.push(...fv.alt[t].map(x => x.replace('*', PRON[p])));
  return alts;
}

/* reverse index: conjugated form -> verb, tense, person (for the reader) */
const VFORM = new Map();
function buildVForms() {
  VFORM.clear();
  for (const v of PZ.verbs) {
    if (v.lvn) continue;
    for (const t of ['prs', 'neg', 'sub', 'pst', 'prog', 'prf', 'plp']) {
      if (!canTense(v, t)) continue;
      vForms(v, t).forEach((f, s) => { const k = ftxt(f).toLowerCase(); if (!VFORM.has(k)) VFORM.set(k, { v, t, s }); });
    }
    impForms(full(v)).forEach(f => { if (!VFORM.has(f)) VFORM.set(f, { v, t: 'imp', s: 1 }); });
    const pv = v.pv || '', add = (k, o) => { k = k.toLowerCase(); if (!VFORM.has(k)) VFORM.set(k, { v, ...o }); };
    for (let s = 0; s < 6; s++) { const e = presEnd(v.pr, s); add(pv + 'ne' + v.pr + e, { t: 'sub', s, neg: true }); if (v.sb && !pv) add('bi' + v.pr + e, { t: 'sub', s }); }
    if (v.tr) { add(pv + v.pa + (isV(v.pa) ? 'n' : 'in'), { t: 'pst', s: 3, pl: true }); add(pv + 'di' + v.pa + (isV(v.pa) ? 'n' : 'in'), { t: 'prog', s: 3, pl: true }); add(pv + 'ne' + v.pa, { t: 'pst', s: 2, neg: true }); add(pv + 'nedi' + v.pa, { t: 'prog', s: 2, neg: true }); }
    else for (let s = 0; s < 6; s++) { add(pv + 'ne' + v.pa + pastEnd(v.pa, s), { t: 'pst', s, neg: true }); add(pv + 'nedi' + v.pa + pastEnd(v.pa, s), { t: 'prog', s, neg: true }); }
  }
}

/* ---------- trainer view ---------- */
let VT = { tenses: null, verb: null, cur: null, shown: false, onlyCore: false };
function vtDefaults() { const lv = LEVELS.indexOf(currentLevel()); return Object.keys(TENSES).filter(t => LEVELS.indexOf(TENSES[t][1]) <= Math.max(lv, 0)); }
function vtNew() {
  const ts = VT.tenses.length ? VT.tenses : ['prs'];
  for (let n = 0; n < 50; n++) {
    const t = ts[Math.floor(Math.random() * ts.length)];
    const pool = PZ.verbs.filter(v => !v.noDrill && canTense(v, t) && (!VT.onlyCore || v.core));
    const v = pool[Math.floor(Math.random() * pool.length)]; if (!v) continue;
    let p = Math.floor(Math.random() * 7), o = null;
    if (t === 'imp') p = Math.random() < .6 ? 1 : 5;
    if (t === 'erg') { const grp = i => i <= 0 ? 'a' : i === 1 ? 'b' : i <= 3 ? 'c' : i === 4 ? 'a' : i === 5 ? 'b' : 'c'; do { o = Math.floor(Math.random() * 7); } while (grp(o) === grp(p) && grp(p) !== 'c' || o === p); }
    VT.cur = { v, t, p, o }; return;
  }
}
VIEWS.verbs = () => {
  if (!VT.tenses) VT.tenses = vtDefaults();
  if (!VT.cur) vtNew();
  const sel = VT.verb ? PZ.verbs.find(v => v.inf === VT.verb) : PZ.verbs[0];
  return `<div class="page-head"><div class="eyebrow">Lêker · Verbtrainer</div><h1>Verben konjugieren</h1>
    <p>Kurmancî-Verben haben zwei Stämme: einen Präsensstamm (<span class="mono">bêj</span>) und einen Vergangenheitsstamm (<span class="mono">got</span>). Die Farben zeigen den Bau: <span class="m-pre">Vorsilbe</span>, Stamm, <span class="m-end">Endung</span>, <span class="m-erg">Ergativ-Pronomen / Futurteilchen</span>.</p></div>
  <section class="card stack">
    <div class="eyebrow">Zeiten im Training</div>
    <div class="seg" role="group" aria-label="Zeiten">${Object.entries(TENSES).map(([k, [n, lv]]) => `<button aria-pressed="${VT.tenses.includes(k)}" data-vt="${k}">${n} <span class="muted" style="font-size:.72rem">${lv}</span></button>`).join('')}</div>
    <label class="row" style="font-size:.9rem"><input type="checkbox" id="vtCore" ${VT.onlyCore ? 'checked' : ''}> Nur die 20 wichtigsten Verben</label>
  </section>
  <section class="card stack" id="vtCard"></section>
  <section class="stack">
    <div class="row"><h2 class="grow">Konjugationstabelle</h2>
      <select class="inp" id="vtSel" aria-label="Verb wählen">${PZ.verbs.map(v => `<option value="${esc(v.inf)}" ${sel.inf === v.inf ? 'selected' : ''}>${esc(v.inf)} – ${esc(v.de)}</option>`).join('')}</select></div>
    <div id="vtTable"></div>
  </section>`;
};
VIEWS.verbs.after = () => {
  $$('[data-vt]').forEach(b => b.onclick = () => { const k = b.dataset.vt; VT.tenses = VT.tenses.includes(k) ? VT.tenses.filter(x => x !== k) : [...VT.tenses, k]; b.setAttribute('aria-pressed', VT.tenses.includes(k)); vtNew(); vtCard(); });
  $('#vtCore').onchange = e => { VT.onlyCore = e.target.checked; vtNew(); vtCard(); };
  $('#vtSel').onchange = e => { VT.verb = e.target.value; vtTable(); };
  vtCard(); vtTable();
};
function vtCard() {
  const c = VT.cur, v = full(c.v), el = $('#vtCard'); if (!el) return;
  const who = c.t === 'erg' ? `${DE_P[c.p]} → ${DE_P[c.o]}` : DE_P[c.p];
  el.innerHTML = `<div class="row"><span class="pill lv">${TENSES[c.t][0]}</span><span class="pill">${v.tr ? 'transitiv' : 'intransitiv'}</span><span class="muted" style="font-size:.85rem;margin-left:auto">${S.verbs.ok} richtig von ${S.verbs.n}</span></div>
    <div class="row"><div class="prompt"><span class="ku">${esc(v.inf)}</span> <span class="muted" style="font-weight:500">· ${esc(v.de)}</span></div>${sayBtn(v.inf)}</div>
    <p>Person: <b>${who}</b>${c.t === 'erg' ? ' <span class="muted">(z. B. „ich sah dich“)</span>' : ''} · Präsensstamm <span class="mono">${esc(v.pv || '')}${esc(v.pr)}</span> · Vergangenheitsstamm <span class="mono">${esc(v.pv || '')}${esc(v.pa)}</span></p>
    <p class="muted" style="font-size:.88rem">Schreib die ganze Form mit Pronomen, z. B. <span class="mono">${c.t === 'fut' ? 'ez ê biçim' : c.t === 'erg' ? 'min tu dîtî' : c.t === 'imp' ? 'bixwe' : v.tr && ['pst', 'prog', 'prf', 'plp'].includes(c.t) ? 'min xwar' : 'ez dixwim'}</span>.</p>
    <input class="inp" id="vtInp" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Verbform">${keysHTML('vtInp')}
    <div id="vtFb"></div>
    <div class="row"><button class="btn primary" id="vtCheck">Prüfen</button><button class="btn ghost" id="vtSkip">Andere Form</button></div>`;
  const inp = $('#vtInp');
  const go = () => {
    if ($('#vtCheck').dataset.next) { vtNew(); vtCard(); $('#vtInp').focus(); return; }
    const r = check(inp.value, answers(c.v, c.t, c.p, c.o)); S.verbs.n++;
    const good = r !== 'bad'; if (good) S.verbs.ok++;
    addXP(good ? 2 : 0);
    $('#vtFb').innerHTML = `<div class="panel" style="background:${good ? 'var(--ok-soft)' : 'var(--bad-soft)'}"><b style="color:${good ? 'var(--ok)' : 'var(--bad)'}">${r === 'ok' ? 'Rast e!' : r === 'near' ? 'Fast, achte auf die Sonderzeichen' : 'Nicht ganz'}</b><div class="row" style="margin-top:4px"><div class="conj" style="font-size:1.1rem">${phraseHTML(c.v, c.t, c.p, c.o)}</div>${sayBtn(phrase(c.v, c.t, c.p, c.o))}</div>${tenseNote(c.t, v)}</div>`; autoSay(phrase(c.v, c.t, c.p, c.o));
    $('#vtCheck').textContent = 'Nächste'; $('#vtCheck').dataset.next = '1';
  };
  $('#vtCheck').onclick = go; $('#vtSkip').onclick = () => { vtNew(); vtCard(); };
  inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
}
function tenseNote(t, v) {
  const n = {
    prs: 'Präsens: <b>di</b> + Präsensstamm + Personalendung.',
    neg: 'Verneinung im Präsens: <b>na</b> ersetzt di (bei zanîn und karîn: <b>ni</b>).',
    sub: 'Subjunktiv: <b>bi</b> + Präsensstamm. Bei Verben mit Vorsilbe (ra-, ve-, der-) fällt bi meist weg.',
    fut: 'Futur: Pronomen + <b>ê</b> (nach tu: yê) + Subjunktiv. Umgangssprachlich oft zusammengeschrieben: ezê, tuyê.',
    imp: 'Imperativ: bi + Präsensstamm + <b>-e</b> (Singular) / <b>-in</b> (Plural).',
    pst: v.tr ? 'Transitiv in der Vergangenheit = Ergativ: das Subjekt steht im <b>Oblique</b> (min, te, wî/wê …), das Verb richtet sich nach dem Objekt.' : 'Intransitiv: Vergangenheitsstamm + Endung, Subjekt im Direktfall (ez, tu …).',
    prog: 'Verlaufsform: <b>di</b> + Vergangenheitsstamm. Transitive Verben bleiben ergativ.',
    prf: 'Perfekt: Vergangenheitsstamm + <b>-iye / -ime</b> … (nach Vokal ohne i).',
    plp: 'Plusquamperfekt: Vergangenheitsstamm + <b>(i)bû</b> + Endung.',
    erg: 'Das Verb stimmt mit dem <b>Objekt</b> überein: min tu dît<b>î</b> (ich sah dich), te ez dît<b>im</b> (du sahst mich).'
  }[t];
  return `<p class="muted" style="font-size:.88rem;margin-top:6px">${n}</p>`;
}
function vtTable() {
  const v = PZ.verbs.find(x => x.inf === (VT.verb || PZ.verbs[0].inf)), el = $('#vtTable'); if (!el || !v) return;
  const fv = full(v);
  const ts = ['prs', 'neg', 'sub', 'fut', 'pst', 'prog', 'prf', 'plp'].filter(t => canTense(v, t));
  el.innerHTML = `<p class="muted" style="margin-bottom:8px">${esc(v.inf)} · ${esc(v.de)} · ${fv.tr ? 'transitiv (Ergativ in der Vergangenheit)' : 'intransitiv'}${v.note ? ' · ' + esc(v.note) : ''}</p>
  <div class="tbl"><table><thead><tr><th>Person</th>${ts.map(t => `<th>${TENSES[t][0]}</th>`).join('')}</tr></thead><tbody>
  ${[0, 1, 2, 4, 5, 6].map(p => `<tr><td class="muted">${DE_P[p]}</td>${ts.map(t => `<td class="conj">${phraseHTML(v, t, p)}</td>`).join('')}</tr>`).join('')}
  </tbody></table></div>
  <p class="muted" style="font-size:.88rem">Imperativ: <span class="conj">${phraseHTML(v, 'imp', 1)}</span> (du) · <span class="conj">${phraseHTML(v, 'imp', 5)}</span> (ihr) · Tippe auf eine Form, um sie zu hören.</p>`;
  enhanceSay(el);
}
