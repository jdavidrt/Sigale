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
const SS_AUTH = 'sigale-admin'; // sessionStorage: { username, basic }

// ── credential storage (for the Basic header on cutover) ───────────────────────
export function getAuth() {
  try {
    return JSON.parse(sessionStorage.getItem(SS_AUTH) || 'null');
  } catch {
    return null;
  }
}
function setAuth(auth) {
  if (auth) sessionStorage.setItem(SS_AUTH, JSON.stringify(auth));
  else sessionStorage.removeItem(SS_AUTH);
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
    const qs = new URLSearchParams(params).toString();
    return api.get(`/api/admin/purchases${qs ? `?${qs}` : ''}`, { headers: authHeader() });
  },
  confirm: (id, holders) => api.post(`/api/admin/purchases/${id}/confirm`, { holders }, { headers: authHeader() }),
  reject: (id) => api.post(`/api/admin/purchases/${id}/reject`, undefined, { headers: authHeader() }),
  walkIn: (payload) => api.post('/api/admin/sales', payload, { headers: authHeader() }),
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

// ── Facade the UI imports. Swap bodies to adminApi.* on cutover. ───────────────
export const admin = {
  login: async (username, password) => {
    // >>> API: await adminApi.login(username, password); then store Basic creds:
    //          setAuth({ username, basic: btoa(`${username}:${password}`) });
    setAuth({ username, basic: btoa(`${username}:${password}`) });
    return { ok: true, username };
  },
  list: async (params) => {
    // >>> API: return adminApi.listPurchases(params);
    return localAdmin.list(params);
  },
  confirm: async (row) => {
    // >>> API: return adminApi.confirm(row.id, row.holders);
    return localAdmin.confirm(row.orderId);
  },
  reject: async (row) => {
    // >>> API: return adminApi.reject(row.id);
    return localAdmin.reject(row.orderId);
  },
  walkIn: async (payload) => {
    // >>> API: return adminApi.walkIn(payload);
    return localAdmin.walkIn(payload);
  },
};

export default admin;
