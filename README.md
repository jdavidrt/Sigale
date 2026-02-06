<p align="center">
  <img src="public/vite.svg" width="80" alt="Sígale Logo">
  <h1 align="center">Sígale</h1>
  <p align="center">
    <strong>Offline-first ticket management for events of any size</strong>
  </p>
  <p align="center">
    <a href="#features">Features</a> &bull;
    <a href="#quick-start">Quick Start</a> &bull;
    <a href="#how-it-works">How It Works</a> &bull;
    <a href="#documentation">Docs</a>
  </p>
</p>

---

## Why Sígale?

Most ticketing systems require servers, monthly fees, and constant internet. **Sígale works differently.**

- **100% Offline** — No internet required. Your browser is the database.
- **Zero Costs** — No servers, no subscriptions, no vendor lock-in.
- **Portable** — Export your entire event as JSON. Import anywhere.
- **Scalable** — Hold 10,000+ tickets in localStorage.

---

## Features

| | Feature | Description |
|---|---------|-------------|
| **Event Setup** | Custom branding, unlimited ticket types, dynamic pricing |
| **Ticket Sales** | Auto-generated IDs, SHA-256 validation hashes, instant QR |
| **PNG Templates** | Professional tickets with custom Charly illustration |
| **QR Scanning** | Real-time camera validation with duplicate detection |
| **Check-in** | Color-coded results (green/red/orange), attendance tracking |
| **Bilingual** | Spanish/English with browser auto-detection |
| **Dashboard** | Sales analytics, revenue by type, check-in stats |
| **Data Export** | Copy to clipboard, download JSON, full backup/restore |
| **PWA Ready** | Installable, works offline, service worker support |

---

## Quick Start

```bash
git clone https://github.com/your-username/sigale.git
cd sigale && npm install
npm run dev
```

Open **http://localhost:5173** — Create your first event.

---

## How It Works

```
CREATE EVENT ──────────> SELL TICKETS ──────────> VALIDATE
     │                        │                       │
     ▼                        ▼                       ▼
 Name, date              Buyer info              Camera scan
 Venue, time             Ticket ID               Hash lookup
 Colors, types           SHA-256 hash            Duplicate check
                         QR on-demand            Check-in mark
                         PNG template
                              │
                              ▼
                    ┌─────────────────┐
                    │  localStorage   │
                    │  (JSON ~400B    │
                    │   per ticket)   │
                    └─────────────────┘
```

**Key insight**: QR codes are never stored—they're generated on-demand from validation hashes, reducing storage by ~95%.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 19 |
| **Build** | Vite |
| **Styling** | Tailwind CSS v4 |
| **QR Gen** | qrcode.react |
| **QR Scan** | html5-qrcode |
| **Crypto** | Web Crypto API (SHA-256) |
| **Storage** | localStorage |
| **Routing** | React Router v6 |

---

## Project Structure

```
src/
├── components/
│   ├── Dashboard/       # Sales & check-in analytics
│   ├── Event/           # Event creation/editing
│   ├── Layout/          # Navbar, main wrapper
│   ├── Scanner/         # Camera QR validation
│   ├── Tickets/         # Form, card, list, QR display
│   └── Common/          # Shared components
├── context/
│   ├── EventContext     # Event state + CRUD
│   ├── TicketContext    # Tickets + getStats()
│   └── LanguageContext  # i18n (ES/EN)
├── hooks/               # useLocalStorage, usePageVisibility, usePWAInstall
├── pages/               # Route components
└── utils/               # hashGenerator, qrCopy, translations, timeFormat
```

---

## Routes

| Path | Purpose |
|------|---------|
| `/` | Home |
| `/create-event` | New event setup |
| `/edit-event` | Modify event |
| `/sell-tickets` | Register sales |
| `/tickets` | View all tickets |
| `/validate-qr` | Scan & validate |
| `/copy-event` | Export/import |
| `/dashboard` | Analytics |

---

## Data Format

```json
{
  "event": {
    "name": "Summer Festival 2025",
    "date": "2025-12-15",
    "venue": "National Stadium",
    "address": "123 Main St",
    "entranceTime": "19:00",
    "colors": { "base": "#1A1A2E", "emphasis": "#FF6B6B" },
    "ticketTypes": { "general": 50000, "vip": 100000 }
  },
  "tickets": [{
    "ticketId": "TKT-847-1728234567",
    "buyerName": "John Doe",
    "validationHash": "a7f3c2e1b9",
    "checkedIn": false
  }]
}
```

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome/Edge | 90+ |
| Firefox | 88+ |
| Safari | 14+ |

**Required**: Web Crypto, localStorage, Clipboard API, MediaDevices (camera)

**Note**: HTTPS required for camera access in production.

---

## Deployment

```bash
npm run build
```

Deploy `dist/` to any static host:

- **Netlify** — Drag & drop
- **Vercel** — `vercel --prod`
- **GitHub Pages** — Push to `gh-pages`

---

## Documentation

See [CLAUDE.md](CLAUDE.md) for development context and architecture details.

---

## License

MIT

---

<p align="center">
  <sub>Built for events that don't need the cloud.</sub>
</p>
