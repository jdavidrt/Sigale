/*
 * ============================================================
 * SÍGALE — PURCHASES API (2.0)
 * Client functions for the purchase endpoints + the five-state
 * machine metadata.
 *
 * The `purchases` facade at the bottom is what the UI imports.
 * It calls the real API (server is the source of truth). No more
 * localStorage simulation — every purchase is persisted to the DB.
 * ============================================================
 */

import { api } from './client';

// ── Five-state machine (IMPLEMENTATION_GUIDE §6) ───────────────────────────────
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

/** WhatsApp deep link for sending the payment screenshot (Guide §5.3). */
export function whatsappLink(whatsappNumber, orderId) {
  const num = String(whatsappNumber || '').replace(/[^\d]/g, '');
  const text = encodeURIComponent(`¡Hola! Envío pantallazo de orden #${orderId}`);
  return `https://wa.me/${num}?text=${text}`;
}

// ── Real API client functions ──────────────────────────────────────────────────
// The public status / recover endpoints were removed (the buyer no longer has
// a "Ver el estado de mi compra" page). The flow now ends on a terminal
// success screen, and tickets are delivered out-of-band by the organizer.
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
