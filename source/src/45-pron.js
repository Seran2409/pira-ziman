/* ===== Pira Ziman · Aussprache-Trainer (Deng) ===== */
let PR = { tab: 'nach', lesson: null, text: null, de: '', quizCat: 'e/ê', quiz: null, shadow: null, rec: null, res: null };
const prs = () => (S.pron ||= { n: 0, best: {}, quiz: {} });

/* ---------- IPA, syllables, tips ---------- */
const AIDX = new Map((PZ.audio && PZ.audio.keys ? PZ.audio.keys.split('\n') : []).map((k, i) => [k, i]));
function ipaOf(text) {
  if (!PZ.ipa) return '';
  const k = akey(text); if (AIDX.has(k)) return PZ.ipa[AIDX.get(k)] || '';
  const ws = k.split(' ').map(w => AIDX.has(w) ? PZ.ipa[AIDX.get(w)] : null);
  return ws.every(Boolean) ? ws.join(' ') : '';
}
const VOWS = 'aeêiîouûAEÊIÎOUÛ';
function sylWord(w) {
  const u = []; for (let i = 0; i < w.length; i++) { if (/x/i.test(w[i]) && /w/i.test(w[i + 1] || '')) { u.push(w[i] + w[i + 1]); i++; } else u.push(w[i]); }
  const v = u.map((c, i) => VOWS.includes(c) ? i : -1).filter(i => i >= 0);
  if (v.length < 2) return w;
  const cut = new Set();
  for (let k = 0; k < v.length - 1; k++) { const nc = v[k + 1] - v[k] - 1; cut.add(nc <= 1 ? v[k] + 1 : v[k] + 2); }
  return u.map((c, i) => (cut.has(i) ? '·' : '') + c).join('');
}
const sylText = t => t.split(/(\s+)/).map(p => /[a-zçêîûş]/i.test(p) ? p.replace(/[A-Za-zÇçÊêÎîÛûŞş]+/g, sylWord) : p).join('');
function tipsFor(text) {
  const t = text.toLowerCase(), out = [], seen = new Set();
  let rest = t;
  for (const [k, tip] of PZ.letterTips) { if (rest.includes(k) && !seen.has(k)) { out.push([k, tip]); seen.add(k); if (k === 'xw') rest = rest.replace(/xw/g, ''); } }
  const order = ['xw', 'x', 'q', 'ê', 'e', 'î', 'i', 'û', 'u', 'c', 'ç', 'j', 'ş', 'w', 'v', 'h', 'r'];
  return out.filter(([k]) => order.includes(k)).sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0])).slice(0, 6);
}

/* ---------- audio decoding ---------- */
let ACX = null;
const actx = () => ACX || (ACX = new (window.AudioContext || window.webkitAudioContext)());
const b64buf = b64 => { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; };
async function to16k(ab) {
  const n = Math.max(1, Math.ceil(ab.duration * 16000));
  const off = new OfflineAudioContext(1, n, 16000);
  const src = off.createBufferSource(); src.buffer = ab; src.connect(off.destination); src.start();
  return (await off.startRendering()).getChannelData(0).slice();
}
function decodeAB(buf) { return new Promise((res, rej) => { try { const p = actx().decodeAudioData(buf, res, rej); if (p && p.then) p.then(res, rej); } catch (e) { rej(e); } }); }
async function refSamples(text) {
  const parts = sayParts(text); if (!parts.length) return null;
  await Promise.all([...new Set(parts.map(bankOf))].map(loadBank));
  const segs = [];
  for (const w of parts) { const b = PZA.banks[bankOf(w)]; if (b && b[w]) { segs.push(await to16k(await decodeAB(b64buf(b[w])))); segs.push(new Float32Array(1600)); } }
  const n = segs.reduce((a, s) => a + s.length, 0), out = new Float32Array(n); let o = 0;
  for (const s of segs) { out.set(s, o); o += s.length; }
  return out;
}

/* ---------- features: MFCC + pitch ---------- */
const NFFT = 512, NMEL = 26, NCEP = 12;
const FFT = (() => {
  const rev = new Uint16Array(NFFT); const bits = Math.log2(NFFT);
  for (let i = 0; i < NFFT; i++) { let r = 0; for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b); rev[i] = r; }
  const cos = new Float64Array(NFFT / 2), sin = new Float64Array(NFFT / 2);
  for (let i = 0; i < NFFT / 2; i++) { cos[i] = Math.cos(2 * Math.PI * i / NFFT); sin[i] = -Math.sin(2 * Math.PI * i / NFFT); }
  return { rev, cos, sin };
})();
function powerSpec(frame) {
  const re = new Float64Array(NFFT), im = new Float64Array(NFFT);
  for (let i = 0; i < frame.length; i++) re[FFT.rev[i]] = frame[i];
  for (let size = 2; size <= NFFT; size <<= 1) {
    const half = size >> 1, step = NFFT / size;
    for (let i = 0; i < NFFT; i += size) for (let j = 0; j < half; j++) {
      const k = j * step, tr = re[i + j + half] * FFT.cos[k] - im[i + j + half] * FFT.sin[k], ti = re[i + j + half] * FFT.sin[k] + im[i + j + half] * FFT.cos[k];
      re[i + j + half] = re[i + j] - tr; im[i + j + half] = im[i + j] - ti; re[i + j] += tr; im[i + j] += ti;
    }
  }
  const p = new Float64Array(NFFT / 2 + 1); for (let i = 0; i <= NFFT / 2; i++) p[i] = re[i] * re[i] + im[i] * im[i];
  return p;
}
const MELFB = (() => {
  const mel = f => 2595 * Math.log10(1 + f / 700), imel = m => 700 * (10 ** (m / 2595) - 1);
  const lo = mel(60), hi = mel(7600), pts = []; for (let i = 0; i < NMEL + 2; i++) pts.push(Math.floor((NFFT + 1) * imel(lo + (hi - lo) * i / (NMEL + 1)) / 16000));
  const fb = []; for (let m = 1; m <= NMEL; m++) { const f = new Float64Array(NFFT / 2 + 1); for (let k = pts[m - 1]; k < pts[m]; k++) f[k] = (k - pts[m - 1]) / Math.max(1, pts[m] - pts[m - 1]); for (let k = pts[m]; k < pts[m + 1]; k++) f[k] = (pts[m + 1] - k) / Math.max(1, pts[m + 1] - pts[m]); fb.push(f); }
  return fb;
})();
const HAMM = Float64Array.from({ length: 400 }, (_, i) => 0.54 - 0.46 * Math.cos(2 * Math.PI * i / 399));
function features(x) {
  const fl = 400, hop = 160, nf = Math.max(0, 1 + Math.floor((x.length - fl) / hop));
  const en = new Float64Array(nf), cep = [];
  for (let f = 0; f < nf; f++) {
    const fr = new Float64Array(fl), o = f * hop;
    for (let i = 0; i < fl; i++) fr[i] = (x[o + i] - 0.97 * (o + i > 0 ? x[o + i - 1] : 0)) * HAMM[i];
    const p = powerSpec(fr), E = new Float64Array(NMEL); let s = 0;
    for (let m = 0; m < NMEL; m++) { let a = 0; const fb = MELFB[m]; for (let k = 0; k < fb.length; k++) if (fb[k]) a += fb[k] * p[k]; E[m] = Math.log(a + 1e-8); s += E[m]; }
    en[f] = s / NMEL;
    const c = new Float32Array(NCEP);
    for (let k = 1; k <= NCEP; k++) { let a = 0; for (let m = 0; m < NMEL; m++) a += E[m] * Math.cos(Math.PI * k * (m + 0.5) / NMEL); c[k - 1] = a * Math.sqrt(2 / NMEL); }
    cep.push(c);
  }
  let mx = -Infinity; for (const e of en) if (e > mx) mx = e;
  const keep = []; for (let f = 0; f < nf; f++) if (en[f] > mx - 6) keep.push(f);
  const mf = keep.map(f => cep[f]);
  for (let k = 0; k < NCEP; k++) { let m = 0, v = 0; for (const c of mf) m += c[k]; m /= mf.length || 1; for (const c of mf) v += (c[k] - m) ** 2; const sd = Math.sqrt(v / (mf.length || 1)) + 1e-6; for (const c of mf) c[k] = (c[k] - m) / sd; }
  const f0 = keep.map(f => pitchAt(x, f * hop + fl / 2));
  return { mf, keep, f0, nf, mx };
}
function pitchAt(x, c) {
  const W = 640, a = Math.max(0, c - W / 2), b = Math.min(x.length, a + W); if (b - a < W) return 0;
  let e0 = 0; for (let i = a; i < b; i++) e0 += x[i] * x[i]; if (e0 < 1e-4) return 0;
  let best = 0, bl = 0;
  for (let lag = 40; lag <= 228; lag++) { let s = 0, e1 = 0, e2 = 0; for (let i = a; i < b - lag; i++) { s += x[i] * x[i + lag]; e1 += x[i] * x[i]; e2 += x[i + lag] * x[i + lag]; } const r = s / Math.sqrt(e1 * e2 + 1e-9); if (r > best) { best = r; bl = lag; } }
  return best > 0.5 ? 16000 / bl : 0;
}
function dtw(A, B) {
  const n = A.length, m = B.length, W = m + 1, D = new Float32Array(n * m);
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { let s = 0; const a = A[i], b = B[j]; for (let k = 0; k < NCEP; k++) { const d = a[k] - b[k]; s += d * d; } D[i * m + j] = Math.sqrt(s); }
  const acc = new Float32Array((n + 1) * W).fill(Infinity), dir = new Uint8Array((n + 1) * W); acc[0] = 0;
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    const d = acc[(i - 1) * W + j - 1], u = acc[(i - 1) * W + j], l = acc[i * W + j - 1];
    let v = d, dr = 0; if (u < v) { v = u; dr = 1; } if (l < v) { v = l; dr = 2; }
    acc[i * W + j] = D[(i - 1) * m + j - 1] + v; dir[i * W + j] = dr;
  }
  const path = []; let i = n, j = m;
  while (i > 0 && j > 0) { path.push([i - 1, j - 1]); const dr = dir[i * W + j]; if (dr === 0) { i--; j--; } else if (dr === 1) i--; else j--; }
  path.reverse();
  return { dist: acc[n * W + m] / (n + m), path, D, m };
}
function analyse(ref, usr, text) {
  const fr = features(ref), fu = features(usr);
  if (fu.mx < -3 || fu.keep.length < 8) return { error: 'Ich höre fast nichts. Sprich näher am Mikrofon oder lauter und versuch es noch einmal.' };
  if (fu.nf * 0.01 > 0.6 && fu.keep.length < 0.12 * fu.nf && fu.keep.length < 25) return { error: 'Die Aufnahme ist sehr kurz oder verrauscht. Versuch es noch einmal in ruhiger Umgebung.' };
  const r = dtw(fr.mf, fu.mf);
  const short = fr.mf.length < 60;
  const d = r.dist - (short ? 0.35 : 0);
  // calibrated: same sentence spoken by another voice ≈ 75, a different sentence ≈ 25
  const score = Math.round(100 * Math.min(1, Math.max(0, (2.62 - d) / 0.91)));
  const tempo = fu.mf.length / Math.max(1, fr.mf.length);
  const lc = new Float32Array(fr.mf.length), cnt = new Float32Array(fr.mf.length), match = new Int32Array(fr.mf.length).fill(-1);
  for (const [i, j] of r.path) { lc[i] += r.D[i * r.m + j]; cnt[i]++; if (match[i] < 0) match[i] = j; }
  for (let i = 0; i < lc.length; i++) lc[i] /= cnt[i] || 1;
  const win = Math.min(15, lc.length); let best = -1, bi = 0;
  for (let i = 0; i + win <= lc.length; i++) { let s = 0; for (let k = i; k < i + win; k++) s += lc[k]; if (s > best) { best = s; bi = i; } }
  const words = text.replace(/[^\sA-Za-zÇçÊêÎîÛûŞş'’-]/g, ' ').split(/\s+/).filter(Boolean);
  let weak = null;
  if (words.length > 1) {
    const tot = words.reduce((a, w) => a + w.length, 0), center = (bi + win / 2) / lc.length; let acc = 0;
    for (const w of words) { acc += w.length / tot; if (center <= acc) { weak = w; break; } }
  }
  const st = f => 12 * Math.log2(f);
  const med = arr => { const v = arr.filter(Boolean).map(st).sort((a, b) => a - b); return v.length ? v[v.length >> 1] : 0; };
  const mr = med(fr.f0), mu = med(fu.f0);
  const curve = []; const xs = [], ys = [];
  for (let i = 0; i < fr.f0.length; i++) {
    const a = fr.f0[i] ? st(fr.f0[i]) - mr : null, j = match[i], b = j >= 0 && fu.f0[j] ? st(fu.f0[j]) - mu : null;
    curve.push([a, b]); if (a !== null && b !== null) { xs.push(a); ys.push(b); }
  }
  let corr = null;
  if (xs.length > 12) { const ma = xs.reduce((s, v) => s + v, 0) / xs.length, mb = ys.reduce((s, v) => s + v, 0) / ys.length; let sab = 0, saa = 0, sbb = 0; for (let k = 0; k < xs.length; k++) { sab += (xs[k] - ma) * (ys[k] - mb); saa += (xs[k] - ma) ** 2; sbb += (ys[k] - mb) ** 2; } corr = sab / Math.sqrt(saa * sbb + 1e-9); }
  const weakT = [(fr.keep[bi] || 0) * 0.01, (fr.keep[Math.min(fr.keep.length - 1, bi + win)] || 0) * 0.01 + 0.025];
  return { score, dist: r.dist, tempo, weak, corr, curve, weakT, short, refDur: ref.length / 16000, usrDur: usr.length / 16000 };
}

/* ---------- phrase lists ---------- */
function phrasesOf(l) {
  const out = [], seen = new Set();
  const add = (ku, de) => { const k = akey(ku); if (!k || seen.has(k) || !canSay(ku)) return; seen.add(k); out.push({ ku, de }); };
  (l.s || []).forEach(s => add(s[0].split('|')[0], s[1]));
  (l.dlg || []).forEach(d => add(d[1], d[2]));
  (l.vocab || []).forEach(v => add(showKu(v[0]), v[1]));
  return out;
}
function soundPhrases() { const out = []; for (const s of PZ.sounds) { out.push({ ku: s.drill, de: s.drillDe }); } return out; }
function ensurePhrase() {
  if (PR.text) return;
  const l = PR.lesson ? lessonById(PR.lesson) : (nextLesson() || PZ.lessons[0]);
  PR.lesson = l.id; const p = phrasesOf(l)[0] || soundPhrases()[0]; if (!phrasesOf(l).length) PR.lesson = '__sounds';
  PR.text = p.ku; PR.de = p.de;
}

/* ---------- view ---------- */
const MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
VIEWS.pron = () => {
  const tabs = [['nach', 'Nachsprechen'], ['laute', 'Lautschule'], ['hoeren', 'Hörtraining'], ['shadow', 'Shadowing']];
  return `<div class="page-head"><div class="eyebrow">Deng · Aussprache-Trainer</div><h1>Sprich wie in Amed</h1>
    <p>Hör dir die natürliche Kurmancî-Stimme an, sprich nach, nimm dich auf und vergleiche. Der Trainer zeigt dir, wie nah du am Vorbild bist, wo die größte Abweichung liegt und ob Tempo und Satzmelodie passen.</p></div>
  <div class="seg" role="tablist" aria-label="Bereiche">${tabs.map(([k, n]) => `<button role="tab" data-ptab="${k}" aria-pressed="${PR.tab === k}">${n}</button>`).join('')}</div>
  <div id="pronBody" class="stack" style="gap:18px">${PR.tab === 'laute' ? viewLaute() : PR.tab === 'hoeren' ? viewHoeren() : PR.tab === 'shadow' ? viewShadow() : viewNach()}</div>`;
};
VIEWS.pron.after = m => {
  $$('[data-ptab]').forEach(b => b.onclick = () => { stopShadow(); PR.tab = b.dataset.ptab; route(); });
  if (PR.tab === 'nach') afterNach(); else if (PR.tab === 'laute') afterLaute(); else if (PR.tab === 'hoeren') afterHoeren(); else afterShadow();
};

/* ---------- Nachsprechen ---------- */
function lessonOptions(sel) {
  return LEVELS.map(lv => `<optgroup label="${lv} · ${LEVEL_INFO[lv].de}">${byLevel(lv).map(l => `<option value="${l.id}" ${l.id === sel ? 'selected' : ''}>${lv} · ${esc(l.title)}</option>`).join('')}</optgroup>`).join('') + `<optgroup label="Lautschule"><option value="__sounds" ${sel === '__sounds' ? 'selected' : ''}>Übungssätze der Lautschule</option></optgroup>`;
}
function viewNach() {
  ensurePhrase();
  const list = PR.lesson === '__sounds' ? soundPhrases() : phrasesOf(lessonById(PR.lesson));
  const ipa = ipaOf(PR.text), tips = tipsFor(PR.text), best = prs().best[akey(PR.text)];
  return `<section class="card stack">
    <div class="row"><label class="grow stack" style="gap:6px"><span class="eyebrow">Übungsmaterial</span><select class="inp" id="prLesson" aria-label="Lektion wählen">${lessonOptions(PR.lesson)}</select></label>
      <button class="btn sm" id="prRand" style="align-self:flex-end">Zufälliger Satz</button></div>
    <div class="chips" id="prList">${list.map((p, i) => `<button class="chip ${akey(p.ku) === akey(PR.text) ? 'on' : ''}" data-pi="${i}">${esc(p.ku)}${prs().best[akey(p.ku)] != null ? ` <span class="chip-score">${prs().best[akey(p.ku)]}</span>` : ''}</button>`).join('')}</div>
  </section>
  <section class="card stack pr-stage">
    <div class="prompt ku" style="font-size:clamp(1.5rem,4.2vw,2.2rem)">${esc(PR.text)}</div>
    <p class="muted" style="margin-top:-6px">${esc(PR.de)}</p>
    <div class="pr-meta">
      <div><span class="eyebrow">Silben</span><div class="mono">${esc(sylText(PR.text))}</div></div>
      ${ipa ? `<div><span class="eyebrow">Lautschrift</span><div class="mono">[${esc(ipa)}]</div></div>` : ''}
    </div>
    ${tips.length ? `<div class="tips">${tips.map(([k, t]) => `<span class="tip-chip"><b>${esc(k)}</b> ${esc(t.replace(/^\S+ = /, '= '))}</span>`).join('')}</div>` : ''}
    <div class="row pr-controls">
      <button class="btn" id="prHear">${SPK} Vorbild</button>
      <button class="btn" id="prSlow">${SPK} Langsam</button>
      <button class="btn rec" id="prRec">${MIC} <span>Aufnehmen</span></button>
      <label class="btn ghost" for="prFile" style="cursor:pointer">Aufnahme als Datei laden</label>
      <input type="file" id="prFile" accept="audio/*" hidden>
    </div>
    <div id="prLevel" class="level-meter" hidden><i></i></div>
    <div id="prMsg" class="muted" style="font-size:.9rem">${best != null ? `Dein bestes Ergebnis bei diesem Satz: ${best} von 100.` : 'Tipp: Hör dir das Vorbild zwei- bis dreimal an, bevor du aufnimmst. Die Aufnahme stoppt automatisch, wenn du fertig gesprochen hast.'}</div>
  </section>
  <section id="prResult"></section>
  <p class="muted" style="font-size:.85rem">Die Bewertung vergleicht Klangmuster deiner Aufnahme mit der Vorlage. Sie ist eine Orientierung, keine Prüfung: Bei ganzen Sätzen ist sie aussagekräftiger als bei Einzelwörtern, und eine andere Stimme oder Raumhall senken den Wert etwas. Deine Aufnahmen bleiben auf deinem Gerät.</p>`;
}
function afterNach() {
  $('#prLesson').onchange = e => { PR.lesson = e.target.value; const l = PR.lesson === '__sounds' ? soundPhrases() : phrasesOf(lessonById(PR.lesson)); PR.text = l[0]?.ku || PR.text; PR.de = l[0]?.de || ''; PR.res = null; route(); };
  $('#prRand').onclick = () => { const l = PR.lesson === '__sounds' ? soundPhrases() : phrasesOf(lessonById(PR.lesson)); const p = l[Math.floor(Math.random() * l.length)]; if (p) { PR.text = p.ku; PR.de = p.de; PR.res = null; route(); } };
  $$('#prList [data-pi]').forEach(b => b.onclick = () => { const l = PR.lesson === '__sounds' ? soundPhrases() : phrasesOf(lessonById(PR.lesson)); const p = l[+b.dataset.pi]; PR.text = p.ku; PR.de = p.de; PR.res = null; route(); say(p.ku); });
  $('#prHear').onclick = e => say(PR.text, e.currentTarget);
  $('#prSlow').onclick = async e => { const r = S.rate; S.rate = 0.65; try { await say(PR.text, e.currentTarget); } finally { S.rate = r; } };
  $('#prRec').onclick = () => PR.rec?.active ? stopRec() : startRec();
  $('#prFile').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; try { setMsg('Werte die Datei aus …'); const s = await to16k(await decodeAB(await f.arrayBuffer())); PR.userUrl = URL.createObjectURL(f); await evaluate(s); } catch (err) { setMsg('Diese Datei konnte ich nicht lesen. Versuch es mit MP3, M4A, WAV oder WebM.'); } };
  if (PR.res) renderResult();
}
const setMsg = t => { const m = $('#prMsg'); if (m) m.textContent = t; };
async function startRec() {
  stopSay();
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setMsg('Dieser Browser kann hier nicht aufnehmen. Nimm dich mit der Sprachmemo-App auf und lade die Datei über „Aufnahme als Datei laden“.'); return; }
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
  catch (e) { setMsg(e && e.name === 'NotAllowedError' ? 'Das Mikrofon ist hier gesperrt. In der Web-Version auf GitHub oder in der Offline-Version funktioniert die Aufnahme. Hier kannst du alternativ eine Sprachmemo über „Aufnahme als Datei laden“ auswerten.' : 'Kein Mikrofon gefunden. Du kannst eine Sprachmemo über „Aufnahme als Datei laden“ auswerten.'); return; }
  const mr = new MediaRecorder(stream), chunks = [];
  const ctx = actx(); try { await ctx.resume(); } catch (e) { }
  const an = ctx.createAnalyser(); an.fftSize = 1024; const srcN = ctx.createMediaStreamSource(stream); srcN.connect(an);
  const mute = ctx.createGain(); mute.gain.value = 0; an.connect(mute); mute.connect(ctx.destination);
  const buf = new Float32Array(an.fftSize);
  const refDur = Math.max(1.5, PR.text.length * 0.08);
  PR.rec = { active: true, mr, stream, started: performance.now(), heard: false, quietSince: 0 };
  mr.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  mr.onstop = async () => {
    stream.getTracks().forEach(t => t.stop()); srcN.disconnect(); try { an.disconnect(); mute.disconnect(); } catch (e) { }
    const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
    PR.userUrl = URL.createObjectURL(blob);
    try { setMsg('Werte deine Aufnahme aus …'); const s = await to16k(await decodeAB(await blob.arrayBuffer())); await evaluate(s); }
    catch (e) { setMsg('Die Aufnahme konnte nicht ausgewertet werden. Versuch es noch einmal.'); }
  };
  mr.start();
  const btn = $('#prRec'); btn.classList.add('on'); btn.querySelector('span').textContent = 'Stopp'; $('#prLevel').hidden = false;
  setMsg('Ich höre zu … sprich jetzt den Satz.');
  const tick = () => {
    if (!PR.rec?.active) return;
    an.getFloatTimeDomainData(buf); let s = 0; for (const v of buf) s += v * v; const rms = Math.sqrt(s / buf.length);
    const bar = $('#prLevel i'); if (bar) bar.style.width = Math.min(100, rms * 600) + '%';
    const now = performance.now(), el = (now - PR.rec.started) / 1000;
    if (rms > 0.02) { PR.rec.heard = true; PR.rec.quietSince = 0; } else if (PR.rec.heard && !PR.rec.quietSince) PR.rec.quietSince = now;
    if ((PR.rec.heard && PR.rec.quietSince && now - PR.rec.quietSince > 1300) || el > refDur * 2.5 + 3) { stopRec(); return; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function stopRec() {
  if (!PR.rec?.active) return;
  PR.rec.active = false; try { PR.rec.mr.stop(); } catch (e) { }
  const btn = $('#prRec'); if (btn) { btn.classList.remove('on'); btn.querySelector('span').textContent = 'Aufnehmen'; }
  const lv = $('#prLevel'); if (lv) lv.hidden = true;
}
async function evaluate(userSamples) {
  const ref = await refSamples(PR.text);
  if (!ref) { setMsg('Für diesen Satz gibt es keine Vorlage.'); return; }
  const r = analyse(ref, userSamples, PR.text);
  r.ref = ref; r.usr = userSamples; PR.res = r;
  if (!r.error) {
    const p = prs(), k = akey(PR.text); p.n = (p.n || 0) + 1; p.best[k] = Math.max(p.best[k] || 0, r.score);
    addXP(3);
  }
  setMsg(r.error || 'Fertig. Unten siehst du die Auswertung.');
  renderResult();
}
function verdict(s) {
  if (s >= 80) return ['Sehr nah am Vorbild', 'Klang und Ablauf passen. Jetzt an Tempo und Melodie feilen.'];
  if (s >= 60) return ['Gut verständlich', 'Kleine Abweichungen. Hör dir die markierte Stelle noch einmal an.'];
  if (s >= 40) return ['Erkennbar', 'Einige Laute weichen deutlich ab. Übe die markierte Stelle langsam.'];
  return ['Noch weit weg', 'Hör dir das Vorbild langsam an, sprich Silbe für Silbe mit und nimm dich dann neu auf.'];
}
function renderResult() {
  const el = $('#prResult'); if (!el) return; const r = PR.res; if (!r) { el.innerHTML = ''; return; }
  if (r.error) { el.innerHTML = `<div class="card"><b>${esc(r.error)}</b></div>`; return; }
  const [vt, vd] = verdict(r.score);
  const tempo = r.tempo > 1.35 ? 'Du sprichst deutlich langsamer als das Vorbild. Am Anfang ist das völlig in Ordnung.' : r.tempo < 0.75 ? 'Du sprichst schneller als das Vorbild. Nimm dir mehr Zeit für jeden Laut.' : 'Dein Tempo passt gut zum Vorbild.';
  const mel = r.corr == null ? 'Für einen Melodievergleich war der Satz zu kurz.' : r.corr > 0.6 ? 'Deine Satzmelodie folgt dem Vorbild gut.' : r.corr > 0.25 ? 'Deine Satzmelodie ähnelt dem Vorbild teilweise. Achte darauf, wo die Stimme steigt und fällt.' : 'Deine Satzmelodie verläuft anders als beim Vorbild. Sprich das Vorbild mit übertriebener Melodie nach.';
  el.innerHTML = `<div class="card stack">
    <div class="row" style="gap:18px;align-items:center">
      <div class="ring" style="--p:${r.score}"><i>${r.score}<small>von 100</small></i></div>
      <div class="grow stack" style="gap:4px"><h2>${vt}</h2><p class="muted">${vd}</p></div>
    </div>
    <div class="grid2">
      <div class="panel stack" style="gap:6px"><span class="eyebrow">Größte Abweichung</span>${r.score >= 85 ? `<p>Keine auffällige Stelle. Achte jetzt auf Melodie und Tempo.</p>` : r.weak ? `<div class="row"><span class="prompt" style="font-size:1.25rem">${esc(r.weak)}</span>${sayBtn(r.weak)}</div><p class="muted" style="font-size:.88rem">Ungefähre Stelle, im Bild unten rot markiert.</p>` : `<p class="muted">Im Bild unten rot markiert.</p>`}</div>
      <div class="panel stack" style="gap:6px"><span class="eyebrow">Tempo und Melodie</span><p>${tempo}</p><p>${mel}</p></div>
    </div>
    ${PR.text.trim().includes(' ') ? '' : `<p class="muted" style="font-size:.88rem">Bei einzelnen Wörtern ist die Zahl nur grob. Hör dir Vorbild und Aufnahme mit „Abwechselnd“ an und vergleiche selbst.</p>`}
    <div class="stack" style="gap:6px"><div class="row"><span class="eyebrow grow">Vorbild</span><button class="btn sm" id="prPlayRef">${SPK} Vorbild</button></div><canvas class="wave-cv" id="cvRef" height="70"></canvas></div>
    <div class="stack" style="gap:6px"><div class="row"><span class="eyebrow grow">Deine Aufnahme</span><button class="btn sm" id="prPlayMe">${SPK} Ich</button><button class="btn sm" id="prAB">Abwechselnd</button></div><canvas class="wave-cv" id="cvMe" height="70"></canvas></div>
    <div class="stack" style="gap:6px"><span class="eyebrow">Satzmelodie (Halbtöne um die eigene Stimmlage)</span><div id="prPitch"></div>
      <div class="row" style="font-size:.82rem"><span class="legend ref">Vorbild</span><span class="legend me">Du</span></div></div>
  </div>`;
  drawWave($('#cvRef'), r.ref, r.score >= 85 ? null : r.weakT, true); drawWave($('#cvMe'), r.usr, null, false);
  $('#prPitch').innerHTML = pitchSVG(r.curve);
  const playMe = () => new Promise(res => { if (!PR.userUrl) return res(); const a = new Audio(PR.userUrl); a.onended = a.onerror = res; a.play().catch(res); });
  $('#prPlayRef').onclick = e => say(PR.text, e.currentTarget);
  $('#prPlayMe').onclick = () => { stopSay(); playMe(); };
  $('#prAB').onclick = async () => { await say(PR.text); await new Promise(r => setTimeout(r, 300)); await playMe(); };
}
function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#888'; }
function drawWave(cv, x, weakT, isRef) {
  if (!cv || !x) return;
  const w = cv.clientWidth || 600, h = cv.height; cv.width = w * (window.devicePixelRatio || 1); cv.height = h * (window.devicePixelRatio || 1);
  const g = cv.getContext('2d'); g.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  if (weakT) { g.fillStyle = cssVar('--bad-soft'); const a = weakT[0] * 16000 / x.length * w, b = weakT[1] * 16000 / x.length * w; g.fillRect(a, 0, Math.max(4, b - a), h); }
  g.strokeStyle = isRef ? cssVar('--dicle') : cssVar('--hinar'); g.lineWidth = 1;
  const step = x.length / w; let mx = 1e-3; for (let i = 0; i < x.length; i += 4) mx = Math.max(mx, Math.abs(x[i]));
  g.beginPath();
  for (let px = 0; px < w; px++) { let lo = 0, hi = 0; const a = Math.floor(px * step), b = Math.floor((px + 1) * step); for (let i = a; i < b; i++) { if (x[i] < lo) lo = x[i]; if (x[i] > hi) hi = x[i]; } g.moveTo(px + .5, h / 2 - hi / mx * h * .45); g.lineTo(px + .5, h / 2 - lo / mx * h * .45); }
  g.stroke();
}
function pitchSVG(curve) {
  const W = 600, H = 120, n = curve.length; if (n < 2) return '';
  const all = curve.flat().filter(v => v !== null); const lo = Math.min(-6, ...all), hi = Math.max(6, ...all);
  const X = i => (i / (n - 1)) * (W - 20) + 10, Y = v => H - 10 - (v - lo) / (hi - lo) * (H - 20);
  const line = (k, cls) => { let d = '', pen = false; curve.forEach((c, i) => { const v = c[k]; if (v === null) { pen = false; return; } d += (pen ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1) + ' '; pen = true; }); return `<path d="${d}" class="${cls}" fill="none"/>`; };
  return `<svg viewBox="0 0 ${W} ${H}" class="pitch-svg" role="img" aria-label="Tonhöhenverlauf Vorbild und eigene Aufnahme"><line x1="10" x2="${W - 10}" y1="${Y(0)}" y2="${Y(0)}" class="pz"/>${line(0, 'pr')}${line(1, 'pu')}</svg>`;
}

/* ---------- Lautschule ---------- */
function viewLaute() {
  return `<p class="muted">Elf Lautgruppen, die Deutschsprachigen am meisten Mühe machen. Tippe auf ein Wort, um es zu hören. Mit „Nachsprechen“ übst du den Übungssatz im Aufnahme-Studio.</p>
  <div class="grid2">${PZ.sounds.map(s => `<article class="card stack sound-card">
    <div class="row"><h3 class="grow">${esc(s.title)}</h3><span class="mono muted">${esc(s.ipa)}</span><span class="pill lv">${s.lv}</span></div>
    <p class="theory" style="margin:0">${s.how}</p>
    <div class="chips">${s.ex.map(e => `<span class="chip ex-chip">${sayBtn(e[0])}<b class="ku">${esc(e[0])}</b><small>${esc(e[1])}</small></span>`).join('')}</div>
    <div class="panel stack" style="gap:8px"><div><span class="eyebrow">Übungssatz</span><div class="ku" style="font-size:1.08rem">${esc(s.drill)}</div><small class="muted">${esc(s.drillDe)}</small></div><div class="row">${sayBtn(s.drill)}<button class="btn sm" data-drill="${esc(s.id)}">${MIC} Nachsprechen</button></div></div>
  </article>`).join('')}</div>`;
}
function afterLaute() {
  $$('[data-drill]').forEach(b => b.onclick = () => { const s = PZ.sounds.find(x => x.id === b.dataset.drill); PR.lesson = '__sounds'; PR.text = s.drill; PR.de = s.drillDe; PR.res = null; PR.tab = 'nach'; route(); });
}

/* ---------- Hörtraining ---------- */
function viewHoeren() {
  const cats = [...Object.keys(PZ.pairs), 'alle'];
  const q = PR.quiz;
  let body;
  if (!q) body = `<div class="card stack"><p>Du hörst ein Wort und entscheidest, welches von zwei fast gleichen Wörtern es war. So trainierst du dein Ohr für Unterschiede, die die Bedeutung ändern, etwa <span class="ku">ker</span> (Esel) und <span class="ku">kêr</span> (Messer).</p>
      <div class="row"><button class="btn primary big" id="qzStart">10 Runden starten</button>${prs().quiz[PR.quizCat] != null ? `<span class="muted">Bestes Ergebnis hier: ${prs().quiz[PR.quizCat]} von 10</span>` : ''}</div></div>
      <div class="card stack"><h3>Alle Paare dieser Gruppe</h3><div class="list">${pairsOf(PR.quizCat).map(p => `<div class="it">${sayBtn(p[0])}<span class="k">${esc(p[0])}</span><span class="grow muted">${esc(p[1])}</span>${sayBtn(p[2])}<span class="k">${esc(p[2])}</span><span class="grow muted">${esc(p[3])}</span></div>`).join('')}</div></div>`;
  else if (q.i >= q.n) body = `<div class="card stack result"><div class="big">${q.ok}/${q.n}</div><h2>${q.ok >= 9 ? 'Ausgezeichnetes Gehör!' : q.ok >= 7 ? 'Gut gehört!' : 'Weiter üben, das Ohr gewöhnt sich.'}</h2><div class="row" style="justify-content:center"><button class="btn primary" id="qzStart">Nochmal</button><button class="btn" id="qzBack">Zur Übersicht</button></div></div>`;
  else {
    const it = q.items[q.i];
    body = `<div class="card stack" style="align-items:center;text-align:center">
      <div class="eyebrow">Runde ${q.i + 1} von ${q.n}</div>
      <button class="say lg" id="qzPlay" aria-label="Wort noch einmal hören" style="width:72px;height:72px">${SPK}</button>
      <p class="muted">Welches Wort hast du gehört?</p>
      <div class="choices" style="width:100%;max-width:520px">${[0, 1].map(k => `<button class="choice ${q.answered ? (k === it.t ? 'right' : k === q.pick ? 'wrong' : '') : ''}" data-qa="${k}" ${q.answered ? 'disabled' : ''}><span class="grow"><b class="ku" style="font-size:1.3rem">${esc(it.p[k * 2])}</b><br><small class="muted">${esc(it.p[k * 2 + 1])}</small></span></button>`).join('')}</div>
      ${q.answered ? `<div class="row" style="justify-content:center">${sayBtn(it.p[0])}<span class="ku">${esc(it.p[0])}</span><span class="muted">·</span>${sayBtn(it.p[2])}<span class="ku">${esc(it.p[2])}</span><button class="btn primary" id="qzNext">Weiter</button></div>` : ''}
    </div>`;
  }
  return `<div class="seg" role="group" aria-label="Lautpaar">${cats.map(c => `<button data-qc="${c}" aria-pressed="${PR.quizCat === c}">${c === 'alle' ? 'Alle' : c}</button>`).join('')}</div>${body}`;
}
const pairsOf = c => c === 'alle' ? Object.values(PZ.pairs).flat() : PZ.pairs[c];
function afterHoeren() {
  $$('[data-qc]').forEach(b => b.onclick = () => { PR.quizCat = b.dataset.qc; PR.quiz = null; route(); });
  const q = PR.quiz;
  $('#qzStart') && ($('#qzStart').onclick = () => { const ps = pairsOf(PR.quizCat), items = []; for (let i = 0; i < 10; i++) { const p = ps[Math.floor(Math.random() * ps.length)]; items.push({ p, t: Math.random() < .5 ? 0 : 1 }); } PR.quiz = { items, i: 0, n: 10, ok: 0, answered: false }; route(); setTimeout(() => say(items[0].p[items[0].t * 2]), 200); });
  $('#qzBack') && ($('#qzBack').onclick = () => { PR.quiz = null; route(); });
  if (!q || q.i >= q.n) return;
  const it = q.items[q.i];
  $('#qzPlay').onclick = e => say(it.p[it.t * 2], e.currentTarget);
  $$('[data-qa]').forEach(b => b.onclick = () => { if (q.answered) return; q.pick = +b.dataset.qa; q.answered = true; if (q.pick === it.t) { q.ok++; addXP(1); } route(); });
  $('#qzNext') && ($('#qzNext').onclick = () => { q.i++; q.answered = false; if (q.i >= q.n) { const p = prs(); p.quiz[PR.quizCat] = Math.max(p.quiz[PR.quizCat] || 0, q.ok); p.qn = (p.qn || 0) + 1; addXP(2); route(); return; } route(); const n = q.items[q.i]; setTimeout(() => say(n.p[n.t * 2]), 150); });
}

/* ---------- Shadowing ---------- */
function viewShadow() {
  const sh = PR.shadow;
  const lid = PR.lesson && PR.lesson !== '__sounds' ? PR.lesson : (nextLesson() || PZ.lessons[0]).id;
  const l = lessonById(lid), sents = phrasesOf(l).filter(p => p.ku.includes(' '));
  return `<div class="card stack"><p>Beim Shadowing sprichst du jeden Satz direkt nach dem Vorbild nach, ohne Pause zum Nachdenken. Das trainiert Rhythmus, Melodie und Sprechfluss. Erst hören, dann bist du dran, wenn der Balken läuft.</p>
    <div class="row"><label class="grow stack" style="gap:6px"><span class="eyebrow">Lektion</span><select class="inp" id="shLesson" aria-label="Lektion">${lessonOptions(lid).replace(/<optgroup label="Lautschule">.*<\/optgroup>/, '')}</select></label>
    <label class="stack" style="gap:6px"><span class="eyebrow">Durchgänge</span><select class="inp" id="shRounds">${[1, 2, 3].map(n => `<option ${((sh && sh.rounds) || 2) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
    <label class="row" style="font-size:.92rem"><input type="checkbox" id="shTr" ${PR.shTr !== false ? 'checked' : ''}> Übersetzung anzeigen</label>
  </div>
  <div class="card stack shadow-stage" style="align-items:center;text-align:center;min-height:220px;justify-content:center">
    <div class="eyebrow" id="shPhase">${sents.length} Sätze bereit</div>
    <div class="prompt ku" id="shText" style="font-size:clamp(1.4rem,4vw,2rem)">${sh?.active ? '' : esc(sents[0]?.ku || '')}</div>
    <div class="muted" id="shDe">${PR.shTr !== false && !sh?.active ? esc(sents[0]?.de || '') : ''}</div>
    <div class="bar" style="width:100%;max-width:420px"><i id="shBar" style="width:0%"></i></div>
    <button class="btn primary big" id="shGo">${sh?.active ? 'Stopp' : 'Shadowing starten'}</button>
  </div>`;
}
function stopShadow() { if (PR.shadow) PR.shadow.active = false; PR.shadowTok = (PR.shadowTok || 0) + 1; stopSay(); }
function afterShadow() {
  $('#shLesson').onchange = e => { PR.lesson = e.target.value; stopShadow(); route(); };
  $('#shTr').onchange = e => { PR.shTr = e.target.checked; };
  $('#shGo').onclick = async () => {
    if (PR.shadow?.active) { stopShadow(); route(); return; }
    const l = lessonById($('#shLesson').value), sents = phrasesOf(l).filter(p => p.ku.includes(' '));
    const rounds = +$('#shRounds').value; PR.shadow = { active: true, rounds }; const tok = ++PR.shadowTok;
    $('#shGo').textContent = 'Stopp';
    const wait = ms => new Promise(r => setTimeout(r, ms));
    for (let r = 0; r < rounds; r++) for (const p of sents) {
      if (tok !== PR.shadowTok) return;
      $('#shPhase').textContent = `Durchgang ${r + 1} von ${rounds} · Hören`; $('#shText').textContent = p.ku; $('#shDe').textContent = PR.shTr !== false ? p.de : '';
      const bar = $('#shBar'); bar.style.transition = 'none'; bar.style.width = '0%';
      await say(p.ku); if (tok !== PR.shadowTok) return;
      const ms = Math.max(1600, (p.ku.length * 85) / (S.rate || 1) + 900);
      $('#shPhase').textContent = 'Jetzt du!';
      requestAnimationFrame(() => { bar.style.transition = `width ${ms}ms linear`; bar.style.width = '100%'; });
      await wait(ms + 150);
    }
    if (tok === PR.shadowTok) { PR.shadow.active = false; addXP(5); $('#shPhase').textContent = 'Geschafft! +5 XP'; $('#shGo').textContent = 'Nochmal'; }
  };
}
