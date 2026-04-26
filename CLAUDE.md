# Sígale - Ticket Management System

## Project Overview
**Type**: Mobile-First Static React Web App
**Purpose**: Concert ticket management with QR generation, validation & analytics
**Stack**: React 19 + Vite + Tailwind CSS v4 + localStorage (no backend)

## Status: FULLY IMPLEMENTED

All features complete:
- Event creation/editing with dynamic ticket types and color theming
- Ticket sales with auto-generated IDs and 10-char validation hashes
- QR code generation (on-demand from hash, never stored)
- PNG ticket templates with Charly illustration
- Camera-based QR scanning with duplicate detection
- Bilingual support (Spanish/English, auto-detects browser)
- Dashboard with sales/check-in analytics
- Full data export/import via JSON
- PWA support with service worker
- Error boundary and page visibility handling

## Architecture

### Data Storage
- All data in localStorage as JSON (key: `sigale-event-data`)
- ~300-400 bytes/ticket, capacity: 10,000-15,000 tickets
- QR codes generated on-demand from validation hash (never stored)

### Context API (3 providers)
- `EventContext`: Event details, colors, ticket types
- `TicketContext`: Tickets, check-ins, stats via `getStats()`
- `LanguageContext`: i18n with `t()` function

### Routes
```
/                 Home
/create-event     Event creation
/edit-event       Event editing
/sell-tickets     Ticket sales
/tickets          Ticket list
/validate-qr      QR scanner
/copy-event       Export data
/dashboard        Analytics
*                 Catch-all → <Navigate to="/" replace /> (any unmatched path redirects to Home)
```

## Key Files

```
src/
├── context/
│   ├── EventContext.jsx      # Event CRUD
│   ├── TicketContext.jsx     # Tickets + stats
│   └── LanguageContext.jsx   # i18n (ES/EN)
├── components/
│   ├── Tickets/              # TicketForm, TicketCard, TicketList, QRDisplay
│   ├── Scanner/              # QRScanner, ValidationResult
│   ├── Dashboard/            # SalesDashboard, CheckInDashboard
│   └── Common/               # SlideToConfirm
├── utils/
│   ├── hashGenerator.js      # SHA-256 hash (Web Crypto API)
│   ├── qrGenerator.js        # QR data encode/parse
│   ├── qrCopy.js             # Copy PNG/SVG, share
│   ├── svgTicketTemplate.js  # PNG ticket with Charly
│   ├── timeFormat.js         # 12h time, parseLocalDate (no timezone bugs)
│   └── translations.js       # ES/EN dictionary
└── hooks/
    ├── useLocalStorage.js    # localStorage sync
    ├── usePageVisibility.js  # iOS tab suspension
    └── usePWAInstall.js      # PWA install prompt
```

## Data Structure

```json
{
  "event": {
    "name": "Event Name",
    "date": "2025-12-15",
    "venue": "Venue",
    "address": "Address",
    "entranceTime": "19:00",
    "colors": { "base": "#1A1A2E", "emphasis": "#FF6B6B" },
    "ticketTypes": { "preventa": 50000, "vip": 100000 }
  },
  "tickets": [{
    "ticketId": "TKT-XXX-timestamp",
    "buyerName": "Name",
    "buyerId": "ID",
    "buyerPhone": "Phone",
    "ticketType": "preventa",
    "purchaseDate": "2025-10-06",
    "validationHash": "a7f3c2e1b9",
    "checkedIn": false,
    "checkInTime": null
  }]
}
```

## Critical Notes

### Tailwind CSS v4
**NEVER use `@apply`** - causes errors. Use plain CSS with hex colors:
```css
/* CORRECT */
body { color: #111827; }

/* WRONG - will error */
body { @apply text-gray-900; }
```

### Mobile-First Classes
Always write mobile-first, add responsive modifiers:
```jsx
<div className="p-4 md:p-6 lg:p-8">
<div className="grid grid-cols-1 md:grid-cols-2">
```

### Date Handling
Use `parseLocalDate()` from `timeFormat.js` to avoid timezone issues.

### Code Style
- Components: PascalCase (`TicketForm.jsx`)
- Hooks: camelCase with `use` prefix
- All code and comments in English
- Touch targets: minimum 44x44px
- Base font: 16px (prevents iOS zoom)

## Dependencies
```
react, react-dom, react-router-dom
qrcode.react (QR generation)
html5-qrcode (camera scanning)
tailwindcss, vite
```

## Commands
```bash
npm run dev      # Development
npm run build    # Production build
```

## Browser Requirements
Chrome/Edge 90+, Firefox 88+, Safari 14+
HTTPS required for camera access

## Documentation Structure

Project documentation is organized in `/docs` with topic-based folders:

```
docs/
├── architecture/       # System architecture and project overview
├── design/            # UI/UX design, style guides, visual specifications
├── features/          # Feature-specific documentation (CSV export/import)
├── guides/            # Platform compatibility, mobile testing, development guides
└── implementation/    # Completed development stages (stage 1-3)
```

**Key Documentation:**
- **Architecture**: `docs/architecture/PROJECT_OVERVIEW.md`
- **Design System**: `docs/design/STYLE_GUIDE.md`
- **Mobile Testing**: `docs/guides/MOBILE_TESTING.md`
- **iOS Persistence**: `docs/guides/ios-persistence-guide.md`
- **CSV Features**: `docs/features/CSV_FEATURE_GUIDE.md`
- **Development Stages**: `docs/implementation/stage1-foundation.md` (1-3)

Historical assets and mockups are archived in `/archive` for reference.

## Recent Enhancements

- CSV bulk import/export for ticket data management
- Enhanced mobile persistence for iOS Safari
- Improved error boundaries and edge case handling
- Page visibility API integration for background state management
- PWA manifest and service worker for offline capability
- Share API integration for ticket distribution

## Performance Metrics

- Initial load: <2s on 4G
- Ticket generation: <100ms
- QR scan validation: <500ms
- Storage capacity: 10,000-15,000 tickets (~400 bytes each)
- PWA install size: ~500KB (gzipped)

## Development Workflow

1. Read relevant documentation from `/docs` before making changes
2. Follow mobile-first approach with touch-friendly UI (44x44px minimum)
3. Test on both iOS Safari and Chrome/Edge
4. Verify localStorage persistence and quota handling
5. Test camera permissions and QR scanning in HTTPS environment
6. Validate bilingual content (Spanish/English)
