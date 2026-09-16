# `tickets` table — merged schema reference

## Status — **live in production**

This is the **current** shape of the `tickets` table. The cutover has run:
`tickets_v2` (created by `server/migrations/005_tickets_merge_schema.sql`) was
renamed to `tickets`, and the old order-level and seat-level tables survive as
`purchases_legacy_v1` and `tickets_legacy_v1`. Every controller in
`server/controllers/` queries the bare name `tickets` with the column set
described below; there are no `FROM purchases` queries left anywhere in the
running code.

Two consequences worth knowing before you touch migrations:

1. **`runMigrations.js` self-heals.** On boot it checks for a `tickets_legacy_v1`
   table; if present, it force-marks migrations `001`–`005` as applied in the
   `schema_migrations` ledger. Those files declare FK constraint names
   (`fkPurchase*`, `fkTicketV2*`) that the `RENAME TABLE` carried onto the
   renamed tables, so re-running them throws `ER_FK_DUP_NAME` (1826) and aborts
   the whole boot loop — which is what silently blocked `006_guest_passes` once.
2. **A brand-new empty database does not bootstrap correctly.** `001_init.sql`
   still creates the *pre-merge* `tickets` table and no migration performs the
   rename, because the cutover was a manual one-off. Standing up a fresh
   environment therefore needs a new `008_*` migration that creates the merged
   table under its final name. Production is unaffected.

The one-off cutover script now lives at
`legacy/server/merge_purchases_into_tickets.js`. **It is destructive and must
never be run again.**

## What changed, in one sentence

Instead of an order-level `purchases` table (one row per order) plus a
seat-level `tickets` table (one row per seat, only created at confirm
time), there is now **one `tickets` table, one row per seat, created at
reservation time**, whose `status` transitions in place across the whole
lifecycle. Every row that shares an `orderId` is one order.

## Lifecycle

```
createPurchase (public)          confirmPurchase (organizer)
        │                                 │
        ▼                                 ▼
pending_payment ──submitPayment──► payment_submitted ──► confirmed
        │                                 │
        └──────────► expired ◄────────────┘  (sweepExpiredHolds, pending only)
        │
        └──────────► rejected  (rejectPurchase, from either pre-confirm state)

createWalkInSale (organizer) skips straight to: confirmed
```

All rows sharing one `orderId` move through this lifecycle **together** —
a single `UPDATE ... WHERE orderId = ?` flips every seat of the order at
once. There is no "spawn new rows at confirm" step anymore; confirm just
transitions rows that already existed since the reservation.

## Column reference

| Column | Type | Set when | Meaning |
|---|---|---|---|
| `id` | `BIGINT UNSIGNED AUTO_INCREMENT` | insert | Primary key. Identifies one seat/ticket. This is the id the frontend calls `dbId` and the id `PATCH`/`DELETE /api/admin/tickets/:id` operate on. |
| `orderId` | `INT UNSIGNED NOT NULL` | insert | Sequential, starts at 100 (`nextOrderId()` in `purchases.controllers.js`). **Shared by every row of one order** — this is the grouping key, not a per-row unique value. Displayed to buyers/organizers as `#orderId`. |
| `orderAnchor` | `INT UNSIGNED NULL`, `UNIQUE` | insert, **row 0 of the order only** | Equal to `orderId` on exactly one row per order, `NULL` on the rest. Pure collision-detection guard: since `orderId` itself can't carry a `UNIQUE` constraint anymore (N rows legitimately share it), this reproduces the old `uqOrderIdGlobal` protection — if two concurrent inserts ever compute the same candidate `orderId`, the second one's anchor row collides on this `UNIQUE` key and the insert retries with a new candidate. Never read by business logic. |
| `eventId` | `BIGINT UNSIGNED NOT NULL`, FK → `events.id` | insert | Denormalized from the stage at reservation time, so a ticket's event doesn't require joining through a stage-then-event chain. Same value on every row of an order. |
| `stageId` | `BIGINT UNSIGNED NOT NULL`, FK → `ticket_stages.id` | insert | Which pricing tier this seat was reserved from. Drives the `soldQuantity`/`reservedQuantity` counters on `ticket_stages`. |
| `unitPrice` | `DECIMAL(12,2) NOT NULL` | insert | `ticket_stages.price` **captured at reservation time**, immutable per row even if the stage's price changes later. Order total for display = `SUM(unitPrice) GROUP BY orderId` — there is no stored order-total column, so nothing can drift out of sync with the per-seat prices. |
| `holderName` | `VARCHAR(160) NULL` | insert (often `NULL`) or `submitPayment`/`confirmPurchase` | The ticket holder's name. Usually unknown at reservation time (the buyer picks quantity/stage first, holder names come later) — nullable until `submitPayment` or an organizer override at `confirmPurchase` fills it in. Positional mapping: `holders[i]` from the client always maps to the i-th row of the order (`ORDER BY id ASC`), since all rows of an order are inserted together in one statement. |
| `holderIdNumber` | `VARCHAR(40) NULL` | same as `holderName` | Holder's ID/cédula number. |
| `holderPhone` | `VARCHAR(20) NULL` | same as `holderName` | Holder's phone. |
| `deliveryMethod` | `ENUM('email','whatsapp') NOT NULL DEFAULT 'whatsapp'` | insert, patchable by `submitPayment` | How the organizer will deliver the ticket out-of-band. Same value on every row of an order. Walk-ins hardcode `'whatsapp'` (unused, since walk-ins hand the QR over in person). |
| `deliveryContact` | `VARCHAR(160) NOT NULL DEFAULT ''` | insert, patchable by `submitPayment` | The phone/email to deliver to. Walk-ins hardcode `'taquilla'` as a sentinel meaning "handed over at the door, nothing to deliver." |
| `status` | `ENUM('pending_payment','payment_submitted','confirmed','rejected','expired') NOT NULL DEFAULT 'pending_payment'` | insert, transitioned by `submitPayment`/`confirmPurchase`/`rejectPurchase`/`sweepExpiredHolds` | The order's lifecycle stage. Every row of an order always has the same `status` — they're flipped together in one `UPDATE ... WHERE orderId = ?`. |
| `idempotencyKey` | `CHAR(36) NULL`, `UNIQUE` | insert, **row 0 of the order only** | Client-supplied UUID for `createPurchase`'s idempotent-retry guard. Like `orderAnchor`, only the first row of a multi-row order carries it (the rest are `NULL`) so the `UNIQUE` constraint still catches a genuine duplicate submit without colliding against itself across the order's own rows. |
| `reservationExpiresAt` | `DATETIME NULL` | insert (public flow only) | 24h hold backstop (`createdAt + 24h`) — `sweepExpiredHolds` expires any `pending_payment` row past this. `NULL` for walk-in rows, which skip the reservation phase entirely and go straight to `confirmed`. |
| `createdAt` | `TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP` | insert | When this seat was reserved (or, for walk-ins, sold). All rows of one order share the same value — computed once per multi-row `INSERT` statement. Feeds the `purchaseDate` shown on ticket cards. |
| `confirmedAt` | `DATETIME NULL` | `confirmPurchase` / `createWalkInSale` | When the order was confirmed. `NULL` until then. |
| `confirmedBy` | `VARCHAR(80) NULL` | `confirmPurchase` / `createWalkInSale` | Organizer username who confirmed/sold it. |
| `validationHash` | `CHAR(64) NULL`, `UNIQUE` | **only at `confirmPurchase`/`createWalkInSale`, never before** | The door-scan secret the QR encodes (16 hex chars; the column is `CHAR(64)` for headroom). It's a **deterministic HMAC** — `HMAC_SHA256(SCAN_HASH_SECRET, "${orderId}:${seatIndex}").slice(0,16)` (`validationHashFor()` in `admin.controllers.js`), not a random value. Keying on `(orderId, seatIndex)` makes it unique per seat (satisfies `uqTicketHash`) and stable across holder edits, while `SCAN_HASH_SECRET` (env var, **must be set in production**) keeps it unguessable. Staying `NULL` until confirm is a deliberate security invariant: `markUsed()` in `scan.controllers.js` (the online scan + sync-reconciliation path) looks up a ticket by this hash — as long as it's only ever non-`NULL` on a `confirmed` row, an unpaid or rejected order can never be scanned in at the door. |
| `isUsed` | `TINYINT(1) NOT NULL DEFAULT 0` | door scan (`markUsed`) | Whether this seat has been checked in. Independent per row — each seat in a multi-ticket order is scanned separately. |
| `usedAt` | `DATETIME NULL` | door scan (`markUsed`) | When it was scanned. On a scan conflict (two offline devices), the earliest `usedAt` wins. |

## Planned column — `preferredArtist` (migration 011, NOT yet applied)

Drafted in `server/migrations/011_preferred_artist.sql`. **Application code
now reads/writes it** (`resolvePreferredArtist()` in
`purchases.controllers.js`, used by `createPurchase` and `createWalkInSale`;
`getAdminPurchases`/`getAdminTickets` surface it; `TicketForm` and
`PurchaseFlow` collect it — written 2026-09-15), and migration 011 is applied on production (2026-09-15).

| Column | Type | Set when | Meaning |
|---|---|---|---|
| `preferredArtist` | `VARCHAR(160) NULL` (placed `AFTER deliveryContact`) | `createPurchase` and `createWalkInSale`; `NULL` only on legacy rows or when the event has no line-up | The band/artist the buyer is coming to see, chosen from the event's own line-up (`events.artists`). **Order-invariant** — the same value on every row of an `orderId`, exactly like `deliveryMethod`/`deliveryContact`/`status`, because the buyer picks one act for the whole order. Free-form at the DB level (like `guest_passes.band`); the wizard constrains it to the event's artists. Powers a "which act sold the most tickets" report — see `docs/architecture/DB_SCHEMA.md`. |

## Indexes / constraints

- `PRIMARY KEY (id)`
- `UNIQUE KEY uqOrderAnchor (orderAnchor)` — order-creation collision guard (see above)
- `UNIQUE KEY uqTicketIdem (idempotencyKey)` — idempotent-retry guard (see above)
- `UNIQUE KEY uqTicketHash (validationHash)` — the scanner looks up by this
- `KEY idxOrderId (orderId)` — fetch/lock all rows of one order
- `KEY idxTicketEventStatus (eventId, status)` — per-event status filtering (`/admin`, `/tickets`)
- `KEY idxTicketSweeper (status, reservationExpiresAt)` — `sweepExpiredHolds`
- `KEY idxTicketContact (deliveryContact)`
- `KEY idxTicketStage (stageId)`
- `CONSTRAINT fkTicketV2Event FOREIGN KEY (eventId) REFERENCES events(id)`
- `CONSTRAINT fkTicketV2Stage FOREIGN KEY (stageId) REFERENCES ticket_stages(id)`

## What's gone

- **`purchases` table** — retired. Its former columns are now either
  denormalized onto every row of `tickets` (`eventId`, `stageId`,
  `deliveryMethod`, `deliveryContact`, `status`, `reservationExpiresAt`,
  `createdAt`, `confirmedAt`, `confirmedBy`) or computed on read
  (`quantity = COUNT(*)`, `totalAmount = SUM(unitPrice)`, both `GROUP BY
  orderId`).
- **`purchases.holdersSnapshot` (JSON)** — retired. This was the single
  biggest source of the duplication that motivated the merge: holder
  identity used to be stored once as a JSON blob pre-confirm and again as
  real columns post-confirm, and an admin override at confirm time could
  make the two drift silently. Now there is exactly one place holder
  identity lives — `holderName`/`holderIdNumber`/`holderPhone` directly
  on each row, from the moment it's known.
- **`tickets.purchaseId`** — retired. `orderId` is now the grouping key;
  there is no separate surrogate order id to join through.

## Derived values (no longer stored, computed instead)

| What you want | How to get it |
|---|---|
| Order quantity | `SELECT COUNT(*) FROM tickets WHERE orderId = ?` |
| Order total | `SELECT SUM(unitPrice) FROM tickets WHERE orderId = ?` |
| "The purchase" as one row (for `/admin`'s queue) | `GROUP BY orderId` with `ANY_VALUE()` on the order-invariant columns (`status`, `deliveryMethod`, `deliveryContact`, `createdAt`, stage name) — see `getAdminPurchases` in `server/controllers/admin.controllers.js` |
