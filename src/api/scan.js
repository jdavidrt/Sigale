/*
 * ============================================================
 * SÍGALE — SCAN API (online door check-in)
 * The door scanner validates every QR directly against the live
 * `tickets` table: one request per scan, which both checks the
 * ticket and marks entry. No login — the scope is an event plus
 * that event's shared keyword.
 *
 *   GET  /api/scan/events                     -> events open to public scan
 *   POST /api/scan { eventId, keyword, hash } -> verdict:
 *     - ok            : first admit, usedAt stamped
 *     - already_used  : ticket was already scanned in
 *     - invalid       : 404, hash not found on a confirmed ticket
 *     - wrong_keyword : 403, incorrect shared door code
 *     - wrong_event   : 409, the hash belongs to a different event
 * ============================================================
 */

import { api } from './client';

/** Verdict the scanner UI renders. ERROR is distinct from INVALID so a
 *  dropped network / auth failure never reads as "boleta no válida". */
export const SCAN_RESULT = {
  OK: 'ok',
  ALREADY_USED: 'already_used',
  INVALID: 'invalid',
  WRONG_EVENT: 'wrong_event',
  WRONG_KEYWORD: 'wrong_keyword',
  ERROR: 'error',
};

// ── Server scan endpoints (source of truth) ────────────────────────────────────
export const scanApi = {
  /** GET /api/scan/events -> [{ id, name, eventDate }] open to public scan. */
  listEvents: () => api.get('/api/scan/events'),
  /** POST /api/scan { eventId, keyword, hash } */
  scanPublic: (eventId, keyword, hash) => api.post('/api/scan', { eventId, keyword, hash }),
};

/**
 * List events that currently allow public scanning (have a scanKeyword set).
 * @returns {Promise<Array<{id:number,name:string,eventDate:string}>>}
 */
export async function listScanEvents() {
  try {
    return await scanApi.listEvents();
  } catch {
    return [];
  }
}

/**
 * Validate one QR hash against the live DB for a specific event + shared
 * keyword, and admit the holder. Online-only: the server looks up the
 * confirmed ticket by validationHash, checks it belongs to `eventId`, stamps
 * isUsed/usedAt (idempotent), and returns the verdict.
 *
 * @param {string} hash 16-hex validationHash decoded from the QR.
 * @param {{eventId:number|string, keyword:string}} scope
 * @returns {Promise<{result:string, holderName?:string, usedAt?:string}>}
 */
export async function scanAndAdmit(hash, { eventId, keyword } = {}) {
  try {
    const outcome = await scanApi.scanPublic(eventId, keyword, hash);
    return {
      result: outcome.result,
      holderName: outcome.holderName,
      usedAt: outcome.usedAt,
    };
  } catch (e) {
    if (e?.status === 404) return { result: SCAN_RESULT.INVALID };
    if (e?.status === 403) return { result: SCAN_RESULT.WRONG_KEYWORD };
    if (e?.status === 409) return { result: SCAN_RESULT.WRONG_EVENT };
    // Network (status 0), 500, etc. -> retry-able error, NOT "no válida".
    return { result: SCAN_RESULT.ERROR };
  }
}

export default { scanAndAdmit, listScanEvents, SCAN_RESULT };
