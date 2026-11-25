/* Phrasal Hero — service worker (fase 5) */
const CACHE = 'phrasalhero-v16';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'css/estils.css?v=16',
  'js/app.js?v=16',
  'js/dades.js?v=16',
  'js/filtres.js?v=16',
  'js/diccionari.js?v=16',
  'js/frases.js?v=16',
  'js/joc.js?v=16',
  'js/paraulotes.js?v=16',
  'js/preguntes.js?v=16',
  'js/progres.js?v=16',
  'js/ranking.js?v=16',
  'js/repas.js?v=16',
  'js/so.js?v=16',
  'fonts/nunito-latin.woff2?v=16',
  'fonts/press-start-2p-400-latin.woff2?v=16',
  'contingut/phrasals.json?v=3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.includes('/api/')) return;

  event.respondWith(
    fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      if (event.request.mode === 'navigate') return caches.match('index.html', { ignoreSearch: true });
      return undefined;
    }))
  );
});
