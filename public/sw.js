// Service Worker for Sigale PWA
// Handles offline persistence, caching, and iOS/Android suspension recovery
// Key guarantees:
//   1. Navigation ALWAYS resolves to valid index.html (never a 404)
//   2. Non-200 responses are NEVER cached
//   3. Poisoned cache entries are detected and purged
//   4. Fetch requests have timeouts to survive iOS suspension

const CACHE_NAME = 'sigale-v2';
const NAVIGATION_TIMEOUT_MS = 4000;
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ---------------------------------------------------------------------------
// Inline fallback HTML — served when both network AND cache fail
// Redirects to root after a brief loading animation
// ---------------------------------------------------------------------------
const OFFLINE_FALLBACK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sigale - Loading...</title>
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
    .container { text-align: center; padding: 2rem; }
    .spinner {
      width: 50px; height: 50px;
      border: 4px solid rgba(255,255,255,0.1);
      border-top-color: #FF6B6B;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h1 { margin: 0 0 0.5rem; font-size: 1.5rem; }
    p  { margin: 0; opacity: 0.7; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>Reconnecting...</h1>
    <p>Please wait while we restore your session</p>
  </div>
  <script>
    setTimeout(function() { window.location.replace('/'); }, 2000);
  </script>
</body>
</html>`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if a Response looks like a valid HTML page we should cache.
 * Rejects 404s, 5xx, opaque responses, and non-HTML content-types.
 */
function isValidHTMLResponse(response) {
  if (!response || !response.ok) return false;
  if (response.status !== 200) return false;
  const ct = response.headers.get('content-type') || '';
  return ct.includes('text/html');
}

/**
 * Returns true if a Response is cacheable (status 200, not opaque error).
 */
function isCacheableResponse(response) {
  return response && response.ok && response.status === 200;
}

/**
 * Wraps a fetch with an AbortController timeout.
 * Crucial for iOS — prevents hanging fetches after tab suspension.
 */
function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(request, { signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
}

/**
 * Builds an inline fallback Response when everything else fails.
 */
function offlineFallbackResponse() {
  return new Response(OFFLINE_FALLBACK_HTML, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * Validates that a cached index.html is still good.
 * If the cache holds a 404 or non-HTML, purge and return null.
 */
async function getValidCachedIndex() {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match('/index.html');

  if (!cached) return null;

  // Clone so we can read and still return the original
  const clone = cached.clone();
  const ct = clone.headers.get('content-type') || '';

  // Basic sanity: must be HTML and status 200
  if (clone.status !== 200 || !ct.includes('text/html')) {
    console.warn('[SW] Poisoned cache detected for /index.html — purging');
    await cache.delete('/index.html');
    return null;
  }

  // Deep sanity: check first bytes for "Not Found" text (Render 404 bodies)
  try {
    const text = await clone.text();
    const head = text.substring(0, 500).toLowerCase();
    if (
      (head.includes('not found') && !head.includes('sigale')) ||
      head.includes('cannot get') ||
      head.includes('404')
    ) {
      console.warn('[SW] Cached index.html contains 404 content — purging');
      await cache.delete('/index.html');
      return null;
    }
  } catch {
    // If we cannot read the body, treat as invalid
    console.warn('[SW] Cannot read cached index.html — purging');
    await cache.delete('/index.html');
    return null;
  }

  // Return a fresh clone (the ones above were consumed)
  return await cache.match('/index.html');
}

// ---------------------------------------------------------------------------
// Install — pre-cache essentials
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching essential files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Install complete, skipping waiting');
        return self.skipWaiting();
      })
  );
});

// ---------------------------------------------------------------------------
// Activate — clean old caches + claim clients immediately
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        )
      )
      .then(() => {
        console.log('[SW] Claiming all clients');
        return self.clients.claim();
      })
  );
});

// ---------------------------------------------------------------------------
// Fetch — the heart of the SW
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // -----------------------------------------------------------------------
  // NAVIGATION REQUESTS (mode === 'navigate')
  // Strategy: network-first with timeout, validated cache fallback, inline last-resort
  // -----------------------------------------------------------------------
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // -----------------------------------------------------------------------
  // SAME-ORIGIN ASSET REQUESTS (JS, CSS, images, etc.)
  // Strategy: stale-while-revalidate (fast from cache, update in background)
  // -----------------------------------------------------------------------
  if (url.origin === self.location.origin) {
    event.respondWith(handleSameOriginAsset(request));
    return;
  }

  // -----------------------------------------------------------------------
  // CROSS-ORIGIN REQUESTS (CDNs, APIs)
  // Strategy: network-first with cache fallback
  // -----------------------------------------------------------------------
  event.respondWith(handleCrossOrigin(request));
});

// ---------------------------------------------------------------------------
// Navigation handler — the critical path for the "Not Found" fix
// ---------------------------------------------------------------------------
async function handleNavigation(request) {
  // Step 1: Try network with a timeout
  try {
    const networkResponse = await fetchWithTimeout(request, NAVIGATION_TIMEOUT_MS);

    // CRITICAL: Only cache if the response is a valid 200 HTML page
    if (isValidHTMLResponse(networkResponse)) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put('/index.html', networkResponse.clone());
      console.log('[SW] Navigation: served + cached from network');
      return networkResponse;
    }

    // Network returned a non-200 (404, 500, etc.) — do NOT cache it
    console.warn('[SW] Navigation: network returned status', networkResponse.status, '— falling back to cache');

    // Fall through to cache
  } catch (err) {
    // Network failed (offline, timeout, iOS kill, etc.)
    console.log('[SW] Navigation: network failed —', err.name || err.message);
  }

  // Step 2: Try validated cache
  const cachedIndex = await getValidCachedIndex();
  if (cachedIndex) {
    console.log('[SW] Navigation: served from validated cache');
    return cachedIndex;
  }

  // Step 3: Last resort — inline fallback
  console.warn('[SW] Navigation: all sources exhausted — serving inline fallback');
  return offlineFallbackResponse();
}

// ---------------------------------------------------------------------------
// Same-origin asset handler (stale-while-revalidate)
// ---------------------------------------------------------------------------
async function handleSameOriginAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    // Revalidate in background (fire-and-forget)
    fetchWithTimeout(request, 10000)
      .then((response) => {
        if (isCacheableResponse(response)) {
          cache.put(request, response.clone());
        }
      })
      .catch(() => { /* background update failed, ignore */ });

    return cached;
  }

  // Not cached — fetch from network
  try {
    const response = await fetchWithTimeout(request, 10000);
    if (isCacheableResponse(response)) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    console.log('[SW] Asset request failed:', request.url);
    return new Response('Offline — resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// ---------------------------------------------------------------------------
// Cross-origin handler (network-first)
// ---------------------------------------------------------------------------
async function handleCrossOrigin(request) {
  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline — resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------
self.addEventListener('message', (event) => {
  const { data } = event;
  if (!data) return;

  if (data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING');
    self.skipWaiting();
  }

  // Allow the app to request a cache health check
  if (data.type === 'CHECK_CACHE_HEALTH') {
    (async () => {
      const valid = await getValidCachedIndex();
      // Notify the requesting client
      const client = await self.clients.get(event.source.id);
      if (client) {
        client.postMessage({
          type: 'CACHE_HEALTH_RESULT',
          healthy: !!valid,
        });
      }
    })();
  }

  // Allow the app to force-purge the navigation cache
  if (data.type === 'PURGE_NAVIGATION_CACHE') {
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete('/index.html');
      await cache.delete('/');
      console.log('[SW] Navigation cache purged by client request');
    })();
  }
});
