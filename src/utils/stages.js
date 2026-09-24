/*
 * Stage helpers shared by the public landing and the purchase wizard.
 */

/** The single active stage of an event (status === 'active' only; null if none). */
export function resolveActiveStage(event) {
  if (!event || !Array.isArray(event.stages) || event.stages.length === 0) return null;
  return event.stages.find((s) => s.status === 'active') ?? null;
}

/** Remaining spots for a stage; falls back to total - sold - reserved. */
export function stageCupos(stage) {
  if (!stage) return 0;
  if (typeof stage.cuposRestantes === 'number') return stage.cuposRestantes;
  return (Number(stage.totalQuantity) || 0) - (Number(stage.soldQuantity) || 0) - (Number(stage.reservedQuantity) || 0);
}
