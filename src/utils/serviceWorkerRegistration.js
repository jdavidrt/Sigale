/**
 * Service Worker registration utility
 * Enables offline functionality and fixes iOS tab suspension issues
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

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // Check every hour

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('[SW] New Service Worker found, installing...');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[SW] New version available, please refresh');
          // You could show a toast notification here
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('[SW] Service Worker registration failed:', error);
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
