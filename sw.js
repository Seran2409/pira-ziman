/* Pira Ziman · offline cache. Pages load fresh when online; recordings are kept once heard. */
const V = 'pira-v4';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin && u.pathname.includes('/audio/')) {
    e.respondWith(caches.open(V).then(c => c.match(r).then(hit => hit || fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }))));
    return;
  }
  if (u.origin === location.origin) {
    e.respondWith(fetch(r).then(res => { if (res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put(r, copy)); } return res; })
      .catch(() => caches.match(r).then(hit => hit || caches.match('index.html'))));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.open(V).then(c => c.match(r).then(hit => hit || fetch(r).then(res => { c.put(r, res.clone()); return res; }))));
  }
});
