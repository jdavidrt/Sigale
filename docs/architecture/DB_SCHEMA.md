# `sigale` database — schema reference (after migrations 010–013)

**Status:** migrations drafted, application code written (2026-09-15
session), **not applied or deployed anywhere** (not local, not production).
Migrations `010_organizer_roles.sql` (organizer roles + event ownership),
`011_preferred_artist.sql` (buyer's preferred act), `012_event_archive.sql`
(`events.isArchived`), and `013_scan_keyword.sql` (`events.scanKeyword`) sit
in `server/migrations/`; the backend and frontend that read/write them now
exist too (see `MULTI_EVENT_PLAN_STATUS.md`), but none of it has run against
a database or been exercised end-to-end. This document exists so the
additions can be validated by hand before deployment. Everything not marked
**NEW** is live in production today.

**Diagram:** [`DB_SCHEMA.svg`](DB_SCHEMA.svg) — the same eight tables, with
the 010–013 additions in daffodil (`organizers.role`/`isActive`, the new
`organizer_events` table, `tickets.preferredArtist`, and
`events.isArchived` + `events.scanKeyword`). Crow's foot = the many side of a
foreign key; the arrow points at the referenced row.

![sigale schema after migration 010](DB_SCHEMA.svg)

For the full column-by-column semantics of `tickets` (lifecycle, why
`orderAnchor` exists, why `validationHash` is nullable) see
[`TICKETS_SCHEMA.md`](TICKETS_SCHEMA.md); this file only lists its columns.

---

## What these migrations change — the part to validate

Six additions across four migrations. Migration 010 adds the three
role/ownership pieces; 011 adds one column to `tickets`; 012 and 013 each add
one column to `events` (`isArchived`, then `scanKeyword`). Nothing else in the
schema moves.

### 1. `organizers.role` — NEW column

```sql
ALTER TABLE organizers
  ADD COLUMN role ENUM('super_admin','event_admin') NOT NULL DEFAULT 'event_admin'
  AFTER username;
```

| Value | Meaning |
|---|---|
| `super_admin` | Sees and manages every event and every organizer account, unconditionally. Never needs a row in `organizer_events` — the role alone grants access, and the app checks it *before* ever querying that table. |
| `event_admin` | Scoped to the events explicitly assigned to it in `organizer_events`. Zero rows there = zero events visible. |

**Why the default is `event_admin` and not `super_admin`.** The default
applies to every row created *after* the migration, by any path — including
a future account-creation UI that forgets to set `role`. A privileged default
would fail open. The account that already exists is promoted by the migration
itself (below).

### 2. `organizers.isActive` — NEW column

```sql
ALTER TABLE organizers
  ADD COLUMN isActive TINYINT(1) NOT NULL DEFAULT 1
  AFTER role;
```

Lets a super admin revoke an event admin without deleting the row — matching
the rest of the schema, which never hard-deletes (stages are `closed`, events
are unpublished, nothing is removed). `requireOrganizer` will need to reject
`isActive = 0` at the credential check; that is an app-layer change, not part
of the migration.

### 3. `organizer_events` — NEW table

```sql
CREATE TABLE IF NOT EXISTS organizer_events (
  organizerId  BIGINT UNSIGNED NOT NULL,
  eventId      BIGINT UNSIGNED NOT NULL,
  createdAt    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (organizerId, eventId),
  KEY idxOrgEventsByEvent (eventId),
  CONSTRAINT fkOrgEventOrganizer FOREIGN KEY (organizerId) REFERENCES organizers(id) ON DELETE CASCADE,
  CONSTRAINT fkOrgEventEvent     FOREIGN KEY (eventId)     REFERENCES events(id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| Column | Type | Meaning |
|---|---|---|
| `organizerId` | `BIGINT UNSIGNED`, PK + FK → `organizers.id` | The event admin. |
| `eventId` | `BIGINT UNSIGNED`, PK + FK → `events.id` | An event that admin may manage. |
| `createdAt` | `TIMESTAMP` | When the assignment was made. |

- **Many-to-many, by decision (2026-09-11):** one admin can be assigned to
  several events; one event can have co-admins. A single `events.ownerId`
  column was the simpler alternative and was rejected because it can't
  express either of those without a second migration later.
- **A row means "assigned to / organizes this event" — not "is the only one
  who can."** For an `event_admin` the row is what *grants* access. A
  `super_admin` reaches every event by role alone, so the authorization
  check never reads this table for them — **but a `super_admin` MAY still
  hold rows here** (decision 2026-09-15), to record the events they
  personally organize. This is the real-world case where the platform owner
  also runs some events and wants a "my events" view distinct from "all
  events I can manage." The rows are attribution for a super_admin, access
  for an event_admin; the authorization check branches on `role` first and
  only consults this table for `event_admin`s, so the dual meaning never
  creates ambiguity in the access path.
- **PK on the pair** prevents duplicate assignments and serves "which events
  can this admin see" (leftmost prefix). `idxOrgEventsByEvent` serves the
  reverse — "who manages this event" — which a super-admin UI will want.
- **`ON DELETE CASCADE` both ways** mirrors `ticket_stages.fkStageEvent`. In
  practice neither organizers nor events are ever hard-deleted today, so this
  is inert protection, not a live code path.
- Types match the referenced columns exactly (`organizers.id` and `events.id`
  are both `BIGINT UNSIGNED`), so the FKs are valid as written.

### Pre-existing accounts are promoted inside the migration

The `role` column defaults to `event_admin`, which would turn the one account
that exists today into an `event_admin` with zero assignments — locked out.
So 010 ends with a guarded `UPDATE organizers SET role = 'super_admin'` that
executes only in the run that creates the column, and the ledger makes that
run happen once. Every account that predates roles was a full admin, so this
preserves existing access; accounts created afterwards get the default. No
manual step, no deploy-window ordering.

### Numbering

`010`, not `009`. `009` is still the reserved, unwritten fresh-database
bootstrap fix documented in `server/README.md`; this migration neither
addresses nor claims that gap. Migration `011` (below) follows it.

---

## 4. `tickets.preferredArtist` — NEW column (migration 011)

```sql
ALTER TABLE tickets
  ADD COLUMN preferredArtist VARCHAR(160) NULL
  AFTER deliveryContact;
```

A **feature**, not just plumbing (requested 2026-09-15): during the purchase
wizard the buyer picks the band/artist they are coming to see, so organizers
can report **which act drives the most ticket sales**.

- **Order-level, not per-seat.** Like `deliveryMethod` / `deliveryContact` /
  `status`, it is the same value on every seat row that shares an `orderId` —
  the buyer chooses one act for the whole order, and `createPurchase` writes
  it to all rows it inserts. Do not treat it as per-seat.
- **Sourced from the event's own line-up** (`events.artists`, a JSON array of
  strings). Free-form `VARCHAR(160)` at the DB level, like `guest_passes.band`;
  the wizard and the walk-in form constrain it to a dropdown, and the API
  hard-validates an exact match against the line-up.
- **Required at the API for every new order — wizard and walk-in — whenever
  the event has a line-up.** `createPurchase` / `createWalkInSale` return
  **400** if it is missing or not in `events.artists`. When the line-up is
  empty the field is skipped and `NULL` stored. The column stays nullable for
  that case and for the rows predating the migration; the report below
  filters `IS NOT NULL`. `NOT NULL DEFAULT ''` was rejected (a default would
  silently accept a forgotten insert). Placed `AFTER deliveryContact` with the
  other order-level, buyer-supplied columns.
- **Reporting** (tickets = seats, orders = distinct `orderId`; `confirmed`
  only so it counts real sales):

  ```sql
  SELECT preferredArtist,
         COUNT(*)               AS tickets,
         COUNT(DISTINCT orderId) AS orders,
         SUM(unitPrice)          AS revenue
    FROM tickets
   WHERE eventId = ? AND status = 'confirmed' AND preferredArtist IS NOT NULL
   GROUP BY preferredArtist
   ORDER BY tickets DESC;
  ```

**Built (2026-09-15), not yet deployed/verified:** the step-1 dropdown in the
wizard, the walk-in dropdown, and the API validation. **Still not built:**
the `/tickets` table column and the `/dashboard` "Boletas por artista"
breakdown — skipped deliberately to avoid touching `TicketContext.getStats`
and `csvUtils`'s tested public API; see `MULTI_EVENT_PLAN.md` → "Phase 2" →
"Preferred artist".

---

## 5. `events.isArchived` — NEW column (migration 012)

```sql
ALTER TABLE events
  ADD COLUMN isArchived TINYINT(1) NOT NULL DEFAULT 0
  AFTER salesOpen;
```

A `super_admin` "put away" switch — the **replacement for event deletion**
(which was dropped; see the "Resolved 2026-09-15" note below). Distinct from
`isPublished` (landing-grid visibility) and `salesOpen` (online-sales switch).
When `1`:

- excluded from the public landing feed (`GET /api/events`) regardless of `isPublished`;
- excluded from the organizer's default event list (`GET /api/events/all`) unless the events-admin page passes `?includeArchived=1`;
- sales closed — `createPurchase` **and** `createWalkInSale` reject it (regardless of `salesOpen`);
- still resolvable by direct slug (`GET /api/events/by-slug/:slug`) so old links/records still open;
- **reversible** — a `super_admin` can unarchive; **the demo is never archivable** (`assertNotDemo`).

Archive/unarchive is `super_admin`-only (`PATCH /api/events/:id/archive` with
body `{ isArchived: 0 | 1 }`). **No `DELETE` endpoint exists or should be
added** — events are never destroyed, so this never touches `order_counter`
or the ticket rows. Archived blocks new sales only; confirming pending orders,
ticket edits, guest passes and scanning keep working.

---

## 6. `events.scanKeyword` — NEW column (migration 013)

```sql
ALTER TABLE events
  ADD COLUMN scanKeyword VARCHAR(80) NULL
  AFTER isArchived;
```

Backs a **new public door-scan model** (decision 2026-09-15): `/scan` no longer
needs an organizer login. Anyone opens `/scan`, picks the event, and types that
event's keyword to unlock the scan + register (mark-used) flow **for that event
only**; many people can scan the same event at once.

- **Per-event shared door code**, set on the event form. `NULL` disables public
  scanning for that event (only credentialed organizers can scan it then).
- **Event-scoped by construction** — a valid keyword for event A can only mark
  event A's tickets used (`POST /api/scan` checks `ticket.eventId === eventId`).
- **`scanKeyword` MUST NEVER leak.** Exclude it from every public event payload
  (`GET /api/events`, `/by-slug/:slug`, the scanner's picker); return it only to
  an authenticated organizer editing the event. It goes on the organizer edit
  fetch, **not** in `EVENT_SELECT`'s public shape.
- New public endpoints (outside `requireOrganizer`, rate-limited):
  `GET /api/scan/events` (picker: `{ id, name, eventDate }[]` — only events
  with a keyword set and not archived) and
  `POST /api/scan { eventId, keyword, hash }`. This is the **only** scan UI;
  organizers use it too. `POST /api/admin/scan` stays API-only.
- Plaintext is deliberate (the organizer re-views/shares it); the write it
  unlocks (`markUsed`) is idempotent and organizer-reversible. Full rationale:
  `MULTI_EVENT_PLAN.md` → "Public door scanner".

---

## How a request resolves to the events it may touch (once the backend reads these)

```
Authorization: Basic …            every /api/admin/* request + event writes
        │
        ▼
requireOrganizer                  bcrypt compare, then NEW: isActive = 1 ?
        │                                                   └─ 0 → 401, nothing else runs
        ▼
req.organizer = { id, username, role }
        │
        ├─ role = super_admin ──► every event; organizer_events is never consulted
        │
        └─ role = event_admin ──► SELECT eventId FROM organizer_events WHERE organizerId = ?
                                          │
                                          ▼
                                  assertOwnsEvent(conn, organizer, eventId)
                                  outside the set → 403 (same shape as assertNotDemo)
```

`GET /api/events/all` becomes role-aware the same way: unfiltered for
`super_admin`, joined through `organizer_events` for `event_admin`. For a
`super_admin` who also organizes events, a separate "my events" view can join
`organizer_events` *by choice* (to show just the ones they run) — that is a
convenience filter, never the access boundary. Access for a super_admin is
always "all events."

---

## Full table reference

Every table as it will stand after 010. `PK` primary key, `FK` foreign key,
`UQ` unique, `+` added by 010.

### `organizers`

| | Column | Type | Notes |
|---|---|---|---|
| PK | `id` | `BIGINT UNSIGNED AUTO_INCREMENT` | |
| UQ | `username` | `VARCHAR(80)` | `uqOrganizerUsername` |
| **+** | **`role`** | **`ENUM('super_admin','event_admin') NOT NULL DEFAULT 'event_admin'`** | see above |
| **+** | **`isActive`** | **`TINYINT(1) NOT NULL DEFAULT 1`** | see above |
| | `passwordHash` | `VARCHAR(255)` | bcrypt |
| | `createdAt` | `TIMESTAMP` | |

### `organizer_events` — NEW

See "3. `organizer_events`" above.

### `events`

| | Column | Type | Notes |
|---|---|---|---|
| PK | `id` | `BIGINT UNSIGNED AUTO_INCREMENT` | |
| UQ | `slug` | `VARCHAR(80) NULL` | `uqEventSlug`; NULL allowed on purpose (deploy-window tolerance) |
| | `name` | `VARCHAR(160)` | |
| | `description` | `TEXT NULL` | |
| | `artists` | `JSON` | array of strings; also the source for `guest_passes.band` |
| | `eventDate` | `DATETIME` | stored UTC |
| | `openingTime` | `DATETIME` | stored UTC |
| | `venue` | `VARCHAR(200)` | |
| | `address` | `VARCHAR(200) NULL` | 002 |
| | `venueCapacity` | `INT UNSIGNED` | aforo ceiling; Σ stage `totalQuantity` ≤ this |
| | `flyerImageUrl` | `VARCHAR(500) NULL` | |
| | `bankQrImageUrl` | `VARCHAR(500) NULL` | |
| | `whatsappNumber` | `VARCHAR(20) NULL` | |
| | `isActive` | `TINYINT(1)` | **retired** — nothing new writes it; kept for `GET /api/events/active` |
| | `isPublished` | `TINYINT(1)` | 008 — gates the `/` grid only |
| | `isDemo` | `TINYINT(1)` | 008 — read-only showpiece; never writable via API |
| | `salesOpen` | `TINYINT(1)` | 008 — per-event online-sales switch |
| **+** | **`isArchived`** | **`TINYINT(1) NOT NULL DEFAULT 0`** | 012 — super-admin "put away" switch (hide from landing + default list, close sales), reversible |
| **+** | **`scanKeyword`** | **`VARCHAR(80) NULL`** | 013 — per-event public door-scan code; **never expose in public payloads** |
| | `createdAt` | `TIMESTAMP` | |

Migrations 012–013 add `isArchived` and `scanKeyword` (above); event ownership
lives in `organizer_events`, not here. Unchanged by 010.

### `ticket_stages`

| | Column | Type | Notes |
|---|---|---|---|
| PK | `id` | `BIGINT UNSIGNED AUTO_INCREMENT` | |
| FK | `eventId` | `BIGINT UNSIGNED` | → `events.id`, `ON DELETE CASCADE` |
| | `name` | `VARCHAR(80)` | |
| | `price` | `DECIMAL(12,2)` | COP |
| | `totalQuantity` | `INT UNSIGNED` | |
| | `soldQuantity` | `INT UNSIGNED` | |
| | `reservedQuantity` | `INT UNSIGNED` | |
| UQ | `sortOrder` | `SMALLINT UNSIGNED` | `uqStageOrder (eventId, sortOrder)` |
| | `activatesAt` | `DATETIME NULL` | scheduler promotion time |
| | `status` | `ENUM('upcoming','active','sold_out','closed')` | 007 added `closed` |
| UQ | `activeFlag` | `TINYINT GENERATED` | `1` iff `status = 'active'`, else NULL; `uqOneActiveStagePerEvent (eventId, activeFlag)` |

`CHECK chkStageCapacity (soldQuantity + reservedQuantity <= totalQuantity)`.
Unchanged by 010.

### `tickets`

One row per seat, created at reservation time. Full semantics in
[`TICKETS_SCHEMA.md`](TICKETS_SCHEMA.md).

| | Column | Type |
|---|---|---|
| PK | `id` | `BIGINT UNSIGNED AUTO_INCREMENT` |
| | `orderId` | `INT UNSIGNED` — shared by every row of one order |
| UQ | `orderAnchor` | `INT UNSIGNED NULL` — `= orderId` on row 0 only |
| FK | `eventId` | `BIGINT UNSIGNED` → `events.id` |
| FK | `stageId` | `BIGINT UNSIGNED` → `ticket_stages.id` |
| | `unitPrice` | `DECIMAL(12,2)` |
| | `holderName` | `VARCHAR(160) NULL` |
| | `holderIdNumber` | `VARCHAR(40) NULL` |
| | `holderPhone` | `VARCHAR(20) NULL` |
| | `deliveryMethod` | `ENUM('email','whatsapp')` |
| | `deliveryContact` | `VARCHAR(160)` |
| **+** | **`preferredArtist`** | **`VARCHAR(160) NULL`** — 011; buyer's chosen act, order-invariant, from `events.artists` |
| | `status` | `ENUM('pending_payment','payment_submitted','confirmed','rejected','expired')` |
| UQ | `idempotencyKey` | `CHAR(36) NULL` — row 0 only |
| | `reservationExpiresAt` | `DATETIME NULL` — NULL for walk-ins |
| | `createdAt` | `TIMESTAMP` |
| | `confirmedAt` | `DATETIME NULL` |
| | `confirmedBy` | `VARCHAR(80) NULL` |
| UQ | `validationHash` | `CHAR(64) NULL` — HMAC, minted only at confirm |
| | `isUsed` | `TINYINT(1)` |
| | `usedAt` | `DATETIME NULL` |

Migration 011 adds `preferredArtist` (above); nothing else on `tickets`
changes. Unchanged by 010.

### `guest_passes`

| | Column | Type | Notes |
|---|---|---|---|
| PK | `id` | `BIGINT UNSIGNED AUTO_INCREMENT` | |
| FK | `eventId` | `BIGINT UNSIGNED` | → `events.id` (no cascade) |
| | `band` | `VARCHAR(160)` | sourced from `events.artists` |
| | `holderName` | `VARCHAR(160)` | |
| | `holderIdNumber` | `VARCHAR(40)` | |
| | `type` | `ENUM('artist','crew','courtesy')` | |
| | `createdAt` | `TIMESTAMP` | |

Unchanged by 010. Already carries `eventId`, so scoping it to an event admin
is an authorization check, not a schema change.

### `order_counter`

| | Column | Type | Notes |
|---|---|---|---|
| PK | `id` | `TINYINT UNSIGNED` | always `1` |
| | `highWaterMark` | `INT UNSIGNED` | orderId floor; written only by `deleteAllPurchases`, read only by `nextOrderId` |

Unchanged by 010.

### `schema_migrations`

Runner ledger (`filename` PK, `appliedAt`), not domain data. 010 will add
its own row here when it applies.

---

## Relationships

| From (many) | To (one) | Constraint | On delete |
|---|---|---|---|
| **`organizer_events.organizerId`** | **`organizers.id`** | **`fkOrgEventOrganizer`** | **CASCADE** |
| **`organizer_events.eventId`** | **`events.id`** | **`fkOrgEventEvent`** | **CASCADE** |
| `ticket_stages.eventId` | `events.id` | `fkStageEvent` | CASCADE |
| `tickets.eventId` | `events.id` | `fkTicketV2Event` | restrict |
| `tickets.stageId` | `ticket_stages.id` | `fkTicketV2Stage` | restrict |
| `guest_passes.eventId` | `events.id` | `fkGuestPassEvent` | restrict |

`order_counter` and `schema_migrations` have no foreign keys.

---

## Validation checklist

**Migration 010 — roles + ownership**

- [ ] Many-to-many (`organizer_events`) rather than a single `events.ownerId` column.
- [ ] `role` defaults to `event_admin`; the migration itself promotes the rows that exist when the column is created (guarded, runs once).
- [ ] `isActive` on `organizers` for revoke-without-delete; `requireOrganizer` must reject `isActive = 0`.
- [ ] A `super_admin` may hold `organizer_events` rows (attribution for events they personally run), but the authorization check consults the table only for `event_admin`s — access branches on `role` first.
- [ ] `ON DELETE CASCADE` on both join-table FKs.
- [ ] `PRIMARY KEY (organizerId, eventId)` + `idxOrgEventsByEvent (eventId)`.
- [ ] Numbered `010`; `009` stays reserved for the fresh-DB bootstrap.

**Migration 011 — preferred artist**

- [ ] `tickets.preferredArtist VARCHAR(160) NULL`, `AFTER deliveryContact`.
- [ ] Order-invariant (same on every seat row of an order), sourced from `events.artists`; **required at the API for new orders** — public wizard **and** walk-in (400 on missing/invalid), DB column `NULL`-able only for legacy rows.
- [ ] Walk-in `TicketForm` gains the required artist dropdown and **drops the phone field**.

**Migration 012 — event archive**

- [ ] `events.isArchived TINYINT(1) NOT NULL DEFAULT 0`, `AFTER salesOpen`.
- [ ] Archive is a reversible super-admin switch (hide from landing + default list, close sales); **no `DELETE` route**, no `ON DELETE CASCADE` to `tickets`.

**Migration 013 — scan keyword**

- [ ] `events.scanKeyword VARCHAR(80) NULL`, `AFTER isArchived`.
- [ ] Backs a public event+keyword `/scan` flow (no organizer login; event-scoped; concurrent); `NULL` disables public scanning for that event.
- [ ] **`scanKeyword` never appears in a public event payload** — organizer-edit fetch only; public scan endpoints rate-limited.
- [ ] No changes to `ticket_stages`, `guest_passes`, `order_counter`, and no other column on `events` or `tickets` beyond 012's `isArchived`.

## Resolved 2026-09-15 (see `MULTI_EVENT_PLAN.md` → "Phase 2")

- Event creation is **`super_admin`-only**; `event_admin`s edit their assigned
  events but never create.
- **No event deletion — events are archived** (`isArchived`, migration 012),
  reversibly, by a `super_admin`. The plan's "events are never destroyed" rule
  stands. A delete was considered and dropped: `tickets → events` is a
  `RESTRICT` FK, so destroying an event's rows would need an
  `order_counter`-safe wipe to avoid the QR-collision hazard — not worth it
  when archiving does the job. **Never add an `ON DELETE CASCADE` from
  `tickets` to `events`, or a `DELETE /api/events/:id` route.** Demo is never
  archivable (`assertNotDemo`).
- Accounts + role/ownership assignment go through **two new `super_admin`-only
  pages**, not scripts. A `super_admin` may also hold `organizer_events` rows
  (attribution for events they personally run).
- **`preferredArtist` is required at the walk-in door too** (not just the public
  wizard); the walk-in `TicketForm` gains the required dropdown and drops its
  phone field.
- **`/guest-passes` is role-scoped** (event_admin sees only its events; super_admin
  all). **`/scan` is NOT role-scoped** — it becomes a public, per-event,
  keyword-gated flow (`events.scanKeyword`, migration 013): pick event + type
  keyword → scan that event; no organizer login; many concurrent scanners.

## Still open

Nothing. `scanKeyword` stays plaintext by design; the picker lists only
keyword-enabled, non-archived events.
