/*
 * ============================================================
 * SÍGALE — ADMIN CONTROLLER (organizer panel)
 * Login + the purchase-review loop. Inventory transitions use
 * getConnection() + FOR UPDATE (ADR §6). validationHash is a
 * server-generated RANDOM secret (decision #3), minted only at
 * confirm; the QR is built client-side and never stored.
 *
 * All handlers except `login` sit behind requireOrganizer.
 * ============================================================
 */

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { sendErrorEmail } from '../utils/emailNotifier.js';

const BOGOTA = '-05:00';
const UTC = '+00:00';

/** 128-bit random entry secret -> 32 hex chars (CHAR(64) reserved). */
const randomValidationHash = () => crypto.randomBytes(16).toString('hex');

/**
 * POST /api/login  (public, rate-limited at the route)
 * Validates username + bcrypt password. Returns ok only (no token):
 * the client re-sends Basic creds on each /api/admin/* call.
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
    }
    const [[organizer]] = await pool.query(
      'SELECT id, username, passwordHash FROM organizers WHERE username = ? LIMIT 1',
      [username],
    );
    if (!organizer || !(await bcrypt.compare(password, organizer.passwordHash))) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    res.json({ ok: true, username: organizer.username });
  } catch (error) {
    sendErrorEmail(req, error, 'login');
    return res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/admin/purchases?status=&orderId=  (organizer)
 * Review table with optional status filter and folio search.
 */
export const getAdminPurchases = async (req, res) => {
  try {
    const { status, orderId } = req.query;
    const where = [];
    const params = [];
    if (status) { where.push('p.status = ?'); params.push(status); }
    if (orderId) { where.push('p.orderId = ?'); params.push(orderId); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT p.id, p.orderId, p.quantity, p.totalAmount, p.status, p.deliveryMethod, p.deliveryContact,
              CONVERT_TZ(p.createdAt, '${UTC}', '${BOGOTA}') AS createdAt,
              s.name AS stageName
       FROM purchases p
       JOIN ticket_stages s ON s.id = p.stageId
       ${whereSql}
       ORDER BY p.createdAt DESC LIMIT 500`,
      params,
    );
    res.json(rows);
  } catch (error) {
    sendErrorEmail(req, error, 'getAdminPurchases');
    return res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/admin/purchases/:id/confirm  (organizer)
 * reserved -> sold, seal confirmedAt/confirmedBy, mint N tickets with
 * random validationHash. Guards against an already rejected/expired row.
 */
export const confirmPurchase = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[purchase]] = await conn.query(
      'SELECT id, stageId, quantity, status FROM purchases WHERE id = ? FOR UPDATE',
      [req.params.id],
    );
    if (!purchase) {
      await conn.rollback();
      return res.status(404).json({ message: 'Compra no encontrada' });
    }
    if (purchase.status === 'confirmed') {
      await conn.rollback();
      return res.status(409).json({ message: 'La compra ya está confirmada' });
    }
    if (purchase.status === 'rejected' || purchase.status === 'expired') {
      await conn.rollback();
      return res.status(409).json({ message: `No se puede confirmar una compra '${purchase.status}'` });
    }

    // reserved -> sold on the stage.
    await conn.query(
      'UPDATE ticket_stages SET reservedQuantity = reservedQuantity - ?, soldQuantity = soldQuantity + ? WHERE id = ?',
      [purchase.quantity, purchase.quantity, purchase.stageId],
    );

    // Seal the purchase.
    await conn.query(
      "UPDATE purchases SET status = 'confirmed', confirmedAt = UTC_TIMESTAMP(), confirmedBy = ? WHERE id = ?",
      [req.organizer?.username || 'organizer', purchase.id],
    );

    // Mint tickets (one per spot). Holder names come from the purchase flow;
    // when not captured per-ticket, fall back to the delivery contact label.
    const holders = Array.isArray(req.body?.holders) ? req.body.holders : [];
    for (let i = 0; i < purchase.quantity; i++) {
      const h = holders[i] || {};
      await conn.query(
        `INSERT INTO tickets (purchaseId, holderName, holderIdNumber, holderPhone, validationHash, isUsed)
         VALUES (?, ?, ?, ?, ?, 0)`,
        [purchase.id, h.name || `Boleta ${i + 1}`, h.idNumber || null, h.phone || null, randomValidationHash()],
      );
    }

    await conn.commit();
    res.json({ id: purchase.id, status: 'confirmed', minted: purchase.quantity });
  } catch (error) {
    await conn.rollback();
    sendErrorEmail(req, error, 'confirmPurchase');
    return res.status(500).json({ message: error.message, sqlMessage: error.sqlMessage });
  } finally {
    conn.release();
  }
};

/**
 * POST /api/admin/purchases/:id/reject  (organizer)
 * Frees the reserved cupo. Not destructive of any minted tickets (there are
 * none before confirm). Cannot reject an already confirmed purchase.
 */
export const rejectPurchase = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[purchase]] = await conn.query(
      'SELECT id, stageId, quantity, status FROM purchases WHERE id = ? FOR UPDATE',
      [req.params.id],
    );
    if (!purchase) {
      await conn.rollback();
      return res.status(404).json({ message: 'Compra no encontrada' });
    }
    if (purchase.status === 'confirmed') {
      await conn.rollback();
      return res.status(409).json({ message: 'No se puede rechazar una compra confirmada' });
    }
    if (purchase.status === 'rejected') {
      await conn.commit();
      return res.json({ id: purchase.id, status: 'rejected' });
    }

    // Release the held cupo back to the stage.
    await conn.query(
      'UPDATE ticket_stages SET reservedQuantity = GREATEST(reservedQuantity - ?, 0) WHERE id = ?',
      [purchase.quantity, purchase.stageId],
    );
    await conn.query("UPDATE purchases SET status = 'rejected' WHERE id = ?", [purchase.id]);

    await conn.commit();
    res.json({ id: purchase.id, status: 'rejected' });
  } catch (error) {
    await conn.rollback();
    sendErrorEmail(req, error, 'rejectPurchase');
    return res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
};

/**
 * POST /api/admin/sales  (organizer)
 * Walk-in / door sale: draws stage inventory directly and confirms in one
 * step (reserved is skipped — soldQuantity += qty under the lock).
 */
export const createWalkInSale = async (req, res) => {
  const { eventId, stageId, quantity, holders } = req.body || {};
  const qty = Number(quantity);
  if (!eventId || !stageId || !Number.isInteger(qty) || qty < 1) {
    return res.status(400).json({ message: 'Datos de venta inválidos' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[stage]] = await conn.query(
      'SELECT id, price, totalQuantity, soldQuantity, reservedQuantity FROM ticket_stages WHERE id = ? FOR UPDATE',
      [stageId],
    );
    if (!stage) {
      await conn.rollback();
      return res.status(404).json({ message: 'Etapa no encontrada' });
    }
    const available = stage.totalQuantity - stage.soldQuantity - stage.reservedQuantity;
    if (available < qty) {
      await conn.rollback();
      return res.status(409).json({ message: 'Cupos insuficientes' });
    }

    await conn.query('UPDATE ticket_stages SET soldQuantity = soldQuantity + ? WHERE id = ?', [qty, stageId]);

    // 3-digit folio, retry on collision.
    const totalAmount = Number(stage.price) * qty;
    let orderId = null;
    let purchaseId = null;
    for (let i = 0; i < 25; i++) {
      const candidate = String(Math.floor(Math.random() * 900) + 100);
      try {
        const [r] = await conn.query(
          `INSERT INTO purchases
             (eventId, stageId, quantity, totalAmount, orderId, deliveryMethod, deliveryContact,
              status, reservationExpiresAt, confirmedAt, confirmedBy)
           VALUES (?, ?, ?, ?, ?, 'whatsapp', ?, 'confirmed', UTC_TIMESTAMP(), UTC_TIMESTAMP(), ?)`,
          [eventId, stageId, qty, totalAmount, candidate, 'taquilla', req.organizer?.username || 'organizer'],
        );
        orderId = candidate;
        purchaseId = r.insertId;
        break;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') continue;
        throw err;
      }
    }
    if (!orderId) {
      await conn.rollback();
      return res.status(500).json({ message: 'No se pudo asignar folio' });
    }

    const list = Array.isArray(holders) ? holders : [];
    for (let i = 0; i < qty; i++) {
      const h = list[i] || {};
      await conn.query(
        `INSERT INTO tickets (purchaseId, holderName, holderIdNumber, holderPhone, validationHash, isUsed)
         VALUES (?, ?, ?, ?, ?, 0)`,
        [purchaseId, h.name || `Taquilla ${i + 1}`, h.idNumber || null, h.phone || null, randomValidationHash()],
      );
    }

    await conn.commit();
    res.status(201).json({ orderId, status: 'confirmed', minted: qty });
  } catch (error) {
    await conn.rollback();
    sendErrorEmail(req, error, 'createWalkInSale');
    return res.status(500).json({ message: error.message, sqlMessage: error.sqlMessage });
  } finally {
    conn.release();
  }
};
