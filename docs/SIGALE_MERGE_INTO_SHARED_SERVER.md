# Sígale → Shared Server — Merge & Deploy Plan (Phase 6)

> Status: **PLAN ONLY**. `server/current-server/` stays read-only reference (per [§3.1](SIGALE_2.0_IMPLEMENTATION_PLAN.md)). Nothing in this repo is executed against BlackCoffe. The steps below describe the changes to apply **in the real BlackCoffe deployment repo**.

One process, two tenants. BlackCoffe keeps its house; Sígale moves into a separate room of the same building, with its own key to its own schema. No wall is knocked down.

---

## 1. Locked decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | Database sharing | **Same MySQL instance, separate `sigale` schema.** Sígale keeps its own pool and credentials; the `DB_NAME==='sigale'` guardrail survives. BlackCoffe's tables (`orders`, `deposits`, `clients`, `products`, `users`) are never touched. |
| 2 | Frontend hosting | **Stays separately hosted.** The Sígale PWA only retargets `VITE_API_URL` at the shared backend host. Express keeps serving only BlackCoffe's `client/dist`. |
| 3 | `/current-server` role | **Reference only.** Read it to mirror conventions; apply the actual edits in the live BlackCoffe repo. |
| 4 | Data on deploy | **Schema only, no data.** Migrations create the empty `sigale` tables. Seeding the first organizer is a deliberate post-deploy step (see §7). |

---

## 2. Current state (two separate apps)

| Aspect | BlackCoffe (`current-server/`) | Sígale (`server/`) |
|--------|--------------------------------|--------------------|
| Entry | `index.js` → `runMigrations()` then `listen` | `index.js` → `runMigrations()` then `listen` + `startScheduler()` |
| Route prefix | unprefixed: `/orders`, `/clients`, `/products`, `/users/:u/:p`, `/ping`, `/query`, `/deposits` | all `/api/*`: `/api/health`, `/api/events`, `/api/purchases`, `/api/admin/*`, `/api/scan` |
| DB pool | `db.js` — `await createPool`, `DB_NAME` from env, `ssl.rejectUnauthorized=false` | `db.js` — guardrail throws unless `DB_NAME==='sigale'`; CA cert or no SSL |
| Migrations | `migrations/add_client_snapshot.js` | `migrations/runMigrations.js` (`001`–`004` SQL) |
| Extras | global error mw + `sendErrorEmail` (Resend); serves `client/dist`; `app.get('*')` SPA fallback | `helmet`, `express-rate-limit`, `node-cron` scheduler, bcrypt auth |
| Notifier | `utils/emailNotifier.js` (Resend) | `utils/emailNotifier.js` (Resend) — same transport |

**No route collisions.** Every Sígale path is `/api/*`; no BlackCoffe path is. Mounting is mechanically clean.

---

## 3. Target architecture

A single Express process. BlackCoffe's `index.js` remains the host. Sígale is embedded as one self-contained subtree with a single integration seam, so the host file changes by only a few lines.

```
server/                         # BlackCoffe repo root (real deployment)
├── index.js                    # host app — 3 added lines (see §4)
├── db.js                       # BlackCoffe pool (unchanged)
├── controllers/ routes/ ...    # BlackCoffe (unchanged)
└── sigale/                     # ← Sígale embedded here, self-contained
    ├── integration.js          # mountSigale(app) + startSigale()  ← the only seam
    ├── db.js                   # Sígale pool → sigale schema (see §5)
    ├── routes/  controllers/  middleware/  jobs/  utils/  migrations/
```

Two pools, two migration sets, one HTTP listener, one error handler. Additive only.

---

## 4. Host `index.js` edits (BlackCoffe) — 3 lines

Order matters: Sígale's `/api/*` routes must mount **before** `express.static(client/dist)` and the `app.get('*')` SPA fallback, or GET routes get swallowed by `index.html`.

```js
// near the other imports
import { mountSigale, startSigale } from './sigale/integration.js';

// AFTER app.use(express.json()) and the BlackCoffe app.use(...routes),
// but BEFORE express.static(...) and app.get('*'):
mountSigale(app);   // registers /api/health, /api/events, /api/purchases, /api/admin/*, /api/scan

// inside the boot chain, after app.listen(PORT):
startSigale();      // runs Sígale migrations (idempotent) + starts the node-cron scheduler
```

`integration.js` (new) wraps Sígale's existing routers and boot logic:

```js
// server/sigale/integration.js
import healthRoutes from './routes/health.routes.js';
import eventsRoutes from './routes/events.routes.js';
import purchasesRoutes from './routes/purchases.routes.js';
import adminRoutes from './routes/admin.routes.js';
import scanRoutes from './routes/scan.routes.js';
import { runMigrations } from './migrations/runMigrations.js';
import { startScheduler } from './jobs/scheduler.js';

export function mountSigale(app) {
  app.use(healthRoutes);
  app.use(eventsRoutes);
  app.use(purchasesRoutes);
  app.use(adminRoutes);
  app.use(scanRoutes);
}

export async function startSigale() {
  await runMigrations();   // CREATE TABLE IF NOT EXISTS on the sigale schema
  startScheduler();        // auto-activate stages + sweep expired holds (24h)
}
```

Sígale's own `index.js` is **dropped** from the merged build (its job is replaced by `integration.js`). `helmet` is *not* applied globally in the merged app — it would alter BlackCoffe's response headers (CSP, etc.). If Sígale needs it, scope it to the `/api/*` Sígale routers only, and regression-test BlackCoffe responses first.

---

## 5. The one real code conflict: `DB_NAME`

BlackCoffe's pool reads `process.env.DB_NAME` (its own database). Sígale's `db.js` throws unless `DB_NAME==='sigale'`. In one shared process they share one environment — a single `DB_NAME` cannot be both values.

**Resolution.** Give Sígale its own database-name variable and reuse the shared host/port/credentials. Change Sígale's `sigale/db.js`:

```js
// was: const DB_NAME = process.env.DB_NAME;  (guardrail: must equal 'sigale')
const DB_NAME = process.env.SIGALE_DB_NAME || 'sigale';
if (DB_NAME !== 'sigale') {
  throw new Error("[sigale/db] SIGALE_DB_NAME must be 'sigale'.");
}

export const pool = createPool({
  host:     process.env.DB_HOST,        // shared instance
  port:     Number(process.env.DB_PORT) || 25060,
  user:     process.env.DB_USER,        // shared credentials
  password: process.env.DB_PASSWORD,
  database: DB_NAME,                     // 'sigale' — the separate schema
  dateStrings: true,
  ssl: { rejectUnauthorized: false },   // match BlackCoffe's working DO SSL config
  waitForConnections: true,
  connectionLimit: 10,
});
```

Two notes:

1. **SSL alignment.** Locally Sígale ran without TLS; on the shared DigitalOcean instance use the same SSL config that BlackCoffe already proves works (`rejectUnauthorized:false`), unless you provide a CA cert via `DB_CA_CERT`.
2. **Schema already exists on production.** The `sigale` schema is already created on the shared instance, so no `CREATE DATABASE` step is needed. The pool connects straight to `database:'sigale'`, and `runMigrations.js` runs `CREATE TABLE IF NOT EXISTS` for the `001`–`004` tables — additive, idempotent, and never naming a BlackCoffe table. (If the schema is ever recreated from scratch, a one-time `CREATE DATABASE IF NOT EXISTS sigale;` would be the only prerequisite.)

---

## 6. Environment variables (shared `.env` on the host)

BlackCoffe vars stay as-is. Add the Sígale block:

| Variable | Value | Notes |
|----------|-------|-------|
| `SIGALE_DB_NAME` | `sigale` | New. Keeps the guardrail; avoids the `DB_NAME` collision. |
| `DB_HOST` `DB_PORT` `DB_USER` `DB_PASSWORD` | (shared) | Reused by both pools — same instance. |
| `RESEND_API_KEY` `NOTIFICATION_EMAIL` `FROM_EMAIL` | (shared) | Both notifiers use Resend; one config serves both. |
| `ORGANIZER_USERNAME` `ORGANIZER_INITIAL_PASSWORD` | (set for seed) | Used once in §7 to create the first organizer, then can be removed. |

Dedupe `utils/emailNotifier.js`: both are Resend wrappers. Keep BlackCoffe's as the single notifier, or keep Sígale's under `sigale/utils/` — do not ship two copies wired to the same global error handler.

---

## 7. Deploy sequence ("without the information")

1. **Merge dependencies** into the host `package.json`: add `bcryptjs`, `express-rate-limit`, `helmet`, `node-cron`. `resend`, `cors`, `express`, `mysql2` are already present. Run `npm install`, commit the lockfile.
2. **Copy** `server/` (Sígale) into the BlackCoffe repo as `server/sigale/` and add `integration.js` (§4). Apply the `db.js` change (§5) and the host `index.js` edits (§4).
3. **Set env vars** (§6) in the host (Render / DigitalOcean dashboard).
4. **Deploy.** On boot: BlackCoffe migrations run (unchanged), then `startSigale()` runs Sígale migrations `001`–`004` against the **already-existing** `sigale` schema. Result: `organizers`, `events`, `ticket_stages`, `purchases`, `tickets` ensured via `CREATE TABLE IF NOT EXISTS` — **no rows**.
5. **Smoke test** (§9).
6. **Seed the first organizer only** (no events, no sample data): run `node sigale/seed/seedOrganizer.js` once against the shared instance, or insert one bcrypt-hashed organizer row. This is the only data created. Skip `seedSampleEvent` / `seedFromLocalStorage`.

---

## 8. Frontend retarget (separate deploy)

The Sígale PWA stays on its own host. One change: point it at the shared backend.

| Step | Action |
|------|--------|
| 1 | Set `VITE_API_URL` to the shared backend origin (e.g. `https://<shared-host>`). Sígale's `api/client.js` already prefixes `/api/...`, so it lands on the embedded Sígale routes. |
| 2 | Add the Sígale frontend origin to the host CORS `origin` array in BlackCoffe's `index.js` (alongside `blackcofeepedidos.onrender.com`). |
| 3 | Rebuild + redeploy the Sígale frontend. No code changes beyond the env var. |

---

## 9. Verification checklist

| Check | Expected |
|-------|----------|
| `GET /ping` | BlackCoffe responds (host app intact) |
| `GET /api/health` | `{ ok: true, service: 'sigale' }` (Sígale mounted) |
| `GET /orders/` (BlackCoffe) | unchanged behavior |
| `GET /api/events/active` | resolves before SPA fallback (not `index.html`) |
| MySQL `SHOW DATABASES` | both BlackCoffe DB and `sigale` present; BlackCoffe tables untouched |
| `sigale` schema | 5 tables, 0 rows (1 organizer after §7.6) |
| Scheduler log | one "scheduler started" line at boot |
| CORS | Sígale frontend origin allowed; BlackCoffe origin still allowed |
| BlackCoffe response headers | unchanged (confirm helmet was not applied globally) |

---

## 10. Rollback

Single-process risk: a Sígale boot failure must not take BlackCoffe down. Two safeguards:

1. **Fail soft on Sígale boot.** In `startSigale()`, wrap migrations in try/catch — log and email on failure, but do **not** `process.exit`. BlackCoffe keeps serving even if the `sigale` schema is unreachable.
2. **Clean revert.** Because every change is additive (new `sigale/` subtree, 3 host lines, new env vars, new empty schema), rollback = revert the merge commit and redeploy. The `sigale` schema can be left in place (inert) or dropped independently; BlackCoffe data is never involved.

---

## 11. Open risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Wrong `DB_NAME` / pool points at BlackCoffe schema | High | `SIGALE_DB_NAME` guardrail + separate pool; never reuse BlackCoffe's `DB_NAME` for Sígale |
| `helmet` alters BlackCoffe headers | Medium | Do not apply globally; scope to Sígale routers; regression-test |
| Sígale GET routes swallowed by `app.get('*')` | Medium | Mount `mountSigale(app)` before `express.static` + fallback |
| Connection-pool pressure on shared instance | Low | Sígale `connectionLimit:10`; tune if the instance nears its cap |
| Duplicate error handlers double-send emails | Low | One global error handler; one Resend notifier |
