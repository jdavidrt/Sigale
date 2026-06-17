/*
 * Ic — the Astromelias stroke icon set (ported from docs/design2.0/lib.jsx).
 * One compact <svg> per glyph, 24-viewbox, currentColor, stroke ~1.7.
 * Use as the canonical icon throughout the 2.0 screens; `wa` is the
 * WhatsApp glyph used across the purchase flow.
 *
 *   <Ic n="ticket" />            // stroke, size 22
 *   <Ic n="check" s={18} />      // custom size
 *   <Ic n="star" fill />         // filled variant
 */

const ICONS = {
  home: 'M3 11.5 12 4l9 7.5M5 10v9h5v-5h4v5h5v-9',
  menu: 'M4 7h16M4 12h16M4 17h16',
  pin: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z',
  pinDot: 'M12 10.5h.01',
  cal: 'M4 6.5h16v14H4zM4 10h16M8 3.5v4M16 3.5v4',
  clock: 'M12 12V7.5M12 12l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  ticket:
    'M3 8.5A1.5 1.5 0 0 1 4.5 7h15A1.5 1.5 0 0 1 21 8.5V10a2 2 0 0 0 0 4v1.5A1.5 1.5 0 0 1 19.5 17h-15A1.5 1.5 0 0 1 3 15.5V14a2 2 0 0 0 0-4Z',
  plus: 'M12 5v14M5 12h14',
  chevD: 'M6 9.5 12 15l6-5.5',
  chevR: 'M9.5 6 15 12l-5.5 6',
  arrowL: 'M15 6l-6 6 6 6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c0-3.3 3.1-6 7-6s7 2.7 7 6',
  id: 'M3.5 6h17v12h-17zM7 10a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 7 10ZM4.6 15c.4-1.7 1.3-2.6 2.4-2.6s2 .9 2.4 2.6M13 9h5M13 12.5h5M13 16h3',
  phone: 'M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5V18a2 2 0 0 1-2 2A14 14 0 0 1 5 6 2 2 0 0 1 5 4Z',
  wa: 'M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Zm-3 5.2c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2.1.4 0 .6l-.5.6c-.1.2-.2.3 0 .6a6 6 0 0 0 2.6 2.3c.3.1.5.1.6-.1l.5-.6c.2-.2.4-.2.6-.1l1.5.8c.2.1.4.2.4.4s0 .9-.3 1.3c-.3.4-1 .8-1.5.8a7 7 0 0 1-5.9-5.9c0-.5 0-1.3.5-2.6Z',
  check: 'M5 12.5 10 17l9-10',
  copy: 'M9 9V5.5A1.5 1.5 0 0 1 10.5 4h8A1.5 1.5 0 0 1 20 5.5v8a1.5 1.5 0 0 1-1.5 1.5H15M4 10.5h9.5a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 19v-7A1.5 1.5 0 0 1 4 10.5Z',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2.5v2.5H14zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z',
  share: 'M12 15V4m0 0L8 8m4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5',
  star: 'M12 3.5l2.5 5.6 6 .6-4.5 4 1.3 6-5.3-3.1L6.7 19.7 8 13.7l-4.5-4 6-.6z',
  bell: 'M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6ZM10 19a2 2 0 0 0 4 0',
  lock: 'M6 10.5V8a6 6 0 0 1 12 0v2.5M5 10.5h14v9.5H5zM12 14.5v2.5',
  sparkle: 'M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z',
};

export function Ic({ n, s = 22, sw = 1.7, fill = false, style, className }) {
  const d = ICONS[n] || '';
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'}
      stroke={fill ? 'none' : 'currentColor'}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      aria-hidden="true"
    >
      {d
        .split('M')
        .filter(Boolean)
        .map((seg, i) => (
          <path key={i} d={'M' + seg} />
        ))}
    </svg>
  );
}

export default Ic;
