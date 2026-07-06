/*
 * AdminPage — /admin (single organizer home + purchase queue)
 *
 * Previously split between /admin/create (Home) and /admin (Panel); both are
 * now merged into this single screen. Login → event-hero (name/venue/address/
 * date/stats) on top → purchase queue below. If no event exists, redirects to
 * the create-event form.
 *
 * All admin pages share the same chrome: AdminLayout (Screen + topbar +
 * OrganizerMenu sidebar — the menu shown in the design reference).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { Screen } from '../components/ui/Screen';
import { Ic } from '../components/ui/Ic';
import { SlideToConfirm } from '../components/Common/SlideToConfirm';
import { OrganizerMenu } from '../components/Layout/OrganizerMenu';
import { StorageErrorBanner } from '../components/Common/StorageErrorBanner';
import { useEvent } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { useDialog } from '../context/DialogContext';
import { admin, isLoggedIn, logout } from '../api/admin';
import { statusMeta } from '../api/purchases';
import { formatCurrency, formatTo12Hour, parseLocalDate } from '../utils/timeFormat';

// Filter groups for the admin queue. labelKey maps to translations.js.
// "Esperando" collapses both pre-payment states (pending_payment +
// payment_submitted) into one bucket since both require organizer action.
const FILTERS = [
  { key: 'all', labelKey: 'filterAll', statuses: null },
  { key: 'pending', labelKey: 'filterWaiting', statuses: ['pending_payment', 'payment_submitted'] },
  { key: 'confirmed', labelKey: 'filterConfirmed', statuses: ['confirmed'] },
  { key: 'rejected', labelKey: 'filterRejected', statuses: ['rejected'] },
];

export function AdminPage() {
  const [authed, setAuthed] = useState(isLoggedIn());
  if (!authed) return <Login onIn={() => setAuthed(true)} />;
  return <Panel onLogout={() => { logout(); setAuthed(false); }} />;
}

// ── Login ──────────────────────────────────────────────────────────────────────
function Login({ onIn }) {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setBusy(true);
    setErr('');
    try {
      await admin.login(username.trim(), password);
      onIn();
    } catch (error) {
      setErr(error.message || t('invalidCredentials'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen seed={11}>
      <div className="scr-body pad" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="charly" style={{ width: 64, height: 64, fontSize: 28, margin: '0 auto 14px' }}>✦</div>
          <div className="serif" style={{ fontSize: 28 }}>{t('organizerPanel')}</div>
          <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>{t('loginSubtitle')}</p>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field">
            <div className="flabel"><span style={{ color: 'var(--lilac)' }}><Ic n="user" s={16} /></span><span className="label" style={{ color: 'var(--cream-dim)' }}>{t('username')}</span></div>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          </div>
          <div className="field">
            <div className="flabel"><span style={{ color: 'var(--lilac)' }}><Ic n="lock" s={16} /></span><span className="label" style={{ color: 'var(--cream-dim)' }}>{t('password')}</span></div>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          {err && <p style={{ color: 'var(--red, #f87171)', fontSize: 13, margin: 0 }}>{err}</p>}
          <button className="btn" type="submit" disabled={busy}>{busy ? t('loggingIn') : t('logIn')}</button>
        </form>
      </div>
    </Screen>
  );
}

// ── Panel (post-login) ─────────────────────────────────────────────────────────
function Panel({ onLogout }) {
  const { t } = useLanguage();
  const { event, eventLoading, refreshEvent } = useEvent();

  if (eventLoading) {
    return (
      <Screen seed={11}>
        <div className="scr-body pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          <p className="muted">{t('loadingEvent')}</p>
        </div>
      </Screen>
    );
  }

  if (!event) {
    // No event yet → take the organizer to the dedicated create form.
    return <Navigate to="/create-event" replace />;
  }

  return <Home event={event} onLogout={onLogout} onRefreshEvent={refreshEvent} />;
}

// ── Home (event hero + purchases panel) ────────────────────────────────────────
function Home({ event, onLogout, onRefreshEvent: _onRefreshEvent }) {
  const { t } = useLanguage();
  const { openCustom } = useDialog();
  const navigate = useNavigate();
  const activeStage = event?.activeStage || (event?.stages || []).find((s) => s.status === 'active');

  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  // Always fetch the full list from the server; we filter on the client so
  // "Todas" really means all rows (the server's status param defaults to no
  // filter only when omitted, never when passed as undefined).
  const load = useCallback(async () => {
    setRows(await admin.list());
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const group = FILTERS.find((f) => f.key === filter);
    const allowed = group?.statuses; // null = all statuses
    const byStatus = allowed
      ? rows.filter((r) => allowed.includes(r.status))
      : rows;
    const q = query.trim();
    return q ? byStatus.filter((r) => String(r.orderId).includes(q)) : byStatus;
  }, [rows, query, filter]);

  const doConfirm = async (row) => { await admin.confirm(row); load(); };
  const doReject  = async (row) => { await admin.reject(row);  load(); };

  // Green confirmation modal — fires before confirming a payment
  const handleConfirm = (row) => {
    const firstHolder = Array.isArray(row.holders) && row.holders[0]?.name ? row.holders[0].name : null;
    openCustom((close) => (
      <div>
        <div style={{
          margin: '-12px -12px 20px', padding: '24px 16px',
          background: 'var(--color-tint-success-md)',
          borderBottom: '1px solid var(--color-border-success)',
          textAlign: 'center',
        }}>
          <div style={{ color: 'var(--green)', marginBottom: 10 }}><Ic n="check" s={44} sw={1.5} /></div>
          <div style={{ fontWeight: 700, fontSize: 21, color: 'var(--green)' }}>{t('confirmPurchaseTitle')}</div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: 18 }}>
            #{row.orderId} · {row.stageName} × {row.quantity}
          </div>
          {firstHolder && (
            <div style={{ color: 'var(--cream-dim)', fontSize: 16, marginTop: 6 }}>
              {firstHolder}{row.quantity > 1 ? ` +${row.quantity - 1}` : ''}
            </div>
          )}
          <div style={{ color: 'var(--cream-dim)', fontSize: 16, marginTop: 6 }}>{formatCurrency(row.totalAmount)}</div>
          <p style={{ color: 'var(--cream-dim)', fontSize: 15, marginTop: 14, marginBottom: 0 }}>{t('confirmPurchaseMsg')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn sm" type="button"
            style={{ background: 'transparent', border: '1px solid var(--frame)', color: 'var(--cream-dim)', boxShadow: 'none' }}
            onClick={close}>
            {t('cancel')}
          </button>
          <button className="btn sm" type="button"
            style={{ background: 'var(--green)', boxShadow: 'var(--shadow-btn-success)' }}
            onClick={() => { doConfirm(row); close(); }}>
            <Ic n="check" s={18} /> {t('confirmPayment')}
          </button>
        </div>
      </div>
    ));
  };

  // Red rejection modal — fires before deleting/rejecting an order
  const handleReject = (row) => {
    const firstHolder = Array.isArray(row.holders) && row.holders[0]?.name ? row.holders[0].name : null;
    openCustom((close) => (
      <div>
        <div style={{
          margin: '-12px -12px 20px', padding: '24px 16px',
          background: 'var(--color-tint-error-md)',
          borderBottom: '1px solid var(--color-border-error)',
          textAlign: 'center',
        }}>
          <div style={{ color: 'var(--red)', marginBottom: 10 }}><Ic n="warn" s={44} sw={1.5} /></div>
          <div style={{ fontWeight: 700, fontSize: 21, color: 'var(--red)' }}>{t('rejectPurchaseTitle')}</div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: 18 }}>
            #{row.orderId} · {row.stageName} × {row.quantity}
          </div>
          {firstHolder && (
            <div style={{ color: 'var(--cream-dim)', fontSize: 16, marginTop: 6 }}>
              {firstHolder}{row.quantity > 1 ? ` +${row.quantity - 1}` : ''}
            </div>
          )}
          <div style={{ color: 'var(--cream-dim)', fontSize: 16, marginTop: 6 }}>{formatCurrency(row.totalAmount)}</div>
          <p style={{ color: 'var(--red)', fontSize: 15, marginTop: 14, marginBottom: 0 }}>{t('rejectPurchaseMsg')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn sm" type="button"
            style={{ background: 'transparent', border: '1px solid var(--frame)', color: 'var(--cream-dim)', boxShadow: 'none' }}
            onClick={close}>
            {t('cancel')}
          </button>
          <button className="btn sm" type="button"
            style={{ background: 'var(--red)', boxShadow: 'var(--shadow-btn-error)' }}
            onClick={() => { doReject(row); close(); }}>
            <Ic n="warn" s={18} /> {t('rejectPurchaseBtn')}
          </button>
        </div>
      </div>
    ));
  };

  const pending = rows.filter((r) => r.status === 'payment_submitted').length;
  const confirmed = rows.filter((r) => r.status === 'confirmed');
  const totalSold = confirmed.reduce((acc, r) => acc + Number(r.quantity || 0), 0);
  const totalRevenue = confirmed.reduce((acc, r) => acc + Number(r.totalAmount || 0), 0);

  const dateStr = event.date ? parseLocalDate(event.date) : null;
  const dateFmt = dateStr
    ? dateStr.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <Screen seed={11}>
      <StorageErrorBanner />
      <div className="topbar" style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--black)' }}>
        <Link to="/admin" style={{ textDecoration: 'none' }}>
          <div className="serif" style={{ fontSize: 18, color: 'var(--cream)' }}>Sígale</div>
          <div className="muted" style={{ fontSize: 12 }}>Administración</div>
        </Link>
        <OrganizerMenu onLogout={onLogout} />
      </div>

      <div className="scr-body pad" style={{ zIndex: 1, overflowY: 'auto', paddingBottom: 24 }}>
      <div style={{ maxWidth: 960, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ─── Event hero — name, venue, address, date, quick stats ─── */}
        <div className="card" style={{ padding: 16 }}>
          <div className="serif" style={{ fontSize: 22, color: 'var(--cream)', marginBottom: 6 }}>{event.name}</div>
          <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
            <Ic n="cal" s={14} /> {dateFmt} · {formatTo12Hour(event.entranceTime || '00:00')}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
            <span style={{ color: 'var(--lilac)', marginTop: 2 }}><Ic n="map" s={16} /></span>
            <div>
              <div style={{ fontWeight: 600 }}>{event.venue || '—'}</div>
              <div className="muted" style={{ fontSize: 13 }}>{event.address || t('noAddressRegistered')}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="tile" style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)' }}>
              <div className="label" style={{ color: 'var(--cream-dim)' }}>{t('ticketsSold')}</div>
              <div className="serif" style={{ fontSize: 24, color: 'var(--yellow)' }}>{totalSold}</div>
            </div>
            <div className="tile" style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)' }}>
              <div className="label" style={{ color: 'var(--cream-dim)' }}>{t('collected')}</div>
              <div className="serif" style={{ fontSize: 24, color: 'var(--yellow)' }}>{formatCurrency(totalRevenue)}</div>
            </div>
          </div>
          <Link
            to="/edit"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12,
              color: 'var(--lilac)', textDecoration: 'none', fontSize: 13, fontWeight: 600,
            }}
          >
            <Ic n="pen" s={14} /> {t('editEvent')}
          </Link>
        </div>

        {/* ─── Registrar Venta — walk-in entry point ───
            Sends the organizer to /sell-tickets where they collect the
            buyer's name/ID/phone. The inline walk-in (qty stepper + instant
            commit) is gone; ticket-holder data is required up front so the
            confirmation list, the dashboard, and the door scanner all see
            the same holder names. */}
        <div className="card" style={{ padding: 16 }}>
          <div className="label" style={{ color: 'var(--orange-soft)', marginBottom: 10 }}>{t('doorRegistration')}</div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600 }}>{activeStage?.name || '—'}</div>
            <div className="price">{formatCurrency(Number(activeStage?.price) || 0)}</div>
          </div>
          <button
            className="btn sm"
            type="button"
            onClick={() => navigate('/sell-tickets')}
            disabled={!activeStage}
          >
            <Ic n="plus" s={18} /> {t('registerSale')}
          </button>
        </div>

        {/* ─── Artistas, crew y cortesías — free-entry roster, separate from
            ticket sales. Doesn't depend on there being an active priced
            stage, since these entries never touch ticket_stages. ─── */}
        <div className="card" style={{ padding: 16 }}>
          <div className="label" style={{ color: 'var(--orange-soft)', marginBottom: 10 }}>{t('guestPassesCardLabel')}</div>
          <button
            className="btn sm"
            type="button"
            onClick={() => navigate('/guest-passes')}
          >
            <Ic n="plus" s={18} /> {t('addArtistBtn')}
          </button>
        </div>

        {/* Pending count */}
        {pending > 0 && (
          <div className="chip sent" style={{ alignSelf: 'flex-start', background: 'rgba(121,166,232,0.13)', borderColor: 'rgba(121,166,232,0.3)', color: 'var(--blue)' }}>
            {t('paymentsToReview').replace('{n}', pending)}
          </div>
        )}

        {/* Order search + filters */}
        <div className="field">
          <div className="flabel"><span className="label" style={{ color: 'var(--cream-dim)' }}>{t('searchOrder')}</span></div>
          <input className="input" inputMode="numeric" placeholder="#123" value={query} onChange={(e) => setQuery(e.target.value.replace(/[^0-9]/g, ''))} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)}
              className="chip" style={filter === f.key
                ? { background: 'var(--purple)', borderColor: 'var(--purple)', color: '#fff' }
                : { background: 'transparent', borderColor: 'var(--frame)', color: 'var(--cream-dim)' }}>
              {t(f.labelKey)}
            </button>
          ))}
        </div>

        {/* Purchases list */}
        {visible.length === 0 ? (
          <p className="muted" style={{ textAlign: 'center', padding: '24px 0' }}>{t('noOrdersForFilter')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visible.map((row) => {
              const meta = statusMeta(row.status);
              const actionable = row.status === 'pending_payment' || row.status === 'payment_submitted';
              const firstHolder = Array.isArray(row.holders) && row.holders[0]?.name ? row.holders[0].name : null;
              return (
                <div key={row.orderId} className="trow" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Order ID */}
                    <span className="orden" style={{ fontSize: 20, color: 'var(--yellow)', flexShrink: 0 }}>#{row.orderId}</span>
                    {/* Col 1: buyer name */}
                    <div style={{ flex: 2, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {firstHolder || '—'}{firstHolder && row.quantity > 1 ? ` +${row.quantity - 1}` : ''}
                      </div>
                    </div>
                    {/* Col 2: stage × qty */}
                    <div style={{ flex: 1.5, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--cream-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.stageName} × {row.quantity}
                      </div>
                    </div>
                    {/* Col 3: status label (non-actionable only; keeps layout stable) */}
                    <div style={{ flex: 1.2, minWidth: 0 }}>
                      {!actionable && (
                        <div style={{ fontSize: 12, color: 'var(--cream-dim)', opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.status === 'confirmed' ? t('ticketsIssued') : t('noActionsAvailable')}
                        </div>
                      )}
                    </div>
                    {/* Price + status pill */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className="price">{formatCurrency(row.totalAmount)}</div>
                      <span className={`pill ${meta.pill}`} style={{ marginTop: 6, height: 26 }}><span className="dot" /> {meta.label}</span>
                    </div>
                  </div>
                  {actionable && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button className="btn sm" type="button" onClick={() => handleConfirm(row)} style={{ background: 'var(--green)', boxShadow: 'none' }}>
                        <Ic n="check" s={18} /> {t('confirmPayment')}
                      </button>
                      <SlideToConfirm label={t('slideToDelete')} onConfirm={() => handleReject(row)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </Screen>
  );
}

export default AdminPage;
