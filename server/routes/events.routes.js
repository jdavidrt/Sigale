/*
 * Events routes (ADR §7).
 *   GET  /api/events/active   public     — resolver for the one active event
 *   GET  /api/events/:id      public     — event + active stage + cupos
 *   POST /api/events          organizer  — create (TODO Phase 3: requireOrganizer)
 *   PUT  /api/events/:id       organizer  — edit   (TODO Phase 3: requireOrganizer)
 *
 * `/active` is declared before `/:id` so it isn't swallowed by the param route.
 */
import { Router } from 'express';
import {
  getActiveEvent,
  getEventById,
  createEvent,
  updateEvent,
} from '../controllers/events.controllers.js';

const router = Router();

router.get('/api/events/active', getActiveEvent);
router.get('/api/events/:id', getEventById);

// TODO Phase 3: insert requireOrganizer middleware before these handlers.
router.post('/api/events', createEvent);
router.put('/api/events/:id', updateEvent);

export default router;
