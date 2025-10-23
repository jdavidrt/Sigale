import { useState, useEffect } from 'react';

/**
 * Hook to detect when page becomes visible/hidden
 * Handles both iOS and Android mobile browser suspension
 *
 * iOS: Aggressive suspension after ~30 seconds
 * Android: Moderate suspension after ~5-10 minutes
 */
export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [lastVisibleTime, setLastVisibleTime] = useState(Date.now());

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);

      if (visible) {
        const now = Date.now();
        const timeSuspended = now - lastVisibleTime;

        // If suspended for more than 5 minutes, trigger a state refresh
        if (timeSuspended > 5 * 60 * 1000) {
          console.log('[PageVisibility] Page was suspended for', Math.round(timeSuspended / 1000), 'seconds');
          // Trigger a custom event that components can listen to
          window.dispatchEvent(new CustomEvent('page-resumed-after-suspension', {
            detail: { timeSuspended }
          }));
        }

        setLastVisibleTime(now);
      }
    };

    // Handle page becoming hidden (user switches apps)
    const handlePageHide = (event) => {
      console.log('[PageVisibility] Page hidden/backgrounded');
      // Save critical state to localStorage before suspension
      // This helps both iOS and Android recover gracefully
      try {
        sessionStorage.setItem('sigale-last-active', Date.now().toString());
        sessionStorage.setItem('sigale-last-path', window.location.pathname);
      } catch (e) {
        console.warn('[PageVisibility] Could not save state:', e);
      }
    };

    // Handle page becoming visible again
    const handlePageShow = (event) => {
      console.log('[PageVisibility] Page shown/foregrounded');

      // Check if page was loaded from cache (bfcache)
      if (event.persisted) {
        console.log('[PageVisibility] Page restored from bfcache');
        // Reload critical data if needed
        window.dispatchEvent(new CustomEvent('page-restored-from-cache'));
      }
    };

    // Primary event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // iOS Safari specific events
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('blur', handleVisibilityChange);

    // Page lifecycle events (works on both iOS and Android Chrome)
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);

    // Android Chrome specific: beforeunload for graceful cleanup
    const handleBeforeUnload = (event) => {
      // Don't show confirmation dialog, just save state
      try {
        sessionStorage.setItem('sigale-last-active', Date.now().toString());
      } catch (e) {
        // Ignore errors in cleanup
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [lastVisibleTime]);

  return { isVisible, lastVisibleTime };
};
