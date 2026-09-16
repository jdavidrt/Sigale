# Sígale — Architecture Reference

The deep-dive technical document. For the agent quick-reference, see `/CLAUDE.md`.

> **Scope.** This document tracks the current system. Two things it deliberately does *not* re-explain in full: the column-by-column shape of the `tickets` table (see [`TICKETS_SCHEMA.md`](TICKETS_SCHEMA.md)) and the migration history (see [`server/README.md`](../../server/README.md)). Documentation describing the retired 1.0 architecture — where localStorage was the database — lives in [`legacy/`](../../legacy/README.md) and should not be read as current.

Sígale is a mobile-first React 19 + Vite PWA backed by an Express + MySQL server. Public buyers browse the event landing page, reserve seats, send a payment screenshot over WhatsApp, and land on a terminal success screen telling them the boleta will arrive at their chosen contact. There is no public status page — once the wizard ends, the organizer drives the rest of the lifecycle. Organizers confirm payments, mint tickets, deliver QRs from `/tickets`, register walk-ins via `/sell-tickets`, and scan QR codes at the door. The Astromelias visual identity ships as a CSS layer over the existing token system.

---

## Why this design

Two audiences share one app:

- **Public buyers** need a polished, shareable URL on their phone. They never see the organizer chrome.
- **Organizers** need fast access to the purchase queue, a walk-in form, and a door scanner that validates against live inventory.

These audiences share a server-side source of truth (MySQL) for inventory. The QR code is never stored; it is generated on demand from a server-minted deterministic-HMAC hash (`validationHash`) once the organizer confirms the purchase.

---

## Tech stack

| Layer | Library | Notes |
|-------|---------|-------|
| Framework | React 19 | `useMemo`/`useCallback` for context-value stability |
| Build | Vite 7 | Fast HMR, native ESM, route-level code splitting |
| Styling | Plain CSS — design tokens + CSS Modules + Astromelias classes | `tokens.css → global.css → utilities.css → astromelias.css`; PostCSS runs autoprefixer only. No Tailwind. |
| Routing | React Router v7 | Every routed page is lazy-loaded |
| QR generation | `qrcode.react` | SVG output; rendered to canvas for PNG export |
| QR scanning | `html5-qrcode` | Lazy-loaded on `/scan` only (~100 KB gz) |
| Crypto | Web Crypto API | Client-side: ticket IDs for walk-ins only |
| Backend | Express + `mysql2/promise` | Separate `server/` app; `dateStrings:true`, SSL CA cert |
| Database | MySQL 8 on DigitalOcean | Dedicated `sigale` database; shared cluster with BlackCoffe |
| Door scan | `POST /api/admin/scan` (organizer, API-only) / `POST /api/scan` (public, keyword-gated — Phase 2) | **Online-only**: one request per QR, validates + admits. No IndexedDB, no manifest |
| Jobs | `node-cron` (`scheduler.js`) | Stage auto-activation + expired-hold sweep |

---

## Route groups

> **Multi-event (Phase 1, shipped 2026-08-05).** The platform moved from one
> "active event" to many events sold concurrently, each at its own URL
> `slug`. `/` is now a public grid, not a single landing page, and there is
> no more auto-loaded "the" event — every page resolves one explicitly, by
> slug (public) or by organizer selection (`useEvent()`). This section
> reflects that shipped state, plus **Phase 2** additions (roles, archive,
> public scanner, preferred artist — live on production since 2026-09-15,
> UI click-through still pending; marked inline below).

`App.jsx` defines two layout contexts that never mix. `BrowserRouter` wraps
every provider (not the other way around); every routed page is lazy-loaded.

**Public (Astromelias, no organizer nav)**

| Route | Page |
|-------|------|
| `/` | EventsListPage — grid of `isPublished` events (flyer/name/date/venue cards, a "Demo" pill on the demo). Never empty in practice: the demo is always published. |
| `/:slug` | LandingPage for one event, resolved by `loadEventBySlug(slug)`. A 404 redirects to `/`. **Unpublished events are still reachable here** (soft-launch by private link) — `isPublished` gates only the `/` grid. |
| `/:slug/compra` | PurchaseFlowPage — 6-step wizard, resolves its own event via `loadEventBySlug` (works on a cold deep link, not just after visiting the landing page). Steps 1–3 reversible; from step 4 ("Ir a pagar") onward the back chevron is hidden; step 6 is a terminal success screen with a single "Volver al inicio" CTA. Gate to enter: `event.salesOpen \|\| event.isDemo` (Phase 2 tightens this to `(salesOpen && !isArchived) \|\| isDemo`). Step 1 also collects `preferredArtist` when the event has a line-up (Phase 2). |
| `/compra` | (legacy) — redirects to `/` |
| `/evento/:id` | (legacy) — `LegacyEventRedirect`: fetches the event by id, navigates to `/${slug}`; falls back to `/` on a 404 or a slugless (deploy-window) event |
| `/admin` | AdminPage — login → purchase queue, scoped to the organizer's selected event (the `EventBadge` switcher in `OrganizerTopbar`/`OrganizerMenu`, replacing the old `EventSelector` `<select>` as of 2026-09-15). "+ Registrar Venta" navigates to `/sell-tickets`. With zero events, redirects to `/create-event` (Phase 2: only for a `super_admin`; an `event_admin` with none sees an empty state instead). |
| `/admin/create` | (legacy) — redirects to `/admin` |
| `/scan` | ScanPage. **Phase 2 rebuild (deployed 2026-09-15):** no organizer login — pick an event, type its shared `scanKeyword`, then scan; the choice is remembered in `sessionStorage`. Still public route either way, but no longer depends on a prior `/admin` login. |

The old `/compra/:orderId` status page and `GET /api/recover` were removed in favor of an organizer-driven delivery model: the buyer is told *"Tan pronto nuestro equipo valide tu pago te enviaremos la boleta a `<deliveryContact>` por `<WhatsApp|correo>`"* and the organizer reaches out from `/tickets` once the order is confirmed.

**Organizer (wrapped in `AdminLayout`, gated by `RequireAuth`)**

All organizer routes require the admin login (`isLoggedIn()` in `api/admin.js`); unauthenticated visits redirect to `/admin`. The client gate is a UX funnel — the server is still the authority, re-validating credentials per request. Every page here reads the organizer's currently selected event from `useEvent()` and re-fetches on selection change.

| Route | Page |
|-------|------|
| `/create-event` | CreateEvent (create mode) — the single API-backed event form; fields include the URL slug, `isPublished`, `salesOpen`. **Phase 2:** gated to `super_admin` only, both by a `RequireSuperAdmin` route wrapper and server-side (`requireSuperAdmin` on `POST /api/events`). |
| `/edit` | CreateEvent (edit mode); `/edit-event` redirects here. Slug is locked on the demo event. **Phase 2:** slug and `isPublished` are also locked for an `event_admin` (kept server-side regardless of what's submitted); a new `scanKeyword` field is read from the organizer's event-selector list, the only response that ever carries it. |
| `/sell-tickets` | SellTicketsPage (walk-in registration, `TicketForm`): name + ID (inline validation after ≥ 4 chars), required `preferredArtist` when the event has a line-up; no phone field. |
| `/guest-passes` | GuestPassesPage — artist/crew/courtesy free-entry roster, scoped to the selected event and grouped by band (sourced from `events.artists`). Editable spreadsheet (`GuestPassTable`/`GuestPassTableRow`) with inline edit/delete, a "Pegar lista" paste-to-bulk-add flow (reuses `parseTicketRows`), and a single-add modal. Deliberately separate from `tickets`: no price, no `validationHash`, no scan integration — see the Data model section below. |
| `/tickets` | TicketsPage (cards / table view, search, CSV). Hydrates from `/api/admin/tickets` for the selected event via `TicketContext.refreshFromServer(status, eventId)`; this is where the organizer edits holder data and generates / shares each QR. "Delete All Tickets" is event-scoped and names the event in its confirm dialog. |
| `/lista-puerta` | DoorListPage — printable door list (confirmed holders + guest passes, grouped by type) for staff working without a device. |
| `/dashboard` | DashboardPage — same server hydration as `/tickets`, scoped to the selected event, so sales + check-in stats match `/admin`. |
| `/events-admin` | **Phase 2.** EventsAdminPage — `super_admin` only. Every event with a "show archived" toggle, per-row published/salesOpen/archived state, a link into `/edit`, and archive/unarchive. |
| `/organizers` | **Phase 2.** OrganizersAdminPage — `super_admin` only. List every account, create one, change role/active state, reset a password, edit event assignments. |
| `/validate-qr` | (legacy) — redirects to `/scan`. The former separate validation page and its `QRScanner`/`ValidationResult` components were removed. |

`*` (catch-all → `/`) sits **outside** `RequireAuth` at the top level, so a logged-out visitor to an unknown URL lands on the public root rather than the login funnel.

There is one event form (`CreateEvent`), used for both create and edit and wired to the API. The minimal inline create form that once lived inside `/admin` has been removed; `/admin` now delegates to `/create-event`.

---

## Data model (MySQL `sigale` DB)

Current shape below (through migration `008_multi_event.sql`, live in
production). `001_init.sql` shows the *original* two-table split and is
pre-cutover history — see `server/README.md` for the migration table and
`TICKETS_SCHEMA.md` for the column-by-column reference. All timestamps
stored UTC; read back with `CONVERT_TZ` for Bogotá display. Migrations `010`–`014` (Phase 2) are live on production as of 2026-09-15
(`runMigrations()` runs before the server listens, and the Phase 2 routes answer).

```
organizers
  id, username, passwordHash
  -- + role ENUM('super_admin','event_admin'), isActive TINYINT(1) — migration 010

organizer_events                      -- migration 010
  organizerId → organizers, eventId → events, createdAt
  -- many-to-many: which events an event_admin may manage (a super_admin needs no row — role alone grants access)

events
  id, slug, name, description, artists (JSON), eventDate, openingTime,
  venue, address, venueCapacity, flyerImageUrl, bankQrImageUrl, whatsappNumber,
  isActive (retired — nothing new writes it), isPublished, isDemo, salesOpen
  -- + isArchived TINYINT(1) — migration 012
  -- + scanKeyword VARCHAR(80) NULL — migration 013; never in a public payload

ticket_stages
  id, eventId → events, name, price, totalQuantity, soldQuantity,
  reservedQuantity, sortOrder, activatesAt, status (upcoming|active|sold_out|closed)

tickets                       -- ONE ROW PER SEAT, created at reservation time.
  id, orderId INT UNSIGNED (sequential from 100, SHARED by every row of an order),
  orderAnchor (UNIQUE, set on row 0 only — collision guard),
  eventId → events, stageId → ticket_stages, unitPrice,
  holderName, holderIdNumber, holderPhone,
  deliveryMethod, deliveryContact, idempotencyKey, reservationExpiresAt,
  -- + preferredArtist VARCHAR(160) NULL, AFTER deliveryContact — migration 011
  status (pending_payment|payment_submitted|confirmed|rejected|expired),
  validationHash CHAR(64) NULL UNIQUE (minted ONLY at confirm), isUsed, usedAt,
  confirmedAt, confirmedBy
  -- There is no `purchases` table. An "order" is every row sharing one orderId.
  -- Quantity/total are computed: COUNT(*) / SUM(unitPrice) GROUP BY orderId.

guest_passes
  id, eventId → events, band, holderName, holderIdNumber,
  type ENUM(artist|crew|courtesy), createdAt

order_counter                         -- ONE row: persisted orderId high-water mark
  id (always 1), highWaterMark INT UNSIGNED
  -- written only by deleteAllPurchases; read only by nextOrderId — see below
```

**`slug` / `isPublished` / `isDemo` / `salesOpen`** (migration `008_multi_event.sql`, live): every event has an optional unique URL `slug`; `isPublished` gates the `/` grid only (a slug is still reachable directly, unpublished — soft launch); `isDemo` marks the one permanent read-only Astromelias showpiece at `/demo`; `salesOpen` is the per-event replacement for the retired global `ONLINE_SALES_OPEN` flag and does not gate walk-ins. `order_counter` is a floor on `nextOrderId()` so a per-event "Delete All Tickets" can never make an already-issued `orderId` assignable again — `validationHash = HMAC(orderId, seatIndex)`, so reissuing one would let an already-delivered QR admit a different, newer ticket.

`guest_passes` (added by `server/migrations/006_guest_passes.sql`) is a standalone roster for people who get free entry without a ticket — performing artists, their crew, and courtesy guests. It's intentionally disconnected from the purchase/ticket pipeline: no `unitPrice`/`stageId`, no `validationHash`, no `status` lifecycle, and it's never joined into `/api/admin/tickets`, `/dashboard` stats, or the door scanner — staff check `holderName`/`holderIdNumber` manually rather than scanning a QR. `band` is a plain string but the UI (`GuestPassesPage`) sources it from `events.artists` as a dropdown so per-band counts (shown as a summary strip) aren't split by typos.

**Purchase state machine:**

```
pending_payment → payment_submitted → confirmed
                                    → rejected
pending_payment → (24h sweeper)    → expired
```

`validationHash` is a **deterministic HMAC** minted at confirm — `HMAC_SHA256(SCAN_HASH_SECRET, "${orderId}:${seatIndex}").slice(0, 16)` (`validationHashFor()` in `admin.controllers.js`). Keying on `(orderId, seatIndex)` makes it unique per seat and stable across holder edits; `SCAN_HASH_SECRET` (env var, **must be set in production**) keeps it unguessable. QR codes are never stored — the QR encodes only this bare hash string (kept short so the code is low-density) and is rendered to the organizer on `/tickets`.

**Stage status lifecycle (`ticket_stages.status`):**

The ENUM is `('upcoming', 'active', 'sold_out', 'closed')` — `closed` added by `migrations/007_single_active_stage.sql`. The scheduler promotes `upcoming → active` on a timer (`activatesAt`). Every other transition is owned by the code path that mutates inventory:

| Transition | When | Who |
|------------|------|-----|
| `active → sold_out` | After incrementing `soldQuantity` or `reservedQuantity` fills the stage (`sold + reserved >= total`) | `createPurchase`, `createWalkInSale` |
| `sold_out → active` | After decrementing `soldQuantity` or `reservedQuantity` opens spots (`sold + reserved < total`) | `rejectPurchase`, `deleteAdminTicket` (confirmed ticket), `sweepExpiredHolds`, `updateEvent` (totalQuantity raised), `deleteAllPurchases` (batch) |
| `upcoming → active` | `activatesAt` reached, **or** the previous stage sold out and this one has no `activatesAt` (sold-out cascade) | `scheduler.activateDueStages`, `createPurchase` / `createWalkInSale` |
| `active → closed` | This stage is being superseded (scheduler promoting the next one) or orphaned (dropped from an event edit while tickets still reference it) | `activateDueStages`, `updateEvent` |
| `sold_out → closed` | The sold-out cascade just promoted the next `upcoming` stage to `active`, so the filled stage is superseded and must never reopen | `createPurchase`, `createWalkInSale` |

`confirmPurchase` moves `reservedQuantity − qty` / `soldQuantity + qty` simultaneously — net available spots unchanged, no transition needed.

`sold_out` and `closed` both mean "not buyable," but only `sold_out` is ever auto-restored to `active` (by the row directly above) — that's correct for "temporarily full," wrong for a stage that's been deliberately superseded or orphaned, which must never resurrect. `closed` is the terminal status for that case; nothing restores from it. A DB-level unique index, `uqOneActiveStagePerEvent` on `ticket_stages(eventId, activeFlag)` (`activeFlag` generated as `1` only when `status = 'active'`), guarantees at most one `active` stage per event — added after two same-named stages both reached `active` in production simultaneously (`updateEvent` left an orphaned stage `active` instead of demoting it). Any code promoting a stage to `active` must demote whatever else is `active` for that event to `closed` first, in the same transaction, or the write throws `ER_DUP_ENTRY`.

**Inventory arithmetic safety (`INT UNSIGNED`):**

`soldQuantity` and `reservedQuantity` are `INT UNSIGNED`. Decrementing below zero wraps to ~4 294 967 295, violating the `chkStageCapacity` CHECK (`sold + reserved <= total`). Only restore inventory for purchases that provably still hold it:

- `rejected` and `expired` purchases were already decremented by `rejectPurchase` / `sweepExpiredHolds` when they transitioned — never include them in a subsequent batch restore.
- `deleteAllPurchases` only restores `confirmed` rows (→ `soldQuantity`) and `pending_payment` / `payment_submitted` rows (→ `reservedQuantity`).

**`updateEvent` capacity floor guard:**

`PUT /api/events/:id` checks each existing stage: if the submitted `totalQuantity < soldQuantity + reservedQuantity` it rolls back and returns **409** with a descriptive Spanish message before the UPDATE reaches the DB. Additionally, after every successful UPDATE it runs the `sold_out → active` restore check, so increasing capacity on a sold-out stage automatically reopens it.

**Idempotent action guards:**

`rejectPurchase` returns 200 immediately for purchases already in `rejected` or `expired` state (both have already released their inventory — re-decrementing would underflow). `confirmPurchase` returns 200 immediately for an already-`confirmed` purchase. Every new purchase action must `SELECT … FOR UPDATE`, check current status, and short-circuit on terminal/no-op states.

`orderId` is an `INT UNSIGNED`, assigned sequentially (global `MAX(orderId) + 1`, starting at 100). Migration 003 converted it from `CHAR(3)` unique-per-event to a globally unique integer. `nextOrderId()` is called inside a `FOR UPDATE` transaction and is shared between purchase creation and walk-in registration.

`holdersSnapshot` is **retired**. Holder identity (`holderName` / `holderIdNumber` / `holderPhone`) now lives directly on each `tickets` row from the moment it's known — usually `NULL` at reservation, filled in by `submitPayment`, and optionally overridden by an admin at `confirmPurchase`. Positional mapping (`holders[i]` → the i-th row of the order) is safe because every row of an order is inserted in one statement, so their ids are monotonic in submission order.

`tickets.deliveryMethod` / `deliveryContact` are the **single source of truth** for how to reach the buyer. The success screen reads them straight off the row; the organizer reads them off `/admin` and `/tickets` when sending the QR by WhatsApp or email.

**Hold semantics:** `reservationExpiresAt = createdAt + 24h`. The scheduler sweeps `pending_payment` past expiry and returns `reservedQuantity` to the stage. `payment_submitted` is excluded from the sweep; it holds until the organizer acts. The 20-minute countdown shown to buyers is cosmetic copy only.

---

## Provider tree

```
BrowserRouter            # outermost — wraps every provider (moved here in the multi-event work)
  └── LanguageProvider   # i18n
      └── EventProvider  # event CRUD + multi-event selection via api/events.js:
      │                  #   loadEventBySlug(slug) for public pages;
      │                  #   organizerEvents / selectedEventId / selectEvent(id) for the panel
          └── TicketProvider  # organizer ticket list; refreshFromServer(status, eventId)
          │                    # hydrates from /api/admin/tickets, getStats(event), addTicketsFromCSV()
              └── DialogProvider  # confirm/notify/openCustom + Modal/Toast at root
                  └── Routes
```

Public pages (`EventsListPage`, `LandingPage`, `PurchaseFlowPage`, `AdminPage`, `ScanPage`) call the API directly through `src/api/*.js` rather than through context, except for the event itself (`useEvent()`). `TicketsPage` and `DashboardPage` go through `TicketContext.refreshFromServer()`, always passing the currently selected `eventId`, so the organizer-side cache never leaks another event's tickets.

---

## API layer (`src/api/`)

`client.js` is the single point that knows `VITE_API_URL`. It exposes `api.get/post/put/patch/del` and throws `ApiError` (with `.status` and `.payload`) for any non-2xx response. All other files in `src/api/` import from `client.js` and export typed functions:

| File | Exports |
|------|---------|
| `events.js` | `eventsApi.{getActive (legacy), getById, getBySlug, list (published), listAll (organizer, role-scoped — Phase 2 adds an `includeArchived` option), create, update, archive (Phase 2)}` + mappers `toApiEventPayload` / `fromApiEvent` / `fromApiEventListItem` / `deriveTicketTypes`. `create`/`update`/`archive` take an auth-header `opts`. |
| `purchases.js` | `purchases.{create, submit}`. No `get` / `recover` — the public flow is one-way. `create`'s payload gains `preferredArtist` (Phase 2). |
| `admin.js` | `admin.{login, list, confirm, reject, walkIn, listTickets, updateTicket, updateTicketStage, deleteTicket, deleteAllPurchases}` + session auth helpers `getAuth` / `isLoggedIn` / `logout` / `getRole` / `isSuperAdmin` (Phase 2 additions — `login`'s response and the stored auth blob gain `role`, UI-gating only). |
| `organizers.js` | **Phase 2.** `organizersApi.{list, create, update, setEvents}` — account management, every call `super_admin`-only server-side. |
| `guestPasses.js` | `guestPasses.{list, create, bulkCreate, update, remove}` — artist/crew/courtesy roster, separate domain from tickets/purchases |
| `scan.js` | `scanAndAdmit(hash, { eventId, keyword })`, `listScanEvents()`, `SCAN_RESULT` — one request per scan against the live `tickets` table. The `{ eventId, keyword }` scope and `listScanEvents` are Phase 2; today's live shape is `scanAndAdmit(hash)` against `POST /api/admin/scan`. |

---

## Backend layout (`server/`)

```
index.js            # helmet + CORS (Sígale origins) + express.json(64kb) +
                    # route mounts + global error middleware + runMigrations() → listen
config.js           # PORT from env
db.js               # mysql2/promise pool; sigale DB; dateStrings:true; SSL CA cert
migrations/                   # 001–005 are PRE-CUTOVER HISTORY: the runner marks them
                              # applied rather than executing them once it detects a
                              # cut-over DB. Full table in server/README.md.
  001_init.sql                # Original DDL, incl. the old purchases + tickets split
  002_event_address.sql       # Adds events.address; guarded via information_schema
  003_sequential_orderid.sql  # orderId CHAR(3) → INT UNSIGNED, globally unique, starts at 100
  004_holders_snapshot.sql    # Adds purchases.holdersSnapshot — retired by 005
  005_tickets_merge_schema.sql # Creates tickets_v2, since RENAMEd to `tickets`
  006_guest_passes.sql        # LIVE — creates guest_passes (artist/crew/courtesy roster)
  007_single_active_stage.sql # LIVE — adds `closed` stage status + uqOneActiveStagePerEvent
                              # unique constraint (ticket_stages.activeFlag)
  008_multi_event.sql         # LIVE — events.slug/isPublished/isDemo/salesOpen + order_counter
  009                         # RESERVED, not written — fresh-DB bootstrap fix (see server/README.md)
  010_organizer_roles.sql     # LIVE — organizers.role/isActive + organizer_events
  011_preferred_artist.sql    # LIVE — tickets.preferredArtist
  012_event_archive.sql       # LIVE — events.isArchived
  013_scan_keyword.sql        # LIVE — events.scanKeyword
  014_promote_david_superadmin.sql  # LIVE — data-only: promotes the existing account to super_admin
  runMigrations.js            # Ledger-backed (schema_migrations) + post-cutover self-heal
controllers/        # events, purchases, admin, guestPasses, scan, organizers (Phase 2)
routes/             # health, events, purchases, admin, guestPasses, scan, organizers (Phase 2)
middleware/
  requireOrganizer  # Validates Basic credentials on every /api/admin/* request;
                    # req.organizer gains { role } (Phase 2)
  requireSuperAdmin # Phase 2 — chains after requireOrganizer, 403s a non-super_admin
jobs/
  scheduler.js      # node-cron: stage auto-activation + expired-hold sweep + nightly demo rearm
seed/
  seedOrganizer.js
  seedSampleEvent.js
utils/
  emailNotifier.js  # sendErrorEmail — mirrors BlackCoffe's error reporting
  time.js           # UTC ↔ Bogotá helpers
  authz.js          # Phase 2 — shared assertNotDemo + assertOwnsEvent(conn, organizer, eventId)
```

**Inventory rule:** every path that touches `soldQuantity` or `reservedQuantity` uses `pool.getConnection()` → `beginTransaction()` → `SELECT … FOR UPDATE` → mutate → `COMMIT`/`ROLLBACK` in a `finally` that calls `conn.release()`. Never `pool.query` for inventory. After every increment, run the `active → sold_out` fill check; after every decrement, run the `sold_out → active` restore check. See the "Stage status lifecycle" table in the Data model section for the full matrix. Never use `GREATEST(INT UNSIGNED − n, 0)` as a safe no-op — unsigned underflow wraps to ~4 294 967 295 and violates `chkStageCapacity`.

**Auth model:** no JWT/session. `requireOrganizer` re-validates bcrypt credentials on every `/api/admin/*` request **and** on the event write routes (`POST`/`PUT /api/events`), Basic header over HTTPS. `/api/login` is rate-limited. On the client, `RequireAuth` gates every organizer route on the session-stored login — a UX funnel only; the server check is the real boundary. **Phase 2:** `req.organizer` gains `{ role: 'super_admin' | 'event_admin' }`; `requireSuperAdmin` chains after `requireOrganizer` on account management, event creation/archiving, and the full-event wipe; every eventId-scoped handler additionally calls `assertOwnsEvent(conn, organizer, eventId)` (a `super_admin` always passes; an `event_admin` needs a row in the new `organizer_events` table).

**Admin endpoints (`/api/admin/*`):** `GET /purchases?eventId=` (required — 400 without it), `POST /purchases/:orderId/confirm`, `POST /purchases/:orderId/reject`, `POST /sales` (walk-in), `GET /tickets?eventId=` (required; every minted ticket joined with its stage + order — feeds `/tickets` and `/dashboard`), `PATCH /tickets/:id` (edit `holderName / holderIdNumber / holderPhone`; `validationHash` is immutable once minted), `POST /scan` (organizer-credentialed; API-only, no UI calls it anymore — see "Door scan architecture"), `PATCH /tickets/:id/stage` (reassign a ticket to another stage, moving both stages' counters), `DELETE /tickets/:id` (confirmed rows only — 409 otherwise), `DELETE /purchases?eventId=` (event-scoped wipe; **Phase 2: `requireSuperAdmin`**), and the guest-passes endpoints `GET /guest-passes?eventId=`, `POST /guest-passes` (single add), `POST /guest-passes/bulk` (paste-to-bulk-add, one multi-row `INSERT`), `PATCH /guest-passes/:id`, `DELETE /guest-passes/:id` — a fully separate table from `tickets`, no price/QR/scan involved. The old `GET /scan/manifest` and `POST /scan/sync` (dead, no client ever called them) have been **removed**, not just left dead.

**Phase 2 endpoints (written):** `POST /api/events/:id/archive` (`super_admin`), `GET/POST /api/admin/organizers` + `PATCH /api/admin/organizers/:id` + `PUT /api/admin/organizers/:id/events` (all `super_admin`), and the public, rate-limited `GET /api/scan/events` + `POST /api/scan { eventId, keyword, hash }` (see "Door scan architecture").

**Security floor:**
- Organizer password stored bcrypt-hashed in `organizers.passwordHash`. Seed by hashing — never store plaintext.
- Explicit column lists on every public `INSERT` (no `SET ?` mass-assignment).
- Parameterized queries everywhere; `helmet` on the Express app.
- SSL to the DB: `ssl: { ca: fs.readFileSync(process.env.DB_CA_CERT) }` — no `rejectUnauthorized:false`.
- `validationHash` is a deterministic HMAC keyed by `SCAN_HASH_SECRET` over `(orderId, seatIndex)` — unguessable without the secret, so it functions as an entry secret even though it's not random. **`SCAN_HASH_SECRET` must be set in production;** the code falls back to an insecure dev default otherwise.
- **Phase 2:** `events.scanKeyword` is a plaintext, per-event shared door code — deliberately excluded from every public event payload (only `GET /api/events/all` for an authenticated organizer ever returns it), and both public scan endpoints are rate-limited (120 req/min/IP) against brute-forcing it.

---

## Door scan architecture

**Scanning is online-only.** Each QR is one round trip. **Live in production today:**

1. `OfflineScanner.jsx` (html5-qrcode) decodes the QR into a bare `validationHash` string.
2. `scanAndAdmit(hash)` in `src/api/scan.js` sends `POST /api/admin/scan { hash }` with the organizer's Basic credentials (device must have logged in once via `/admin`).
3. The server's `markUsed()` looks up the **confirmed** ticket by that hash and stamps `isUsed` / `usedAt` in one idempotent write, returning `ok` or `already_used`; an unknown or unconfirmed hash returns 404.
4. The UI maps the response to `SCAN_RESULT`: `OK`, `ALREADY_USED`, `INVALID`, or `ERROR`.

`ERROR` is deliberately distinct from `INVALID` so a dropped network or an auth failure never reads as "boleta no válida" to door staff.

Because the database is the single arbiter, two devices scanning the same ticket simultaneously cannot both admit it — the second gets `already_used`. That is the main reason the earlier offline-first design was dropped.

> **Historical note.** `/scan` used to pre-cache a manifest of confirmed hashes in IndexedDB (`useOfflineScan`, `scanDb.js`) and queue admits for later sync. Those modules were removed, and the server's own `GET /api/admin/scan/manifest` / `POST /api/admin/scan/sync` (dead code, no client callers) have since been **deleted outright** as part of the Phase 2 work below.

> **Phase 2 rebuild (written 2026-09-15).** `ScanPage` no longer requires an organizer login at all: the operator opens `/scan`, picks an event from `GET /api/scan/events` (only events with a `scanKeyword` set and not archived), types that keyword, and the choice is cached in `sessionStorage`. Every scan then calls `scanAndAdmit(hash, { eventId, keyword })` → `POST /api/scan { eventId, keyword, hash }`, which the server validates (keyword match, trimmed + case-insensitive) before calling the **same** `markUsed()` — now given the `eventId` so it 409s with "Esta boleta es de otro evento" if the hash belongs to a different event. Both public endpoints are rate-limited. `POST /api/admin/scan` (organizer-credentialed) is kept for API compatibility, but no UI calls it once this ships.

---

## Component map

### Public flow (`src/components/flow/`)

| File | Role |
|------|------|
| `FlowShell.jsx` | Step container, progress indicator, back/forward. Renders an empty 44px placeholder where the back chevron would be when `onBack` is `null`, so the wordmark stays centered when the back button is intentionally suppressed. |
| `PurchaseFlow.jsx` | Steps 1–6 wired to `api/purchases.js`; WhatsApp deep-link on step 5; step 6 is a terminal success screen. `back` returns `null` for `step >= 4`, hiding the back chevron from "Ir a pagar" onward. Blocks the flow with "Ninguna etapa está activa" when `resolveActiveStage(event)` returns `null` (sold_out or all upcoming). Resolves its own event via `useParams().slug` + `loadEventBySlug` (works on a cold deep link). Demo mode stubs the API calls entirely and locks quantity to 1. **Phase 2:** step 1 gains a required `preferredArtist` dropdown when the event has a line-up. |

### Organizer — Tickets

| File | Role |
|------|------|
| `TicketForm.jsx` | Create / edit one ticket; clipboard paste fills name+id. Phone is optional (blank stored as `"000"` sentinel so `TicketCard` keeps hiding it). Inline "no válido" errors on name + ID are suppressed until the user has typed ≥ 4 characters; submit re-validates with a `useDialog().notify` error toast on failure. **Phase 2:** the phone input is removed entirely (always sends `null`) and a required `preferredArtist` dropdown is added, sourced from `event.artists`, whenever the event has a line-up. |
| `TicketCard.jsx` | Mobile-friendly card row |
| `TicketTable.jsx` + `TicketTableRow.jsx` | Inline-editable spreadsheet view |
| `TicketsViewToggle.jsx` | Cards ↔ Table segment control, persisted |
| `TicketEditConfirm.jsx` | Diff view in the row-commit modal |
| `QRDisplay.jsx` | On-demand QR + PNG preview + copy/share toolbar |
| `CSVPanel.jsx` | Round-trip CSV import/export modal |

### Organizer — Guest passes

| File | Role |
|------|------|
| `GuestPassTable.jsx` | Editable spreadsheet for artist/crew/courtesy passes; toolbar picks a default band + type, then "Pegar lista" bulk-inserts pasted name/id pairs via `parseTicketRows` + `POST /api/admin/guest-passes/bulk` |
| `GuestPassTableRow.jsx` | Inline edit-in-place per row (band/name/id/type), direct save (no diff-confirm modal — unlike `TicketEditConfirm`, a guest-pass edit has no payment/QR consequence) |

### Scanner

| File | Role |
|------|------|
| `OfflineScanner.jsx` | The single door scanner: `html5-qrcode` camera + `scanAndAdmit()` per QR, inline color-coded verdict (valid / already-used / invalid / error). **The name is historical** — scanning is online-only; there is no offline path left. Replaced the old `QRScanner.jsx` + `ValidationResult.jsx` pair, which were removed with `/validate-qr`. **Phase 2:** two more verdicts, `wrong_event` and `wrong_keyword`, for the public scan flow's own failure modes. |

### UI primitives (`src/components/ui/`)

| Primitive | Use |
|-----------|-----|
| `StatCell` | Labeled value in a dashboard grid; maps to `.stat` in astromelias.css |
| `EmptyStateCard` | Page-level "no event" placeholder |
| `FieldLabel` | Icon + label row above a form input |
| `Modal` | Generic backdrop + card; portal-rendered, Esc + click-outside to dismiss |
| `Toast` | Bottom-center status stack rendered by `DialogProvider` |
| `Ic` | Astromelias icon primitive |
| `Screen` | Full-screen wrapper for public Astromelias pages |
| `StarField` | Animated canvas star background (respects `prefers-reduced-motion`) |

---

## Hook reference

| Hook | Returns | Notes |
|------|---------|-------|
| `useLocalStorage(initial)` | `[data, setData, { lastError, clearError }]` | Whole-blob organizer state; cross-tab sync |
| `useLocalStorageValue(key, initial)` | `[value, setValue]` | Single-key prefs (language, view toggle) |
| `usePageVisibility()` | `{ isVisible }` | Tab regain focus → re-reads storage (iOS recovery) |

---

## Util reference

| Util | Key exports |
|------|-------------|
| `sampleEvent.js` | `SAMPLE_EVENT` (dev placeholder), `resolveActiveStage(event) → stage \| null` (**returns `null` when no stage has `status === 'active'`** — does not fall back to `stages[0]`), `stageCupos(stage) → number` |
| `hashGenerator.js` | `generateTicketId() → "TKT-<8hex>-<ts>"` (walk-in only; server mints hashes for purchases) |
| `qrGenerator.js` | `generateQRData(ticket) → bare validationHash string`, `parseQRData(text) → { hash }` (also tolerates the legacy JSON payload) — `hash` arrives from API |
| `qrCopy.js` | `copySVGToClipboard`, `copyPNGToClipboard`, `shareQR` |
| `svgTicketTemplate.js` | `generateTicketSVG(ticket, event, qrDataURL)`, `loadFlyerImage(base64)` |
| `timeFormat.js` | `formatTo12Hour`, `parseLocalDate`, `toLocalDateString`, `checkInWindowStatus`, `formatCurrency` |
| `csvUtils.js` | `ticketsToCSV` (round-trip), `ticketsToHumanCSV` (price column; not re-importable), `csvToTickets` |
| `ticketPasteParser.js` | `parseSingleNameAndId`, `parseTicketRows` (TSV-aware multi-row) |
| `guestPassImage.js` | Shareable PNG for a guest pass (no QR — free entry) |
| `storage.js` | `loadFromStorage`, `saveToStorage`, `clearStorage`, version migration |
| `translations.js` | `translations` dictionary, `detectBrowserLanguage` |
| `slug.js` | `SLUG_PATTERN`, `RESERVED_SLUGS` (must stay byte-identical to the server's copy in `events.controllers.js`), `sanitizeSlugInput`, `isSlugFormatValid` |

---

## End-user workflows

**Public purchase (6 steps).** Buyer opens `/` (a grid of published events), taps a card → `/:slug` → "Comprar boleta" → `/:slug/compra` → selects quantity (and, once Phase 2 ships, a preferred artist) → confirms order → enters holder names + chooses WhatsApp/email delivery → is shown the payment QR and bank details (back button is now locked) → opens WhatsApp with the pre-filled message and taps "Ya lo envié" → lands on a terminal success screen with their orden number and the line *"Tan pronto nuestro equipo valide tu pago te enviaremos la boleta a `<deliveryContact>` por `<WhatsApp|correo>`"*. The only exit is "Volver al inicio", which `navigate('/', { replace: true })`s back to the landing grid so back-navigating doesn't pop the wizard back onto the stack.

**Organizer — confirm payment + deliver ticket.** `/admin` shows the order queue for the organizer's selected event (the `EventBadge` switcher in `OrganizerTopbar`/`OrganizerMenu`). The organizer finds the orderId from the WhatsApp message, verifies the transfer, hits Confirmar pago → server marks `confirmed`, then flips every row of the order to `confirmed` and mints each seat's `validationHash` (holder names / IDs / phones already live on the rows from reservation time). The organizer can pass an overriding `holders` array in the confirm body to change them before minting. Newly minted tickets appear on `/tickets` (and totals on `/dashboard`) — that's where the organizer generates / copies / shares the QR and sends it to the buyer via `deliveryMethod` + `deliveryContact`.

**Door scan.** Live today: organizer opens `/scan` on a device that has logged in at least once (the call carries Basic organizer credentials). Each scanned QR is validated against the live database in one request, which both checks and admits. The device needs connectivity — there is no offline cache. **Phase 2:** no login at all — pick the event, type its `scanKeyword`, then scan; the choice is remembered per browser tab (`sessionStorage`) so a refresh doesn't re-ask.

**Walk-in registration.** `/admin` → "+ Registrar Venta" → `/sell-tickets` (`TicketForm`) → organizer enters buyer info (phone optional) → ticket is created. The legacy inline walk-in stepper on `/admin` has been removed; collecting holder name/ID/phone up front means walk-ins appear in the same `/tickets`, `/dashboard`, and door scanner as purchased orders. Walk-ins sell **only from the currently `active` stage**: `createWalkInSale` locks the stage `WHERE status = 'active'` (409 otherwise), and the ticket-type dropdown lists only active stages — a superseded/`closed` etapa can never be sold at the door. **Phase 2:** the phone field is dropped and a required preferred-artist dropdown takes its place whenever the event has a line-up.

**Guest passes (artist/crew/courtesy).** `/admin` → "+ Agregar un artista" → `/guest-passes` → either the single-add modal (band + name + id + type) or "Pegar lista" to bulk-paste a whole band's list under one default band+type. Entries live in their own `guest_passes` table — they never appear on `/tickets`, `/dashboard`, or the door scanner; staff check the name/ID against this list manually. The per-band summary strip helps the organizer track how many free passes each band has used.

**Manage accounts and events (Phase 2).** A `super_admin` opens `/organizers` to create an `event_admin` account, reset a password, or assign it to specific events; `/events-admin` lists every event with a "show archived" toggle and lets the `super_admin` archive/unarchive one (the reversible replacement for event deletion — see the Data model section). An `event_admin` never sees either page and is scoped to whatever events it's assigned to via `organizer_events`.

**Ticket sales / bulk add.** `/tickets` → Table view → "Paste Tickets" → `parseTicketRows` splits clipboard TSV → `addTicketsFromCSV` dedupes and inserts.

**Backup / handoff.** There is none, by design. Events and tickets live in the cloud `sigale` database, so every device already sees the same data through the API. The old `/copy-event` JSON export/import and the "Paste from clipboard" clone button were removed — don't rebuild them.

---

## Performance & limits

| Metric | Target |
|--------|--------|
| Initial JS (LandingPage) | ~50 KB gz |
| `/scan` (html5-qrcode chunk) | ~100 KB gz |
| Concurrent reservations | Serialized by `SELECT … FOR UPDATE` at the DB |
| orderId range | `INT UNSIGNED`, globally unique, sequential from 100 — no per-event ceiling |

---

## Security model

- **`validationHash`**: deterministic HMAC — `HMAC_SHA256(SCAN_HASH_SECRET, "${orderId}:${seatIndex}").slice(0,16)`, minted at confirm. Unique per seat, stable across edits, and unguessable without `SCAN_HASH_SECRET` (which must be set in production). The scanner looks up by hash in `tickets.validationHash` (unique index).
- **Inventory**: all mutations inside `BEGIN … COMMIT` with `FOR UPDATE` locks; concurrent race goes to the DB, not the app.
- **Admin auth**: bcrypt credentials re-validated on every request by `requireOrganizer`. Rate-limited login.
- **CSV injection guard**: `csvUtils.formatCell` prepends `'` to cells starting with `=`, `+`, `-`, `@`, tab, or CR.
- **Organizer-side context**: `addTicketsFromCSV` dedupes by `buyerId|buyerName|ticketType`; `checkInTicket` returns `{ ok, reason }` to distinguish stale state from genuine duplicates.
- **Phase 2:** role-based access (`super_admin` full control; `event_admin` scoped via `organizer_events`, checked server-side by `assertOwnsEvent` on every eventId-scoped handler — the client's `isSuperAdmin()` only hides UI, never the actual gate); an inactive account (`organizers.isActive = 0`) fails login the same way a wrong password does, so it can't be distinguished by an attacker; `events.scanKeyword` is a plaintext per-event door code, excluded from every public payload and rate-limited on both public scan endpoints; account writes refuse to leave zero active `super_admin`s and refuse to let an account change its own role/active state.

---

## BlackCoffe guardrail

`reference/blackcoffe-server-snapshot/` (git-ignored, formerly `server/current-server/`) is a **read-only reference snapshot** of BlackCoffe's production server. Never execute it, never import from it. Sígale's backend is a separate app; its migrations touch only the `sigale` database tables (`organizers`, `events`, `ticket_stages`, `tickets`, `guest_passes`) and must never `CREATE`/`ALTER`/`DROP` BlackCoffe tables (`orders`, `deposits`, `clients`, `products`, `users`). Confirm `DB_NAME=sigale` before any DB command. Full policy in `docs/SIGALE_2.0_IMPLEMENTATION_PLAN.md §3.1`.

---

## Browser support

Chrome/Edge 90+, Firefox 88+, Safari 14+. HTTPS required for camera access. Required APIs: Web Crypto, localStorage, Clipboard, MediaDevices (camera). Web Share API + File System Access used best-effort with feature detection. **IndexedDB is no longer used** — the offline scan cache was removed.

---

## Commands

```
# Frontend (repo root)
npm run dev      # Vite dev server
npm run build    # Production build
npm run preview  # Serve dist/
npm run lint     # ESLint
npm test         # vitest

# Backend (cd server/)
node index.js                      # Start (runs migrations on boot)
node seed/seedOrganizer.js
node seed/seedSampleEvent.js
```

---

## Cross-references

- Agent quick-reference — `/CLAUDE.md`
- Multi-event platform (Phase 1, shipped) + roles/archive/scanner/artist (Phase 2) — `/MULTI_EVENT_PLAN.md` and `/MULTI_EVENT_PLAN_STATUS.md`
- Phase 2 schema reference + ER diagram — `docs/architecture/DB_SCHEMA.md`
- Backend architecture decisions — `docs/architecture/ADR-0001-migracion-sql-express.md`
- Design tokens + Astromelias — `docs/design2.0/IMPLEMENTATION_GUIDE.md`
- Merged tickets schema — `docs/architecture/TICKETS_SCHEMA.md`
- Backend, migrations, deploy — `server/README.md`
- Retired docs and dead code — `legacy/README.md`
- CSS module conventions — `docs/guides/css-architecture-guide.md`
- Cross-platform mobile behavior — `docs/guides/android-ios-compatibility.md`
- CSV import/export details — `docs/features/CSV_FEATURE_GUIDE.md`
- Mobile testing checklist — `docs/guides/MOBILE_TESTING.md`
