import { useState, useEffect, useRef } from 'react';
import { checkCacheHealth } from '../utils/serviceWorkerRegistration';

/**
 * Hook to detect when page becomes visible/hidden
 * Handles both iOS and Android mobile browser suspension.
 *
 * iOS:     Aggressive suspension after ~30 seconds
 * Android: Moderate suspension after ~5-10 minutes
 *
 * On resume after long suspension:
 *   1. Dispatches custom events for component-level recovery
 *   2. Triggers a SW cache health check (detects poisoned 404 cache)
 *   3. Validates the DOM is still alive (not replaced by "Not Found")
 */
export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const lastVisibleTimeRef = useRef(Date.now());

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);

      if (visible) {
        const now = Date.now();
        const timeSuspended = now - lastVisibleTimeRef.current;

        // If suspended for more than 2 minutes, run recovery checks
        if (timeSuspended > 2 * 60 * 1000) {
          console.log(
            '[PageVisibility] Resumed after',
            Math.round(timeSuspended / 1000),
            'seconds'
          );

          // 1. Let components know they should refresh stale data
          window.dispatchEvent(
            new CustomEvent('page-resumed-after-suspension', {
              detail: { timeSuspended },
            })
          );

          // 2. Ask the SW if the navigation cache is healthy
          //    (if poisoned, serviceWorkerRegistration will auto-reload)
          checkCacheHealth();

          // 3. Check if the DOM root is still alive
          //    If the page was replaced by a server 404 or blank body,
          //    the React root will be missing or empty
          requestAnimationFrame(() => {
            const root = document.getElementById('root');
            if (!root || root.children.length === 0) {
              console.warn(
                '[PageVisibility] React root is empty after resume — reloading'
              );
              window.location.reload();
              return;
            }

            // Also check for visible "Not Found" text injected by server 404
            const bodyText = document.body.innerText || '';
            if (
              bodyText.trim() === 'Not Found' ||
              bodyText.trim() === 'Cannot GET /'
            ) {
              console.warn(
                '[PageVisibility] "Not Found" detected in body — reloading'
              );
              window.location.reload();
            }
          });
        }

        lastVisibleTimeRef.current = now;
      }
    };

    // Save state before suspension
    const handlePageHide = () => {
      try {
        sessionStorage.setItem('sigale-last-active', Date.now().toString());
        sessionStorage.setItem('sigale-last-path', window.location.pathname);
      } catch (e) {
        // Ignore — sessionStorage may be unavailable
      }
    };

    // Handle bfcache restoration
    const handlePageShow = (event) => {
      if (event.persisted) {
        console.log('[PageVisibility] Restored from bfcache');
        window.dispatchEvent(new CustomEvent('page-restored-from-cache'));
        // bfcache pages may have stale SW state — check health
        checkCacheHealth();
      }
    };

    // Attach listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('blur', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []); // No dependencies — refs handle mutable state

  return { isVisible, lastVisibleTime: lastVisibleTimeRef.current };
};
