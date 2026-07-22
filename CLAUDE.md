# Sígale — Claude Agent Guide

Mobile-first React 19 + Vite ticket-management PWA with an Express + MySQL backend. Styled with **plain CSS only** (design tokens + CSS Modules, no Tailwind). Bilingual ES/EN. The Astromelias visual identity ships in `src/styles/astromelias.css`. Public buyers purchase tickets online; organizers confirm payments, mint tickets, deliver them out-of-band (WhatsApp / email), and scan QR codes at the door.

**Buyer flow at a glance (purchases never auto-deliver):** the public 6-step wizard at `/compra` ends on a terminal success screen — *"Tan pronto nuestro equipo valide tu pago te enviaremos la boleta a `<deliveryContact>` por `<WhatsApp|correo>`"*. There is no `/compra/:orderId` status page and no `/api/recover`; ticket delivery is the organizer's responsibility from `/tickets`.

For depth, read `docs/architecture/PROJECT_OVERVIEW.md`. This file is the agent quick-reference.

---

## Critical rules (do/don't)

- **No Tailwind / no CSS framework**: style only with plain CSS — design tokens from `src/styles/tokens.css`, then `global.css`, `utilities.css`, `astromelias.css`, and co-located `*.module.css`. No `@apply`, no utility-class framework. PostCSS runs autoprefixer only (`postcss.config.js`).
- **Mobile-first**: write base styles for mobile, layer tablet/desktop rules with `min-width` media queries. Touch targets ≥ 44×44px. Base font 16px (prevents iOS zoom).
- **Dates**: always use `parseLocalDate()` / `toLocalDateString()` from `src/utils/timeFormat.js`. Never `new Date('YYYY-MM-DD')` (UTC bug at the day boundary). Times are America/Bogota, formatted AM/PM.
- **No native `alert` / `confirm` / `prompt`**: use `useDialog()` from `src/context/DialogContext.jsx` → `confirm()`, `notify()`, `openCustom()`.
- **Currency**: use `formatCurrency()` from `timeFormat.js`. Don't roll inline `${n.toLocaleString()}`.
- **Code style**: components PascalCase, hooks `useCamelCase`, all code/comments in English, Spanish UI copy.
- **Verify with lint + build only, not `npm test`**: after making changes, run `npm run lint` and `npm run build` and confirm both are clean — don't run `npm test` / vitest yourself. `npm test` covers TicketContext, hashGenerator, qrGenerator, storage, timeFormat, csvUtils, so avoid breaking their public API, but the user runs the actual test pass themselves. At the end of each piece of work, tell the user what to click through or run to test it manually (e.g. which page/flow to exercise, or `npm test` if the change touches tested utils).
- **Do not touch `server/current-server/`**: read-only reference copy of BlackCoffe's production server. Sígale's backend lives in `server/` and connects only to the `sigale` database. Full guardrail in `docs/SIGALE_2.0_IMPLEMENTATION_PLAN.md §3.1`.
- **DB isolation**: Sígale migrations may only `CREATE`/`ALTER` Sígale's own tables (`organizers`, `events`, `ticket_stages`, `tickets`, `guest_passes`). Confirm `DB_NAME=sigale` before any DB command.
- **Sales are server-side, never localStorage-only**: every ticket that must appear at `/admin`, `/tickets`, `/dashboard`, or the door scanner has to exist as a row in the `tickets` table. Walk-in sales (`/sell-tickets` → `TicketForm`) **must** go through `admin.walkIn()` → `POST /api/admin/sales` so they mint `confirmed` row(s) under a sequential `orderId`. Walk-ins draw **only from the currently `active` stage** — `createWalkInSale` locks the stage `WHERE status = 'active'` (mirroring the public `createPurchase`) and returns 409 otherwise, and the `/sell-tickets` dropdown lists only active stages — so the door can never keep selling a superseded/`closed` etapa. Do **not** use the localStorage-only `addTicket()` for real sales — `/tickets` and `/dashboard` overwrite local state with `refreshFromServer()` on mount, so anything not persisted server-side silently disappears.
- **Dashboard stats need the live event**: `EventContext` keeps the active event in memory only (never localStorage, per 2.0), so `TicketContext.data.event` is `null`. Always call `getStats(event)` with the event from `useEvent()` — bare `getStats()` resolves every price to `0` and the dashboard reads empty.
- **Stage `sold_out` must be toggled on every inventory path**: after any increment to `soldQuantity`/`reservedQuantity` check if the stage is now full and flip to `sold_out`; after any decrement check if spots opened up and flip back to `active`. See the "Stage status & inventory invariants" section below for the exact SQL pattern and which code paths carry each check. `sold_out` means "temporarily full, may reopen" — several handlers auto-restore it to `active` once capacity frees up. A stage that must **never** reopen (orphaned by an event edit, or superseded by the next stage) gets `closed` instead — nothing ever restores from `closed`. Don't use `sold_out` as a stand-in for "permanently done." In particular, when a stage fills and the sold-out cascade in `createPurchase`/`createWalkInSale` promotes the next `upcoming` stage to `active`, the just-filled stage is set to `closed` (not left `sold_out`) so a later reservation-release can't reopen it — the fix for the 2026-07-21 Etapa 1 incident (see "Production environment").
- **At most one stage per event may be `active` — enforced by the DB, not just app logic**: `uqOneActiveStagePerEvent` (migration `007_single_active_stage.sql`) is a unique index on `ticket_stages(eventId, activeFlag)`, where `activeFlag` is a generated column that's `1` only when `status = 'active'`. Any code path that promotes a stage to `active` (an event edit inserting/reordering stages, `activateDueStages`, or the sold-out cascade in `createPurchase`/`createWalkInSale` promoting the next stage) **must first demote whatever else is currently `active` for that event to `closed`**, or the write throws `ER_DUP_ENTRY`. This exists because two stages of the same name both reached `active` in production once already — see the incident note under "Production environment" below before touching stage-status code.
- **`GREATEST(INT UNSIGNED − n, 0)` is NOT safe**: when `n > col`, MySQL evaluates the subtraction as unsigned first, wrapping to ~4 294 967 295. That value violates `chkStageCapacity`. Only decrement `soldQuantity`/`reservedQuantity` for ticket rows whose status proves they still hold inventory — `rejected` and `expired` have already been decremented by their own handlers.
- **`resolveActiveStage(event)` returns `null` when no `active` stage**: it no longer falls back to `stages[0]`. Always guard on `!stage` before reading `stage.id`. LandingPage gates its "Comprar boleta" button and PurchaseFlow blocks the wizard on a null result.
- **No JSON export/import or event-cloning tools**: these are obsolete now that event/ticket data lives in the cloud `sigale` MySQL DB — there is nothing to manually back up or transfer between devices anymore. The `/copy-event` page (JSON copy/download, ticket CSV export, PDF attendance sheet) and the "Pegar Datos del Evento" paste-to-clone button in `CreateEvent` were removed for this reason; don't reintroduce JSON/clipboard-based event transfer as a workaround for anything — fetch from the API instead.
- **`purchases` and `tickets` are merged into one `tickets` table**: there is no more separate order-level `purchases` table. One row per seat/holder, created at *reservation* time (not confirm time), whose `status` transitions in place (`pending_payment → payment_submitted → confirmed | rejected | expired`) across every row sharing one `orderId`. Full column-by-column reference: `docs/architecture/TICKETS_SCHEMA.md`. Quantity/total for an order are no longer stored — compute `COUNT(*)`/`SUM(unitPrice)` `GROUP BY orderId`. `holdersSnapshot` is gone; holder identity lives directly on each row from creation onward. `validationHash` is still minted **only at confirm** (nullable column) — this is a security invariant the door scanner (`scan.controllers.js`) relies on, don't mint it earlier. It is now a **deterministic HMAC over `(orderId, seatIndex)` keyed by `SCAN_HASH_SECRET`** (16 hex chars), not a random secret — unique per seat and stable across holder edits, but unguessable without the env secret. **Status as of this writing: code-complete but not yet cut over in production** — the new schema exists as `tickets_v2` (additive, see `server/migrations/005_tickets_merge_schema.sql`); the controllers already query it under the final name `tickets`, so the data migration + `RENAME TABLE` cutover (copy existing rows from the old `purchases`/`tickets` into `tickets_v2`, verify, then rename) must ship in the same release as this code and is a separate, manually-supervised step requiring explicit go-ahead before touching production.
- **Guest passes (`guest_passes`) are a deliberately separate table from `tickets`**: artist/crew/courtesy free-entry entries (`server/migrations/006_guest_passes.sql`) never touch `tickets`, `ticket_stages`, or the payment pipeline — no price, no `validationHash`, no QR, no scan-manifest integration. Every row has an `eventId` and a `band` (sourced from `events.artists`, the event's own lineup) so organizers can see how many free passes each band has used. Managed at `/guest-passes` (`GuestPassesPage.jsx`, reachable from the "+ Agregar un artista" card on `/admin` and from `OrganizerMenu`) via `src/api/guestPasses.js` → `GET/POST/PATCH/DELETE /api/admin/guest-passes`. Don't fold these into `/tickets`, `/dashboard`, or the door-scanner manifest — they're a manual name+ID roster for door staff, not a scannable ticket.

---

## Production environment

Sígale already runs in production — merged into the shared BlackCoffe backend at `coffeserver.onrender.com` (see `docs/SIGALE_MERGE_INTO_SHARED_SERVER.md`). **Don't spin up a local Express/MySQL instance to "test" something that's already live.** The frontend dev server (`npm run dev`) is usually already running locally at `http://localhost:5173/` and proxies API calls straight to production per `.env.development.local` / `vite.config.js` — there is normally no local backend process to start for routine work.

- **Production DB is queryable directly, but it's a *shared* MySQL instance.** Sígale's tables live in their own `sigale` schema on the same DigitalOcean cluster BlackCoffe uses. Credentials in `.env.local` (git-ignored, repo root) connect to BlackCoffe's `defaultdb` by default — any ad-hoc inspection script must explicitly pass `database: 'sigale'` to the client, never rely on that file's own `DB_NAME` value. Never query or touch BlackCoffe's own tables (`orders`, `deposits`, `clients`, `products`, `users`).
- **Treat production data mutations as irreversible.** Read-only inspection first — dump the rows, check `tickets` references before deleting or altering anything — then confirm the exact change with the user before writing.
- **Incident (2026-07-20, resolved): two `ticket_stages` rows both `active` for the same event.** Root cause was `updateEvent`'s stage-reconciliation (`server/controllers/events.controllers.js`): editing the event submitted a stage list that dropped an existing "Etapa 1" row which still had tickets referencing it. The code correctly refused to delete it (tickets exist) but left its `status` untouched, so it stayed `active` forever while a same-named replacement got inserted as `active` too. `buildEventPayload()` / `resolveActiveStage()` only ever surface the first `active` match by `sortOrder`, so the landing page (buyer-facing "cupos disponibles", reading the new stage) and the dashboard (`/api/admin/tickets`, organizer-facing "sold", reading the old stage) silently diverged — no error anywhere, just two different numbers for "Etapa 1". `activateDueStages` (`server/jobs/scheduler.js`) had the identical class of bug: it promoted a due `upcoming` stage to `active` without checking whether another stage on the event was already `active`.
  **Fix, in three parts:** (1) `updateEvent` now demotes an orphaned-but-referenced stage — and any stage a freshly-inserted one is about to supersede — to a new `closed` status. (2) `activateDueStages` now demotes the stage it supersedes to `closed` before promoting the next one. (3) `migrations/007_single_active_stage.sql` adds a DB-level unique constraint (`uqOneActiveStagePerEvent`) so a second simultaneously-`active` stage for one event is now physically impossible — `ER_DUP_ENTRY` at write time, not a silent data-integrity drift. **`closed` is a different status from `sold_out` on purpose**: several paths (`rejectPurchase`, `sweepExpiredHolds`, `deleteAdminTicket`, `updateEvent`) auto-flip `sold_out` back to `active` once `soldQuantity + reservedQuantity < totalQuantity` — reusing `sold_out` for a superseded/orphaned stage would let it silently resurrect and recreate this exact bug. See "Stage status & inventory invariants" below.
- **Incident (2026-07-21, resolved): a superseded "Etapa 1" left `sold_out` beside an `active` "Etapa 2".** Etapa 1 (19 sold + 1 reserved of 20) sat `sold_out` while Etapa 2 was `active`. Because `sold_out` is auto-restorable, releasing that last held seat (reject / expire / delete) would have fired the restore check on Etapa 1 and tried to reactivate it — a collision with Etapa 2 under `uqOneActiveStagePerEvent` (`ER_DUP_ENTRY`), i.e. the organizer couldn't even reject that order. Two gaps enabled it: (1) the sold-out **cascade** in `createPurchase`/`createWalkInSale` promoted a successor stage but left the filled one `sold_out` instead of `closed`; (2) `createWalkInSale` had no `status = 'active'` guard (unlike `createPurchase`), and the `/sell-tickets` dropdown (`deriveTicketTypes`) listed every stage, so a walk-in could sell a superseded etapa directly. **Fix:** the cascade now closes the predecessor when it promotes a successor; `createWalkInSale` locks `WHERE status = 'active'` (409 otherwise); the sell dropdown filters to active stages; and the stuck Etapa 1 row was corrected to `closed` in production (one-off `UPDATE`).

---

## Source tree

```
src/
├── App.jsx                        # Routes + provider tree; two groups: public (Astromelias) + organizer (Layout)
├── assets/
│   ├── flyerImage.js              # Base64 flyer embedded at build time
│   └── flyer.png
├── api/                           # Thin fetch wrappers — one file per domain
│   ├── client.js                  # Base fetch (GET/POST/PUT/PATCH/DEL); reads VITE_API_URL
│   ├── events.js
│   ├── purchases.js               # createPurchase, submitPayment (no get/recover — flow is one-way)
│   ├── admin.js                   # login, listPurchases, confirm/reject, walkIn,
│   │                              # listTickets, updateTicket
│   ├── guestPasses.js             # list, create, bulkCreate, update, remove (artist/crew/courtesy)
│   └── scan.js                    # getManifest, syncScans
├── components/
│   ├── Common/                    # SlideToConfirm, Button.module.css, StorageErrorBanner
│   ├── Dashboard/                 # SalesDashboard, CheckInDashboard, Dashboard.shared.module.css
│   ├── Event/                     # CreateEvent (create + edit; mode prop)
│   ├── ErrorBoundary/
│   ├── GuestPasses/                # GuestPassTable, GuestPassTableRow — editable roster
│   │                              # for artist/crew/courtesy free-entry passes
│   ├── Layout/                    # AdminLayout (organizer dark chrome + OrganizerMenu),
│   │                              # OrganizerMenu (slide-out nav)
│   ├── Scanner/                   # OfflineScanner (html5-qrcode) — the single door scanner
│   ├── Tickets/                   # TicketForm, TicketCard, QRDisplay,
│   │                              # TicketTable, TicketTableRow, TicketsViewToggle,
│   │                              # TicketEditConfirm, CSVPanel
│   ├── flow/                      # FlowShell, PurchaseFlow — 6-step public purchase wizard
│   │                              # (back is locked from step 4 onward; step 6 is terminal)
│   └── ui/                        # StatCell, EmptyStateCard, FieldLabel, Modal, Toast,
│                                  # AsyncState, Ic, Money, Screen, StarField, Wordmark
├── context/
│   ├── EventContext.jsx           # Event CRUD (reads/writes server via api/events.js)
│   ├── TicketContext.jsx          # Organizer ticket list; refreshFromServer() hydrates from
│   │                              # /api/admin/tickets, getStats(), addTicketsFromCSV()
│   ├── LanguageContext.jsx        # i18n: t(), language, toggleLanguage
│   └── DialogContext.jsx          # confirm/notify/openCustom + Modal/Toast renderer
├── hooks/
│   ├── useLocalStorage.js         # Whole-blob persisted state (cross-tab sync, write errors)
│   ├── useLocalStorageValue.js    # Single-key persisted state with try/catch
│   ├── useOfflineScan.js          # IndexedDB cache + sync queue for door scanning
│   └── usePageVisibility.js       # iOS tab-suspension recovery
├── pages/
│   ├── LandingPage.jsx            # Public event landing — Astromelias (/ and /evento/:id)
│   ├── PurchaseFlowPage.jsx       # 6-step wizard (/compra) ending on terminal success screen
│   ├── AdminPage.jsx              # Organizer panel — purchases queue, confirm/reject (/admin);
│   │                              # "+ Registrar Venta" now navigates to /sell-tickets
│   ├── ScanPage.jsx               # Door scan, offline-first (/scan)
│   ├── Home.jsx                   # (deprecated) — merged into AdminPage at /admin
│   ├── CreateEventPage.jsx, EditEventPage.jsx, SellTicketsPage.jsx
│   ├── TicketsPage.jsx, DashboardPage.jsx
│   │                              # /tickets + /dashboard hydrate from /api/admin/tickets
│   │                              # on mount via TicketContext.refreshFromServer()
│   ├── GuestPassesPage.jsx        # Artist/crew/courtesy roster (/guest-passes) — editable
│   │                              # table + paste-to-bulk-add, scoped to the active event
├── styles/
│   ├── tokens.css                 # Raw palette + semantic token assignments (import first)
│   ├── global.css
│   ├── utilities.css
│   └── astromelias.css            # Component classes: .btn, .card, .pill, .stat, .field, .trow, .t3
└── utils/
    ├── hashGenerator.js           # generateTicketId (walk-in only; server mints hashes at confirm)
    ├── qrGenerator.js             # QR encodes the bare validationHash string; parseQRData also
    │                              # tolerates the legacy JSON payload. Hash arrives from API after confirm
    ├── qrCopy.js                  # copySVGToClipboard, copyPNGToClipboard, shareQR
    ├── svgTicketTemplate.js       # PNG ticket template with the event flyer
    ├── timeFormat.js              # formatTo12Hour, parseLocalDate, toLocalDateString,
    │                              # checkInWindowStatus, formatCurrency
    ├── csvUtils.js                # ticketsToCSV (round-trip) + ticketsToHumanCSV (price)
    ├── ticketPasteParser.js       # parseSingleNameAndId, parseTicketRows (TSV-aware)
    ├── scanDb.js                  # IndexedDB helpers for offline scan cache
    ├── storage.js                 # localStorage primitives + version migration
    ├── translations.js            # ES/EN dictionary
    ├── sampleEvent.js             # Dev/seed sample event data
    └── base64Cleaner.js           # cleanBase64 (used by svgTicketTemplate)

server/
├── index.js                       # Express: helmet + CORS + routes + error handler + runMigrations() → listen
├── config.js                      # PORT
├── db.js                          # mysql2/promise pool → sigale DB, dateStrings:true, SSL CA cert
├── migrations/001_init.sql        # DDL: organizers, events, ticket_stages, purchases, tickets (original two-table split)
├── migrations/002_event_address.sql # adds events.address (idempotent guard via information_schema)
├── migrations/003_sequential_orderid.sql # orderId CHAR(3) → INT UNSIGNED, globally unique, starts at 100
├── migrations/004_holders_snapshot.sql   # adds purchases.holdersSnapshot JSON NULL (retired by 005)
├── migrations/005_tickets_merge_schema.sql # creates tickets_v2 — the merged purchases+tickets schema (see docs/architecture/TICKETS_SCHEMA.md). Additive only; cutover (rename to `tickets`) is a separate manual step.
├── migrations/006_guest_passes.sql # creates guest_passes (artist/crew/courtesy free-entry roster) — separate from tickets, no cutover needed, brand-new table.
├── migrations/007_single_active_stage.sql # adds `closed` terminal stage status + uqOneActiveStagePerEvent unique constraint (ticket_stages.activeFlag generated column) — DB-enforced guarantee that at most one stage per event is ever `active`.
├── migrations/runMigrations.js
├── controllers/                   # events, purchases, admin, guestPasses, scan
├── routes/                        # health, events, purchases, admin, guestPasses, scan
├── middleware/requireOrganizer.js # Re-validates credentials on every /api/admin/* request
├── jobs/scheduler.js              # node-cron: auto-activate stages + sweep expired holds (24h)
├── seed/                          # seedOrganizer, seedSampleEvent, seedFromLocalStorage
├── utils/emailNotifier.js         # sendErrorEmail (mirrors BlackCoffe pattern)
├── utils/time.js                  # UTC ↔ Bogotá helpers
└── current-server/                # READ-ONLY BlackCoffe reference — never run or import
```

---

## Routes

### Public (Astromelias, no organizer nav)

| Path | Page |
|------|------|
| `/` | LandingPage |
| `/evento/:id` | LandingPage (specific event) |
| `/compra` | PurchaseFlowPage — 6-step wizard. Steps 1–3 are reversible; from step 4 ("Ir a pagar") onward the back chevron is hidden and step 6 is a terminal success screen with one CTA: "Volver al inicio". |
| `/admin` | AdminPage — login → purchase queue (confirm/reject). "+ Registrar Venta" links to `/sell-tickets` (the inline walk-in stepper is gone). Slide-out `OrganizerMenu` links to every tool below. If no active event, redirects to `/create-event`. |
| `/scan` | ScanPage (door scan, offline-first) — the **single** QR-validation surface. There is no longer a separate `/validate-qr` page (it and its `QRScanner`/`ValidationResult` components were removed; `/validate-qr` now redirects here). Validation runs against the **server** manifest (`src/api/scan.js` calls the real `/api/admin/scan/*` endpoints — the old localStorage simulation is gone), cached in IndexedDB for offline use. **Public route** (no `RequireAuth`) so the door device doesn't need to sit behind the auth funnel, but the `/api/admin/scan/*` calls still require organizer credentials, so the device must have logged in once (via `/admin`) for `getAuth()` to hold Basic creds. It renders the shared `OrganizerMenu` in its topbar so it is **not** a navigation dead-end. |

There is no public status page. Buyers see their orden number on the success screen and rely on the organizer reaching out by WhatsApp/email once the payment is confirmed.

### Organizer (wrapped in `AdminLayout`; **all gated by `RequireAuth`**)

Every organizer route below requires the admin login (`isLoggedIn()`); unauthenticated visits redirect to `/admin`. The gate is a UX funnel only — the server still re-validates organizer credentials per request.

| Path | Page |
|------|------|
| `/admin/create` | (legacy) — redirects to `/admin` |
| `/create-event` | CreateEvent component (create mode) — the single API-backed event form |
| `/edit` | CreateEvent component (edit mode); `/edit-event` redirects here |
| `/sell-tickets` | SellTicketsPage (walk-in entry). Phone field is **optional**; name and ID don't pop the "not valid" inline error until the user types ≥ 4 characters. **Persists server-side**: submitting `POST`s to `/api/admin/sales`, which mints `confirmed` row(s) under a sequential `orderId` directly (no reservation phase) — so the sale shows up at `/admin` and `/tickets` immediately. The success screen shows the order number and the ticket QR (built from the `validationHash` the API now returns). It does **not** write localStorage-only tickets. |
| `/guest-passes` | GuestPassesPage — artist/crew/courtesy free-entry roster, scoped to the active event. Editable spreadsheet (`GuestPassTable`/`GuestPassTableRow`, inline edit/delete) + a "Pegar lista" bulk-paste flow (reuses `parseTicketRows`) + a single-add modal ("Agregar un artista", also reachable as a card on `/admin`). Shows a per-band count summary. No price, no QR, no scan integration — see the "Guest passes" bullet in Critical rules. |
| `/tickets` | TicketsPage (cards / table toggle, search, CSV). Hydrates from `/api/admin/tickets` on mount; this is where the organizer edits holder data and generates / shares each QR. |
| `/dashboard` | DashboardPage — hydrates from `/api/admin/tickets` on mount so sales and check-in stats match `/admin`. |
| `*` | redirect → `/` |

Every route except Home is lazy-loaded. There is **one** event form (`CreateEvent`), wired to the API for both create and edit — the old minimal inline form on `/admin` is gone.

There is intentionally no `/copy-event` route anymore. It used to export/import event + ticket data as JSON (plus a CSV/PDF ticket export) so an organizer could back up or clone an event across devices — a localStorage-era need. Now that events and tickets are persisted server-side in the cloud `sigale` DB, every device already sees the same data via the API, so the whole copy/paste/JSON-clone flow is dead weight. Don't rebuild it.

---

## Data model (MySQL `sigale` DB)

```
events → ticket_stages   (stages: name, price, totalQuantity, sortOrder, activatesAt)
events → tickets          (one row per seat/holder, spans the full order lifecycle)
events → guest_passes     (free-entry roster: band, holderName, holderIdNumber, type)
organizers                (bcrypt-hashed credentials)
```

There is **no separate `purchases` table** — it was merged into `tickets` (see `docs/architecture/TICKETS_SCHEMA.md` for the full column-by-column reference). An "order" is simply every `tickets` row that shares one `orderId`; a row is created at *reservation* time and transitions in place through its lifecycle rather than being spawned fresh at confirm.

Event columns: `name, description, artists (JSON), eventDate, openingTime, venue, address, venueCapacity, flyerImageUrl, bankQrImageUrl, whatsappNumber, isActive`. `address` is added by `migrations/002_event_address.sql`; create/edit (`POST`/`PUT /api/events`) accept and persist it alongside `artists`, `flyerImageUrl`, and `bankQrImageUrl`.

Order/ticket states (`tickets.status`, shared by every row of one `orderId`): `pending_payment → payment_submitted → confirmed | rejected | expired`. Walk-in sales (`createWalkInSale`) skip straight to `confirmed`.

The buyer never sees these states — they're an organizer concern. The buyer's only outcome is "we got your message; we'll send the boleta to `<deliveryContact>`" (the success screen reads `tickets.deliveryMethod` + `tickets.deliveryContact`, which are persisted at step 5 via `POST /api/purchases/:orderId/submitted`).

`orderId` is an `INT UNSIGNED`, sequential starting at 100, **shared by every row of one order** (not unique per row anymore — `orderAnchor`, set only on the first row inserted per order, is what carries the collision-detection `UNIQUE` constraint that `orderId` itself used to have). Quantity and total for an order are no longer stored columns — compute `COUNT(*)` / `SUM(unitPrice)` `GROUP BY orderId`.

`holdersSnapshot` is retired. Holder identity (`holderName`/`holderIdNumber`/`holderPhone`) lives directly on each row from the moment it's known — usually `NULL` at reservation, filled in by `submitPayment`, optionally overridden by an admin at `confirmPurchase`. Positional mapping (`holders[i]` from the client → the i-th row of the order) works because all rows of an order are always inserted together in one statement, so their ids are monotonic in submission order.

`validationHash` is a **server-generated deterministic HMAC** — `HMAC_SHA256(SCAN_HASH_SECRET, "${orderId}:${seatIndex}")` truncated to 16 hex chars (`validationHashFor()` in `admin.controllers.js`) — still minted **only when the organizer confirms** (`CHAR(64)`, nullable — `NULL` before confirm). Keying on `(orderId, seatIndex)` makes it unique per seat (satisfies `uqTicketHash`) and stable across holder edits, while `SCAN_HASH_SECRET` keeps it unguessable. This is a security invariant, not just a data-modeling detail: the door scanner (`scan.controllers.js` `markUsed()`) looks up a ticket by this hash, so as long as it's non-`NULL` only on `confirmed` rows, an unpaid/rejected order can never be scanned in. **`SCAN_HASH_SECRET` must be set in production** (Render) — the code falls back to an insecure dev default otherwise, and rotating the secret invalidates every already-issued QR. QR codes are NOT stored — generated on demand from the hash, and the QR now encodes **only the bare hash string** (not a JSON blob), so it stays low-density. Hold: `reservationExpiresAt = createdAt + 24h` (`NULL` for walk-ins, which never reserve); scheduler sweeps `pending_payment` past expiry; `payment_submitted` waits for organizer action.

`guest_passes` (`id, eventId, band, holderName, holderIdNumber, type ENUM('artist','crew','courtesy'), createdAt`) is a standalone table added by `server/migrations/006_guest_passes.sql` — it has no `unitPrice`, no `validationHash`, no `status` lifecycle, and is never joined into `tickets` queries, `/dashboard` stats, or the scan manifest. `band` is free-form but the UI sources it from `events.artists` (a dropdown) so counts per band stay consistent.

---

## Stage status & inventory invariants

`ticket_stages.status` is `ENUM('upcoming', 'active', 'sold_out', 'closed')` (`closed` added by `migrations/007_single_active_stage.sql`). The scheduler handles `upcoming → active` on a timer (`activatesAt`). All other transitions must be enforced **by the code path that changes `soldQuantity` or `reservedQuantity`**, never lazily.

### `sold_out` vs `closed` — two different reasons a stage stops selling

`sold_out` means *temporarily full*: every restore check below exists to flip it back to `active` the moment `soldQuantity + reservedQuantity` drops below `totalQuantity` again (a rejection, an expiry, a deletion, a raised quota). `closed` means *permanently retired*: a stage superseded by `activateDueStages` promoting the next one, or orphaned by `updateEvent` when it's dropped from an edit while tickets still reference it. **Nothing in the codebase ever restores a stage FROM `closed`** — that's the whole point of the distinction. Never set a superseded/orphaned stage to `sold_out` as a shortcut; it will get auto-resurrected by one of the restore checks below and silently recreate a second `active` stage.

At most one stage per event can be `active`, enforced by the `uqOneActiveStagePerEvent` unique index on `ticket_stages(eventId, activeFlag)` (`activeFlag` is a generated column, `1` only when `status = 'active'`, `NULL` otherwise — NULLs don't collide in a unique index, so any number of non-active stages coexist fine). Any write that promotes a stage to `active` must first demote whatever else is currently `active` for that event to `closed` in the same transaction, or MySQL rejects it with `ER_DUP_ENTRY`. Current call sites: `updateEvent`'s stage-reconciliation loop (`server/controllers/events.controllers.js`), `activateDueStages` (`server/jobs/scheduler.js`), and the sold-out cascade in `createPurchase` / `createWalkInSale` (which promotes the next `upcoming` stage and closes the one it supersedes — see "Sold-out cascade" below).

### Fill check (after incrementing sold or reserved)

```sql
UPDATE ticket_stages SET status = 'sold_out'
  WHERE id = ? AND status = 'active'
    AND soldQuantity + reservedQuantity >= totalQuantity;
```

**Paths that carry this check:** `createPurchase` (reservation), `createWalkInSale` (direct sale). Both also lock the stage `WHERE status = 'active'` up front, so neither can draw inventory from a `sold_out`/`closed`/`upcoming` stage in the first place.

### Sold-out cascade (after the fill check promotes a successor)

When the fill check flips a stage to `sold_out`, both `createPurchase` and `createWalkInSale` try to promote the next `upcoming` stage that has **no** `activatesAt` (scheduler-exempt stages need explicit promotion) to `active`. **If a successor is actually promoted, the just-filled stage is immediately set to `closed`** (not left `sold_out`). Leaving it `sold_out` was the latent bug behind the 2026-07-21 Etapa 1 incident: a later reservation-release (reject / expire / delete) would fire the restore check below and try to flip the superseded stage back to `active`, colliding with the new active stage under `uqOneActiveStagePerEvent` (`ER_DUP_ENTRY`, or — before that constraint — a silent second active stage). If no successor is promoted (none ready), the stage correctly stays `sold_out` and may still reopen when inventory frees up.

### Restore check (after decrementing sold or reserved)

```sql
UPDATE ticket_stages SET status = 'active'
  WHERE id = ? AND status = 'sold_out'
    AND soldQuantity + reservedQuantity < totalQuantity;
```

**Paths that carry this check:** `rejectPurchase` (reserved → released, all rows of the order in one `UPDATE`), `deleteAdminTicket` for a confirmed ticket (sold → released; new since the merge — deleting a non-confirmed row is now rejected with 409 instead, since there's no designed inventory-adjustment path for partially deleting an open order), `sweepExpiredHolds` (reserved → released, grouped by stage across every expired row), `updateEvent` when `totalQuantity` is raised (no quantity change, but the capacity ceiling moves up), `deleteAllPurchases` (batch restore via a single un-scoped UPDATE after the DELETE).

### `confirmPurchase` — no stage-status transition

Confirm moves `reservedQuantity − qty` and `soldQuantity + qty` simultaneously (`qty` = row count for the order), so the net available spots are unchanged. No fill or restore check is needed on `ticket_stages`. (The `tickets.status` column itself very much does transition — every row of the order flips `→ confirmed` in one `UPDATE ... WHERE orderId = ?`.)

### `deleteAllPurchases` inventory rule

Only `confirmed` rows have held `soldQuantity`; only `pending_payment` and `payment_submitted` rows have held `reservedQuantity`. `rejected` and `expired` rows already had their counters decremented by their own handlers — including them in a batch restore causes unsigned underflow (`GREATEST(0 − n, 0)` wraps to ~4 294 967 295, violating `chkStageCapacity`). This endpoint now runs a single `DELETE FROM tickets` (no more second table to cascade-delete) — it still wipes every status, so "Delete All Tickets" on `/tickets` clears pending/rejected/expired orders too, not just confirmed ones.

### `updateEvent` totalQuantity floor guard

`PUT /api/events/:id` returns **409** with a Spanish message if the submitted `totalQuantity` for an existing stage would drop below `soldQuantity + reservedQuantity`. `CreateEvent.handleSubmit` catches `ApiError.message` and pipes it to `notify()` — any future edit UI must follow the same pattern.

---

## API surface

| Method | Route | Access |
|--------|-------|--------|
| GET | `/api/health` | Public |
| GET | `/api/events/active` | Public |
| GET | `/api/events/:id` | Public |
| POST | `/api/events` | Organizer (create) |
| PUT | `/api/events/:id` | Organizer (edit) |
| POST | `/api/purchases` | Public |
| POST | `/api/purchases/:orderId/submitted` | Public |
| POST | `/api/login` | Public (rate-limited) |
| GET | `/api/admin/purchases?status=&orderId=` | Organizer — `GROUP BY orderId` aggregate over `tickets` (one row per order: `quantity = COUNT(*)`, `totalAmount = SUM(unitPrice)`, plus a `holders[]` array from a second query) |
| POST | `/api/admin/purchases/:orderId/confirm` | Organizer — note the param is `orderId`, not a row id (there's no more single-row `purchases.id` surrogate) |
| POST | `/api/admin/purchases/:orderId/reject` | Organizer — same `:orderId` param change |
| POST | `/api/admin/sales` | Organizer (walk-in) — body `{ eventId, stageId, quantity, holders[] }`. Draws inventory from the stage **only if it is `active`** (locks `WHERE status = 'active'`, 409 otherwise) and inserts `confirmed` row(s) directly under a sequential `orderId` in one multi-row insert (no reservation phase). Returns `{ orderId, status, minted, tickets[] }` (each ticket includes its `validationHash` so the seller's screen can render the QR without a second fetch) |
| GET | `/api/admin/tickets?status=` | Organizer — every ticket row, joined with its stage (feeds /tickets and /dashboard). `status` defaults to `confirmed` when omitted (load-bearing: protects `/dashboard`'s stats from silently including non-confirmed rows) — pass a comma-separated list or the literal `all` to see a wider set; this is what makes pending/rejected/expired orders visible on `/tickets`, not just `/admin` |
| PATCH | `/api/admin/tickets/:id` | Organizer — edit `holderName / holderIdNumber / holderPhone`; `validationHash` is immutable once minted |
| GET | `/api/admin/scan/manifest` | Organizer |
| POST | `/api/admin/scan/sync` | Organizer |
| GET | `/api/admin/guest-passes?eventId=` | Organizer — every guest pass for one event, ordered by band |
| POST | `/api/admin/guest-passes` | Organizer — single add, body `{ eventId, band, holderName, holderIdNumber, type }` |
| POST | `/api/admin/guest-passes/bulk` | Organizer — paste-to-bulk-add, body `{ eventId, band, type, entries: [{ holderName, holderIdNumber }] }`, one multi-row `INSERT` |
| PATCH | `/api/admin/guest-passes/:id` | Organizer — edit any of `band/holderName/holderIdNumber/type` |
| DELETE | `/api/admin/guest-passes/:id` | Organizer |

There is intentionally **no** `GET /api/purchases/:orderId` and **no** `GET /api/recover` — the public flow is one-way (create → submitted → terminal success), and recovery is handled by the organizer reaching out to the buyer's `deliveryContact` from `/admin` or `/tickets`.

Auth: Basic credentials re-validated by `requireOrganizer` on every `/api/admin/*` call **and** on the event write routes (`POST`/`PUT /api/events`). No JWT/session. The client builds the Basic header from the session-stored organizer credentials (`getAuth()` in `api/admin.js`); `EventContext.createEvent/updateEvent` attach it when calling `eventsApi`.

---

## Patterns to reuse before writing new code

| Need | Use |
|------|-----|
| API call | `src/api/*.js` wrappers — never raw `fetch` in a component |
| Confirm dialog | `useDialog().confirm({ title, message, danger })` → `Promise<boolean>` |
| Toast | `useDialog().notify({ message, tone: 'success'\|'error'\|'info' })` |
| Custom modal | `useDialog().openCustom((close) => <YourBody />)` |
| Stat tile | `<StatCell icon label value subtext? variant />` |
| "No event" placeholder | `<EmptyStateCard icon title description />` |
| Form-field icon row | `<FieldLabel icon rowClass textClass>{children}</FieldLabel>` |
| Icon | `<Ic name="…" />` |
| Currency display | `<Money value={n} />` or `formatCurrency(n)` |
| Loading / error states | `<AsyncState loading error onRetry>{children}</AsyncState>` |
| Offline scan | `useOfflineScan()` + `scanDb.js` |
| Persisted single-key state | `useLocalStorageValue(key, initial)` |
| Ticket bulk-import | `addTicketsFromCSV(rows)` from `useTickets()` |
| Multi-row name+id paste | `parseTicketRows(text)` from `ticketPasteParser.js` |
| 12h time | `formatTo12Hour('14:30')` |
| Currency | `formatCurrency(50000)` → `"$50,000"` |
| Safe date parse | `parseLocalDate('YYYY-MM-DD')` |

---

## Commands

```
# Frontend (repo root)
npm run dev         # Vite dev server
npm run build       # Production build → dist/
npm run preview     # Serve dist/
npm run lint        # ESLint
npm test            # vitest (CI mode)
npm run test:watch
npm run test:ui

# Backend (cd server/)
node index.js                       # Start Express (runs migrations on boot)
node seed/seedOrganizer.js
node seed/seedSampleEvent.js
node seed/seedFromLocalStorage.js   # One-time import from legacy localStorage export
```

Copy `server/.env.example` → `server/.env`. Set `VITE_API_URL` in the frontend `.env`.

---

## Browser requirements

Chrome/Edge 90+, Firefox 88+, Safari 14+. HTTPS required for camera access and IndexedDB in some browsers.

Required APIs: Web Crypto, localStorage, Clipboard, MediaDevices (camera), IndexedDB (offline scan). Web Share API + File System Access (best-effort, feature-detected).
