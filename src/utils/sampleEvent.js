/*
 * Sample event — the fallback the public screens use when no event has been
 * created locally yet, so the landing/flow always "look intentional" (mirrors
 * the prototype). Once an organizer creates an event (EventContext) or the
 * backend is live, that real event takes precedence. Same shape EventContext
 * normalizes to (stages[] + derived fields).
 */
export const SAMPLE_EVENT = {
  id: 'sample',
  name: 'Astromelias',
  description: 'Una noche de astromelias y buena música.',
  artists: ['Cold Tropics', 'Itawa', 'Deglorian', 'Catalina', 'Siluetas del Ayer', 'Amaltea'],
  date: '2026-07-24',
  entranceTime: '17:00',
  venue: 'Acá Parchamos',
  address: 'Cl. 49 #9-85',
  venueCapacity: 200,
  whatsappNumber: '573212619103',
  flyerImageUrl: '',
  bankQrImageUrl: '/pay-qr.png',
  stages: [
    { name: 'Etapa 1 · Preventa', price: 30000, totalQuantity: 100, soldQuantity: 0, reservedQuantity: 52, cuposRestantes: 48, sortOrder: 0, status: 'active' },
    { name: 'Etapa 2', price: 35000, totalQuantity: 60, soldQuantity: 0, reservedQuantity: 0, cuposRestantes: 60, sortOrder: 1, status: 'upcoming' },
    { name: 'Taquilla', price: 45000, totalQuantity: 40, soldQuantity: 0, reservedQuantity: 0, cuposRestantes: 40, sortOrder: 2, status: 'upcoming' },
  ],
};

/** The single active stage of an event (first 'active', else first stage). */
export function resolveActiveStage(event) {
  if (!event || !Array.isArray(event.stages) || event.stages.length === 0) return null;
  return event.stages.find((s) => s.status === 'active') || event.stages[0];
}

/** Remaining spots for a stage; falls back to total - sold - reserved. */
export function stageCupos(stage) {
  if (!stage) return 0;
  if (typeof stage.cuposRestantes === 'number') return stage.cuposRestantes;
  return (Number(stage.totalQuantity) || 0) - (Number(stage.soldQuantity) || 0) - (Number(stage.reservedQuantity) || 0);
}
