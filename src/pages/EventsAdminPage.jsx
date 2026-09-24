/*
 * EventsAdminPage — /events-admin  (super_admin only)
 * Every event (with a "show archived" toggle), per-row published/salesOpen/
 * archived state, a link into the existing edit form, and archive/unarchive.
 * Assigning event_admins to an event happens on /organizers (an
 * organizer-centric picker, not duplicated here).
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ic } from '../components/ui/Ic';
import { EmptyStateCard } from '../components/ui/EmptyStateCard';
import { useLanguage } from '../context/LanguageContext';
import { useEvent } from '../context/EventContext';
import { useDialog } from '../context/DialogContext';
import { eventsApi } from '../api/events';
import { getAuth } from '../api/admin';
import { parseLocalDate } from '../utils/timeFormat';

function authOpts() {
  const auth = getAuth();
  return auth?.basic ? { headers: { Authorization: `Basic ${auth.basic}` } } : undefined;
}

export function EventsAdminPage() {
  const { t } = useLanguage();
  const { notify, confirm } = useDialog();
  const { selectEvent } = useEvent();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async (includeArchived) => {
    setLoading(true);
    try {
      const list = await eventsApi.listAll(authOpts(), { includeArchived });
      setRows(list);
    } catch (err) {
      notify({ message: err?.message || t('error'), tone: 'error' });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(showArchived); }, [load, showArchived]);

  const toggleArchive = async (row) => {
    const next = !row.isArchived;
    const ok = await confirm({
      title: next ? t('archiveEvent') : t('unarchiveEvent'),
      message: `${row.name}`,
      confirmLabel: next ? t('archiveEvent') : t('unarchiveEvent'),
      danger: next,
    });
    if (!ok) return;
    setBusyId(row.id);
    try {
      await eventsApi.archive(row.id, next, authOpts());
      await load(showArchived);
    } catch (err) {
      notify({ message: err?.message || t('error'), tone: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const editEvent = async (row) => {
    await selectEvent(row.id);
    navigate('/edit');
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div className="serif" style={{ fontSize: 22, color: 'var(--cream)' }}>{t('eventsAdminTitle')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--cream-dim)', minHeight: 44 }}>
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            {t('showArchived')}
          </label>
          <button className="btn sm" type="button" onClick={() => navigate('/create-event')}>
            <Ic n="plus" s={18} /> {t('createEvent')}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="muted">{t('loading')}…</p>
      ) : rows.length === 0 ? (
        <EmptyStateCard icon={<Ic n="cal" s={28} />} title={t('eventsListEmpty')} description="" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((row) => {
            const d = row.date ? parseLocalDate(row.date) : null;
            const dateFmt = d ? d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
            return (
              <div key={row.id} className="trow" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, padding: '14px 16px', opacity: row.isArchived ? 0.6 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cream)' }}>
                    {row.name}{row.isDemo ? ` · ${t('demoPillLabel')}` : ''}
                  </div>
                  <div className="muted" style={{ fontSize: 13 }}>{dateFmt}</div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--cream-dim)' }}>
                  /{row.slug || '—'} · {row.venue || '—'}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className={`pill ${row.isPublished ? 'ok' : 'dead'}`}><span className="dot" /> {row.isPublished ? t('eventPublishedLabel') : t('inactive')}</span>
                  <span className={`pill ${row.salesOpen ? 'ok' : 'dead'}`}><span className="dot" /> {row.salesOpen ? t('eventSalesOpenLabel') : t('inactive')}</span>
                  {row.isArchived && <span className="pill no"><span className="dot" /> {t('archived')}</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn sm" type="button" onClick={() => editEvent(row)} style={{ background: 'transparent', border: '1px solid var(--frame)', color: 'var(--lilac)', boxShadow: 'none' }}>
                    <Ic n="pen" s={16} /> {t('editEvent')}
                  </button>
                  {!row.isDemo && (
                    <button
                      className="btn sm"
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => toggleArchive(row)}
                      style={{ background: 'transparent', border: '1px solid var(--frame)', color: row.isArchived ? 'var(--green)' : 'var(--red, #f87171)', boxShadow: 'none' }}
                    >
                      {row.isArchived ? t('unarchiveEvent') : t('archiveEvent')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default EventsAdminPage;
