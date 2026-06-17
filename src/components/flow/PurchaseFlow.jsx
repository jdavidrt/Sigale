/*
 * PurchaseFlow — the public 7-step purchase flow (the heart of 2.0).
 * Steps ported/adapted from docs/design2.0/flow.jsx, made functional and
 * wired to local reservation state via `purchases` (src/api/purchases.js).
 * When the backend is live, `purchases.*` already points at the real
 * endpoints — no change needed here.
 *
 * Steps: 1 Selección · 2 Confirmar (folio) · 3 Datos · 4 Pago · 5 WhatsApp
 *        · 6 Verificando → /compra/:orderId status page.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvent } from '../../context/EventContext';
import { Ic } from '../ui/Ic';
import { Money } from '../ui/Money';
import { FlowShell } from './FlowShell';
import { purchases, whatsappLink } from '../../api/purchases';
import { SAMPLE_EVENT, resolveActiveStage, stageCupos } from '../../utils/sampleEvent';
import { formatCurrency, formatTo12Hour, parseLocalDate } from '../../utils/timeFormat';

const MAX_QTY = 6;
const COUNTDOWN_SECONDS = 20 * 60; // cosmetic only (real hold is 24h server-side)

function mmss(total) {
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function PurchaseFlow() {
  const navigate = useNavigate();
  const { event: ctxEvent } = useEvent();
  const event = ctxEvent || SAMPLE_EVENT;
  const stage = resolveActiveStage(event);
  const cupos = stageCupos(stage);
  const maxQty = Math.max(1, Math.min(MAX_QTY, cupos || MAX_QTY));

  const [step, setStep] = useState(1);
  const [qty, setQty] = useState(1);
  const [holders, setHolders] = useState([{ name: '', idNumber: '' }]);
  const [delivery, setDelivery] = useState({ method: 'whatsapp', contact: '' });
  const [orderId, setOrderId] = useState(null);
  const [reserving, setReserving] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  const total = (Number(stage?.price) || 0) * qty;

  // Keep one holder card per ticket.
  const setQuantity = (next) => {
    const q = Math.max(1, Math.min(maxQty, next));
    setQty(q);
    setHolders((prev) => {
      const out = prev.slice(0, q);
      while (out.length < q) out.push({ name: '', idNumber: '' });
      return out;
    });
  };

  // Cosmetic countdown on the payment step.
  useEffect(() => {
    if (step !== 4) return undefined;
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [step]);

  const reserve = async () => {
    if (orderId || reserving) return;
    setReserving(true);
    try {
      const res = await purchases.create({
        eventId: event.id,
        stageId: stage?.id ?? null,
        stageName: stage?.name ?? '',
        quantity: qty,
        totalAmount: total,
        deliveryMethod: delivery.method,
        deliveryContact: delivery.contact,
        holders,
      });
      setOrderId(res.orderId);
    } finally {
      setReserving(false);
    }
  };

  const next = async () => {
    if (step === 1) await reserve(); // reserve before showing the folio
    if (step < 6) setStep((s) => s + 1);
  };
  const back = () => {
    if (step > 1) setStep((s) => s - 1);
    else navigate(`/evento/${event.id ?? 'sample'}`);
  };

  const datosValid = useMemo(
    () => holders.every((h) => h.name.trim()) && delivery.contact.trim(),
    [holders, delivery.contact],
  );

  const dateLabel = event.date
    ? `${parseLocalDate(event.date)?.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })} · ${formatTo12Hour(event.entranceTime || '00:00')}`
    : '';

  // ── Step 1 · Selección ────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <FlowShell step={1} kicker="Selección" title="Elige tu boleta" onNext={next} onBack={back}
        cta={reserving ? 'Reservando…' : 'Continuar'} ctaIcon={<Ic n="chevR" s={20} />} ctaDisabled={reserving}>
        <div className="tile purple" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="chip" style={{ background: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.24)', color: '#fff', marginBottom: 8 }}>Etapa activa</div>
            <div className="label" style={{ color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap' }}>{stage?.name || 'Etapa'}</div>
            <div className="serif" style={{ fontSize: 32, color: 'var(--yellow)', lineHeight: 1, marginTop: 3 }}>{formatCurrency(stage?.price || 0)}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="serif" style={{ fontSize: 30, color: '#fff' }}>{cupos}</div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.75)' }}>cupos</div>
          </div>
        </div>

        <div className="card" style={{ padding: 16, marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Cantidad</div>
            <div className="muted" style={{ fontSize: 13 }}>Máx. {maxQty} por persona</div>
          </div>
          <div className="stepper">
            <button type="button" onClick={() => setQuantity(qty - 1)} aria-label="Quitar">−</button>
            <span className="qv">{qty}</span>
            <button type="button" onClick={() => setQuantity(qty + 1)} aria-label="Agregar">+</button>
          </div>
        </div>

        <div className="card" style={{ padding: 16, marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'rgba(231,174,63,0.25)' }}>
          <div className="label" style={{ color: 'var(--cream-dim)' }}>Total</div>
          <div className="serif" style={{ fontSize: 28, color: 'var(--yellow)' }}>{formatCurrency(total)}</div>
        </div>
      </FlowShell>
    );
  }

  // ── Step 2 · Confirmar → reserved (folio) ──────────────────────────────────────
  if (step === 2) {
    return (
      <FlowShell step={2} kicker="Confirmar compra" title="Tu cupo está reservado" onNext={next} onBack={back}
        cta="Continuar con mis datos" ctaIcon={<Ic n="chevR" s={20} />}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 8 }}>
          <div className="charly" style={{ width: 76, height: 76, fontSize: 34 }}>✦</div>
          <div className="serif" style={{ fontSize: 22, color: 'var(--cream)', marginTop: 16 }}>Apartamos {qty} boleta{qty > 1 ? 's' : ''} para ti</div>
          <p className="muted" style={{ fontSize: 15, marginTop: 6, maxWidth: 270 }}>
            Guardamos tu lugar mientras completas el pago. Este es tu número de orden:
          </p>
          <div className="tile" style={{ background: 'linear-gradient(150deg,var(--purple),var(--purple-deep))', padding: '18px 30px', marginTop: 16, textAlign: 'center' }}>
            <div className="label" style={{ color: 'rgba(255,255,255,0.7)' }}>Orden</div>
            <div className="folio" style={{ fontSize: 38, color: 'var(--yellow)' }}>#{orderId}</div>
          </div>
          <div className="chip lilac" style={{ marginTop: 18 }}><Ic n="lock" s={14} /> Guárdala, no la compartas</div>
        </div>

        <div className="card" style={{ padding: 16, marginTop: 22, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div className="label" style={{ color: 'var(--cream-dim)' }}>{stage?.name} × {qty}</div>
          </div>
          <div className="serif" style={{ fontSize: 26, color: 'var(--yellow)' }}>{formatCurrency(total)}</div>
        </div>
      </FlowShell>
    );
  }

  // ── Step 3 · Datos ──────────────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <FlowShell step={3} kicker="Datos de boletas" title="¿Para quién son?" onNext={next} onBack={back}
        cta="Ir a pagar" ctaIcon={<Ic n="chevR" s={20} />} ctaDisabled={!datosValid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {holders.map((h, i) => (
            <div className="card" key={i} style={{ padding: 14 }}>
              <div className="label" style={{ marginBottom: 12, color: 'var(--orange-soft)' }}>Boleta {i + 1}</div>
              <div className="field" style={{ marginBottom: 10 }}>
                <div className="flabel"><span style={{ color: 'var(--lilac)' }}><Ic n="user" s={16} /></span><span className="label" style={{ color: 'var(--cream-dim)' }}>Nombre</span></div>
                <input className="input" placeholder="Nombre completo" value={h.name}
                  onChange={(e) => setHolders((prev) => prev.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              </div>
              <div className="field">
                <div className="flabel"><span style={{ color: 'var(--lilac)' }}><Ic n="id" s={16} /></span><span className="label" style={{ color: 'var(--cream-dim)' }}>Documento</span></div>
                <input className="input" inputMode="numeric" placeholder="N.º de cédula" value={h.idNumber}
                  onChange={(e) => setHolders((prev) => prev.map((x, j) => (j === i ? { ...x, idNumber: e.target.value } : x)))} />
              </div>
            </div>
          ))}
          <div className="card" style={{ padding: 14 }}>
            <div className="label" style={{ marginBottom: 10, color: 'var(--cream-dim)' }}>¿Cómo te enviamos las boletas?</div>
            <div className="seg">
              <div className={`opt ${delivery.method === 'whatsapp' ? 'on' : ''}`} onClick={() => setDelivery((d) => ({ ...d, method: 'whatsapp' }))} role="button" tabIndex={0}>
                <Ic n="wa" s={16} fill /> WhatsApp
              </div>
              <div className={`opt ${delivery.method === 'email' ? 'on' : ''}`} onClick={() => setDelivery((d) => ({ ...d, method: 'email' }))} role="button" tabIndex={0}>
                <Ic n="share" s={16} /> Email
              </div>
            </div>
            <input className="input" style={{ marginTop: 10 }}
              placeholder={delivery.method === 'whatsapp' ? '+57 · número de WhatsApp' : 'tu@correo.com'}
              value={delivery.contact}
              onChange={(e) => setDelivery((d) => ({ ...d, contact: e.target.value }))} />
          </div>
        </div>
      </FlowShell>
    );
  }

  // ── Step 4 · Pago (emotional center) ──────────────────────────────────────────
  if (step === 4) {
    return (
      <FlowShell step={4} kicker="Realiza el pago" title="Transfiere y guarda el pantallazo" onNext={next} onBack={back}
        cta="Ya transferí, continuar" ctaIcon={<Ic n="check" s={20} />}>
        <div className="tile" style={{ background: 'rgba(231,174,63,0.10)', border: '1px solid rgba(231,174,63,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
          <div>
            <div className="label" style={{ color: 'var(--cream-dim)' }}>Tienes</div>
            <div className="count"><span className="t">{mmss(secondsLeft)}</span><span className="muted" style={{ fontSize: 14 }}>min</span></div>
          </div>
          <div style={{ textAlign: 'right', maxWidth: 150 }}>
            <div className="muted" style={{ fontSize: 13, lineHeight: 1.3 }}>Tranquilo, tu cupo está guardado mientras tanto</div>
          </div>
        </div>

        <div className="card" style={{ padding: 18, marginTop: 14, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="label" style={{ color: 'var(--cream-dim)', whiteSpace: 'nowrap' }}>Total a transferir</div>
          <div className="serif" style={{ fontSize: 40, color: 'var(--yellow)', lineHeight: 1 }}>{formatCurrency(total)}</div>
          {event.bankQrImageUrl
            ? <img src={event.bankQrImageUrl} alt="QR de pago" style={{ width: 190, maxWidth: '72%', height: 'auto', marginTop: 14, borderRadius: 'var(--r-md)', background: '#fff', padding: 10 }} />
            : <div className="qr" style={{ marginTop: 14 }} />}
          <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>Transfiere y guarda el comprobante</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '8px 14px', borderRadius: 'var(--r-full)', background: 'var(--black-3)' }}>
            <span className="label" style={{ color: 'var(--cream-dim)' }}>Orden</span>
            <span className="folio" style={{ fontSize: 20, color: 'var(--yellow)' }}>#{orderId}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 14 }} className="muted">
          <Ic n="bell" s={16} /><span style={{ fontSize: 13 }}>Guarda el pantallazo de la transferencia</span>
        </div>
      </FlowShell>
    );
  }

  // ── Step 5 · WhatsApp ───────────────────────────────────────────────────────────
  if (step === 5) {
    const link = whatsappLink(event.whatsappNumber, orderId);
    return (
      <FlowShell step={5} kicker="Enviar comprobante" title="Envíanos tu pantallazo" onBack={back}
        footnote={
          <a className="btn" href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', marginBottom: 10 }}>
            <Ic n="wa" s={20} fill /> Abrir WhatsApp
          </a>
        }
        cta="Ya lo envié" ctaClass="btn ghost" onNext={next}>
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
            ¡Hola! Envío pantallazo de compra <b style={{ color: 'var(--yellow)' }}>#{orderId}</b>
          </div>
        </div>
      </FlowShell>
    );
  }

  // ── Step 6 · Verificando → status page ──────────────────────────────────────────
  return <Step6 orderId={orderId} stage={stage} qty={qty} total={total} event={event} dateLabel={dateLabel} onBack={back} navigate={navigate} />;
}

function Step6({ orderId, stage, qty, total, event, dateLabel, onBack, navigate }) {
  // Mark the payment submitted once we land on this step.
  useEffect(() => {
    if (orderId) purchases.submit(orderId);
  }, [orderId]);

  return (
    <FlowShell step={6} kicker="Verificando pago" title="Tus boletas están en camino" onBack={onBack}
      cta="Ver el estado de mi compra" ctaIcon={<Ic n="chevR" s={20} />}
      onNext={() => navigate(`/compra/${orderId}`)}
      ghost="Volver al inicio">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 12 }}>
        <div className="spinner">
          <div className="spinner-ring" />
          <div className="spinner-core"><Ic n="ticket" s={30} /></div>
        </div>
        <span className="pill sent" style={{ marginTop: 18, height: 34 }}><span className="dot" /> Pago enviado</span>
        <p className="muted" style={{ fontSize: 15.5, marginTop: 16, maxWidth: 292, lineHeight: 1.45 }}>
          Nuestro equipo está verificando tu pago. En cuanto lo confirmemos, recibirás tus boletas por <b style={{ color: 'var(--green)' }}>WhatsApp</b>.
        </p>
      </div>
      <div className="card" style={{ padding: 16, marginTop: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="label" style={{ color: 'var(--cream-dim)' }}>Orden #{orderId} · {stage?.name} × {qty}</div>
            <div className="muted" style={{ fontSize: 13 }}>{event.venue} · {dateLabel}</div>
          </div>
          <div className="serif" style={{ fontSize: 22, color: 'var(--yellow)' }}>{formatCurrency(total)}</div>
        </div>
      </div>
    </FlowShell>
  );
}

export default PurchaseFlow;
