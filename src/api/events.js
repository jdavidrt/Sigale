/*
 * ============================================================
 * SÍGALE — EVENTS API (2.0)
 * Real client functions for the backend events endpoints plus the
 * mappers between the app's internal event shape and the API payload.
 *
 * STATUS: WIRED BUT NOT YET THE SOURCE OF TRUTH.
 * The backend isn't running locally yet, so EventContext still reads/
 * writes localStorage. Everything here is ready: when the server is
 * live (VITE_API_URL set), flip the commented blocks in EventContext
 * to call these functions and delete the localStorage path. The shapes
 * already match server/controllers/events.controllers.js.
 *
 * Internal event shape (what the app/form uses):
 *   {
 *     name, description, date 'YYYY-MM-DD', entranceTime 'HH:mm',
 *     venue, address, venueCapacity, artists: string[],
 *     whatsappNumber, flyerImageUrl, bankQrImageUrl,
 *     stages: [{ name, price, totalQuantity, sortOrder, activatesAt, status }],
 *     ticketTypes: { <name>: <price> }   // derived, back-compat
 *   }
 *
 * API event shape: see ADR-0001 §5 + events.controllers.js
 * (eventDate/openingTime are Bogotá wall-clock 'YYYY-MM-DD HH:mm:ss';
 *  the server converts to UTC on write and back on read).
 * ============================================================
 */

import { api } from './client';

/** 'YYYY-MM-DD' + 'HH:mm' -> 'YYYY-MM-DD HH:mm:00' (Bogotá wall-clock for the API). */
function toSqlDateTime(date, time) {
  if (!date) return null;
  const t = time && time.length >= 4 ? `${time}:00` : '00:00:00';
  return `${date} ${t}`;
}

/** App event shape -> API request payload (used by create/update). */
export function toApiEventPayload(event) {
  return {
    // Absent/undefined is valid — the server treats a missing slug as NULL
    // (deploy-window compat). isDemo is never sent: it's only ever set by
    // the one-off prod flip, never through this form.
    slug: event.slug || undefined,
    name: event.name,
    description: event.description || null,
    artists: Array.isArray(event.artists) ? event.artists : [],
    // The schema separates the event datetime from doors-open time. Until the
    // form captures both, we send the same wall-clock for each; refine when a
    // dedicated "doors open" field exists.
    eventDate: toSqlDateTime(event.date, event.entranceTime),
    openingTime: toSqlDateTime(event.date, event.entranceTime),
    venue: event.venue,
    address: event.address || null,
    venueCapacity: Number(event.venueCapacity) || 0,
    flyerImageUrl: event.flyerImageUrl || null,
    bankQrImageUrl: event.bankQrImageUrl || null,
    whatsappNumber: event.whatsappNumber || null,
    isPublished: !!event.isPublished,
    salesOpen: !!event.salesOpen,
    // undefined (field untouched in the form) is a valid, meaningful value:
    // the server keeps whatever is already stored (see normalizeScanKeyword
    // in events.controllers.js) rather than treating an untouched field as
    // "clear it". Only an explicit empty string clears it.
    scanKeyword: event.scanKeyword !== undefined ? (event.scanKeyword || '') : undefined,
    stages: (event.stages || []).map((s, i) => ({
      // id is load-bearing on edit: updateEvent matches submitted stages to
      // existing rows by id (UPDATE in place, preserving sold/reserved/status).
      // Dropping it makes every edit look like "all stages removed + new ones
      // added" — the server then inserts a duplicate 'active' stage next to the
      // still-active original (ER_DUP_ENTRY on uqOneActiveStagePerEvent) and
      // forks inventory onto fresh rows. Undefined on create — harmless.
      id: s.id ?? undefined,
      name: s.name,
      price: Number(s.price) || 0,
      totalQuantity: Number(s.totalQuantity) || 0,
      sortOrder: s.sortOrder ?? i,
      activatesAt: s.activatesAt || null,
      status: s.status || (i === 0 ? 'active' : 'upcoming'),
    })),
  };
}

/** API event response -> app event shape (used after fetch/create/update). */
export function fromApiEvent(apiEvent) {
  if (!apiEvent) return null;
  const [date = '', timePart = ''] = String(apiEvent.eventDate || '').split(' ');
  const stages = (apiEvent.stages || []).map((s) => ({
    id: s.id,
    name: s.name,
    price: Number(s.price),
    totalQuantity: Number(s.totalQuantity),
    soldQuantity: Number(s.soldQuantity),
    reservedQuantity: Number(s.reservedQuantity),
    cuposRestantes: Number(s.cuposRestantes),
    sortOrder: s.sortOrder,
    activatesAt: s.activatesAt,
    status: s.status,
  }));
  return {
    id: apiEvent.id,
    slug: apiEvent.slug || '',
    name: apiEvent.name,
    description: apiEvent.description || '',
    artists: apiEvent.artists || [],
    date,
    entranceTime: timePart.slice(0, 5),
    venue: apiEvent.venue,
    address: apiEvent.address || '', // persisted since migration 002
    venueCapacity: Number(apiEvent.venueCapacity) || 0,
    flyerImageUrl: apiEvent.flyerImageUrl || '',
    bankQrImageUrl: apiEvent.bankQrImageUrl || '',
    whatsappNumber: apiEvent.whatsappNumber || '',
    isActive: !!apiEvent.isActive, // retired semantics — column stays, nothing new reads/writes it
    isPublished: !!apiEvent.isPublished,
    isDemo: !!apiEvent.isDemo,
    salesOpen: !!apiEvent.salesOpen,
    stages,
    activeStage: apiEvent.activeStage || null,
    // back-compat for legacy consumers (Home, TicketContext stats)
    ticketTypes: deriveTicketTypes(stages),
  };
}

/**
 * Lightweight landing-grid row (GET /api/events, GET /api/events/all) -> app
 * shape. The organizer-only /all response carries a few extra fields
 * (isPublished, salesOpen, isArchived, scanKeyword) that the public /events
 * response doesn't — they simply come back undefined/false there, which is
 * fine since public consumers (EventsListPage) never read them.
 */
export function fromApiEventListItem(row) {
  return {
    id: row.id,
    slug: row.slug || '',
    name: row.name,
    venue: row.venue,
    flyerImageUrl: row.flyerImageUrl || '',
    isDemo: !!row.isDemo,
    isPublished: !!row.isPublished,
    salesOpen: !!row.salesOpen,
    isArchived: !!row.isArchived,
    // Only ever present on GET /api/events/all — never on the public list
    // (migration 013's security invariant). Kept as '' rather than undefined
    // so the edit form always has a controlled-input value to bind to.
    scanKeyword: row.scanKeyword || '',
    date: String(row.eventDate || '').split(' ')[0] || '',
  };
}

/** stages[] -> { <lowercased name>: price } map (legacy `ticketTypes`). */
export function deriveTicketTypes(stages) {
  const map = {};
  (stages || []).forEach((s) => {
    if (s.name) map[String(s.name).toLowerCase().trim()] = Number(s.price) || 0;
  });
  return map;
}

export const eventsApi = {
  /** GET /api/events/active — deploy-window compat only; the old "one active event" resolver. */
  getActive: () => api.get('/api/events/active').then(fromApiEvent),
  /** GET /api/events/:id */
  getById: (id) => api.get(`/api/events/${id}`).then(fromApiEvent),
  /** GET /api/events/by-slug/:slug — public, resolves an event by its URL slug. */
  getBySlug: (slug) => api.get(`/api/events/by-slug/${encodeURIComponent(slug)}`).then(fromApiEvent),
  /** GET /api/events — public, published events only (root landing grid). */
  list: () => api.get('/api/events').then((rows) => (rows || []).map(fromApiEventListItem)),
  /**
   * GET /api/events/all — organizer, scoped by role (super_admin: every
   * event; event_admin: only assigned ones) and, for a super_admin, an
   * optional includeArchived=1 for the events-admin "show archived" toggle.
   * `opts` carries the Basic auth header.
   */
  listAll: (opts, { includeArchived = false } = {}) =>
    api
      .get(`/api/events/all${includeArchived ? '?includeArchived=1' : ''}`, opts)
      .then((rows) => (rows || []).map(fromApiEventListItem)),
  /** POST /api/events — organizer create (super_admin-only server-side). `opts` carries the Basic auth header. */
  create: (event, opts) => api.post('/api/events', toApiEventPayload(event), opts).then(fromApiEvent),
  /** PUT /api/events/:id — organizer edit. `opts` carries the Basic auth header. */
  update: (id, event, opts) => api.put(`/api/events/${id}`, toApiEventPayload(event), opts).then(fromApiEvent),
  /** PATCH /api/events/:id/archive { isArchived } — super_admin-only server-side. */
  archive: (id, isArchived, opts) =>
    api.patch(`/api/events/${id}/archive`, { isArchived: !!isArchived }, opts),
};

export default eventsApi;
