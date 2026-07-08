/*
 * ScanPage — /scan  (online door check-in)
 * The door operator's screen: point the camera at a ticket QR and the
 * scanner validates it directly against the live `tickets` table on the
 * server, marking entry in the same request. Each verdict speaks the .pill
 * color language (green adelante / red ya ingresó / grey no válida /
 * grey sin conexión). Online-only — no manifest download, no offline cache.
 */
import { useEffect, useState } from 'react';
import { Screen } from '../components/ui/Screen';
import { OrganizerMenu } from '../components/Layout/OrganizerMenu';
import { OfflineScanner } from '../components/Scanner/OfflineScanner';
import { scanAndAdmit } from '../api/scan';
import { useLanguage } from '../context/LanguageContext';

export function ScanPage() {
  const { t } = useLanguage();
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  // Reflect connectivity in the topbar pill so the operator knows the door
  // scanner (which needs the network for every scan) is reachable.
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
        {/* Camera + verdict — validation hits the server per scan. */}
        <OfflineScanner validate={scanAndAdmit} />
      </div>
    </Screen>
  );
}

export default ScanPage;
