# Multi-event plan — implementation status

**Last updated:** 2026-08-05
**Reads alongside:** `MULTI_EVENT_PLAN.md` (the plan this tracks — see it for the full design/decisions)

## TL;DR

**STEP 1 (code, sub-steps 1.1–1.6) is done and verified locally.** **STEP 2
(deploy) is done through 2.4 — production now carries the multi-event backend
and the Astromelias row IS the demo.** Only 2.5 (frontend deploy) remains: it
needs a commit + push of this repo, which triggers Render's static build.
STEP 3 (test/validate) hasn't started.

Exit gate passed: `npm run lint` → 0 errors (2 pre-existing unrelated
warnings). `npm run build` → succeeds. Both grep audits from the plan's Step 1
exit gate pass (see "Verification" below). `npm test` was **not** run — per
CLAUDE.md the agent doesn't run it, the user does; `TicketContext.refreshFromServer`'s
signature changed (`(status)` → `(status, eventId)`) so its test may need updating.

---

## What's done, by sub-step

### 1.1 — Migration
`server/migrations/008_multi_event.sql` (new): adds `events.slug` (+
`uqEventSlug` unique index), `isPublished`, `isDemo`, `salesOpen`; creates
`order_counter` (one-row persisted orderId high-water mark, seeded from
`MAX(tickets.orderId)`). Idempotent, matches the 007-style guarded-ALTER
pattern. `server/README.md` migrations table + fresh-DB-bootstrap note updated
(the previously-earmarked "008" fresh-bootstrap migration is renumbered to 009).

### 1.2 — Backend
- `events.controllers.js` / `events.routes.js`: `GET /api/events` (published
  list), `GET /api/events/all` (organizer), `GET /api/events/by-slug/:slug`
  (no `isPublished` filter — soft-launch by link), slug validation +
  `RESERVED_SLUGS` + `ER_DUP_ENTRY` → 409, demo-safe `updateEvent` (skips
  slug/isDemo validation and writes on a demo row), `isActive` retired from
  writes.
- `purchases.controllers.js`: `createPurchase` 409s on `isDemo`/`!salesOpen`;
  `nextOrderId` now floors against `order_counter.highWaterMark` too.
- `admin.controllers.js`: new `assertNotDemo(conn, eventId)` helper, called by
  all 7 mutating handlers; `getAdminPurchases`/`getAdminTickets` take optional
  `eventId`; `createWalkInSale` uses `stage.eventId` (not body `eventId`) for
  the cascade + insert; `deleteAllPurchases` is now event-scoped, bumps
  `order_counter` before deleting, and reopens **at most one** `sold_out`
  stage guarded by "event has no other active stage."
- `jobs/scheduler.js`: `sweepExpiredHolds`'s sold_out→active restore is now
  scoped per-event (no-other-active-stage guard); new nightly `rearmDemoTickets`
  job (`0 5 * * *` = midnight Bogotá), registered but **not** run at boot
  catch-up (deliberate — see code comment).

### 1.3 — API wrappers
`src/api/events.js`: `toApiEventPayload`/`fromApiEvent` carry
slug/isPublished/isDemo/salesOpen; new `getBySlug`, `list`, `listAll`.
`src/api/admin.js`: `listTickets(status, eventId)`, `deleteAllPurchases(eventId)`.

### 1.4 — Contexts, routing, public pages, translations
- `EventContext.jsx`: rebuilt — no more auto-`getActive()` on mount. New:
  `loadEventBySlug(slug)`, `organizerEvents`, `selectedEventId`,
  `selectEvent(id)` (persisted via `sigale-selected-event-id`),
  `refreshOrganizerEvents()` (fetch + restore-or-default-to-most-recent).
  Value shape kept backward compatible — every pre-existing key
  (`event, eventLoading, eventId, createEvent, updateEvent, clearEvent,
  hasEvent, refreshEvent`) still present.
- `TicketContext.jsx`: `refreshFromServer(status, eventId)` — early-returns
  without `eventId`; `clearAllTickets(eventId)`; `fromServerTicket` maps
  `eventId`.
- `App.jsx`: `BrowserRouter` moved above the providers; `/` → `EventsListPage`;
  `/:slug` → `LandingPage`; `/:slug/compra` → `PurchaseFlowPage`; `/compra` →
  redirect `/`; `/evento/:id` → new `LegacyEventRedirect`; catch-all `*` moved
  out of the `RequireAuth` group to the top level.
- `LandingPage.jsx` / `PurchaseFlow.jsx`: both read `useParams().slug` →
  `loadEventBySlug`; CTA/wizard gate is `event.salesOpen || event.isDemo`
  (replaces the retired `ONLINE_SALES_OPEN`); demo mode stubs
  `purchases.create/submit` with local fakes, shows a persistent "Modo
  demostración" banner (via a new `banner` prop on `FlowShell`), and the
  terminal screen adds a WhatsApp hand-off button.
- `src/config.js` deleted (only consumer of `ONLINE_SALES_OPEN`).
- `translations.js`: new ES/EN keys for the demo banner/WA message, root
  landing, event selector, and the event-form's slug/isPublished/salesOpen
  fields.

### 1.5 — Organizer selector + scoping
- New `src/components/Layout/EventSelector.jsx` (plain `<select>`) rendered
  inside `OrganizerMenu`'s slide-out panel; `OrganizerMenu` itself calls
  `refreshOrganizerEvents()` unconditionally on mount (not gated behind the
  panel being open), since it's the one chrome shared by every organizer page.
- `AdminPage.jsx`: "no event → /create-event" redirect now checks
  `organizerEvents.length === 0` (not bare `!event`, which can be transiently
  null while the selector is still loading); `Home`'s `load()` scopes both
  `admin.list`/`admin.listTickets` calls to `event.id`.
- `TicketsPage.jsx` / `DashboardPage.jsx` / `DoorListPage.jsx`: all pass
  `eventId` into `refreshFromServer`/`admin.listTickets` and re-fetch on
  event-selection change. `TicketsPage`'s delete-all confirm dialog now names
  the event (`deleteAllBody` gained a `{event}` placeholder) and passes
  `event.id` to `clearAllTickets`.
- `TicketForm.jsx`/`SellTicketsPage`: added a loading guard (event can be
  transiently null) and an `EmptyStateCard` lock when `event.isDemo`; fixed a
  stray `refreshFromServer()` call that had no args.
- `CreateEvent.jsx`: new slug field (client-side regex + reserved-word check
  via new `src/utils/slug.js`, disabled + notice when editing the demo event),
  `isPublished`/`salesOpen` toggle rows. 409s surface via the existing
  `notify()` pattern.
- `GuestPassesPage.jsx`, `TicketTableRow/Table/Card`, `CSVPanel`,
  `GuestPassCard`, `SalesDashboard`/`CheckInDashboard` — audited, needed no
  changes (already correctly scoped via the `event`/`data.tickets` they
  already consume).

### 1.6 — Root landing + service worker
New `src/pages/EventsListPage.jsx` (+ `.module.css`): mobile-first single
column → grid, flyer/name/date/venue cards, "Demo" pill, `EmptyStateCard` when
empty. `public/sw.js`: `CACHE_NAME` bumped to `sigale-v3`; `handleCrossOrigin`
no longer caches `/api/` responses (network-first already, but a stale cache
hit on flaky connections would have shown stale `cuposRestantes` or a
deleted/unpublished event).

---

## STEP 2 — deployment (2.1–2.4 done 2026-08-05, 2.5 pending)

### 2.1 — Backend sync + deploy ✅
Synced into the BlackCoffe repo and redeployed by the user. Probes green:
`008_multi_event.sql` recorded in `schema_migrations` at 2026-08-05 13:25:39;
`order_counter` seeded with `highWaterMark = 164` (= `MAX(orderId)` at the
time); `GET /api/health` 200; `GET /api/events` 200; `GET /api/events/active`
still 200 (deploy-window compat); `GET /api/events/by-slug/anything` a clean
404; `GET /api/events/all` 401 without credentials. Route ordering verified
(`/active` → `/all` → `/by-slug/:slug` → `/` → `/:id`).

### 2.2 — Pre-flip inspection (read-only) ✅
Event 1 "Festival Astromelias": `slug=NULL, isActive=1, isPublished=0,
isDemo=0, salesOpen=0`. Tickets: 70 confirmed / 9 rejected / 12 expired,
orders 100–164, 66 guest passes. Stages: Etapa 2 (id 22) `sold_out` 17/17;
Etapa 3 (id 23) **`active`** 34/37, `activatesAt` 2026-07-23 21:27; Etapa 1
(id 18) `closed` 19/23. Because a stage was already `active`, the plan's
`closed`→`active` SQL rescue was **not** needed.

### 2.3 — Demo ticket seed ✅ — **order #165**
Two writes. (1) One-off SQL `UPDATE ticket_stages SET totalQuantity = 42
WHERE id = 23` (37 → 42) to make room; chosen over the plan's "event edit"
route because driving `updateEvent`'s stage reconciliation by hand-crafted
payload is far riskier than a single scoped column update. (2) One walk-in
through the production API — `POST /api/admin/sales {eventId:1, stageId:23,
quantity:5}`, holders "Invitado Demo 1–5", IDs 1000000001–1000000005 →
**orderId 165**, 5 `confirmed` rows (ids 97–101) with real server-minted
`SCAN_HASH_SECRET` HMACs, `isUsed = 0`, `orderAnchor` on row 0 only.

Net effect on the stage: 39/42 `active`, **3 cupos libres — identical to its
pre-seed appearance**. The demo's dashboard now reads 75 confirmed tickets
(70 real + 5 seeded), revenue +$225.000 vs the real Astromelias history; this
is a known, accepted cost of making the demo scannable.

### 2.4 — Demo flip ✅
```sql
UPDATE events SET slug='demo', isDemo=1, isPublished=1, salesOpen=0 WHERE id=1;
UPDATE ticket_stages SET activatesAt=NULL WHERE eventId=1 AND activatesAt IS NOT NULL;
```
The second statement satisfies the plan's "demo stages must have
`activatesAt IS NULL`" check (only Etapa 3 carried one; it was already
`active`, and `activateDueStages` only promotes `upcoming` rows, so it was
never actually reachable). **`isActive` deliberately left at 1** so
`/api/events/active` keeps answering old cached bundles through the deploy
window.

Probes all green: `by-slug/demo` → 200 with `slug=demo, isPublished=1,
isDemo=1, salesOpen=0`; `GET /api/events` → exactly one row, the demo (the
landing feed is not empty); `POST /api/purchases` on stage 23 → **409 "El
evento de demostración es de solo lectura"**; `POST /api/admin/sales` on the
demo → same 409. Re-inspection confirms both negative probes created nothing
(75 confirmed rows, `MAX(orderId)` still 165).

### 2.5 — Frontend deploy ✅
Commit `8ba64ab` pushed to `origin/main`; Render rebuilt the static site.
`DEMO_ORDER_NUMBER = 165` confirmed **in the live bundle**
(`assets/PurchaseFlowPage-C_433znk.js` → `ve=1200,ye=165`; the pre-deploy
bundle read `ye=100`). The same commit locks the demo to a single ticket per
purchase (`maxQty = isDemo ? 1 : …`) and disables the stepper at its bounds.

Probes: `sw.js` serves `CACHE_NAME = 'sigale-v3'` and is byte-identical to
`public/sw.js`, including the `isApi` guard that stops `/api/` responses
being cached; the SPA rewrite serves the shell on `/`, `/demo`,
`/demo/compra`, `/nope`, `/a/b/c`; `GET /api/events` returns exactly the
demo row, so the landing grid has a card.

**Note the rewrite makes every path return 200**, so those status codes alone
only prove the rewrite works. The client-side behavior was verified separately
— see below.

### Ring A's frontend items — verified early, against production ✅

`jsdom` **cannot** render this app (it does not execute Vite's
`type="module"` bundle — the body comes back empty), but headless Chrome can:
`chrome.exe --headless=new --disable-gpu --virtual-time-budget=8000
--dump-dom <url>`. Rendered DOM from the live site:

| Route | Rendered |
|---|---|
| `/` | "Eventos · **Demo** · Festival Astromelias · vie, 24 de jul · Acá Parchamos", card links to `/demo` |
| `/demo` | full landing — line-up, "Etapa activa Etapa 3 $45.000 · 3 cupos", CTA "Comprar boleta" |
| `/demo/compra` | "**Modo demostración — esta compra es simulada**", "Paso 1 de 6", "**Máx. 1 por persona**", stepper `− 1 +`, Total $45.000 |
| `/no-such-slug` | loads LandingPage → `by-slug` 404 → redirects to the events grid |
| `/a/b/c` | events grid (catch-all, now outside `RequireAuth`) |
| `/compra` | events grid (legacy redirect) |
| `/evento/1` | the demo landing (`LegacyEventRedirect` → `/demo`) |
| `/admin` | organizer login form |

That covers every "local, against the built frontend" box in the plan's Ring A
— though run against the deployed site rather than a local preview, which is
strictly better.

Aside: the Step 1 frontend (`745bdd9`) had **already** been deployed before
this session — `sw.js` was serving `sigale-v3` prior to this push — so `/`
was rendering the new events grid against an empty `isPublished` feed until
the 2.4 flip populated it.

---

## Verification

- `npm run lint` → **0 errors** (2 pre-existing warnings in files this work
  didn't touch: `server/controllers/scan.controllers.js`,
  `src/components/Common/SlideToConfirm.jsx`).
- `npm run build` → succeeds (only the pre-existing large-chunk-size
  advisory, unrelated).
- Grep audit #1 (`grep -rl "useEvent(" src/`): 18 matches, one is a
  comment-only false positive (`TicketContext.jsx`); every real consumer
  destructures only keys that still exist on the context value.
- Grep audit #2 (every mutating handler in `admin.controllers.js` either
  `assertNotDemo`-guarded or on the exempt list): confirmed — all 7 mutating
  handlers call it exactly once; `scan.controllers.js`'s `markUsed` has zero
  `isDemo`/`assertNotDemo` references (the deliberate exemption).
- `order_counter` is written only by `deleteAllPurchases`, read only by
  `nextOrderId` — confirmed via grep (matches plan risk #6).
- Frontend `RESERVED_SLUGS` (`src/utils/slug.js`) and backend
  `RESERVED_SLUGS` (`events.controllers.js`) are byte-for-byte identical.

---

## Judgment calls made while implementing (worth knowing before continuing)

1. **`'demo'` is deliberately NOT in `RESERVED_SLUGS`.** The plan's prose
   mentions `demo` in the illustrative reserved-word list, but Ring A's own
   test expects `POST /api/events` with slug `demo` to fail with **"Esa URL ya
   está en uso"** (the `ER_DUP_ENTRY` message), not a generic reserved-word
   message. Those two outcomes are mutually exclusive depending on check
   order. Resolution: `demo` is ordinary event data protected by the DB's
   `uqEventSlug` uniqueness, not a literal app route, so it's excluded from
   the reserved list and the *database* rejects a second claim on it. The
   `updateEvent` demo carve-out (skip slug validation/writes entirely on a
   demo row) is kept regardless, as a stronger, independent safety net.
2. **`isPublished`/`salesOpen` fall back to the current DB value when the
   request body omits them**, in `updateEvent`. Not explicitly spelled out in
   the plan, but symmetrical with the documented slug deploy-window
   tolerance: an old-frontend edit during the deploy window must not silently
   unpublish or close sales on a live event just because it doesn't know
   about the new fields yet.
3. **`eventLoading` no longer starts `true` by default** the way it did
   under the old auto-`getActive()` design — it's only ever true while a
   `loadEventBySlug`/`selectEvent` call is actually in flight. Pages that
   gate on it (`LandingPage`, `PurchaseFlow`, `AdminPage`) still work because
   each of them kicks off exactly one such call on mount.
4. **`refreshEvent()` re-fetches by `event.id`** (public, unauthenticated
   `GET /api/events/:id`) regardless of whether the event was originally
   loaded by slug (public page) or by id (organizer selection) — simpler
   than tracking "how was this loaded," and correct either way since both
   paths return the same shape.

---

## Outstanding

- ~~**`DEMO_ORDER_NUMBER` is a placeholder (`100`)**~~ — **resolved**: set to
  `165` after the 2.3 seed, and confirmed present in the built bundle.
- **The `PurchaseFlow.jsx` change is uncommitted**, so Step 2.5 (frontend
  deploy) hasn't fired. Commit + push to `origin/main` to trigger Render.
- **`npm test` hasn't been run.** `TicketContext.refreshFromServer`'s
  signature changed; its existing test (if any asserts the old 1-arg form)
  may need updating. CLAUDE.md says the user runs this pass, not the agent.
- **CLAUDE.md itself still describes the pre-multi-event world**
  (`ONLINE_SALES_OPEN`, single "the active event," no slugs) — it hasn't been
  updated to reflect this work. Not part of the plan's Step 1 scope, but
  worth doing before this drifts further from what the code actually does.
- Manual click-through hasn't happened yet — nothing has been verified in a
  live browser, only lint/build/grep and API probes. Note there is **no
  `.env.development.local`** in the repo despite CLAUDE.md referencing one;
  `VITE_API_URL` is simply unset in dev, so `client.js` falls back to a
  relative `/api` and `vite.config.js`'s proxy forwards to
  `coffeserver.onrender.com` — local `npm run dev` hits **production data**.
- **`TicketForm` sells `quantity: 1` per submit** (`TicketForm.jsx:105`), so
  the walk-in UI cannot mint a multi-seat order — only the API can. Worth
  knowing before Step 3's Ring B stage-fill tests.

---

## Next steps

- **STEP 2.5 — Frontend deploy**: commit + push; then the probe (hard-reload
  `sigale.onrender.com`, SW cache should read `sigale-v3`, `/` shows the
  events grid with the Astromelias demo card, tapping it lands on `/demo`).
- **STEP 3 — Testing & validation**: Ring A (automated, agent-run) + Ring B
  (manual, user-run), using the fabricated "Girasoles" second event as the
  multi-event test fixture. Can't meaningfully start until Step 2 has shipped
  something to test against.

---

## Files touched (this session)

**Backend**
```
server/migrations/008_multi_event.sql          (new)
server/README.md
server/controllers/events.controllers.js
server/controllers/purchases.controllers.js
server/controllers/admin.controllers.js
server/jobs/scheduler.js
server/routes/events.routes.js
```

**Frontend**
```
src/config.js                                   (deleted)
src/utils/slug.js                               (new)
src/pages/EventsListPage.jsx                    (new)
src/pages/EventsListPage.module.css             (new)
src/components/Layout/EventSelector.jsx         (new)
src/App.jsx
src/api/events.js
src/api/admin.js
src/context/EventContext.jsx
src/context/TicketContext.jsx
src/components/Layout/OrganizerMenu.jsx
src/components/Event/CreateEvent.jsx
src/components/Event/CreateEvent.module.css
src/components/flow/FlowShell.jsx
src/components/flow/PurchaseFlow.jsx
src/components/Tickets/TicketForm.jsx
src/pages/AdminPage.jsx
src/pages/TicketsPage.jsx
src/pages/DashboardPage.jsx
src/pages/DoorListPage.jsx
src/pages/LandingPage.jsx
src/utils/translations.js
public/sw.js
```
