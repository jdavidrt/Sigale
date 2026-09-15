/*
 * ============================================================
 * SÍGALE — ORGANIZERS (ACCOUNTS) API
 * Account management, Phase 2. Every call is super_admin-only server-side
 * (requireSuperAdmin) — this wrapper doesn't gate anything itself, it just
 * carries the Basic auth header like every other admin.* wrapper.
 * ============================================================
 */

import { api } from './client';
import { getAuth } from './admin';

function authHeader() {
  const a = getAuth();
  return a?.basic ? { Authorization: `Basic ${a.basic}` } : {};
}

export const organizersApi = {
  /** GET /api/admin/organizers -> [{ id, username, role, isActive, createdAt, eventIds[] }] */
  list: () => api.get('/api/admin/organizers', { headers: authHeader() }),
  /** POST /api/admin/organizers { username, password, role } */
  create: (payload) => api.post('/api/admin/organizers', payload, { headers: authHeader() }),
  /** PATCH /api/admin/organizers/:id  any of { role, isActive, password } */
  update: (id, patch) => api.patch(`/api/admin/organizers/${id}`, patch, { headers: authHeader() }),
  /** PUT /api/admin/organizers/:id/events { eventIds: [] } */
  setEvents: (id, eventIds) =>
    api.put(`/api/admin/organizers/${id}/events`, { eventIds }, { headers: authHeader() }),
};

export default organizersApi;
