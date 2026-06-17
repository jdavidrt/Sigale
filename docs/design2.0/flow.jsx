/* flow.jsx — public purchase flow (Collage / festive)
   Steps accept {onNext,onBack} so the same components work statically
   (canvas, no handlers) and interactively (prototype). */

function FlowShell({ step, total = 6, title, kicker, children, cta, ctaIcon, ctaClass = 'btn', footnote, ghost, onNext, onBack }) {
  return (
    <Screen dir="t3" seed={30 + step}>
      <StatusBar />
      <div className="topbar" style={{ paddingBottom: 8 }}>
        <button className="tb-btn icon" onClick={onBack}><Ic n="arrowL" s={20} /></button>
        <div className="serif" style={{ fontSize: 18, color: 'var(--cream)' }}>Astromelias</div>
        <div style={{ width: 44 }} />
      </div>
      <div className="pad" style={{ position: 'relative', zIndex: 2 }}>
        <div className="steps">
          {Array.from({ length: total }).map((_, i) =>
            <i key={i} className={i + 1 < step ? 'done' : i + 1 === step ? 'on' : ''} />)}
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, whiteSpace: 'nowrap' }}>
            <span className="serif" style={{ fontSize: 30, color: 'var(--yellow)', lineHeight: 1 }}>Paso {step}</span>
            <span className="label" style={{ color: 'var(--cream-dim)', fontSize: 13 }}>de {total}</span>
            <span className="label" style={{ color: 'var(--orange-soft)' }}>· {kicker}</span>
          </div>
          <div className="serif" style={{ fontSize: 28, color: 'var(--cream)', lineHeight: 1.06, marginTop: 8 }}>{title}</div>
        </div>
      </div>
      <div className="scr-body pad" style={{ overflow: 'hidden', zIndex: 1, marginTop: 16 }}>
        {children}
      </div>
      <div className="pad" style={{ position: 'relative', zIndex: 2, paddingBottom: 18, paddingTop: 8 }}>
        {footnote}
        {ghost && <button className="btn ghost sm" style={{ marginBottom: 10 }} onClick={onBack}>{ghost}</button>}
        {cta && <button className={ctaClass} onClick={onNext}>{ctaIcon}{cta}</button>}
      </div>
    </Screen>
  );
}

/* 1 · Selección */
function Step1({ onNext, onBack }) {
  return (
    <FlowShell step={1} kicker="Selección" title="Elige tu boleta" onNext={onNext} onBack={onBack}
      cta="Continuar" ctaIcon={<Ic n="chevR" s={20} />}>
      <div className="tile purple" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="chip" style={{ background: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.24)', color: '#fff', marginBottom: 8 }}>Etapa activa</div>
          <div className="label" style={{ color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap' }}>Etapa 1 · Preventa</div>
          <div className="serif" style={{ fontSize: 32, color: 'var(--yellow)', lineHeight: 1, marginTop: 3 }}>$30.000</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="serif" style={{ fontSize: 30, color: '#fff' }}>48</div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.75)' }}>cupos</div>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>Cantidad</div>
          <div className="muted" style={{ fontSize: 13 }}>Máx. 6 por persona</div>
        </div>
        <div className="stepper">
          <button>−</button><span className="qv">2</span><button>+</button>
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="trow" style={{ opacity: 0.55, background: 'var(--black-2)' }}>
          <span className="tname" style={{ flex: 1 }}>Etapa 2</span>
          <Money v={35000} />
          <span className="chip lilac" style={{ marginLeft: 10, height: 24 }}>Próximamente</span>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'rgba(231,174,63,0.25)' }}>
        <div className="label" style={{ color: 'var(--cream-dim)' }}>Total</div>
        <div className="serif" style={{ fontSize: 28, color: 'var(--yellow)' }}>$60.000</div>
      </div>
    </FlowShell>
  );
}

/* 2 · Confirmar compra → reserved */
function Step2({ onNext, onBack }) {
  return (
    <FlowShell step={2} kicker="Confirmar compra" title="Tu cupo está reservado" onNext={onNext} onBack={onBack}
      cta="Continuar con mis datos" ctaIcon={<Ic n="chevR" s={20} />}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 8 }}>
        <div className="charly" style={{ width: 76, height: 76, fontSize: 34 }}>✦</div>
        <div className="serif" style={{ fontSize: 22, color: 'var(--cream)', marginTop: 16 }}>Apartamos 2 boletas para ti</div>
        <p className="muted" style={{ fontSize: 15, marginTop: 6, maxWidth: 270 }}>
          Guardamos tu lugar mientras completas el pago. Este es tu número de orden:
        </p>
        <div className="tile" style={{ background: 'linear-gradient(150deg,var(--purple),var(--purple-deep))', padding: '18px 30px', marginTop: 16, textAlign: 'center' }}>
          <div className="label" style={{ color: 'rgba(255,255,255,0.7)' }}>Orden</div>
          <div className="folio" style={{ fontSize: 38, color: 'var(--yellow)' }}>#123</div>
        </div>
        <div className="chip lilac" style={{ marginTop: 18 }}><Ic n="lock" s={14} /> Guárdala, no la compartas</div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 22, display: 'flex', justifyContent: 'space-between' }}>
        <div><div className="label" style={{ color: 'var(--cream-dim)' }}>Etapa 1 × 2</div><div className="muted" style={{ fontSize: 13 }}>Preventa</div></div>
        <div className="serif" style={{ fontSize: 26, color: 'var(--yellow)' }}>$60.000</div>
      </div>
    </FlowShell>
  );
}

/* 3 · Datos de boletas */
function HolderCard({ n }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="label" style={{ marginBottom: 12, color: 'var(--orange-soft)' }}>Boleta {n}</div>
      <div className="field" style={{ marginBottom: 10 }}>
        <div className="flabel"><span style={{ color: 'var(--lilac)' }}><Ic n="user" s={16} /></span><span className="label" style={{ color: 'var(--cream-dim)' }}>Nombre</span></div>
        <div className="input ph">Nombre completo</div>
      </div>
      <div className="field">
        <div className="flabel"><span style={{ color: 'var(--lilac)' }}><Ic n="id" s={16} /></span><span className="label" style={{ color: 'var(--cream-dim)' }}>Documento</span></div>
        <div className="input ph">N.º de cédula</div>
      </div>
    </div>
  );
}
function Step3({ onNext, onBack }) {
  return (
    <FlowShell step={3} kicker="Datos de boletas" title="¿Para quién son?" onNext={onNext} onBack={onBack}
      cta="Ir a pagar" ctaIcon={<Ic n="chevR" s={20} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <HolderCard n={1} />
        <HolderCard n={2} />
        <div className="card" style={{ padding: 14 }}>
          <div className="label" style={{ marginBottom: 10, color: 'var(--cream-dim)' }}>¿Cómo te enviamos las boletas?</div>
          <div className="seg">
            <div className="opt on"><Ic n="wa" s={16} fill /> WhatsApp</div>
            <div className="opt"><Ic n="share" s={16} /> Email</div>
          </div>
          <div className="input ph" style={{ marginTop: 10 }}>+57 · número de WhatsApp</div>
        </div>
      </div>
    </FlowShell>
  );
}

/* 4 · Realiza el pago — emotional center */
function Step4({ onNext, onBack }) {
  return (
    <FlowShell step={4} kicker="Realiza el pago" title="Transfiere y guarda el pantallazo" onNext={onNext} onBack={onBack}
      cta="Ya transferí, continuar" ctaIcon={<Ic n="check" s={20} />}>
      <div className="tile" style={{ background: 'rgba(231,174,63,0.10)', border: '1px solid rgba(231,174,63,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
        <div>
          <div className="label" style={{ color: 'var(--cream-dim)' }}>Tienes</div>
          <div className="count"><span className="t">19:42</span><span className="muted" style={{ fontSize: 14 }}>min</span></div>
        </div>
        <div style={{ textAlign: 'right', maxWidth: 150 }}>
          <div className="muted" style={{ fontSize: 13, lineHeight: 1.3 }}>Tranquilo, tu cupo está guardado mientras tanto</div>
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginTop: 14, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="label" style={{ color: 'var(--cream-dim)', whiteSpace: 'nowrap' }}>Total a transferir</div>
        <div className="serif" style={{ fontSize: 40, color: 'var(--yellow)', lineHeight: 1 }}>$60.000</div>
        <div className="qr" style={{ marginTop: 14 }} />
        <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>Bancolombia · Ahorros 123-456789-00</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '8px 14px', borderRadius: 'var(--r-full)', background: 'var(--black-3)' }}>
          <span className="label" style={{ color: 'var(--cream-dim)' }}>Orden</span>
          <span className="folio" style={{ fontSize: 20, color: 'var(--yellow)' }}>#123</span>
          <span style={{ color: 'var(--lilac)' }}><Ic n="copy" s={16} /></span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 14 }} className="muted">
        <Ic n="bell" s={16} /><span style={{ fontSize: 13 }}>Guarda el pantallazo de la transferencia</span>
      </div>
    </FlowShell>
  );
}

/* 5 · Enviar por WhatsApp */
function Step5({ onNext, onBack }) {
  return (
    <FlowShell step={5} kicker="Enviar comprobante" title="Envíanos tu pantallazo" onNext={onNext} onBack={onBack}
      cta="Abrir WhatsApp" ctaIcon={<Ic n="wa" s={20} fill />}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 12 }}>
        <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'rgba(95,190,123,0.14)', border: '1px solid rgba(95,190,123,0.4)', display: 'grid', placeItems: 'center', color: 'var(--green)' }}>
          <Ic n="wa" s={40} fill />
        </div>
        <div className="serif" style={{ fontSize: 22, color: 'var(--cream)', marginTop: 16, maxWidth: 280 }}>Confirma tu pago por WhatsApp</div>
        <p className="muted" style={{ fontSize: 15, marginTop: 6, maxWidth: 270 }}>Toca el botón y envíanos la imagen de tu transferencia. Ya dejamos el mensaje listo.</p>
      </div>
      <div className="card" style={{ padding: 16, marginTop: 22 }}>
        <div className="label" style={{ color: 'var(--cream-dim)', marginBottom: 8 }}>Mensaje</div>
        <div style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', background: 'rgba(95,190,123,0.10)', border: '1px solid rgba(95,190,123,0.2)', fontSize: 15 }}>
          ¡Hola! Envío pantallazo de compra <b style={{ color: 'var(--yellow)' }}>#123</b>
        </div>
      </div>
    </FlowShell>
  );
}

/* 6 · Pago en verificación — "tus boletas vienen en camino" */
function Step6({ onNext, onBack }) {
  return (
    <FlowShell step={6} kicker="Verificando pago" title="Tus boletas están en camino" onNext={onNext} onBack={onBack}
      cta="Volver al inicio" ctaClass="btn ghost">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 12 }}>
        <div style={{ position: 'relative', width: 92, height: 92, display: 'grid', placeItems: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid rgba(121,166,232,0.25)', borderTopColor: 'var(--blue)' }} />
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(121,166,232,0.12)', display: 'grid', placeItems: 'center', color: 'var(--blue)' }}><Ic n="ticket" s={30} /></div>
        </div>
        <span className="pill sent" style={{ marginTop: 18, height: 34 }}><span className="dot" /> Pago enviado</span>
        <p className="muted" style={{ fontSize: 15.5, marginTop: 16, maxWidth: 292, lineHeight: 1.45 }}>
          Nuestro equipo está verificando tu pago. En cuanto lo confirmemos, recibirás tus boletas por <b style={{ color: 'var(--green)' }}>WhatsApp</b>.
        </p>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 12, maxWidth: 292, lineHeight: 1.45, opacity: 0.8 }}>
          Si tu compra fue fuera del horario hábil, te pedimos un poco de paciencia 💜
        </p>
      </div>
      <div className="card" style={{ padding: 16, marginTop: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="label" style={{ color: 'var(--cream-dim)' }}>Orden #123 · Etapa 1 × 2</div>
            <div className="muted" style={{ fontSize: 13 }}>Acá Parchamos · 24 jul · 5:00 PM</div>
          </div>
          <div className="serif" style={{ fontSize: 22, color: 'var(--yellow)' }}>$60.000</div>
        </div>
      </div>
    </FlowShell>
  );
}

Object.assign(window, { Step1, Step2, Step3, Step4, Step5, Step6, FlowShell });
