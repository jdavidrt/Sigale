# Architecture

Sígale is a mobile-first React 19 + Vite PWA with an Express + MySQL
backend. Buyers reserve seats online and send a payment screenshot over
WhatsApp; organizers confirm the payment, which mints each seat's QR hash,
deliver the ticket themselves (WhatsApp or email), and scan it at the door.
Many events sell at once, each at its own `/:slug`.

Rules and conventions for changing code live in [`/CLAUDE.md`](../../CLAUDE.md);
the schema and inventory invariants in [`DB_SCHEMA.md`](DB_SCHEMA.md); the
backend, deploy and local runs in [`/server/README.md`](../../server/README.md).

## Stack

| Layer | Choice |
|---|---|
| UI | React 19, React Router 7 (every page lazy-loaded), plain CSS (tokens + Astromelias classes + CSS Modules) |
| Build | Vite 7; static site on Render (`sigale.onrender.com`, SPA rewrite in `public/_redirects`) |
| QR | `qrcode.react` to render, `html5-qrcode` to scan (lazy chunk on `/scan`) |
| API | Express 4 + `mysql2/promise`, mounted inside BlackCoffe's server (`coffeserver.onrender.com`) |
| DB | MySQL 8, schema `sigale` on DigitalOcean |
| Jobs | `node-cron` (`server/jobs/scheduler.js`) |

## Order lifecycle

```
BUYER  /:slug/compra                ORGANIZER  /admin                 DOOR  /scan
reserve seats ───────────────────►  confirm payment ───────────────►  scan QR
tickets rows: pending_payment       status → confirmed                 isUsed = 1
"Ya lo envié": payment_submitted    validationHash minted per seat
24h unpaid hold → expired (job)     deliver from /tickets (WA/email)
reject → rejected, cupo freed
```

- **Wizard** (`PurchaseFlow`, 6 steps): quantity (+ preferred artist when the
  event has a line-up) → order summary → holders + delivery contact →
  payment QR and Bre-B key (back is locked from here) → WhatsApp screenshot
  hand-off → terminal success screen. There is no public status page; the
  20-minute countdown is cosmetic, the real hold is 24 h.
- **Gate**: the wizard opens only when `salesOpen || isDemo`, and blocks with
  "Ninguna etapa está activa" when `resolveActiveStage(event)` is `null`.
  The server additionally refuses demo, archived and `salesOpen = 0` events.
- **Demo** (`/demo`): read-only server-side. The wizard is simulated
  client-side (1 ticket max) and hands off to seeded order #165.
- **Walk-ins** (`/sell-tickets`): one seat per submit through
  `POST /api/admin/sales`, confirmed immediately, only from the `active`
  stage.

## Routes

Literal routes outrank `/:slug`; `RESERVED_SLUGS` (`src/utils/slug.js`,
byte-identical to the server copy) refuses them as slugs. Unknown paths go
to `/`.

| Path | Page | Access |
|---|---|---|
| `/` | `EventsListPage` — grid of published, non-archived events | public |
| `/:slug` | `LandingPage` — unpublished events still reachable (soft launch); 404 → `/` | public |
| `/:slug/compra` | `PurchaseFlowPage` — resolves its own event (deep-link safe) | public |
| `/scan` | `ScanPage` — pick event + type its `scanKeyword` (kept in `sessionStorage`), then scan | public |
| `/admin` | `AdminPage` — login, event hero, purchase queue (confirm / reject / share) | login |
| `/sell-tickets` | walk-in form (`TicketForm`) | organizer |
| `/tickets` | cards / table, status filter, edit holders, move stage, QR share, CSV, event-scoped delete-all | organizer |
| `/dashboard` | sales + check-in stats (confirmed rows only) | organizer |
| `/guest-passes` | artist / crew / courtesy roster, grouped by band, paste-to-bulk-add | organizer |
| `/lista-puerta` | printable door list: confirmed holders + guest passes | organizer |
| `/edit` | `CreateEvent` in edit mode (slug locked on the demo and for `event_admin`) | organizer |
| `/create-event` | `CreateEvent` in create mode | super_admin |
| `/events-admin` | every event, show archived, archive / unarchive | super_admin |
| `/organizers` | accounts, roles, passwords, event assignments | super_admin |

Organizer routes sit under `AdminLayout` + `RequireAuth` (`App.jsx`) and are
scoped to the event picked in `EventBadge` (the topbar switcher, shown when
the organizer has more than one event). Client-side role checks only hide UI;
the server enforces every gate.

## Frontend

```
src/
  App.jsx        BrowserRouter > LanguageProvider > EventProvider > TicketProvider > DialogProvider > Routes
  api/           client.js (fetch + ApiError, VITE_API_URL) and one module per resource — no raw fetch in components
  context/       EventContext   public: loadEventBySlug · organizer: organizerEvents, selectedEventId, selectEvent,
                                refreshOrganizerEvents, createEvent/updateEvent/refreshEvent
                 TicketContext  organizer ticket cache: refreshFromServer(status, eventId), getStats(event), addTicketsFromCSV
                 LanguageContext (t, ES/EN) · DialogContext (confirm, notify, openCustom)
  components/    flow/ (FlowShell, PurchaseFlow) · Event/CreateEvent · Tickets/ · GuestPasses/ · Dashboard/
                 Scanner/DoorScanner · Layout/ (AdminLayout, OrganizerTopbar, EventBadge, OrganizerMenu)
                 ui/ (Screen, StarField, Ic, Modal, Toast, StatCell, EmptyStateCard, FieldLabel) · Common/ · ErrorBoundary/
  hooks/         useEventSkin (per-event skin class) · useLocalStorageValue · useLocalStorage · usePageVisibility
  pages/         one lazy page per route
  styles/        tokens.css → global.css → utilities.css → astromelias.css → skins/*.skin.css
  utils/         timeFormat · slug · stages (resolveActiveStage, stageCupos) · qrGenerator · qrCopy · svgTicketTemplate
                 guestPassImage · csvUtils · ticketPasteParser · hashGenerator · storage · translations
```

- **Event scoping.** Every organizer read passes the selected `eventId`;
  `refreshFromServer` early-returns without one. `refreshOrganizerEvents` is
  a stable, ref-based, in-flight-guarded callback bootstrapped once per
  session by `EventProvider` and again by `OrganizerMenu` on mount.
  `AdminPage.Panel` treats "zero events" as real only once
  `organizerEventsLoaded` is true, and owns the `Screen` + `OrganizerTopbar`
  so the chrome mounts once.
- **Tickets on the client.** `TicketContext` keeps a localStorage cache
  (`sigale-event-data`) that `/tickets` and `/dashboard` hydrate from
  `GET /api/admin/tickets`. Real sales always go through the server.
- **Ticket image.** `svgTicketTemplate` renders the shareable ticket (event
  flyer embedded as a data URL, QR, holder, price); `qrCopy` copies or shares
  it as SVG/PNG. Guest passes use the same template without a QR.
- **Skins.** `useEventSkin(slug)` swaps a `.skin-*` class on `<body>`
  (`rock-en-vivo` → `skin-rock`, everything else → `skin-astromelias`). See
  [`../guides/css-architecture-guide.md`](../guides/css-architecture-guide.md).
- **PWA.** `public/sw.js` never caches `/api/` responses and always resolves
  navigation to a valid `index.html`. Scanning is online-only; IndexedDB is
  unused.

## API

Auth is HTTP Basic, re-validated with bcrypt on every `/api/admin/*` request
and on event writes (`requireOrganizer`); `requireSuperAdmin` chains after it.
Scoped handlers call `assertOwnsEvent` (403) and mutating ones
`assertNotDemo` (409).

| Method | Route | Notes |
|---|---|---|
| GET | `/api/health` | liveness, no DB |
| GET | `/api/events` | published, non-archived list rows |
| GET | `/api/events/all[?includeArchived=1]` | organizer, role-scoped; the only payload with `scanKeyword` |
| GET | `/api/events/by-slug/:slug` · `/api/events/:id` | event + stages (`cuposRestantes`) + `activeStage` |
| POST | `/api/events` | super_admin; never accepts `isDemo` |
| PUT | `/api/events/:id` | owner; omitted `isPublished` / `salesOpen` keep stored values; `scanKeyword` omit = keep, `''` = clear, else 6–80 chars; slug + `isPublished` ignored for `event_admin` and on the demo |
| PATCH | `/api/events/:id/archive` | super_admin `{ isArchived }`; not the demo |
| POST | `/api/purchases` | public reserve (max 6 seats); 409 demo / archived / sales closed; 400 without `preferredArtist` when the event has a line-up |
| POST | `/api/purchases/:orderId/submitted` | public; `{ deliveryMethod, deliveryContact, holders }` |
| POST | `/api/login` | rate-limited (10/min); returns `role` |
| GET | `/api/admin/purchases?eventId=&status=&orderId=` | one row per order with `holders[]` |
| POST | `/api/admin/purchases/:orderId/confirm` · `/reject` | mint hashes / free cupo |
| DELETE | `/api/admin/purchases?eventId=` | super_admin delete-all; bumps `order_counter` first |
| POST | `/api/admin/sales` | walk-in `{ eventId, stageId, quantity, holders[], preferredArtist }` |
| GET | `/api/admin/tickets?eventId=&status=` | `status` defaults to `confirmed`; `all` or a comma list for more |
| PATCH | `/api/admin/tickets/:id` · `/:id/stage` | edit holder fields / move stage (rebalances counters) |
| DELETE | `/api/admin/tickets/:id` | confirmed rows only |
| GET/POST/PATCH/DELETE | `/api/admin/guest-passes[?eventId=]`, `/bulk`, `/:id` | owner-scoped |
| GET/POST/PATCH/PUT | `/api/admin/organizers`, `/:id`, `/:id/events` | super_admin; refuses self-demotion and zero active super_admins |
| GET | `/api/scan/events` | public, rate-limited (120/min) |
| POST | `/api/scan` | public `{ eventId, keyword, hash }` → `ok` \| `already_used`; 403 keyword, 404 invalid, 409 other event |

## Door scan

`DoorScanner` decodes the QR (the bare hash) and `scanAndAdmit` posts it with
the chosen event and keyword. The server checks the keyword (trimmed,
case-insensitive), then `markUsed` locks the confirmed ticket by hash, checks
its event and stamps `isUsed` / `usedAt` in one idempotent transaction. The
database is the single arbiter, so two phones cannot admit the same ticket.
The UI keeps network failure (`error`, "Sin conexión") distinct from
`invalid`. Scanning the demo's seeded tickets is allowed; the nightly job
re-arms them.

## Scheduled jobs

| Job | When | What |
|---|---|---|
| `activateDueStages` | every minute + at boot | `upcoming` stages whose `activatesAt` has passed become `active` (demoting the current one to `closed`); skips archived events |
| `sweepExpiredHolds` | every minute + at boot | `pending_payment` past 24 h → `expired`, cupo returned; `payment_submitted` is never swept |
| `rearmDemoTickets` | midnight Bogotá | resets `isUsed` on the demo's seeded tickets |

## Security

- bcrypt credentials, constant-time login (unknown users compare against a
  dummy hash), inactive accounts indistinguishable from wrong passwords.
- `helmet`, 64 kb JSON bodies, parameterized queries, explicit column lists
  on every public `INSERT`.
- `validationHash` is an HMAC keyed by `SCAN_HASH_SECRET`, minted only at
  confirm; unguessable without the secret.
- `scanKeyword` is excluded from public payloads; both scan endpoints are
  rate-limited against brute force.
- CSV export prefixes formula-like cells (`= + - @`, tab, CR) with `'`.
