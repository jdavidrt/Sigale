/*
 * StarField — the seeded night-sky layer behind every Astromelias screen.
 * Ported from docs/design2.0/lib.jsx. A deterministic PRNG (mulberry32)
 * keeps each screen's star layout stable across renders for a given seed,
 * so the sky doesn't "shimmer" on every state change.
 *
 * Decorative only: position:absolute, inset:0, z-index:0, pointer-events:none,
 * aria-hidden. Pair it with the `.scr` aura (see astromelias.css).
 */

// Deterministic PRNG so star layouts are stable per seed.
function mulberry(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function StarField({ seed = 1, w = 390, h = 844, density = 40 }) {
  const rnd = mulberry(seed * 9176 + 17);
  const count = Math.round(((w * h) / 5200) * (density / 40));
  const stars = [];
  for (let i = 0; i < count; i++) {
    const big = rnd() > 0.92;
    const s = big ? 2.2 + rnd() * 1.3 : 0.7 + rnd() * 1.2;
    const op = big ? 0.7 + rnd() * 0.3 : 0.18 + rnd() * 0.55;
    stars.push({
      left: (rnd() * 100).toFixed(2) + '%',
      top: (rnd() * 100).toFixed(2) + '%',
      width: s.toFixed(2) + 'px',
      height: s.toFixed(2) + 'px',
      opacity: op.toFixed(2),
      boxShadow: big ? '0 0 ' + (3 + rnd() * 4).toFixed(1) + 'px rgba(255,255,255,0.8)' : 'none',
    });
  }
  return (
    <div className="starfield" aria-hidden="true">
      {stars.map((st, i) => (
        <span key={i} className="star" style={st} />
      ))}
    </div>
  );
}

export default StarField;
