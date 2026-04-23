// ===================================
//   BRAINBALANCE — SERVICE WORKER
//   Dev: no cache | Prod: cache first
// ===================================

const CACHE_NAME = 'brainbalance-v3';
const DEV_MODE = self.location.hostname === 'localhost' || 
                 self.location.hostname === '127.0.0.1';

const STATIC_ASSETS = [
  '/',
  '/css/style.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/chat.js',
  '/js/voice.js',
  '/js/gamification.js',
  '/js/dashboard.js',
  '/js/pwa.js',
  '/manifest.json'
];

// Install
self.addEventListener('install', (event) => {
  if (DEV_MODE) {
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API calls — always network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response(
        JSON.stringify({ error: 'You are offline. Please check your connection.' }),
        { headers: { 'Content-Type': 'application/json' } }
      ))
    );
    return;
  }

  // DEV MODE — always fetch fresh, never cache
  if (DEV_MODE) {
    event.respondWith(fetch(event.request));
    return;
  }

  // PROD MODE — cache first for static assets
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
      )
      .catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});