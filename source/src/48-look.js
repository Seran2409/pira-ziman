/* ---------- look: juicy flag tints on every tab ----------
   After each page renders, top-level cards and stat tiles get the widget tints of the start page
   in turn (red, gold, green). Cards that already carry a tint keep it and set the rhythm; the
   bridge stays neutral so its arches read clearly. Levels (Lernpfad, Lesen) are coloured in CSS. */
const TINTS = ['w-red', 'w-sun', 'w-green'];
function tintPage(root) {
  const top = el => !el.parentElement.closest('.card, .widget, .stat');
  let i = 0;
  $$('.card', root).filter(top).forEach(c => {
    const own = TINTS.findIndex(t => c.classList.contains(t));
    if (own >= 0) { i = own + 1; return; }
    if (c.classList.contains('bridge-wrap') || c.querySelector('.bridge-wrap')) return;
    c.classList.add('widget', TINTS[i++ % 3]);
  });
  let k = 0;
  $$('.stat', root).filter(top).forEach(s => { if (!TINTS.some(t => s.classList.contains(t))) s.classList.add(TINTS[k++ % 3]); });
}
function afterRoute(m) { tintPage(m); }
