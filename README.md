<p align="center">
  <img src="public/ticket-icon.svg" width="100" alt="Sígale Ticket Icon">
</p>

<h1 align="center">Sígale</h1>

<p align="center"><strong>Ticket sales, payment confirmation, and door check-in for independent live events.</strong></p>

---

> **Status: 2.0, in production.** Sígale is a mobile-first React 19 + Vite PWA
> backed by an Express + MySQL server. The backend runs merged into the shared
> BlackCoffe server; tickets live in a dedicated `sigale` MySQL database on
> DigitalOcean.
>
> Sígale 1.0 was an offline-only app where localStorage was the database. That
> architecture is gone. Documentation describing it has been moved to
> [`legacy/`](legacy/README.md) — don't take anything there as current.

## What it does

An organizer creates an event with staged pricing ("Etapa 1", "Etapa 2", …).
Buyers open a public landing page, reserve seats through a 6-step wizard, and
send their payment receipt over WhatsApp. The organizer confirms the payment
from the admin queue, which mints the ticket and its QR code, then delivers it
out-of-band (WhatsApp or email). At the door, staff scan QR codes against the
live database.

**Purchases never auto-deliver.** The buyer's wizard ends on a terminal screen —
*"as soon as our team validates your payment we'll send the ticket to
`<contact>`"*. There is no public order-status page. Delivery is the organizer's
job, done from `/tickets`.

## Features

- **Staged inventory** — multiple price stages per event, exactly one active at
  a time (enforced by a database constraint), with automatic promotion to the
  next stage on a timer or on sell-out
- **Public purchase wizard** — 6 steps, mobile-first, with a 24-hour seat hold
  that is swept automatically if payment never arrives
- **Organizer queue** — confirm or reject each order; confirming mints a
  per-seat QR validation hash
- **Walk-in sales** — box-office form that writes straight to the database as
  confirmed, drawing only from the currently active stage
- **Guest passes** — a separate free-entry roster for artists, crew, and
  courtesies, counted per band; never touches the paid-ticket pipeline
- **Door scanning** — camera QR check-in validated against the live database,
  with duplicate-entry detection
- **Printable door list** and CSV export for the ticket table
- **Sales + check-in dashboards** fed from the server, not local state
- **Bilingual UI** (Spanish / English, browser auto-detected), PWA-installable

Online sales can be closed without a deploy-shaped change by flipping
`ONLINE_SALES_OPEN` in [`src/config.js`](src/config.js); the landing page then
points buyers to the box office instead of the purchase wizard. **It is
currently `false`.**

## Quick start

The frontend dev server proxies straight to the production API — there is
normally **no local backend to start**:

```bash
npm install
npm run dev          # http://localhost:5173
```

```bash
npm run build        # Production build → dist/
npm run preview      # Serve the build
npm run lint         # ESLint
npm test             # Vitest
```

To run the full stack locally against a local database instead, see
[`docs/LOCAL_TESTING.md`](docs/LOCAL_TESTING.md) and the `dev-local.ps1` launcher.

## How it works

```
  PUBLIC BUYER                    ORGANIZER                     DOOR
  ───────────                     ─────────                     ────
  /compra wizard                  /admin queue                  /scan
       │                               │                          │
       ▼                               ▼                          ▼
  reserve seats  ──────────►  confirm payment  ──────────►  scan QR hash
  (24h hold)                  mints validationHash          mark as used
       │                               │                          │
       └───────────────┬───────────────┴──────────────────────────┘
                       ▼
              ┌──────────────────┐
              │  MySQL `sigale`  │   one `tickets` row per seat,
              │  (DigitalOcean)  │   status transitions in place
              └──────────────────┘
```

QR codes are never stored. Each confirmed seat gets a deterministic HMAC
(`validationHash`) derived from its order and seat index, and the QR image is
regenerated from that string on demand.

## Tech stack

**Frontend** — React 19 · Vite 7 · React Router 7 · plain CSS (design tokens +
CSS Modules + the Astromelias layer; **no Tailwind, no CSS framework**) ·
`qrcode.react` · `html5-qrcode` · Font Awesome · Web Crypto API

**Backend** — Express 4 · `mysql2/promise` · MySQL 8 · `node-cron` · `bcryptjs` ·
`helmet` · `express-rate-limit` · `resend`

Browser support: Chrome/Edge 90+, Firefox 88+, Safari 14+. HTTPS is required in
production for camera access.

## Documentation

| Audience | Start here |
|----------|-----------|
| Working on the codebase (or having Claude do it) | [`CLAUDE.md`](CLAUDE.md) |
| Reading the technical design | [`docs/architecture/PROJECT_OVERVIEW.md`](docs/architecture/PROJECT_OVERVIEW.md) |
| Understanding the ticket table | [`docs/architecture/TICKETS_SCHEMA.md`](docs/architecture/TICKETS_SCHEMA.md) |
| Backend, migrations, deploy | [`server/README.md`](server/README.md) |
| Picking visuals / tokens | [`docs/design2.0/IMPLEMENTATION_GUIDE.md`](docs/design2.0/IMPLEMENTATION_GUIDE.md) |
| Everything else | [`docs/README.md`](docs/README.md) |
| Retired docs and dead code (history only) | [`legacy/README.md`](legacy/README.md) |

## Contributing

Before contributing, read `CLAUDE.md` — particularly:

- plain CSS only — design tokens + CSS Modules, no Tailwind / no CSS framework;
- mobile-first, 44×44 px touch targets, 16 px base font;
- no native `alert` / `confirm` / `prompt` — everything goes through `useDialog()`;
- dates always through `parseLocalDate` / `toLocalDateString` (never
  `new Date('YYYY-MM-DD')`);
- every real sale must persist server-side — never localStorage-only;
- code and comments in English; UI strings in `src/utils/translations.js` (ES + EN).

## License

© 2025 David Ramírez T. — Bogotá, Colombia.

Free for personal, educational, and non-profit community events. **Commercial use
is not permitted** without explicit permission.

For commercial inquiries: <jdramirezt@unal.edu.co>.

<p align="center"><sub>Built with ❤️ in Bogotá.</sub></p>
