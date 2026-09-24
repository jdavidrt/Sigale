# Data model — MySQL schema `sigale`

Sígale owns only these tables, in its own `sigale` schema on a DigitalOcean
cluster it shares with BlackCoffe. It never reads or writes BlackCoffe's
tables (`orders`, `deposits`, `clients`, `products`, `users`). Timestamps are
stored in UTC and read back with `CONVERT_TZ` to America/Bogota.

```
organizers ──< organizer_events >── events ──< ticket_stages
                                       │              │
                                       ├──< tickets >─┘   (one row per seat)
                                       └──< guest_passes
order_counter (one row)          schema_migrations (runner ledger)
```

## Tables

### `organizers`

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT UNSIGNED PK | |
| `username` | VARCHAR(80) UNIQUE | |
| `passwordHash` | VARCHAR(255) | bcrypt; never returned by the API |
| `role` | ENUM(`super_admin`, `event_admin`) | default `event_admin` |
| `isActive` | TINYINT(1) | `0` fails login exactly like a wrong password |
| `createdAt` | TIMESTAMP | |

### `organizer_events`

`(organizerId, eventId)` composite PK, both FKs `ON DELETE CASCADE`. For an
`event_admin` a row **grants** access to that event; a `super_admin` needs no
row (role alone grants everything) — for it the row is attribution only.
`createEvent` inserts the creator's row.

### `events`

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT UNSIGNED PK | |
| `slug` | VARCHAR(80) NULL, UNIQUE | `^[a-z0-9]+(-[a-z0-9]+)*$`; reserved words → 409; duplicate → 409 "Esa URL ya está en uso" |
| `name`, `description` | VARCHAR(160), TEXT | |
| `artists` | JSON | array of strings: the line-up; source for `preferredArtist` and `guest_passes.band` |
| `eventDate`, `openingTime` | DATETIME | UTC |
| `venue`, `address` | VARCHAR(200) | |
| `venueCapacity` | INT UNSIGNED | Σ stage `totalQuantity` ≤ this (409 otherwise) |
| `flyerImageUrl`, `bankQrImageUrl` | VARCHAR(500) | external URLs |
| `whatsappNumber` | VARCHAR(20) | `57XXXXXXXXXX`; also the Bre-B payment key shown in the wizard |
| `isPublished` | TINYINT(1) | lists the event on `/`; unpublished events stay reachable by slug |
| `isDemo` | TINYINT(1) | the read-only showpiece; never writable through the API |
| `salesOpen` | TINYINT(1) | per-event online-sales switch (walk-ins ignore it) |
| `isArchived` | TINYINT(1) | reversible "put away": hidden from `/` and the default organizer list, no new sales, no stage auto-activation |
| `scanKeyword` | VARCHAR(80) NULL | shared door code for `/scan`; **never in a public payload** |
| `isActive` | TINYINT(1) | unused; left over from the single-event schema |
| `createdAt` | TIMESTAMP | |

Events are never deleted — archive instead.

### `ticket_stages`

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT UNSIGNED PK | |
| `eventId` | FK → `events` | `ON DELETE CASCADE` |
| `name`, `price` | VARCHAR(80), DECIMAL(12,2) | COP |
| `totalQuantity`, `soldQuantity`, `reservedQuantity` | INT UNSIGNED | `CHECK sold + reserved <= total` |
| `sortOrder` | SMALLINT UNSIGNED | UNIQUE per event |
| `activatesAt` | DATETIME NULL | scheduler promotion time |
| `status` | ENUM(`upcoming`, `active`, `sold_out`, `closed`) | see invariants |
| `activeFlag` | generated | `1` iff `active`; `UNIQUE(eventId, activeFlag)` = one active stage per event |

### `tickets` — the only order table

One row per seat, created at reservation. An **order** is every row sharing
one `orderId`; quantity and total are `COUNT(*)` / `SUM(unitPrice)`
`GROUP BY orderId`.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT UNSIGNED PK | |
| `orderId` | INT UNSIGNED | from 100, one sequence across all events, shared by the order's rows |
| `orderAnchor` | INT UNSIGNED NULL, UNIQUE | `= orderId` on the order's first row only (collision guard) |
| `idempotencyKey` | CHAR(36) NULL, UNIQUE | first row only |
| `eventId`, `stageId` | FKs (restrict) | |
| `unitPrice` | DECIMAL(12,2) | |
| `holderName`, `holderIdNumber`, `holderPhone` | NULL until known | positional: `holders[i]` → i-th row of the order |
| `deliveryMethod`, `deliveryContact` | ENUM(`email`, `whatsapp`), VARCHAR(160) | set at wizard step 5; how the organizer reaches the buyer |
| `preferredArtist` | VARCHAR(160) NULL | same on every row of an order; required when the event has a line-up |
| `status` | ENUM | `pending_payment` → `payment_submitted` → `confirmed` \| `rejected`; `pending_payment` → `expired` |
| `reservationExpiresAt` | DATETIME NULL | `createdAt + 24h`; NULL for walk-ins |
| `confirmedAt`, `confirmedBy` | | |
| `validationHash` | CHAR(64) NULL, UNIQUE | NULL until confirm — the scanner relies on that |
| `isUsed`, `usedAt` | | set by the door scan |

`validationHash = HMAC_SHA256(SCAN_HASH_SECRET, "orderId:seatIndex")`
truncated to 16 hex chars. The QR encodes the bare hash and is never stored.
Rotating `SCAN_HASH_SECRET` invalidates every issued QR.

### `guest_passes`

Free-entry roster: `eventId` (FK, restrict), `band` (from `events.artists`),
`holderName`, `holderIdNumber`, `type` ENUM(`artist`, `crew`, `courtesy`),
`createdAt`. No price, hash, QR or scan — never join it into tickets,
dashboard stats or scanning. Door staff check it by name/ID
(`/lista-puerta`).

### `order_counter`

One row (`id = 1`, `highWaterMark`). A floor for `nextOrderId`, written only
by `deleteAllPurchases`.

### `schema_migrations`

The runner's ledger (`filename` PK, `appliedAt`).

## Invariants

**orderIds are never reused.** A reissued `orderId` would make an already
delivered QR admit a different ticket, because the hash is keyed on
`(orderId, seatIndex)`. `nextOrderId = GREATEST(MAX(tickets.orderId),
highWaterMark) + 1` (minimum 100), and `deleteAllPurchases` bumps the counter
before deleting. Any new bulk-delete path must bump it too.

**Inventory writes** use `getConnection()` → `beginTransaction()` →
`SELECT … FOR UPDATE` → mutate → commit/rollback, releasing in `finally`.
Never `pool.query` for inventory. The counters are unsigned:
`GREATEST(unsigned − n, 0)` wraps to 4 294 967 295 instead of clamping.

**Stage status** — the scheduler owns `upcoming → active` on `activatesAt`;
every other transition belongs to the code path that changes the counters:

| Transition | Trigger | Where |
|---|---|---|
| `active → sold_out` | sold + reserved ≥ total after an increment | `createPurchase`, `createWalkInSale` |
| `upcoming → active` + filled stage `→ closed` | sold-out cascade: next `upcoming` stage with no `activatesAt` | same |
| `sold_out → active` | sold + reserved < total after a decrement | `rejectPurchase`, `deleteAdminTicket`, `sweepExpiredHolds`, `updateEvent` (raised quota), `deleteAllPurchases` |
| `active → closed` | superseded or orphaned stage | `activateDueStages`, `updateEvent` |

- `sold_out` = temporarily full, auto-restored. `closed` = permanent; nothing
  reopens it. Never mark a superseded stage `sold_out`.
- Any promotion must first demote the current active stage to `closed` in the
  same transaction, or the unique index throws `ER_DUP_ENTRY`.
- `sweepExpiredHolds` and `deleteAllPurchases` restore only when the event has
  no other active stage; `deleteAllPurchases` reopens at most one stage.
- Only rows that still hold inventory may be restored: `confirmed` → sold,
  `pending_payment` / `payment_submitted` → reserved. `rejected` / `expired`
  were already released.
- `confirmPurchase` moves reserved → sold with no status change;
  `rejectPurchase` / `confirmPurchase` short-circuit on terminal states.
- `updateEvent` returns 409 if a stage's `totalQuantity` would drop below
  sold + reserved.

## Migrations

`server/migrations/*.sql`, applied once each in filename order before the
server listens, tracked in `schema_migrations`. The DDL is idempotent
(`IF NOT EXISTS`, guarded `ALTER`s).

| File | Adds |
|---|---|
| `001`–`005` | The original schema and the purchases→tickets merge. On a cut-over database (`tickets_legacy_v1` present) the runner marks them applied without executing them. Do not delete or renumber |
| `006_guest_passes` | `guest_passes` |
| `007_single_active_stage` | `closed` status, `activeFlag` + `uqOneActiveStagePerEvent` |
| `008_multi_event` | `events.slug`, `isPublished`, `isDemo`, `salesOpen`; `order_counter` |
| `010_organizer_roles` | `organizers.role`, `isActive`; `organizer_events` |
| `011_preferred_artist` | `tickets.preferredArtist` |
| `012_event_archive` | `events.isArchived` |
| `013_scan_keyword` | `events.scanKeyword` |
| `014_promote_david_superadmin` | data only: the first account → `super_admin` |

All are applied in production. `009` is unused. **A fresh, empty database does
not bootstrap**: `001` creates the pre-merge tables and nothing renames them,
so a new environment needs a `009_*` migration that creates the merged
`tickets` table under its final name. Production also keeps
`purchases_legacy_v1` / `tickets_legacy_v1` from the merge.
