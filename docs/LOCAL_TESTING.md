# Sígale 2.0 — Local-First Testing (Windows)

> Goal: run the **entire 2.0 stack on your own machine** — Express server + a local
> MySQL `sigale` database + the Vite client — and walk the full flow
> (reserve → submit payment → organizer confirms → door scan) before a single line
> ever touches the real DigitalOcean `sigale` database. This is the gate before Phase 6.
>
> Nothing here connects to DigitalOcean or runs anything under `server/current-server/`.
> The `DB_NAME=sigale` guardrail in `db.js` still holds — your local database is simply
> *also* named `sigale`.

---

## 0. Prerequisites

| Requirement | Why | Check |
|-------------|-----|-------|
| **Node.js ≥ 20.6** | The dev/seed scripts load env via Node's native `--env-file` | `node -v` |
| **MySQL 8.0.16+** running as a Windows service | The DDL uses `JSON`, `ENUM`, and `CHECK` constraints (enforced from 8.0.16) | `mysql --version` |
| Frontend deps installed | The Vite client | `npm install` at repo root |
| Server deps installed | Express + mysql2 | `npm install` in `server/` |

If `node -v` is below 20.6, either upgrade Node or add `dotenv` (see [Troubleshooting](#7-troubleshooting)).

---

## 1. Create the local `sigale` database and user

Open a terminal and enter the MySQL shell as root:

```powershell
mysql -u root -p
```

Then run (creates the database and a dedicated user; `mysql_native_password` sidesteps
the `caching_sha2_password` handshake friction over a non-TLS local connection):

```sql
CREATE DATABASE IF NOT EXISTS sigale
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE USER IF NOT EXISTS 'sigale'@'localhost'
  IDENTIFIED WITH mysql_native_password BY 'sigale_local_dev';

GRANT ALL PRIVILEGES ON sigale.* TO 'sigale'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

The grant is scoped to `sigale.*` only — this local user cannot touch any other schema,
mirroring the production isolation rule.

---

## 2. Point the server at it

`server/.env` is already written for local use (git-ignored). Confirm it matches your
MySQL setup — change only if your port, user, or password differ:

| Variable | Local value | Note |
|----------|-------------|------|
| `DB_HOST` | `127.0.0.1` | Local loopback |
| `DB_PORT` | `3306` | MySQL default (NOT 25060 — that is DigitalOcean) |
| `DB_USER` | `sigale` | The user created above |
| `DB_PASSWORD` | `sigale_local_dev` | Local-only dev credential |
| `DB_NAME` | `sigale` | Required by the guardrail |
| `DB_CA_CERT` | *(empty)* | No TLS locally; `db.js` prints a harmless warning |
| `ORGANIZER_INITIAL_PASSWORD` | `Sigale2026Local!` | Used by the organizer seed |

---

## 3. Install dependencies (first time only)

```powershell
# Repo root — the frontend
npm install

# The backend
cd server
npm install
cd ..
```

---

## 4. Boot the server (creates the tables)

`runMigrations()` runs automatically on boot, before the server listens, and is
idempotent (`CREATE TABLE IF NOT EXISTS`). From `server/`:

```powershell
cd server
npm run dev
```

Expect, in order:

```
[sigale] Connected to ... (db=sigale)
[sigale/migrations] Applied 001_init.sql (5 statements)
[sigale] Server running on port 25060
```

`5 statements` is the correct count (one per table). Leave this terminal running.

> If you saw a `DB_CA_CERT not set` warning line, that is expected locally — it only
> means the connection is plain TCP, which is correct for `localhost`.

---

## 5. Seed organizer + sample event

Open a **second** terminal (the first is busy running the server). From `server/`:

```powershell
cd server
npm run seed:all
```

This seeds:

- Organizer **David** (password `Sigale2026Local!`, bcrypt-hashed on insert).
- One **active event** — *"Noche Astromelias — Evento de Prueba"* — with two stages
  (`Preventa` active at $50,000, `General` upcoming at $70,000), aforo 200.

Both seeds are idempotent: re-running leaves existing rows untouched.

---

## 6. Run the client and smoke-test the flow

In a **third** terminal, from the repo root:

```powershell
npm run dev
```

Vite serves at `http://localhost:5173` (already whitelisted in the server's CORS list)
and `VITE_API_URL` already points at `http://localhost:25060`.

### Quick API checks (PowerShell)

```powershell
# Health
Invoke-RestMethod http://localhost:25060/api/health

# The active event (should return the seeded event + active stage)
Invoke-RestMethod http://localhost:25060/api/events/active

# Organizer login
Invoke-RestMethod -Method Post http://localhost:25060/api/login `
  -ContentType 'application/json' `
  -Body '{"username":"David","password":"Sigale2026Local!"}'
```

### Full flow in the browser

| Step | Where | Expect |
|------|-------|--------|
| 1 | Public landing / event page | The seeded event renders with the `Preventa` stage and remaining cupos |
| 2 | Reserve a ticket | A 3-digit folio is issued; status `pending_payment` |
| 3 | "Ya realicé el pago" | Status moves to `payment_submitted` |
| 4 | `/admin` → log in as David → confirm the folio | Tickets minted; buyer's status page shows the QR(s) |
| 5 | `/scan` | Scanning the QR marks it used; a re-scan is rejected |

### Endpoint reference

| Method | Route | Access |
|--------|-------|--------|
| GET | `/api/health` | Public |
| GET | `/api/events/active` | Public |
| GET | `/api/events/:id` | Public |
| POST | `/api/purchases` | Public |
| POST | `/api/purchases/:orderId/submitted` | Public |
| GET | `/api/purchases/:orderId` | Public |
| GET | `/api/recover?contact=` | Public (rate-limited) |
| POST | `/api/login` | Public (rate-limited) |
| GET | `/api/admin/purchases` | Organizer |
| POST | `/api/admin/purchases/:id/confirm` | Organizer |
| POST | `/api/admin/purchases/:id/reject` | Organizer |
| POST | `/api/admin/sales` | Organizer |
| GET | `/api/admin/scan/manifest` | Organizer |
| POST | `/api/admin/scan` · `/api/admin/scan/sync` | Organizer |

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Refusing to connect: DB_NAME must be 'sigale'` | Wrong/missing `DB_NAME` | Confirm `server/.env` has `DB_NAME=sigale` |
| `ER_NOT_SUPPORTED_AUTH_MODE` / "public key retrieval" on connect | MySQL user uses `caching_sha2_password` over plain TCP | Recreate the user with `IDENTIFIED WITH mysql_native_password` (Step 1) |
| `bad option: --env-file` | Node < 20.6 | Upgrade Node, **or** `npm i dotenv` in `server/` and add `import 'dotenv/config';` as the first line of `index.js` and each seed script |
| `ECONNREFUSED 127.0.0.1:3306` | MySQL service not running, or different port | Start the MySQL service; set `DB_PORT` to your actual port |
| `EADDRINUSE :25060` | Port 25060 already taken | Change `PORT` in `server/.env` and `VITE_API_URL` in the root `.env` together |
| Migration prints a count other than `5` | Stray statement split | Should not happen after the runner fix; re-check `001_init.sql` edits |
| CORS error in the browser console | Client served from an origin not in the list | Use `http://localhost:5173`; add other origins in `server/index.js` |

---

## 8. Reset / teardown

To wipe local data and start clean (this drops the **local** `sigale` DB only — never
DigitalOcean):

```powershell
mysql -u root -p -e "DROP DATABASE sigale;"
```

Then repeat Step 1 (recreate) → Step 4 (boot re-migrates) → Step 5 (re-seed).

---

## Appendix — what changed to make this work

| Change | File | Why |
|--------|------|-----|
| Migration runner now strips **inline** `--` comments | `server/migrations/runMigrations.js` | Two column comments contained a `;`, which split a statement mid-body and would have crashed the first real migration |
| Sample-event seed added | `server/seed/seedSampleEvent.js` | One active event so the buyer flow is testable on first boot |
| `seed:event`, `seed:all` scripts; `dev`/seeds load `--env-file=.env` | `server/package.json` | Local env without a new dependency (`server/` is not deployed until Phase 6) |
| Local env created | `server/.env` | Local MySQL, no TLS, dev organizer password |

> Validation: the whole stack was run end to end against a real SQL engine (MariaDB 10.6,
> as a stand-in for MySQL 8). Migrations applied cleanly (5 statements), and the full flow
> passed: reserve (inventory held under the row lock) -> submit -> login -> confirm
> (reserved->sold, two tickets minted with a 16-hex deterministic HMAC validationHash) -> manifest ->
> scan (`ok`) -> re-scan (`already_used`, idempotent). Negative paths held too: a cap-1 stage
> returned 409 `Cupos insuficientes`, an upcoming stage 409, admin without Basic auth 401,
> and an unknown hash 404. The authoritative run is still Step 4 on your MySQL 8.
>
> One dialect note: the event-creation path uses `CAST(? AS JSON)` (in `seedSampleEvent.js`
> and `events.controllers.js`). That is valid MySQL 8, but **MariaDB rejects it** — so if you
> happen to run MariaDB instead of MySQL 8, the event seed/create will fail there. On MySQL 8
> it works as written; no change needed.
