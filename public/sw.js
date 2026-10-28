const V = 'darksilicon-v13';
const FILES = ['./', 'index.html', 'style.css', 'core.js', 'scene.js', 'ui.js', 'manifest.json', 'icon-192.png', 'icon-512.png',
  'fonts/cinzel-latin-600-normal.woff2', 'fonts/cinzel-latin-700-normal.woff2', 'fonts/im-fell-english-latin-400-italic.woff2', 'fonts/chakra-petch-latin-500-normal.woff2', 'fonts/chakra-petch-latin-600-normal.woff2', 'fonts/chakra-petch-latin-700-normal.woff2',
  'fonts/jetbrains-mono-latin-400-normal.woff2', 'fonts/jetbrains-mono-latin-600-normal.woff2'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      const cp = r.clone();
      caches.open(V).then(c => c.put(e.request, cp));
      return r;
    }).catch(() => caches.match(e.request).then(m => m || caches.match('index.html')))
  );
});
