/*
 * ============================================================
 * SÍGALE — PURCHASES API
 * Client functions for the public purchase endpoints + the
 * order status metadata. The `purchases` facade at the bottom
 * is what the UI imports; every purchase is persisted server-side.
 * ============================================================
 */

import { api } from './client';

// ── Order status (tickets.status) ──────────────────────────────────────────────
export const PURCHASE_STATUS = {
  PENDING: 'pending_payment',
  SUBMITTED: 'payment_submitted',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};

// label (ES) + pill class, read by color + dot + label together (never color alone).
export const STATUS_META = {
  pending_payment: { label: 'Esperando pago', pill: 'wait' },
  payment_submitted: { label: 'Pago enviado', pill: 'sent' },
  confirmed: { label: 'Confirmada', pill: 'ok' },
  rejected: { label: 'Rechazada', pill: 'no' },
  expired: { label: 'Vencida', pill: 'dead' },
};

export const statusMeta = (status) => STATUS_META[status] || STATUS_META.pending_payment;

const waNumber = (whatsappNumber) => String(whatsappNumber || '').replace(/[^\d]/g, '');

/** WhatsApp deep link for sending the payment screenshot of an order. */
export function whatsappLink(whatsappNumber, orderId) {
  const text = encodeURIComponent(`¡Hola! Envío pantallazo de orden #${orderId}`);
  return `https://wa.me/${waNumber(whatsappNumber)}?text=${text}`;
}

/** WhatsApp deep link asking the organizer for more info about an event. */
export function whatsappInfoLink(whatsappNumber, eventName) {
  const text = encodeURIComponent(`Hola, quiero más info sobre el evento ${eventName}, por favor`);
  return `https://wa.me/${waNumber(whatsappNumber)}?text=${text}`;
}

// ── API client functions ───────────────────────────────────────────────────────
// The public flow is one-way: it ends on a terminal success screen and the
// organizer delivers tickets out-of-band, so there is no status/recover call.
export const purchasesApi = {
  create: (payload) => api.post('/api/purchases', payload),
  // submit accepts an optional body { deliveryMethod, deliveryContact, holders }
  // so the buyer's real contact info captured AFTER the initial hold is
  // persisted alongside the status transition.
  submit: (orderId, payload) => api.post(`/api/purchases/${orderId}/submitted`, payload || {}),
};

// ── Facade the UI imports. Every call hits the backend. ────────────────────────
export const purchases = {
  create: async (payload) => purchasesApi.create(payload),
  submit: async (orderId, payload) => purchasesApi.submit(orderId, payload),
};

export default purchases;
