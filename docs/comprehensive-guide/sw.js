const CACHE_NAME = 'localmcp-guide-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/styles/interactive.css',
  '/scripts/main.js',
  '/scripts/search.js',
  '/scripts/analytics.js',
  '/scripts/interactive.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});