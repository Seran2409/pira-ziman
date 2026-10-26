/* ===== Pira Ziman · pronunciation audio (Meta MMS neural Kurmanji voice, pre-rendered) ===== */
const PZA = window.PZA = { banks: {}, wait: {}, add(n, map) { this.banks[n] = map; if (this.wait[n]) this.wait[n].res(); } };
const AKEYS = new Set((PZ.audio && PZ.audio.keys) ? PZ.audio.keys.split('\n') : []);
const ANB = (PZ.audio && PZ.audio.nb) || 1;
const akey = s => norm(String(s).replace(/\([^)]*\)/g, ' ').replace(/[„“"«»]/g, ' ').replace(/…|___/g, ' '));
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; return h; };
const bankOf = k => fnv(k) % ANB;
function loadBank(n) {
  if (PZA.banks[n]) return Promise.resolve();
  if (PZA.wait[n]) return PZA.wait[n].p;
  let res, rej; const p = new Promise((a, b) => { res = a; rej = b; });
  PZA.wait[n] = { p, res };
  const s = document.createElement('script'); s.src = 'audio/m' + n + '.js'; s.async = true;
  s.onerror = () => { delete PZA.wait[n]; s.remove(); rej(new Error('audio bank ' + n)); };
  document.head.append(s);
  return p;
}
/* which recordings make up this text: the whole phrase if we have it, otherwise word by word */
function sayParts(text) {
  const k = akey(text); if (!k) return [];
  if (AKEYS.has(k)) return [k];
  return k.split(' ').filter(w => AKEYS.has(w));
}
function canSay(text) { const k = akey(text); if (!k) return false; return AKEYS.has(k) || k.split(' ').every(w => AKEYS.has(w)); }

/* one shared <audio> element: unlocked on the first tap so later (async) plays work on iPhone too */
const AU = new Audio(); AU.preload = 'auto';
let auUnlocked = false, sayTok = 0, sayEl = null;
function unlockAudio() { if (auUnlocked) return; auUnlocked = true; try { AU.src = 'data:audio/mpeg;base64,' + PZ.silent; AU.play().catch(() => { }); } catch (e) { } }
document.addEventListener('pointerdown', unlockAudio, { capture: true, once: true });
document.addEventListener('keydown', unlockAudio, { capture: true, once: true });
function playOne(b64) {
  return new Promise(res => {
    const done = () => { AU.onended = AU.onerror = null; res(); };
    AU.onended = AU.onerror = done;
    AU.src = 'data:audio/mpeg;base64,' + b64;
    AU.playbackRate = S.rate || 1; try { AU.preservesPitch = true; } catch (e) { }
    const p = AU.play(); if (p) p.catch(done);
  });
}
function stopSay() { sayTok++; try { AU.pause(); } catch (e) { } if (sayEl) { sayEl.classList.remove('playing'); sayEl = null; } }
/* play a list of texts one after another (a dialog, a paragraph); el gets .playing meanwhile */
async function sayList(texts, el) {
  const parts = texts.map(sayParts).filter(p => p.length);
  if (!parts.length) { toast('Dafür gibt es keine Aufnahme.'); return; }
  stopSay(); const my = sayTok;
  try { await Promise.all([...new Set(parts.flat().map(bankOf))].map(loadBank)); }
  catch (e) { toast('Die Aufnahme konnte nicht geladen werden. Bist du offline?'); return; }
  if (my !== sayTok) return;
  sayEl = el || null; if (sayEl) sayEl.classList.add('playing');
  for (const seq of parts) {
    for (const w of seq) { if (my !== sayTok) return; const b = PZA.banks[bankOf(w)]; if (b && b[w]) await playOne(b[w]); }
    if (my !== sayTok) return;
    if (parts.length > 1) await new Promise(r => setTimeout(r, 350));
  }
  if (my === sayTok && sayEl) { sayEl.classList.remove('playing'); sayEl = null; }
}
const say = (text, el) => sayList([text], el);
const autoSay = text => { if (S.autoplay !== false) say(text); };

const SPK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
function sayBtn(text, cls = '', label) {
  if (!canSay(text)) return '';
  return `<button type="button" class="say ${cls}" data-say="${esc(text)}" aria-label="${esc(label || 'Anhören: ' + text)}" title="Anhören">${SPK}</button>`;
}
function sayListBtn(texts, label) {
  const ok = texts.filter(canSay); if (!ok.length) return '';
  return `<button type="button" class="btn sm say-all" data-say-list="${esc(JSON.stringify(ok))}">${SPK}<span>${esc(label)}</span></button>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-say]');
  if (b) { e.preventDefault(); e.stopPropagation(); if (b.classList.contains('playing')) { stopSay(); return; } say(b.dataset.say, b); return; }
  const l = e.target.closest('[data-say-list]');
  if (l) { e.preventDefault(); if (l.classList.contains('playing')) { stopSay(); return; } sayList(JSON.parse(l.dataset.sayList), l); return; }
  const k = e.target.closest('.sayable');
  if (k && !e.target.closest('a, button')) { if (k.classList.contains('playing')) { stopSay(); return; } say(k.dataset.text, k); }
});
document.addEventListener('keydown', e => {
  const k = e.target.closest && e.target.closest('.sayable');
  if (k && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); say(k.dataset.text, k); }
});
/* make every Kurdish snippet in explanations, tables and examples clickable */
const SAY_SEL = '.theory .ku, .theory .ex .k, .theory td, .theory li b, .dialect b, .dialect i, .dialect .ku, .page .ku, .page .ex .k, .list .it .k, .conj, .alpha .ku';
const NOT_KU = new Set(['du', 'wir', 'ich', 'er', 'sie', 'ihr', 'es', 'in', 'an']);
function enhanceSay(root) {
  if (!root || !AKEYS.size) return;
  root.querySelectorAll(SAY_SEL).forEach(el => {
    if (el.classList.contains('sayable') || el.closest('button, .tile, .choice, .pair, .sayable, [data-say]')) return;
    const t = el.textContent.replace(/^\s*\d+\s+/, '').trim();
    if (!t || !/[a-zêîûçş]/i.test(t) || !canSay(t)) return;
    if (el.matches('td') && NOT_KU.has(t.toLowerCase())) return;
    el.classList.add('sayable'); el.dataset.text = t; el.tabIndex = 0; el.title = 'Anhören';
  });
}
