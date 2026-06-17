/* lib.jsx — shared primitives for the Astromelias reskin
   Exports to window: StarField, StatusBar, TopBar, Ic, Wordmark, Money, Screen */

// ── deterministic PRNG so star layouts are stable per seed ──
function mulberry(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Star density was set to 40 (of 100) by the user.
function StarField({ seed = 1, w = 390, h = 844, density = 40 }) {
  const rnd = mulberry(seed * 9176 + 17);
  const count = Math.round((w * h) / 5200 * (density / 40));
  const stars = [];
  for (let i = 0; i < count; i++) {
    const big = rnd() > 0.92;
    const s = big ? 2.2 + rnd() * 1.3 : 0.7 + rnd() * 1.2;
    const op = big ? 0.7 + rnd() * 0.3 : 0.18 + rnd() * 0.55;
    stars.push({
      left: (rnd() * 100).toFixed(2) + '%',
      top: (rnd() * 100).toFixed(2) + '%',
      width: s.toFixed(2) + 'px', height: s.toFixed(2) + 'px',
      opacity: op.toFixed(2),
      boxShadow: big ? '0 0 ' + (3 + rnd() * 4).toFixed(1) + 'px rgba(255,255,255,0.8)' : 'none',
    });
  }
  return (
    <div className="starfield" aria-hidden="true">
      {stars.map((st, i) => <span key={i} className="star" style={st} />)}
    </div>
  );
}

// ── icon set (stroke, currentColor) ───────────────────────
const ICONS = {
  home: 'M3 11.5 12 4l9 7.5M5 10v9h5v-5h4v5h5v-9',
  menu: 'M4 7h16M4 12h16M4 17h16',
  pin: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z',
  pinDot: 'M12 10.5h.01',
  cal: 'M4 6.5h16v14H4zM4 10h16M8 3.5v4M16 3.5v4',
  clock: 'M12 12V7.5M12 12l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  ticket: 'M3 8.5A1.5 1.5 0 0 1 4.5 7h15A1.5 1.5 0 0 1 21 8.5V10a2 2 0 0 0 0 4v1.5A1.5 1.5 0 0 1 19.5 17h-15A1.5 1.5 0 0 1 3 15.5V14a2 2 0 0 0 0-4Z',
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
function Ic({ n, s = 22, sw = 1.7, fill = false, style }) {
  const d = ICONS[n] || '';
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'}
      stroke={fill ? 'none' : 'currentColor'} strokeWidth={sw} strokeLinecap="round"
      strokeLinejoin="round" style={style}>
      {d.split('M').filter(Boolean).map((seg, i) => <path key={i} d={'M' + seg} />)}
    </svg>
  );
}

// ── status bar (iOS-ish) ──────────────────────────────────
function StatusBar({ time = '9:41' }) {
  return (
    <div className="statusbar">
      <span>{time}</span>
      <span className="sb-ic">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></svg>
        <svg width="16" height="11" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.5c2 0 3.9.8 5.3 2.1l1.1-1.2A9.5 9.5 0 0 0 8 .8 9.5 9.5 0 0 0 1.6 3.4l1.1 1.2A7.5 7.5 0 0 1 8 2.5Zm0 3.2c1.1 0 2.1.4 2.9 1.2l1.1-1.2A6 6 0 0 0 8 5a6 6 0 0 0-4 1.9l1.1 1.2A4 4 0 0 1 8 5.7Zm0 3.1 1.9 2-1.9-2Z"/><circle cx="8" cy="9.4" r="1.6"/></svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none"><rect x="1" y="1" width="21" height="10" rx="2.5" stroke="currentColor" strokeOpacity="0.5"/><rect x="3" y="3" width="16" height="6" rx="1" fill="currentColor"/><rect x="23.5" y="4" width="1.6" height="4" rx="0.8" fill="currentColor" fillOpacity="0.5"/></svg>
      </span>
    </div>
  );
}

// organizer top bar (home icon + MENU)
function TopBar() {
  return (
    <div className="topbar">
      <button className="tb-btn icon"><Ic n="home" s={20} /></button>
      <button className="tb-btn"><Ic n="menu" s={18} /> Menu</button>
    </div>
  );
}

// stylised wordmark with a couple of italic-swash letters for flyer flavour
function Wordmark({ text, swash = [], style, className = '' }) {
  const chars = text.split('');
  return (
    <div className={'wordmark ' + className} style={style}>
      {chars.map((c, i) => swash.includes(i)
        ? <span key={i} className="sw">{c}</span>
        : <React.Fragment key={i}>{c}</React.Fragment>)}
    </div>
  );
}

// currency — matches formatCurrency() "$30.000" (CO grouping)
function Money({ v, className = 'price' }) {
  const s = v.toLocaleString('es-CO');
  return <span className={className}><span className="cur">$</span>{s}</span>;
}

// phone screen wrapper
function Screen({ dir, seed, h = 844, statusTime, children, density = 40 }) {
  return (
    <div className={'scr ' + dir} style={{ height: '100%' }}>
      <StarField seed={seed} h={h} density={density} />
      {children}
    </div>
  );
}

Object.assign(window, { StarField, Ic, StatusBar, TopBar, Wordmark, Money, Screen });
