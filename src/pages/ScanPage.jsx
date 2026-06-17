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
import { OfflineScanner } from '../components/Scanner/OfflineScanner';
import { useOfflineScan, SCAN_RESULT } from '../hooks/useOfflineScan';
import { useEvent } from '../context/EventContext';

const LOG_META = {
  [SCAN_RESULT.OK]: { pill: 'ok', label: 'Adelante' },
  [SCAN_RESULT.ALREADY_USED]: { pill: 'no', label: 'Ya ingresó' },
  [SCAN_RESULT.INVALID]: { pill: 'dead', label: 'No válida' },
};

export function ScanPage() {
  const { event } = useEvent();
  const { meta, cachedCount, pending, online, syncing, log, download, validate, sync } =
    useOfflineScan();
  const [downloading, setDownloading] = useState(false);

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
        <div className="serif" style={{ fontSize: 20, color: 'var(--cream)' }}>Puerta</div>
        <span
          className={`pill ${online ? 'ok' : 'dead'}`}
          style={{ height: 28 }}
          title={online ? 'En línea' : 'Sin conexión'}
        >
          <span className="dot" /> {online ? 'En línea' : 'Sin conexión'}
        </span>
      </div>

      <div
        className="scr-body pad"
        style={{ zIndex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        {/* Manifest status: how many tickets are cached for offline validation */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div className="label" style={{ color: 'var(--orange-soft)' }}>Boletas en caché</div>
              <div className="serif" style={{ fontSize: 26, color: 'var(--cream)' }}>{cachedCount}</div>
              {lastSync && (
                <div className="muted" style={{ fontSize: 12 }}>Actualizado: {lastSync}</div>
              )}
            </div>
            <button className="btn sm" onClick={doDownload} disabled={downloading}>
              <Ic n="share" s={18} /> {downloading ? 'Descargando…' : 'Descargar'}
            </button>
          </div>
          {cachedCount === 0 && (
            <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
              Descarga la lista de boletas confirmadas antes de abrir puertas. Luego el escáner
              funciona sin internet.
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
                {pending} ingreso{pending > 1 ? 's' : ''} por sincronizar
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                {online ? 'Se sincronizan automáticamente' : 'Se enviarán al recuperar conexión'}
              </div>
            </div>
            <button className="btn sm" onClick={() => sync()} disabled={syncing || !online}>
              <Ic n="check" s={18} /> {syncing ? 'Sincronizando…' : 'Sincronizar'}
            </button>
          </div>
        )}

        {/* Camera + verdict */}
        <OfflineScanner validate={validate} />

        {/* Scan log */}
        {log.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="label" style={{ color: 'var(--cream-dim)' }}>Registro de ingresos</div>
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
                      {entry.holderName || 'Boleta'}
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
