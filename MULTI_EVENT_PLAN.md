# Sígale multi-evento: /demo + slugs por evento + landing raíz

## Context

The Astromelias event is over. It becomes a permanent **read-only demo** at `sigale.onrender.com/demo`, and the platform is converted from single-active-event to **multi-event**: each event gets a URL slug (`/alternoverso`, `/alternoverso/compra`), several events can sell simultaneously, `/` becomes a public landing listing visible events, and the organizer panel gets an **event selector** that scopes every admin page and endpoint.

**User-approved decisions:**
- Demo identified by `isDemo` flag + reserved slug `demo` (not literal id 0 — MySQL AUTO_INCREMENT treats inserted 0 as NULL, and FK children block a later UPDATE-to-0).
- The **existing production Astromelias row becomes the demo** via a one-off UPDATE (user confirms before executing).
- Demo is read-only: wizard renders fully but purchase API calls are simulated in the frontend, and the backend rejects any write against a demo event — **including the destructive/mutating admin paths**, not just the public ones (see the `assertNotDemo` guard in Step 1.2). One tap of "Delete All Tickets" with the demo selected must not wipe the Astromelias history the demo exists to show.
- `ONLINE_SALES_OPEN` global flag is **retired**, replaced by a per-event `salesOpen` column editable in the event form.
- Public purchase lives under the slug: `/:slug/compra`.
- `isActive` semantics retired (column stays, nothing new writes it); landing visibility comes from a new `isPublished` column. `GET /api/events/active` stays alive during the deploy window for old cached clients.
- **Unpublished events ARE reachable by direct slug URL** (`GET /by-slug/:slug` does not filter `isPublished`) — intended soft-launch behavior: the organizer can share `/mi-evento` privately before flipping "visible en la página principal". `isPublished` gates only the root landing list.
- **The landing is never empty in the demo-only state**: the demo flips to `isPublished=1` in the one-off, so the Astromelias card appears on `/` from day one. The base URL must look like a complete, working site — a visitor landing on `sigale.onrender.com` sees the events grid with the Astromelias demo, taps through to `/demo`, and can walk the whole wizard — even while the demo is the only event on the platform. This is an explicit acceptance criterion, verified in Step 2.5's probe and Step 3's final-state check.
- **Multi-event behavior is validated with a fabricated second event** ("Girasoles" — see the Step 3 test fixture): since no real second event exists yet, a fictional sister event with Astromelias-like data (lineup of made-up bands, same venue style, two small stages) is created through the new event form in production, kept `isPublished=0` so the public landing stays demo-only, and sells for real via its direct slug during validation. Its tickets are wiped afterwards; the event row stays (there is no event-delete endpoint) and can be edited into the first real event later.
- **The demo is scannable end-to-end**: ~5 real confirmed tickets ("Invitado Demo 1–5") are seeded on the demo event via a production walk-in sale *before* `isDemo` is flipped, so they carry real server-minted hashes. The demo wizard's success screen adds a WhatsApp button (prefilled confirmation message, fake order number hardcoded to the seeded walk-in's real `orderId`); the organizer replies with the QR from `/tickets` (existing share flow); `/scan` validates it for real ("ok" → "already_used"). `POST /api/admin/scan` is **exempt** from `assertNotDemo` — it's the one demo write we want — and a nightly scheduler line rearms the demo tickets (`isUsed = 0`). QR delivery is organizer-driven only (no QR shown in the wizard), matching production.
- **`orderId`s are never reused** (new invariant): `validationHash = HMAC(orderId, seatIndex)`, so a deleted-then-reissued orderId would make an already-delivered QR image scan in as someone else's new ticket. Today `deleteAllPurchases` is a total wipe so it can't bite; once delete-all is per-event and other events keep selling, it becomes a live cross-event hazard. Fixed with a persisted high-water mark (Step 1.1 table + Step 1.2 `nextOrderId` change) rather than changing the HMAC formula — it also covers same-event reuse and keeps order numbers monotonic for organizers.

---

## Execution model — 3 steps, agentic loops

The work runs as three macro-steps. Steps 1 and 3 are **agentic loops**: the agent iterates autonomously against objective pass/fail signals and only exits the loop when its gate is green. Step 2 is a **gated sequence** — each sub-step has a verification probe before the next one runs, and the irreversible middle (the prod one-off) requires explicit user confirmation.

```
┌─► STEP 1 — IMPLEMENT (loop) ──► gate: lint ∧ build ∧ self-review clean
│                                        │
│   ┌────────────────────────────────────┘
│   ▼
│   STEP 2 — DEPLOY (gated sequence) ──► gate: prod probes green after each sub-step
│                                        │
│   ┌────────────────────────────────────┘
│   ▼
└── STEP 3 — TEST & VALIDATE (loop) ──► gate: Ring A (automated) all pass
        │                                     ∧ Ring B (user manual) all pass
        └── any failure → classify → route back to Step 1 (code) or Step 2 (deploy/data)
```

**Failure routing (used every time Step 3 finds a defect):**

| Symptom class | Route to |
|---|---|
| Wrong response body/status from an endpoint, UI bug, missing guard | Step 1 (fix code) → Step 2 (redeploy affected side) → Step 3 (rerun full ring) |
| Endpoint 404s in prod but works locally, migration not applied | Step 2 (sync/redeploy backend, check Render boot logs) → Step 3 |
| Demo row/seeded tickets in wrong state | Step 2.3/2.4 (data one-off, user-confirmed) → Step 3 |
| Stale client behavior (old bundle/SW) | Step 2.5 (frontend deploy / SW cache bump verification) → Step 3 |

Re-entering Step 1 from Step 3 re-runs the *full* Step 1 gate (lint + build) before redeploying — never hot-patch and deploy unverified.

---

## STEP 1 — Code changes (agentic implementation loop)

All local code changes in this repo. The frontend (`src/`) is the bulk of the work; the backend changes (`server/`) are made here too and only reach production through Step 2's sync. **Nothing in Step 1 touches production** — no prod DB writes, no deploys.

### Inner loop protocol

Repeat until the exit gate passes:

1. Implement the next sub-step (1.1 → 1.6, in order — later sub-steps depend on earlier ones).
2. Run `npm run lint` and `npm run build`. Any error or warning → fix and rerun before moving on. (Per CLAUDE.md: do **not** run `npm test` — but flag to the user that `TicketContext.refreshFromServer`'s signature changes, so its tests may need updating when they run the pass.)
3. Self-review the diff of the sub-step against the invariants in this plan (stage-status rules, `assertNotDemo` coverage, deploy-window compat) before starting the next sub-step.

**Exit gate:** all sub-steps 1.1–1.6 done, `npm run lint` + `npm run build` clean on the final tree, and the two grep audits below return no misses:
- `grep -rl "useEvent(" src/` — every consumer (≈16 files) handles the new EventContext behavior; value shape `{ event, eventLoading, eventId, createEvent, updateEvent, clearEvent, hasEvent, refreshEvent }` stayed stable.
- grep every handler in `admin.controllers.js` that writes `tickets`/`ticket_stages` — each is either `assertNotDemo`-guarded or on the explicit exempt list (`markUsed` only).

### 1.1 — Migration `server/migrations/008_multi_event.sql`

Four additive columns + unique index on `events`, plus one new table:
- `slug VARCHAR(80) NULL` + `UNIQUE KEY uqEventSlug (slug)` (NULLs don't collide; utf8mb4 ai_ci gives case/accent-insensitive uniqueness — desired). **NULL is allowed on purpose**: during the deploy window the old frontend creates events with no slug, and the API must accept that (slug is required client-side in the new form only).
- `isPublished TINYINT(1) NOT NULL DEFAULT 0` — visible on root landing.
- `isDemo TINYINT(1) NOT NULL DEFAULT 0`.
- `salesOpen TINYINT(1) NOT NULL DEFAULT 0` — per-event online-sales gate (default preserves today's closed state).
- New one-row table `order_counter (id TINYINT PRIMARY KEY, highWaterMark INT UNSIGNED NOT NULL)`, seeded with `(1, COALESCE(MAX(orderId), 0))` from `tickets` — the orderId floor that survives per-event delete-all (see the "never reused" decision above). Written only by `deleteAllPurchases`; read by `nextOrderId`.

Format rules (from `runMigrations.js` + `007`'s style): one statement per line, no inline `;` or `--`, idempotent via `information_schema` + `PREPARE/EXECUTE/DEALLOCATE` guards. Note in `server/README.md`: the fresh-DB bootstrap fix previously earmarked as 008 becomes 009.

### 1.2 — Backend (`server/`)

**`controllers/events.controllers.js` + `routes/events.routes.js`:**
- Add `slug, isPublished, isDemo, salesOpen` to `EVENT_SELECT` (L27).
- New public `GET /api/events` — list `WHERE isPublished = 1 ORDER BY eventDate DESC` (lightweight rows for the landing grid).
- New public `GET /api/events/by-slug/:slug` (clone of `getEventById`; `by-slug` prefix avoids colliding with `/:id`).
- New organizer `GET /api/events/all` (requireOrganizer) — every event for the panel selector.
- Route order: `/active` → `/all` → `/by-slug/:slug` → `/` (list) → `/:id`.
- `createEvent`: **delete** the single-active demotion (`UPDATE events SET isActive = 0...`, L187) and hardcoded `isActive=1` (L197 → 0). Insert `slug, isPublished, salesOpen` (never `isDemo` via API). Slug validation **applies only when a slug is present** — `slug` may be NULL/absent (old-frontend compat; the new form requires it client-side): `^[a-z0-9]+(-[a-z0-9]+)*$`, ≤80 chars, `RESERVED_SLUGS` list (admin, scan, compra, demo, tickets, dashboard, evento, edit, edit-event, create-event, sell-tickets, guest-passes, lista-puerta, validate-qr, api, assets, sw.js, manifest.json…) → 409 Spanish message; catch `ER_DUP_ENTRY` on `uqEventSlug` → 409 "Esa URL ya está en uso".
- `updateEvent`: same columns + validation (this is also how a slugless deploy-window event gets its slug later); on a demo row, **ignore** submitted `slug`/`isDemo` entirely — skip their validation and never write them (a validate-then-reject order would 409 an innocent demo copy-edit, since the form re-submits the unchanged slug `demo`, which sits on the `RESERVED_SLUGS` list). **Stage-reconciliation logic untouched** (all stage-status invariants live there). Edits to a demo event stay allowed (copy/flyer fixes) — read-only is enforced on ticket-level writes via `assertNotDemo`, not on the event form.
- `getEventBySlug` deliberately does **not** filter `isPublished` (soft-launch by private link — see Context).

**`controllers/purchases.controllers.js`:**
- `createPurchase`: after the stage `FOR UPDATE` lock, `SELECT isDemo, salesOpen FROM events WHERE id = stage.eventId`; reject 409 if `isDemo=1` or `salesOpen=0`. `submitPayment` needs nothing extra: the only demo rows that exist are the seeded `confirmed` walk-ins (whose `orderId` is even public, hardcoded in the demo wizard), and the existing status guard already 409s anything not `pending_payment`/`payment_submitted` — no `pending_payment` demo row can ever be created since `createPurchase` rejects demo events.
- `nextOrderId` (L47): become `GREATEST(MAX(tickets.orderId), order_counter.highWaterMark) + 1` (both read inside the open transaction, `FOR UPDATE` on both) — orderIds never regress even after a per-event delete-all removed the rows holding the previous MAX. Fallback to `ORDER_ID_START` unchanged. Note: this lock already serializes inserts across ALL events (it did before too); fine at this scale, just no longer masked by the single-event stage lock.

**`controllers/admin.controllers.js`:**
- New helper `assertNotDemo(conn, eventId)` — one `SELECT isDemo FROM events WHERE id = ?`, throws/returns 409 "El evento de demostración es de solo lectura" when `isDemo=1`. **Called by every mutating admin path against demo rows**: `createWalkInSale`, `deleteAllPurchases`, `deleteAdminTicket`, `updateAdminTicket` (currently UPDATEs blind with no prior SELECT — add an `eventId` lookup first), `moveAdminTicketStage`, `confirmPurchase`/`rejectPurchase` (cheap belt-and-suspenders; no pending demo orders should exist). Read paths (`getAdminPurchases`/`getAdminTickets`) stay open — the demo's data is meant to be browsed. **`markUsed` in `scan.controllers.js` is deliberately NOT guarded**: scanning the seeded demo tickets is the point of the demo, and the write is reversible (nightly rearm below).
- `getAdminPurchases` (L69) + `getAdminTickets` (L144): optional `eventId` query param → `t.eventId = ?` (optional for deploy-window compat; new frontend always sends it).
- `createWalkInSale`: use `stage.eventId` instead of body `eventId` in the cascade (L401) and INSERT values (L439) — mirrors `createPurchase`; reject if the stage's event `isDemo=1` (via `assertNotDemo`). `salesOpen` does NOT gate walk-ins (it's the online switch; taquilla always works).
- `deleteAllPurchases` (L503): require `eventId` (400 without; 409 on demo); scope the SELECT and `DELETE FROM tickets` with `WHERE eventId = ?`; **before deleting, `UPDATE order_counter SET highWaterMark = GREATEST(highWaterMark, <MAX(orderId) of the doomed rows>)`** so those orderIds are never reissued; the sold_out→active reopen becomes event-scoped AND guarded by "event has no active stage" + reopen at most one stage (lowest sortOrder) — fixes the pre-existing `uqOneActiveStagePerEvent` ER_DUP_ENTRY hazard. Never touch `closed`.
- `moveAdminTicketStage` is already correctly scoped and carries the model active-count guard — no change beyond `assertNotDemo`.

**`jobs/scheduler.js`:** `activateDueStages` already per-event — no change. `sweepExpiredHolds`: add the same "no other active stage" guard to its sold_out→active restore (pre-existing hazard, likelier with concurrent events). New third job `rearmDemoTickets` (nightly, e.g. `0 5 * * *` = midnight Bogotá): `UPDATE tickets SET isUsed = 0, usedAt = NULL WHERE eventId IN (SELECT id FROM events WHERE isDemo = 1) AND isUsed = 1` — demo QRs scanned during the day show "already_used" for the rest of it (demoable state), then rearm overnight. Wrap in the existing `guarded()` helper.

No new router files → `index.js` / `integration.js` mounts unchanged (verify parity anyway).

### 1.3 — API wrappers (`src/api/`)

- `events.js`: mappers gain `slug`, `isPublished`, `isDemo`, `salesOpen` (`toApiEventPayload` keeps round-tripping stage `id`s — load-bearing). New `getBySlug(slug)`, `list()`, `listAll(opts)` (Basic auth like `create`/`update`).
- `admin.js`: `listTickets(status, eventId)`, `deleteAllPurchases(eventId)`; `listPurchases` already forwards params — callers add `eventId`.

### 1.4 — Routing + contexts

**`src/App.jsx`:**
- Move `BrowserRouter` above the providers (insurance in case a context ends up needing router hooks; nothing planned strictly requires it — cheap and harmless).
- Routes: `/` → new `EventsListPage`; `/:slug` → `LandingPage`; `/:slug/compra` → `PurchaseFlowPage` (`/demo` is just a slug); `/compra` → redirect `/`; `/evento/:id` → tiny `LegacyEventRedirect` (getById → navigate to `/${slug}`; **fall back to `/` when the event has no slug or the id 404s** — deploy-window events can be slugless). Literal routes outrank `/:slug` (static-over-dynamic ranking).
- **Move the `*` catch-all out of the `RequireAuth` group** (App.jsx:95) to top level → `/` — fixes logged-out visitors on unknown URLs landing on `/admin`.

**`src/context/EventContext.jsx`** (**16 consumer files** — `grep -rl "useEvent(" src/` and check each; keep value shape `{ event, eventLoading, eventId, createEvent, updateEvent, clearEvent, hasEvent, refreshEvent }` stable):
- Drop auto-`getActive()` on mount. Add `loadEventBySlug(slug)` (public pages), `organizerEvents` + `refreshOrganizerEvents()`, `selectEvent(id)` persisting via `useLocalStorageValue('sigale-selected-event-id')`, restore-or-default-to-most-recent on organizer mounts. `refreshEvent` re-fetches whatever is loaded; `createEvent` selects the new event.

**`src/context/TicketContext.jsx`:** `refreshFromServer(status, eventId)` (early-return without eventId); `fromServerTicket` maps `eventId`. Callers re-fetch on eventId change — also fixes cross-event stage-name price collisions in `getStats`.

**Public pages:** `LandingPage` reads `useParams().slug` → `loadEventBySlug`; 404 → `/`; `goBuy()` → `/${event.slug}/compra`; CTA gate = `event.salesOpen || event.isDemo` (+ existing `resolveActiveStage` null guard). **`PurchaseFlowPage` also reads `useParams().slug` → `loadEventBySlug` itself** — with auto-`getActive()` gone from the context, a refresh or deep link straight to `/:slug/compra` must resolve the event without passing through the landing page; same gate; back-nav `/evento/${id}` → `/${slug}`; **demo mode** = stub `purchases.create/submit` with local fakes + persistent "Modo demostración" banner, all 6 steps visually identical. The demo's fake order number is a hardcoded constant matching the seeded walk-in's real `orderId` (set after the Step 2.3 one-off), and the terminal success screen adds a **"Enviar confirmación por WhatsApp"** button → `wa.me/${event.whatsappNumber}?text=<prefilled demo confirmation with that order number>` — so the visitor hands off to the organizer exactly like a real buyer, and the number in the WA message matches the ticket the organizer sends back from `/tickets`. No QR is ever rendered in the wizard (delivery stays organizer-driven, matching production). Retire `ONLINE_SALES_OPEN` from `src/config.js`. Remove the `SAMPLE_EVENT` fallback usage (helpers `resolveActiveStage`/`stageCupos` stay).

**`src/utils/translations.js`:** ES+EN keys for demo banner, demo WA confirmation button + prefilled message, root-landing copy, event-form fields (URL del evento, visible en la página principal, ventas en línea), slug validation errors, event-selector labels.

### 1.5 — Organizer selector + scoping

- New `EventSelector` (plain `<select>`, ≥44px, Astromelias tokens) inside **`OrganizerMenu`** right after the "Organizador" header (L70-82) — OrganizerMenu is the only chrome shared by AdminLayout pages AND the hand-rolled topbars of `/admin` + `/scan`.
- `AdminPage`: `admin.list({ status, eventId })`; "no event → /create-event" redirect becomes "organizerEvents empty".
- `TicketsPage` / `DashboardPage` / `DoorListPage`: pass `eventId` to `refreshFromServer`; re-fetch on change. Dashboards keep `getStats(event)` with the selected event.
- `SellTicketsPage`/`TicketForm`: follows selected event automatically (stage dropdown derives from `useEvent()`); hide form with `EmptyStateCard` when `event.isDemo`.
- `GuestPassesPage`: already eventId-scoped — verify effect depends on `eventId`.
- `CreateEvent` (create+edit): new fields — slug input styled `sigale…/<slug>` with client-side regex + reserved-words mirror, `isPublished` toggle, `salesOpen` toggle; 409s surface via existing `notify()` ApiError pattern.
- Delete-all on `/tickets`: `deleteAllPurchases(eventId)` + confirm dialog names the event.
- `/scan` stays hash-global (hashes unique across events).

### 1.6 — Root landing + service worker

- New `src/pages/EventsListPage.jsx` + module CSS: public, mobile-first single column → grid at `min-width` breakpoints, StarField/`.card` styling, lazy-loaded. Fetches `eventsApi.list()`; card = flyer, name, date (`parseLocalDate`), venue → `/${slug}`; "Demo" pill on the demo; `EmptyStateCard` when empty.
- `public/sw.js`: bump `CACHE_NAME` → `'sigale-v3'`; **stop caching `/api/` responses** in `handleCrossOrigin` (L306). (The handler is network-first, so cached API data only serves when fetch fails — the risk is stale-when-offline event/stage data plus unbounded cache growth, not a permanently stale list. Still worth removing: a flaky connection at the door showing yesterday's `cuposRestantes` is exactly the wrong failure mode.)

---

## STEP 2 — Deployment (gated sequence)

Hosting needs nothing new: `render.yaml` + `public/_redirects` already rewrite all paths to `index.html`; CORS for sigale.onrender.com already live in BlackCoffe's index.js. **Order matters — backend first (additive, old frontend keeps working via `getActive`), data one-off second, frontend last.** Each sub-step ends with a probe; do not advance on a red probe.

### 2.1 — Backend sync + deploy
`./sync-sigale-server.ps1` → commit/push in `C:\dev\BlackCoffe` → Render redeploys and runs migration 008 on boot.

**Probe:** Render boot logs show 008 applied cleanly; `GET /api/health` 200; `GET /api/events` returns `[]` or published rows; `GET /api/events/active` still 200 (deploy-window compat); `GET /api/events/by-slug/anything` 404s cleanly (not 500).

### 2.2 — Pre-flip inspection (read-only)
Read-only inspection of the Astromelias row + its stage statuses (`database: 'sigale'` explicit — never trust `.env.local`'s `DB_NAME`). Dump what the one-off will touch and show the user.

### 2.3 — Seed the demo tickets (user-confirmed, BEFORE `isDemo` flip)
**The walk-in seed MUST happen before `isDemo=1`, because `assertNotDemo` blocks walk-ins forever after.** Make one stage temporarily sellable, then a single walk-in sale through the production API for qty 5, holders "Invitado Demo 1–5". If the inspection shows a stage still `active`, just raise its `totalQuantity` by 5 (event edit). If every stage is `closed`/`sold_out`, a **direct one-off SQL `UPDATE`** is required to set one `active` — no API path restores from `closed` by design — demoting any other `active` stage first (`uqOneActiveStagePerEvent`). The server mints real hashes with the production `SCAN_HASH_SECRET`. **Record the resulting `orderId`** — it becomes the frontend's hardcoded demo order number (wire it into the Step 1.4 constant before the frontend deploy). Restore the stage's status afterwards.

**Probe:** `GET /api/admin/tickets?eventId=<astromelias>` (organizer creds — or an equivalent read-only DB query with `database: 'sigale'`) shows the 5 confirmed "Invitado Demo" rows with non-NULL hashes.

### 2.4 — Flip the demo flag (user-confirmed, irreversible in spirit)
`UPDATE events SET slug='demo', isDemo=1, isPublished=1, salesOpen=0 WHERE id=<astromeliasId>`. Verify demo stages have `activatesAt IS NULL` (scheduler must never activate them); decide with the user whether one stage shows `active` for demo looks vs "agotado".

**Probe:** `GET /api/events/by-slug/demo` returns the row with `isDemo=1`; `GET /api/events` lists the demo row (the landing feed must not be empty); direct `POST /api/purchases` against a demo stage → 409; a walk-in attempt → 409 "solo lectura".

### 2.5 — Frontend deploy
Confirm the demo `orderId` constant from 2.3 is in the built code, then deploy the static frontend (Render).

**Probe:** hard-reload `sigale.onrender.com` — SW cache is `sigale-v3`; `/` shows the events grid **with the Astromelias demo card** (flyer, name, date, "Demo" pill — the base URL must read as a complete site, not an empty landing); tapping the card lands on `/demo`.

Later cleanup (separate change, not part of this rollout): remove `/api/events/active` + `isActive` usage; write the 009 fresh-DB bootstrap migration.

---

## STEP 3 — Testing & validation (agentic loop)

Two rings. **Ring A** is fully automated — the agent runs it end-to-end after every deploy and loops on failures. **Ring B** is the user's manual click-through — the agent hands over the checklist only once Ring A is green, then loops on any failure the user reports. Every failure goes through the routing table at the top: classify → fix in Step 1 or 2 → redeploy → **rerun the whole ring** (a fix can regress a neighboring check).

### Test fixture — the "Girasoles" second event ✅ CREATED 2026-08-05 (event id **3**)

Multi-event behavior can't be validated with one event, and no real second event exists yet — so Step 3 opens by creating a fabricated sister event with Astromelias-like data.

**Created via `POST /api/events` with organizer credentials, not through the `/create-event` form.** That was a deliberate substitution: the API path exercises the real slug validation and stage-status logic, whereas hand-writing `ticket_stages` rows (the alternative that was asked about) would have meant setting `status`/`sortOrder` by hand and risking the `uqOneActiveStagePerEvent` invariants. **Consequence: the form UI itself is still unverified** — the slug input's inline regex/reserved-word feedback and the two toggle rows have never been exercised in a browser. That check moves to Ring B and should be done when the first real event is created (or by editing Girasoles).

| Field | Value | Actual |
|---|---|---|
| Name | **Noche de Girasoles** (fictional mirror of Astromelias) | ✅ |
| slug | `girasoles` | ✅ |
| artists | "Los Cardos", "Cassette Beta", "La Previa" (made-up lineup, ≥2 bands so guest-pass band counts are testable) | ✅ |
| eventDate / openingTime | any near-future date, evening time | 2026-09-12 20:00 |
| venue / address | copy Astromelias' style (or reuse the same venue text) | Acá Parchamos, Calle 49 #9-85, aforo 80 |
| flyer / bank QR | — | reuses Astromelias' Cloudinary URLs, so the wizard's payment step renders a real QR for the Ring B purchase test |
| Stages | Etapa 1: 5 cupos, $20,000 · Etapa 2: 10 cupos, $30,000 — Etapa 1 tiny on purpose so the sold-out cascade is cheap to trigger; **no `activatesAt`** on Etapa 2 (cascade-promoted, not scheduler-promoted) | ✅ stage id **31** `active` 0/5, stage id **32** `upcoming` 0/10, both `activatesAt NULL` |
| isPublished | **0** — invisible on `/` (public landing stays demo-only) and doubles as the soft-launch test: `/girasoles` loads by direct URL only | ✅ verified both ways |
| salesOpen | **0 at creation → flipped to 1** via the edit form once Ring A's `salesOpen=0` 409 probe has run — the flip itself tests `updateEvent`'s toggle handling, then Girasoles sells for real | ✅ still 0; the 409 probe has run, so the flip is now unblocked |

> Note: Girasoles is event id **3**, not 2 — the `slug: 'demo'` duplicate probe burned an auto-increment value, since `ER_DUP_ENTRY` on `uqEventSlug` fires *after* the INSERT is attempted.

**Lifecycle:** created at the start of Step 3 → serves every multi-event check in both rings → after validation, "Delete All Tickets" with Girasoles selected wipes its rows (which is itself the event-scoped delete + high-water-mark test) → the event row **stays**, unpublished (there is no event-delete endpoint by design); it can be edited into the first real event later, or left as a permanent staging fixture.

### Ring A — automated probes (agent-run, read-only against prod except the explicit negative-path writes)

The Girasoles-dependent probes activate once the fixture exists (first Ring B item); before that they're *skipped*, not failed.

Public API, no credentials needed — **all verified 2026-08-05**:
- [x] `GET /api/events` → only `isPublished=1` rows; demo row present (the landing feed is never empty); Girasoles absent (unpublished).
- [x] `GET /api/events/by-slug/demo` → 200, `isDemo=1`, `salesOpen=0`.
- [x] `GET /api/events/by-slug/girasoles` → 200 despite `isPublished=0` (soft-launch invariant).
- [x] `GET /api/events/by-slug/no-such-slug` → 404, not 500.
- [x] `GET /api/events/active` → still 200 (deploy-window compat); resolves to the demo, which keeps `isActive=1`.
- [x] `POST /api/purchases` against a demo stage → 409 *"El evento de demostración es de solo lectura"* (negative-path write; created nothing — re-inspection confirmed row count and `MAX(orderId)` unchanged).
- [x] **One-shot, pre-flip only:** `POST /api/purchases` against a Girasoles stage while its `salesOpen` is still 0 → 409 *"Las ventas en línea están cerradas para este evento"*. **Never re-sent after the flip** — once `salesOpen=1` this request would *succeed* and mint a real pending order from the automated loop (risk #7). Recorded as passed-once; skip on reruns.
- [x] `POST /api/events` with a reserved slug (`admin`) → 409 *"Esa URL está reservada, elige otra"*; with a duplicate slug (`demo`) → 409 *"Esa URL ya está en uso"*. Two distinct messages, confirming judgment call #1 (`demo` is DB-protected data, not a reserved word).
- [x] `POST /api/admin/sales` against the demo → 409 *"…solo lectura"* (`assertNotDemo` on the walk-in path).

Against the built frontend — **all verified 2026-08-05 against the deployed site**, which is strictly better than a local preview. jsdom cannot do this (it does not execute Vite's `type="module"` bundle); headless Chrome can: `chrome.exe --headless=new --disable-gpu --virtual-time-budget=8000 --dump-dom <url>`.
- [x] `/` renders the events list; `/nope` and `/a/b/c` land on `/` while logged out — via two distinct mechanisms, both confirmed: `/nope` matches `/:slug`, gets a 404 from `by-slug`, and LandingPage redirects to `/`; `/a/b/c` matches no route and hits the catch-all (moved out of `RequireAuth`).
- [x] `/demo` renders with the demo pill; `/demo/compra` loads step 1 with the "Modo demostración" banner **and quantity pinned to "Máx. 1 por persona"**.
- [x] Direct refresh on `/:slug/compra` resolves the event without a landing-page visit (every check above is a cold load straight to the URL).
- [x] `/evento/1` redirects to `/demo`; `/compra` falls back to `/`.
- [x] `/girasoles` renders by direct URL with "Etapa 1 activa / Etapa 2 Próximamente", and its CTA reads **"Adquiere tu entrada en taquilla"** because `salesOpen=0`; `/girasoles/compra` shows the closed-sales screen.

**Ring A exit gate:** every box checked in a single uninterrupted pass after the latest deploy. **✅ MET 2026-08-05.**

### Ring B — manual click-throughs (user-run; agent triages reports and loops)

Ordered as a coherent test script — later items build on the fixture state earlier ones leave behind.

**Fixture creation + form validation:**
- [~] ~~Create Girasoles via `/create-event`~~ — **the event now exists (id 3), created through the API instead**, so this item no longer creates anything. What it was really testing splits in two: the *server's* slug rejection is now covered in Ring A (both 409s, distinct messages), but **the form's inline validation is still untested** — the slug input's live regex/reserved-word feedback, the `sigale…/<slug>` prefix styling, and the `isPublished`/`salesOpen` toggle rows have never been rendered in a browser. Exercise them when creating the first real event, or by opening `/edit` on Girasoles.
- [x] `/girasoles` loads by direct URL while absent from `/` (soft-launch) — verified in Ring A.
- [ ] Flip `salesOpen` on via `/edit` (Ring A's pre-flip 409 probe has run, so this is unblocked) → toggle round-trips. **This is also the first real exercise of the edit form**, including its stage-reconciliation path — worth watching that Etapa 1/2 keep their ids (31/32) and statuses.

**Second event sells for real:**
- [ ] `/girasoles/compra` completes a real purchase (all 6 steps, no demo banner); the pending order appears in `/admin` **only with Girasoles selected**; confirm it → ticket in `/tickets`; its QR scans "ok" at `/scan`.
- [ ] Simultaneity: with the Girasoles purchase mid-flight, walk `/demo/compra` in a second tab — demo simulates locally, Girasoles order is real, neither event's rows leak into the other's admin scope. (Strict two-*real*-events selling can be validated later with a second throwaway fixture, or waits for the first real event.)

**Demo behaves as the permanent showpiece:**
- [ ] `/demo/compra` walks all 6 steps with the demo banner; no row appears in `/admin`; success screen's WA button opens WhatsApp with the prefilled message (order number matches a seeded "Invitado Demo" ticket).
- [ ] Demo read-only server-side: with the demo selected, walk-in sale, ticket edit/delete/stage-move, and "Delete All Tickets" all surface the 409 "solo lectura" message; the demo's rows survive.
- [ ] Demo scan loop: organizer shares a seeded ticket's QR from `/tickets` (demo selected); `/scan` reads it → "ok", second scan → "already_used"; next day (after the nightly rearm) the same QR scans "ok" again.

**Cross-event invariants (all on Girasoles, demo as the untouched bystander):**
- [ ] Selector switches demo ↔ Girasoles; `/admin`, `/tickets`, `/dashboard`, `/sell-tickets`, `/guest-passes`, `/lista-puerta` show only the selected event (add a guest pass to a Girasoles band to verify scoping); delete-all's confirm dialog names the event.
- [ ] Stage invariants: fill Girasoles' Etapa 1 (5 cupos) via walk-ins → cascade closes it + promotes Etapa 2; the demo's stages are untouched; reject a pending Girasoles order → no ER_DUP_ENTRY.
- [ ] orderId never reused: note Girasoles' highest orderId, "Delete All Tickets" with Girasoles selected (demo rows survive), then a new walk-in on Girasoles → strictly higher orderId; a QR from a deleted ticket scans 404, never as the new ticket.
- [ ] `npm test` (user-run) — expect `TicketContext.refreshFromServer` signature-change fallout only; other tested utils' APIs are untouched.

### Final-state check — the site looks complete in demo-only state

After the loop closes and Girasoles is cleaned up (tickets wiped, still unpublished), the resting state of production must be:
- [ ] `/` shows the events grid with exactly one card: the Astromelias demo (flyer, name, date, "Demo" pill) — a first-time visitor sees a complete, populated site, not an empty landing.
- [ ] From that card: `/demo` renders fully; `/demo/compra` is walkable end-to-end with the demo banner; the seeded "Invitado Demo" tickets sit rearmed and scannable in `/tickets`.
- [ ] Girasoles: zero tickets, `isPublished=0`, invisible everywhere public; reachable only by direct slug and via the organizer selector, ready to be edited into the first real event.

**Step 3 exit gate (done):** Ring A green in one pass **and** every Ring B item confirmed by the user **and** the final-state check passes, with the demo-rearm item verified on the following day.

---

## Key risks

1. Stage-status invariants in `deleteAllPurchases`' scoped reopen and `sweepExpiredHolds`' guard — the most delicate edits.
2. EventContext blast radius (16 consumer files) — keep value shape stable, grep all.
3. Deploy-window compat — backend params optional, slug nullable at the API, `getActive` retained, backend ships first.
4. Prod one-off is irreversible — inspect read-only first, confirm with user (Step 2.2–2.4 gates exist for exactly this).
5. `assertNotDemo` coverage — a missed mutating admin path silently erodes the read-only demo; the Step 1 exit-gate grep audit must be rerun any time a new handler is added later.
6. `order_counter` is only written by `deleteAllPurchases` — if a future feature deletes ticket rows in bulk some other way, it must update the high-water mark too, or the QR-collision hazard returns.
7. **Loop discipline:** Ring A's negative-path probes are the only writes the automated loop may send to production (they're designed to be rejected). Anything that would create/mutate real rows belongs in Ring B with the user driving.
