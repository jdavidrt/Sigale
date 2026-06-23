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
    stages: (event.stages || []).map((s, i) => ({
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
    isActive: !!apiEvent.isActive,
    stages,
    activeStage: apiEvent.activeStage || null,
    // back-compat for legacy consumers (Home, TicketContext stats)
    ticketTypes: deriveTicketTypes(stages),
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
  /** GET /api/events/active — the single active event. */
  getActive: () => api.get('/api/events/active').then(fromApiEvent),
  /** GET /api/events/:id */
  getById: (id) => api.get(`/api/events/${id}`).then(fromApiEvent),
  /** POST /api/events — organizer create. `opts` carries the Basic auth header. */
  create: (event, opts) => api.post('/api/events', toApiEventPayload(event), opts).then(fromApiEvent),
  /** PUT /api/events/:id — organizer edit. `opts` carries the Basic auth header. */
  update: (id, event, opts) => api.put(`/api/events/${id}`, toApiEventPayload(event), opts).then(fromApiEvent),
};

export default eventsApi;
