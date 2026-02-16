// Service Worker for offline persistence and caching
// Works on both iOS Safari and Android Chrome
const CACHE_NAME = 'sigale-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching essential files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Service worker installed, skipping waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated, claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // For navigation requests, always serve index.html (SPA fallback)
  // Critical for both iOS and Android to handle React Router routes
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put('/index.html', responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          console.log('[SW] Navigation request failed, serving from cache');
          return caches.match('/index.html').then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }

            // Cache also failed (evicted on mobile) - serve inline HTML fallback
            console.warn('[SW] Cache miss for index.html, serving inline fallback');
            const fallbackHTML = `
              <!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Sígale - Loading...</title>
                <style>
                  body {
                    margin: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #1A1A2E 0%, #16213E 100%);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    color: white;
                  }
                  .container {
                    text-align: center;
                    padding: 2rem;
                  }
                  .spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid rgba(255,255,255,0.1);
                    border-top-color: #FF6B6B;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1.5rem;
                  }
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                  h1 { margin: 0 0 0.5rem; font-size: 1.5rem; }
                  p { margin: 0; opacity: 0.7; font-size: 0.9rem; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="spinner"></div>
                  <h1>Reconnecting...</h1>
                  <p>Please wait while we restore your session</p>
                </div>
                <script>
                  // Redirect to root to trigger full app reload
                  setTimeout(() => {
                    window.location.href = '/';
                  }, 1500);
                </script>
              </body>
              </html>
            `;

            return new Response(fallbackHTML, {
              status: 200,
              headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-cache'
              }
            });
          });
        })
    );
    return;
  }

  // For same-origin requests, use cache-first strategy (faster on mobile)
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache, update cache in background
          fetch(request).then((response) => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
          }).catch(() => {
            // Ignore background update errors
          });
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Clone and cache the response
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return response;
          })
          .catch(() => {
            // Network failed and not in cache
            console.log('[SW] Request failed and not in cache:', request.url);
            return new Response('Offline - resource not available', {
              status: 503,
              statusText: 'Service Unavailable',
            });
          });
      })
    );
    return;
  }

  // For cross-origin requests (CDNs, APIs), network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Try cache as fallback
        return caches.match(request);
      })
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message');
    self.skipWaiting();
  }
});
