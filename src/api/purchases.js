/*
 * ============================================================
 * SÍGALE — PURCHASES API (2.0)
 * Client functions for the purchase endpoints + the five-state
 * machine metadata + a LOCAL simulation used while the backend
 * isn't running (David's call: keep the app working on local data,
 * flip to the server later with minimal edits).
 *
 * The `purchases` facade at the bottom is what the UI imports. Today
 * it delegates to the localStorage simulation; each method has a
 * `// >>> API:` line showing the one-line swap to the real endpoint
 * (server/controllers/purchases.controllers.js shapes already match).
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
  const text = encodeURIComponent(`¡Hola! Envío pantallazo de compra #${orderId}`);
  return `https://wa.me/${num}?text=${text}`;
}

// ── Real API client functions (wired, not yet the source of truth) ─────────────
export const purchasesApi = {
  create: (payload) => api.post('/api/purchases', payload),
  submit: (orderId) => api.post(`/api/purchases/${orderId}/submitted`),
  getByOrderId: (orderId) => api.get(`/api/purchases/${orderId}`),
  recover: (contact) => api.get(`/api/recover?contact=${encodeURIComponent(contact)}`),
};

// ── LOCAL simulation (no backend) ──────────────────────────────────────────────
// Stored separately from the event blob so it's easy to delete on cutover.
const LS_KEY = 'sigale-purchases';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}
function writeAll(map) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    /* quota / private mode — non-fatal for the demo flow */
  }
}

/** Unique-ish 3-digit folio that doesn't collide with existing local purchases. */
function localOrderId(existing) {
  for (let i = 0; i < 50; i++) {
    const id = String(Math.floor(Math.random() * 900) + 100);
    if (!existing[id]) return id;
  }
  return String(Math.floor(Math.random() * 900) + 100);
}

export const localPurchases = {
  /** Mirror of POST /api/purchases — reserves locally and returns the folio. */
  create({ eventId, stageId, stageName, quantity, totalAmount, deliveryMethod, deliveryContact, holders }) {
    const all = readAll();
    const orderId = localOrderId(all);
    all[orderId] = {
      orderId,
      eventId,
      stageId,
      stageName,
      quantity,
      totalAmount,
      deliveryMethod,
      deliveryContact,
      holders: holders || [],
      status: PURCHASE_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      tickets: [], // populated only on confirm (Phase 3 / backend)
    };
    writeAll(all);
    return all[orderId];
  },
  get(orderId) {
    return readAll()[orderId] || null;
  },
  markSubmitted(orderId) {
    const all = readAll();
    if (all[orderId] && all[orderId].status === PURCHASE_STATUS.PENDING) {
      all[orderId].status = PURCHASE_STATUS.SUBMITTED;
      writeAll(all);
    }
    return all[orderId] || null;
  },
};

// ── Facade the UI imports. Swap the bodies to purchasesApi.* on cutover. ───────
export const purchases = {
  create: async (payload) => {
    // >>> API: return purchasesApi.create(payload);  // returns { orderId, totalAmount }
    return localPurchases.create(payload);
  },
  submit: async (orderId) => {
    // >>> API: return purchasesApi.submit(orderId);
    return localPurchases.markSubmitted(orderId);
  },
  get: async (orderId) => {
    // >>> API: return purchasesApi.getByOrderId(orderId);
    return localPurchases.get(orderId);
  },
};

export default purchases;
