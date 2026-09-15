/*
 * ============================================================
 * SÍGALE — ADMIN API (2.0, organizer panel)
 * Real client functions (Basic auth). The `admin` facade the UI imports
 * delegates to the wired `adminApi`; the auth header is built from the
 * stored organizer credentials.
 *
 * Local auth is a gate only (no real validation) — the SERVER does the
 * bcrypt check (server/middleware/requireOrganizer.js). Never treat the
 * local gate as security.
 * ============================================================
 */

import { api } from './client';

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

// ── Real API client (the source of truth; backend is live) ─────────────────────
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
  // `eventId` is optional (deploy-window compat) — the new frontend always
  // sends it so the panel only ever sees the currently selected event.
  listTickets: (status, eventId) => {
    const params = {};
    if (status) params.status = status;
    if (eventId) params.eventId = eventId;
    const qs = new URLSearchParams(params).toString();
    return api.get(`/api/admin/tickets${qs ? `?${qs}` : ''}`, { headers: authHeader() });
  },
  updateTicket: (id, patch) => api.patch(`/api/admin/tickets/${id}`, patch, { headers: authHeader() }),
  // Move a confirmed ticket to another stage of the same event. Rebalances
  // stage inventory server-side and adopts the target stage's price; returns
  // { ok, stageId, stageName, unitPrice }.
  updateTicketStage: (id, stageId) =>
    api.patch(`/api/admin/tickets/${id}/stage`, { stageId }, { headers: authHeader() }),
  deleteTicket: (id) => api.del(`/api/admin/tickets/${id}`, { headers: authHeader() }),
  // Wipes ALL of one event's tickets (every status) and restores its stage
  // inventory — scoped by eventId now that several events can sell at once.
  deleteAllPurchases: (eventId) =>
    api.del(`/api/admin/purchases?eventId=${encodeURIComponent(eventId)}`, { headers: authHeader() }),
};

/**
 * The logged-in organizer's role ('super_admin' | 'event_admin'), or null
 * when logged out. UI gating only — every actual permission check happens
 * server-side (requireSuperAdmin / assertOwnsEvent); this just decides what
 * to show (menu entries, form fields) so a lower-privileged organizer isn't
 * shown controls the server will 403 anyway.
 */
export function getRole() {
  return getAuth()?.role || null;
}
export function isSuperAdmin() {
  return getRole() === 'super_admin';
}

// ── Facade the UI imports. Flipped to real API (backend now live). ─────────────
export const admin = {
  login: async (username, password, { persist = false } = {}) => {
    const res = await adminApi.login(username, password); // throws ApiError on wrong creds
    setAuth({ username, basic: btoa(`${username}:${password}`), role: res?.role }, { persist });
    return { ok: true, username, role: res?.role };
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
  listTickets: async (status, eventId) => adminApi.listTickets(status, eventId),
  updateTicket: async (id, patch) => adminApi.updateTicket(id, patch),
  updateTicketStage: async (id, stageId) => adminApi.updateTicketStage(id, stageId),
  deleteTicket: async (id) => adminApi.deleteTicket(id),
  deleteAllPurchases: async (eventId) => adminApi.deleteAllPurchases(eventId),
};

export default admin;
