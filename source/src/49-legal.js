/* ---------- legal pages & support ----------
   Adds "Über die App" to the profile: links to Impressum, Datenschutz and Nutzungsbedingungen
   (static pages next to index.html, written by tools/build_pages.py from source/site/) and an
   optional donation link. The stores do not allow donation links for private developers inside
   native apps, so the link only shows on the website, never inside the Capacitor app. */
const LEGAL = {
  donate: '',   // e.g. 'https://ko-fi.com/…' — empty: no donation link at all
  pages: [['impressum.html', 'Impressum'], ['datenschutz.html', 'Datenschutz'], ['nutzungsbedingungen.html', 'Nutzungsbedingungen']]
};
const isNative = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
function legalHTML() {
  const links = LEGAL.pages.map(([href, t]) => `<a class="btn sm" href="${href}">${t}</a>`).join('');
  const give = LEGAL.donate && !isNative()
    ? `<p class="muted">Pira Ziman ist kostenlos und werbefrei. Wenn dir die App hilft, kannst du die Arbeit freiwillig unterstützen.</p>
       <div class="row"><a class="btn primary" href="${esc(LEGAL.donate)}" target="_blank" rel="noopener">Unterstützen</a></div>` : '';
  return `<section class="card stack"><h2>Über die App</h2>
    <p class="muted">Kostenlos, ohne Werbung, ohne Konto. Dein Lernstand und deine Aufnahmen bleiben auf diesem Gerät.</p>
    ${give}<div class="row">${links}</div></section>`;
}
const _profileLegal = VIEWS.profile;
VIEWS.profile = () => _profileLegal() + legalHTML();
VIEWS.profile.after = _profileLegal.after;
