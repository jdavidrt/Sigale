/*
 * AdminPage — /admin  (organizer panel)
 * Login gate → purchases review loop: folio search, status filters,
 * Confirmar pago / Rechazar (SlideToConfirm) row actions, and Registro
 * directo (walk-in). Runs on local data via `admin` (src/api/admin.js);
 * confirm mints a random validationHash so the buyer's status QR lights up.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Screen } from '../components/ui/Screen';
import { Ic } from '../components/ui/Ic';
import { SlideToConfirm } from '../components/Common/SlideToConfirm';
import { useEvent } from '../context/EventContext';
import { admin, isLoggedIn, logout } from '../api/admin';
import { statusMeta } from '../api/purchases';
import { SAMPLE_EVENT, resolveActiveStage } from '../utils/sampleEvent';
import { formatCurrency } from '../utils/timeFormat';

const FILTERS = [
  { key: '', label: 'Todas' },
  { key: 'pending_payment', label: 'Esperando' },
  { key: 'payment_submitted', label: 'Enviado' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'rejected', label: 'Rechazadas' },
];

export function AdminPage() {
  const [authed, setAuthed] = useState(isLoggedIn());
  if (!authed) return <Login onIn={() => setAuthed(true)} />;
  return <Panel onLogout={() => { logout(); setAuthed(false); }} />;
}

function Login({ onIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setBusy(true);
    try {
      await admin.login(username.trim(), password);
      onIn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen seed={11}>
      <div className="scr-body pad" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="charly" style={{ width: 64, height: 64, fontSize: 28, margin: '0 auto 14px' }}>✦</div>
          <div className="serif" style={{ fontSize: 28 }}>Panel del organizador</div>
          <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>Ingresa para revisar pagos</p>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field">
            <div className="flabel"><span style={{ color: 'var(--lilac)' }}><Ic n="user" s={16} /></span><span className="label" style={{ color: 'var(--cream-dim)' }}>Usuario</span></div>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          </div>
          <div className="field">
            <div className="flabel"><span style={{ color: 'var(--lilac)' }}><Ic n="lock" s={16} /></span><span className="label" style={{ color: 'var(--cream-dim)' }}>Contraseña</span></div>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          <button className="btn" type="submit" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</button>
        </form>
      </div>
    </Screen>
  );
}

function Panel({ onLogout }) {
  const { event: ctxEvent } = useEvent();
  const event = ctxEvent || SAMPLE_EVENT;
  const activeStage = resolveActiveStage(event);

  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');
  const [query, setQuery] = useState('');
  const [qty, setQty] = useState(1);

  const load = useCallback(async () => {
    setRows(await admin.list({ status: filter || undefined }));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const q = query.trim();
    return q ? rows.filter((r) => String(r.orderId).includes(q)) : rows;
  }, [rows, query]);

  const doConfirm = async (row) => { await admin.confirm(row); load(); };
  const doReject = async (row) => { await admin.reject(row); load(); };
  const doWalkIn = async () => {
    if (!activeStage) return;
    await admin.walkIn({
      stageName: activeStage.name,
      quantity: qty,
      totalAmount: (Number(activeStage.price) || 0) * qty,
    });
    setQty(1);
    load();
  };

  const pending = rows.filter((r) => r.status === 'payment_submitted').length;

  return (
    <Screen seed={11}>
      <div className="topbar">
        <div className="serif" style={{ fontSize: 20, color: 'var(--cream)' }}>Panel</div>
        <button className="tb-btn" onClick={onLogout}>Salir</button>
      </div>

      <div className="scr-body pad" style={{ zIndex: 1, overflowY: 'auto', gap: 14, display: 'flex', flexDirection: 'column' }}>
        {/* Walk-in (Registro directo) */}
        <div className="card" style={{ padding: 16 }}>
          <div className="label" style={{ color: 'var(--orange-soft)', marginBottom: 10 }}>Registro directo · Taquilla</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{activeStage?.name || 'Etapa'}</div>
              <div className="price">{formatCurrency((Number(activeStage?.price) || 0) * qty)}</div>
            </div>
            <div className="stepper">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span className="qv">{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(6, q + 1))}>+</button>
            </div>
          </div>
          <button className="btn sm" style={{ marginTop: 12 }} onClick={doWalkIn}><Ic n="plus" s={18} /> Registrar venta</button>
        </div>

        {/* Pending-review count (held inventory awaiting verification) */}
        {pending > 0 && (
          <div className="chip sent" style={{ alignSelf: 'flex-start', background: 'rgba(121,166,232,0.13)', borderColor: 'rgba(121,166,232,0.3)', color: 'var(--blue)' }}>
            {pending} pago{pending > 1 ? 's' : ''} por revisar
          </div>
        )}

        {/* Folio search + filters */}
        <div className="field">
          <div className="flabel"><span className="label" style={{ color: 'var(--cream-dim)' }}>Buscar folio</span></div>
          <input className="input" inputMode="numeric" placeholder="#123" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)}
              className="chip" style={filter === f.key ? { background: 'var(--purple)', borderColor: 'var(--purple)', color: '#fff' } : { background: 'transparent', borderColor: 'var(--frame)', color: 'var(--cream-dim)' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Purchases table */}
        {visible.length === 0 ? (
          <p className="muted" style={{ textAlign: 'center', padding: '24px 0' }}>No hay compras para este filtro.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visible.map((row) => {
              const meta = statusMeta(row.status);
              const actionable = row.status === 'pending_payment' || row.status === 'payment_submitted';
              return (
                <div key={row.orderId} className="trow" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                      <span className="folio" style={{ fontSize: 20, color: 'var(--yellow)' }}>#{row.orderId}</span>
                      <div className="muted" style={{ fontSize: 13 }}>{row.stageName} × {row.quantity}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="price">{formatCurrency(row.totalAmount)}</div>
                      <span className={`pill ${meta.pill}`} style={{ marginTop: 6, height: 26 }}><span className="dot" /> {meta.label}</span>
                    </div>
                  </div>
                  {actionable ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button className="btn sm" onClick={() => doConfirm(row)} style={{ background: 'var(--green)', boxShadow: 'none' }}>
                        <Ic n="check" s={18} /> Confirmar pago
                      </button>
                      <SlideToConfirm label="Desliza para rechazar" onConfirm={() => doReject(row)} />
                    </div>
                  ) : (
                    <div className="muted" style={{ fontSize: 13, textAlign: 'center', padding: '4px 0' }}>
                      {row.status === 'confirmed' ? 'Boletas emitidas' : 'Sin acciones disponibles'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Screen>
  );
}

export default AdminPage;
