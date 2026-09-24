# Sígale — Claude Agent Guide

React 19 + Vite PWA (mobile-first, plain CSS, ES/EN) with an Express + MySQL backend. Buyers reserve online and send payment proof over WhatsApp; organizers confirm payments (minting per-seat QR hashes), deliver tickets by WhatsApp/email, and scan QRs at the door. Multi-event: each event has a `slug`, `/` lists published events, `salesOpen` is per event, and the organizer panel is scoped by the `EventBadge` switcher. Purchases never auto-deliver — the 6-step wizard at `/:slug/compra` ends on a terminal success screen; there is no status page.

Docs: `docs/architecture/PROJECT_OVERVIEW.md` (routes, API, frontend) · `docs/architecture/DB_SCHEMA.md` (schema, invariants, migrations) · `server/README.md` (env, deploy, local) · `docs/guides/css-architecture-guide.md` (styling, skins).

## Deployment

- Frontend `sigale.onrender.com` (push to `main`). API mounted inside BlackCoffe's `coffeserver.onrender.com` via `server/integration.js`: run `./sync-sigale-server.ps1`, then commit in the BlackCoffe repo.
- `npm run dev` proxies `/api` to **production** — a walk-in or event edit from localhost is a real write. Don't spin up a local stack to test what's already live.
- Roles, archive, public scanner and `preferredArtist` are live (migrations 010–014); their UI has not been click-tested end to end.

## Rules

- **Work directly on `main`, always** — no feature branches, no PRs.
- The app is `src/`, `server/`, `public/`, `tests/` and root config. Anything else is not app code; `reference/` (git-ignored, if present) is a BlackCoffe snapshot — never run, import or sync it.
- **Plain CSS**: `tokens.css` → `global.css` → `utilities.css` → `astromelias.css` → `skins/*.skin.css` → co-located `*.module.css`. No Tailwind/`@apply`. Mobile-first `min-width` queries, touch targets ≥ 44px, base font 16px. Tokens, never hardcoded colors; inside `.modal-light` the short aliases are re-pointed for the cream surface.
- **Dates / money**: `parseLocalDate`, `toLocalDateString`, `formatTo12Hour`, `formatCurrency` (`src/utils/timeFormat.js`). Never `new Date('YYYY-MM-DD')`. America/Bogota, AM/PM.
- **No native `alert` / `confirm` / `prompt`** — `useDialog()` → `confirm`, `notify`, `openCustom`.
- Code and comments in English, UI copy in Spanish (`src/utils/translations.js`, ES + EN). Components PascalCase, hooks `useX`. No raw `fetch` in components — `src/api/*.js`.
- **Verify with `npm run lint` + `npm run build`; do not run `npm test`.** Tests pin the public API of TicketContext, hashGenerator, qrGenerator, storage, timeFormat and csvUtils — keep it stable (including exports no UI uses: `addTicket`, `checkInTicket`, `clearAllData`, `checkInWindowStatus`, `ticketsToHumanCSV`, JSON QR parsing). End every piece of work by telling the user what to click through.
- **`salesOpen` gates online sales per event** (toggle in `/edit`); `LandingPage` / `PurchaseFlow` gate on `salesOpen || isDemo`. Check it before concluding the purchase flow is broken.
- **The demo is read-only server-side** (`id 1`, `slug demo`, `isDemo = 1`). Every mutating admin handler calls `assertNotDemo(conn, eventId)` → 409: `updateAdminTicket`, `confirmPurchase`, `rejectPurchase`, `createWalkInSale`, `deleteAllPurchases`, `deleteAdminTicket`, `moveAdminTicketStage`; `createPurchase` has its own check; `markUsed` (scan) is the one exemption, reset nightly by `rearmDemoTickets`. Add any new mutating handler to this list. The demo wizard is client-simulated, 1 ticket max, and hands off to seeded order #165.
- **Roles**: `organizers.role` = `super_admin` | `event_admin`; ownership via `organizer_events`. `assertOwnsEvent(conn, organizer, eventId)` → 403; `requireSuperAdmin` gates event create/archive, account management and delete-all. `isSuperAdmin()` in the UI is cosmetic.
- **orderIds are never reused** (`validationHash = HMAC(orderId, seatIndex)`): `nextOrderId` floors on `GREATEST(MAX(tickets.orderId), order_counter.highWaterMark) + 1`; `deleteAllPurchases` bumps the counter before deleting — any new bulk delete must too. Events are archived, never deleted.
- **Sales are server rows**: walk-ins go through `admin.walkIn()` → `POST /api/admin/sales` (active stage only, 409 otherwise) — never the localStorage-only `addTicket()`.
- **Every organizer read is scoped by `eventId`**: `refreshFromServer(status, eventId)` early-returns without one; `admin.list` / `listTickets` / `deleteAllPurchases` take it; `getStats(event)` needs the event from `useEvent()`.
- **`refreshOrganizerEvents`** (`EventContext`) stays `useCallback(…, [])`, reads `event` / `selectedEventId` / `selectEvent` through refs, and keeps its in-flight guard. Callers: `EventProvider`'s once-per-session bootstrap (when `isLoggedIn()`) and `OrganizerMenu` on mount. `AdminPage.Panel` treats "zero events" as real only when `organizerEventsLoaded`, and owns the `Screen` + `OrganizerTopbar` (only the body swaps). Breaking this brings back the `/admin` → `/create-event` bounce on reload.
- **Stages**: follow the invariants in `DB_SCHEMA.md` — fill check after every increment, restore check after every decrement, one `active` stage per event (DB-enforced: demote to `closed` before promoting), `closed` never reopens, never `GREATEST(unsigned − n, 0)`. `resolveActiveStage(event)` (`src/utils/stages.js`) returns `null` with no active stage — guard before `.id`.
- **`tickets` is the only order table**: one row per seat, status transitions in place per `orderId`, `validationHash` NULL until confirm (the scanner relies on it). A fresh empty DB does not bootstrap — it needs a `009_*` migration creating the merged table. Never delete or renumber migrations `001`–`005`.
- **Guest passes** (`guest_passes`) have no price, hash, QR or scan — never join them into `/tickets`, `/dashboard` or scanning.
- **DB**: Sígale owns only schema `sigale` on a shared DigitalOcean cluster. `.env.local` connects to BlackCoffe's `defaultdb` — pass `database: 'sigale'` explicitly; never touch `orders`, `deposits`, `clients`, `products`, `users`. Production mutations are irreversible: inspect read-only, then confirm the exact change with the user.
- **Reserved slugs**: `RESERVED_SLUGS` in `src/utils/slug.js` and `server/controllers/events.controllers.js` must stay byte-identical and cover every literal route.
- **No JSON export/import or event cloning** — data lives in the DB.

## Production data (read-only check 2026-09-24)

- `id 1` demo "Festival Astromelias": published, `salesOpen=0`; Etapa 3 (`id 23`) active; order #165 holds the 5 seeded scannable tickets. Don't clean up either.
- `id 3` "Noche de Girasoles" (`girasoles`): test fixture, unpublished, **`salesOpen=1`** (anyone with the link can order — close it via `/edit`); orders 166–169.
- `id 4` "ROCK EN VIVO" (`rock-en-vivo`, skin `skin-rock`): published, `salesOpen=1`; Primera Etapa (33) active, Segunda (34) and Tercera (35) upcoming.
- `order_counter.highWaterMark` was 164 while `MAX(orderId)` was 169 on 2026-08-05 (it only moves on delete-all).
- Rendered-DOM checks: `chrome.exe --headless=new --disable-gpu --virtual-time-budget=8000 --dump-dom <url>` (jsdom can't run the module build).

## Patterns to reuse

| Need | Use |
|---|---|
| Confirm / toast / custom modal | `useDialog().confirm({ title, message, danger })` · `notify({ message, tone })` · `openCustom((close) => …)` |
| Stat tile · empty state · field row · icon | `<StatCell>` · `<EmptyStateCard>` · `<FieldLabel>` · `<Ic n="…" />` |
| Public event load | `loadEventBySlug(useParams().slug)` from `useEvent()` |
| Organizer event | `event` / `selectedEventId` from `useEvent()`; pass `eventId` to every admin call |
| Guard a mutating handler | `assertNotDemo` + `assertOwnsEvent` (`server/utils/authz.js`) |
| Per-event look | `useEventSkin(slug)` + a `skins/<name>.skin.css` |
| Persisted single key | `useLocalStorageValue(key, initial)` |
| Bulk paste | `parseTicketRows(text)`; tickets: `addTicketsFromCSV(rows)` |
| WhatsApp links | `whatsappLink(number, orderId)` · `whatsappInfoLink(number, eventName)` (`src/api/purchases.js`) |

## Commands

```
npm run dev | build | preview | lint | test      # frontend (root)
cd server && npm run dev                          # local backend (runs migrations); npm run seed:all
./dev-local.ps1 [-InitDb]                         # full local stack (Windows)
./sync-sigale-server.ps1                          # deploy: mirror server/ into the BlackCoffe repo
```
