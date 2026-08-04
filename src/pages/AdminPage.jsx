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
import { QRDisplay } from '../components/Tickets/QRDisplay';
import { useEvent } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { useDialog } from '../context/DialogContext';
import { fromServerTicket } from '../context/TicketContext';
import { admin, isLoggedIn, logout } from '../api/admin';
import { statusMeta } from '../api/purchases';
import { formatCurrency, formatDateTime, formatTo12Hour, parseLocalDate } from '../utils/timeFormat';

// Filter groups for the admin queue. labelKey maps to translations.js.
// "Esperando" collapses both pre-payment states (pending_payment +
// payment_submitted) into one bucket since both require organizer action.
const FILTERS = [
  { key: 'all', labelKey: 'filterAll', statuses: null },
  { key: 'pending', labelKey: 'filterWaiting', statuses: ['pending_payment', 'payment_submitted'] },
  { key: 'confirmed', labelKey: 'filterConfirmed', statuses: ['confirmed'] },
  { key: 'rejected', labelKey: 'filterRejected', statuses: ['rejected'] },
];

// Normalize a buyer contact number to a wa.me target: digits only, and prefix
// Colombia's +57 for bare 10-digit local numbers so organizers can tap through
// to WhatsApp even when the buyer typed the number without a country code.
function waHref(contact) {
  const digits = String(contact || '').replace(/\D/g, '');
  const num = digits.length === 10 ? `57${digits}` : digits;
  return `https://wa.me/${num}`;
}

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
  const [persist, setPersist] = useState(true);

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setBusy(true);
    setErr('');
    try {
      await admin.login(username.trim(), password, { persist });
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
          <label className="checkrow">
            <input
              type="checkbox"
              checked={persist}
              onChange={(e) => setPersist(e.target.checked)}
            />
            <span className="checklabel">{t('keepSignedIn')}</span>
          </label>
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
  const { event, eventLoading, refreshEvent, organizerEvents } = useEvent();

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
    // Multi-event: `event` can be transiently null while OrganizerMenu's
    // mount-time refreshOrganizerEvents() is still in flight, so only bounce
    // to the create form once we know for sure the organizer has no events.
    if (organizerEvents.length === 0) {
      return <Navigate to="/create-event" replace />;
    }
    return (
      <Screen seed={11}>
        <div className="scr-body pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          <p className="muted">{t('loadingEvent')}</p>
        </div>
      </Screen>
    );
  }

  return <Home event={event} onLogout={onLogout} onRefreshEvent={refreshEvent} />;
}

// ── Home (event hero + purchases panel) ────────────────────────────────────────
function Home({ event, onLogout, onRefreshEvent }) {
  const { t } = useLanguage();
  const { openCustom } = useDialog();
  const navigate = useNavigate();
  const activeStage = event?.activeStage || (event?.stages || []).find((s) => s.status === 'active');

  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  // `working` drives the full-screen loading overlay while a confirm/reject is
  // in flight; `ticketsByOrder` holds the confirmed seats (with validationHash)
  // that back the share drawer; `shareOrder` is the order whose drawer is open.
  const [working, setWorking] = useState(false);
  const [ticketsByOrder, setTicketsByOrder] = useState({});
  const [shareOrder, setShareOrder] = useState(null);

  // Always fetch the full list from the server; we filter on the client so
  // "Todas" really means all rows (the server's status param defaults to no
  // filter only when omitted, never when passed as undefined). In parallel we
  // pull the confirmed ticket rows — the purchases aggregate has no
  // validationHash, so the share drawer needs the per-seat rows to build QRs.
  const load = useCallback(async () => {
    if (!event?.id) return;
    const [purchaseRows, ticketRows] = await Promise.all([
      admin.list({ eventId: event.id }),
      admin.listTickets('confirmed', event.id).catch(() => []),
    ]);
    setRows(purchaseRows);
    const map = {};
    for (const r of (Array.isArray(ticketRows) ? ticketRows : [])) {
      (map[r.orderId] ||= []).push(fromServerTicket(r));
    }
    setTicketsByOrder(map);
  }, [event?.id]);

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

  // Confirm/reject show a loading overlay, then refetch the list and refresh
  // the event so the hero stats + active-stage cupos reflect the change.
  const doConfirm = async (row) => {
    setWorking(true);
    try { await admin.confirm(row); await load(); onRefreshEvent?.(); }
    finally { setWorking(false); }
  };
  const doReject = async (row) => {
    setWorking(true);
    try { await admin.reject(row); await load(); onRefreshEvent?.(); }
    finally { setWorking(false); }
  };

  // Green confirmation modal — fires before confirming a payment
  const handleConfirm = (row) => {
    const firstHolder = Array.isArray(row.holders) && row.holders[0]?.name ? row.holders[0].name : null;
    openCustom((close) => (
      <div className="modal-light">
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
      <div className="modal-light">
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
            <div className="label" style={{ color: 'var(--purple-2)', marginBottom: 10 }}>{t('guestPassesCardLabel')}</div>
            <button
              className="btn sm"
              type="button"
              style={{ background: 'var(--purple-2)', color: '#fff' }}
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
                const hasContact = row.deliveryContact && row.deliveryMethod !== 'taquilla';
                return (
                  <div key={row.orderId} className="trow" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, padding: '14px 16px' }}>
                    {/* Row 1: order id + total */}
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                      <span className="orden" style={{ fontSize: 18, color: 'var(--yellow)' }}>#{row.orderId}</span>
                      <div className="price" style={{ fontSize: 17 }}>{formatCurrency(row.totalAmount)}</div>
                    </div>

                    {/* Row 2: buyer name — full width so it stays readable on a phone */}
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cream)', lineHeight: 1.3, wordBreak: 'break-word' }}>
                      {firstHolder || '—'}
                      {firstHolder && row.quantity > 1 && (
                        <span style={{ color: 'var(--cream-dim)', fontWeight: 600 }}> +{row.quantity - 1}</span>
                      )}
                    </div>

                    {/* Row 2b: buyer contact (WhatsApp/email logged at purchase) +
                        reservation time — lets the organizer follow up directly
                        on orders that never complete payment. */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', fontSize: 13, color: 'var(--cream-dim)' }}>
                      {hasContact && (
                        row.deliveryMethod === 'whatsapp' ? (
                          <a
                            href={waHref(row.deliveryContact)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5, wordBreak: 'break-all',
                              color: 'var(--green)', textDecoration: 'underline', cursor: 'pointer',
                            }}
                          >
                            <Ic n="wa" s={13} fill />
                            {row.deliveryContact}
                          </a>
                        ) : (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5, wordBreak: 'break-all',
                            color: 'var(--lilac)',
                          }}>
                            ✉ {row.deliveryContact}
                          </span>
                        )
                      )}
                      {row.createdAt && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Ic n="clock" s={13} /> {t('reservedAt')} {formatDateTime(row.createdAt)}
                        </span>
                      )}
                    </div>

                    {/* Row 3: stage · qty + status pill */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 13, color: 'var(--cream-dim)' }}>
                        {row.stageName} · ×{row.quantity}
                      </div>
                      <span className={`pill ${meta.pill}`} style={{ height: 26 }}><span className="dot" /> {meta.label}</span>
                    </div>

                    {/* Row 4: actions — confirm/reject while pending, share once confirmed */}
                    {actionable ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button className="btn sm" type="button" onClick={() => handleConfirm(row)} style={{ background: 'var(--green)', boxShadow: 'none' }}>
                          <Ic n="check" s={18} /> {t('confirmPayment')}
                        </button>
                        <SlideToConfirm label={t('slideToDelete')} onConfirm={() => handleReject(row)} />
                      </div>
                    ) : row.status === 'confirmed' ? (
                      <button
                        className="btn sm"
                        type="button"
                        onClick={() => setShareOrder(row)}
                        style={{ background: 'transparent', border: '1px solid var(--frame)', color: 'var(--lilac)', boxShadow: 'none' }}
                      >
                        <Ic n="share" s={18} /> {t('shareTicket')}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay — shown while a confirm/reject is in flight, then the
          list + event stats refresh underneath it. */}
      {working && (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
            background: 'rgba(8,6,14,0.72)', backdropFilter: 'blur(2px)',
          }}
        >
          <div className="spinner" aria-hidden="true">
            <span className="spinner-ring" />
            <span className="spinner-core"><Ic n="ticket" /></span>
          </div>
          <p className="muted" style={{ fontSize: 14 }}>{t('processing')}</p>
        </div>
      )}

      {/* Share drawer — bottom sheet listing each confirmed seat of an order,
          each shareable via the reused QRDisplay (Copy / Share). */}
      {shareOrder && (
        <ShareDrawer
          order={shareOrder}
          tickets={ticketsByOrder[shareOrder.orderId] || []}
          event={event}
          onClose={() => setShareOrder(null)}
        />
      )}
    </Screen>
  );
}

// ── ShareDrawer — bottom sheet for sharing a confirmed order's ticket(s) ────────
// Adapts the OrganizerMenu overlay pattern (fixed inset + backdrop + panel) into
// a bottom sheet. Renders one QRDisplay per seat so each holder's QR can be
// shared straight from /admin without visiting /tickets.
function ShareDrawer({ order, tickets, event, onClose }) {
  const { t } = useLanguage();
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 55, display: 'flex', alignItems: 'flex-end' }}>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(8,6,14,0.6)', backdropFilter: 'blur(2px)' }}
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'relative',
          width: '100%',
          maxHeight: '85vh',
          background: 'var(--ink, #16121f)',
          borderTop: '1px solid var(--frame)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: '14px 16px calc(20px + env(safe-area-inset-bottom, 0px))',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span className="serif" style={{ fontSize: 18, color: 'var(--cream)' }}>
            {t('shareTicket')} · #{order.orderId}
          </span>
          <button
            type="button"
            className="tb-btn"
            onClick={onClose}
            aria-label={t('cancel')}
          >
            <Ic n="plus" s={18} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>

        {tickets.length === 0 ? (
          <p className="muted" style={{ textAlign: 'center', padding: '20px 0' }}>{t('loading')}</p>
        ) : (
          tickets.map((ticket, i) => (
            <div
              key={ticket.dbId}
              style={{
                border: '1px solid var(--frame)', borderRadius: 12,
                padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream)', wordBreak: 'break-word' }}>
                  {ticket.buyerName || '—'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--cream-dim)', whiteSpace: 'nowrap' }}>
                  {t('ticketWord')} {i + 1}/{tickets.length}
                </span>
              </div>
              <QRDisplay ticket={ticket} event={event} compact />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminPage;
