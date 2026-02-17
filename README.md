<p align="center">
  <img src="public/ticket-icon.svg" width="100" alt="Sígale Ticket Icon">
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

> **Project Status**: ✅ **Fully Implemented & Production Ready**
> All core features complete. Ready for deployment and real-world event management.

---

## Why Sígale?

Most ticketing systems require servers, monthly fees, and constant internet. **Sígale works differently.**

- **100% Offline** — No internet required. Your browser is the database.
- **Zero Costs** — No servers, no subscriptions, no vendor lock-in.
- **Portable** — Export your entire event as JSON. Import anywhere.
- **Scalable** — Hold 10,000+ tickets in localStorage.

---

## Features

| Status | Feature | Description |
|--------|---------|-------------|
| ✅ | **Event Setup** | Custom branding, unlimited ticket types, dynamic pricing |
| ✅ | **Ticket Sales** | Auto-generated IDs, SHA-256 validation hashes, instant QR |
| ✅ | **PNG Templates** | Professional tickets with custom Charly illustration |
| ✅ | **QR Scanning** | Real-time camera validation with duplicate detection |
| ✅ | **Check-in** | Color-coded results (green/red/orange), attendance tracking |
| ✅ | **Bilingual** | Spanish/English with browser auto-detection |
| ✅ | **Dashboard** | Sales analytics, revenue by type, check-in stats |
| ✅ | **Data Export** | Copy to clipboard, download JSON, full backup/restore |
| ✅ | **CSV Import/Export** | Bulk ticket management via CSV files |
| ✅ | **PWA Ready** | Installable, works offline, service worker support |
| ✅ | **iOS Optimized** | Enhanced persistence and background state handling |

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

Comprehensive documentation is available in the `/docs` folder, organized by topic:

### Quick Links

- **[CLAUDE.md](CLAUDE.md)** — AI development guide and system architecture
- **[Architecture Overview](docs/architecture/PROJECT_OVERVIEW.md)** — System design and technical details
- **[Style Guide](docs/design/STYLE_GUIDE.md)** — Design system and component specifications
- **[Mobile Testing](docs/guides/MOBILE_TESTING.md)** — Testing procedures and device compatibility
- **[CSV Feature Guide](docs/features/CSV_FEATURE_GUIDE.md)** — Bulk import/export documentation
- **[iOS Persistence](docs/guides/ios-persistence-guide.md)** — iOS Safari storage optimization

### Documentation Structure

```
docs/
├── architecture/     # System architecture and project overview
├── design/          # UI/UX design, style guides, visual specs
├── features/        # Feature-specific documentation
├── guides/          # Platform compatibility and development guides
└── implementation/  # Development stage documentation (completed)
```

See [docs/README.md](docs/README.md) for the complete documentation index.

---

## Contributing

Before contributing, please review:

1. **[CLAUDE.md](CLAUDE.md)** — Development guidelines and architecture
2. **[Style Guide](docs/design/STYLE_GUIDE.md)** — Design system and coding standards
3. **[Implementation Stages](docs/implementation/)** — Historical development context

**Key Guidelines:**
- Mobile-first approach (44x44px minimum touch targets)
- Tailwind CSS v4 (no `@apply` directive)
- All code and comments in English
- Test on iOS Safari and Chrome/Edge
- Bilingual support (Spanish/English)

---

## License

**© 2025 David Ramírez T.**

This project was created by **David Ramírez T.** in **Bogotá, Colombia**.

**Commercial use is not permitted.**
- You may use this software for personal, educational, or non-profit community events.
- You may **not** use this software to charge for ticketing services or sell it as a product without explicit permission.

For commercial inquiries, please contact the author jdramirezt@unal.edu.co 

---

<p align="center">
  <sub>Built with ❤️ in Bogotá, Colombia.</sub>
</p>
