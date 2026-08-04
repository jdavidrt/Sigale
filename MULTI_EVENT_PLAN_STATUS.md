# Multi-event plan — implementation status

**Last updated:** 2026-08-04
**Reads alongside:** `MULTI_EVENT_PLAN.md` (the plan this tracks — see it for the full design/decisions)

## TL;DR

**STEP 1 (code, sub-steps 1.1–1.6) is done and verified locally.** Nothing has
touched production. STEP 2 (deploy) has not started — it's a gated sequence
that needs explicit go-ahead per sub-step, per the plan. STEP 3 (test/validate)
hasn't started either.

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

## Outstanding before Step 2 (deploy)

- **`DEMO_ORDER_NUMBER` in `src/components/flow/PurchaseFlow.jsx` is a
  placeholder (`100`).** It must be updated to the real orderId once Step
  2.3's production walk-in seed runs (seeding the 5 "Invitado Demo" tickets)
  — the constant is what the demo wizard's terminal WhatsApp message
  references, and it has to match a real ticket the organizer can share back.
- **`npm test` hasn't been run.** `TicketContext.refreshFromServer`'s
  signature changed; its existing test (if any asserts the old 1-arg form)
  may need updating. CLAUDE.md says the user runs this pass, not the agent.
- **CLAUDE.md itself still describes the pre-multi-event world**
  (`ONLINE_SALES_OPEN`, single "the active event," no slugs) — it hasn't been
  updated to reflect this work. Not part of the plan's Step 1 scope, but
  worth doing before this drifts further from what the code actually does.
- Manual click-through hasn't happened yet (`npm run dev` locally against
  prod data, per `.env.development.local`) — nothing in Step 1 was verified
  in a live browser, only lint/build/grep.

---

## Next steps

- **STEP 2 — Deployment** (`MULTI_EVENT_PLAN.md` §"STEP 2"): gated sequence,
  backend-first. Sub-steps 2.1 (sync + deploy backend), 2.2 (read-only
  pre-flip inspection), **2.3 and 2.4 mutate production and require explicit
  user confirmation before each** (seed the demo walk-in tickets, then flip
  `isDemo=1`), 2.5 (frontend deploy). Do not start this without the user's
  go-ahead.
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
