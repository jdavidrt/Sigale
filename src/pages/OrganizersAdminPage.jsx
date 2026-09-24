/*
 * OrganizersAdminPage — /organizers  (super_admin only)
 * List every organizer account, create one, change role/active state, reset
 * a password, and edit which events an account is assigned to.
 */
import { useCallback, useEffect, useState } from 'react';
import { Ic } from '../components/ui/Ic';
import { EmptyStateCard } from '../components/ui/EmptyStateCard';
import { useLanguage } from '../context/LanguageContext';
import { useDialog } from '../context/DialogContext';
import { organizersApi } from '../api/organizers';
import { eventsApi } from '../api/events';
import { getAuth } from '../api/admin';

function authOpts() {
  const auth = getAuth();
  return auth?.basic ? { headers: { Authorization: `Basic ${auth.basic}` } } : undefined;
}

export function OrganizersAdminPage() {
  const { t } = useLanguage();
  const { notify, openCustom } = useDialog();

  const [rows, setRows] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orgs, evs] = await Promise.all([
        organizersApi.list(),
        eventsApi.listAll(authOpts(), { includeArchived: true }).catch(() => []),
      ]);
      setRows(orgs);
      setEvents(evs);
    } catch (err) {
      notify({ message: err?.message || t('error'), tone: 'error' });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const patch = async (id, body) => {
    setBusyId(id);
    try {
      await organizersApi.update(id, body);
      await load();
    } catch (err) {
      notify({ message: err?.message || t('error'), tone: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const openCreate = () => {
    openCustom((close) => (
      <CreateAccountForm
        onClose={close}
        onCreated={async () => { close(); await load(); }}
        t={t}
        notify={notify}
      />
    ));
  };

  const openEditEvents = (row) => {
    openCustom((close) => (
      <AssignEventsForm
        organizer={row}
        events={events}
        onClose={close}
        onSaved={async () => { close(); await load(); }}
        t={t}
        notify={notify}
      />
    ));
  };

  const openResetPassword = (row) => {
    openCustom((close) => (
      <ResetPasswordForm
        organizer={row}
        onClose={close}
        onSaved={async (password) => { close(); await patch(row.id, { password }); }}
        t={t}
        notify={notify}
      />
    ));
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div className="serif" style={{ fontSize: 22, color: 'var(--cream)' }}>{t('organizersAdminTitle')}</div>
        <button className="btn sm" type="button" onClick={openCreate}>
          <Ic n="plus" s={16} /> {t('newAccount')}
        </button>
      </div>

      {loading ? (
        <p className="muted">{t('loading')}…</p>
      ) : rows.length === 0 ? (
        <EmptyStateCard icon={<Ic n="user" s={28} />} title={t('organizersAdminTitle')} description="" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((row) => {
            const eventNames = row.eventIds
              .map((id) => events.find((e) => String(e.id) === String(id))?.name)
              .filter(Boolean);
            return (
              <div key={row.id} className="trow" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cream)' }}>{row.username}</div>
                  <span className={`pill ${row.isActive ? 'ok' : 'dead'}`}><span className="dot" /> {row.isActive ? t('active') : t('inactive')}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="label" style={{ color: 'var(--cream-dim)' }}>{t('role')}</span>
                  <select
                    className="input"
                    style={{ minHeight: 36, width: 'auto' }}
                    value={row.role}
                    disabled={busyId === row.id}
                    onChange={(e) => patch(row.id, { role: e.target.value })}
                  >
                    <option value="super_admin">super_admin</option>
                    <option value="event_admin">event_admin</option>
                  </select>
                </div>
                {row.role === 'event_admin' && (
                  <div style={{ fontSize: 13, color: 'var(--cream-dim)' }}>
                    {t('assignedEvents')}: {eventNames.length > 0 ? eventNames.join(', ') : '—'}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    className="btn sm"
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => patch(row.id, { isActive: !row.isActive })}
                    style={{ background: 'transparent', border: '1px solid var(--frame)', color: row.isActive ? 'var(--red, #f87171)' : 'var(--green)', boxShadow: 'none' }}
                  >
                    {row.isActive ? t('inactive') : t('active')}
                  </button>
                  {row.role === 'event_admin' && (
                    <button className="btn sm" type="button" onClick={() => openEditEvents(row)} style={{ background: 'transparent', border: '1px solid var(--frame)', color: 'var(--lilac)', boxShadow: 'none' }}>
                      <Ic n="cal" s={16} /> {t('assignedEvents')}
                    </button>
                  )}
                  <button className="btn sm" type="button" onClick={() => openResetPassword(row)} style={{ background: 'transparent', border: '1px solid var(--frame)', color: 'var(--lilac)', boxShadow: 'none' }}>
                    <Ic n="lock" s={16} /> {t('resetPassword')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreateAccountForm({ onClose, onCreated, t, notify }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('event_admin');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await organizersApi.create({ username: username.trim(), password, role });
      notify({ message: t('eventCreated') || 'Cuenta creada.', tone: 'success' });
      onCreated();
    } catch (err) {
      notify({ message: err?.message || t('error'), tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-light">
      <h2 style={{ margin: '0 0 16px' }}>{t('newAccount')}</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="field">
          <div className="flabel"><span className="label">{t('username')}</span></div>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="off" />
        </div>
        <div className="field">
          <div className="flabel"><span className="label">{t('password')}</span></div>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
        </div>
        <div className="field">
          <div className="flabel"><span className="label">{t('role')}</span></div>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="event_admin">event_admin</option>
            <option value="super_admin">super_admin</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn sm" onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--frame)', color: 'var(--cream-dim)', boxShadow: 'none' }}>{t('cancel')}</button>
          <button type="submit" className="btn sm" disabled={saving}>{saving ? '…' : t('newAccount')}</button>
        </div>
      </form>
    </div>
  );
}

function AssignEventsForm({ organizer, events, onClose, onSaved, t, notify }) {
  const [selected, setSelected] = useState(new Set(organizer.eventIds.map(String)));
  const [saving, setSaving] = useState(false);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await organizersApi.setEvents(organizer.id, [...selected]);
      onSaved();
    } catch (err) {
      notify({ message: err?.message || t('error'), tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-light">
      <h2 style={{ margin: '0 0 16px' }}>{t('assignedEvents')} · {organizer.username}</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {events.map((ev) => (
            <label key={ev.id} className="checkrow">
              <input type="checkbox" checked={selected.has(String(ev.id))} onChange={() => toggle(ev.id)} />
              <span className="checklabel">{ev.name}{ev.isArchived ? ` (${t('archived')})` : ''}</span>
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn sm" onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--frame)', color: 'var(--cream-dim)', boxShadow: 'none' }}>{t('cancel')}</button>
          <button type="submit" className="btn sm" disabled={saving}>{saving ? '…' : t('confirm')}</button>
        </div>
      </form>
    </div>
  );
}

function ResetPasswordForm({ organizer, onClose, onSaved, t, notify }) {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      notify({ message: t('idInvalid') || 'Mínimo 8 caracteres', tone: 'error' });
      return;
    }
    setSaving(true);
    try {
      await onSaved(password);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-light">
      <h2 style={{ margin: '0 0 16px' }}>{t('resetPassword')} · {organizer.username}</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="field">
          <div className="flabel"><span className="label">{t('password')}</span></div>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn sm" onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--frame)', color: 'var(--cream-dim)', boxShadow: 'none' }}>{t('cancel')}</button>
          <button type="submit" className="btn sm" disabled={saving}>{saving ? '…' : t('resetPassword')}</button>
        </div>
      </form>
    </div>
  );
}

export default OrganizersAdminPage;
