/*
 * ScanPage — /scan  (public door check-in)
 *
 * No organizer login required: anyone opens /scan, picks the event they're
 * working, types its shared scanKeyword, and can then scan + mark-used FOR
 * THAT EVENT ONLY — many people can scan the same event at once from their
 * own phones.
 * The chosen { eventId, keyword } is remembered in sessionStorage so a
 * refresh mid-door doesn't re-ask; "Cambiar evento" clears it manually (also
 * how to recover from a mistyped keyword, surfaced as its own verdict).
 *
 * Each verdict speaks the .pill color language (green adelante / red ya
 * ingresó / grey no válida / grey sin conexión). Online-only: one request
 * per scan (see components/Scanner/DoorScanner.jsx).
 */
import { useEffect, useState } from 'react';
import { Screen } from '../components/ui/Screen';
import { Ic } from '../components/ui/Ic';
import { DoorScanner } from '../components/Scanner/DoorScanner';
import { scanAndAdmit, listScanEvents } from '../api/scan';
import { useLanguage } from '../context/LanguageContext';
import { parseLocalDate } from '../utils/timeFormat';

const SCOPE_KEY = 'sigale-scan-scope';

function readScope() {
  try {
    return JSON.parse(sessionStorage.getItem(SCOPE_KEY) || 'null');
  } catch {
    return null;
  }
}
function writeScope(scope) {
  try {
    if (scope) sessionStorage.setItem(SCOPE_KEY, JSON.stringify(scope));
    else sessionStorage.removeItem(SCOPE_KEY);
  } catch {
    /* non-fatal — worst case the operator re-enters after a refresh */
  }
}

export function ScanPage() {
  const { t } = useLanguage();
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [scope, setScope] = useState(() => readScope());

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const selectScope = (next) => {
    writeScope(next);
    setScope(next);
  };
  const changeEvent = () => {
    writeScope(null);
    setScope(null);
  };

  const validate = (hash) => scanAndAdmit(hash, scope);

  return (
    <Screen seed={7}>
      <div className="topbar">
        <div className="serif" style={{ fontSize: 20, color: 'var(--cream)' }}>{t('doorTitle')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            className={`pill ${online ? 'ok' : 'dead'}`}
            style={{ height: 28 }}
            title={online ? t('online') : t('offline')}
          >
            <span className="dot" /> {online ? t('online') : t('offline')}
          </span>
          {scope && (
            <button type="button" className="tb-btn" onClick={changeEvent}>
              <Ic n="cal" s={16} /> {t('scanChangeEvent')}
            </button>
          )}
        </div>
      </div>

      <div
        className="scr-body pad"
        style={{ zIndex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        {scope ? (
          <DoorScanner validate={validate} />
        ) : (
          <EventKeywordForm onSubmit={selectScope} />
        )}
      </div>
    </Screen>
  );
}

// ── Event + keyword entry ─────────────────────────────────────────────────────
function EventKeywordForm({ onSubmit }) {
  const { t } = useLanguage();
  const [events, setEvents] = useState(null); // null = loading
  const [eventId, setEventId] = useState('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    let cancelled = false;
    listScanEvents().then((rows) => {
      if (cancelled) return;
      setEvents(rows);
      if (rows.length === 1) setEventId(String(rows[0].id));
    });
    return () => { cancelled = true; };
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!eventId || !keyword.trim()) return;
    onSubmit({ eventId: Number(eventId), keyword: keyword.trim() });
  };

  return (
    <div className="card" style={{ padding: 20, maxWidth: 420, margin: '24px auto', width: '100%' }}>
      <div className="serif" style={{ fontSize: 20, color: 'var(--cream)', marginBottom: 4 }}>
        {t('scanPickEventTitle')}
      </div>
      <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>{t('scanPickEventDesc')}</p>

      {events === null ? (
        <p className="muted" style={{ textAlign: 'center', padding: '16px 0' }}>{t('loading')}</p>
      ) : events.length === 0 ? (
        <p className="muted" style={{ textAlign: 'center', padding: '16px 0' }}>{t('scanNoEvents')}</p>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field">
            <div className="flabel"><span className="label" style={{ color: 'var(--cream-dim)' }}>{t('event')}</span></div>
            <select className="input" value={eventId} onChange={(e) => setEventId(e.target.value)} required>
              <option value="" disabled>{t('selectEvent')}</option>
              {events.map((ev) => {
                const d = ev.eventDate ? parseLocalDate(String(ev.eventDate).split(' ')[0]) : null;
                const dateFmt = d ? d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '';
                return (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}{dateFmt ? ` · ${dateFmt}` : ''}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="field">
            <div className="flabel"><span className="label" style={{ color: 'var(--cream-dim)' }}>{t('scanKeywordFieldLabel')}</span></div>
            <input
              className="input"
              type="text"
              autoComplete="off"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t('scanKeywordPlaceholder')}
              required
            />
          </div>
          <button className="btn" type="submit" disabled={!eventId || !keyword.trim()}>
            <Ic n="qr" s={18} /> {t('scanStart')}
          </button>
        </form>
      )}
    </div>
  );
}

export default ScanPage;
