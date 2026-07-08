/*
 * ============================================================
 * SÍGALE — SCAN API (online door check-in)
 * The door scanner validates every QR directly against the live
 * `tickets` table via the server: one request per scan, which both
 * checks the ticket and marks entry. No manifest, no IndexedDB, no
 * offline cache — online-only by design.
 *
 *   POST /api/admin/scan  { hash }  -> markUsed(hash) on the server:
 *     - ok           : first admit, usedAt stamped
 *     - already_used : ticket was already scanned in
 *     - invalid      : hash not found on a confirmed ticket (404)
 * ============================================================
 */

import { api } from './client';
import { getAuth } from './admin';

/** Verdict the scanner UI renders. ERROR is distinct from INVALID so a
 *  dropped network / auth failure never reads as "boleta no válida". */
export const SCAN_RESULT = {
  OK: 'ok',
  ALREADY_USED: 'already_used',
  INVALID: 'invalid',
  ERROR: 'error',
};

/** Basic header from the organizer credentials stored at login (admin.js). */
function authHeader() {
  const a = getAuth();
  return a?.basic ? { Authorization: `Basic ${a.basic}` } : {};
}

// ── Server scan endpoint (source of truth) ────────────────────────────────────
export const scanApi = {
  scanOne: (hash) =>
    api.post('/api/admin/scan', { hash }, { headers: authHeader() }),
};

/**
 * Validate one QR hash against the live DB and admit the holder. Online-only:
 * the server looks up the confirmed ticket by validationHash, stamps
 * isUsed/usedAt (idempotent), and returns the verdict.
 *
 * @param {string} hash 16- or 32-hex validationHash decoded from the QR.
 * @returns {Promise<{result:string, holderName?:string, usedAt?:string}>}
 */
export async function scanAndAdmit(hash) {
  try {
    const outcome = await scanApi.scanOne(hash);
    // Server returns { result: 'ok' | 'already_used', holderName, usedAt }.
    return {
      result: outcome.result,
      holderName: outcome.holderName,
      usedAt: outcome.usedAt,
    };
  } catch (e) {
    // 404 == unknown/unconfirmed hash -> genuinely invalid ticket.
    if (e?.status === 404) return { result: SCAN_RESULT.INVALID };
    // Network (status 0), 401, 500, etc. -> retry-able error, NOT "no válida".
    return { result: SCAN_RESULT.ERROR };
  }
}

export default { scanAndAdmit, SCAN_RESULT };
