/* proto.jsx — consolidated interactive prototype
   Parallax flyer Landing + Collage Home + 7-step flow, in one phone with a screen picker. */

const FLYER = 'assets/flyer.png';
const ACTS = ['Cold Tropics', 'Itawa', 'Deglorian', 'Catalina', 'Siluetas del Ayer', 'Amaltea'];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ── Parallax Landing ─────────────────────────────────── */
function Landing({ onBuy }) {
  const [y, setY] = React.useState(0);
  const ref = React.useRef(null);
  const onScroll = () => { if (ref.current) setY(ref.current.scrollTop); };

  const overlayOp = clamp(y / 760, 0, 0.74);
  const flyerShift = y * 0.32;
  const flyerScale = 1 - clamp(y, 0, 900) / 7000;
  const flyerOp = 1 - clamp((y - 380) / 520, 0, 0.6);
  const sbOp = 1 - clamp(y / 280, 0, 1);
  const hintOp = 1 - clamp(y / 160, 0, 1);
  const headOp = clamp((y - 560) / 220, 0, 1);

  const floats = [
    { l: '8%', t: 60, s: 0.07, c: 'var(--yellow)', sz: 12, ic: 'sparkle' },
    { l: '82%', t: 30, s: -0.05, c: 'var(--lilac)', sz: 16, ic: 'star' },
    { l: '68%', t: 150, s: 0.1, c: 'var(--orange-soft)', sz: 10, ic: 'sparkle' },
    { l: '16%', t: 210, s: -0.07, c: 'var(--purple-2)', sz: 14, ic: 'star' },
    { l: '46%', t: 6, s: 0.05, c: 'var(--lilac-deep)', sz: 9, ic: 'sparkle' },
  ];

  return (
    <div className="scr t3" style={{ height: '100%' }}>
      <div className="lscroll" ref={ref} onScroll={onScroll}>

        {/* collapsed Collage header (persists when scrolled) */}
        <div className="lhead" style={{ opacity: headOp, pointerEvents: headOp > 0.6 ? 'auto' : 'none' }}>
          <img src={FLYER} alt="" className="lhead-img" />
          <div className="lhead-grad" />
          <div className="lhead-txt">
            <div className="wordmark" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 30, lineHeight: 0.9 }}>Astromelias</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 3 }}>
              <span className="serif" style={{ fontFamily: "'Cormorant', serif", fontStyle: 'italic', fontSize: 19, color: 'var(--yellow)' }}>Festival</span>
              <span className="label" style={{ color: 'var(--cream-dim)' }}>· Vie 24 Jul · 5:00 PM</span>
            </div>
          </div>
        </div>

        {/* HERO — full flyer, shown complete */}
        <section className="lhero">
          <StarField seed={2} h={844} density={42} />
          <div className="lhero-overlay" style={{ opacity: overlayOp }} />
          <div className="statusbar" style={{ opacity: sbOp, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 4 }}>
            <span>9:41</span><span className="kicker" style={{ letterSpacing: 2 }}>Bogotá, CO</span>
          </div>
          <div className="lhero-flyer" style={{ transform: `translateY(${flyerShift}px) scale(${flyerScale})`, opacity: flyerOp }}>
            <img src={FLYER} alt="Astromelias" />
          </div>
          <div className="lhero-hint" style={{ opacity: hintOp }}>
            <span className="label" style={{ color: 'var(--cream-dim)' }}>Desliza</span>
            <Ic n="chevD" s={20} />
          </div>
        </section>

        {/* BODY */}
        <section className="lbody">
          <StarField seed={9} h={1500} density={34} />

          {/* purple active-stage ticket (Collage) + following tiles */}
          <div className="pad" style={{ position: 'relative', zIndex: 2, paddingTop: 172, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="tile purple stub" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="chip" style={{ background: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.24)', color: '#fff', marginBottom: 8 }}>Etapa activa</div>
                <div className="label" style={{ color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap' }}>Etapa 1 · Preventa</div>
                <div className="serif" style={{ fontSize: 38, color: 'var(--yellow)', lineHeight: 1, marginTop: 3 }}>$30.000</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="serif" style={{ fontSize: 36, color: '#fff' }}>48</div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.75)' }}>cupos</div>
              </div>
            </div>
            <button className="btn" onClick={onBuy}><Ic n="ticket" s={20} /> Comprar boleta</button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="tile yellow">
                <div className="label">Etapa 2</div>
                <div className="serif" style={{ fontSize: 26 }}>$35.000</div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Próximamente</div>
              </div>
              <div className="tile orange">
                <div className="label" style={{ color: 'rgba(255,255,255,0.85)' }}>Taquilla</div>
                <div className="serif" style={{ fontSize: 26, color: '#fff' }}>$45.000</div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' }}>En puerta</div>
              </div>
            </div>
          </div>

          {/* LINE-UP — bigger names + floating elements */}
          <div className="lineupx">
            {floats.map((f, i) => (
              <span key={i} className="floatel" style={{ left: f.l, top: f.t, color: f.c, transform: `translateY(${y * f.s}px)`, animationDelay: (i * 0.6) + 's' }}>
                <Ic n={f.ic} s={f.sz} fill />
              </span>
            ))}
            <div className="pad" style={{ position: 'relative', zIndex: 2 }}>
              <div className="label" style={{ color: 'var(--orange-soft)', textAlign: 'center', marginBottom: 18 }}>Line-up</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'center' }}>
                {ACTS.map((a, i) => (
                  <div key={i} className="serif actbig" style={{ fontFamily: "'DM Serif Display', serif", fontSize: i % 2 ? 30 : 34, color: i % 3 === 1 ? 'var(--yellow)' : 'var(--cream)', lineHeight: 1.04 }}>{a}</div>
                ))}
              </div>
            </div>
          </div>

          {/* info — Cristal opening/venue section */}
          <div className="pad" style={{ position: 'relative', zIndex: 2, marginTop: 8, paddingBottom: 30 }}>
            <div className="info-card">
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
                  <span style={{ color: 'var(--lilac)' }}><Ic n="pin" s={20} /></span>
                  <div><div style={{ fontWeight: 600 }}>Acá Parchamos</div><div className="muted" style={{ fontSize: 13 }}>Cl. 49 #9-85</div></div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
                  <span style={{ color: 'var(--lilac)' }}><Ic n="clock" s={20} /></span>
                  <div><div style={{ fontWeight: 600 }}>Puertas</div><div className="muted" style={{ fontSize: 13 }}>5:00 PM</div></div>
                </div>
              </div>
              <div className="divider" style={{ margin: '16px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div className="label" style={{ color: 'var(--cream-dim)' }}>Info y reservas</div><div style={{ fontWeight: 600 }}>321 261 9103</div></div>
                <button className="wa-text-btn">WhatsApp</button>
              </div>
            </div>
            <button className="btn" onClick={onBuy} style={{ marginTop: 16 }}><Ic n="ticket" s={20} /> Comprar boleta</button>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Phone shell ──────────────────────────────────────── */
function Phone({ children }) {
  return (
    <div className="phone">
      <div className="phone-notch" />
      <div className="phone-screen">{children}</div>
    </div>
  );
}

/* ── Router + screen picker ───────────────────────────── */
const FLOW = ['s1', 's2', 's3', 's4', 's5', 's6'];
const STEP_CMP = { s1: 'Step1', s2: 'Step2', s3: 'Step3', s4: 'Step4', s5: 'Step5', s6: 'Step6' };

function App() {
  const [screen, setScreen] = React.useState('landing');
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    const fit = () => {
      const availH = window.innerHeight - 48;
      const availW = window.innerWidth - 320;
      setScale(Math.min(availH / 844, availW / 390, 1));
    };
    fit(); window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const flowIdx = FLOW.indexOf(screen);
  const goNext = () => { if (flowIdx >= 0 && flowIdx < FLOW.length - 1) setScreen(FLOW[flowIdx + 1]); else setScreen('landing'); };
  const goBack = () => { if (flowIdx > 0) setScreen(FLOW[flowIdx - 1]); else setScreen('landing'); };

  let body;
  if (screen === 'landing') body = <Landing onBuy={() => setScreen('s1')} />;
  else if (screen === 'home') body = <HomeCollage />;
  else { const Cmp = window[STEP_CMP[screen]]; body = <Cmp onNext={goNext} onBack={goBack} />; }

  const navItems = [
    { id: 'landing', label: 'Landing', sub: 'Flyer + parallax' },
    { id: 'home', label: 'Home', sub: 'Organizador' },
  ];
  const flowLabels = ['Selección', 'Confirmar', 'Datos', 'Pago', 'WhatsApp', 'Verificando'];

  return (
    <div className="stage">
      <aside className="navpanel">
        <div className="np-brand">
          <div className="wordmark" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 28 }}>Sígale 2.0</div>
          <div className="np-sub">Astromelias · prototipo interactivo</div>
        </div>
        <div className="np-group">Pantallas</div>
        {navItems.map((n) => (
          <button key={n.id} className={'np-item' + (screen === n.id ? ' on' : '')} onClick={() => setScreen(n.id)}>
            <span className="np-label">{n.label}</span><span className="np-itemsub">{n.sub}</span>
          </button>
        ))}
        <div className="np-group">Flujo de compra</div>
        {FLOW.map((s, i) => (
          <button key={s} className={'np-item step' + (screen === s ? ' on' : '')} onClick={() => setScreen(s)}>
            <span className="np-num">{i + 1}</span><span className="np-label">{flowLabels[i]}</span>
          </button>
        ))}
        <div className="np-hint">Toca <b>Comprar boleta</b> en la Landing para recorrer el flujo, o salta a cualquier pantalla aquí.</div>
      </aside>

      <main className="phonewrap">
        <div className="phone-scale" style={{ width: 390 * scale, height: 844 * scale }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <Phone>{body}</Phone>
          </div>
        </div>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
