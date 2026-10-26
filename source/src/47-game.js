/* ===== Pira Ziman · Lîstik (gamification): levels, ranks, daily quests, gold, streak shields, celebrations ===== */

/* ---------- sun of the flag (21 rays) ---------- */
function sunSVG(cls, lit = 21, label = '') {
  const cx = 60, cy = 60, r0 = 30, r1 = 56, n = 21, w = Math.PI / n * 0.62;
  let rays = '';
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n;
    const p = (r, d) => `${(cx + r * Math.cos(a + d)).toFixed(2)},${(cy + r * Math.sin(a + d)).toFixed(2)}`;
    rays += `<polygon class="ray${i < lit ? ' on' : ''}" points="${p(r0 - 2, -w)} ${p(r1, 0)} ${p(r0 - 2, w)}"/>`;
  }
  return `<svg class="${cls}" viewBox="0 0 120 120" ${label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"'}>${rays}<circle class="disc" cx="${cx}" cy="${cy}" r="${r0}"/></svg>`;
}
function flagMark() {
  const rays = []; for (let i = 0; i < 21; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 21, w = Math.PI / 21 * 0.6, p = (r, d) => `${(19 + r * Math.cos(a + d)).toFixed(2)},${(19 + r * Math.sin(a + d)).toFixed(2)}`; rays.push(`<polygon points="${p(5.2, -w)} ${p(9.6, 0)} ${p(5.2, w)}"/>`); }
  return `<svg class="brand-mark" viewBox="0 0 38 38" aria-hidden="true"><rect width="38" height="12.7" fill="#ED2024"/><rect y="12.6" width="38" height="12.8" fill="#FFFFFF"/><rect y="25.3" width="38" height="12.7" fill="#278E43"/><g fill="#FEBD11">${rays.join('')}<circle cx="19" cy="19" r="5.6"/></g></svg>`;
}
const GI = {
  coin: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="var(--roj)"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#7a5500" stroke-width="1.6" opacity=".55"/></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z" fill="var(--dicle)"/><path d="m8.5 12 2.5 2.5 4.5-5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  flame: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.5 1.2-4 2.5-5 .2 2 1.2 3 2.5 3-1-3 0-6 0-9z" fill="var(--flag-red)"/><path d="M12 13c.5 1.6 2 2.2 2 4a2 2 0 0 1-4 0c0-1 .6-1.6 1.2-2 .1.7.4 1 .8 1-.2-1 .1-2 0-3z" fill="var(--roj)"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-5a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h5z"/></svg>',
  cards: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="6" width="13" height="11" rx="2"/><path d="M8 20h12V10"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  verb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h10M4 12h16M4 18h7"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
  ear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>'
};

/* ---------- state ---------- */
const G = () => (S.game ||= { zer: 0, shields: 0, frozen: {}, day: null, quests: 0, lvSeen: levelOf(S.xp || 0), chests: 0, bought: 0 });
const RANKS = [[1, 'Nûhatî', 'Neuling'], [3, 'Şagirt', 'Lehrling'], [5, 'Xwendekar', 'Schüler/in'], [8, 'Axaftvan', 'Sprecher/in'], [12, 'Zimanzan', 'Sprachkundige/r'], [16, 'Dengbêj', 'Erzählsänger/in'], [20, 'Hosta', 'Meister/in']];
const lvlXP = n => 25 * n * (n - 1);                 // total XP needed to reach level n
function levelOf(xp) { let n = 1; while (xp >= lvlXP(n + 1)) n++; return n; }
function rankOf(n) { let r = RANKS[0]; for (const x of RANKS) if (n >= x[0]) r = x; return r; }
function levelInfo() { const n = levelOf(S.xp), a = lvlXP(n), b = lvlXP(n + 1); return { n, rank: rankOf(n), into: S.xp - a, need: b - a, pct: Math.round((S.xp - a) / (b - a) * 100) }; }
const SHIELD_PRICE = 40, SHIELD_MAX = 2;

/* ---------- daily quests ---------- */
const startOfDay = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const lessonsToday = () => Object.values(S.lessons).filter(l => (l.last || 0) >= startOfDay()).length;
const perfectToday = () => Object.values(S.lessons).filter(l => (l.last || 0) >= startOfDay() && l.lastStars === 3).length;
const textsToday = () => Object.values(S.texts).filter(t => (t.read || 0) >= startOfDay()).length;
const QUESTS = [
  { id: 'lesson', ic: 'book', t: 'Schließe 1 Lektion ab', n: 1, get: () => lessonsToday(), ok: () => !!nextLesson() },
  { id: 'lesson2', ic: 'book', t: 'Schließe 2 Lektionen ab', n: 2, get: () => lessonsToday(), ok: () => !!nextLesson() && levelOf(S.xp) >= 4 },
  { id: 'perfect', ic: 'star', t: 'Schaffe eine Lektion mit 3 Sternen', n: 1, get: () => perfectToday(), ok: () => Object.keys(S.lessons).length >= 1 },
  { id: 'cards', ic: 'cards', t: 'Wiederhole 15 Karteikarten', n: 15, get: d => (S.reviews || 0) - d.base.reviews, ok: () => Object.keys(S.cards).length >= 15 },
  { id: 'pron', ic: 'mic', t: 'Nimm 3 Sätze im Aussprache-Trainer auf', n: 3, get: d => (S.pron?.n || 0) - d.base.pron, ok: () => true },
  { id: 'quiz', ic: 'ear', t: 'Spiele eine Runde Hörtraining', n: 1, get: d => (S.pron?.qn || 0) - d.base.quiz, ok: () => true },
  { id: 'verbs', ic: 'verb', t: 'Bilde 10 Verbformen richtig', n: 10, get: d => (S.verbs.ok || 0) - d.base.verbs, ok: () => Object.keys(S.lessons).length >= 6 },
  { id: 'text', ic: 'book', t: 'Lies einen Lesetext', n: 1, get: () => textsToday(), ok: () => Object.keys(S.lessons).length >= 4 },
  { id: 'xp', ic: 'bolt', t: 'Sammle heute 60 XP', n: 60, get: () => todayXP(), ok: () => true }
];
function seeded(seed) { let x = seed >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
function pickQuests(date) {
  let h = 2166136261; for (const c of date) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rnd = seeded(h), pool = QUESTS.filter(q => q.ok()), out = [];
  const learn = pool.filter(q => q.id === 'lesson' || q.id === 'lesson2' || q.id === 'cards');
  if (learn.length) out.push(learn[Math.floor(rnd() * learn.length)].id);
  const rest = pool.filter(q => !out.includes(q.id) && !(out.includes('lesson') && q.id === 'lesson2') && !(out.includes('lesson2') && q.id === 'lesson'));
  while (out.length < 3 && rest.length) out.push(rest.splice(Math.floor(rnd() * rest.length), 1)[0].id);
  return out;
}
function lastActiveBefore(today) {
  const keys = Object.keys(S.days).filter(k => S.days[k] > 0 && k < today).concat(Object.keys(G().frozen || {}).filter(k => k < today));
  return keys.sort().pop() || null;
}
function ensureDay() {
  const g = G(), today = dkey();
  if (g.day && g.day.date === today) return g.day;
  // streak shields: cover missed days between the last active day and today
  const last = lastActiveBefore(today);
  if (last) {
    const missed = []; let t = new Date(last + 'T12:00:00').getTime() + DAY;
    while (dkey(t) < today) { missed.push(dkey(t)); t += DAY; }
    if (missed.length && missed.length <= g.shields) {
      missed.forEach(k => g.frozen[k] = 1); g.shields -= missed.length;
      setTimeout(() => toast(`Dein Mertal hat deine Serie gerettet (${missed.length} ${missed.length === 1 ? 'Tag' : 'Tage'} geschützt).`), 600);
    }
  }
  g.day = { date: today, ids: pickQuests(today), done: {}, chest: false, base: { reviews: S.reviews || 0, pron: S.pron?.n || 0, verbs: S.verbs.ok || 0, quiz: S.pron?.qn || 0 } };
  return g.day;
}
function questList() { const d = ensureDay(); return d.ids.map(id => { const q = QUESTS.find(x => x.id === id); const v = Math.max(0, Math.min(q.n, q.get(d))); return { ...q, v, done: !!d.done[id] }; }); }
function grantXP(n) { S.xp += n; S.days[dkey()] = (S.days[dkey()] || 0) + n; }
function checkQuests() {
  const g = G(), d = ensureDay(); let changed = false;
  for (const q of questList()) if (!q.done && q.v >= q.n) {
    d.done[q.id] = Date.now(); g.zer += 5; g.quests = (g.quests || 0) + 1; grantXP(10); changed = true;
    setTimeout(() => toast(`Erk temam! „${q.t}“ · +10 XP, +5 Zêr`), 300);
  }
  if (!d.chest && d.ids.every(id => d.done[id])) {
    d.chest = true; g.zer += 15; g.chests = (g.chests || 0) + 1; changed = true;
    setTimeout(() => celebrate('Sindoqa rojê', 'Alle Tagesaufgaben geschafft!', '+15 Zêr aus der Schatzkiste'), 900);
  }
  return changed;
}
function checkLevel() {
  const g = G(), n = levelOf(S.xp);
  if (n > (g.lvSeen || 1)) {
    const prevRank = rankOf(g.lvSeen || 1)[1]; g.lvSeen = n; g.zer += 10;
    const r = rankOf(n), newRank = r[1] !== prevRank;
    setTimeout(() => celebrate(`Ast ${n}`, newRank ? `Neuer Rang: ${r[1]} · ${r[2]}` : 'Stufe aufgestiegen!', '+10 Zêr', n), 500);
  }
}

/* ---------- hooks into the rest of the app ---------- */
const _addXP = addXP;
addXP = function (n) { ensureDay(); _addXP(n); const q = checkQuests(); checkLevel(); if (q) checkBadges(); save(); renderSideFoot(); };
const _finish = finish;
finish = function () {
  const isLesson = P && P.mode === 'lesson', lid = isLesson ? P.l.id : null;
  _finish();
  if (isLesson && S.lessons[lid]) { const acc = S.lessons[lid]; acc.lastStars = (P.first / Math.max(1, P.uniq)) >= .9 ? 3 : (P.first / Math.max(1, P.uniq)) >= .7 ? 2 : 1; if (checkQuests()) save(); }
  const r = $('#pBody .result'); if (r) r.insertAdjacentHTML('beforeend', levelBarHTML(true));
};
const _renderSideFoot = renderSideFoot;
renderSideFoot = function () {
  const f = $('#sideFoot'); if (!f) return;
  const L = levelInfo();
  f.innerHTML = `<div class="stack" style="gap:6px"><div class="row" style="gap:8px"><b style="color:var(--ink)">Ast ${L.n} · ${esc(L.rank[1])}</b></div><div class="xpbar" title="${L.into} von ${L.need} XP"><i style="width:${L.pct}%"></i></div>
    <div class="wallet"><span class="coin" title="Tage in Folge">${GI.flame}${streak()}</span><span class="coin" title="Zêr (Gold)">${GI.coin}${G().zer}</span>${G().shields ? `<span class="coin" title="Mertal (Serienschutz)">${GI.shield}${G().shields}</span>` : ''}</div>
    <div>${cloud.ok ? 'Gespeichert: Browser + Konto' : 'Gespeichert in diesem Browser'}</div></div>`;
};
BADGES.push(
  ['lv5', 'Ast 5', 'Stufe 5 erreicht', () => levelOf(S.xp) >= 5],
  ['lv10', 'Ast 10', 'Stufe 10 erreicht', () => levelOf(S.xp) >= 10],
  ['lv20', 'Hosta', 'Stufe 20 erreicht: Rang Hosta', () => levelOf(S.xp) >= 20],
  ['quest10', 'Erkdar', '10 Tagesaufgaben erfüllt', () => (S.game?.quests || 0) >= 10],
  ['chest7', 'Sindoq', '7 Schatzkisten geöffnet', () => (S.game?.chests || 0) >= 7]
);

/* ---------- UI pieces ---------- */
function levelBarHTML(compact) {
  const L = levelInfo(), next = rankOf(L.n + 1);
  return `<div class="stack" style="gap:8px;width:100%;max-width:${compact ? 420 : 9999}px;${compact ? 'margin:8px auto 0;text-align:left' : ''}">
    <div class="row" style="justify-content:space-between"><b>Ast ${L.n} · ${esc(L.rank[1])} <span class="muted" style="font-weight:500">(${esc(L.rank[2])})</span></b><span class="muted mono" style="font-size:.82rem">${L.into}/${L.need} XP</span></div>
    <div class="xpbar"><i style="width:${L.pct}%"></i></div>
    <span class="muted" style="font-size:.85rem">Noch ${L.need - L.into} XP bis Ast ${L.n + 1}${next[1] !== L.rank[1] ? ` und zum Rang ${esc(next[1])}` : ''}.</span></div>`;
}
function playerCardHTML() {
  const L = levelInfo(), g = G();
  return `<section class="card widget w-red pcard">
    <div class="lvl-badge">${sunSVG('fx-sun-static', 21)}<b>${L.n}</b></div>
    <div class="stack" style="gap:8px;min-width:0">
      <div class="row" style="justify-content:space-between;gap:8px"><div><div class="eyebrow">Ast · Stufe</div><h3>${esc(L.rank[1])} <span class="muted" style="font-weight:500">· ${esc(L.rank[2])}</span></h3></div>
        <div class="wallet"><span class="coin" title="Tage in Folge">${GI.flame}${streak()} ${streak() === 1 ? 'Tag' : 'Tage'}</span><span class="coin" title="Zêr (Gold)">${GI.coin}${g.zer} Zêr</span><span class="coin" title="Mertal (Serienschutz)">${GI.shield}${g.shields}</span></div></div>
      <div class="xpbar"><i style="width:${L.pct}%"></i></div>
      <span class="muted" style="font-size:.85rem">${L.into} von ${L.need} XP bis Ast ${L.n + 1}</span>
    </div></section>`;
}
function questsHTML() {
  const qs = questList(), d = ensureDay(), all = qs.every(q => q.done);
  return `<section class="card widget w-sun stack"><div class="row" style="flex-wrap:wrap;gap:4px 12px"><div class="grow" style="min-width:min(100%,240px)"><div class="eyebrow">Erkên rojê · Tagesaufgaben</div><h2>${all ? 'Alles geschafft für heute!' : 'Drei Aufgaben für heute'}</h2></div><span class="muted" style="font-size:.85rem">Neue Aufgaben ab Mitternacht</span></div>
    <div class="quests">${qs.map(q => `<div class="quest ${q.done ? 'done' : ''}"><span class="qi">${q.done ? GI.check : GI[q.ic]}</span>
      <div style="min-width:0"><div class="qt">${esc(q.t)}</div><div class="qbar"><i style="width:${Math.round(q.v / q.n * 100)}%"></i></div></div>
      <span class="qr">${q.done ? 'erledigt' : `${q.v}/${q.n} · +5 Zêr`}</span></div>`).join('')}</div>
    <div class="chest ${d.chest ? 'open' : ''}">${GI.coin}<span>${d.chest ? 'Schatzkiste geöffnet: +15 Zêr' : 'Schaffe alle drei für die Schatzkiste (+15 Zêr)'}</span></div></section>`;
}
function sunGoalHTML(tx, goal) {
  const p = Math.min(1, tx / goal), lit = Math.round(p * 21);
  const svg = sunSVG('sun-goal', lit, `Tagesziel: ${tx} von ${goal} XP`);
  return svg.replace('</svg>', `<text x="60" y="62" font-size="20" font-weight="800">${tx}</text><text x="60" y="76" font-size="9" fill="var(--muted)">von ${goal} XP</text></svg>`);
}

/* ---------- celebration overlay ---------- */
function celebrate(title, sub, reward, lvl) {
  if (document.querySelector('.fx')) return;
  const el = document.createElement('div'); el.className = 'fx'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
  el.innerHTML = `<canvas></canvas><div class="fx-card">${sunSVG('fx-sun', 21)}<div class="eyebrow">Pîroz be!</div><div class="fx-title">${esc(title)}</div><h3>${esc(sub)}</h3>${reward ? `<span class="coin">${GI.coin}${esc(reward)}</span>` : ''}${lvl ? levelBarHTML(true) : ''}<button class="btn primary big" id="fxOk">Berdewam · Weiter</button></div>`;
  document.body.append(el);
  const close = () => { el.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); close(); } };
  document.addEventListener('keydown', onKey);
  el.querySelector('#fxOk').onclick = close; el.querySelector('#fxOk').focus();
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = el.querySelector('canvas'), ctx = cv.getContext('2d'), dpr = window.devicePixelRatio || 1;
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.scale(dpr, dpr);
  const cols = ['#ED2024', '#FFFFFF', '#278E43', '#FEBD11'], parts = Array.from({ length: 140 }, () => ({ x: innerWidth / 2, y: innerHeight / 2, vx: (Math.random() - .5) * 12, vy: -Math.random() * 12 - 3, s: 4 + Math.random() * 5, c: cols[Math.floor(Math.random() * 4)], r: Math.random() * 6 }));
  const t0 = performance.now();
  (function frame(t) {
    if (!el.isConnected) return; const dt = t - t0; ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) { p.vy += .32; p.x += p.vx; p.y += p.vy; p.r += .1; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); ctx.restore(); }
    if (dt < 2200) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })(t0);
}

/* ---------- shop (in Profîl) ---------- */
function shopHTML() {
  const g = G(), can = g.zer >= SHIELD_PRICE && g.shields < SHIELD_MAX;
  return `<section class="card widget w-sun stack"><div class="row"><h2 class="grow">Dikan · Laden</h2><span class="coin">${GI.coin}${g.zer} Zêr</span></div>
    <div class="shop-item"><span style="width:40px;height:40px">${GI.shield}</span><div><b>Mertal · Serienschutz</b><br><span class="muted" style="font-size:.9rem">Schützt deine Serie, wenn du einen Tag nicht lernst. Wird automatisch eingesetzt. Du kannst bis zu ${SHIELD_MAX} besitzen (aktuell ${g.shields}).</span></div>
      <button class="btn ${can ? 'primary' : ''}" id="buyShield" ${can ? '' : 'disabled'}>${SHIELD_PRICE} Zêr</button></div>
    <p class="muted" style="font-size:.88rem">Zêr verdienst du mit Tagesaufgaben (+5), der täglichen Schatzkiste (+15) und jedem Stufenaufstieg (+10).</p></section>`;
}
document.addEventListener('click', e => {
  if (!e.target.closest('#buyShield')) return;
  const g = G(); if (g.zer < SHIELD_PRICE || g.shields >= SHIELD_MAX) return;
  g.zer -= SHIELD_PRICE; g.shields++; g.bought = (g.bought || 0) + 1; save(); toast('Mertal gekauft. Deine Serie ist geschützt.'); route();
});

/* ---------- views: home & profile ---------- */
const _home = VIEWS.home;
VIEWS.home = () => {
  ensureDay();
  let h = _home();
  // daily-goal ring → sun of the flag
  h = h.replace(/<div class="ring" style="--p:\d+"><i>(\d+)<small>von (\d+) XP<\/small><\/i><\/div>/, (m, tx, goal) => sunGoalHTML(+tx, +goal));
  // stats row → game stats
  h = h.replace(/<div class="stats">[\s\S]*?<\/div>\s*<\/div>\s*(?=<section class="card stack">)/, '');
  const i = h.indexOf('<section class="card stack">');
  return i < 0 ? h + playerCardHTML() + questsHTML() : h.slice(0, i) + playerCardHTML() + questsHTML() + h.slice(i);
};
const _profile = VIEWS.profile;
VIEWS.profile = () => { const h = _profile(); const i = h.indexOf('<section class="stack"><h2>Serkeftin'); return i < 0 ? h + shopHTML() : h.slice(0, i) + shopHTML() + h.slice(i); };
VIEWS.profile.after = _profile.after;

/* start of day: snapshot counters before any activity */
const _boot = boot;
boot = function () { _boot(); ensureDay(); save(false); renderSideFoot(); };

/* brand mark: flag with sun */
(function () { const b = document.querySelector('.brand svg'); if (b) b.outerHTML = flagMark(); })();
