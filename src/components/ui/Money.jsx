/*
 * Money — yellow tabular price token (Astromelias .price/.cur).
 * Delegates to formatCurrency() so the rendered value can never drift
 * from the rest of the app; it only restyles the leading "$" as a small
 * superscript currency mark. Use everywhere a price appears.
 *
 *   <Money v={30000} />          // -> $30.000 (per formatCurrency)
 *   <Money v={30000} className="price big" />
 */
import { formatCurrency } from '../../utils/timeFormat';

export function Money({ v, className = 'price' }) {
  const formatted = formatCurrency(v); // e.g. "$30.000"
  const digits = formatted.replace(/^\$/, '');
  return (
    <span className={className}>
      <span className="cur">$</span>
      {digits}
    </span>
  );
}

export default Money;
