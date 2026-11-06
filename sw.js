// Network-first with cache fallback: always fresh when online, still works offline.
const CACHE = 'banqi-v1';
const FILES = ['./', 'index.html', 'style.css', 'favicon.svg', 'rules.js', 'engine.js', 'ui.js'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request))
  );
});