/*
 * ============================================================
 * SÍGALE — MIGRATION RUNNER
 * Same boot mechanic as BlackCoffe (current-server runs
 * runMigrations() before app.listen), but Sígale's own:
 * it applies every *.sql file in this folder, in name order.
 *
 * Idempotent by construction — the DDL uses CREATE TABLE IF
 * NOT EXISTS — so re-running on every boot is safe, and a
 * shared-server redeploy can never run destructive DDL.
 *
 * GUARDRAIL (SIGALE_2.0_IMPLEMENTATION_PLAN §3.1): refuses to
 * run unless DB_NAME=sigale. db.js enforces the same on the
 * pool; this is defense in depth.
 * ============================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Strip SQL comments and split a file into individual statements.
 * The Sígale DDL has no semicolons inside statement bodies, so a
 * naive split on ';' is correct here (and the pool intentionally
 * does NOT enable multipleStatements).
 */
function splitStatements(sql) {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--')) // drop line comments
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function runMigrations() {
  if (process.env.DB_NAME !== 'sigale') {
    throw new Error(
      `[sigale/migrations] Refusing to run: DB_NAME must be 'sigale' (got '${process.env.DB_NAME ?? 'undefined'}').`,
    );
  }

  const files = fs
    .readdirSync(__dirname)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
    const statements = splitStatements(sql);
    for (const statement of statements) {
      await pool.query(statement);
    }
    console.log(`[${new Date().toISOString()}] [sigale/migrations] Applied ${file} (${statements.length} statements)`);
  }
}

export default runMigrations;
