/*
 * Screen — the Astromelias full-screen shell: a `.scr` night field with the
 * seeded StarField and the CSS aura (.scr::after). Ported from lib.jsx.
 * Public 2.0 screens (landing, flow, status) render inside one of these.
 */
import { StarField } from './StarField';

export function Screen({ seed = 1, density = 40, className = '', style, children }) {
  return (
    <div className={`scr ${className}`} style={{ minHeight: '100dvh', ...style }}>
      <StarField seed={seed} density={density} />
      {children}
    </div>
  );
}

export default Screen;
