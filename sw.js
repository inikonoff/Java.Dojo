const CACHE = 'javadojo-v3';

// Skip waiting immediately when told to
self.addEventListener('message', e => {
  if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Delete ALL old caches
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Never cache API calls
  if(e.request.url.includes('workers.dev') ||
     e.request.url.includes('groq.com') ||
     e.request.url.includes('emkc.org') ||
     e.request.url.includes('googleapis.com') ||
     e.request.url.includes('cloudflare.com')) {
    return;
  }

  // Network first — always try to get fresh version
  // Fall back to cache only if completely offline
  e.respondWith(
    fetch(e.request, { cache: 'no-store' })
      .then(response => {
        if(response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
