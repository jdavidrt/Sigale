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
- `createEvent`: **delete** the single-active demotion (`UPDATE events SET isActive = 0...`, L187) and hardcoded `isActive=1` (L197 → 0). Insert `slug, isPublished, salesOpen` (never `isDemo` via API). Slug validation **applies only when a slug is present** — `slug` may be NULL/absent (old-frontend compat; the new form requires it client-side): `^[a-z0-9]+(-[a-z0-9]+)*$`, ≤80 chars, `RESERVED_SLUGS` list (admin, scan, compra, tickets, dashboard, evento, edit, edit-event, create-event, sell-tickets, guest-passes, lista-puerta, validate-qr, api, assets, sw.js, manifest.json…) → 409 Spanish message; catch `ER_DUP_ENTRY` on `uqEventSlug` → 409 "Esa URL ya está en uso".
- `updateEvent`: same columns + validation (this is also how a slugless deploy-window event gets its slug later); on a demo row, **ignore** submitted `slug`/`isDemo` entirely — skip their validation and never write them (`demo` is deliberately NOT a reserved word, see judgment call #1 in the status file; this carve-out is an independent safety net). **Stage-reconciliation logic untouched** (all stage-status invariants live there). Edits to a demo event stay allowed (copy/flyer fixes) — read-only is enforced on ticket-level writes via `assertNotDemo`, not on the event form.
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

**Public pages:** `LandingPage` reads `useParams().slug` → `loadEventBySlug`; 404 → `/`; `goBuy()` → `/${event.slug}/compra`; CTA gate = `event.salesOpen || event.isDemo` (+ existing `resolveActiveStage` null guard). **`PurchaseFlowPage` also reads `useParams().slug` → `loadEventBySlug` itself** — with auto-`getActive()` gone from the context, a refresh or deep link straight to `/:slug/compra` must resolve the event without passing through the landing page; same gate; back-nav `/evento/${id}` → `/${slug}`; **demo mode** = stub `purchases.create/submit` with local fakes + a (since removed, 2026-08-05) "Modo demostración" banner, all 6 steps visually identical. The demo's fake order number is a hardcoded constant matching the seeded walk-in's real `orderId` (set after the Step 2.3 one-off), and the terminal success screen adds a **"Enviar confirmación por WhatsApp"** button → `wa.me/${event.whatsappNumber}?text=<prefilled demo confirmation with that order number>` — so the visitor hands off to the organizer exactly like a real buyer, and the number in the WA message matches the ticket the organizer sends back from `/tickets`. No QR is ever rendered in the wizard (delivery stays organizer-driven, matching production). Retire `ONLINE_SALES_OPEN` from `src/config.js`. Remove the `SAMPLE_EVENT` fallback usage (helpers `resolveActiveStage`/`stageCupos` stay).

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

> **Executed 2026-08-05 at the API level, not by clicking.** With explicit user
> authorization to drive the production API, the agent ran every Ring B item
> below through the exact endpoints the UI calls (`POST /api/purchases` →
> `/submitted` → `/admin/purchases/:id/confirm` → `/admin/scan`, etc.), rather
> than through a browser. **What that covers:** all server-side behavior —
> guards, inventory transitions, scoping, 409 messages. **What it does not
> cover:** the React components that call those endpoints. Items are marked
> `[x] (API)` where the server half passed but the click-through is still
> open. Risk #7's "only the user mints real rows" rule was overridden by the
> user for this pass.

**Fixture creation + form validation:**
- [~] ~~Create Girasoles via `/create-event`~~ — **the event now exists (id 3), created through the API instead**, so this item no longer creates anything. What it was really testing splits in two: the *server's* slug rejection is now covered in Ring A (both 409s, distinct messages), but **the form's inline validation is still untested** — the slug input's live regex/reserved-word feedback, the `sigale…/<slug>` prefix styling, and the `isPublished`/`salesOpen` toggle rows have never been rendered in a browser. Exercise them when creating the first real event, or by opening `/edit` on Girasoles.
- [x] `/girasoles` loads by direct URL while absent from `/` (soft-launch) — verified in Ring A.
- [x] **(API)** Flip `salesOpen` on via `PUT /api/events/3` with the exact payload `toApiEventPayload` builds → `salesOpen 0 → 1`, `isPublished` still 0, slug still `girasoles`. **Stage reconciliation held**: 31/32 kept their ids, names, prices and statuses (`active` / `upcoming`). Confirmed in the browser too — `/girasoles` flipped from "Adquiere tu entrada en taquilla" to "Comprar boleta". *The `/edit` form UI itself is still unexercised.*

**Second event sells for real:**
- [x] **(API)** A real purchase on Girasoles, order **#166**: `POST /api/purchases` (qty 2) → `reservedQuantity 2`; `POST /api/purchases/166/submitted` persisted `deliveryContact` + both holders; the order appeared in `/api/admin/purchases?eventId=3` and was **absent** from `?eventId=1`; confirm minted 2 `confirmed` rows (ids 102/103) with real HMAC hashes and moved 2 reserved → 2 sold; the first hash scanned **"ok"**, rescanned **"already_used"**, and a bogus hash 404'd "invalid". Headless Chrome confirms `/girasoles/compra` opens the real wizard — no demo banner, "Máx. 6 por persona".
- [x] **(API, partial)** Simultaneity: proven at the level that matters — Girasoles orders never appear in the demo's admin scope or vice versa, and the demo refuses every real write while Girasoles sells. Two *browser tabs* mid-flight were not driven.

**Demo behaves as the permanent showpiece:**
- [ ] `/demo/compra` walks all 6 steps with the demo banner; no row appears in `/admin`; success screen's WA button opens WhatsApp with the prefilled message (order number matches a seeded "Invitado Demo" ticket). *(Step 1 render + banner + "Máx. 1" verified in Ring A; steps 2–6 and the WA hand-off are click-only.)*
- [x] **(API)** Demo read-only server-side: **all 7** mutating handlers returned 409 *"El evento de demostración es de solo lectura"* — `updateAdminTicket`, `moveAdminTicketStage`, `deleteAdminTicket`, `deleteAllPurchases`, `createWalkInSale`, `confirmPurchase`, `rejectPurchase`. Re-read after: 96 demo rows before and after, ticket 97 still named "Invitado Demo 1", still `confirmed` on Etapa 3. The `assertNotDemo` coverage audit is now empirical, not just a grep.
- [~] **(API)** Demo scan loop: ticket 97 (`95cb147cf9b94482`) scanned **"ok"** then **"already_used"** — the deliberate `markUsed` exemption works. **The nightly rearm is still unverified**: ticket 97 is sitting `isUsed = 1` on purpose so `rearmDemoTickets` (`0 5 * * *`) can be checked on 2026-08-06. The other four seeded tickets remain unscanned.

**Cross-event invariants (all on Girasoles, demo as the untouched bystander):**
- [x] **(API)** Scoping: `/api/admin/tickets`, `/api/admin/purchases` and `/api/admin/guest-passes` each return only the requested event's rows (verified in both directions). A guest pass added to Girasoles' band "Los Cardos" landed on event 3 and left the demo's 66 untouched (removed again afterwards). `status` correctly defaults to `confirmed` (75 of 96 demo rows) — the invariant protecting `/dashboard`. *The `EventSelector` UI and the delete-all confirm dialog's event name are click-only.*
- [x] **(API)** Stage invariants — the full 2026-07-21 scenario, reproduced and passed: a pending reservation + 2 one-seat walk-ins filled Etapa 1 (5/5) → the fill check fired → the cascade promoted Etapa 2 to `active` and set Etapa 1 to **`closed`, not `sold_out`**; exactly one `active` stage throughout; a walk-in aimed at the superseded Etapa 1 was refused 409 *"La etapa seleccionada no está disponible para venta"*; **rejecting the pending order released a seat on a `closed` stage without reopening it and without `ER_DUP_ENTRY`** (4s+0r/5, no unsigned underflow). The demo's three stages were byte-identical before and after.
- [ ] **SKIPPED by user decision, 2026-08-05** — orderId never reused. Girasoles' 5 test rows (orders 166–169) were left in place rather than wiped, so the `order_counter` high-water mark, the post-wipe "next orderId is strictly higher" check, and the "orphaned QR scans 404" check remain **unverified in production**. The hazard is live and specific: the demo's `MAX(orderId)` is 165, so a naive `MAX+1` after wiping Girasoles would reissue **166** and make ticket 102's already-minted QR admit a different ticket. `order_counter` currently reads 164 and only moves when `deleteAllPurchases` runs. Script ready at `scratchpad/b7-orderid.mjs`.
- [ ] `npm test` (user-run) — expect `TicketContext.refreshFromServer` signature-change fallout only; other tested utils' APIs are untouched.

### Final-state check — the site looks complete in demo-only state

After the loop closes and Girasoles is cleaned up (tickets wiped, still unpublished), the resting state of production must be:
- [x] `/` shows the events grid with exactly one card: the Astromelias demo (flyer, name, date, "Demo" pill) — verified in the browser 2026-08-05, after Girasoles started selling (it stays off the grid, `isPublished=0`).
- [~] From that card: `/demo` renders fully; `/demo/compra` is walkable end-to-end with the demo banner; the seeded "Invitado Demo" tickets sit rearmed and scannable in `/tickets`. — **renders** ✅; **rearmed** ⏳ ticket 97 is deliberately `isUsed=1` pending the 2026-08-06 rearm check.
- [ ] Girasoles: zero tickets, `isPublished=0`, invisible everywhere public; reachable only by direct slug and via the organizer selector, ready to be edited into the first real event.
  **NOT MET as of 2026-08-05** — the delete-all was skipped, so Girasoles rests with **5 test tickets** (orders 166–169: 4 confirmed, 1 rejected), Etapa 1 `closed` 4/5, Etapa 2 `active` 0/10, and **`salesOpen = 1`**. It is still `isPublished = 0`, so it is invisible on `/` — but anyone holding the `/girasoles` link can currently place a real online order against a fabricated event. Close it with `salesOpen = 0` via `/edit` when the manual pass is finished.

**Step 3 exit gate (NOT yet met):** Ring A green in one pass ✅ **and** every Ring B item confirmed ⏳ **and** the final-state check passes ⏳, with the demo-rearm item verified on the following day ⏳. Outstanding: the orderId/delete-all item (skipped), the click-through half of the API-verified items, the `/create-event` + `/edit` form UI, the demo wizard's steps 2–6, the nightly rearm, and `npm test`.

---

## Key risks

1. Stage-status invariants in `deleteAllPurchases`' scoped reopen and `sweepExpiredHolds`' guard — the most delicate edits.
2. EventContext blast radius (16 consumer files) — keep value shape stable, grep all.
3. Deploy-window compat — backend params optional, slug nullable at the API, `getActive` retained, backend ships first.
4. Prod one-off is irreversible — inspect read-only first, confirm with user (Step 2.2–2.4 gates exist for exactly this).
5. `assertNotDemo` coverage — a missed mutating admin path silently erodes the read-only demo; the Step 1 exit-gate grep audit must be rerun any time a new handler is added later.
6. `order_counter` is only written by `deleteAllPurchases` — if a future feature deletes ticket rows in bulk some other way, it must update the high-water mark too, or the QR-collision hazard returns.
7. **Loop discipline:** Ring A's negative-path probes are the only writes the automated loop may send to production (they're designed to be rejected). Anything that would create/mutate real rows belongs in Ring B with the user driving.
8. **No per-organizer access control** — this plan built a per-event *selector*, not per-event *ownership*. Any valid organizer login sees and can manage every event. See the new section below, added 2026-09-11.

---

## Phase 2 — roles, archive, public scanner, preferred artist (spec, 2026-09-15)

Buildable spec for the next slice. Schema is drafted as migrations `010`–`013`
(column-level reference: `docs/architecture/DB_SCHEMA.md`). **Application code
was written 2026-09-15** (backend + frontend, per this spec) but **nothing has
been deployed or verified against a database** — see
`MULTI_EVENT_PLAN_STATUS.md` for what exists and what's still open. Everything
above this heading is shipped history.

### Why

1. **Bug.** `refreshOrganizerEvents` (`src/context/EventContext.jsx:80-82`) has no
   `try/catch`. A failed `GET /api/events/all` (stale creds, cold dyno, network
   blip) leaves `organizerEvents = []`, which `AdminPage`
   (`src/pages/AdminPage.jsx:125-131`) reads as "no events" and bounces to
   `/create-event`. Production has one `organizers` row and the query has no
   `WHERE`, so this is a swallowed failure, not an ownership problem — today.
2. **Feature.** A super admin who manages every event and every account, and
   event admins scoped to their own events. Decided alongside it: events are
   archived (never deleted), the door scanner becomes public per event, and
   every order records the artist the buyer came for.

### Decisions (final)

| # | Decision |
|---|---|
| 1 | Two roles on `organizers.role`: `super_admin`, `event_admin`. New rows default to `event_admin`. |
| 2 | Ownership is many-to-many via `organizer_events`. For an `event_admin` a row grants access; for a `super_admin` it is attribution only ("my events"). Access always branches on `role` first. |
| 3 | **The one existing account becomes `super_admin` inside migration 010** (a guarded `UPDATE` that runs only in the pass that creates the column). No manual one-off, no lockout window. |
| 4 | `super_admin` only: create event, archive/unarchive, edit `slug`, toggle `isPublished`, "Delete all tickets", manage accounts. `event_admin`: everything else on its assigned events, including `salesOpen`. |
| 5 | No event deletion, ever. `events.isArchived` is the reversible replacement. |
| 6 | `/scan` becomes **one public flow**: pick event → type its `scanKeyword` → scan that event only. No organizer login, any number of concurrent scanners, organizers use the same flow. |
| 7 | `preferredArtist` is required on every new order (wizard and walk-in) **when the event has a line-up**; captured on wizard step 1. The walk-in form drops its phone field. |
| 8 | Guest passes are role-scoped like everything else. |

### Schema — migrations 010–013 (drafted, not applied)

| Migration | Adds |
|---|---|
| `010_organizer_roles.sql` | `organizers.role`, `organizers.isActive`, table `organizer_events(organizerId, eventId, createdAt)`, plus the guarded promotion of pre-existing rows to `super_admin`. |
| `011_preferred_artist.sql` | `tickets.preferredArtist VARCHAR(160) NULL` — order-invariant; `NULL` = legacy row or event without a line-up. |
| `012_event_archive.sql` | `events.isArchived TINYINT(1) NOT NULL DEFAULT 0`. |
| `013_scan_keyword.sql` | `events.scanKeyword VARCHAR(80) NULL` — `NULL` = not publicly scannable. |

`009` stays reserved for the fresh-DB bootstrap fix (on a never-cut-over DB,
the `AFTER deliveryContact` in 011 fails loudly — same known gap). Note that
`sync-sigale-server.ps1` mirrors `server/migrations/`, so these four apply on
the **next backend deploy** whether or not the code below ships with it. That
is safe: they are additive, and 010 promotes the existing account itself.

### Authorization

- `verifyOrganizer` selects `role, isActive`; `isActive = 0` → `null` (401). `req.organizer = { id, username, role }`.
- `POST /api/login` returns `{ ok, username, role }`. The client keeps `role` in the auth blob for UI gating only; the server is the gate.
- `requireSuperAdmin` (after `requireOrganizer`): 403 unless `role === 'super_admin'`.
- `assertOwnsEvent(conn, organizer, eventId)`: `super_admin` passes; `event_admin` needs an `organizer_events` row, else 403. Same shape as `assertNotDemo`.
- **Every `/api/admin/*` handler calls it, reads included.** `eventId` becomes required (400) on `getAdminPurchases`, `getAdminTickets`, `listGuestPasses`. Handlers keyed by row id resolve `eventId` first — `updateAdminTicket`, `deleteAdminTicket`, `moveAdminTicketStage`, `confirmPurchase`, `rejectPurchase` already do; `updateGuestPass` and `deleteGuestPass` need a `SELECT eventId` added.
- `POST /api/events` → `requireSuperAdmin`. `PUT /api/events/:id` → `assertOwnsEvent`; for an `event_admin` caller, submitted `slug` and `isPublished` are ignored and the stored values kept (same pattern as the demo carve-out).
- `GET /api/events/all`: `super_admin` → every event, archived excluded unless `?includeArchived=1`; `event_admin` → `JOIN organizer_events`, archived excluded. Its row shape grows to `isPublished, salesOpen, isArchived, scanKeyword` (the public list keeps its shape). **This is the only response that carries `scanKeyword`.**
- `deleteAllPurchases` → `requireSuperAdmin`.
- Delete the dead `GET /api/admin/scan/manifest` and `POST /api/admin/scan/sync` routes instead of guarding them.
- `seed/seedOrganizer.js` inserts `role = 'super_admin'` — it only ever bootstraps the first account.

### Accounts API (all `requireSuperAdmin`)

| Method | Route | Body / notes |
|---|---|---|
| GET | `/api/admin/organizers` | `{ id, username, role, isActive, createdAt, eventIds[] }[]`, never `passwordHash` |
| POST | `/api/admin/organizers` | `{ username, password, role }`; password ≥ 8 chars; duplicate username → 409 |
| PATCH | `/api/admin/organizers/:id` | any of `{ role, isActive, password }` |
| PUT | `/api/admin/organizers/:id/events` | `{ eventIds: [] }` — replaces that account's `organizer_events` rows |

Guards: a caller cannot change its own `role` or `isActive`, and no write may
leave zero active `super_admin`s (409). Deactivation is the only "removal".

### Archive

- `PATCH /api/events/:id/archive` body `{ isArchived: 0 | 1 }` — `requireSuperAdmin` + `assertNotDemo`. One route, both directions.
- Archived means **no new sales**: `createPurchase` and `createWalkInSale` 409 *"El evento está archivado"* regardless of `salesOpen`. Everything else keeps working (confirm/reject pending orders, ticket edits, guest passes, scanning, door list) so an organizer can finish an archived event.
- Excluded from `GET /api/events` and from `/all` by default; `by-slug` and `/:id` still resolve. The `LandingPage`/`PurchaseFlow` gate becomes `(salesOpen && !isArchived) || isDemo`.
- `activateDueStages` skips stages of archived events.
- If the persisted selected event is archived, `refreshOrganizerEvents` already falls back to the most recent visible one.

### Public scanner

- `GET /api/scan/events` → `{ id, name, eventDate }[]` where `scanKeyword IS NOT NULL AND isArchived = 0`. Nothing else leaks.
- `POST /api/scan` body `{ eventId, keyword, hash }` → 400 missing field; **403** wrong keyword; **404** unknown/unconfirmed hash; **409** *"Esta boleta es de otro evento"* when `ticket.eventId !== eventId`; 200 `ok` | `already_used`. `markUsed(hash, eventId)` gains the event check. Demo exemption + nightly rearm unchanged.
- Keyword compare in JS: trimmed, case-insensitive (do not rely on collation). `PUT /api/events/:id`: `scanKeyword` omitted → keep; `''` → `NULL`; else 6–80 chars, stored trimmed. Never in `EVENT_SELECT` / the public `EVENT_LIST_SELECT`.
- Rate-limit both public routes at 120 req/min per IP (a busy door is ~20/min). `POST /api/admin/scan` stays API-only for compatibility; no UI calls it.
- Client: `scanAndAdmit(hash, { eventId, keyword })` → `/api/scan`. `ScanPage` = event picker + keyword input, then the camera; remember `{ eventId, keyword }` in `sessionStorage` so a refresh does not re-ask. Give the demo a keyword (via `/edit`) so visitors can try it.

### Preferred artist

- **Wizard step 1**: dropdown under the quantity stepper, from `event.artists`. Hidden when the line-up is empty; preselected when it has one entry; "Continuar" disabled until chosen. Sent on `POST /api/purchases`. The demo wizard shows the same control (simulated).
- **Walk-in** `TicketForm`: same required dropdown from the selected event; **phone input removed** (`holderPhone` sent `null`; the `NO_PHONE` display sentinel stays for old rows).
- API: `createPurchase` and `createWalkInSale` require it **iff** `events.artists` is non-empty; 400 on missing or not-in-line-up (exact string match); written to every row of the order.
- Surfacing: `getAdminPurchases` adds `MIN(t.preferredArtist) AS preferredArtist`; `getAdminTickets` adds the column; `fromServerTicket` maps it; `/tickets` table + CSV column; `/dashboard` "Boletas por artista" (confirmed only — the query in `DB_SCHEMA.md`).

### Frontend

- Auth blob gains `role`; a `RequireRole('super_admin')` wrapper guards `/events-admin`, `/organizers` and `/create-event`.
- `OrganizerMenu`: "Eventos" and "Organizadores" entries for `super_admin` only. **Add `events-admin` and `organizers` to `RESERVED_SLUGS` in both `src/utils/slug.js` and `events.controllers.js`.**
- `AdminPage` zero-events state: `super_admin` → `/create-event`; `event_admin` → `EmptyStateCard` *"No tienes eventos asignados"*. **Fix the swallowed failure:** `refreshOrganizerEvents` catches, exposes `organizerEventsError`, and the panel shows an error + retry instead of redirecting.
- `CreateEvent`: create mode super-only; edit mode hides `slug` and `isPublished` for `event_admin`; new `scanKeyword` field on create + edit, read in edit mode from the `organizerEvents` entry (the only place it is served).
- **Events admin** (`/events-admin`): all events with a "show archived" toggle, per-row published / salesOpen / archived / ticket count, edit, archive/unarchive, assign `event_admin`s.
- **Organizers admin** (`/organizers`): list, create, change role, activate/deactivate, reset password, edit event assignments.
- `ScanPage` rebuilt per "Public scanner".

### Deploy order

1. Backend (`./sync-sigale-server.ps1` → commit/push BlackCoffe → Render). Migrations 010–013 apply on boot; 010 promotes the existing account itself. Probe: `SELECT username, role, isActive FROM organizers` shows one `super_admin`, and `GET /api/events/all` with the existing creds still lists both events.
2. Frontend, immediately after. Bump `CACHE_NAME` to `sigale-v4`. **Deploy-window caveat:** an old cached bundle sends no `preferredArtist`, so its purchases 400 on any event with a line-up until it refreshes — keep the window short. **Also:** an organizer who stays logged in across the deploy has `role` missing from their locally stored auth blob (the old `POST /api/login` response never returned it) — `isSuperAdmin()` then reads `false`, hiding `/create-event`, `/events-admin`, `/organizers` and the slug/isPublished fields even for the real super_admin. Log out and back in once after the deploy to pick up `role`.
3. Data: set the demo's `scanKeyword` via `/edit`. (Girasoles cleanup — `salesOpen = 0`, optional delete-all — is still pending from Phase 1; see the status file.)

### Verification

`npm run lint` + `npm run build` clean; then, against production with the user
driving every write (Ring B discipline): login returns `role`; a test
`event_admin` sees only its assigned event and 403s on another `eventId`;
archiving hides an event from `/` and makes a purchase 409; `/scan` with the
demo keyword returns `ok` → `already_used`, and a Girasoles hash under the
demo's `eventId` returns 409; a wizard purchase and a walk-in both persist
`preferredArtist`; the dashboard breakdown matches the SQL.

### Open

- One more `super_admin`-only item was ticked but not named in the 2026-09-15 review — confirm before building. `salesOpen` stays `event_admin`-editable.
