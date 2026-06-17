/*
 * useOfflineScan — the offline-first door-scan lifecycle in one hook.
 *
 * It owns the bridge between the IndexedDB cache (src/utils/scanDb.js) and the
 * server reconciliation (src/api/scan.js), and exposes a tiny surface the
 * /scan page renders:
 *
 *   meta, cachedCount  — the downloaded manifest ("ready for N tickets")
 *   pending            — scans queued while offline, awaiting sync
 *   online             — navigator connectivity (auto-syncs on reconnect)
 *   log                — recent admits/duplicates for the operator
 *   download(eventId)  — pull the manifest before doors open
 *   validate(hash)     — local check: valid / invalid / already-used
 *   sync()             — drain the queue to the server
 *
 * Validation is 100% local, so the door keeps moving with no network. Admits
 * are written to the cache immediately and queued; the queue reconciles on
 * reconnect with the server's earliest-usedAt rule. Single-scanner assumption
 * (plan §7) documented at the cache layer.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  lookupTicket,
  markLocalUsed,
  enqueueScan,
  getQueue,
  queueSize,
  manifestCount,
  getManifestMeta,
  clearQueueHashes,
  appendLog,
  getLog,
} from '../utils/scanDb';
import { downloadManifest, syncScans } from '../api/scan';

export const SCAN_RESULT = {
  OK: 'ok',
  ALREADY_USED: 'already_used',
  INVALID: 'invalid',
};

export function useOfflineScan() {
  const [meta, setMeta] = useState(null);
  const [cachedCount, setCachedCount] = useState(0);
  const [pending, setPending] = useState(0);
  const [log, setLog] = useState([]);
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  /** Re-read cache counters + log into state. */
  const refresh = useCallback(async () => {
    const [m, count, q, l] = await Promise.all([
      getManifestMeta(),
      manifestCount(),
      queueSize(),
      getLog(50),
    ]);
    setMeta(m);
    setCachedCount(count);
    setPending(q);
    setLog(l);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Pull the confirmed-ticket manifest for an event into the cache. */
  const download = useCallback(
    async (eventId) => {
      const r = await downloadManifest(eventId);
      await refresh();
      return r;
    },
    [refresh],
  );

  /** Drain the offline queue to the server, then reconcile the cache. */
  const sync = useCallback(async () => {
    if (syncingRef.current) return null;
    const queue = await getQueue();
    if (queue.length === 0) return { synced: 0, admitted: 0, duplicates: 0, invalid: 0 };

    syncingRef.current = true;
    setSyncing(true);
    try {
      const result = await syncScans(queue.map((s) => ({ hash: s.hash, usedAt: s.usedAt })));
      // Every hash the server settled (ok / already_used / invalid) leaves the queue.
      const settled = (result.reconciliation || []).map((r) => r.hash).filter(Boolean);
      await clearQueueHashes(settled.length ? settled : queue.map((s) => s.hash));
      await refresh();
      return result;
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [refresh]);

  /**
   * Validate one QR hash against the local cache. Admits immediately (cache +
   * queue) and, when online, triggers a background sync. Pure local read path,
   * so it returns instantly even with no network.
   */
  const validate = useCallback(
    async (hash) => {
      const at = new Date().toISOString();
      const ticket = await lookupTicket(hash);

      if (!ticket) {
        await appendLog({ hash, result: SCAN_RESULT.INVALID, at });
        await refresh();
        return { result: SCAN_RESULT.INVALID, hash };
      }
      if (ticket.isUsed) {
        await appendLog({ hash, result: SCAN_RESULT.ALREADY_USED, holderName: ticket.holderName, at });
        await refresh();
        return { result: SCAN_RESULT.ALREADY_USED, ticket, usedAt: ticket.usedAt };
      }

      // Fresh admit: write through the cache, queue for sync, log.
      await markLocalUsed(hash, at);
      await enqueueScan(hash, at);
      await appendLog({ hash, result: SCAN_RESULT.OK, holderName: ticket.holderName, at });
      await refresh();

      // Opportunistic background reconciliation when connectivity is up.
      if (typeof navigator === 'undefined' || navigator.onLine) {
        sync().catch(() => {});
      }
      return { result: SCAN_RESULT.OK, ticket, usedAt: at };
    },
    [refresh, sync],
  );

  // Connectivity: auto-sync the moment the device comes back online.
  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      sync().catch(() => {});
    };
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [sync]);

  return {
    meta,
    cachedCount,
    pending,
    online,
    syncing,
    log,
    download,
    validate,
    sync,
    refresh,
  };
}

export default useOfflineScan;
