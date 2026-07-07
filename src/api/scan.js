/*
 * ============================================================
 * SÍGALE — SCAN API (2.0, offline-first door check-in)
 * Real client functions (Basic auth) against the server scan endpoints.
 *
 * Validation itself never lives here — it runs against the IndexedDB cache
 * (src/utils/scanDb.js) so the door works with no network. This module only
 * (1) seeds that cache from the manifest endpoint and (2) reconciles the
 * offline queue back to the server.
 * ============================================================
 */

import { api } from './client';
import { getAuth } from './admin';
import { saveManifest } from '../utils/scanDb';

/** Basic header from the organizer credentials stored at login (admin.js). */
function authHeader() {
  const a = getAuth();
  return a?.basic ? { Authorization: `Basic ${a.basic}` } : {};
}

// ── Server scan endpoints (source of truth) ───────────────────────────────────
export const scanApi = {
  manifest: (eventId) =>
    api.get(`/api/admin/scan/manifest?eventId=${encodeURIComponent(eventId)}`, {
      headers: authHeader(),
    }),
  scanOne: (hash, usedAt) =>
    api.post('/api/admin/scan', { hash, usedAt }, { headers: authHeader() }),
  syncBatch: (scans) =>
    api.post('/api/admin/scan/sync', { scans }, { headers: authHeader() }),
};

/**
 * Download the confirmed-ticket manifest into the IndexedDB cache so the door
 * can validate offline. Call once before doors open (and to refresh).
 */
export async function downloadManifest(eventId) {
  const data = await scanApi.manifest(eventId);
  await saveManifest(data.eventId ?? eventId, data.tickets, data.generatedAt);
  return { count: data.count, generatedAt: data.generatedAt };
}

/**
 * Reconcile a queue of offline scans with the server. Returns the server's
 * per-hash reconciliation plus a summary so the device can clear its queue.
 *
 * @param {Array<{hash:string, usedAt:string}>} scans
 */
export async function syncScans(scans) {
  if (!scans || scans.length === 0) {
    return { synced: 0, admitted: 0, duplicates: 0, invalid: 0, reconciliation: [] };
  }
  return scanApi.syncBatch(scans);
}

export const scan = { downloadManifest, syncScans };
export default scan;
