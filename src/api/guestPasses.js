/*
 * ============================================================
 * SÍGALE — GUEST PASSES API
 * Free-entry roster (artist/crew/courtesy). Separate domain from
 * tickets/purchases — no price, no scan — so it gets its own thin
 * wrapper rather than piling onto api/admin.js.
 * ============================================================
 */

import { api } from './client';
import { getAuth } from './admin';

function authHeader() {
  const a = getAuth();
  return a?.basic ? { Authorization: `Basic ${a.basic}` } : {};
}

export const guestPasses = {
  list: (eventId) =>
    api.get(`/api/admin/guest-passes?eventId=${encodeURIComponent(eventId)}`, { headers: authHeader() }),
  create: (payload) => api.post('/api/admin/guest-passes', payload, { headers: authHeader() }),
  bulkCreate: (payload) => api.post('/api/admin/guest-passes/bulk', payload, { headers: authHeader() }),
  update: (id, patch) => api.patch(`/api/admin/guest-passes/${id}`, patch, { headers: authHeader() }),
  remove: (id) => api.del(`/api/admin/guest-passes/${id}`, { headers: authHeader() }),
};

export default guestPasses;
