# Sígale — Audit Report

> Full audit and cleanup pass, run in four phases (calibration → discovery →
> proposal → execution). Started 2026-07-08. This report is the running record;
> each phase appends to it. No source files are modified before Phase 3.

---

## Phase 0 — Calibration

### Documents read

All six calibration documents exist and were read in full, in order:

| # | Document | Status |
|---|----------|--------|
| 1 | `CLAUDE.md` | Read — source of truth for invariants |
| 2 | `README.md` | Read — 1.0 shipped / 2.0 migration context |
| 3 | `docs/architecture/PROJECT_OVERVIEW.md` | Read — deep architecture (data-model narrative partially superseded by TICKETS_SCHEMA.md, flagged at its own top) |
| 4 | `docs/architecture/TICKETS_SCHEMA.md` | Read — column-by-column merged `tickets` reference |
| 5 | `docs/SIGALE_2.0_IMPLEMENTATION_PLAN.md` | Read — incl. §3.1 BlackCoffe guardrail |
| 6 | `docs/SIGALE_MERGE_INTO_SHARED_SERVER.md` | Read — Phase 6 merge/deploy plan |

### Confirmed frontend framework versions

Installed versions verified with `npm ls --depth=0` at repo root (ranges in
`package.json` shown in parentheses):

| Package | Installed | Declared |
|---------|-----------|----------|
| `react` / `react-dom` | 19.2.0 | `^19.1.1` |
| `vite` | 7.1.9 | `^7.1.7` |
| `react-router-dom` | 7.9.3 | `^7.9.3` |

Other runtime deps: `qrcode.react` 4.x, `html5-qrcode` 2.3.x, Font Awesome 7
(svg-core + free-solid + react component). Build tooling: Vitest 3, ESLint 9,
PostCSS 8 + autoprefixer only (no Tailwind — consistent with the plain-CSS rule).
Note: `jspdf` appears in docs (PROJECT_OVERVIEW tech-stack table) but **not** in
`package.json` — carried to Phase 1/2 as a doc-drift candidate.

### Confirmed backend stack

Installed versions verified with `npm ls --depth=0` in `server/`:

| Package | Installed | Declared |
|---------|-----------|----------|
| `express` | 4.22.2 | `^4.21.2` |
| `mysql2` (used as `mysql2/promise`) | 3.22.5 | `^3.11.5` |
| `node-cron` | 3.0.3 | `^3.0.3` |

Also declared: `bcryptjs` ^2.4.3, `cors` ^2.8.5, `express-rate-limit` ^7.4.1,
`helmet` ^8.0.0, `resend` ^4.0.1. `server/db.js` connects only to the `sigale`
schema with `dateStrings: true`; `runMigrations.js` refuses to run unless
`SIGALE_DB_NAME` (or `DB_NAME`) resolves to `sigale`.

### `SCAN_HASH_SECRET`

- **Present in `server/.env.example`:** yes — [server/.env.example:28](server/.env.example#L28),
  with a comment block explaining it keys the deterministic `validationHash`
  HMAC, must be long/random/stable, that rotating it invalidates every
  already-issued QR, and that the code falls back to an insecure dev default
  when unset.
- **Production (Render) documented as setting it:** partially. `CLAUDE.md` and
  `docs/architecture/PROJECT_OVERVIEW.md` both state it "**must be set in
  production** (Render)". However, the actual deploy plan for the shared host —
  `docs/SIGALE_MERGE_INTO_SHARED_SERVER.md` §6 "Environment variables (shared
  .env on the host)" — **omits `SCAN_HASH_SECRET` from its env-var table**
  (it lists only `SIGALE_DB_NAME`, DB creds, Resend vars, and the organizer
  seed vars). No document in the repo affirmatively records that the Render
  environment actually has the secret set. → Carried to Phase 2 as a
  doc-gap candidate (docs bucket; risk: critical to verify, low to fix).

### `tickets_v2` cutover status

- **No SQL migration after `005` performs the cutover.** Migration files, in
  order: `001_init.sql`, `002_event_address.sql`, `003_sequential_orderid.sql`,
  `004_holders_snapshot.sql`, `005_tickets_merge_schema.sql` (creates
  `tickets_v2`), `006_guest_passes.sql`. The rename is deliberately **not** a
  boot migration — it lives in a manually-run, flag-gated script:
  [server/migrations/scripts/merge_purchases_into_tickets.js](server/migrations/scripts/merge_purchases_into_tickets.js)
  (`--dry-run` / `--migrate --yes` / `--verify` / `--cutover --yes`; the cutover
  renames `tickets → tickets_legacy_v1`, `purchases → purchases_legacy_v1`,
  `tickets_v2 → tickets`, dropping nothing).
- **Controllers query the final name `tickets`, not `tickets_v2`:** confirmed —
  28 `FROM/INTO/UPDATE/DELETE ... tickets` statements across
  `admin.controllers.js` (14), `purchases.controllers.js` (8),
  `scan.controllers.js` (5), `events.controllers.js` (1); zero `tickets_v2`
  references anywhere under `server/controllers/`.
- **The cutover HAS shipped in production.** Evidence: (a)
  [server/migrations/runMigrations.js](server/migrations/runMigrations.js)
  now carries a `schema_migrations` applied-once ledger with an explicit
  self-heal for the *already-cut-over* case — it checks for
  `tickets_legacy_v1` in `information_schema` and, when present, marks
  migrations 001–005 as applied because their pre-cutover DDL now collides
  (ER_FK_DUP_NAME) with FK names the RENAME carried onto the legacy/merged
  tables; (b) session memory from 2026-07-08 records that this exact failure
  occurred on production (it silently blocked `006_guest_passes` from
  applying) and was fixed by running the repaired chain against the prod
  `sigale` schema. The legacy tables survive as `*_legacy_v1`.
- **Consequence:** `CLAUDE.md`'s line "Status as of this writing: code-complete
  but **not yet cut over in production**" and the equivalent Status paragraph
  at the top of `docs/architecture/TICKETS_SCHEMA.md` are **stale** — the
  cutover has run. → Carried to Phase 2 as a doc-drift candidate (never
  auto-edited; per the hard constraints, docs are flagged only).

### Calibration deltas worth tracking (for Phase 2)

| # | Observation | Where |
|---|-------------|-------|
| 1 | `tickets_v2` cutover already live in prod; two docs still say "not yet" | `CLAUDE.md`, `docs/architecture/TICKETS_SCHEMA.md` |
| 2 | `SCAN_HASH_SECRET` missing from the shared-host env-var table | `docs/SIGALE_MERGE_INTO_SHARED_SERVER.md` §6 |
| 3 | `jspdf` in docs' tech-stack table but absent from `package.json` | `docs/architecture/PROJECT_OVERVIEW.md` |
| 4 | PROJECT_OVERVIEW "Backup / handoff" workflow still describes `/copy-event` JSON export, removed per CLAUDE.md | `docs/architecture/PROJECT_OVERVIEW.md` §End-user workflows |
| 5 | Merge plan §5/§7 predate later changes (mentions only migrations 001–004, `rejectUnauthorized:false` vs. `.env.example`'s CA-cert stance) | `docs/SIGALE_MERGE_INTO_SHARED_SERVER.md` |

---

## Phase 1 — Discovery (read-only)

### 1.1 Backend surface

All six routers defined under `server/routes/` are mounted in
[server/index.js:52-57](server/index.js#L52-L57) (order: health, events,
purchases, admin, guestPasses, scan), behind `helmet()`, CORS
(localhost origins only in this repo's copy), and `express.json({ limit: '64kb' })`.
A global error middleware (logs + `sendErrorEmail`, fire-and-forget) sits after
all routes. There are **no unmounted routers** and only one custom middleware,
`requireOrganizer`, which is chained on every route that needs it.

| Method | Path | Controller (file → fn) | Middleware | Domain |
|--------|------|------------------------|------------|--------|
| GET | `/api/health` | inline in `health.routes.js` | — | health |
| GET | `/api/events/active` | `events.controllers.js → getActiveEvent` | — | public |
| GET | `/api/events/:id` | `events.controllers.js → getEventById` | — | public |
| POST | `/api/events` | `events.controllers.js → createEvent` | `requireOrganizer` | organizer |
| PUT | `/api/events/:id` | `events.controllers.js → updateEvent` | `requireOrganizer` | organizer |
| POST | `/api/purchases` | `purchases.controllers.js → createPurchase` | — | public |
| POST | `/api/purchases/:orderId/submitted` | `purchases.controllers.js → submitPayment` | — | public |
| POST | `/api/login` | `admin.controllers.js → login` | `loginLimiter` (10/min) | public |
| GET | `/api/admin/purchases` | `admin.controllers.js → getAdminPurchases` | `requireOrganizer` | organizer |
| DELETE | `/api/admin/purchases` | `admin.controllers.js → deleteAllPurchases` | `requireOrganizer` | organizer |
| GET | `/api/admin/tickets` | `admin.controllers.js → getAdminTickets` | `requireOrganizer` | organizer |
| PATCH | `/api/admin/tickets/:id` | `admin.controllers.js → updateAdminTicket` | `requireOrganizer` | organizer |
| DELETE | `/api/admin/tickets/:id` | `admin.controllers.js → deleteAdminTicket` | `requireOrganizer` | organizer |
| POST | `/api/admin/purchases/:orderId/confirm` | `admin.controllers.js → confirmPurchase` | `requireOrganizer` | organizer |
| POST | `/api/admin/purchases/:orderId/reject` | `admin.controllers.js → rejectPurchase` | `requireOrganizer` | organizer |
| POST | `/api/admin/sales` | `admin.controllers.js → createWalkInSale` | `requireOrganizer` | organizer |
| GET | `/api/admin/guest-passes` | `guestPasses.controllers.js → listGuestPasses` | `requireOrganizer` | guest passes |
| POST | `/api/admin/guest-passes` | `guestPasses.controllers.js → createGuestPass` | `requireOrganizer` | guest passes |
| POST | `/api/admin/guest-passes/bulk` | `guestPasses.controllers.js → createGuestPassesBulk` | `requireOrganizer` | guest passes |
| PATCH | `/api/admin/guest-passes/:id` | `guestPasses.controllers.js → updateGuestPass` | `requireOrganizer` | guest passes |
| DELETE | `/api/admin/guest-passes/:id` | `guestPasses.controllers.js → deleteGuestPass` | `requireOrganizer` | guest passes |
| GET | `/api/admin/scan/manifest` | `scan.controllers.js → getScanManifest` | `requireOrganizer` | scan |
| POST | `/api/admin/scan` | `scan.controllers.js → scanTicket` | `requireOrganizer` | scan |
| POST | `/api/admin/scan/sync` | `scan.controllers.js → syncScans` | `requireOrganizer` | scan |

Note: `POST /api/admin/scan` (single online scan) exists in the code but is
**absent from CLAUDE.md's API table**, while the table still describes
`src/api/scan.js` as exporting `getManifest, syncScans` — doc drift from the
online-only scan refactor (commit `92617c6`).

### 1.2 Frontend surface

**Routes in `App.jsx`** (all lazy except none — every page is `React.lazy`):

| Path | Element | Guard |
|------|---------|-------|
| `/` , `/evento/:id` | LandingPage | public |
| `/compra` | PurchaseFlowPage | public |
| `/admin` | AdminPage (own chrome + login) | public shell, server-auth actions |
| `/admin/create` | redirect → `/admin` | — |
| `/scan` | ScanPage | public by design (trap #5) |
| `/create-event` | CreateEventPage | RequireAuth + OrganizerLayout |
| `/edit` | EditEventPage | RequireAuth + OrganizerLayout |
| `/edit-event` | redirect → `/edit` | RequireAuth |
| `/sell-tickets` | SellTicketsPage | RequireAuth + OrganizerLayout |
| `/guest-passes` | GuestPassesPage | RequireAuth + OrganizerLayout |
| `/tickets` | TicketsPage | RequireAuth + OrganizerLayout |
| `/validate-qr` | redirect → `/scan` | RequireAuth |
| `/dashboard` | DashboardPage | RequireAuth + OrganizerLayout |
| `*` | redirect → `/` | RequireAuth |

Note: the legacy redirects `/edit-event`, `/validate-qr`, and the `*` catch-all
sit **inside** the `RequireAuth` wrapper, so for a logged-out visitor they all
resolve to `/admin` rather than their stated target. Behavior-preserving
observation only; no change proposed.

**Pages (17 files):** the 11 routed pages above plus `Home.jsx` +
`Home.module.css` — **not imported anywhere** (deprecated per CLAUDE.md;
orphan candidate, trap #17 confirmed: no route, no import, redirect chain
`/admin/create → /admin` intact without it).

**API wrappers (`src/api/`):** `client.js` (base fetch + `ApiError` +
`api.health()` probe — **`health()` has no caller**), `events.js`
(getActive/getById/create/update + payload mappers), `purchases.js`
(create/submit + `PURCHASE_STATUS`/`STATUS_META`/`whatsappLink`), `admin.js`
(login/list/confirm/reject/walkIn/listTickets/updateTicket/deleteTicket/
deleteAllPurchases + `getAuth`/`isLoggedIn`/`logout`), `guestPasses.js`
(list/create/bulkCreate/update/remove), `scan.js` (`scanAndAdmit` →
`POST /api/admin/scan`, online-only). **`admin.js` also still contains a
`localAdmin` localStorage simulation (lines ~101–159) plus its private
helpers `randomHash`/`readAll`/`writeAll`/`localOrderId` that the exported
facade no longer references** — dead code candidate.

**Contexts:** `LanguageContext` (t, language toggle — uses
`useLocalStorageValue`), `EventContext` (event CRUD via `eventsApi`),
`TicketContext` (organizer ticket list; `refreshFromServer`, `getStats(event)`,
`addTicketsFromCSV`, `updateTicket`, `deleteTicket`, `deleteAllTickets` →
`admin.deleteAllPurchases`; still uses `useLocalStorage` for the local blob),
`DialogContext` (confirm/notify/openCustom). All four mounted in `App.jsx`.

**Hooks (3):** `useLocalStorage` (TicketContext), `useLocalStorageValue`
(LanguageContext, TicketsPage), `usePageVisibility` (App, imports
`checkCacheHealth` from `serviceWorkerRegistration`). **`useOfflineScan.js`
and `scanDb.js` no longer exist on disk** — deleted in the online-only scan
refactor — yet CLAUDE.md and PROJECT_OVERVIEW still document both, plus the
IndexedDB manifest/sync architecture. Major doc drift.

**Utils (12):** all referenced except noted — `csvUtils` (CSVPanel),
`hashGenerator` (TicketContext), `storage` (TicketContext, useLocalStorage,
DashboardPage), `base64Cleaner` (svgTicketTemplate), `timeFormat` (widespread),
`ticketPasteParser` (TicketForm, TicketTable, GuestPassTable), `sampleEvent`
(LandingPage, PurchaseFlow), `svgTicketTemplate` (App, qrCopy, QRDisplay; its
export `loadTicketFonts` needs a Phase 2 caller check), `qrCopy` (QRDisplay,
TicketCard), `qrGenerator` (QRDisplay, TicketCard, OfflineScanner),
`translations` (LanguageContext), `serviceWorkerRegistration` (main.jsx —
exists but absent from CLAUDE.md's source tree).

**Assets:** `flyer.png` (LandingPage), `flyerImage.js` (App). 
**`charlyIllustration.js` has zero importers** — orphan candidate (App now
loads `FLYER_IMAGE_BASE64` from `flyerImage.js` instead; `loadCharlyIllustration`
no longer exists in `svgTicketTemplate.js`, which now exports `loadFlyerImage`).
CLAUDE.md still documents the Charly pipeline.

### 1.3 Cross-reference: backend route ↔ frontend caller

| Backend route | Frontend caller | Status |
|---------------|-----------------|--------|
| GET `/api/health` | `api.health()` in client.js | wrapper exists, **no UI caller** |
| GET `/api/events/active` | `eventsApi.getActive` ← EventContext / LandingPage / PurchaseFlow | live |
| GET `/api/events/:id` | `eventsApi.getById` ← LandingPage (`/evento/:id`) | live |
| POST/PUT `/api/events` | `eventsApi.create/update` ← EventContext ← CreateEvent | live |
| POST `/api/purchases` (+`/submitted`) | `purchases.create/submit` ← PurchaseFlow | live |
| POST `/api/login` | `admin.login` ← AdminPage | live |
| GET `/api/admin/purchases` | `admin.list` ← AdminPage | live |
| DELETE `/api/admin/purchases` | `admin.deleteAllPurchases` ← TicketContext ← TicketsPage | live |
| POST confirm / reject | `admin.confirm/reject` ← AdminPage | live |
| POST `/api/admin/sales` | `admin.walkIn` ← TicketForm (SellTicketsPage) | live |
| GET `/api/admin/tickets` | `admin.listTickets` ← TicketContext.refreshFromServer | live |
| PATCH `/api/admin/tickets/:id` | `admin.updateTicket` ← TicketContext | live |
| DELETE `/api/admin/tickets/:id` | `admin.deleteTicket` ← TicketContext ← TicketCard/TicketTableRow | live |
| POST `/api/admin/scan` | `scanApi.scanOne` ← `scanAndAdmit` ← ScanPage/OfflineScanner | live |
| GET `/api/admin/scan/manifest` | — | **no frontend caller** (offline layer removed) |
| POST `/api/admin/scan/sync` | — | **no frontend caller** (offline layer removed) |
| guest-passes ×5 | `guestPasses.*` ← GuestPassesPage/GuestPassTable | live |

Every `src/api/*.js` exported function maps to a live backend handler; the
only backend endpoints with no caller are `scan/manifest` and `scan/sync`
(candidates — but they touch the scan pipeline, so per the classification
rules they are CRITICAL/REVIEW, never plain delete; a second door device or a
future offline mode could also be a deliberate reason to keep them).

### 1.4 CSS system inventory

36 CSS files: `src/index.css` (imported by `main.jsx` — not listed in
CLAUDE.md's style stack), the 4-layer stack `tokens.css → global.css →
utilities.css → astromelias.css` (imported in `App.jsx` in that order), and
31 `*.module.css`. Mechanical reference scan (scratchpad script; class
selectors matched against all JS/JSX/HTML/CSS, custom properties against
`var(...)` usage everywhere including `astromelias.css` per the rules):

- **Orphan module files:** none. (`Dashboard.shared.module.css` initially
  flagged, then confirmed used via `composes: ... from` in both dashboard
  modules — false positive, excluded.)
- **Unused classes in module files (raw, pre-verification):**
  `CreateEvent.module.css` — 16 classes from the retired ticket-types table UI
  (`typeRow`, `typesList`, `iconBtn*`, `newType*`, `tableHeader*`, …);
  `Button.module.css` — `.sm`; `TicketForm.module.css` — `.pasteBtn`.
  Importers of the latter two use some dynamic access → Phase 2 must verify.
- **Unused classes in global sheets (raw, pre-verification):**
  `astromelias.css` — 10 (`act`, `badge`, `info-ic`, `ph-img`, `sb-ic`,
  `stat-grid`, `statusbar`, `tname`, `tnum`, `tprice`); `global.css` — 3
  animation helpers (`animate-fadeIn`, `animate-slideFromLeft/Right`);
  `utilities.css` — 20 (`flex-*`, `text-*`, `card-*`, `progress-*`,
  `badge-primary`, `color-*`, `empty-state*`, `shadow-soft`,
  `icon-box-icon-lg`). All need a dynamic-className scan in Phase 2 before
  any is flagged for removal (e.g. `.pill` variants are constructed from
  `STATUS_META.pill` strings and correctly did NOT appear here).
- **Unused custom properties (raw):** `tokens.css` — 33 (debug palette,
  gap/pad spacing aliases, `--gradient-*`, `--z-modal`, `--z-debug`, etc.);
  `astromelias.css` — 4 (`--green-deep`, `--pink`, `--r-sm`,
  `--yellow-soft`).

### 1.5 Test baseline

`npm test` (vitest 3.2.4, CI mode): **6 files, 81 tests, 81 passed, 0 failed**
in 19.86s — `qrGenerator` (7), `csvUtils` (23), `timeFormat` (19), `storage`
(9), `hashGenerator` (8), `TicketContext` (15). One intentional stderr line
(corrupted-JSON recovery test). This is the bar every Phase 3 commit must hold.

### 1.6 Dependency trees

- **Root:** matches `package.json` (§Phase 0 versions). `npm ls --all` reports
  **no missing/invalid/extraneous** packages; 21 `UNMET OPTIONAL DEPENDENCY`
  entries, all optional peers of vite/vitest/jsdom (sass, less, terser,
  lightningcss, canvas, happy-dom, @vitest/browser, @types/node, …) — benign,
  expected, not actionable.
- **Server:** clean — no UNMET/invalid/extraneous at all. Dependencies:
  bcryptjs, cors, express, express-rate-limit, helmet, mysql2, node-cron,
  resend. All eight are imported somewhere under `server/` (verified for
  Phase 2: resend ← `utils/emailNotifier.js`, node-cron ← `jobs/scheduler.js`,
  express-rate-limit ← `admin.routes.js`, helmet ← `index.js`).
- Font Awesome (3 packages) is a root dependency to verify in Phase 2 (`Ic.jsx`
  may or may not wrap it).

### 1.7 Migrations (in run order)

`runMigrations.js` applies `*.sql` in name order, once, via a
`schema_migrations` ledger (post-cutover self-heal marks 001–005 applied when
`tickets_legacy_v1` exists — see Phase 0).

| File | What it does | Idempotent? |
|------|--------------|-------------|
| `001_init.sql` | Full original DDL (organizers, events, ticket_stages, purchases, tickets) | Yes — `CREATE TABLE IF NOT EXISTS` (but post-cutover its FK names collide → handled by ledger self-heal, not by the file) |
| `002_event_address.sql` | Adds `events.address` | Yes — `information_schema` guard + `PREPARE/EXECUTE` (`DO 0` no-op) |
| `003_sequential_orderid.sql` | `purchases.orderId` CHAR(3) → INT UNSIGNED, global unique from 100 | Yes — column-type + index-existence guards, same PREPARE pattern |
| `004_holders_snapshot.sql` | Adds `purchases.holdersSnapshot JSON NULL` (retired by 005) | Yes — `information_schema` column guard |
| `005_tickets_merge_schema.sql` | Creates `tickets_v2` (merged schema), additive only | Yes — `CREATE TABLE IF NOT EXISTS` (same post-cutover FK caveat as 001) |
| `006_guest_passes.sql` | Creates `guest_passes` | Yes — `CREATE TABLE IF NOT EXISTS` |

Plus `scripts/merge_purchases_into_tickets.js` — the manual, flag-gated
data-copy + cutover script (not auto-run; `--dry-run` default, `--yes`
required for writes; cutover renames, drops nothing). All six SQL files are
historical record — out of scope for deletion per the hard constraints.

### 1.8 Preliminary orphan candidates surfaced during discovery

Recorded here for Phase 2 classification (nothing is a conclusion yet):
`src/pages/Home.jsx` + `Home.module.css`; `src/components/Layout/Layout.jsx` +
`Layout.module.css`; `src/components/Layout/Navbar.jsx` + `Navbar.module.css`
(only importer is the orphaned Layout.jsx); `src/components/Tickets/TicketList.jsx`
+ `TicketList.module.css`; `src/components/Common/DebugPanel.jsx` +
`DebugPanel.module.css`; `src/components/ui/AsyncState.jsx` +
`AsyncState.module.css` (documented as a reuse pattern — REVIEW, not delete);
`src/assets/charlyIllustration.js`; the `localAdmin` simulation block in
`src/api/admin.js`; `api.health()` in `client.js`; backend
`getScanManifest`/`syncScans` (CRITICAL — scan pipeline, REVIEW only); and the
doc-drift items from Phase 0 plus the newly found ones (offline-scan
architecture sections, `api/scan.js` export list, missing `POST /api/admin/scan`
in CLAUDE.md's API table, `serviceWorkerRegistration.js`/`index.css` absent
from the documented source tree, Charly pipeline).

---

## Phase 2 — Proposed changes (read-only; nothing executed)

Legend — **DELETE**: safe-to-remove candidate awaiting approval. **REVIEW**:
needs an explicit user decision (load-bearing risk, documented pattern, or
touches a critical pipeline). Risk: low / medium / critical. Verification
methods used: repo-wide grep including `React.lazy(() => import(...))` strings
and same-directory relative imports; dynamic-`className` scan (no computed
`s[expr]` module access exists in the codebase; all template-literal class
fragments enumerated); dynamic-`t()` scan (all variable keys resolve to
literal sets present in source); `git blame` for TODO age; scripts in the
session scratchpad for CSS and i18n cross-reference.

### Bucket F1 — Frontend: orphan components / pages / assets

| # | Item | Lines | Evidence | Risk | Disposition |
|---|------|-------|----------|------|-------------|
| F1.1 | [src/pages/Home.jsx](src/pages/Home.jsx) + [Home.module.css](src/pages/Home.module.css) | 132 + 213 | Zero imports repo-wide (incl. lazy strings). CLAUDE.md marks it deprecated (merged into AdminPage). Trap #17 satisfied: `/admin/create → /admin` redirect lives in App.jsx:78 and never touches this file; AdminPage's internal `Home` function (AdminPage.jsx:114) is unrelated. No test references it. | low | DELETE |
| F1.2 | [src/components/Layout/Layout.jsx](src/components/Layout/Layout.jsx) + [Layout.module.css](src/components/Layout/Layout.module.css) | 12 + 8 | Zero imports; `<Layout` rendered nowhere. The live chrome is `AdminLayout`. CLAUDE.md itself labels it "Layout (legacy)". | low | DELETE |
| F1.3 | [src/components/Layout/Navbar.jsx](src/components/Layout/Navbar.jsx) + [Navbar.module.css](src/components/Layout/Navbar.module.css) | 106 + 203 | Sole importer is the orphaned Layout.jsx (F1.2) — cascade. Its nav targets even point at the retired `/admin/create` URL (Navbar.jsx:19). OrganizerMenu.jsx:8 has a comment referencing it; update that comment in the same commit. | low | DELETE (with F1.2) |
| F1.4 | [src/components/Tickets/TicketList.jsx](src/components/Tickets/TicketList.jsx) + [TicketList.module.css](src/components/Tickets/TicketList.module.css) | 80 + 105 | Zero imports. TicketsPage renders TicketCard/TicketTable directly. | low | DELETE |
| F1.5 | [src/components/Common/DebugPanel.jsx](src/components/Common/DebugPanel.jsx) + [DebugPanel.module.css](src/components/Common/DebugPanel.module.css) | 173 + 105 | Zero imports (only its own CSS import). CLAUDE.md lists it under Common/ — doc row to drop too. | low | DELETE |
| F1.6 | [src/assets/charlyIllustration.js](src/assets/charlyIllustration.js) | 3 (one huge base64 line) | Zero imports. App.jsx loads `FLYER_IMAGE_BASE64` from `flyerImage.js`; `svgTicketTemplate.js` no longer exports `loadCharlyIllustration` (now `loadFlyerImage`). Biggest single dead-weight file in `src/`. | low | DELETE |
| F1.7 | [public/fonts/D-DINCondensed.otf](public/fonts/) | binary | No `@font-face`, no reference in any CSS/JS/HTML. UI fonts are Google-hosted Barlow + DM Serif (index.html:25). A copy already exists in `archive/mockups/`. | low | DELETE |
| F1.8 | [src/components/ui/AsyncState.jsx](src/components/ui/AsyncState.jsx) + [AsyncState.module.css](src/components/ui/AsyncState.module.css) | 90 + 43 | Zero imports — but CLAUDE.md's "Patterns to reuse" table and the 2.0 plan (§Phase 5) both prescribe it as *the* loading/error primitive. Deleting it removes a documented pattern; keeping it means docs stay true. | medium | REVIEW — keep (and leave docs) or delete (and amend both docs) |

Not flagged (verified live): `flyer.png`, `flyerImage.js`, `pay-qr.png`
(← `sampleEvent.js` `bankQrImageUrl`), `ticket-icon.svg`, `manifest.json`,
`sw.js`, `_redirects` (hosting config, out of scope),
`serviceWorkerRegistration.js` (← main.jsx), all three hooks, all four
contexts, every other component.

### Bucket F2 — Frontend: dead code inside live files

| # | Item | Lines | Evidence | Risk | Disposition |
|---|------|-------|----------|------|-------------|
| F2.1 | `localAdmin` simulation in [src/api/admin.js](src/api/admin.js) | 17, 43–71, 101–159 + header ¶ | The exported `admin` facade calls only `adminApi`; `localAdmin`, `randomHash`, `readAll`, `writeAll`, `localOrderId`, `LS_PURCHASES` have zero external references (verified: `purchases.js` dropped its sim already). Simulates confirm/reject/walk-in → payment-adjacent, so routed to REVIEW per the classification rules even though the evidence is airtight. | critical (pipeline-adjacent), removal itself low | REVIEW |
| F2.2 | `api.health()` in [src/api/client.js:99-101](src/api/client.js#L99-L101) | 3 | No caller. It's the documented Phase-0 connectivity probe and costs nothing; useful for console diagnostics. | low | REVIEW — recommend keep |
| F2.3 | `loadTicketFonts` in [src/utils/svgTicketTemplate.js:29](src/utils/svgTicketTemplate.js#L29) | ~40 | Exported, zero callers anywhere (only its own doc reference). Font embedding for ticket PNGs was never wired. | low | DELETE |
| F2.4 | Non-gated `console.log`s: [usePageVisibility.js:31,92](src/hooks/usePageVisibility.js#L31), [serviceWorkerRegistration.js](src/utils/serviceWorkerRegistration.js) (8×) | — | App.jsx:58 is `import.meta.env.DEV`-gated (fine). The other 10 are SW-lifecycle / iOS-recovery breadcrumbs — operational logging, not debug leftovers; none touch payments/scans. | low | REVIEW — recommend keep (or DEV-gate) |

No `debugger` statements. One TODO repo-wide
([server/index.js:41](server/index.js#L41), CORS production origin) — blamed
to 2026-06-16, 24 days old, **under the 90-day threshold**: not flagged.

### Bucket F3 — Frontend: routes

No dead routes. Every route in App.jsx is linked from OrganizerMenu, AdminPage,
LandingPage, or is a legacy redirect protected by trap #18. Observation (no
change proposed): `/edit-event`, `/validate-qr`, and the `*` catch-all sit
inside `RequireAuth`, so logged-out visitors land on `/admin` instead of the
redirect target — pre-existing behavior, preserved.

### Bucket F4 — CSS (dynamic-construction scan completed)

All flagged names were checked against every template-literal `className`
(the only dynamic families are `pill wait|sent|ok|no|dead`, `tile
yellow|orange`, `opt on`, `dot` — none overlap). Global `btn sm` (AdminPage,
FlowShell, PurchaseFlow) resolves to **astromelias** `.btn.sm`, *not* the
CSS-module `.sm` — the module class is genuinely dead.

| # | Item | Evidence | Risk | Disposition |
|---|------|----------|------|-------------|
| F4.1 | [CreateEvent.module.css](src/components/Event/CreateEvent.module.css): 16 classes (`typesList`, `typeRow`, `typeNameInput`, `typePriceCurrency`, `typePriceInput`, `typePriceWrapper`, `newTypeRow`, `newTypeNameInput`, `newTypePriceCurrency`, `newTypePriceInput`, `iconBtn`, `iconBtnAdd`, `iconBtnDelete`, `tableHeader`, `tableHeaderCell`, `tableHeaderCellRight`) | Relics of the retired per-type ticket editor (replaced by the stage editor). No `s.<name>` access in CreateEvent.jsx. | low | DELETE |
| F4.2 | [Button.module.css](src/components/Common/Button.module.css): `.sm` | No `btn.sm` module access anywhere (usage comment at its own line 6 mentions `s.lg`). | low | DELETE |
| F4.3 | [TicketForm.module.css](src/components/Tickets/TicketForm.module.css): `.pasteBtn`, `.pasteBtn:hover` | No `s.pasteBtn` access in TicketForm.jsx (paste UI now uses FieldLabel/inline icons). | low | DELETE |
| F4.4 | [utilities.css](src/styles/utilities.css): 20 classes (`badge-primary`, `card-header`, `card-outer`, `card-section`, `color-error`, `color-success`, `color-warning`, `empty-state`, `empty-state-emoji`, `flex-between`, `flex-center`, `flex-col`, `icon-box-icon-lg`, `progress-fill`, `progress-track`, `shadow-soft`, `text-caption`, `text-display`, `text-label`, `text-title`) | Zero references in any code or CSS file. | low | DELETE |
| F4.5 | [global.css](src/styles/global.css): `animate-fadeIn`, `animate-slideFromLeft`, `animate-slideFromRight` | Zero references (their `@keyframes` stay if other rules use them — verify at execution; remove together only if orphaned too). | low | DELETE |
| F4.6 | [astromelias.css](src/styles/astromelias.css): 10 classes (`act`, `badge`, `info-ic`, `ph-img`, `sb-ic`, `stat-grid`, `statusbar`, `tname`, `tnum`, `tprice`) | Zero references in `src/`; they match markup that exists only in `prototype-2.0/` / `docs/design2.0/` — design-system classes that never got wired, possibly staged for future screens. | medium | REVIEW |
| F4.7 | [tokens.css](src/styles/tokens.css): 33 custom properties (see Phase 1 §1.4 list) + [astromelias.css](src/styles/astromelias.css): 4 (`--green-deep`, `--pink`, `--r-sm`, `--yellow-soft`) | No `var(--name)` usage across all 36 CSS files (astromelias.css included, per rule) nor in any JS inline style. | low | DELETE |
| F4.8 | Cascade note | Deleting F1.1–F1.5 orphans frees more: e.g. `shadow-floating`, `hover-scale` are currently "used" only by Home.jsx. The CSS scan must re-run after Bucket F1 executes, as a follow-up commit. | — | note |

### Bucket F5 — Translations (dynamic-key scan completed)

Dynamic `t()` keys form a closed set (`filterAll/filterWaiting/filterConfirmed/
filterRejected`, `colName/colId/colPhone/colType/colStatus`,
`statusCheckedIn/statusPending`) — all present as literals, none flagged.

| # | Item | Evidence | Risk | Disposition |
|---|------|----------|------|-------------|
| F5.1 | 115 unused keys in [src/utils/translations.js](src/utils/translations.js) (×2, ES+EN blocks) | Never referenced as a quoted string anywhere in `src/`. Cohorts map to removed features: `/validate-qr` scanner UI (`scanQR`, `pointCamera`, `validTicket`, `invalidTicket`, `scannerError`, …), offline sync (`synchronize`, `pendingSyncMsg`, `ticketsCached`, `syncOnReconnect`, …), check-in window flow (`checkInEarlyWarning`, `checkInLateWarning`, …), per-type ticket editor (`addNewTicketType`, `ticketTypeExists`, …), plus stray generics (`save`, `close`, `edit`, `create`, `update`, `search`, `required`, `yes`, `welcome`). Full machine-generated list preserved in the session scratchpad; will be enumerated in the execution commit body. | low | DELETE |
| F5.2 | 8 keys used **only** by Bucket-F1 orphans (`dateAndTime`, `location`, `madeIn`, `navTickets`, `noAddress`, `purchasesPanel`, `revenue`, `sell`) | Become unused the moment F1 executes — same commit or the cascade follow-up. | low | DELETE (after F1) |

### Bucket B — Backend

| # | Item | Evidence | Risk | Disposition |
|---|------|----------|------|-------------|
| B.1 | `GET /api/admin/scan/manifest` + `POST /api/admin/scan/sync` — [scan.routes.js:15,17](server/routes/scan.routes.js#L15), `getScanManifest` (scan.controllers.js:36), `syncScans` (scan.controllers.js:173) | Zero frontend callers since the online-only refactor (`92617c6`); `src/api/scan.js` only calls `POST /api/admin/scan`. But this is the **scan pipeline** (classification rule → CRITICAL) and the endpoints would serve any future offline mode or second door device; the deployed copy lives in the BlackCoffe repo. | critical | REVIEW — recommend keep server-side, fix docs instead |
| B.2 | `toUtcParam()` — [server/utils/time.js:43](server/utils/time.js#L43) | Exported, zero callers repo-wide (its only mention is its own docblock). | low | DELETE |
| B.3 | [server/seed/seedFromLocalStorage.js](server/seed/seedFromLocalStorage.js) | One-time legacy 1.0 import, already executed in history; no package.json script points at it (only CLAUDE.md's command list). Still harmless and guarded by `db.js`. | medium | REVIEW — delete only with explicit confirmation; else keep + doc note |
| B.4 | [server/integration.js](server/integration.js) | Not imported by `server/index.js` — by design: it's the source copy of the BlackCoffe mount seam (`mountSigale`/`startSigale`, merge plan §4) that was copied to `C:\dev\BlackCoffe\server\sigale\`. Deleting it here would desync the deployment seam. | medium | REVIEW — recommend keep |
| B.5 | Routers / middleware / package.json scripts / seeds (other) | All routers mounted; `requireOrganizer` + `loginLimiter` both chained; all root & server scripts valid; `seedOrganizer`/`seedSampleEvent` wired to `seed:*` scripts. No duplicated validators found server-side (`cleanStr`, `validateEventPayload` are single-domain). | — | no findings |

### Bucket S — Shared: dependencies, env, duplication, docs

| # | Item | Evidence | Risk | Disposition |
|---|------|----------|------|-------------|
| S.1 | Dependencies (root + server) | **None unused.** Font Awesome ×3 (imported by 20+ components), `qrcode.react` (TicketCard, QRDisplay), `html5-qrcode` (OfflineScanner); every server dep imported; every devDep wired to a config or script. Static check + dynamic `require`/`import()` grep: no dynamic loads exist. | — | no findings |
| S.2 | `.env.example` keys | All 13 keys read via `process.env.*` in server code. No stale keys. | — | no findings |
| S.3 | `authHeader()` triplicated — [admin.js:38](src/api/admin.js#L38), [guestPasses.js:13](src/api/guestPasses.js#L13), [scan.js:29](src/api/scan.js#L29) | Identical 4-line helper in three files. Merge proposal (export once from `admin.js`, import elsewhere) — a refactor, so flagged only per "propose merges, don't execute". | low | REVIEW (merge proposal) |
| S.4 | `archive/` + `prototype-2.0/` + `docs/design2.0/` prototypes | Tracked design history (mockups, old docs, the 2.0 HTML/JSX prototypes). Not dead code — deliberate archive. Only the user can decide whether history stays in the repo. | medium | REVIEW — recommend keep |
| S.5 | CORS production origin still commented — [server/index.js:41](server/index.js#L41) | This repo's `index.js` isn't the deployed host (BlackCoffe's is), so it only affects local runs. Informational. | low | note only |

### Bucket D — Docs (flag only; per hard constraints nothing under `docs/` is deleted, and CLAUDE.md edits are content updates, not removals)

| # | Document | Stale claims (evidence) | Risk of leaving stale |
|---|----------|-------------------------|----------------------|
| D.1 | `CLAUDE.md` | (a) "code-complete but **not yet cut over**" — cutover ran (Phase 0); (b) `/scan` described as offline-first with IndexedDB cache — the offline layer was deleted; (c) `api/scan.js` said to export `getManifest, syncScans` — actual exports `scanAndAdmit`/`SCAN_RESULT`; (d) API table missing `POST /api/admin/scan`, `DELETE /api/admin/purchases`, `DELETE /api/admin/tickets/:id`; (e) source tree lists `useOfflineScan.js`, `scanDb.js` (deleted) and `charlyIllustration.js`, omits `serviceWorkerRegistration.js`, `flyerImage.js`, `index.css`, `server/integration.js`, `scripts/`; (f) "Patterns to reuse" row `useOfflineScan() + scanDb.js`; (g) commands list `seedFromLocalStorage.js` (see B.3). | **critical** — this file steers every agent session |
| D.2 | `docs/architecture/TICKETS_SCHEMA.md` | "Status" section says cutover "has not been run yet". | medium |
| D.3 | `docs/architecture/PROJECT_OVERVIEW.md` | Offline-scan architecture section (manifest/IndexedDB/sync); tech-stack rows `jspdf` (not in package.json) and "Offline scan IndexedDB"; hook table `useOfflineScan`; util table `scanDb.js`; workflows "Door scan … taps Download" and "Backup / handoff `/copy-event`" (route removed); `holdersSnapshot` narrative already banner-flagged as historical. | medium |
| D.4 | `docs/SIGALE_MERGE_INTO_SHARED_SERVER.md` | §6 env table **omits `SCAN_HASH_SECRET`** (the one env var whose absence silently weakens door security); §2/§5/§7 say migrations "001–004" (now 001–006 + ledger); no mention of the `schema_migrations` self-heal that production now depends on. | **critical** (the SCAN_HASH_SECRET omission) |
| D.5 | `docs/SIGALE_2.0_IMPLEMENTATION_PLAN.md` | §1 built-list: `PurchaseStatusPage` (removed), "7-step wizard" (6 steps); §2: `/compra/:orderId` status page listed as pending (deliberately dropped); §4: rate-limit `/api/recover` (endpoint never shipped/removed); §5: "1 000-folio ceiling" superseded by migration 003. Header already declares parts historical. | low–medium |
| D.6 | `README.md` | Front section still sells the 1.0 offline-only model ("100 % offline", "export the whole event as JSON", JSON import, `jspdf` in tech stack) with only a banner qualifying it; contradicts the no-JSON-export rule in CLAUDE.md. | medium |
| D.7 | `server/README.md` | Status "Phase 5"; route list omits guest-passes; guardrail table list predates the merge (`purchases`, `tickets` split). | low |
| D.8 | `docs/LOCAL_TESTING.md` | End-to-end walkthrough includes the manifest-download door-scan step (now online-only). | low |

### Suggested execution order (Phase 3, one bucket per commit)

1. `chore(frontend): remove orphan components and assets` — F1.1–F1.7 (F1.8 excluded pending decision).
2. `chore(frontend): remove dead loadTicketFonts helper` — F2.3.
3. `chore(frontend): drop unused CSS-module classes` — F4.1–F4.3.
4. `chore(frontend): drop unused utility classes and tokens` — F4.4, F4.5, F4.7 (F4.6 excluded pending decision).
5. `chore(frontend): prune unused translation keys` — F5.1, F5.2.
6. `chore(frontend): re-run CSS/i18n cascade scan and prune` — F4.8 follow-up.
7. `chore(backend): drop dead toUtcParam helper` — B.2.
8. `docs: …` — one commit per document among D.1–D.8 the user approves.
9. Items requiring explicit decisions before any commit: F1.8, F2.1, F2.2, F2.4, F4.6, B.1, B.3, B.4, S.3, S.4.

Every commit: `npm run lint` + `npm test` (baseline 81/81) + `npm run build`;
backend commits additionally `node --check` on every touched file and
`node --check server/index.js`. No server started; no DB touched.

---

*Phase 3 (Execution) begins only on per-bucket approval ("proceed with <bucket>").*
