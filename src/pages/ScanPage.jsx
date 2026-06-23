/*
 * ScanPage — /scan  (offline-first door check-in, Phase 4)
 * The door operator's screen: download the confirmed-ticket manifest before
 * doors open, then scan with no network. Each verdict speaks the .pill color
 * language (green adelante / red ya ingresó / grey no válida). Admits are
 * written to the IndexedDB cache and queued; the queue reconciles with the
 * server on reconnect (earliest-usedAt wins).
 *
 * SINGLE-SCANNER ASSUMPTION (plan §7): one device is the source of truth
 * between syncs. Two offline devices could both admit the same ticket until
 * they sync — safe while a single device works the door.
 */
import { useState } from 'react';
import { Screen } from '../components/ui/Screen';
import { Ic } from '../components/ui/Ic';
import { OrganizerMenu } from '../components/Layout/OrganizerMenu';
import { OfflineScanner } from '../components/Scanner/OfflineScanner';
import { useOfflineScan, SCAN_RESULT } from '../hooks/useOfflineScan';
import { useEvent } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';

export function ScanPage() {
  const { t } = useLanguage();
  const { event } = useEvent();
  const { meta, cachedCount, pending, online, syncing, log, download, validate, sync } =
    useOfflineScan();
  const [downloading, setDownloading] = useState(false);

  // Build log verdict labels from translations so they switch with language.
  const LOG_META = {
    [SCAN_RESULT.OK]: { pill: 'ok', label: t('scanAdelante') },
    [SCAN_RESULT.ALREADY_USED]: { pill: 'no', label: t('scanAlreadyIn') },
    [SCAN_RESULT.INVALID]: { pill: 'dead', label: t('scanNotValid') },
  };

  const doDownload = async () => {
    setDownloading(true);
    try {
      await download(event?.id);
    } finally {
      setDownloading(false);
    }
  };

  const lastSync = meta?.generatedAt ? new Date(meta.generatedAt).toLocaleString() : null;

  return (
    <Screen seed={7}>
      <div className="topbar">
        <div className="serif" style={{ fontSize: 20, color: 'var(--cream)' }}>{t('doorTitle')}</div>
        {/* Online/offline pill + the shared organizer nav so the door page is
            no longer a dead-end. /scan stays public (no logout passed). */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            className={`pill ${online ? 'ok' : 'dead'}`}
            style={{ height: 28 }}
            title={online ? t('online') : t('offline')}
          >
            <span className="dot" /> {online ? t('online') : t('offline')}
          </span>
          <OrganizerMenu />
        </div>
      </div>

      <div
        className="scr-body pad"
        style={{ zIndex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        {/* Manifest status: how many tickets are cached for offline validation */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div className="label" style={{ color: 'var(--orange-soft)' }}>{t('ticketsCached')}</div>
              <div className="serif" style={{ fontSize: 26, color: 'var(--cream)' }}>{cachedCount}</div>
              {lastSync && (
                <div className="muted" style={{ fontSize: 12 }}>{t('lastUpdated')} {lastSync}</div>
              )}
            </div>
            <button className="btn sm" onClick={doDownload} disabled={downloading}>
              <Ic n="share" s={18} /> {downloading ? t('downloading') : t('download')}
            </button>
          </div>
          {cachedCount === 0 && (
            <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
              {t('downloadFirstDesc')}
            </p>
          )}
        </div>

        {/* Pending-sync banner: admits captured offline, awaiting the server */}
        {pending > 0 && (
          <div
            className="card"
            style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
          >
            <div>
              <div style={{ fontWeight: 600, color: 'var(--cream)' }}>
                {t('pendingSyncMsg').replace('{n}', pending)}
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                {online ? t('syncAutomatic') : t('syncOnReconnect')}
              </div>
            </div>
            <button className="btn sm" onClick={() => sync()} disabled={syncing || !online}>
              <Ic n="check" s={18} /> {syncing ? t('synchronizing') : t('synchronize')}
            </button>
          </div>
        )}

        {/* Camera + verdict */}
        <OfflineScanner validate={validate} />

        {/* Scan log */}
        {log.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="label" style={{ color: 'var(--cream-dim)' }}>{t('entryLog')}</div>
            {log.map((entry, i) => {
              const m = LOG_META[entry.result] || LOG_META[SCAN_RESULT.INVALID];
              return (
                <div
                  key={`${entry.hash}-${entry.at}-${i}`}
                  className="trow"
                  style={{ alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'var(--cream)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.holderName || t('entryDefault')}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {new Date(entry.at).toLocaleTimeString()}
                    </div>
                  </div>
                  <span className={`pill ${m.pill}`} style={{ height: 26 }}>
                    <span className="dot" /> {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Screen>
  );
}

export default ScanPage;
