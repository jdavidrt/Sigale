# Sígale — Claude Agent Guide

React 19 + Vite PWA (mobile-first, plain CSS, ES/EN) with an Express + MySQL backend. Buyers purchase online; organizers confirm payments, mint tickets, deliver them by WhatsApp/email, and scan QR codes at the door. Multi-event: every event has a `slug`, `/` lists `isPublished` events, each event has its own `salesOpen`, and the organizer panel is scoped by the event switcher (`EventBadge`). Purchases never auto-deliver — the 6-step wizard at `/:slug/compra` ends on a terminal success screen; there is no status page and no `/api/recover`.

Depth: `docs/architecture/PROJECT_OVERVIEW.md`. Live status: `MULTI_EVENT_PLAN_STATUS.md`.

## Deployment status (2026-09-15)

- Frontend `sigale.onrender.com`; API mounted inside the shared BlackCoffe server `coffeserver.onrender.com` (`docs/SIGALE_MERGE_INTO_SHARED_SERVER.md`). Deploy the backend with `./sync-sigale-server.ps1`, then commit in the BlackCoffe repo.
- **Phase 2 (roles, archive, public scanner, `preferredArtist`) is live**: migrations 010–014 applied (the runner runs before `listen`, and `GET /api/scan/events` answers 200), login returns `role`, the existing account is `super_admin`. Phase 2 UI has not been click-tested end to end — see `MULTI_EVENT_PLAN_STATUS.md`.
- `npm run dev` proxies `/api` to **production** (`vite.config.js`); a walk-in or event edit from localhost is a real write. Don't spin up a local stack to test what's already live.

## Rules

- **`legacy/`, `archive/`, `reference/` are out of bounds** — never import, run, or read them as a description of the app. Obsolete code moves to `legacy/` with the RETIRED banner (`legacy/README.md`).
- **Plain CSS only**: `tokens.css` → `global.css` → `utilities.css` → `astromelias.css` → co-located `*.module.css`. No Tailwind, no `@apply`. Mobile-first (`min-width` queries), touch targets ≥ 44px, base font 16px. Inside `.modal-light` the short tokens (`--cream`, `--cream-dim`, `--frame`, `--hair`, `--lilac`, `--lilac-deep`) are re-aliased for the cream surface — use tokens, never hardcoded colors, in modal content.
- **Dates / currency**: `parseLocalDate`, `toLocalDateString`, `formatTo12Hour`, `formatCurrency` from `src/utils/timeFormat.js`. Never `new Date('YYYY-MM-DD')`. America/Bogota, AM/PM.
- **No native `alert` / `confirm` / `prompt`** — `useDialog()` → `confirm`, `notify`, `openCustom`.
- Code and comments in English, UI copy in Spanish. Components PascalCase, hooks `useX`.
- **Verify with `npm run lint` + `npm run build`; do not run `npm test`** (it covers TicketContext, hashGenerator, qrGenerator, storage, timeFormat, csvUtils — keep their public API stable). End every piece of work by telling the user what to click through.
- **Online sales are per-event** (`events.salesOpen`, toggled in `/edit`); `LandingPage` and `PurchaseFlow` gate on `salesOpen || isDemo`. Check it before concluding the purchase flow is broken.
- **The demo event is read-only server-side** (`id 1`, `slug demo`, `isDemo = 1`). Every mutating admin handler calls `assertNotDemo(conn, eventId)` → 409: `updateAdminTicket`, `confirmPurchase`, `rejectPurchase`, `createWalkInSale`, `deleteAllPurchases`, `deleteAdminTicket`, `moveAdminTicketStage`; `createPurchase` has its own check; `markUsed` is the one exemption (nightly `rearmDemoTickets` resets `isUsed`). Add any new mutating handler to this list. The demo wizard is client-simulated, 1 ticket max, and hands off to seeded order #165.
- **Roles**: `super_admin` / `event_admin` on `organizers.role`, ownership via `organizer_events`. `assertOwnsEvent(conn, organizer, eventId)` → 403; `requireSuperAdmin` gates event create/archive, account management and delete-all. `isSuperAdmin()` in the UI is cosmetic — the server enforces.
- **`orderId`s are never reused**: `validationHash = HMAC(orderId, seatIndex)`, so a reissued id would make an old QR admit a new ticket. `nextOrderId` floors on `GREATEST(MAX(tickets.orderId), order_counter.highWaterMark) + 1`; `deleteAllPurchases` bumps the counter before deleting. Any new bulk-delete path must bump it too. There is no event deletion — archive instead.
- **Sales are server rows**: walk-ins go through `admin.walkIn()` → `POST /api/admin/sales` (draws only from the `active` stage, 409 otherwise). Never the localStorage-only `addTicket()`.
- **Every organizer read is scoped by `eventId`**: `TicketContext.refreshFromServer(status, eventId)` early-returns without one; `admin.list` / `listTickets` / `deleteAllPurchases` take it. `getStats(event)` needs the event from `useEvent()`.
- **`refreshOrganizerEvents`** (`EventContext`) stays `useCallback(…, [])`, reads `event` / `selectedEventId` / `selectEvent` through refs, and keeps its in-flight guard. Callers: `EventProvider`'s once-per-session bootstrap (when `isLoggedIn()`) and `OrganizerMenu` on mount. `AdminPage.Panel` branches on "zero events" only when `organizerEventsLoaded`, and owns the `Screen` + `OrganizerTopbar` (only the body swaps) so the chrome mounts once. Breaking any of this brings back the `/admin` → `/create-event` bounce on reload.
- **Stage inventory**: see "Stage invariants" — every path that changes `soldQuantity` / `reservedQuantity` runs the fill or restore check; one `active` stage per event is DB-enforced; `closed` never reopens; `GREATEST(unsigned − n, 0)` wraps to 4 294 967 295.
- **`resolveActiveStage(event)` returns `null`** with no active stage — guard before `.id`.
- **`tickets` is the only order table** (`purchases` was merged; `docs/architecture/TICKETS_SCHEMA.md`). One row per seat, status transitions in place per `orderId`, `validationHash` minted only at confirm. The cutover already ran in production (`purchases_legacy_v1` / `tickets_legacy_v1` remain; `runMigrations.js` force-marks 001–005 applied when it sees them). `legacy/server/merge_purchases_into_tickets.js` must never run again. A fresh empty DB does not bootstrap — it needs a `009_*` migration creating the merged table.
- **Guest passes** (`guest_passes`) are separate from tickets — no price, hash, QR or scan; never join them into `/tickets`, `/dashboard` or scanning.
- **DB**: Sígale owns only its tables in schema `sigale` on a shared DigitalOcean cluster. `.env.local` connects to BlackCoffe's `defaultdb` — pass `database: 'sigale'` explicitly; never touch BlackCoffe tables (`orders`, `deposits`, `clients`, `products`, `users`). Production mutations are irreversible: inspect read-only, then confirm the exact change with the user.
- **No JSON export/import or event cloning** — data lives in the DB; don't rebuild `/copy-event`.

## Production data (2026-08-05 snapshot, unverified since)

- `id 1` demo (Astromelias): `isPublished=1`, `salesOpen=0`; Etapa 3 (`id 23`) is the active stage; order #165 holds the 5 seeded scannable tickets. Don't clean up either.
- `id 3` "Noche de Girasoles" (`slug girasoles`): test fixture, `isPublished=0`, **`salesOpen=1`** (anyone with the link can order — close it via `/edit`); orders 166–169; Etapa 1 (31) `closed`, Etapa 2 (32) `active`.
- `order_counter.highWaterMark` = 164 while `MAX(orderId)` = 169 (the counter only moves on delete-all).
- Rendered-DOM checks: `chrome.exe --headless=new --disable-gpu --virtual-time-budget=8000 --dump-dom <url>` (jsdom can't run the module build). Chrome/Edge are under `C:\Program Files`.

## Source tree

```
src/
  App.jsx           routes + providers (BrowserRouter > Language > Event > Ticket > Dialog); public group + AdminLayout group
  api/              client.js (fetch + ApiError, VITE_API_URL)
                    events.js   getById, getBySlug, list, listAll(opts,{includeArchived}), create, update, archive
                                + toApiEventPayload / fromApiEvent / fromApiEventListItem / deriveTicketTypes
                    purchases.js create, submit · admin.js login, list, confirm, reject, walkIn, listTickets(status,eventId),
                    updateTicket, updateTicketStage, deleteTicket, deleteAllPurchases(eventId) + getAuth/isLoggedIn/logout/getRole/isSuperAdmin
                    organizers.js · guestPasses.js · scan.js scanAndAdmit(hash,{eventId,keyword}), listScanEvents, SCAN_RESULT (online only)
  components/
    Layout/         AdminLayout → OrganizerTopbar (brand + EventBadge + OrganizerMenu). EventBadge: flyer thumb + name, opens a
                    switcher sheet when organizerEvents.length > 1. OrganizerMenu: slide-out nav (LINKS list; superOnly entries).
    Event/          CreateEvent — the single event form (create + edit)
    Tickets/        TicketForm (walk-in), TicketCard, QRDisplay, TicketTable(+Row), TicketsViewToggle, TicketEditConfirm, CSVPanel
    flow/           FlowShell, PurchaseFlow — 6 steps, back locked from step 4, demo mode stubbed (DEMO_ORDER_NUMBER 165), no demo banner
    GuestPasses/ · Dashboard/ · Scanner/OfflineScanner (name historical; online only) · Common/ (SlideToConfirm, StorageErrorBanner)
    ui/             StatCell, EmptyStateCard, FieldLabel, Modal, Toast, Ic, Screen, StarField
  context/          EventContext (event, eventLoading, organizerEvents, organizerEventsLoaded, organizerEventsError, selectedEventId
                    [localStorage 'sigale-selected-event-id'], selectEvent, refreshOrganizerEvents, loadEventBySlug, create/update/refreshEvent)
                    TicketContext (refreshFromServer, getStats(event), addTicketsFromCSV, clearAllTickets) · LanguageContext (t) · DialogContext
  pages/            EventsListPage, LandingPage, PurchaseFlowPage, AdminPage (Login / Panel / Home), ScanPage, CreateEventPage, EditEventPage,
                    SellTicketsPage, TicketsPage, DashboardPage, GuestPassesPage, DoorListPage, EventsAdminPage, OrganizersAdminPage (all lazy)
  utils/            timeFormat, slug (RESERVED_SLUGS — byte-identical to the server's), qrGenerator (QR = bare hash), qrCopy, svgTicketTemplate,
                    guestPassImage, csvUtils, ticketPasteParser, hashGenerator, storage, translations, sampleEvent (resolveActiveStage)
  styles/           tokens.css, global.css, utilities.css (.modal-light), astromelias.css (.btn .card .pill .chip .stat .field .trow .tb-btn .label …)
server/
  index.js (helmet + CORS + routes + runMigrations) · integration.js (mountSigale for BlackCoffe — keep its mounts in sync with index.js)
  db.js (pool → sigale) · middleware/requireOrganizer.js (+ requireSuperAdmin) · utils/authz.js (assertNotDemo, assertOwnsEvent)
  controllers/ + routes/  events, purchases, admin, guestPasses, scan, organizers
  jobs/scheduler.js  activateDueStages, sweepExpiredHolds (24h), rearmDemoTickets (nightly, midnight Bogotá)
  migrations/  001–005 pre-cutover (skipped on migrated DBs) · 006 guest_passes · 007 single active stage · 008 multi-event
               010 roles + organizer_events · 011 preferredArtist · 012 isArchived · 013 scanKeyword · 014 promote account to super_admin
legacy/ reference/ archive/ prototype-2.0/   history only
```

## Routes

Literal routes outrank `/:slug`; `RESERVED_SLUGS` refuses them at creation.

| Path | Notes |
|---|---|
| `/` | Grid of `isPublished` events |
| `/:slug` | Landing; unpublished events are reachable by link (soft launch). 404 → `/` |
| `/:slug/compra` | Wizard, resolves the event itself; gated on `salesOpen \|\| isDemo`; blocked without an active stage |
| `/admin` | Login → `Panel`: loading with chrome until `organizerEventsLoaded`; zero events → `/create-event` (super_admin) or empty state; else `Home` (hero, walk-in link, guest-pass link, purchase queue with confirm/reject/share) |
| `/scan` | Public scanner: pick event (`GET /api/scan/events`) + `scanKeyword` (sessionStorage) → `POST /api/scan`. No organizer chrome |
| `/compra`, `/evento/:id`, `/admin/create`, `/validate-qr`, `*` | Legacy redirects; `*` → `/` outside `RequireAuth` |

Organizer routes (`AdminLayout`, `RequireAuth`, scoped by the selected event): `/create-event` (super_admin), `/edit` (slug locked on demo and for event_admin; has `scanKeyword`), `/sell-tickets` (walk-in, one seat per submit, required `preferredArtist` when the event has a line-up), `/tickets` (cards/table, edit holders, stage move, QR share, event-scoped delete-all), `/dashboard`, `/guest-passes`, `/lista-puerta` (printable), `/events-admin` (super_admin: list, show-archived, archive/unarchive, "Crear evento" → `/create-event`), `/organizers` (super_admin: accounts, roles, passwords, event assignments).

## Data model (`sigale`)

```
events → ticket_stages   name, price, totalQuantity, soldQuantity, reservedQuantity, sortOrder, activatesAt, status
events → tickets         one row per seat; orderId shared per order; status pending_payment → payment_submitted → confirmed | rejected | expired
events → guest_passes    band, holderName, holderIdNumber, type ENUM(artist, crew, courtesy)
organizers               bcrypt credentials, role, isActive  ↔  organizer_events(organizerId, eventId)
order_counter            one row: highWaterMark
```

- `events`: `slug` VARCHAR(80) NULL + unique (`^[a-z0-9]+(-[a-z0-9]+)*$`, reserved → 409, duplicate → 409 "Esa URL ya está en uso"; `demo` is not reserved); `isPublished` gates `/` only; `isDemo` never writable via the API (`updateEvent` ignores submitted `slug`/`isDemo` on the demo); `salesOpen`; `isArchived` (reversible, super_admin, replaces deletion, demo never archivable); `scanKeyword` (never in a public payload; edit form prefills it from the organizer list, not the edit fetch); `isActive` is retired — only `GET /api/events/active` reads it.
- `tickets`: `orderId` INT UNSIGNED from 100, one sequence across events, floored by `order_counter`; `orderAnchor` (first row of an order) carries the UNIQUE; quantity/total = `COUNT(*)` / `SUM(unitPrice)` `GROUP BY orderId`; holder fields on each row, positional (`holders[i]` → i-th row); `preferredArtist` order-invariant, required at the API when the event has a line-up; `deliveryMethod` / `deliveryContact` set at step 5; `reservationExpiresAt = createdAt + 24h` (NULL for walk-ins); `validationHash = HMAC_SHA256(SCAN_HASH_SECRET, "orderId:seatIndex")[0:16]`, NULL until confirm — the scanner relies on that; `SCAN_HASH_SECRET` must be set on Render and rotating it invalidates every QR. QR encodes the bare hash.

## Stage invariants

`status ENUM(upcoming, active, sold_out, closed)`. The scheduler handles `upcoming → active` on `activatesAt`; every other transition is done by the code path that changes the counters.

- `sold_out` = temporarily full, auto-restored when capacity frees. `closed` = permanent, nothing restores it. Never mark a superseded or orphaned stage `sold_out`.
- One `active` stage per event, enforced by `uqOneActiveStagePerEvent` (generated `activeFlag`). Any promotion (`updateEvent` reconciliation, `activateDueStages`, the sold-out cascade) must first demote the current active stage to `closed` in the same transaction or MySQL throws `ER_DUP_ENTRY`.
- Fill check after any increment — `createPurchase`, `createWalkInSale` (both lock `WHERE status = 'active'` first):
  `UPDATE ticket_stages SET status='sold_out' WHERE id=? AND status='active' AND soldQuantity+reservedQuantity >= totalQuantity`
- Cascade: when filled, promote the next `upcoming` stage with no `activatesAt`; if one is promoted, set the filled stage `closed`.
- Restore check after any decrement — `rejectPurchase`, `deleteAdminTicket` (confirmed rows only; others 409), `sweepExpiredHolds`, `updateEvent` (raised quota), `deleteAllPurchases`:
  `UPDATE ticket_stages SET status='active' WHERE id=? AND status='sold_out' AND soldQuantity+reservedQuantity < totalQuantity`
  `sweepExpiredHolds` and `deleteAllPurchases` add a "no other active stage" guard; `deleteAllPurchases` reopens at most one stage.
- `confirmPurchase` moves reserved → sold, no status change.
- `deleteAllPurchases`: only `confirmed` rows held sold and only `pending_payment` / `payment_submitted` held reserved — `rejected` / `expired` were already released, and counting them underflows. Requires `eventId`, bumps `order_counter` first, deletes every status.
- `updateEvent` → 409 if a stage's `totalQuantity` would drop below sold + reserved; `CreateEvent` pipes `ApiError.message` to `notify()`.

## API

Auth: Basic, re-validated per request by `requireOrganizer` on `/api/admin/*` and on event writes. Event route order: `/active` → `/all` → `/by-slug/:slug` → `/` → `/:id`.

| Method | Route | Notes |
|---|---|---|
| GET | `/api/health` | public |
| GET | `/api/events` | public; `isPublished = 1 AND isArchived = 0`, list rows |
| GET | `/api/events/active` | legacy; don't build on it |
| GET | `/api/events/all[?includeArchived=1]` | organizer; role-scoped |
| GET | `/api/events/by-slug/:slug` · `/api/events/:id` | public; no `isPublished` filter |
| POST | `/api/events` | super_admin; accepts `slug` / `isPublished` / `salesOpen`, never `isDemo` |
| PUT | `/api/events/:id` | owner; omitted `isPublished` / `salesOpen` keep stored values; `scanKeyword` omit = keep, `''` = clear, else 6–80 chars; slug + `isPublished` ignored for event_admin |
| PATCH | `/api/events/:id/archive` | super_admin `{ isArchived }`; `assertNotDemo` |
| POST | `/api/purchases` | public; 409 when demo / archived / `salesOpen = 0`; 400 without `preferredArtist` when the event has a line-up |
| POST | `/api/purchases/:orderId/submitted` | public |
| POST | `/api/login` | rate-limited; returns `role` |
| GET | `/api/admin/purchases?status=&orderId=&eventId=` | one row per order (`quantity`, `totalAmount`, `holders[]`); `eventId` required |
| POST | `/api/admin/purchases/:orderId/confirm` · `/reject` | `assertNotDemo` + `assertOwnsEvent` |
| POST | `/api/admin/sales` | walk-in `{ eventId, stageId, quantity, holders[], preferredArtist }`; active stage only; returns tickets with `validationHash` |
| GET | `/api/admin/tickets?status=&eventId=` | `status` defaults to `confirmed` (protects dashboard stats); `all` or a comma list for more; `eventId` required |
| PATCH | `/api/admin/tickets/:id` · `/:id/stage` | edit holder fields / move stage (rebalances counters); hash immutable |
| DELETE | `/api/admin/tickets/:id` | confirmed rows only (409 otherwise) |
| DELETE | `/api/admin/purchases?eventId=` | super_admin delete-all; bumps `order_counter` |
| POST | `/api/admin/scan` | legacy `{ hash }`; not `assertNotDemo`-guarded on purpose |
| GET | `/api/scan/events` · POST `/api/scan` | public, rate-limited; `{ eventId, keyword, hash }` → 400 / 403 wrong keyword / 404 / 409 other event / `ok` \| `already_used` |
| GET/POST/POST/PATCH/DELETE | `/api/admin/guest-passes[?eventId=]`, `/bulk`, `/:id` | owner-scoped |
| GET/POST/PATCH/PUT | `/api/admin/organizers`, `/:id`, `/:id/events` | super_admin; never returns `passwordHash`; refuses to demote yourself or leave zero active super_admins |

## Patterns to reuse

| Need | Use |
|---|---|
| API call | `src/api/*.js` — never raw `fetch` in a component |
| Confirm / toast / custom modal | `useDialog().confirm({ title, message, danger })` · `notify({ message, tone })` · `openCustom((close) => …)` |
| Stat tile · empty state · field row · icon | `<StatCell>` · `<EmptyStateCard>` · `<FieldLabel>` · `<Ic n="…" />` |
| Public event load | `loadEventBySlug(useParams().slug)` from `useEvent()` |
| Organizer event | `event` / `selectedEventId` from `useEvent()`; pass `eventId` to every admin fetch |
| Guard a mutating handler | `assertNotDemo` + `assertOwnsEvent` from `server/utils/authz.js` |
| Slug validation | `src/utils/slug.js` (mirror of the server list) |
| Persisted single key | `useLocalStorageValue(key, initial)` |
| Bulk paste | `parseTicketRows(text)`; tickets: `addTicketsFromCSV(rows)` |

## Commands

```
npm run dev | build | preview | lint | test      # frontend (root)
cd server && node index.js                        # local backend only (runs migrations); seeds in server/seed/
./sync-sigale-server.ps1                          # deploy: mirror server/ into the BlackCoffe repo
./dev-local.ps1 [-InitDb]                         # full local stack
```

Browsers: Chrome/Edge 90+, Firefox 88+, Safari 14+; HTTPS for the camera; IndexedDB unused.
