// TikTok Validator Kacery - Service Worker with Auto-Update Support
const APP_VERSION = 'v2.4.0';
const CACHE_NAME = `kacery-validator-${APP_VERSION}`;

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css?v=2.4',
  '/app.js',
  '/manifest.json',
  '/icons/kacery-logo.png',
  '/favicon.png'
];

// Install: precache core assets and immediately activate
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Precache partial warning:', err);
      });
    })
  );
});

// Activate: clean up older caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-First for HTML/JS/CSS/API to guarantee instant updates
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Bypass non-GET requests (e.g. POST /api/validate)
  if (req.method !== 'GET') {
    return;
  }

  // API calls always go directly to network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(req));
    return;
  }

  // Network-First strategy: always fetch fresh from network when online
  const fetchPromise = req.mode === 'navigate'
    ? fetch(req, { cache: 'no-cache' })
    : fetch(req);

  event.respondWith(
    fetchPromise
      .then((networkResponse) => {
        // If response is valid, clone and update cache in background
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if network is unavailable (offline mode)
        return caches.match(req).then((cached) => {
          if (cached) return cached;
          if (req.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Listen for skip waiting message from app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
