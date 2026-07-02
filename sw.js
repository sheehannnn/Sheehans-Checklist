const CACHE = 'sheehan-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install: cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: serve from cache first, fall back to network, then update cache
self.addEventListener('fetch', e => {
  // Don't intercept Firebase requests — always go to network for sync
  if(e.request.url.includes('firebaseio.com') || e.request.url.includes('googleapis.com/identitytoolkit')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request).then(response => {
        if(response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => cached); // if network fails, use cache

      return cached || networkFetch;
    })
  );
});

// Push notifications (for future use)
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  self.registration.showNotification(data.title || "Sheehan's Checklist", {
    body: data.body || 'You have tasks due!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'checklist',
    requireInteraction: true
  });
});
