/*
 * ============================================================
 * SÍGALE — SCAN API (2.0, offline-first door check-in)
 * Real client functions (Basic auth) + a LOCAL simulation built from the
 * same 'sigale-purchases' store the rest of 2.0 uses, so the door scanner
 * works without a backend. Mirrors the admin/purchases facade pattern:
 * each method has a `// >>> API:` swap point for cutover.
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

const LS_PURCHASES = 'sigale-purchases';

/** Basic header from the organizer credentials stored at login (admin.js). */
function authHeader() {
  const a = getAuth();
  return a?.basic ? { Authorization: `Basic ${a.basic}` } : {};
}

// ── Real API client (wired, not yet the source of truth) ───────────────────────
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

// ── LOCAL simulation (no backend) ────────────────────────────────────────────────
function readPurchases() {
  try {
    return JSON.parse(localStorage.getItem(LS_PURCHASES) || '{}');
  } catch {
    return {};
  }
}
function writePurchases(map) {
  try {
    localStorage.setItem(LS_PURCHASES, JSON.stringify(map));
  } catch {
    /* non-fatal */
  }
}

/** Flatten confirmed purchases into a manifest-shaped ticket list. */
function localManifestTickets(eventId) {
  const all = readPurchases();
  const out = [];
  for (const p of Object.values(all)) {
    if (p.status !== 'confirmed') continue;
    if (eventId != null && p.eventId != null && String(p.eventId) !== String(eventId)) continue;
    for (const tk of p.tickets || []) {
      out.push({
        ticketId: tk.id,
        hash: tk.validationHash,
        holderName: tk.holderName || null,
        holderIdNumber: tk.holderIdNumber || null,
        orderId: p.orderId ?? null,
        stageName: p.stageName || null,
        isUsed: tk.isUsed ? 1 : 0,
        usedAt: tk.usedAt || null,
      });
    }
  }
  return out;
}

const localScan = {
  manifest(eventId) {
    const tickets = localManifestTickets(eventId);
    return { eventId, generatedAt: new Date().toISOString(), count: tickets.length, tickets };
  },
  /** Mark used in localStorage, idempotent + earliest-usedAt, mirroring the server. */
  markUsed(hash, usedAt) {
    const all = readPurchases();
    for (const p of Object.values(all)) {
      for (const tk of p.tickets || []) {
        if (tk.validationHash !== hash) continue;
        if (tk.isUsed) {
          if (usedAt && tk.usedAt && new Date(usedAt) < new Date(tk.usedAt)) {
            tk.usedAt = usedAt;
            writePurchases(all);
          }
          return { hash, result: 'already_used', holderName: tk.holderName, usedAt: tk.usedAt };
        }
        tk.isUsed = true;
        tk.usedAt = usedAt || new Date().toISOString();
        writePurchases(all);
        return { hash, result: 'ok', holderName: tk.holderName, usedAt: tk.usedAt };
      }
    }
    return { hash, result: 'invalid' };
  },
};

// ── Facade the UI imports. Swap bodies to scanApi.* on cutover. ────────────────

/**
 * Download the confirmed-ticket manifest into the IndexedDB cache so the door
 * can validate offline. Call once before doors open (and to refresh).
 */
export async function downloadManifest(eventId) {
  // >>> API: const data = await scanApi.manifest(eventId);
  const data = localScan.manifest(eventId);
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
  // >>> API: return scanApi.syncBatch(scans);
  const reconciliation = scans.map((s) => localScan.markUsed(s.hash, s.usedAt));
  return {
    synced: scans.length,
    admitted: reconciliation.filter((r) => r.result === 'ok').length,
    duplicates: reconciliation.filter((r) => r.result === 'already_used').length,
    invalid: reconciliation.filter((r) => r.result === 'invalid').length,
    reconciliation,
  };
}

export const scan = { downloadManifest, syncScans };
export default scan;
