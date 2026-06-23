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
- **Tests must pass**: `npm test` covers TicketContext, hashGenerator, qrGenerator, storage, timeFormat, csvUtils. Don't break their public API.
- **Do not touch `server/current-server/`**: read-only reference copy of BlackCoffe's production server. Sígale's backend lives in `server/` and connects only to the `sigale` database. Full guardrail in `docs/SIGALE_2.0_IMPLEMENTATION_PLAN.md §3.1`.
- **DB isolation**: Sígale migrations may only `CREATE`/`ALTER` Sígale's own tables (`organizers`, `events`, `ticket_stages`, `purchases`, `tickets`). Confirm `DB_NAME=sigale` before any DB command.
- **Sales are server-side, never localStorage-only**: every ticket that must appear at `/admin`, `/tickets`, `/dashboard`, or the door scanner has to exist in the `tickets` table. Walk-in sales (`/sell-tickets` → `TicketForm`) **must** go through `admin.walkIn()` → `POST /api/admin/sales` so they mint a `confirmed` purchase with a sequential `orderId`. Do **not** use the localStorage-only `addTicket()` for real sales — `/tickets` and `/dashboard` overwrite local state with `refreshFromServer()` on mount, so anything not persisted server-side silently disappears.
- **Dashboard stats need the live event**: `EventContext` keeps the active event in memory only (never localStorage, per 2.0), so `TicketContext.data.event` is `null`. Always call `getStats(event)` with the event from `useEvent()` — bare `getStats()` resolves every price to `0` and the dashboard reads empty.

---

## Source tree

```
src/
├── App.jsx                        # Routes + provider tree; two groups: public (Astromelias) + organizer (Layout)
├── assets/
│   ├── charlyIllustration.js      # Base64 mascot embedded at build time
│   └── flyer.png
├── api/                           # Thin fetch wrappers — one file per domain
│   ├── client.js                  # Base fetch (GET/POST/PUT/PATCH/DEL); reads VITE_API_URL
│   ├── events.js
│   ├── purchases.js               # createPurchase, submitPayment (no get/recover — flow is one-way)
│   ├── admin.js                   # login, listPurchases, confirm/reject, walkIn,
│   │                              # listTickets, updateTicket
│   └── scan.js                    # getManifest, syncScans
├── components/
│   ├── Common/                    # SlideToConfirm, DebugPanel, Button.module.css, StorageErrorBanner
│   ├── Dashboard/                 # SalesDashboard, CheckInDashboard, Dashboard.shared.module.css
│   ├── Event/                     # CreateEvent (create + edit; mode prop)
│   ├── ErrorBoundary/
│   ├── Layout/                    # AdminLayout (organizer dark chrome + OrganizerMenu),
│   │                              # OrganizerMenu (slide-out nav), Navbar, Layout (legacy)
│   ├── Scanner/                   # QRScanner (html5-qrcode), ValidationResult, OfflineScanner
│   ├── Tickets/                   # TicketForm, TicketCard, TicketList, QRDisplay,
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
│   ├── TicketsPage.jsx, ValidateQRPage.jsx, CopyEventPage.jsx, DashboardPage.jsx
│   │                              # /tickets + /dashboard hydrate from /api/admin/tickets
│   │                              # on mount via TicketContext.refreshFromServer()
├── styles/
│   ├── tokens.css                 # Raw palette + semantic token assignments (import first)
│   ├── global.css
│   ├── utilities.css
│   └── astromelias.css            # Component classes: .btn, .card, .pill, .stat, .field, .trow, .t3
└── utils/
    ├── hashGenerator.js           # generateTicketId (walk-in only; server mints hashes at confirm)
    ├── qrGenerator.js             # QR data encode/parse — hash arrives from API after confirm
    ├── qrCopy.js                  # copySVGToClipboard, copyPNGToClipboard, shareQR
    ├── svgTicketTemplate.js       # PNG ticket template with Charly
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
├── migrations/001_init.sql        # DDL: organizers, events, ticket_stages, purchases, tickets
├── migrations/002_event_address.sql # adds events.address (idempotent guard via information_schema)
├── migrations/003_sequential_orderid.sql # orderId CHAR(3) → INT UNSIGNED, globally unique, starts at 100
├── migrations/004_holders_snapshot.sql   # adds purchases.holdersSnapshot JSON NULL
├── migrations/runMigrations.js
├── controllers/                   # events, purchases, admin, scan
├── routes/                        # health, events, purchases, admin, scan
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
| `/scan` | ScanPage (door scan, offline-first). **Public route** (no `RequireAuth`) so the door device doesn't need a full login, but it renders the shared `OrganizerMenu` in its topbar so it is **not** a navigation dead-end. Its `/api/admin/scan/*` calls still require organizer credentials. |

There is no public status page. Buyers see their orden number on the success screen and rely on the organizer reaching out by WhatsApp/email once the payment is confirmed.

### Organizer (wrapped in `AdminLayout`; **all gated by `RequireAuth`**)

Every organizer route below requires the admin login (`isLoggedIn()`); unauthenticated visits redirect to `/admin`. The gate is a UX funnel only — the server still re-validates organizer credentials per request.

| Path | Page |
|------|------|
| `/admin/create` | (legacy) — redirects to `/admin` |
| `/create-event` | CreateEvent component (create mode) — the single API-backed event form |
| `/edit` | CreateEvent component (edit mode); `/edit-event` redirects here |
| `/sell-tickets` | SellTicketsPage (walk-in entry). Phone field is **optional**; name and ID don't pop the "not valid" inline error until the user types ≥ 4 characters. **Persists server-side**: submitting `POST`s to `/api/admin/sales`, which mints a `confirmed` purchase with a sequential `orderId` + a server-minted ticket — so the sale shows up at `/admin` and `/tickets` immediately. The success screen shows the order number and the ticket QR (built from the `validationHash` the API now returns). It does **not** write localStorage-only tickets. |
| `/tickets` | TicketsPage (cards / table toggle, search, CSV). Hydrates from `/api/admin/tickets` on mount; this is where the organizer edits holder data and generates / shares each QR. |
| `/validate-qr` | ValidateQRPage (camera scanner) |
| `/copy-event` | CopyEventPage (JSON / CSV / PDF export, import) |
| `/dashboard` | DashboardPage — hydrates from `/api/admin/tickets` on mount so sales and check-in stats match `/admin`. |
| `*` | redirect → `/` |

Every route except Home is lazy-loaded. There is **one** event form (`CreateEvent`), wired to the API for both create and edit — the old minimal inline form on `/admin` is gone.

---

## Data model (MySQL `sigale` DB)

```
events → ticket_stages   (stages: name, price, totalQuantity, sortOrder, activatesAt)
events → purchases        (reservation lifecycle)
purchases → tickets       (minted at confirm, N per purchase)
organizers                (bcrypt-hashed credentials)
```

Event columns: `name, description, artists (JSON), eventDate, openingTime, venue, address, venueCapacity, flyerImageUrl, bankQrImageUrl, whatsappNumber, isActive`. `address` is added by `migrations/002_event_address.sql`; create/edit (`POST`/`PUT /api/events`) accept and persist it alongside `artists`, `flyerImageUrl`, and `bankQrImageUrl`.

Purchase states: `pending_payment → payment_submitted → confirmed | rejected | expired`

The buyer never sees these states — they're an organizer concern. The buyer's only outcome is "we got your message; we'll send the boleta to `<deliveryContact>`" (the success screen reads `purchases.deliveryMethod` + `purchases.deliveryContact`, which are persisted at step 5 via `POST /api/purchases/:orderId/submitted`).

`orderId` is an `INT UNSIGNED`, globally unique across all purchases, assigned sequentially starting at 100. (Migration 003 converted the original `CHAR(3)` per-event random folio.)

`holdersSnapshot` (`JSON NULL`, added by Migration 004) stores the holder names / ID numbers / phones the buyer enters during the public flow. At confirm-time `confirmPurchase` mints tickets from this snapshot unless the organizer explicitly passes overriding holder data in the request body.

`validationHash` is a **server-generated random 128-bit secret** minted when the organizer confirms (`CHAR(64)`). QR codes are NOT stored — generated on demand from the hash. Hold: `reservationExpiresAt = createdAt + 24h`; scheduler sweeps `pending_payment` past expiry; `payment_submitted` waits for organizer action.

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
| GET | `/api/admin/purchases` | Organizer |
| POST | `/api/admin/purchases/:id/confirm` | Organizer |
| POST | `/api/admin/purchases/:id/reject` | Organizer |
| POST | `/api/admin/sales` | Organizer (walk-in) — body `{ eventId, stageId, quantity, holders[] }`. Draws stage inventory, mints a `confirmed` purchase with a sequential `orderId`, and mints tickets in one transaction. Returns `{ orderId, status, minted, tickets[] }` (each ticket includes its `validationHash` so the seller's screen can render the QR without a second fetch) |
| GET | `/api/admin/tickets` | Organizer — every minted ticket from a confirmed purchase, joined with stage + order (feeds /tickets and /dashboard) |
| PATCH | `/api/admin/tickets/:id` | Organizer — edit `holderName / holderIdNumber / holderPhone`; `validationHash` is immutable once minted |
| GET | `/api/admin/scan/manifest` | Organizer |
| POST | `/api/admin/scan/sync` | Organizer |

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
