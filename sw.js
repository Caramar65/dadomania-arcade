// DadoManía PWA Service Worker - Bulletproof Offline Cache & Fast Loading
const CACHE_NAME = 'dadomania-v3.0';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/audio.js',
  '/js/dice3d.js',
  '/js/games/yahtzee.js',
  '/js/games/farkle.js',
  '/js/games/craps.js',
  '/js/games/pig.js',
  '/js/pwa.js',
  '/js/supabase.js',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-maskable.svg'
];

// Install: Cache core application shell safely with Promise.allSettled
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((asset) => {
          return fetch(asset, { cache: 'no-cache' })
            .then((response) => {
              if (response && response.status === 200) {
                return cache.put(asset, response);
              }
            })
            .catch((err) => {
              console.warn('PWA Precache advertencia:', asset, err);
            });
        })
      );
    })
  );
});

// Activate: Clean up old versions of cache and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('PWA eliminando caché antigua:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Always return a valid Response, NEVER undefined
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // For external CDNs (Supabase, fonts, etc.): Network with cache fallback
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For local assets & navigation: Network first with fast cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(async () => {
        // If network failed (offline or connection dropped), check cache
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // If it's a page navigation, return the cached index.html or root
        if (event.request.mode === 'navigate') {
          const indexCached = (await caches.match('/index.html')) || (await caches.match('/'));
          if (indexCached) return indexCached;
        }

        // Return a clean fallback response rather than throwing ERR_FAILED
        return new Response('Sin conexión a internet. Abre la app cuando tengas red.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
        });
      })
  );
});
