/*
 * PurchaseFlow — the public 6-step purchase flow (the heart of 2.0).
 * Wired to the real backend via src/api/purchases.js (no localStorage).
 *
 * Steps: 1 Selección · 2 Confirmar (orden) · 3 Datos · 4 Pago · 5 WhatsApp
 *        · 6 ¡Listo! (terminal success screen — buyer is told tickets will be
 *        delivered to their chosen contact and routed back to the landing).
 *
 * After "Ir a pagar" (step 4 onward) the back button is locked: buyers cannot
 * rewind to change quantity or holder data once they're at the payment step.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvent } from '../../context/EventContext';
import { Ic } from '../ui/Ic';
import { FlowShell } from './FlowShell';
import { purchases, whatsappLink } from '../../api/purchases';
import { Screen } from '../ui/Screen';
import { SAMPLE_EVENT, resolveActiveStage, stageCupos } from '../../utils/sampleEvent';
import { formatCurrency } from '../../utils/timeFormat';

const MAX_QTY = 6;
const COUNTDOWN_SECONDS = 20 * 60; // cosmetic only (real hold is 24h server-side)

// ── Field validators (regex-driven) ─────────────────────────────────────────────
const RE_NUMERIC = /^[0-9]+$/;
const RE_NAME = /^[A-Za-zÀ-ÖØ-öø-ÿñÑ' -]+$/; // letters (incl. accented + ñ), spaces, hyphen, apostrophe
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validators = {
  idNumber: (v) => RE_NUMERIC.test(String(v).trim()),
  name: (v) => RE_NAME.test(String(v).trim()) && String(v).trim().length >= 2,
  phone: (v) => RE_NUMERIC.test(String(v).replace(/[\s+-]/g, '').trim()) && String(v).replace(/[\s+-]/g, '').length >= 10,
  email: (v) => RE_EMAIL.test(String(v).trim()),
};

// Sanitizers that strip invalid characters as the user types
const sanitize = {
  numeric: (v) => String(v).replace(/[^0-9]/g, ''),
  name: (v) => String(v).replace(/[^A-Za-zÀ-ÖØ-öø-ÿñÑ' -]/g, ''),
  phone: (v) => String(v).replace(/[^0-9+\s-]/g, ''),
  // email: don't sanitize (let user type freely; validate on submit)
};

function mmss(total) {
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function PurchaseFlow() {
  const navigate = useNavigate();
  const { event: ctxEvent, eventLoading } = useEvent();

  // All hooks first — they must run on every render in the same order.
  const [step, setStep] = useState(1);
  const [qty, setQty] = useState(1);
  const [holders, setHolders] = useState([{ name: '', idNumber: '' }]);
  const [delivery, setDelivery] = useState({ method: 'whatsapp', contact: '' });
  const [orderId, setOrderId] = useState(null);
  const [reserving, setReserving] = useState(false);
  const [reserveError, setReserveError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [keyCopied, setKeyCopied] = useState(false);

  // Derived state (no hooks). Uses sample event as a placeholder for the
  // initial render; the guards below block the flow until ctxEvent loads.
  const event = ctxEvent || SAMPLE_EVENT;
  const stage = resolveActiveStage(event);
  const cupos = stageCupos(stage);
  const maxQty = Math.max(1, Math.min(MAX_QTY, cupos));

  // Two failure modes the original code masked by silently falling back to the
  // SAMPLE_EVENT (which has no DB ids): (1) the real event is still loading,
  // (2) there is no active event at all. Surface both before we try to reserve
  // — otherwise the reservation POST goes out with stageId: null and the
  // server (correctly) returns 400 "Faltan campos obligatorios de la compra".
  const hasRealEvent = !!ctxEvent && Number.isFinite(Number(ctxEvent.id));
  const hasRealStage = !!stage && Number.isFinite(Number(stage.id));

  const total = (Number(stage?.price) || 0) * qty;

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText('3212619103');
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = '3212619103';
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    }
  };

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
    // Defensive guard — by this point hasRealEvent + hasRealStage are true,
    // but a stale state could still slip a non-numeric id through.
    const numericEventId = Number(event.id);
    const numericStageId = Number(stage.id);
    if (!Number.isFinite(numericEventId) || !Number.isFinite(numericStageId)) {
      setReserveError('No se pudo identificar el evento o la etapa. Recarga la página.');
      throw new Error('Invalid event/stage id');
    }
    setReserving(true);
    setReserveError('');
    try {
      const res = await purchases.create({
        eventId: numericEventId,
        stageId: numericStageId,
        stageName: stage?.name ?? '',
        quantity: qty,
        totalAmount: total,
        // Contact + holders are deferred to the submit step; we send what we
        // have today (an empty contact is accepted by the server).
        deliveryMethod: delivery.method,
        deliveryContact: delivery.contact,
        holders,
      });
      setOrderId(res.orderId);
    } catch (err) {
      setReserveError(err?.message || 'No fue posible reservar tu cupo');
      throw err;
    } finally {
      setReserving(false);
    }
  };

  const next = async () => {
    if (step === 1) {
      try {
        await reserve(); // reserve before showing the orden
      } catch {
        return; // stop advancing — keep step 1 and show the error
      }
    }
    if (step === 5 && orderId) {
      // Mark the payment as submitted and patch the contact info captured
      // in step 3 so the organizer sees the buyer's real method/contact +
      // holder names alongside the order.
      try {
        await purchases.submit(orderId, {
          deliveryMethod: delivery.method,
          deliveryContact: delivery.contact,
          holders,
        });
      } catch { /* surface gently on next page */ }
    }
    if (step < 6) setStep((s) => s + 1);
  };
  // Back is intentionally locked from step 4 onward — once the buyer commits
  // to paying we don't let them rewind through the wizard. Returning null
  // tells FlowShell to hide the back chevron entirely.
  const back = step >= 4
    ? null
    : () => {
      if (step > 1) setStep((s) => s - 1);
      else navigate(`/evento/${event.id ?? 'sample'}`);
    };

  // ── Step 3 validation ────────────────────────────────────────────────────────
  // Every holder needs a valid name and ID. Delivery contact must match its
  // chosen method (WhatsApp = numeric phone; Email = valid email address).
  const datosValid = useMemo(() => {
    const holdersOk = holders.every(
      (h) => validators.name(h.name) && validators.idNumber(h.idNumber),
    );
    const contactOk = delivery.method === 'email'
      ? validators.email(delivery.contact)
      : validators.phone(delivery.contact);
    return holdersOk && contactOk;
  }, [holders, delivery]);

  // Early returns AFTER all hooks (rules of hooks). Block the flow until the
  // real event finishes loading; show a friendly message if none exists.
  if (eventLoading) {
    return (
      <Screen seed={42}>
        <div className="scr-body pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          <p className="muted">Cargando evento…</p>
        </div>
      </Screen>
    );
  }
  if (!hasRealEvent || !hasRealStage) {
    return (
      <Screen seed={42}>
        <div className="scr-body pad" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12, zIndex: 1 }}>
          <div className="charly" style={{ width: 64, height: 64, fontSize: 28 }}>✦</div>
          <div className="serif" style={{ fontSize: 22 }}>Aún no hay boletas disponibles</div>
          <p className="muted" style={{ maxWidth: 280 }}>
            {hasRealEvent
              ? 'Ninguna etapa está activa en este momento. Vuelve más tarde.'
              : 'No hay un evento publicado todavía. Vuelve más tarde.'}
          </p>
          <button className="btn ghost sm" onClick={() => navigate('/')}>Volver al inicio</button>
        </div>
      </Screen>
    );
  }

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
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--yellow)', letterSpacing: '0.5px', marginTop: 6 }}>✦ Toda entrada incluye pola</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="serif" style={{ fontSize: 30, color: '#fff' }}>{cupos}</div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.75)' }}>{cupos === 1 ? 'cupo' : 'cupos'}</div>
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

        {reserveError && (
          <div className="card" style={{ marginTop: 14, padding: 12, borderColor: 'rgba(248,113,113,0.4)' }}>
            <p style={{ margin: 0, color: 'var(--red, #f87171)', fontSize: 14 }}>{reserveError}</p>
          </div>
        )}
      </FlowShell>
    );
  }

  // ── Step 2 · Confirmar → reserved (orden) ──────────────────────────────────────
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
            <div className="orden" style={{ fontSize: 38, color: 'var(--yellow)' }}>#{orderId}</div>
          </div>
          <div className="chip lilac" style={{ marginTop: 18 }}><Ic n="lock" s={14} /> Guárdala, no la compartas</div>
        </div>

        <div className="card" style={{ padding: 16, marginTop: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div className="label" style={{ color: 'var(--cream-dim)' }}>{stage?.name} × {qty}</div>
            </div>
            <div className="serif" style={{ fontSize: 26, color: 'var(--yellow)' }}>{formatCurrency(total)}</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--yellow)', letterSpacing: '0.5px', marginTop: 10, textAlign: 'center' }}>✦ Toda entrada incluye pola</div>
        </div>
      </FlowShell>
    );
  }

  // ── Step 3 · Datos ──────────────────────────────────────────────────────────────
  if (step === 3) {
    const contactPlaceholder = delivery.method === 'whatsapp'
      ? '+57 · número de WhatsApp'
      : 'tu@correo.com';

    const onHolderChange = (i, field, raw) => {
      const cleaned = field === 'idNumber' ? sanitize.numeric(raw) : sanitize.name(raw);
      setHolders((prev) => prev.map((x, j) => (j === i ? { ...x, [field]: cleaned } : x)));
    };
    const onContactChange = (raw) => {
      const cleaned = delivery.method === 'whatsapp' ? sanitize.phone(raw) : raw;
      setDelivery((d) => ({ ...d, contact: cleaned }));
    };

    const contactInvalid = delivery.method === 'email'
      ? delivery.contact.includes('@') && !validators.email(delivery.contact)
      : delivery.contact.length > 0 && !validators.phone(delivery.contact);

    return (
      <FlowShell step={3} kicker="Datos de boletas" title="¿Para quién son?" onNext={next} onBack={back}
        cta="Ir a pagar" ctaIcon={<Ic n="chevR" s={20} />} ctaDisabled={!datosValid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {holders.map((h, i) => {
            const nameInvalid = h.name.length >= 4 && !validators.name(h.name);
            const idInvalid = h.idNumber.length > 0 && !validators.idNumber(h.idNumber);
            return (
              <div className="card" key={i} style={{ padding: 14 }}>
                <div className="label" style={{ marginBottom: 12, color: 'var(--orange-soft)' }}>Boleta {i + 1}</div>
                <div className="field" style={{ marginBottom: 10 }}>
                  <div className="flabel"><span style={{ color: 'var(--lilac)' }}><Ic n="user" s={16} /></span><span className="label" style={{ color: 'var(--cream-dim)' }}>Nombre</span></div>
                  <input
                    className="input"
                    type="text"
                    autoComplete="name"
                    placeholder="Nombre completo"
                    value={h.name}
                    onChange={(e) => onHolderChange(i, 'name', e.target.value)}
                  />
                  {nameInvalid && <p style={{ margin: '4px 2px 0', color: 'var(--red, #f87171)', fontSize: 12 }}>Solo letras y espacios.</p>}
                </div>
                <div className="field">
                  <div className="flabel"><span style={{ color: 'var(--lilac)' }}><Ic n="id" s={16} /></span><span className="label" style={{ color: 'var(--cream-dim)' }}>Documento</span></div>
                  <input
                    className="input"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    placeholder="N.º de cédula"
                    value={h.idNumber}
                    onChange={(e) => onHolderChange(i, 'idNumber', e.target.value)}
                  />
                  {idInvalid && <p style={{ margin: '4px 2px 0', color: 'var(--red, #f87171)', fontSize: 12 }}>Solo números.</p>}
                </div>
              </div>
            );
          })}
          <div className="card" style={{ padding: 14 }}>
            <div className="label" style={{ marginBottom: 10, color: 'var(--cream-dim)' }}>¿Cómo te enviamos las boletas?</div>
            <div className="seg">
              <div className={`opt ${delivery.method === 'whatsapp' ? 'on' : ''}`} onClick={() => setDelivery((d) => ({ ...d, method: 'whatsapp', contact: '' }))} role="button" tabIndex={0}>
                <Ic n="wa" s={16} fill /> WhatsApp
              </div>
              <div className={`opt ${delivery.method === 'email' ? 'on' : ''}`} onClick={() => setDelivery((d) => ({ ...d, method: 'email', contact: '' }))} role="button" tabIndex={0}>
                <Ic n="share" s={16} /> Email
              </div>
            </div>
            <input
              className="input"
              style={{ marginTop: 10 }}
              type={delivery.method === 'email' ? 'email' : 'tel'}
              inputMode={delivery.method === 'email' ? 'email' : 'tel'}
              autoComplete={delivery.method === 'email' ? 'email' : 'tel'}
              placeholder={contactPlaceholder}
              value={delivery.contact}
              onChange={(e) => onContactChange(e.target.value)}
            />
            {contactInvalid && (
              <p style={{ margin: '4px 2px 0', color: 'var(--red, #f87171)', fontSize: 12 }}>
                {delivery.method === 'email' ? 'Correo no válido.' : 'Solo números'}
              </p>
            )}
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
            ? <img src={event.bankQrImageUrl} alt="QR de pago" style={{ width: 350, height: 'auto', marginTop: 14, borderRadius: 'var(--r-md)', background: '#fff', padding: 10 }} />
            : <div className="qr" style={{ marginTop: 14 }} />}

          <button
            type="button"
            onClick={handleCopyKey}
            className={`copy-key-btn${keyCopied ? ' copied' : ''}`}
          >
            {keyCopied
              ? <><span className="copy-key-icon">✓</span> ¡Copiada!</>
              : <><span className="copy-key-icon">📋</span> Copiar Llave <span className="copy-key-number">3212619103</span></>}
          </button>

          <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>Transfiere y guarda el comprobante</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '8px 14px', borderRadius: 'var(--r-full)', background: 'var(--black-3)' }}>
            <span className="label" style={{ color: 'var(--cream-dim)' }}>Orden</span>
            <span className="orden" style={{ fontSize: 20, color: 'var(--yellow)' }}>#{orderId}</span>
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
          <a
            className="btn"
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              marginBottom: 10,
              background: 'var(--green)',
              borderColor: 'var(--green)',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(95,190,123,0.35)',
            }}
          >
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
            ¡Hola! Envío pantallazo de orden <b style={{ color: 'var(--yellow)' }}>#{orderId}</b>
          </div>
        </div>
      </FlowShell>
    );
  }

  // ── Step 6 · Terminal success screen ───────────────────────────────────────────
  // No more "Ver el estado de mi compra" page. The buyer is told that, as soon
  // as the team validates the payment, the ticket(s) will be sent to the
  // contact they picked in step 3 (WhatsApp or email). Only exit is the home.
  return (
    <Step6
      orderId={orderId}
      stage={stage}
      qty={qty}
      total={total}
      delivery={delivery}
      navigate={navigate}
    />
  );
}

function Step6({ orderId, stage, qty, total, delivery, navigate }) {
  // Submit was already marked from step 5 → 6; this is a no-op if so.
  useEffect(() => {
    if (orderId) {
      purchases.submit(orderId).catch(() => { /* already submitted or transient */ });
    }
  }, [orderId]);

  const methodLabel = delivery.method === 'email' ? 'correo' : 'WhatsApp';

  // navigate('/', { replace: true }) so the back button on the landing won't
  // pop the wizard back onto the stack — Ir a pagar really is final.
  const goHome = () => navigate('/', { replace: true });

  return (
    <FlowShell
      step={6}
      kicker="¡Listo!"
      title="Recibimos tu mensaje"
      onBack={null}
      cta="Volver al inicio"
      ctaIcon={<Ic n="home" s={20} />}
      onNext={goHome}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 12 }}>
        <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'rgba(95,190,123,0.14)', border: '1px solid rgba(95,190,123,0.4)', display: 'grid', placeItems: 'center', color: 'var(--green)' }}>
          <Ic n="check" s={40} />
        </div>
        <span className="pill sent" style={{ marginTop: 18, height: 34 }}><span className="dot" /> Pago enviado</span>
        <p className="muted" style={{ fontSize: 24.5, marginTop: 16, maxWidth: 320, lineHeight: 1.45 }}>
          Tan pronto nuestro equipo valide tu pago te enviaremos {qty > 1 ? 'las boletas' : 'la boleta'} a{' '}
          <b style={{ color: 'var(--green)' }}>{methodLabel}</b>.
        </p>
      </div>
      <div className="card" style={{ padding: 16, marginTop: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="label" style={{ color: 'var(--cream-dim)' }}>Orden #{orderId} · {stage?.name} × {qty}</div>
          </div>
          <div className="serif" style={{ fontSize: 22, color: 'var(--yellow)' }}>{formatCurrency(total)}</div>
        </div>
      </div>
    </FlowShell>
  );
}

export default PurchaseFlow;
