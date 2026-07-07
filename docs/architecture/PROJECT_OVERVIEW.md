# Sígale — Architecture Reference

The deep-dive technical document. For the agent quick-reference, see `/CLAUDE.md`.

> **Schema update superseding this document's data-model sections:** the `purchases` + `tickets` tables described below have been merged into a single `tickets` table (one row per seat, spanning the full order lifecycle from reservation through confirm/reject/expiry). See `docs/architecture/TICKETS_SCHEMA.md` for the current schema and `/CLAUDE.md`'s "Data model" section for the quick summary. This document's narrative below still reflects the original two-table design and is kept as historical context for *why* the split existed — don't use it as the current source of truth for table shapes.

Sígale is a mobile-first React 19 + Vite PWA backed by an Express + MySQL server. Public buyers browse the event landing page, reserve seats, send a payment screenshot over WhatsApp, and land on a terminal success screen telling them the boleta will arrive at their chosen contact. There is no public status page — once the wizard ends, the organizer drives the rest of the lifecycle. Organizers confirm payments, mint tickets, deliver QRs from `/tickets`, register walk-ins via `/sell-tickets`, and scan QR codes at the door (offline-capable). The Astromelias visual identity ships as a CSS layer over the existing token system.

---

## Why this design

Two audiences share one app:

- **Public buyers** need a polished, shareable URL on their phone. They never see the organizer chrome.
- **Organizers** need fast access to the purchase queue, a walk-in form, and a door scanner that keeps working without Wi-Fi.

These audiences share a server-side source of truth (MySQL) for inventory. The QR code is never stored; it is generated on demand from a server-minted random hash (`validationHash`) once the organizer confirms the purchase.

---

## Tech stack

| Layer | Library | Notes |
|-------|---------|-------|
| Framework | React 19 | `useMemo`/`useCallback` for context-value stability |
| Build | Vite 7 | Fast HMR, native ESM, route-level code splitting |
| Styling | Plain CSS — design tokens + CSS Modules + Astromelias classes | `tokens.css → global.css → utilities.css → astromelias.css`; PostCSS runs autoprefixer only. No Tailwind. |
| Routing | React Router v7 | Lazy-loaded; only Home and LandingPage ship with the main bundle |
| QR generation | `qrcode.react` | SVG output; rendered to canvas for PNG export |
| QR scanning | `html5-qrcode` | Lazy-loaded on `/validate-qr` only (~100 KB gz) |
| PDF export | `jspdf` | Dynamic import on the export page |
| Crypto | Web Crypto API | Client-side: ticket IDs for walk-ins only |
| Backend | Express + `mysql2/promise` | Separate `server/` app; `dateStrings:true`, SSL CA cert |
| Database | MySQL 8 on DigitalOcean | Dedicated `sigale` database; shared cluster with BlackCoffe |
| Offline scan | IndexedDB (`scanDb.js`) | Pre-cached manifest + sync queue; `useOfflineScan` hook |
| Jobs | `node-cron` (`scheduler.js`) | Stage auto-activation + expired-hold sweep |

---

## Route groups

`App.jsx` defines two layout contexts that never mix:

**Public (Astromelias, no organizer nav)**

| Route | Page |
|-------|------|
| `/` | LandingPage |
| `/evento/:id` | LandingPage (specific event) |
| `/compra` | PurchaseFlowPage — 6-step wizard. Steps 1–3 reversible; from step 4 ("Ir a pagar") onward the back chevron is hidden. Step 6 is a terminal success screen with a single "Volver al inicio" CTA. |
| `/admin` | AdminPage — login → purchase queue. "+ Registrar Venta" navigates to `/sell-tickets` (no inline walk-in stepper). Slide-out `OrganizerMenu` links to every organizer tool; with no active event it redirects to `/create-event`. |
| `/scan` | ScanPage (door scan, offline-first) |

The old `/compra/:orderId` status page and `GET /api/recover` were removed in favor of an organizer-driven delivery model: the buyer is told *"Tan pronto nuestro equipo valide tu pago te enviaremos la boleta a `<deliveryContact>` por `<WhatsApp|correo>`"* and the organizer reaches out from `/tickets` once the order is confirmed.

**Organizer (wrapped in `AdminLayout`, gated by `RequireAuth`)**

All organizer routes require the admin login (`isLoggedIn()` in `api/admin.js`); unauthenticated visits redirect to `/admin`. The client gate is a UX funnel — the server is still the authority, re-validating credentials per request.

| Route | Page |
|-------|------|
| `/admin/create` | (legacy) — redirects to `/admin` |
| `/create-event` | CreateEvent (create mode) — the single API-backed event form |
| `/edit` | CreateEvent (edit mode); `/edit-event` redirects here |
| `/sell-tickets` | SellTicketsPage (walk-in registration). Phone field is **optional**; name + ID don't pop inline validation errors until the user has typed ≥ 4 characters. |
| `/guest-passes` | GuestPassesPage — artist/crew/courtesy free-entry roster, scoped to the active event and grouped by band (sourced from `events.artists`). Editable spreadsheet (`GuestPassTable`/`GuestPassTableRow`) with inline edit/delete, a "Pegar lista" paste-to-bulk-add flow (reuses `parseTicketRows`), and a single-add modal. Deliberately separate from `tickets`: no price, no `validationHash`, no scan-manifest integration — see the Data model section below. |
| `/tickets` | TicketsPage (cards / table view, search, CSV). Hydrates from `/api/admin/tickets` on mount via `TicketContext.refreshFromServer()` so every confirmed purchase shows up; this is where the organizer edits holder data and generates / shares each QR. |
| `/validate-qr` | ValidateQRPage (legacy camera scanner) |
| `/copy-event` | CopyEventPage (JSON / CSV / PDF export, import) |
| `/dashboard` | DashboardPage — same server hydration as `/tickets`, so sales + check-in stats match `/admin`. |
| `*` | redirect → `/` |

There is one event form (`CreateEvent`), used for both create and edit and wired to the API. The minimal inline create form that once lived inside `/admin` has been removed; `/admin` now delegates to `/create-event`.

---

## Data model (MySQL `sigale` DB)

Schema lives in `server/migrations/001_init.sql`, with `002_event_address.sql` adding `events.address` (idempotent column guard via `information_schema`). All timestamps stored UTC; read back with `CONVERT_TZ` for Bogotá display.

```
organizers
  id, username, passwordHash

events
  id, name, description, artists (JSON), eventDate, openingTime,
  venue, address, venueCapacity, flyerImageUrl, bankQrImageUrl, whatsappNumber, isActive

ticket_stages
  id, eventId → events, name, price, totalQuantity, soldQuantity,
  reservedQuantity, sortOrder, activatesAt, status (upcoming|active|sold_out)

purchases
  id, eventId, stageId, quantity, totalAmount, orderId INT UNSIGNED (sequential, globally unique, starts at 100),
  deliveryMethod, deliveryContact, holdersSnapshot JSON NULL, status, idempotencyKey,
  reservationExpiresAt, confirmedAt, confirmedBy

tickets
  id, purchaseId → purchases, holderName, holderIdNumber, holderPhone,
  validationHash CHAR(64) UNIQUE, isUsed, usedAt

guest_passes
  id, eventId → events, band, holderName, holderIdNumber,
  type ENUM(artist|crew|courtesy), createdAt
```

`guest_passes` (added by `server/migrations/006_guest_passes.sql`) is a standalone roster for people who get free entry without a ticket — performing artists, their crew, and courtesy guests. It's intentionally disconnected from the purchase/ticket pipeline: no `unitPrice`/`stageId`, no `validationHash`, no `status` lifecycle, and it's never joined into `/api/admin/tickets`, `/dashboard` stats, or the scan manifest — door staff check `holderName`/`holderIdNumber` manually rather than scanning a QR. `band` is a plain string but the UI (`GuestPassesPage`) sources it from `events.artists` as a dropdown so per-band counts (shown as a summary strip) aren't split by typos.

**Purchase state machine:**

```
pending_payment → payment_submitted → confirmed
                                    → rejected
pending_payment → (24h sweeper)    → expired
```

`validationHash` is a **deterministic HMAC** minted at confirm — `HMAC_SHA256(SCAN_HASH_SECRET, "${orderId}:${seatIndex}").slice(0, 16)` (`validationHashFor()` in `admin.controllers.js`). Keying on `(orderId, seatIndex)` makes it unique per seat and stable across holder edits; `SCAN_HASH_SECRET` (env var, **must be set in production**) keeps it unguessable. QR codes are never stored — the QR encodes only this bare hash string (kept short so the code is low-density) and is rendered to the organizer on `/tickets`.

**Stage status lifecycle (`ticket_stages.status`):**

The ENUM is `('upcoming', 'active', 'sold_out')`. The scheduler promotes `upcoming → active` on a timer (`activatesAt`). Every other transition is owned by the code path that mutates inventory:

| Transition | When | Who |
|------------|------|-----|
| `active → sold_out` | After incrementing `soldQuantity` or `reservedQuantity` fills the stage (`sold + reserved >= total`) | `createPurchase`, `createWalkInSale` |
| `sold_out → active` | After decrementing `soldQuantity` or `reservedQuantity` opens spots (`sold + reserved < total`) | `rejectPurchase`, `deleteAdminTicket` (confirmed ticket), `sweepExpiredHolds`, `updateEvent` (totalQuantity raised), `deleteAllPurchases` (batch) |
| `upcoming → active` | `activatesAt` reached | `scheduler.activateDueStages` |

`confirmPurchase` moves `reservedQuantity − qty` / `soldQuantity + qty` simultaneously — net available spots unchanged, no transition needed.

**Inventory arithmetic safety (`INT UNSIGNED`):**

`soldQuantity` and `reservedQuantity` are `INT UNSIGNED`. Decrementing below zero wraps to ~4 294 967 295, violating the `chkStageCapacity` CHECK (`sold + reserved <= total`). Only restore inventory for purchases that provably still hold it:

- `rejected` and `expired` purchases were already decremented by `rejectPurchase` / `sweepExpiredHolds` when they transitioned — never include them in a subsequent batch restore.
- `deleteAllPurchases` only restores `confirmed` rows (→ `soldQuantity`) and `pending_payment` / `payment_submitted` rows (→ `reservedQuantity`).

**`updateEvent` capacity floor guard:**

`PUT /api/events/:id` checks each existing stage: if the submitted `totalQuantity < soldQuantity + reservedQuantity` it rolls back and returns **409** with a descriptive Spanish message before the UPDATE reaches the DB. Additionally, after every successful UPDATE it runs the `sold_out → active` restore check, so increasing capacity on a sold-out stage automatically reopens it.

**Idempotent action guards:**

`rejectPurchase` returns 200 immediately for purchases already in `rejected` or `expired` state (both have already released their inventory — re-decrementing would underflow). `confirmPurchase` returns 200 immediately for an already-`confirmed` purchase. Every new purchase action must `SELECT … FOR UPDATE`, check current status, and short-circuit on terminal/no-op states.

`orderId` is an `INT UNSIGNED`, assigned sequentially (global `MAX(orderId) + 1`, starting at 100). Migration 003 converted it from `CHAR(3)` unique-per-event to a globally unique integer. `nextOrderId()` is called inside a `FOR UPDATE` transaction and is shared between purchase creation and walk-in registration.

`holdersSnapshot` (`JSON NULL`) captures the buyer-entered holder names / ID numbers / phones when the purchase is created or submitted. At confirm-time `confirmPurchase` uses this snapshot to mint tickets automatically; the organizer can pass an overriding `holders` array in the confirm request body to change them.

`purchases.deliveryMethod` / `deliveryContact` are the **single source of truth** for how to reach the buyer. The success screen reads them straight off the row; the organizer reads them off `/admin` and `/tickets` when sending the QR by WhatsApp or email.

**Hold semantics:** `reservationExpiresAt = createdAt + 24h`. The scheduler sweeps `pending_payment` past expiry and returns `reservedQuantity` to the stage. `payment_submitted` is excluded from the sweep; it holds until the organizer acts. The 20-minute countdown shown to buyers is cosmetic copy only.

---

## Provider tree

```
LanguageProvider       # i18n — outermost so error UI can be localized
  └── EventProvider    # event CRUD via api/events.js
      └── TicketProvider  # organizer ticket list; refreshFromServer() hydrates from
      │                    # /api/admin/tickets, getStats(), addTicketsFromCSV()
          └── DialogProvider  # confirm/notify/openCustom + Modal/Toast at root
              └── BrowserRouter / Routes
```

Public 2.0 pages (`LandingPage`, `PurchaseFlowPage`, `AdminPage`, `ScanPage`) call the API directly through `src/api/*.js` rather than through context. `TicketsPage` and `DashboardPage` go through `TicketContext.refreshFromServer()` so the organizer-side cache is consistent across tabs.

---

## API layer (`src/api/`)

`client.js` is the single point that knows `VITE_API_URL`. It exposes `api.get/post/put/patch/del` and throws `ApiError` (with `.status` and `.payload`) for any non-2xx response. All other files in `src/api/` import from `client.js` and export typed functions:

| File | Exports |
|------|---------|
| `events.js` | `eventsApi.{getActive, getById, create, update}` + mappers `toApiEventPayload` / `fromApiEvent` / `deriveTicketTypes`. `create`/`update` take an auth-header `opts` and round-trip `address`, `artists`, `flyerImageUrl`, `bankQrImageUrl`. |
| `purchases.js` | `purchases.{create, submit}`. No `get` / `recover` — the public flow is one-way. |
| `admin.js` | `admin.{login, list, confirm, reject, walkIn, listTickets, updateTicket}` + session auth helpers `getAuth` / `isLoggedIn` / `logout` (used by `RequireAuth` and the event write calls) |
| `guestPasses.js` | `guestPasses.{list, create, bulkCreate, update, remove}` — artist/crew/courtesy roster, separate domain from tickets/purchases |
| `scan.js` | `downloadManifest`, `syncScans` |

---

## Backend layout (`server/`)

```
index.js            # helmet + CORS (Sígale origins) + express.json(64kb) +
                    # route mounts + global error middleware + runMigrations() → listen
config.js           # PORT from env
db.js               # mysql2/promise pool; sigale DB; dateStrings:true; SSL CA cert
migrations/
  001_init.sql                # Full DDL — all Sígale tables, idempotent (IF NOT EXISTS)
  002_event_address.sql       # Adds events.address; idempotent via information_schema + PREPARE/EXECUTE
  003_sequential_orderid.sql  # orderId CHAR(3) → INT UNSIGNED, globally unique, starts at 100
  004_holders_snapshot.sql    # Adds purchases.holdersSnapshot JSON NULL
  005_tickets_merge_schema.sql # Creates tickets_v2 (merged purchases+tickets schema)
  006_guest_passes.sql        # Creates guest_passes — artist/crew/courtesy free-entry roster
  runMigrations.js            # Runs every SQL file in name order before boot
controllers/        # events, purchases, admin, guestPasses, scan
routes/             # health, events, purchases, admin, guestPasses, scan
middleware/
  requireOrganizer  # Validates Basic credentials on every /api/admin/* request
jobs/
  scheduler.js      # node-cron: stage auto-activation + expired-hold sweep
seed/
  seedOrganizer.js
  seedSampleEvent.js
  seedFromLocalStorage.js   # One-time import of legacy localStorage data
utils/
  emailNotifier.js  # sendErrorEmail — mirrors BlackCoffe's error reporting
  time.js           # UTC ↔ Bogotá helpers
current-server/     # READ-ONLY BlackCoffe reference copy — never run or import
```

**Inventory rule:** every path that touches `soldQuantity` or `reservedQuantity` uses `pool.getConnection()` → `beginTransaction()` → `SELECT … FOR UPDATE` → mutate → `COMMIT`/`ROLLBACK` in a `finally` that calls `conn.release()`. Never `pool.query` for inventory. After every increment, run the `active → sold_out` fill check; after every decrement, run the `sold_out → active` restore check. See the "Stage status lifecycle" table in the Data model section for the full matrix. Never use `GREATEST(INT UNSIGNED − n, 0)` as a safe no-op — unsigned underflow wraps to ~4 294 967 295 and violates `chkStageCapacity`.

**Auth model:** no JWT/session. `requireOrganizer` re-validates bcrypt credentials on every `/api/admin/*` request **and** on the event write routes (`POST`/`PUT /api/events`), Basic header over HTTPS. `/api/login` is rate-limited. On the client, `RequireAuth` gates every organizer route on the session-stored login — a UX funnel only; the server check is the real boundary.

**Admin endpoints (`/api/admin/*`):** `GET /purchases`, `POST /purchases/:id/confirm`, `POST /purchases/:id/reject`, `POST /sales` (walk-in), `GET /tickets` (every minted ticket joined with its stage + order — feeds `/tickets` and `/dashboard`), `PATCH /tickets/:id` (edit `holderName / holderIdNumber / holderPhone`; `validationHash` is immutable once minted), the scan endpoints `/scan/manifest` and `/scan/sync`, and the guest-passes endpoints `GET /guest-passes?eventId=`, `POST /guest-passes` (single add), `POST /guest-passes/bulk` (paste-to-bulk-add, one multi-row `INSERT`), `PATCH /guest-passes/:id`, `DELETE /guest-passes/:id` — a fully separate table from `tickets`, no price/QR/scan involved.

**Security floor:**
- Organizer password stored bcrypt-hashed in `organizers.passwordHash`. Seed by hashing — never store plaintext.
- Explicit column lists on every public `INSERT` (no `SET ?` mass-assignment).
- Parameterized queries everywhere; `helmet` on the Express app.
- SSL to the DB: `ssl: { ca: fs.readFileSync(process.env.DB_CA_CERT) }` — no `rejectUnauthorized:false`.
- `validationHash` is a random secret, never derived from buyer data.

---

## Offline scan architecture

The `/scan` route uses `useOfflineScan` backed by `scanDb.js` (IndexedDB):

1. **Before doors open:** organizer calls `downloadManifest(eventId)` → server returns all confirmed `validationHash` values → stored in IndexedDB.
2. **At the door:** `validate(hash)` is 100% local — checks cache for `valid / already_used / invalid`. Admits are written to IndexedDB immediately and queued.
3. **On reconnect:** `sync()` drains the queue to `POST /api/admin/scan/sync` (idempotent batch); server applies earliest-`usedAt` wins for conflicts.

Single-scanner assumption: two offline devices scanning simultaneously could each admit the same ticket until sync. Documented assumption; revisit if a second scanner is ever added.

---

## Component map

### Public flow (`src/components/flow/`)

| File | Role |
|------|------|
| `FlowShell.jsx` | Step container, progress indicator, back/forward. Renders an empty 44px placeholder where the back chevron would be when `onBack` is `null`, so the wordmark stays centered when the back button is intentionally suppressed. |
| `PurchaseFlow.jsx` | Steps 1–6 wired to `api/purchases.js`; WhatsApp deep-link on step 5; step 6 is a terminal success screen. `back` returns `null` for `step >= 4`, hiding the back chevron from "Ir a pagar" onward. Blocks the flow with "Ninguna etapa está activa" when `resolveActiveStage(event)` returns `null` (sold_out or all upcoming). |

### Organizer — Tickets

| File | Role |
|------|------|
| `TicketForm.jsx` | Create / edit one ticket; clipboard paste fills name+id. Phone is optional (blank stored as `"000"` sentinel so `TicketCard` keeps hiding it). Inline "no válido" errors on name + ID are suppressed until the user has typed ≥ 4 characters; submit re-validates with a `useDialog().notify` error toast on failure. |
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
| `QRScanner.jsx` | `html5-qrcode` wrapper; camera lifecycle |
| `OfflineScanner.jsx` | Offline-first scan UI, uses `useOfflineScan` |
| `ValidationResult.jsx` | Color-coded result (success / duplicate / not-found / invalid) |

### UI primitives (`src/components/ui/`)

| Primitive | Use |
|-----------|-----|
| `StatCell` | Labeled value in a dashboard grid; maps to `.stat` in astromelias.css |
| `EmptyStateCard` | Page-level "no event" placeholder |
| `FieldLabel` | Icon + label row above a form input |
| `Modal` | Generic backdrop + card; portal-rendered, Esc + click-outside to dismiss |
| `Toast` | Bottom-center status stack rendered by `DialogProvider` |
| `AsyncState` | Wraps loading / error / empty states with a retry callback |
| `Ic` | Astromelias icon primitive |
| `Money` | Renders `formatCurrency(value)` with Astromelias typography |
| `Screen` | Full-screen wrapper for public Astromelias pages |
| `StarField` | Animated canvas star background (respects `prefers-reduced-motion`) |
| `Wordmark` | Sígale logotype |

---

## Hook reference

| Hook | Returns | Notes |
|------|---------|-------|
| `useLocalStorage(initial)` | `[data, setData, { lastError, clearError }]` | Whole-blob organizer state; cross-tab sync |
| `useLocalStorageValue(key, initial)` | `[value, setValue]` | Single-key prefs (language, view toggle) |
| `useOfflineScan()` | `{ meta, cachedCount, pending, online, log, download, validate, sync }` | IndexedDB + server reconciliation |
| `usePageVisibility()` | `{ isVisible }` | Tab regain focus → re-reads storage (iOS recovery) |

---

## Util reference

| Util | Key exports |
|------|-------------|
| `sampleEvent.js` | `SAMPLE_EVENT` (dev placeholder), `resolveActiveStage(event) → stage \| null` (**returns `null` when no stage has `status === 'active'`** — does not fall back to `stages[0]`), `stageCupos(stage) → number` |
| `hashGenerator.js` | `generateTicketId() → "TKT-<8hex>-<ts>"` (walk-in only; server mints hashes for purchases) |
| `qrGenerator.js` | `generateQRData(ticket, event, eventId)`, `parseQRData(text)` — `hash` arrives from API |
| `qrCopy.js` | `copySVGToClipboard`, `copyPNGToClipboard`, `shareQR` |
| `svgTicketTemplate.js` | `generateTicketSVG(ticket, event, qrDataURL)`, `loadCharlyIllustration(base64)` |
| `timeFormat.js` | `formatTo12Hour`, `parseLocalDate`, `toLocalDateString`, `checkInWindowStatus`, `formatCurrency` |
| `csvUtils.js` | `ticketsToCSV` (round-trip), `ticketsToHumanCSV` (price column; not re-importable), `csvToTickets` |
| `ticketPasteParser.js` | `parseSingleNameAndId`, `parseTicketRows` (TSV-aware multi-row) |
| `scanDb.js` | IndexedDB CRUD for manifest cache and scan queue |
| `storage.js` | `loadFromStorage`, `saveToStorage`, `clearStorage`, version migration |
| `translations.js` | `translations` dictionary, `detectBrowserLanguage` |

---

## End-user workflows

**Public purchase (6 steps).** Buyer opens `/` → selects ticket stage + quantity → confirms order → enters holder names + chooses WhatsApp/email delivery → is shown the payment QR and bank details (back button is now locked) → opens WhatsApp with the pre-filled message and taps "Ya lo envié" → lands on a terminal success screen with their orden number and the line *"Tan pronto nuestro equipo valide tu pago te enviaremos la boleta a `<deliveryContact>` por `<WhatsApp|correo>`"*. The only exit is "Volver al inicio", which `navigate('/', { replace: true })`s back to the landing so back-navigating doesn't pop the wizard back onto the stack.

**Organizer — confirm payment + deliver ticket.** `/admin` shows the order queue. The organizer finds the orderId from the WhatsApp message, verifies the transfer, hits Confirmar pago → server marks `confirmed`, then mints tickets using `purchases.holdersSnapshot` (the buyer-entered names / IDs / phones). The organizer can pass an overriding `holders` array in the confirm body to change them before minting. Newly minted tickets appear on `/tickets` (and totals on `/dashboard`) — that's where the organizer generates / copies / shares the QR and sends it to the buyer via `deliveryMethod` + `deliveryContact`.

**Door scan.** Before doors open, organizer opens `/scan` and taps Download to seed the IndexedDB cache. At the door, scanned hashes validate locally (no network). Scans queue offline; on reconnect the queue reconciles with the server.

**Walk-in registration.** `/admin` → "+ Registrar Venta" → `/sell-tickets` (`TicketForm`) → organizer enters buyer info (phone optional) → ticket is created. The legacy inline walk-in stepper on `/admin` has been removed; collecting holder name/ID/phone up front means walk-ins appear in the same `/tickets`, `/dashboard`, and scanner manifest as purchased orders.

**Guest passes (artist/crew/courtesy).** `/admin` → "+ Agregar un artista" → `/guest-passes` → either the single-add modal (band + name + id + type) or "Pegar lista" to bulk-paste a whole band's list under one default band+type. Entries live in their own `guest_passes` table — they never appear on `/tickets`, `/dashboard`, or the scan manifest; door staff check the name/ID against this list manually. The per-band summary strip helps the organizer track how many free passes each band has used.

**Ticket sales / bulk add.** `/tickets` → Table view → "Paste Tickets" → `parseTicketRows` splits clipboard TSV → `addTicketsFromCSV` dedupes and inserts.

**Backup / handoff.** `/copy-event` exports JSON + CSV. `CreateEvent`'s "Paste from clipboard" restores a JSON export. `seedFromLocalStorage.js` in the server seeds legacy data into MySQL.

---

## Performance & limits

| Metric | Target |
|--------|--------|
| Initial JS (Home + LandingPage) | ~50 KB gz |
| `/validate-qr` (html5-qrcode chunk) | ~100 KB gz |
| Concurrent reservations | Serialized by `SELECT … FOR UPDATE` at the DB |
| orderId range | `INT UNSIGNED`, globally unique, sequential from 100 — no per-event ceiling |

---

## Security model

- **`validationHash`**: random 128-bit secret, minted at confirm. Not derived from buyer data. The scanner looks up by hash in `tickets.validationHash` (unique index).
- **Inventory**: all mutations inside `BEGIN … COMMIT` with `FOR UPDATE` locks; concurrent race goes to the DB, not the app.
- **Admin auth**: bcrypt credentials re-validated on every request by `requireOrganizer`. Rate-limited login.
- **CSV injection guard**: `csvUtils.formatCell` prepends `'` to cells starting with `=`, `+`, `-`, `@`, tab, or CR.
- **Organizer-side context**: `addTicketsFromCSV` dedupes by `buyerId|buyerName|ticketType`; `checkInTicket` returns `{ ok, reason }` to distinguish stale state from genuine duplicates.

---

## BlackCoffe guardrail

`server/current-server/` is a **read-only reference snapshot** of BlackCoffe's production server. Never execute it, never import from it. Sígale's backend is a separate app; its migrations touch only the `sigale` database tables (`organizers`, `events`, `ticket_stages`, `purchases`, `tickets`, `guest_passes`) and must never `CREATE`/`ALTER`/`DROP` BlackCoffe tables (`orders`, `deposits`, `clients`, `products`, `users`). Confirm `DB_NAME=sigale` before any DB command. Full policy in `docs/SIGALE_2.0_IMPLEMENTATION_PLAN.md §3.1`.

---

## Browser support

Chrome/Edge 90+, Firefox 88+, Safari 14+. HTTPS required for camera access and full IndexedDB availability. Required APIs: Web Crypto, localStorage, Clipboard, MediaDevices (camera), IndexedDB. Web Share API + File System Access used best-effort with feature detection.

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
node seed/seedFromLocalStorage.js  # One-time legacy import
```

---

## Cross-references

- Agent quick-reference — `/CLAUDE.md`
- Backend architecture decisions — `docs/architecture/ADR-0001-migracion-sql-express.md`
- Design tokens + Astromelias — `docs/design2.0/IMPLEMENTATION_GUIDE.md`
- Remaining build work — `docs/SIGALE_2.0_IMPLEMENTATION_PLAN.md`
- CSS module conventions — `docs/guides/css-architecture-guide.md`
- iOS Safari persistence quirks — `docs/guides/ios-persistence-guide.md`
- CSV import/export details — `docs/features/CSV_FEATURE_GUIDE.md`
- Mobile testing checklist — `docs/guides/MOBILE_TESTING.md`
