/*
 * Client-side mirror of server/controllers/events.controllers.js's slug
 * validation (RESERVED_SLUGS + SLUG_PATTERN) — cheap inline feedback only.
 * The server is authoritative: it re-validates independently and also
 * catches uqEventSlug collisions (a slug already taken by another event),
 * which this file has no way to know about client-side.
 */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Deliberately does NOT include 'demo' — that slug is protected by the DB's
// uniqueness constraint (ordinary event data), not a literal app route.
export const RESERVED_SLUGS = new Set([
  'admin', 'scan', 'compra', 'tickets', 'dashboard', 'evento', 'edit',
  'edit-event', 'create-event', 'sell-tickets', 'guest-passes',
  'lista-puerta', 'validate-qr', 'api', 'assets', 'sw.js', 'manifest.json',
  'robots.txt', 'favicon.ico', 'events-admin', 'organizers',
]);

/** Strip characters a slug may never contain as the user types. */
export function sanitizeSlugInput(raw) {
  return String(raw).toLowerCase().replace(/[^a-z0-9-]/g, '');
}

/** True when `slug` passes the format + reserved-word checks. */
export function isSlugFormatValid(slug) {
  if (!slug) return false;
  return slug.length <= 80 && SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.has(slug);
}
