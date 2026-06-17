/*
 * Admin + auth routes (ADR §7, locked auth model #5).
 *   POST /api/login                          public     — bcrypt check, rate-limited
 *   GET  /api/admin/purchases                organizer  — review table
 *   POST /api/admin/purchases/:id/confirm    organizer  — reserved->sold, mint tickets
 *   POST /api/admin/purchases/:id/reject     organizer  — free cupo
 *   POST /api/admin/sales                    organizer  — walk-in
 * Every /api/admin/* call re-validates credentials via requireOrganizer.
 */
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireOrganizer } from '../middleware/requireOrganizer.js';
import {
  login,
  getAdminPurchases,
  confirmPurchase,
  rejectPurchase,
  createWalkInSale,
} from '../controllers/admin.controllers.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos de ingreso, espera un minuto' },
});

router.post('/api/login', loginLimiter, login);

router.get('/api/admin/purchases', requireOrganizer, getAdminPurchases);
router.post('/api/admin/purchases/:id/confirm', requireOrganizer, confirmPurchase);
router.post('/api/admin/purchases/:id/reject', requireOrganizer, rejectPurchase);
router.post('/api/admin/sales', requireOrganizer, createWalkInSale);

export default router;
