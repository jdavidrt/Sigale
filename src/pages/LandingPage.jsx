/*
 * LandingPage — /evento/:id  (public, cold-arrival first impression)
 * Flyer-forward, one unmistakable buy CTA. Ported from docs/design2.0/proto.jsx
 * and the vanilla parallax prototype (prototype-2.0/app.js → wireLanding).
 *
 * Structure: a single .lscroll owns the scroll position; a full-bleed .lhero
 * holds the flyer, a sticky .lhead collapses into view as the flyer leaves,
 * and .lbody (stage tile → buy → future stages → line-up → venue) rides up
 * over it. The flyer translates/scales/fades, floating ornaments drift at
 * their own speeds, and the "Desliza" hint and top kicker fade out.
 *
 * Motion is gated behind prefers-reduced-motion: when the user asks to reduce
 * motion, the parallax math is skipped and only the collapsed header toggles.
 * Reads the local/active event (EventContext) with the SAMPLE_EVENT fallback
 * so it always looks intentional.
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import { StarField } from '../components/ui/StarField';
import { Ic } from '../components/ui/Ic';
import { SAMPLE_EVENT, resolveActiveStage, stageCupos } from '../utils/sampleEvent';
import { formatCurrency, formatTo12Hour, parseLocalDate } from '../utils/timeFormat';
import { whatsappLink } from '../api/purchases';
import flyerImg from '../assets/flyer.png';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Floating ornaments over the line-up, each with its own parallax speed.
const FLOATS = [
  { left: '8%', top: 60, color: 'var(--yellow)', size: 12, icon: 'sparkle', speed: 0.07 },
  { left: '82%', top: 30, color: 'var(--lilac)', size: 16, icon: 'star', speed: -0.05 },
  { left: '68%', top: 150, color: 'var(--orange-soft)', size: 10, icon: 'sparkle', speed: 0.1 },
  { left: '16%', top: 210, color: 'var(--purple-2)', size: 14, icon: 'star', speed: -0.07 },
  { left: '46%', top: 6, color: 'var(--lilac-deep)', size: 9, icon: 'sparkle', speed: 0.05 },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { event: ctxEvent } = useEvent();
  const event = ctxEvent || SAMPLE_EVENT;
  const active = resolveActiveStage(event);
  const upcoming = (event.stages || []).filter((s) => s !== active);
  const flyerSrc = event.flyerImageUrl || flyerImg;

  const goBuy = () => navigate('/compra');

  const dateLabel = event.date
    ? `${parseLocalDate(event.date)?.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })} · ${formatTo12Hour(event.entranceTime || '00:00')}`
    : '';

  // --- parallax wiring (mirrors prototype-2.0 wireLanding) ---
  const scrollRef = useRef(null);
  const lheadRef = useRef(null);
  const heroFlyerRef = useRef(null);
  const overlayRef = useRef(null);
  const hintRef = useRef(null);
  const sbRef = useRef(null);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return undefined;

    const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    const heroFlyer = heroFlyerRef.current;
    const overlay = overlayRef.current;
    const hint = hintRef.current;
    const lhead = lheadRef.current;
    const sb = sbRef.current;
    const floatEls = Array.from(scroll.querySelectorAll('.floatel'));

    function onScroll() {
      const y = scroll.scrollTop;
      if (reduceMQ.matches) {
        if (lhead) lhead.style.opacity = y > 560 ? 1 : 0;
        return;
      }
      if (overlay) overlay.style.opacity = clamp(y / 760, 0, 0.74);
      if (heroFlyer) {
        heroFlyer.style.transform =
          `translateY(${y * 0.32}px) scale(${1 - clamp(y, 0, 900) / 7000})`;
        heroFlyer.style.opacity = 1 - clamp((y - 380) / 520, 0, 0.6);
      }
      if (sb) sb.style.opacity = 1 - clamp(y / 280, 0, 1);
      if (hint) hint.style.opacity = 1 - clamp(y / 160, 0, 1);
      if (lhead) {
        const headOp = clamp((y - 560) / 220, 0, 1);
        lhead.style.opacity = headOp;
        lhead.style.pointerEvents = headOp > 0.6 ? 'auto' : 'none';
      }
      for (let i = 0; i < floatEls.length; i++) {
        const speed = Number(floatEls[i].dataset.speed);
        floatEls[i].style.transform = `translateY(${y * speed}px)`;
      }
    }

    scroll.addEventListener('scroll', onScroll, { passive: true });
    reduceMQ.addEventListener?.('change', onScroll);
    onScroll();

    return () => {
      scroll.removeEventListener('scroll', onScroll);
      reduceMQ.removeEventListener?.('change', onScroll);
    };
  }, []);

  return (
    <div className="scr" style={{ height: '100dvh' }}>
      <div className="lscroll" ref={scrollRef}>
        {/* COLLAPSED HEADER — fades in once the flyer scrolls away */}
        <div className="lhead" ref={lheadRef} style={{ opacity: 0 }}>
          <img src={flyerSrc} alt="" className="lhead-img" />
          <div className="lhead-grad" />
          <div className="lhead-txt">
            <div className="serif" style={{ fontSize: 30, color: 'var(--cream)', lineHeight: 0.95 }}>
              {event.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 3 }}>
              <span className="label" style={{ color: 'var(--cream-dim)' }}>{dateLabel}</span>
            </div>
          </div>
        </div>

        {/* HERO — full-bleed flyer with scroll parallax */}
        <section className="lhero">
          <StarField seed={2} density={42} w={430} h={880} />
          <div className="lhero-overlay" ref={overlayRef} style={{ opacity: 0 }} />
          <div className="lhero-sb" ref={sbRef}>
            <span className="kicker">Bogotá, CO</span>
          </div>
          <div className="lhero-flyer" ref={heroFlyerRef}>
            <img src={flyerSrc} alt={event.name} />
          </div>
          <div className="lhero-hint" ref={hintRef}>
            <span className="label" style={{ color: 'var(--cream-dim)' }}>Desliza</span>
            <Ic n="chevD" s={20} />
          </div>
        </section>

        {/* BODY — rides up over the flyer */}
        <section className="lbody">
          <StarField seed={9} density={34} w={430} h={1500} />

          <div className="pad" style={{ position: 'relative', zIndex: 2, paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Active stage ticket */}
            {active && (
              <div className="tile purple stub" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="chip" style={{ background: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.24)', color: '#fff', marginBottom: 8 }}>Etapa activa</div>
                  <div className="label" style={{ color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap' }}>{active.name}</div>
                  <div className="serif" style={{ fontSize: 38, color: 'var(--yellow)', lineHeight: 1, marginTop: 3 }}>{formatCurrency(active.price)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="serif" style={{ fontSize: 36, color: '#fff' }}>{stageCupos(active)}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.75)' }}>cupos</div>
                </div>
              </div>
            )}

            <button className="btn" onClick={goBuy}><Ic n="ticket" s={20} /> Comprar boleta</button>

            {/* Future / taquilla stages */}
            {upcoming.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {upcoming.slice(0, 2).map((s, i) => (
                  <div className={`tile ${i === 0 ? 'yellow' : 'orange'}`} key={i}>
                    <div className="label" style={i === 0 ? undefined : { color: 'rgba(255,255,255,0.85)' }}>{s.name}</div>
                    <div className="serif" style={{ fontSize: 26, color: i === 0 ? undefined : '#fff' }}>{formatCurrency(s.price)}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Próximamente</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Line-up with floating, parallaxed ornaments */}
          {Array.isArray(event.artists) && event.artists.length > 0 && (
            <div className="lineupx">
              {FLOATS.map((f, i) => (
                <span
                  key={i}
                  className="floatel"
                  data-speed={f.speed}
                  style={{ left: f.left, top: f.top, color: f.color, animationDelay: `${i * 0.6}s` }}
                >
                  <Ic n={f.icon} s={f.size} fill />
                </span>
              ))}
              <div className="pad" style={{ position: 'relative', zIndex: 2 }}>
                <div className="label" style={{ color: 'var(--orange-soft)', textAlign: 'center', marginBottom: 18 }}>Line-up</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'center' }}>
                  {event.artists.map((a, i) => (
                    <div key={i} className="serif actbig" style={{ fontSize: i % 2 ? 30 : 34, color: i % 3 === 1 ? 'var(--yellow)' : 'var(--cream)', lineHeight: 1.04 }}>{a}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Venue / contact */}
          <div className="pad" style={{ position: 'relative', zIndex: 2, marginTop: 8, paddingBottom: 30 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
                  <span style={{ color: 'var(--lilac)' }}><Ic n="pin" s={20} /></span>
                  <div><div style={{ fontWeight: 600 }}>{event.venue}</div><div className="muted" style={{ fontSize: 13 }}>{event.address}</div></div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
                  <span style={{ color: 'var(--lilac)' }}><Ic n="clock" s={20} /></span>
                  <div><div style={{ fontWeight: 600 }}>Puertas</div><div className="muted" style={{ fontSize: 13 }}>{formatTo12Hour(event.entranceTime || '00:00')}</div></div>
                </div>
              </div>
              {event.whatsappNumber && (
                <>
                  <div className="divider" style={{ margin: '16px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><div className="label" style={{ color: 'var(--cream-dim)' }}>Info y reservas</div><div style={{ fontWeight: 600 }}>{event.whatsappNumber}</div></div>
                    <a className="chip green" href={whatsappLink(event.whatsappNumber, '')} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                      <Ic n="wa" s={14} fill /> WhatsApp
                    </a>
                  </div>
                </>
              )}
            </div>

            <button className="btn" onClick={goBuy} style={{ marginTop: 16 }}><Ic n="ticket" s={20} /> Comprar boleta</button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default LandingPage;
