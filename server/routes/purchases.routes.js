/*
 * Purchases routes (ADR §7).
 *   POST /api/purchases                    public  — transactional reserve
 *   POST /api/purchases/:orderId/submitted public  — "ya realicé el pago"
 *   GET  /api/purchases/:orderId           public  — status (QRs only if confirmed)
 *   GET  /api/recover?contact=             public  — rate-limited (anti-enumeration)
 */
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createPurchase,
  submitPayment,
  getPurchaseByOrderId,
  recoverByContact,
} from '../controllers/purchases.controllers.js';

const router = Router();

// Anti brute-force / folio enumeration (plan §6). Tune in production.
const recoverLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos, intenta de nuevo en un minuto' },
});

router.post('/api/purchases', createPurchase);
router.post('/api/purchases/:orderId/submitted', submitPayment);
router.get('/api/purchases/:orderId', getPurchaseByOrderId);
router.get('/api/recover', recoverLimiter, recoverByContact);

export default router;
