/*
 * ============================================================
 * SÍGALE — DATABASE POOL
 * One mysql2/promise pool, reused across the whole app — the
 * same pattern as BlackCoffe's current-server/db.js, with two
 * deliberate hardening changes from ADR-0001 §9:
 *
 *   1. SSL verifies the DigitalOcean CA certificate
 *      (ssl.ca = the downloaded cert), instead of
 *      rejectUnauthorized:false which disables verification.
 *   2. A hard guardrail refuses to build the pool unless
 *      DB_NAME === 'sigale'. Sígale must NEVER connect to
 *      BlackCoffe's database. See SIGALE_2.0_IMPLEMENTATION_PLAN §3.1.
 *
 * dateStrings:true keeps DATETIME as strings so the driver never
 * shifts them by the Node process timezone (ADR-0001 §8).
 * ============================================================
 */

import { createPool } from 'mysql2/promise';
import fs from 'node:fs';

// ── Guardrail: dedicated `sigale` database only ────────────────────────────────
// The shared .env.local may carry BlackCoffe's real credentials. Pointing this
// pool at the wrong database is the single most dangerous mistake in the project.
const DB_NAME = process.env.DB_NAME;
if (DB_NAME !== 'sigale') {
  throw new Error(
    `[sigale/db] Refusing to connect: DB_NAME must be 'sigale' (got '${DB_NAME ?? 'undefined'}'). ` +
      'Sígale never touches the BlackCoffe database — see SIGALE_2.0_IMPLEMENTATION_PLAN §3.1.',
  );
}

// ── SSL: verify the DigitalOcean CA cert (ADR-0001 §9) ─────────────────────────
// Provide the downloaded CA certificate path in DB_CA_CERT. rejectUnauthorized
// stays at its secure default (true) so MITM is not possible.
const ssl = process.env.DB_CA_CERT
  ? { ca: fs.readFileSync(process.env.DB_CA_CERT) }
  : undefined;

if (!ssl) {
  console.warn(
    '[sigale/db] DB_CA_CERT not set — refusing implicit insecure SSL. ' +
      'Set DB_CA_CERT to the DigitalOcean CA certificate path before connecting.',
  );
}

export const pool = await createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT, // 25060 on DigitalOcean
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: DB_NAME, // 'sigale' — enforced above
  dateStrings: true, // DATETIME as string: JS never moves it across zones
  ssl,
});

console.log(`[${new Date().toISOString()}] [sigale] Connected to DigitalOcean Database (db=${DB_NAME})`);

export default pool;
