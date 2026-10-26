/* ===== Pira Ziman · core: state, storage, SRS, router, dashboard ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n) => shuffle(a).slice(0, n);
const DAY = 864e5;
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LEVEL_INFO = {
  A1: { ku: 'Destpêk', de: 'Einstieg', desc: 'Grüßen, vorstellen, Familie, Zahlen, Essen, Präsens, Orte, Einkaufen.' },
  A2: { ku: 'Bingeh', de: 'Grundlagen', desc: 'Oblique-Fall, Imperativ, Zukunft, Vergangenheit (intransitiv), Reisen, Modalverben.' },
  B1: { ku: 'Navîn', de: 'Mittelstufe', desc: 'Ergativ, Perfekt, Plusquamperfekt, Relativ- und Nebensätze, Präverbien, Erzählen.' },
  B2: { ku: 'Pêşketî', de: 'Fortgeschritten', desc: 'Passiv, Kausativ, Konditional, indirekte Rede, Wortbildung, Umgangssprache.' },
  C1: { ku: 'Zimanzan', de: 'Sprachtalent', desc: 'Diskurs, Argumentation, Literatur, Nominalstil, Dengbêjî, regionale Feinheiten.' },
  C2: { ku: 'Hostatî', de: 'Meisterschaft', desc: 'Alle Dialekte verstehen, feste Formeln, klassische Dichtung, Humor, Übersetzen, Fachsprache, feinste Grammatik, Sprechen wie Muttersprachler.' }
};

/* ---------- normalisation & answer checking ---------- */
const DIA = { 'ê': 'e', 'î': 'i', 'û': 'u', 'ç': 'c', 'ş': 's', 'â': 'a', 'é': 'e', 'ı': 'i', 'ğ': 'g', 'ö': 'o', 'ü': 'u', 'ä': 'a' };
const norm = s => String(s).toLowerCase().replace(/[’'`´]/g, '').replace(/[.,!?;:¿¡"“”„()\-–—…]/g, ' ').replace(/\s+/g, ' ').trim();
const flat = s => norm(s).replace(/[êîûçşâéığöüä]/g, c => DIA[c]);
function check(given, targets) {
  const g = norm(given), gf = flat(given);
  const ts = (Array.isArray(targets) ? targets : [targets]).flatMap(t => String(t).split('|'));
  if (ts.some(t => norm(t) === g)) return 'ok';
  if (ts.some(t => flat(t) === gf)) return 'near';
  return 'bad';
}

/* ---------- state ---------- */
const KEY = 'piraziman.v1';
const fresh = () => ({
  v: 1, name: '', goal: 30, theme: 'auto', free: false, rate: 1, autoplay: true, created: Date.now(), updatedAt: 0,
  xp: 0, days: {}, lessons: {}, levels: {}, cards: {}, texts: {}, verbs: { n: 0, ok: 0 }, badges: {}, reviews: 0, custom: {}, pron: { n: 0, best: {}, quiz: {} }, game: null
});
let S = fresh();
function merge(base, src) { const o = { ...base, ...src }; for (const k of ['days', 'lessons', 'levels', 'cards', 'texts', 'verbs', 'badges', 'custom', 'pron']) o[k] = { ...base[k], ...(src[k] || {}) };
  if (src.game) o.game = { ...src.game, frozen: { ...(src.game.frozen || {}) } }; return o; }
function loadLocal() { try { const raw = localStorage.getItem(KEY); if (raw) S = merge(fresh(), JSON.parse(raw)); } catch (e) { /* storage blocked: run in memory */ } }
let cloudTimer = null;
function save(push = true) {
  S.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
  if (push && cloud.ref) { clearTimeout(cloudTimer); cloudTimer = setTimeout(pushCloud, 2500); }
}
const cloud = { ref: null, ok: false, last: 0 };
async function pushCloud() {
  if (!cloud.ref) return;
  try { await cloud.ref.set({ json: JSON.stringify(S), updatedAt: S.updatedAt }); cloud.last = Date.now(); cloud.ok = true; }
  catch (e) { cloud.ok = false; }
  renderSideFoot();
}
async function initCloud() {
  try {
    const c = window.claude; if (!c || !c.use) return;
    const [db, user] = await Promise.all([c.use('db'), c.use('user')]);
    if (!db || !user) return;
    const id = await user.id(); if (!id) return;
    cloud.ref = db.doc('data/users/' + id + '/save');
    const snap = await cloud.ref.get();
    const d = snap.exists ? snap.data() : null;
    if (d && d.json && (d.updatedAt || 0) > (S.updatedAt || 0)) {
      S = merge(fresh(), JSON.parse(d.json)); save(false); buildDict(); applyTheme(); route(); toast('Fortschritt aus deinem Konto geladen');
    } else if (S.updatedAt && (!d || S.updatedAt > (d.updatedAt || 0))) await pushCloud();
    cloud.ok = true; renderSideFoot();
  } catch (e) { cloud.ok = false; }
}

/* ---------- days, xp, streak ---------- */
const dkey = (t = Date.now()) => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const todayXP = () => S.days[dkey()] || 0;
function streak() {
  let n = 0, t = Date.now();
  if (!S.days[dkey(t)]) t -= DAY;
  const fr = (S.game && S.game.frozen) || {};
  while (S.days[dkey(t)] || fr[dkey(t)]) { n++; t -= DAY; }
  return n;
}
function addXP(n) { S.xp += n; S.days[dkey()] = (S.days[dkey()] || 0) + n; checkBadges(); save(); }

/* ---------- dictionary & SRS ---------- */
const DICT = new Map();   // lower(ku) -> {ku, de, tip, lesson, lv}
function buildDict() {
  DICT.clear();
  for (const l of PZ.lessons) for (const v of l.vocab || []) { const k = v[0].toLowerCase(); if (!DICT.has(k)) DICT.set(k, { ku: v[0], de: v[1], tip: v[2] || '', lesson: l.id, lv: l.lv }); }
  for (const [k, w] of Object.entries(S.custom || {})) if (!DICT.has(k)) DICT.set(k, { ku: w.ku, de: w.de, tip: 'aus einem Lesetext', lesson: null, lv: w.lv });
}
function addCards(words, dueNow = []) {
  const now = Date.now();
  for (const w of words) { const k = w.toLowerCase(); if (!S.cards[k]) S.cards[k] = { d: now + 20 * 3600e3, i: 1, e: 2.5, r: 1, l: 0 }; }
  for (const w of dueNow) { const c = S.cards[w.toLowerCase()]; if (c) { c.d = now; c.r = 0; c.i = 0; } }
}
const dueCards = () => { const now = Date.now(); return Object.entries(S.cards).filter(([k, c]) => c.d <= now && DICT.has(k)).sort((a, b) => a[1].d - b[1].d).map(e => e[0]); };
function grade(k, q) { // q: 0 again, 1 hard, 2 good, 3 easy
  const c = S.cards[k]; if (!c) return; const now = Date.now();
  if (q === 0) { c.r = 0; c.l++; c.i = 0; c.e = Math.max(1.3, c.e - .2); c.d = now + 10 * 60e3; }
  else {
    if (c.r === 0) c.i = q === 3 ? 4 : 1;
    else if (c.r === 1) c.i = q === 1 ? 3 : q === 2 ? 4 : 7;
    else c.i = Math.max(c.i + 1, Math.round(c.i * (q === 1 ? 1.2 : q === 2 ? c.e : c.e * 1.35)));
    c.e = Math.min(3.2, Math.max(1.3, c.e + (q === 1 ? -.15 : q === 3 ? .12 : 0)));
    c.r++; c.d = now + c.i * DAY - 3600e3;
  }
  S.reviews = (S.reviews || 0) + 1;
}
const nextInterval = (k, q) => { const c = S.cards[k]; if (!c) return ''; if (q === 0) return '10 min'; let i; if (c.r === 0) i = q === 3 ? 4 : 1; else if (c.r === 1) i = q === 1 ? 3 : q === 2 ? 4 : 7; else i = Math.max(c.i + 1, Math.round(c.i * (q === 1 ? 1.2 : q === 2 ? c.e : c.e * 1.35))); return i < 31 ? i + ' T' : Math.round(i / 30) + ' Mon'; };
const knownWords = () => Object.values(S.cards).filter(c => c.i >= 4).length;

/* ---------- lessons & unlocking ---------- */
const byLevel = lv => PZ.lessons.filter(l => l.lv === lv);
const lessonById = id => PZ.lessons.find(l => l.id === id);
function levelOpen(lv) {
  const i = LEVELS.indexOf(lv); if (i <= 0 || S.free) return true;
  const prev = LEVELS[i - 1];
  return !!S.levels[lv]?.passed || !!S.levels[prev]?.passed && levelOpen(prev) || byLevel(prev).every(l => S.lessons[l.id]);
}
function lessonOpen(l) {
  if (S.free || S.levels[l.lv]?.passed || S.lessons[l.id]) return true;
  if (!levelOpen(l.lv)) return false;
  const arr = byLevel(l.lv), i = arr.indexOf(l);
  return i === 0 || !!S.lessons[arr[i - 1].id];
}
function nextLesson() { for (const lv of LEVELS) for (const l of byLevel(lv)) if (!S.lessons[l.id] && lessonOpen(l)) return l; return null; }
function levelProgress(lv) { const a = byLevel(lv); return a.length ? a.filter(l => S.lessons[l.id]).length / a.length : 0; }
function currentLevel() { for (const lv of LEVELS) if (levelProgress(lv) < 1 && !S.levels[lv]?.passed) return lv; return 'C2'; }

/* ---------- badges ---------- */
const BADGES = [
  ['first', 'Gava yekem', 'Erste Lektion geschafft', () => Object.keys(S.lessons).length >= 1],
  ['ten', 'Deh ders', '10 Lektionen abgeschlossen', () => Object.keys(S.lessons).length >= 10],
  ['words100', 'Sed peyv', '100 Wörter im Kartenstapel', () => Object.keys(S.cards).length >= 100],
  ['words500', 'Pênc sed peyv', '500 Wörter im Kartenstapel', () => Object.keys(S.cards).length >= 500],
  ['streak3', 'Sê roj', '3 Tage in Folge gelernt', () => streak() >= 3],
  ['streak7', 'Heftiyek', '7 Tage in Folge gelernt', () => streak() >= 7],
  ['streak30', 'Mehek', '30 Tage in Folge gelernt', () => streak() >= 30],
  ['rev200', 'Dubarekar', '200 Karten wiederholt', () => (S.reviews || 0) >= 200],
  ['reader', 'Xwendevan', '3 Lesetexte gelesen', () => Object.keys(S.texts).length >= 3],
  ['verbs', 'Lêkerzan', '100 Verbformen richtig', () => S.verbs.ok >= 100],
  ['A1', 'A1 temam', 'Niveau A1 abgeschlossen', () => levelProgress('A1') === 1 || S.levels.A1?.passed],
  ['A2', 'A2 temam', 'Niveau A2 abgeschlossen', () => levelProgress('A2') === 1 || S.levels.A2?.passed],
  ['B1', 'B1 temam', 'Niveau B1 abgeschlossen', () => levelProgress('B1') === 1 || S.levels.B1?.passed],
  ['B2', 'B2 temam', 'Niveau B2 abgeschlossen', () => levelProgress('B2') === 1 || S.levels.B2?.passed],
  ['C1', 'Pira temam', 'Die ganze Brücke überquert', () => levelProgress('C1') === 1 || S.levels.C1?.passed],
  ['C2', 'Hosta', 'Niveau C2 abgeschlossen: der Turm am anderen Ufer', () => levelProgress('C2') === 1 || S.levels.C2?.passed],
  ['pron50', 'Guhdêr', '50 Sätze im Aussprache-Trainer aufgenommen', () => (S.pron?.n || 0) >= 50]
];
function checkBadges() { for (const b of BADGES) if (!S.badges[b[0]] && b[3]()) { S.badges[b[0]] = Date.now(); setTimeout(() => toast('Serkeftin! ' + b[1] + ' · ' + b[2]), 400); } }

/* ---------- UI helpers ---------- */
let toastT;
function toast(msg) { let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); } t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 3200); }
function applyTheme() { const r = document.documentElement; if (S.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', S.theme); }
const stars = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const KEYS = ['ê', 'î', 'û', 'ç', 'ş'];
function keysHTML(target) { return `<div class="keys" data-for="${target}">${KEYS.map(k => `<button type="button" data-k="${k}" aria-label="${k} einfügen">${k}</button>`).join('')}</div>`; }
document.addEventListener('click', e => {
  const b = e.target.closest('.keys button'); if (!b) return;
  const inp = document.getElementById(b.parentElement.dataset.for); if (!inp) return;
  const s = inp.selectionStart ?? inp.value.length, en = inp.selectionEnd ?? s;
  inp.value = inp.value.slice(0, s) + b.dataset.k + inp.value.slice(en); inp.focus(); inp.setSelectionRange(s + 1, s + 1);
  inp.dispatchEvent(new Event('input'));
});

/* ---------- bridge ---------- */
function bridgeSVG() {
  const W = 1140, base = 170, deckY = 64, ri = 33, ro = 42, ryi = 60, ryo = 70;
  let holes = '', rings = '', labels = '';
  const partState = (lv, part) => { const done = part.filter(l => S.lessons[l.id]).length; return [(S.levels[lv]?.passed || (part.length && done === part.length)) ? 'on' : done ? 'half' : '', done]; };
  LEVELS.slice(0, 5).forEach((lv, li) => {
    const ls = byLevel(lv), half = Math.ceil(ls.length / 2);
    [ls.slice(0, half), ls.slice(half)].forEach((part, pi) => {
      const k = li * 2 + pi, cx = 20 + 48 + 96 * k;
      const [cls, done] = partState(lv, part);
      holes += `M${cx - ri},${base} A${ri},${ryi} 0 0 1 ${cx + ri},${base} Z `;
      rings += `<path class="arch ${cls}" d="M${cx - ro},${base} A${ro},${ryo} 0 0 1 ${cx + ro},${base} L${cx + ri},${base} A${ri},${ryi} 0 0 0 ${cx - ri},${base} Z"><title>${lv} · Teil ${pi + 1}: ${done}/${part.length} Lektionen</title></path>`;
    });
    labels += `<text x="${20 + 96 * (li * 2 + 1)}" y="${deckY - 10}" text-anchor="middle">${lv}</text>`;
  });
  const c2 = byLevel('C2'), h2 = Math.ceil(c2.length / 2);
  const [cb, db] = partState('C2', c2.slice(0, h2)), [ct, dt] = partState('C2', c2.slice(h2));
  let merl = ''; for (let i = 0; i < 4; i++) merl += `<rect class="arch ${ct}" x="${1040 + i * 20}" y="16" width="12" height="16"/>`;
  const tower = `<path d="M988,${base} L1000,96 H1140 V205 H988 Z" fill="var(--sunk)" stroke="var(--line)" stroke-width="1.5"/>
    <rect class="arch ${cb}" x="1036" y="96" width="76" height="74"><title>C2 · Teil 1: ${db}/${h2} Lektionen</title></rect>
    <rect class="arch ${ct}" x="1030" y="32" width="88" height="64"><title>C2 · Teil 2: ${dt}/${c2.length - h2} Lektionen</title></rect>${merl}
    <rect x="1064" y="128" width="20" height="42" rx="10" fill="var(--ink)" opacity=".75"/>
    <rect x="1066" y="52" width="16" height="24" rx="8" fill="var(--ink)" opacity=".6"/>
    <text x="1074" y="10" text-anchor="middle">C2</text>`;
  let wave = 'M0,182'; for (let x = 0; x <= 1000 + 80; x += 20) wave += ` q10,-5 20,0`;
  return `<svg class="bridge" viewBox="0 0 ${W} 205" role="img" aria-label="Fortschrittsbrücke: zehn Bögen von A1 bis C1, dahinter der Turm für C2">
    <defs><clipPath id="wclip"><rect x="0" y="0" width="1000" height="205"/></clipPath></defs>
    <rect class="water" x="0" y="${base}" width="1000" height="35"/>
    <path class="wave" d="${wave}" clip-path="url(#wclip)"/>
    <path d="M20,${deckY + 14} H980 V${base} H20 Z ${holes}" fill="var(--surface)" stroke="var(--line)" stroke-width="1.5" fill-rule="evenodd"/>
    ${rings}
    <rect class="deck" x="12" y="${deckY}" width="976" height="14" rx="3"/>
    ${tower}
    ${labels}
  </svg>`;
}

/* ---------- navigation ---------- */
const IC = {
  home: '<path d="M3 11 12 4l9 7v9h-6v-6H9v6H3z"/>',
  path: '<path d="M2 9h20M4 9v10M20 9v10M8 19a4 4 0 0 1 8 0"/>',
  review: '<rect x="4" y="5" width="14" height="11" rx="2"/><path d="M7 19h13V9"/>',
  pron: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  read: '<path d="M3 5h7a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H3zM21 5h-7a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h7z"/>',
  verbs: '<path d="M4 6h10M4 12h16M4 18h7"/><circle cx="18" cy="6" r="2"/>',
  dict: '<path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h12"/>',
  grammar: '<path d="M4 20 10 4h1l6 16M6.5 14h8"/>',
  method: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>'
};
const icon = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
const PAGES = [
  ['home', 'Destpêk', 'Start'], ['path', 'Rê', 'Lernpfad'], ['review', 'Dubare', 'Karteikarten'], ['pron', 'Deng', 'Aussprache'], ['read', 'Xwendin', 'Lesen'],
  ['verbs', 'Lêker', 'Verbtrainer'], ['dict', 'Ferheng', 'Wörterbuch'], ['grammar', 'Rêziman', 'Grammatik'], ['method', 'Rêbaz', 'Lernmethode'], ['profile', 'Profîl', 'Speicherstand']
];
function renderNav(cur) {
  $('#nav').innerHTML = PAGES.map(([id, ku, de]) => `<a href="#${id}" ${cur === id ? 'aria-current="page"' : ''}>${icon(id)}<span>${ku}<em>${de}</em></span></a>`).join('');
  const mob = [['home', 'Destpêk'], ['path', 'Rê'], ['review', 'Dubare'], ['pron', 'Deng'], ['more', 'Zêde']];
  const inMore = ['read', 'verbs', 'dict', 'grammar', 'method', 'profile', 'more'].includes(cur);
  $('#bottom').innerHTML = mob.map(([id, ku]) => `<a href="#${id}" ${(cur === id || (id === 'more' && inMore)) ? 'aria-current="page"' : ''}>${icon(id)}${ku}</a>`).join('');
  renderSideFoot();
}
function renderSideFoot() {
  const f = $('#sideFoot'); if (!f) return;
  f.innerHTML = `<div>${S.xp} XP · ${streak()} Tage in Folge</div><div>${cloud.ok ? 'Gespeichert: Browser + Konto' : 'Gespeichert in diesem Browser'}</div>`;
}

/* ---------- router ---------- */
const VIEWS = {};
function route() {
  const id = (location.hash || '#home').slice(1).split(/[^a-z]/)[0] || 'home';
  const v = VIEWS[id] ? id : 'home';
  renderNav(v); if (typeof closePop === 'function') closePop(); if (typeof stopRec === 'function') stopRec(); if (typeof stopShadow === 'function' && v !== 'pron') stopShadow();
  if (typeof stopSay === 'function') stopSay();
  const m = $('#main'); m.innerHTML = `<div class="page">${VIEWS[v]()}</div>`;
  if (VIEWS[v].after) VIEWS[v].after(m);
  enhanceSay(m);
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);

/* ---------- dashboard ---------- */
function greeting() { const h = new Date().getHours(); return h < 5 ? 'Şevbaş' : h < 17 ? 'Rojbaş' : h < 22 ? 'Êvarbaş' : 'Şevbaş'; }
function dayPick(arr) { if (!arr.length) return null; const d = Math.floor(Date.now() / DAY); return arr[d % arr.length]; }
VIEWS.home = () => {
  const nl = nextLesson(), due = dueCards().length, tx = todayXP(), p = Math.min(100, Math.round(tx / S.goal * 100));
  const wod = dayPick([...DICT.values()].filter(w => w.lesson && w.lv === currentLevel()));
  const prov = dayPick(PZ.proverbs || []);
  const lv = currentLevel();
  return `
  <div class="hero">
    <div class="stack" style="justify-content:center">
      <div class="eyebrow">Kurmancî · Herêma Amed û Êlihê</div>
      <div class="greet">${greeting()}${S.name ? ',<br><span>' + esc(S.name) + '</span>' : '!'}</div>
      <p class="muted" style="max-width:52ch">${Object.keys(S.lessons).length ? 'Schön, dass du wieder da bist. Ein kleiner Schritt jeden Tag bringt dich über die Brücke.' : 'Willkommen! Hier lernst du Kurmancî so, wie es in Amed (Diyarbakır) und Êlih (Batman) gesprochen wird, auf Grundlage der Standardschrift.'}</p>
      <div class="row">
        ${nl ? `<button class="btn primary big" data-start="${nl.id}">${S.lessons[PZ.lessons[0].id] ? 'Weiterlernen' : 'Erste Lektion starten'}</button>` : `<a class="btn primary big" href="#read">Weiter mit Lesen</a>`}
        ${due ? `<a class="btn big" href="#review">${due} Karten wiederholen</a>` : ''}
        <a class="btn big" href="#pron">Aussprache üben</a>
      </div>
    </div>
    <div class="card row" style="align-items:center;gap:18px">
      <div class="ring" style="--p:${p}"><i>${tx}<small>von ${S.goal} XP</small></i></div>
      <div class="grow stack" style="gap:6px">
        <div class="eyebrow">Tagesziel</div>
        <h3>${p >= 100 ? 'Armanc pêk hat! Ziel erreicht.' : 'Noch ' + (S.goal - tx) + ' XP bis zum Tagesziel'}</h3>
        ${nl ? `<p class="muted">Nächste Lektion: <span class="ku">${esc(nl.title)}</span> · ${nl.lv}</p>` : ''}
      </div>
    </div>
  </div>
  <div class="stats">
    <div class="stat"><b>${streak()}</b><small>Tage in Folge</small></div>
    <div class="stat"><b>${S.xp}</b><small>XP gesamt</small></div>
    <div class="stat"><b>${Object.keys(S.cards).length}</b><small>Wörter im Stapel</small></div>
    <div class="stat"><b>${due}</b><small>heute fällig</small></div>
  </div>
  <section class="card stack">
    <div class="row"><div class="grow"><div class="eyebrow">Deine Brücke</div><h2>Pira Dehderî · ${lv} ${LEVEL_INFO[lv].de}</h2></div><a class="btn sm" href="#path">Lernpfad öffnen</a></div>
    <div class="bridge-wrap">${bridgeSVG()}</div>
    <p class="muted" style="font-size:.88rem">Die Zehn-Bogen-Brücke über den Tigris bei Amed: Jeder Bogen steht für eine halbe Niveaustufe von A1 bis C1. Am anderen Ufer wartet der Turm der Stadtmauer: C2. Ein Teil färbt sich, sobald seine Lektionen geschafft sind.</p>
  </section>
  <div class="grid2">
    ${wod ? `<div class="card stack" style="gap:6px"><div class="eyebrow">Peyva rojê · Wort des Tages</div><div class="row"><div class="prompt">${esc(wod.ku)}</div>${sayBtn(wod.ku)}</div><p>${esc(wod.de)}</p>${wod.tip ? `<p class="muted" style="font-size:.88rem">${esc(wod.tip)}</p>` : ''}</div>` : ''}
    ${prov ? `<div class="card stack" style="gap:6px"><div class="eyebrow">Gotina pêşiyan · Sprichwort</div><div class="row" style="flex-wrap:nowrap;align-items:flex-start"><div class="prompt grow" style="font-size:1.25rem">${esc(prov[0])}</div>${sayBtn(prov[0])}</div><p>${esc(prov[1])}</p>${prov[2] ? `<p class="muted" style="font-size:.88rem">${esc(prov[2])}</p>` : ''}</div>` : ''}
  </div>`;
};
document.addEventListener('click', e => { const b = e.target.closest('[data-start]'); if (b) { const l = lessonById(b.dataset.start); if (l) startLesson(l); } });

/* ---------- path ---------- */
VIEWS.path = () => {
  const nl = nextLesson();
  return `<div class="page-head"><div class="eyebrow">Rê · Lernpfad</div><h1>Von A1 bis C2</h1><p>Jede Lektion: kurze Erklärung, Wörter, ein Dialog und gemischte Übungen. Lektionen öffnen sich nacheinander. Mit dem Einstufungstest kannst du ein Niveau überspringen, wenn du es schon beherrschst.</p></div>
  <div class="card bridge-wrap">${bridgeSVG()}</div>
  ${LEVELS.map(lv => {
    const ls = byLevel(lv), open = levelOpen(lv), pr = Math.round(levelProgress(lv) * 100), t = S.levels[lv];
    return `<section class="level">
      <div class="level-head"><span class="lv-code">${lv}</span><h2>${LEVEL_INFO[lv].ku} <span class="muted" style="font-weight:500">· ${LEVEL_INFO[lv].de}</span></h2>
        <span class="pill ${pr === 100 ? 'ok' : ''}">${pr}%</span>${t?.passed ? '<span class="pill gold">Test bestanden</span>' : ''}</div>
      <p class="muted">${LEVEL_INFO[lv].desc}</p>
      <div class="lessons">${ls.map((l, i) => {
        const st = S.lessons[l.id], op = lessonOpen(l);
        return `<button class="lesson ${st ? 'done' : ''} ${op ? '' : 'locked'} ${nl && nl.id === l.id ? 'next' : ''}" ${op ? `data-start="${l.id}"` : 'aria-disabled="true"'}>
          <span class="num">${op ? i + 1 : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-label="gesperrt"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'}</span>
          <span class="grow"><span class="t">${esc(l.title)}</span><br><span class="s">${esc(l.sub)}</span></span>
          ${st ? `<span class="stars" aria-label="${st.stars} von 3 Sternen">${stars(st.stars)}</span>` : ''}
        </button>`;
      }).join('')}</div>
      <div class="row"><button class="btn sm" data-test="${lv}">${open ? 'Niveautest ' + lv : 'Einstufungstest: ' + lv + ' freischalten'}</button>${t ? `<span class="muted" style="font-size:.85rem">Bestes Ergebnis: ${t.best}%</span>` : ''}</div>
    </section>`;
  }).join('')}`;
};
document.addEventListener('click', e => { const b = e.target.closest('[data-test]'); if (b) startLevelTest(b.dataset.test); });

/* ---------- more (mobile) ---------- */
VIEWS.more = () => `<div class="page-head"><div class="eyebrow">Zêde · Mehr</div><h1>Werkzeuge</h1></div>
  <div class="grid2">${PAGES.slice(4).map(([id, ku, de]) => `<a class="card row" href="#${id}" style="text-decoration:none;color:inherit"><span style="width:28px;color:var(--hinar)">${icon(id)}</span><span class="grow"><b>${ku}</b><br><span class="muted">${de}</span></span></a>`).join('')}</div>`;

/* ---------- boot ---------- */
function boot() {
  loadLocal(); buildDict(); applyTheme(); route();
  initCloud();
}
