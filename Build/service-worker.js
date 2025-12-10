// ServiceWorker.js
const CACHE_VERSION = '4'; 
const CACHE_NAME = 'idcoli-cache-v' + CACHE_VERSION;

// Files to cache - UPDATE THESE WITH YOUR ACTUAL FILES
const urlsToCache = [
  './',
  './index.html',
  './TemplateData/favicon.ico',
  './Build/idcoli_webbuild.loader.js',
  './Build/idcoli_webbuild.framework.js.unityweb',
  './Build/idcoli_webbuild.data.unityweb',
  './Build/idcoli_webbuild.wasm.unityweb',
  // Add other assets if needed
];

// Install event - cache files
self.addEventListener('install', event => {
  console.log('Service Worker installing with version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching files for version:', CACHE_VERSION);
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - delete old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating with version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete all caches that don't match our current version
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  // Don't cache-bust Unity WebAssembly files (they handle it internally)
  if (event.request.url.includes('.unityweb') && event.request.url.includes('?')) {
    // Remove query string for caching
    const urlWithoutQuery = event.request.url.split('?')[0];
    event.respondWith(
      caches.match(urlWithoutQuery).then(response => {
        return response || fetch(event.request);
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});

// Listen for messages from the page
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data === 'clearCache') {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => caches.delete(cacheName));
    });
  }
});