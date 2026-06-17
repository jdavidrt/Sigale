/*
 * PurchaseStatusPage — /compra/:orderId
 * Renders the five-state machine (IMPLEMENTATION_GUIDE §6) by color + dot +
 * label together. On `confirmed` it reveals the QR(s), generated client-side
 * from each ticket's validationHash (never stored). Reads via `purchases.get`
 * (local today; the real GET /api/purchases/:orderId on cutover).
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Screen } from '../components/ui/Screen';
import { Ic } from '../components/ui/Ic';
import { purchases, statusMeta, PURCHASE_STATUS } from '../api/purchases';
import { formatCurrency } from '../utils/timeFormat';

const COPY = {
  pending_payment: 'Estamos esperando tu pago. Cuando transfieras y nos envíes el comprobante, lo verificamos.',
  payment_submitted: 'Recibimos tu comprobante. Nuestro equipo está verificando tu pago; te avisaremos por WhatsApp.',
  confirmed: '¡Pago confirmado! Estas son tus boletas. Muéstralas en la entrada.',
  rejected: 'No pudimos validar este pago. Escríbenos por WhatsApp para resolverlo.',
  expired: 'La reserva venció y el cupo se liberó. Puedes intentar comprar de nuevo.',
};

export function PurchaseStatusPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    let cancelled = false;
    Promise.resolve(purchases.get(orderId)).then((p) => {
      if (!cancelled) setPurchase(p);
    });
    return () => { cancelled = true; };
  }, [orderId]);

  if (purchase === undefined) {
    return (
      <Screen seed={42}>
        <div className="scr-body pad" style={{ display: 'grid', placeItems: 'center', zIndex: 1 }}>
          <div className="muted">Cargando tu compra…</div>
        </div>
      </Screen>
    );
  }

  if (purchase === null) {
    return (
      <Screen seed={42}>
        <div className="scr-body pad" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12, zIndex: 1 }}>
          <div className="charly" style={{ width: 64, height: 64, fontSize: 28 }}>✦</div>
          <div className="serif" style={{ fontSize: 24 }}>No encontramos esa orden</div>
          <p className="muted" style={{ maxWidth: 280 }}>Revisa el número de orden (#{orderId}) o vuelve al inicio.</p>
          <button className="btn ghost sm" onClick={() => navigate('/evento/sample')}>Volver</button>
        </div>
      </Screen>
    );
  }

  const meta = statusMeta(purchase.status);
  const isConfirmed = purchase.status === PURCHASE_STATUS.CONFIRMED;
  const tickets = purchase.tickets || [];

  return (
    <Screen seed={42}>
      <div className="topbar">
        <button className="tb-btn icon" onClick={() => navigate(`/evento/${purchase.eventId ?? 'sample'}`)} aria-label="Inicio">
          <Ic n="home" s={20} />
        </button>
        <div className="serif" style={{ fontSize: 18, color: 'var(--cream)' }}>Sígale</div>
        <div style={{ width: 44 }} />
      </div>

      <div className="scr-body pad" style={{ zIndex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 8 }}>
          <div className="label" style={{ color: 'var(--cream-dim)' }}>Orden</div>
          <div className="folio" style={{ fontSize: 40, color: 'var(--yellow)' }}>#{purchase.orderId}</div>
          <span className={`pill ${meta.pill}`} style={{ marginTop: 14, height: 34 }}>
            <span className="dot" /> {meta.label}
          </span>
          <p className="muted" style={{ fontSize: 15, marginTop: 14, maxWidth: 300, lineHeight: 1.45 }}>
            {COPY[purchase.status] || ''}
          </p>
        </div>

        {isConfirmed && tickets.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
            {tickets.map((tk, i) => (
              <div className="card stub" key={tk.id || i} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ background: '#fff', padding: 8, borderRadius: 'var(--r-md)' }}>
                  <QRCodeSVG value={tk.validationHash || ''} size={96} />
                </div>
                <div>
                  <div className="label" style={{ color: 'var(--cream-dim)' }}>Boleta {i + 1}</div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{tk.holderName}</div>
                  {tk.isUsed ? <span className="chip" style={{ marginTop: 8 }}>Usada</span> : null}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card" style={{ padding: 16, marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="label" style={{ color: 'var(--cream-dim)' }}>{purchase.stageName} × {purchase.quantity}</div>
            <div className="muted" style={{ fontSize: 13 }}>{purchase.deliveryMethod === 'email' ? 'Entrega por email' : 'Entrega por WhatsApp'}</div>
          </div>
          <div className="serif" style={{ fontSize: 24, color: 'var(--yellow)' }}>{formatCurrency(purchase.totalAmount)}</div>
        </div>
      </div>
    </Screen>
  );
}

export default PurchaseStatusPage;
