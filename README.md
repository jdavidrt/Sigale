<p align="center">
  <img src="public/ticket-icon.svg" width="100" alt="Sígale Ticket Icon">
</p>

<h1 align="center">Sígale</h1>

<p align="center"><strong>Ticket sales, payment confirmation and door check-in for independent live events.</strong></p>

---

Sígale is a mobile-first React 19 + Vite PWA with an Express + MySQL backend,
in production at [sigale.onrender.com](https://sigale.onrender.com). Many
events sell at once, each at its own URL.

## How it works

1. **Buyers** open `/:slug`, reserve seats in a 6-step wizard and send their
   payment screenshot over WhatsApp. Seats are held for 24 hours.
2. **Organizers** confirm the payment in `/admin`, which mints a QR hash per
   seat, then send each ticket by WhatsApp or email from `/tickets`.
   Purchases never auto-deliver and there is no public order-status page.
3. **Door staff** open `/scan`, pick the event, type its door keyword and
   scan. Every scan is checked against the live database, so a ticket can
   only get in once.

Also included: staged pricing with automatic promotion on a timer or on
sell-out, box-office walk-in sales, free guest passes for artists and crew,
a printable door list, sales and check-in dashboards, per-event visual
skins, `super_admin` / `event_admin` roles, event archiving, a read-only demo
at `/demo`, and a Spanish / English UI.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173 — /api is proxied to PRODUCTION
npm run lint
npm run build
npm test         # Vitest
```

`npm run dev` talks to the live API, so any write you make from localhost is
real. To run the backend locally, see [`server/README.md`](server/README.md).

## Stack

React 19 · Vite 7 · React Router 7 · plain CSS (tokens + CSS Modules, no
framework) · `qrcode.react` · `html5-qrcode` — Express 4 · `mysql2` · MySQL 8 ·
`node-cron` · `bcryptjs` · `helmet` · `express-rate-limit` · Resend.

Chrome/Edge 90+, Firefox 88+, Safari 14+. The camera needs HTTPS.

## Documentation

Start at [`docs/README.md`](docs/README.md). Contributors (and coding agents)
read [`CLAUDE.md`](CLAUDE.md) first.

## License

© 2025 David Ramírez T. — Bogotá, Colombia. Free for personal, educational
and non-profit community events. **Commercial use is not permitted** without
explicit permission: <jdramirezt@unal.edu.co>.
