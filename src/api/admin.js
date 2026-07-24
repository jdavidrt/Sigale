/*
 * ============================================================
 * SÍGALE — ADMIN API (2.0, organizer panel)
 * Real client functions (Basic auth) + a LOCAL simulation over the
 * same 'sigale-purchases' store the public flow writes, so the panel
 * works without a backend. `admin` facade has `// >>> API:` switch
 * points; auth header is built from the stored organizer credentials.
 *
 * Local auth is a gate only (no real validation) — the SERVER does the
 * bcrypt check (server/middleware/requireOrganizer.js). Never treat the
 * local gate as security.
 * ============================================================
 */

import { api } from './client';

const LS_PURCHASES = 'sigale-purchases';
const AUTH_KEY = 'sigale-admin'; // { username, basic, ttlMs, expiresAt } — in either store
// Both sliding (refreshed on every read). The persisted session gets the full 24h;
// a tab-scoped one gets 10h, so a device that opted out can't stay authenticated
// for a whole day on a tab someone left open.
const PERSIST_TTL_MS = 24 * 60 * 60 * 1000;
const SESSION_TTL_MS = 10 * 60 * 60 * 1000;

// ── credential storage (for the Basic header on cutover) ───────────────────────
// Two stores on purpose: localStorage when the organizer ticked "mantener sesión
// iniciada" (survives tab close / browser restart), sessionStorage otherwise
// (dies with the tab — the safe default on a shared door device).
function clearAuth() {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {
    /* non-fatal */
  }
  try {
    sessionStorage.removeItem(AUTH_KEY);
  } catch {
    /* non-fatal */
  }
}
function readStore(store) {
  try {
    return JSON.parse(store.getItem(AUTH_KEY) || 'null');
  } catch {
    return null;
  }
}
export function getAuth() {
  let store = localStorage;
  let auth = readStore(store);
  if (!auth) {
    store = sessionStorage;
    auth = readStore(store);
  }
  if (!auth) return null;

  // Expired → purge both stores so a stale record can't resurrect.
  if (auth.expiresAt && Date.now() > auth.expiresAt) {
    clearAuth();
    return null;
  }

  // Slide the window forward. Every organizer API call routes through
  // authHeader() → getAuth(), so ordinary use keeps the session alive.
  // A failed write (Safari private mode) must not break the read.
  // Slide by the record's own TTL so a 10h tab session never widens to 24h.
  const ttl = auth.ttlMs || (store === localStorage ? PERSIST_TTL_MS : SESSION_TTL_MS);
  const touched = { ...auth, ttlMs: ttl, expiresAt: Date.now() + ttl };
  try {
    store.setItem(AUTH_KEY, JSON.stringify(touched));
  } catch {
    /* non-fatal */
  }
  return touched;
}
function setAuth(auth, { persist = false } = {}) {
  clearAuth();
  if (!auth) return;
  const store = persist ? localStorage : sessionStorage;
  const ttlMs = persist ? PERSIST_TTL_MS : SESSION_TTL_MS;
  try {
    store.setItem(AUTH_KEY, JSON.stringify({ ...auth, ttlMs, expiresAt: Date.now() + ttlMs }));
  } catch {
    /* non-fatal */
  }
}
export function isLoggedIn() {
  return !!getAuth();
}
export function logout() {
  setAuth(null);
}
function authHeader() {
  const a = getAuth();
  return a?.basic ? { Authorization: `Basic ${a.basic}` } : {};
}

// ── random entry hash, client-side (mirror of server randomBytes(16)) ──────────
function randomHash() {
  const bytes = new Uint8Array(16);
  (window.crypto || window.msCrypto).getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ── local store helpers (shared with src/api/purchases.js) ─────────────────────
function readAll() {
  try {
    return JSON.parse(localStorage.getItem(LS_PURCHASES) || '{}');
  } catch {
    return {};
  }
}
function writeAll(map) {
  try {
    localStorage.setItem(LS_PURCHASES, JSON.stringify(map));
  } catch {
    /* non-fatal */
  }
}
function localOrderId(all) {
  for (let i = 0; i < 50; i++) {
    const id = String(Math.floor(Math.random() * 900) + 100);
    if (!all[id]) return id;
  }
  return String(Math.floor(Math.random() * 900) + 100);
}

// ── Real API client (wired, not yet the source of truth) ───────────────────────
export const adminApi = {
  login: (username, password) => api.post('/api/login', { username, password }),
  listPurchases: (params = {}) => {
    // Strip undefined/null values BEFORE handing them to URLSearchParams —
    // otherwise they serialize as the literal string "undefined" and the
    // server treats it as a filter that matches no rows.
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    );
    const qs = new URLSearchParams(clean).toString();
    return api.get(`/api/admin/purchases${qs ? `?${qs}` : ''}`, { headers: authHeader() });
  },
  confirm: (orderId) => api.post(`/api/admin/purchases/${orderId}/confirm`, {}, { headers: authHeader() }),
  reject: (orderId) => api.post(`/api/admin/purchases/${orderId}/reject`, undefined, { headers: authHeader() }),
  walkIn: (payload) => api.post('/api/admin/sales', payload, { headers: authHeader() }),
  // Ticket rows joined with their stage. `status` defaults to 'confirmed'
  // server-side when omitted — pass a comma-separated list or 'all' to see
  // pending/rejected/expired orders too (used by /tickets' status filter).
  listTickets: (status) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return api.get(`/api/admin/tickets${qs}`, { headers: authHeader() });
  },
  updateTicket: (id, patch) => api.patch(`/api/admin/tickets/${id}`, patch, { headers: authHeader() }),
  // Move a confirmed ticket to another stage of the same event. Rebalances
  // stage inventory server-side and adopts the target stage's price; returns
  // { ok, stageId, stageName, unitPrice }.
  updateTicketStage: (id, stageId) =>
    api.patch(`/api/admin/tickets/${id}/stage`, { stageId }, { headers: authHeader() }),
  deleteTicket: (id) => api.del(`/api/admin/tickets/${id}`, { headers: authHeader() }),
  deleteAllPurchases: () => api.del('/api/admin/purchases', { headers: authHeader() }),
};

// ── LOCAL simulation ────────────────────────────────────────────────────────────
const localAdmin = {
  list({ status, orderId } = {}) {
    let rows = Object.values(readAll());
    if (status) rows = rows.filter((p) => p.status === status);
    if (orderId) rows = rows.filter((p) => String(p.orderId) === String(orderId));
    return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  confirm(orderId) {
    const all = readAll();
    const p = all[orderId];
    if (!p) return null;
    if (p.status === 'rejected' || p.status === 'expired') return p; // guard
    p.status = 'confirmed';
    p.confirmedAt = new Date().toISOString();
    p.tickets = Array.from({ length: p.quantity }, (_, i) => ({
      id: `${orderId}-${i + 1}`,
      holderName: p.holders?.[i]?.name || `Boleta ${i + 1}`,
      holderIdNumber: p.holders?.[i]?.idNumber || null,
      validationHash: randomHash(),
      isUsed: false,
    }));
    writeAll(all);
    return p;
  },
  reject(orderId) {
    const all = readAll();
    const p = all[orderId];
    if (!p) return null;
    if (p.status === 'confirmed') return p; // can't reject a confirmed sale
    p.status = 'rejected';
    writeAll(all);
    return p;
  },
  walkIn({ stageName, quantity, totalAmount, holders }) {
    const all = readAll();
    const orderId = localOrderId(all);
    all[orderId] = {
      orderId,
      stageName,
      quantity,
      totalAmount,
      deliveryMethod: 'taquilla',
      deliveryContact: 'taquilla',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      holders: holders || [],
      tickets: Array.from({ length: quantity }, (_, i) => ({
        id: `${orderId}-${i + 1}`,
        holderName: holders?.[i]?.name || `Taquilla ${i + 1}`,
        validationHash: randomHash(),
        isUsed: false,
      })),
    };
    writeAll(all);
    return all[orderId];
  },
};

// ── Facade the UI imports. Flipped to real API (backend now live). ─────────────
export const admin = {
  login: async (username, password, { persist = false } = {}) => {
    await adminApi.login(username, password); // throws ApiError on wrong creds
    setAuth({ username, basic: btoa(`${username}:${password}`) }, { persist });
    return { ok: true, username };
  },
  list: async (params) => {
    return adminApi.listPurchases(params);
  },
  confirm: async (row) => {
    return adminApi.confirm(row.orderId);
  },
  reject: async (row) => {
    return adminApi.reject(row.orderId);
  },
  walkIn: async (payload) => {
    return adminApi.walkIn(payload);
  },
  listTickets: async (status) => adminApi.listTickets(status),
  updateTicket: async (id, patch) => adminApi.updateTicket(id, patch),
  updateTicketStage: async (id, stageId) => adminApi.updateTicketStage(id, stageId),
  deleteTicket: async (id) => adminApi.deleteTicket(id),
  deleteAllPurchases: async () => adminApi.deleteAllPurchases(),
};

export default admin;
