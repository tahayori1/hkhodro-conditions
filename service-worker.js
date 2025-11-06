const STATIC_CACHE_NAME = 'persian-car-sale-static-v2';
const DATA_CACHE_NAME = 'persian-car-sale-data-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/vite.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Opened static cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [STATIC_CACHE_NAME, DATA_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  const apiUrl = 'https://api.hoseinikhodro.com/webhook/';

  // API requests (GET only): Network-first, then cache.
  if (event.request.url.startsWith(apiUrl) && event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // If response is good, cache it.
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(DATA_CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, try to serve from cache.
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For non-GET API requests, just fetch from network.
  if (event.request.url.startsWith(apiUrl)) {
      event.respondWith(fetch(event.request));
      return;
  }

  // All other requests (static assets, pages): Cache-first, then network.
  event.respondWith(
    caches.match(event.request).then(response => {
      // Return from cache if found.
      if (response) {
        return response;
      }
      // Otherwise, fetch from network.
      return fetch(event.request).then(networkResponse => {
        // If we get a valid response, cache it for future use.
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(STATIC_CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});