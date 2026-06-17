/*
 * Wordmark — the "Sígale" / "Astromelias" lockup in --font-display.
 * Ported from docs/design2.0/lib.jsx. `swash` holds character indices to
 * render italic for the flyer's flourish (e.g. swash={[0, 4]}).
 */
import { Fragment } from 'react';

export function Wordmark({ text, swash = [], style, className = '' }) {
  const chars = text.split('');
  return (
    <div className={'wordmark ' + className} style={style}>
      {chars.map((c, i) =>
        swash.includes(i) ? (
          <span key={i} className="sw">
            {c}
          </span>
        ) : (
          <Fragment key={i}>{c}</Fragment>
        ),
      )}
    </div>
  );
}

export default Wordmark;
