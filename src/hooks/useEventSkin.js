/*
 * useEventSkin — swaps the `skin-*` class on <body> to match the resolved
 * event's slug, on top of the fixed `.t3` direction-theme class already set
 * in index.html. Public pages that render event-branded content (landing,
 * purchase wizard) call this with the loaded event's slug.
 *
 * Contract: every skin file (src/styles/skins/*.skin.css) must define the
 * full token set documented at the top of astromelias.skin.css. Unknown or
 * not-yet-loaded slugs fall back to `skin-astromelias` — nothing renders
 * unskinned. Cleanup on unmount/slug-change restores the previous class so
 * navigating away (or back to a different event) can never leak one event's
 * skin onto another page.
 */
import { useEffect } from 'react';

const DEFAULT_SKIN = 'skin-astromelias';

// slug -> body class. Add an entry here + a matching skins/<name>.skin.css
// (imported in App.jsx) to give another event its own look.
const EVENT_SKINS = {
  'rock-en-vivo': 'skin-rock',
};

export function useEventSkin(slug) {
  useEffect(() => {
    const skinClass = EVENT_SKINS[slug] || DEFAULT_SKIN;
    const body = document.body;
    const prevClasses = Array.from(body.classList).filter((c) => c.startsWith('skin-'));
    prevClasses.forEach((c) => body.classList.remove(c));
    body.classList.add(skinClass);
    return () => {
      body.classList.remove(skinClass);
      // Restore whatever skin class(es) were present before this effect ran
      // (normally just the default) so an unmount never leaves <body> with
      // no skin class at all.
      prevClasses.forEach((c) => body.classList.add(c));
    };
  }, [slug]);
}

export default useEventSkin;
