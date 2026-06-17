<p align="center">
  <img src="public/ticket-icon.svg" width="100" alt="Sígale Ticket Icon">
</p>

<h1 align="center">Sígale</h1>

<p align="center"><strong>Offline-first ticket management for events of any size.</strong></p>

---

> **Status: 1.0 shipped; migrating to 2.0.** The 1.0 app described below is offline-only and production-ready — see [`docs/architecture/PROJECT_OVERVIEW.md`](docs/architecture/PROJECT_OVERVIEW.md#recent-additions) for the post-launch additions. **2.0** turns Sígale outward — public ticket sales over MySQL + Express, with the new **Astromelias** identity. Start with [`docs/SIGALE_2.0_IMPLEMENTATION_PLAN.md`](docs/SIGALE_2.0_IMPLEMENTATION_PLAN.md).

## Why Sígale?

Most ticketing systems require servers, monthly fees, and constant internet. Sígale doesn't.

- **100 % offline** — your browser is the database.
- **Zero recurring cost** — no servers, no subscriptions, no vendor lock-in.
- **Portable** — export the whole event as JSON; import on any device.
- **Scalable enough** — ~10 k tickets in localStorage (≈ 300–400 B each, since QR codes are regenerated on demand from a 16-char SHA-256 hash rather than stored).

## Features

- Event setup with custom ticket types and per-type pricing
- Ticket sales with auto-generated IDs, validation hashes, and on-demand QR
- PNG ticket templates with a custom mascot illustration
- Camera-based QR check-in with duplicate / wrong-event / out-of-window detection
- Bilingual UI (Spanish / English, browser auto-detected)
- Editable ticket table with paste-from-spreadsheet bulk add
- Sales + check-in dashboards
- JSON / CSV / PDF export, JSON import for backup & device handoff
- PWA-installable with offline shell

## Quick start

```bash
git clone https://github.com/your-username/sigale.git
cd sigale
npm install
npm run dev
```

Open <http://localhost:5173> and create your first event.

```bash
npm run build    # Production build → dist/
npm test         # vitest test suite
npm run lint     # ESLint
```

Deploy the `dist/` folder to any static host (Netlify, Vercel, GitHub Pages, etc.). HTTPS is required in production for camera access.

## How it works

```
CREATE EVENT ───────► SELL TICKETS ───────► VALIDATE
     │                     │                    │
     ▼                     ▼                    ▼
 Name, date          Buyer info            Camera scan
 Venue, time         Auto ticket ID        Hash lookup
 Ticket types        16-char hash          Duplicate check
                     QR on demand          Check-in mark
                          │
                          ▼
                  ┌───────────────┐
                  │  localStorage │
                  │  (~400 B/tkt) │
                  └───────────────┘
```

QR codes are never stored — they're regenerated from each ticket's validation hash, which is what makes ~10 k tickets fit in a localStorage budget.

## Tech stack

React 19 · Vite · plain CSS (design tokens + CSS Modules, no Tailwind) · React Router v7 · `qrcode.react` · `html5-qrcode` · `jspdf` · Web Crypto API.

Browser support: Chrome/Edge 90+, Firefox 88+, Safari 14+.

## Documentation

| Audience | Start here |
|----------|-----------|
| Working on the codebase (or having Claude do it) | [`CLAUDE.md`](CLAUDE.md) |
| Reading the technical design | [`docs/architecture/PROJECT_OVERVIEW.md`](docs/architecture/PROJECT_OVERVIEW.md) |
| Picking visuals / tokens | [`docs/design/STYLE_GUIDE.md`](docs/design/STYLE_GUIDE.md) |
| All other guides (CSV, mobile testing, iOS persistence, audit lessons) | [`docs/README.md`](docs/README.md) |

## Contributing

Before contributing, scan `CLAUDE.md` for the rules — particularly:

- mobile-first, 44×44 px touch targets, 16 px base font;
- plain CSS only — design tokens + CSS Modules, no Tailwind / no CSS framework;
- all native `alert` / `confirm` / `prompt` go through `useDialog()`;
- dates always through `parseLocalDate` / `toLocalDateString`;
- code and comments in English; UI strings in `src/utils/translations.js` (ES + EN).

## License

© 2025 David Ramírez T. — Bogotá, Colombia.

Free for personal, educational, and non-profit community events. **Commercial use is not permitted** without explicit permission.

For commercial inquiries: <jdramirezt@unal.edu.co>.

<p align="center"><sub>Built with ❤️ in Bogotá.</sub></p>
