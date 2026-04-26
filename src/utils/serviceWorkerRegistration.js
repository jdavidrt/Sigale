/**
 * Service Worker registration utility
 * Enables offline functionality and handles iOS/Android suspension recovery.
 *
 * Key features:
 *   - Registers SW only in production
 *   - Listens for SW controller changes and reloads gracefully
 *   - Provides helpers for cache health checks and purges
 *   - Periodic update polling (every 60 min)
 */

export const registerServiceWorker = async () => {
  // Only register in production
  if (import.meta.env.DEV) {
    console.log('[SW] Skipping registration in development mode');
    return;
  }

  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service Worker not supported in this browser');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[SW] Service Worker registered successfully:', registration.scope);

    // Check for updates periodically (every 60 minutes)
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    // Listen for new SW installs
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('[SW] New Service Worker found, installing...');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[SW] New version available — will activate on next navigation');
          // Optionally show a toast / banner here
        }
      });
    });

    // When the controlling SW changes (e.g. after skipWaiting), reload
    // to ensure the page is served by the new SW
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      console.log('[SW] Controller changed — reloading page');
      window.location.reload();
    });

    // Listen for messages from the SW (e.g. cache health results)
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { data } = event;
      if (!data) return;

      if (data.type === 'CACHE_HEALTH_RESULT') {
        console.log('[SW] Cache health:', data.healthy ? 'OK' : 'UNHEALTHY');
        if (!data.healthy) {
          // Cache is poisoned — force reload to re-fetch from network
          console.warn('[SW] Unhealthy cache detected — reloading');
          window.location.reload();
        }
      }
    });

    return registration;
  } catch (error) {
    console.error('[SW] Service Worker registration failed:', error);
  }
};

/**
 * Ask the SW to check whether the cached index.html is valid.
 * If it is poisoned, the SW will respond and we auto-reload.
 */
export const checkCacheHealth = () => {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CHECK_CACHE_HEALTH' });
  }
};

export const unregisterServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('[SW] Service Worker unregistered');
    }
  } catch (error) {
    console.error('[SW] Service Worker unregistration failed:', error);
  }
};
