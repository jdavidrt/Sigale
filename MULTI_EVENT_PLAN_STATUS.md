# Multi-event plan — implementation status

**Last updated:** 2026-09-15
**Reads alongside:** `MULTI_EVENT_PLAN.md` (design history + the Phase 2 spec)

## Current state (2026-09-15)

**Phase 1 (multi-event) shipped 2026-08-05.** Everything from "TL;DR" down is
that day's snapshot.

**Phase 2 (roles, archive, public scanner, preferred artist) — code complete
and the backend is live on production.** Spec: `MULTI_EVENT_PLAN.md` → "Phase
2"; schema: `docs/architecture/DB_SCHEMA.md`. Migrations 010–014 applied (the runner runs before `listen`;
`GET /api/scan/events` answers 200; login returns `role`; the account is
`super_admin`). Not yet done: the Phase 2 "Verification" click-through. Skipped
on purpose: the dashboard "Boletas por artista" breakdown and a
`preferredArtist` CSV column (would touch tested `getStats` / `csvUtils`).

**Frontend fixes shipped 2026-09-15:**
- `/admin` reload bounce to `/create-event`: `Panel` treated the initial
  `organizerEvents = []` as "zero events" while the list was still loading;
  with `super_admin` live that fired `<Navigate>` on first render. Fixed with
  `organizerEventsLoaded` in `EventContext`; `Panel` now owns the `Screen` +
  `OrganizerTopbar` and swaps only the body. Reproduced and verified in
  headless Chrome against a mock API (2.5s latency): `/api/events/all` ×1,
  `/api/events/:id` ×1 per cold load.
- `refreshOrganizerEvents` made ref-based, `deps []`, in-flight guarded;
  `EventProvider` bootstraps it once per session when logged in.
- `EventSelector` (`<select>`) → `EventBadge` (flyer thumb + name + switcher
  sheet, tappable when >1 event) in the new `OrganizerTopbar` and in
  `OrganizerMenu`; old component in `legacy/src/`.
- `/events-admin` gained a "Crear evento" button; `.modal-light` now
  re-aliases `--lilac` so form labels read on the cream surface.
- Not yet click-tested by the user.

**Corrections to the 2026-08-05 snapshot below:**
- The "Modo demostración" banner was removed (`ea3187e` / `f4f55f3`); steps
  1–5 give no simulated-purchase hint. Left as-is (user decision 2026-09-11).
- Every "still open" item below is unverified as of today.

**Still open from Phase 1 (production data, not code):**
1. **Girasoles rests dirty** — orders 166–169, Etapa 1 `closed` 4/5, Etapa 2
   `active` 0/10, **`salesOpen = 1`** (anyone with the link can order). Set
   `salesOpen = 0` via `/edit`.
2. **orderId-never-reused unverified** — `order_counter.highWaterMark` 164 vs
   `MAX(orderId)` 169. Run delete-all on Girasoles (or
   `scratchpad/b7-orderid.mjs`) or record as accepted-unverified.
3. **Nightly rearm unverified** — demo ticket 97 (`95cb147cf9b94482`) left
   `isUsed = 1` on 2026-08-05; a scan returning `ok` proves the job.
4. **Never clicked** — the event switcher, the delete-all confirm naming the
   event, `/demo/compra` steps 2–6 + WhatsApp hand-off, the `/create-event` +
   `/edit` forms.

**Do not re-send Ring A's pre-flip probe** (`POST /api/purchases` on a
Girasoles stage) — `salesOpen` is 1, it would mint a real order.

---

## TL;DR

**STEP 1 (code) and STEP 2 (deploy) are complete.** Production runs the
multi-event platform: the Astromelias row is the read-only demo at `/demo`,
and the frontend is deployed. **Ring A is fully green, and Ring B was run at
the API level on 2026-08-05** with explicit user authorization to drive the
production API — a real purchase on Girasoles (order #166) through
create → submit → confirm → scan, all 7 demo read-only 409s, the full
sold-out cascade + reject scenario, and per-event scoping across tickets,
purchases and guest passes. **Every server-side Ring B behavior passed.**

What is still open: (1) the **orderId-never-reused / delete-all** item, which
the user chose to skip, so Girasoles rests with 5 test tickets and
`salesOpen = 1`; (2) the **click-through half** of the items verified via the
API — no React component was driven in a browser beyond read-only render
probes; (3) the `/create-event` and `/edit` **form UI**; (4) the demo
wizard's **steps 2–6** and its WhatsApp hand-off; (5) the **nightly rearm**,
checkable 2026-08-06; (6) `npm test`.

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

## STEP 3 — testing & validation (Ring A ✅, Ring B API-level ✅ / click-through pending)

### Girasoles fixture ✅ — event id **3**

Created 2026-08-05 via `POST /api/events` with organizer credentials, **not**
through the `/create-event` form. The API path was chosen over the raw-SQL
alternative deliberately: it runs the real slug validation and
`insertStages()` status logic, whereas hand-written `ticket_stages` rows
would have meant setting `status`/`sortOrder` manually and risking the
`uqOneActiveStagePerEvent` invariant.

`slug girasoles`, `isPublished 0`, `salesOpen 0`, aforo 80, lineup "Los
Cardos / Cassette Beta / La Previa", eventDate 2026-09-12 20:00. Stage **31**
"Etapa 1" `active` 0/5 @ $20.000; stage **32** "Etapa 2" `upcoming` 0/10 @
$30.000, both `activatesAt NULL` so the cascade (not the scheduler) promotes
Etapa 2. Flyer/bank-QR reuse Astromelias' Cloudinary URLs so the wizard's
payment step renders a real QR for Ring B's purchase test.

It is event id **3**, not 2: the `slug: 'demo'` duplicate probe burned an
auto-increment value, because `ER_DUP_ENTRY` on `uqEventSlug` fires *after*
the INSERT is attempted.

### Ring A ✅ — every box green in one pass, 2026-08-05

API probes: published-only landing feed; `by-slug` for demo, for
unpublished Girasoles (soft-launch), and a clean 404 for an unknown slug;
`/events/active` still resolving; both demo write-rejections (409 *"solo
lectura"* on `POST /api/purchases` and on `POST /api/admin/sales`); the
one-shot pre-flip `salesOpen=0` 409 on Girasoles; and both slug rejections
with their two **distinct** messages — *"Esa URL está reservada, elige
otra"* for `admin` vs *"Esa URL ya está en uso"* for `demo`, which is
exactly what judgment call #1 was designed to produce.

Frontend probes: run against the **deployed** site via headless Chrome (see
the 2.5 section for why jsdom cannot do this) — `/`, `/demo`,
`/demo/compra`, `/girasoles`, `/girasoles/compra`, `/nope`, `/a/b/c`,
`/compra`, `/evento/1`, `/admin`. `/girasoles` renders "Etapa 1 activa /
Etapa 2 Próximamente" with the CTA **"Adquiere tu entrada en taquilla"**,
confirming the per-event `salesOpen` gate end to end.

Re-inspection after the negative probes confirmed they created nothing.

### Ring B — run at the API level 2026-08-05 ✅ (one item skipped)

The user authorized driving the production API directly, overriding the
plan's risk #7 ("only the user mints real rows"). Each item below was
exercised through the **exact endpoints the UI calls**, with a read-back
after every write. Scripts live in this session's scratchpad
(`b1-salesopen`, `b2-purchase`, `b3-demo`, `b5-scoping`, `b6-stages`,
`b7-orderid`, `render.mjs`).

**This covers all server-side behavior and none of the React components.**
Where an item says "(API)", the server half passed and the click-through is
still open.

| Item | Result |
|---|---|
| `salesOpen` flip via `PUT /api/events/3` | ✅ 0→1; `isPublished` still 0; slug intact; **stages 31/32 kept ids, names, prices, statuses** — the stage-reconciliation path that caused the 2026-07-20 incident behaved |
| Real purchase, order **#166** | ✅ reserve (qty 2) → `submitted` (contact + 2 holders persisted) → confirm (2 rows, ids 102/103, real HMACs; 2 reserved → 2 sold) |
| Scan | ✅ `ok` → `already_used`; bogus hash → 404 `invalid` |
| Admin scoping of that order | ✅ present under `eventId=3`, absent under `eventId=1` |
| Demo read-only | ✅ **all 7** mutating handlers → 409 *"…solo lectura"*; 96 rows before = 96 after; ticket 97 unchanged |
| Demo scan exemption | ✅ `ok` → `already_used` on ticket 97 |
| Guest-pass scoping | ✅ pass added to Girasoles/"Los Cardos" landed on event 3, demo's 66 untouched; removed afterwards |
| `status` defaults to `confirmed` | ✅ 75 of 96 demo rows — the `/dashboard` invariant |
| **Sold-out cascade** | ✅ Etapa 1 filled 5/5 → promoted Etapa 2 to `active` and set Etapa 1 to **`closed`, not `sold_out`**; exactly one active stage throughout |
| Walk-in on the superseded stage | ✅ 409 *"La etapa seleccionada no está disponible para venta"* |
| **Reject on a `closed` stage** | ✅ 200, no `ER_DUP_ENTRY`, Etapa 1 not resurrected, no unsigned underflow (4s+0r/5) — the 2026-07-21 incident, reproduced and passed |
| Demo as bystander | ✅ its three stages identical before and after the whole run |
| Browser render (`/girasoles`, `/girasoles/compra`, `/`) | ✅ CTA flipped to "Comprar boleta"; wizard opens with no demo banner and "Máx. 6 por persona"; `/` still shows only the demo card |
| **orderId never reused / delete-all** | ⛔ **SKIPPED — user decision** (see Outstanding) |

**Still never rendered in a browser:** the `/create-event` and `/edit` form
UI — the slug input's live regex/reserved-word feedback, the
`sigale…/<slug>` prefix, and the `isPublished`/`salesOpen` toggle rows. The
`salesOpen` flip above went through the API, so `updateEvent`'s stage
reconciliation is now proven, but the form that drives it is not.

---

## Verification

- `npm run lint` → **0 errors** (2 pre-existing warnings in files this work
  didn't touch: `server/controllers/scan.controllers.js`,
  `src/components/Common/SlideToConfirm.jsx`).
- `npm run build` → succeeds (only the pre-existing large-chunk-size
  advisory, unrelated).
- **`npm test` → passing** (user-run, 2026-08-05). The anticipated
  `TicketContext.refreshFromServer` signature fallout (`(status)` →
  `(status, eventId)`) did not materialise into a failure.
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

**Still open:**

- **⛔ orderId-never-reused is UNVERIFIED, and the hazard is live.** The user
  chose to skip the delete-all on 2026-08-05. The scenario is specific: the
  demo's `MAX(orderId)` is **165**, Girasoles now holds **166–169**, and
  `order_counter.highWaterMark` still reads **164** (it only moves when
  `deleteAllPurchases` runs). If Girasoles' rows are ever wiped and the
  high-water mark does *not* advance, the next order is reissued **166** —
  and since `validationHash = HMAC(orderId, seatIndex)`, ticket 102's
  already-minted QR would admit a different, newer ticket. The code to
  prevent this exists and looks correct; it has simply never been executed in
  production. Ready-to-run script: `scratchpad/b7-orderid.mjs` (it wipes only
  `eventId=3`, then asserts the bump, a strictly-higher next orderId, and a
  404 on every orphaned hash).
- **Girasoles rests dirty.** 5 test tickets (orders 166–169: 4 confirmed,
  1 rejected), Etapa 1 `closed` 4/5, Etapa 2 `active` 0/10, and
  **`salesOpen = 1`**. It is `isPublished = 0` so it is invisible on `/`, but
  **anyone with the `/girasoles` link can place a real online order against a
  fabricated event.** Set `salesOpen = 0` via `/edit` once the manual pass is
  done. Note that after the cascade, Etapa 1 is `closed` — nothing restores
  from `closed` by design, so if Girasoles is later edited into the first
  real event, its stage line-up needs rebuilding rather than reopening.
- **The click-through half of Ring B — partly closed 2026-08-05.** The user
  walked the purchase wizard in the browser and reported it working, so the
  6-step flow is verified in the UI as well as at the API. Still unclicked:
  `EventSelector` across the organizer pages, the delete-all confirm dialog's
  event name, the organizer pages' re-fetch-on-selection-change, and the demo
  wizard's steps 2–6 + WhatsApp hand-off.
- **The `/create-event` and `/edit` forms have never rendered in a browser.**
  `updateEvent`'s stage reconciliation is now proven via the API (stages
  31/32 survived the `salesOpen` flip intact), but the slug input's inline
  validation, the `sigale…/<slug>` prefix, and the `isPublished`/`salesOpen`
  toggle rows are untested UI.
- **The demo-rearm job is unverified — checkable 2026-08-06.**
  `rearmDemoTickets` runs at `'0 5 * * *'` (midnight Bogotá) and is
  deliberately *not* run at boot catch-up. **Demo ticket 97 was left
  `isUsed = 1` on purpose** so the job has something to reset: after midnight
  Bogotá, `95cb147cf9b94482` should scan `ok` again instead of
  `already_used`. Tickets 98–101 remain unscanned.

**Resolved this session (kept for the audit trail):**

- ~~`DEMO_ORDER_NUMBER` is a placeholder (`100`)~~ → set to `165` after the
  2.3 seed and confirmed in the deployed bundle.
- ~~The `PurchaseFlow.jsx` change is uncommitted~~ → shipped in `8ba64ab`;
  Step 2.5 is done.
- ~~CLAUDE.md still describes the pre-multi-event world~~ → rewritten in
  `c1a0e2f`. It also had a pre-existing error: it cited a
  `.env.development.local` that does not exist. `VITE_API_URL` is simply
  unset in dev, so `client.js` falls back to a relative `/api` and
  `vite.config.js`'s proxy forwards to `coffeserver.onrender.com` — **local
  `npm run dev` reads and writes production data.** Now stated plainly there.
- ~~Nothing verified in a live browser~~ → every public route verified
  against the deployed site with headless Chrome (see STEP 3, Ring A).

**Known constraints worth carrying forward:**

- **`TicketForm` sells `quantity: 1` per submit** (`TicketForm.jsx:105`), so
  the walk-in UI cannot mint a multi-seat order — only the API can. This is
  why the 2.3 demo seed went through `POST /api/admin/sales`, and it means
  Ring B's "fill Etapa 1 (5 cupos)" step takes five separate submits.
- **`order_counter` is only written by `deleteAllPurchases`.** Any future
  bulk ticket deletion must bump it too, or the QR-collision hazard returns
  (plan risk #6).

---

## Files touched

### Step 1 — the multi-event implementation (commit `745bdd9`)

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

### Steps 2–3 — deploy, demo wiring, docs

```
8ba64ab  src/components/flow/PurchaseFlow.jsx   DEMO_ORDER_NUMBER 100 -> 165;
                                                 maxQty = isDemo ? 1 : …;
                                                 stepper disabled at bounds
         MULTI_EVENT_PLAN_STATUS.md
c1a0e2f  CLAUDE.md                               rewritten for multi-event
         MULTI_EVENT_PLAN_STATUS.md
2b7fa53  MULTI_EVENT_PLAN.md                     fixture + Ring A results
         MULTI_EVENT_PLAN_STATUS.md
         CLAUDE.md                               two-event production state
```

**No `server/` file changed after the Step 1 sync** — every Step 2 backend
change was data, not code, so no further backend redeploy is needed.

### Production data changes (not in git)

```
UPDATE ticket_stages SET totalQuantity = 42 WHERE id = 23      -- 2.3, room for the seed
POST /api/admin/sales {eventId:1, stageId:23, quantity:5}      -- 2.3, order #165
UPDATE events SET slug='demo', isDemo=1, isPublished=1,
                  salesOpen=0 WHERE id=1                        -- 2.4, the flip
UPDATE ticket_stages SET activatesAt=NULL WHERE eventId=1
                     AND activatesAt IS NOT NULL                -- 2.4, scheduler-proofing
POST /api/events {slug:'girasoles', …}                          -- Step 3 fixture, event id 3
```

Ring B, 2026-08-05 — all against **event 3 (Girasoles)** except the demo
scan, which the nightly job undoes:

```
PUT    /api/events/3            salesOpen 0 -> 1
POST   /api/purchases           {eventId:3, stageId:31, quantity:2}   -> order 166
POST   /api/purchases/166/submitted
POST   /api/admin/purchases/166/confirm                               -> tickets 102,103
POST   /api/admin/scan          ticket 102's hash                     -> isUsed=1
POST   /api/purchases           {stageId:31, quantity:1}              -> order 167 (rejected below)
POST   /api/purchases/167/submitted
POST   /api/admin/sales         {stageId:31, quantity:1} x2           -> orders 168, 169
                                  ... the 2nd filled Etapa 1: stage 31 -> 'closed',
                                      stage 32 cascade-promoted to 'active'
POST   /api/admin/purchases/167/reject                                -> ticket 104 rejected
POST   /api/admin/guest-passes  {eventId:3, band:'Los Cardos', …}     -> id 69, DELETED after
POST   /api/admin/scan          demo ticket 97 (95cb147cf9b94482)     -> isUsed=1, rearms nightly
```

Net: Girasoles holds **5 ticket rows** (orders 166–169) and `salesOpen = 1`;
the demo is unchanged except ticket 97's `isUsed` flag. Every write aimed at
the demo was rejected 409 by `assertNotDemo`, as designed.
