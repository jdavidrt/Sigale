/*
 * Screen — the Astromelias full-screen shell: a `.scr` night field with the
 * seeded StarField and the CSS aura (.scr::after). Public screens and the
 * organizer chrome render inside one of these.
 */
import { StarField } from './StarField';

export function Screen({ seed = 1, density = 40, className = '', style, children, starColor, starGlowRgb }) {
  return (
    <div className={`scr ${className}`} style={{ minHeight: '100dvh', ...style }}>
      <StarField seed={seed} density={density} starColor={starColor} starGlowRgb={starGlowRgb} />
      {children}
    </div>
  );
}

export default Screen;
