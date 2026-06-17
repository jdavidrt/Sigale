/*
 * OfflineScanner — the camera + result surface for the offline-first door
 * (Phase 4). Reuses html5-qrcode like the 1.0 QRScanner, but validation is
 * 100% local: it hands the decoded hash to `validate` (useOfflineScan), which
 * checks the IndexedDB cache and queues the admit. No network on the hot path.
 *
 * The result is large and glanceable — one .pill-coloured verdict, one-handed
 * at the door: green = adelante, red = ya ingresó, grey = no válida.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { parseQRData } from '../../utils/qrGenerator';
import { SCAN_RESULT } from '../../hooks/useOfflineScan';
import { Ic } from '../ui/Ic';

const READER_ID = 'scan-reader';
const SCAN_CONFIG = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };

// Verdict styling maps onto the .pill color language (color + icon + label).
const VERDICT = {
  [SCAN_RESULT.OK]: { pill: 'ok', icon: 'check', title: 'Adelante', sub: 'Ingreso registrado' },
  [SCAN_RESULT.ALREADY_USED]: { pill: 'no', icon: 'lock', title: 'Ya ingresó', sub: 'Boleta usada' },
  [SCAN_RESULT.INVALID]: { pill: 'dead', icon: 'bell', title: 'No válida', sub: 'Boleta no encontrada' },
};

export function OfflineScanner({ validate }) {
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const scannerRef = useRef(null);
  const pendingRef = useRef(false);
  const busyRef = useRef(false);

  const stop = useCallback(async () => {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.stop();
    } catch {
      /* ignore */
    }
    scannerRef.current = null;
    setScanning(false);
  }, []);

  const onDecode = useCallback(
    async (decodedText) => {
      if (busyRef.current) return;
      busyRef.current = true;
      await stop();

      const qr = parseQRData(decodedText);
      const hash = qr?.hash;
      if (!hash) {
        setResult({ result: SCAN_RESULT.INVALID });
        busyRef.current = false;
        return;
      }
      const outcome = await validate(hash);
      setResult({ ...outcome, holderName: outcome.ticket?.holderName });
      busyRef.current = false;
    },
    [stop, validate],
  );

  const start = useCallback(async () => {
    if (scannerRef.current) return;
    const qr = new Html5Qrcode(READER_ID);
    const onErr = (e) => {
      if (!String(e).includes('NotFoundException')) console.warn('Scan error:', e);
    };
    try {
      await qr.start({ facingMode: { exact: 'environment' } }, SCAN_CONFIG, onDecode, onErr);
    } catch {
      try {
        await qr.start({ facingMode: 'environment' }, SCAN_CONFIG, onDecode, onErr);
      } catch (err2) {
        const msg = String(err2).toLowerCase();
        if (msg.includes('permission') || msg.includes('denied') || msg.includes('notallowed')) {
          setPermissionDenied(true);
        } else {
          console.error('Camera start failed:', err2);
        }
        setScanning(false);
        return;
      }
    }
    scannerRef.current = qr;
    setPermissionDenied(false);
  }, [onDecode]);

  // Auto-start on mount.
  useEffect(() => {
    setScanning(true);
    pendingRef.current = true;
  }, []);

  // Kick the camera once its viewport div is in the DOM.
  useEffect(() => {
    if (scanning && pendingRef.current && !scannerRef.current) {
      pendingRef.current = false;
      start();
    }
  }, [scanning, start]);

  // Cleanup.
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  const scanAnother = () => {
    setResult(null);
    setScanning(true);
    pendingRef.current = true;
  };

  if (result) {
    const v = VERDICT[result.result] || VERDICT[SCAN_RESULT.INVALID];
    return (
      <div className="card" style={{ padding: 22, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <span className={`pill ${v.pill}`} style={{ height: 40, fontSize: 16, padding: '0 18px' }}>
          <span className="dot" /> {v.title}
        </span>
        <div style={{ color: 'var(--cream)' }}>
          <Ic n={v.icon} s={48} />
        </div>
        {result.holderName && (
          <div className="serif" style={{ fontSize: 22, color: 'var(--cream)' }}>{result.holderName}</div>
        )}
        <div className="muted" style={{ fontSize: 14 }}>
          {v.sub}
          {result.result === SCAN_RESULT.ALREADY_USED && result.usedAt
            ? ` · ${new Date(result.usedAt).toLocaleString()}`
            : ''}
        </div>
        <button className="btn" style={{ marginTop: 6 }} onClick={scanAnother}>
          <Ic n="qr" s={18} /> Escanear otra
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {permissionDenied && (
        <div className="card" style={{ padding: 16, color: 'var(--red)' }}>
          Permiso de cámara denegado. Habilítalo en el navegador para escanear.
        </div>
      )}
      <div className="card" style={{ padding: 12 }}>
        <div id={READER_ID} style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }} />
        <p className="muted" style={{ textAlign: 'center', fontSize: 13, marginTop: 10 }}>
          Apunta al código QR de la boleta
        </p>
      </div>
    </div>
  );
}

export default OfflineScanner;
