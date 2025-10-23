import { useState, useEffect } from 'react';

/**
 * Hook to handle PWA installation
 * Works on both Android Chrome (automatic prompt) and iOS Safari (manual)
 */
export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      console.log('[PWA] App is running in standalone mode');
    }

    // Android Chrome: Capture the beforeinstallprompt event
    const handleBeforeInstallPrompt = (event) => {
      console.log('[PWA] beforeinstallprompt event fired (Android Chrome)');
      // Prevent the default install prompt
      event.preventDefault();
      // Store the event for later use
      setDeferredPrompt(event);
      setIsInstallable(true);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // iOS Safari: Check if it's an iOS device without standalone mode
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && !isInStandaloneMode) {
      // On iOS, the app is installable but we can't trigger it programmatically
      setIsInstallable(true);
      console.log('[PWA] iOS detected - manual installation available');
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Function to trigger the install prompt (Android Chrome only)
  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.warn('[PWA] No install prompt available');
      return false;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] User response: ${outcome}`);

      // Clear the deferred prompt
      setDeferredPrompt(null);
      setIsInstallable(false);

      return outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Error showing install prompt:', error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    canPrompt: !!deferredPrompt, // True only on Android Chrome
  };
};
