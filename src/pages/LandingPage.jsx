/*
 * LandingPage — /evento/:id  (public, cold-arrival first impression)
 * All parallax thresholds normalized to t = scrollTop / maxScroll (0-1)
 * so animations complete regardless of viewport or content height.
 * Body: single column mobile, two-column grid (lineup | tickets+venue) desktop.
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

// Format Colombian numbers: "573212619103" -> "(+57)321 261 9103"
function formatPhone(raw) {
  const s = String(raw).replace(/\D/g, '');
  if (s.startsWith('57') && s.length === 12) {
    const local = s.slice(2);
    return `(+57)${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  return raw;
}

const FLOATS = [
  { left: '8%', top: 60, color: 'var(--yellow)', size: 12, icon: 'sparkle', speed: 0.07 },
  { left: '82%', top: 30, color: 'var(--lilac)', size: 16, icon: 'star', speed: -0.05 },
  { left: '68%', top: 150, color: 'var(--orange-soft)', size: 10, icon: 'sparkle', speed: 0.1 },
  { left: '16%', top: 210, color: 'var(--purple-2)', size: 14, icon: 'star', speed: -0.07 },
  { left: '46%', top: 6, color: 'var(--lilac-deep)', size: 9, icon: 'sparkle', speed: 0.05 },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { event: ctxEvent, eventLoading } = useEvent();

  // All hooks must run on every render — declare BEFORE any conditional return.
  // (Violating this triggers React error #310 when `eventLoading` flips.)
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
      const maxY = scroll.scrollHeight - scroll.clientHeight;
      const t = maxY > 0 ? y / maxY : 0;

      if (reduceMQ.matches) {
        if (lhead) lhead.style.opacity = t > 0.5 ? 1 : 0;
        return;
      }
      if (overlay) overlay.style.opacity = clamp(t * 0.74, 0, 0.74);
      if (heroFlyer) {
        heroFlyer.style.transform =
          `translateY(${y * 0.32}px) scale(${1 - clamp(y, 0, 900) / 7000})`;
        heroFlyer.style.opacity = 1 - clamp((t - 0.3) / 0.55, 0, 0.6);
      }
      if (sb) sb.style.opacity = 1 - clamp(t / 0.3, 0, 1);
      if (hint) hint.style.opacity = 1 - clamp(t / 0.2, 0, 1);
      if (lhead) {
        const headOp = clamp((t - 0.5) / 0.35, 0, 1);
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
  }, [ctxEvent]);

  // While fetching the active event, show a minimal spinner.
  if (eventLoading) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <StarField seed={2} density={34} w={430} h={880} />
        <p className="muted" style={{ position: 'relative', zIndex: 1 }}>Cargando…</p>
      </div>
    );
  }

  // No active event — show a "coming soon" placeholder instead of sample data.
  if (!ctxEvent) return <NoEventScreen />;

  const event = ctxEvent;
  const active = resolveActiveStage(event);
  const upcoming = (event.stages || []).filter((s) => s !== active);
  const flyerSrc = event.flyerImageUrl || flyerImg;

  const goBuy = () => navigate('/compra');

  const dateLabel = event.date
    ? `${parseLocalDate(event.date)?.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })} \xB7 ${formatTo12Hour(event.entranceTime || '00:00')}`
    : '';

  return (
    <div className="scr" style={{ height: '100dvh' }}>
      <div className="lscroll" ref={scrollRef}>

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

        <section className="lbody">
          <StarField seed={9} density={34} w={430} h={1500} />
          <div className="lbody-inner">

            <div className="lbody-col lbody-col--lineup">
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
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <div className="label" style={{ color: 'var(--orange-soft)', textAlign: 'center', marginBottom: 18 }}>Line-up</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'center' }}>
                      {event.artists.map((a, i) => (
                        <div key={i} className="serif actbig" style={{ fontSize: 32, color: i % 3 === 1 ? 'var(--yellow)' : 'var(--cream)', lineHeight: 1.04 }}>{a}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lbody-col lbody-col--tickets">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                {upcoming.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {upcoming.slice(0, 2).map((s, i) => (
                      <div className={`tile ${i === 0 ? 'yellow' : 'orange'}`} key={i}>
                        <div className="label" style={i === 0 ? undefined : { color: 'rgba(255,255,255,0.85)' }}>{s.name}</div>
                        <div className="serif" style={{ fontSize: 26, color: i === 0 ? undefined : '#fff' }}>{formatCurrency(s.price)}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Pr\xf3ximamente</div>
                      </div>
                    ))}
                  </div>
                )}
                <button className="btn btn-buy" onClick={goBuy}><Ic n="ticket" s={20} /> Comprar boleta</button>
                <div className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
                      <span style={{ color: 'var(--lilac)' }}><Ic n="pin" s={20} /></span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{event.venue}</div>
                        <div className="muted" style={{ fontSize: 13 }}>{event.address}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
                      <span style={{ color: 'var(--lilac)' }}><Ic n="clock" s={20} /></span>
                      <div>
                        <div style={{ fontWeight: 600 }}>Puertas</div>
                        <div className="muted" style={{ fontSize: 13 }}>{formatTo12Hour(event.entranceTime || '00:00')}</div>
                      </div>
                    </div>
                  </div>
                  {event.whatsappNumber && (
                    <>
                      <div className="divider" style={{ margin: '16px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div className="label" style={{ color: 'var(--cream-dim)' }}>Info y reservas</div>
                          <div style={{ fontWeight: 600 }}>{formatPhone(event.whatsappNumber)}</div>
                        </div>
                        <a className="chip green" href={whatsappLink(event.whatsappNumber, '')} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                          <Ic n="wa" s={14} fill /> WhatsApp
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}

// ── No-event placeholder ───────────────────────────────────────────────────────
function NoEventScreen() {
  return (
    <div className="scr" style={{ height: '100dvh' }}>
      <div className="lscroll" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, textAlign: 'center', padding: '0 24px' }}>
        <StarField seed={5} density={28} w={430} h={880} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="serif" style={{ fontSize: 48, color: 'var(--yellow)', lineHeight: 1 }}>✦</div>
          <div className="serif" style={{ fontSize: 32, color: 'var(--cream)', marginTop: 16 }}>
            No hay eventos activos
          </div>
          <p className="muted" style={{ fontSize: 15, marginTop: 10, maxWidth: 280, lineHeight: 1.6 }}>
            Por el momento no hay ningún evento publicado.<br />¡Vuelve pronto!
          </p>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
