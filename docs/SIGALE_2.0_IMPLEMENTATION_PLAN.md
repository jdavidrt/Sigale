# Sígale — Build Status & Open Items

> **Source documents.** This file distills `docs/architecture/ADR-0001-migracion-sql-express.md`, `docs/design/DESIGN_BRIEF_2.0.md`, and `docs/design2.0/IMPLEMENTATION_GUIDE.md` into a single reference for what is built, what remains, and what must never change.
>
> Conventions: Spanish UI copy, English code/identifiers, AM/PM times, `formatCurrency()` for money, America/Bogota timezone, token-driven styling, mobile-first (≥44px touch / ≥16px inputs), no native `alert/confirm/prompt`.

> **HARD GUARDRAIL — do not touch BlackCoffe.** `server/current-server/` is a **read-only reference copy** of BlackCoffe's live production server, kept only to mirror its conventions. **Never execute it, never run its scripts or migrations, never point it at a database.** All Sígale backend code lives in a *separate* `server/` app and connects *only* to the dedicated **`sigale`** database. Sígale migrations may only create/alter Sígale's own tables and must never `CREATE`/`ALTER`/`DROP`/write BlackCoffe's tables (`orders`, `deposits`, `clients`, `products`, `users`). Before running anything, confirm `DB_NAME=sigale` — the shared `.env.local` may hold BlackCoffe's real credentials, and one migration against the wrong database could corrupt the other project. Full detail in [§3.1](#31-hard-guardrail--isolation-from-blackcoffe).

---

## 0. Locked decisions

These are resolved; do not reopen them.

| # | Decision |
|---|----------|
| 1 | **Astromelias palette wins.** `tokens.css` uses Astromelias tokens; the old violet palette is gone. |
| 2 | **`orderId` in code; "folio" in Spanish UI.** Route param: `/compra/:orderId`. |
| 3 | **`validationHash` is server-generated random 128-bit** (minted at confirm). Not derived from buyer data. |
| 4 | **Hold is 24h** (`reservationExpiresAt = createdAt + 24h`). The 20-minute buyer countdown is cosmetic copy only. |
| 5 | **Simple per-request credential check** against `organizers` (no JWT/session). Bcrypt; `/api/login` rate-limited. |
| 6 | **Offline-first door scan.** Pre-cache confirmed hashes in IndexedDB, validate locally, sync on reconnect. |
| 7 | **Dedicated `sigale` database.** Clean table names, its own pool. |
| 8 | **`events.isActive`** (TINYINT) resolves the single active event. |

---

## 1. What is built

### Backend (`server/`)

- Express app: `helmet` + CORS (Sígale origins) + `express.json(64kb)` + global error handler + email notifier.
- `db.js`: `mysql2/promise` pool → `sigale` DB, `dateStrings:true`, SSL CA cert.
- `migrations/001_init.sql`: full DDL — `organizers`, `events`, `ticket_stages`, `purchases`, `tickets`. Idempotent (`CREATE TABLE IF NOT EXISTS`).
- `runMigrations.js` runs pending SQL files before `app.listen()`.
- Controllers and routes: `events`, `purchases`, `admin`, `scan`, `health`.
- `requireOrganizer` middleware: re-validates Basic credentials on every `/api/admin/*` call.
- `scheduler.js` (node-cron): stage auto-activation + expired-hold sweep (24h, `pending_payment` only).
- Seeds: `seedOrganizer`, `seedSampleEvent`, `seedFromLocalStorage`.
- `utils/emailNotifier.js`, `utils/time.js`.

### Frontend (`src/`)

- API layer: `src/api/client.js` (base fetch + `ApiError`), `events.js`, `purchases.js`, `admin.js`, `scan.js`.
- Astromelias CSS: `src/styles/astromelias.css` with component classes (`.btn`, `.card`, `.pill`, `.stat`, `.field`, `.trow`, `.t3`).
- Astromelias UI primitives: `Ic`, `Money`, `Screen`, `StarField`, `Wordmark`.
- Public routes wired in `App.jsx`: `LandingPage`, `PurchaseFlowPage`, `PurchaseStatusPage`, `AdminPage`, `ScanPage`.
- `src/components/flow/`: `FlowShell` + `PurchaseFlow` (7-step wizard skeleton).
- Offline scan: `useOfflineScan.js` hook + `scanDb.js` IndexedDB helpers + `OfflineScanner.jsx`.
- `AsyncState` component for loading/error/empty states.
- `usePWAInstall` removed; `useOfflineScan` added.

---

## 2. What remains

### Phase 2 — Public purchase flow (highest priority)

- Wire `FlowShell` steps 1–6 fully to `api/purchases.js` with field validation, error handling, and the `idempotencyKey` pattern.
- `/compra/:orderId` status page: render all five purchase states with correct status pills (`.pill.wait/.sent/.ok/.no/.dead`).
- WhatsApp deep link: `wa.me/<whatsappNumber>?text=...#<orderId>`.
- QR ticket display after `confirmed`.

### Phase 1 / Phase 3 — Event form + Admin panel

- Extend `CreateEvent` to accept full schema fields: `description`, `artists[]`, `eventDate`, `openingTime`, `venueCapacity`, `flyerImageUrl`, `bankQrImageUrl`, `whatsappNumber`, repeatable stage editor (`name`, `price`, `totalQuantity`, `sortOrder`, `activatesAt`). Live capacity meter (Σ stage quotas ≤ `venueCapacity`).
- `AdminPage`: purchases table with folio search + status filters + Confirmar pago / Rechazar row actions + **Registro directo** walk-in form. `SlideToConfirm` guard on Rechazar.
- Per-stage + revenue breakdown in DashboardPage via `StatCell`.

### Phase 4 — Offline scan polish

- `ScanPage`: large, glanceable result display using `.pill` language; one-handed at the door.
- Document the single-scanner assumption in the component.

### Phase 5 — States + hardening

- Empty / loading / error / success states across all public screens (use `AsyncState`).
- `prefers-reduced-motion` guard on `StarField` and any CSS transitions.
- Accessibility: never color-only — color + dot + label on status pills.
- Full security pass (§4 below).

### Phase 6 — Deploy

- Add Sígale domain to the shared server's CORS origin list.
- Set `VITE_API_URL` to `https://coffeserver.onrender.com` in the production frontend env.
- Merge `server/` into the BlackCoffe repo: separate pools, separate migration sets, additive DDL only.
- Run the end-to-end smoke test: reserve → confirm → scan.

---

## 3. Backend specifics

### 3.1 Hard guardrail — isolation from BlackCoffe

`server/current-server/` is a **reference snapshot** of BlackCoffe's production server. It is there to copy *patterns* from, nothing more. Treat it as read-only:

- **Never execute it.** No `node index.js`, no `npm start`, no running any file under its `migrations/`.
- **Build Sígale separately.** Sígale's backend is the `server/` app (sibling to `current-server/`).
- **Own pool, own database.** Sígale uses its own pool bound to `DB_NAME=sigale`. Its migration runner may only touch Sígale tables; it must never reference BlackCoffe tables (`orders`, `deposits`, `clients`, `products`, `users`).
- **Verify before any DB command.** Confirm `DB_NAME=sigale`. The shared `.env.local` may carry BlackCoffe's real credentials.
- **Phase 6 stays additive.** Keep separate pools and migration sets in the shared repo. Use `CREATE TABLE IF NOT EXISTS` so redeployment is idempotent.

### 3.2 Concurrency

Inventory paths use `getConnection()` + `beginTransaction()` + `SELECT … FOR UPDATE`. Never `pool.query` for inventory. Always `conn.release()` in `finally`.

### 3.3 Timezone

Persist UTC (`UTC_TIMESTAMP()`, `CURRENT_TIMESTAMP` defaults). Read with `CONVERT_TZ(col,'+00:00','-05:00')`. Format AM/PM with `formatTo12Hour()`. `eventDate`/`activatesAt` are Bogotá wall-clock → convert to UTC before storing so `activatesAt <= UTC_TIMESTAMP()` compares correctly.

---

## 4. Security checklist

- Organizer password stored as **bcrypt hash** in `organizers.passwordHash`. Seed by hashing — never store plaintext. Rotate the `DB_PASSWORD` / `RESEND_API_KEY` that appeared in any shared `.env.local`.
- Validate credentials on **every** `/api/admin/*` request (`requireOrganizer`), over **HTTPS only**.
- **Rate-limit** `/api/login` and `/api/recover`.
- **Explicit column lists** on every public `INSERT` — no `SET ?` mass-assignment.
- Parameterized queries everywhere; `helmet` on the Express app.
- **SSL with verification** to the DB: CA cert, no `rejectUnauthorized:false`.
- `validationHash` is a **random secret**, never derived from buyer data (decision #3).

---

## 5. Risks & open items

- **Offline scan + multi-device.** Two offline scanners could both admit the same ticket until sync. Single-scanner assumption — document it at the component level; revisit if a second scanner is added.
- **Deploy coupling.** Sharing BlackCoffe's server means Sígale ships on BlackCoffe commits and shares its connection-pool limits and maintenance windows.
- **1 000-folio ceiling** per event (3-digit `orderId`) — sufficient for ~200-seat venues; assert it.
- **`payment_submitted` never swept.** Organizer inaction holds inventory indefinitely; surface a count in the admin dashboard.
- **Static frontend ↔ API CORS.** Sígale production domain must be in the server's `cors` origins; `VITE_API_URL` must be set per environment.
- **BlackCoffe data safety (highest severity).** `server/current-server/` and its migrations must never be executed from this repo. A stray run against the wrong `DB_NAME`, or destructive DDL on a shared redeploy, could corrupt the live project. See [§3.1](#31-hard-guardrail--isolation-from-blackcoffe).

---

## 6. Definition of done

- `npm test` green (all specs updated alongside each phase); `npm run lint` clean; `npm run build` succeeds.
- End-to-end: create active event → public reserve (folio issued) → submit payment → organizer confirms → buyer sees QR → door scan marks `isUsed` → re-scan rejected.
- Concurrency probe: two simultaneous reservations on the last spot — exactly one wins (HTTP 409 for the other).
- Offline drill: scan with the network off, reconnect, confirm the server reconciles with no double-admit.
- Security pass: admin endpoints reject missing/bad credentials; login is rate-limited; no plaintext secrets in git; DB SSL verifies the CA.
- Timezone check: an event at 8:00 PM Bogotá stores as `01:00` UTC next day and renders back as 8:00 PM.
