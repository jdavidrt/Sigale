# Sígale — Claude Agent Guide

Mobile-first React 19 + Vite + Tailwind v4 ticket-management PWA. Offline-only, localStorage-backed (no server). Bilingual ES/EN. Status: production-ready.

For depth, read `docs/architecture/PROJECT_OVERVIEW.md`. This file is the agent quick-reference.

---

## Critical rules (do/don't)

- **Tailwind v4**: never use `@apply`. Plain CSS with hex colors or CSS custom properties from `src/styles/tokens.css`.
- **Mobile-first**: write base styles for mobile, layer `md:` / `lg:` modifiers. Touch targets ≥ 44×44px. Base font 16px (prevents iOS zoom).
- **Dates**: always use `parseLocalDate()` / `toLocalDateString()` from `src/utils/timeFormat.js`. Never `new Date('YYYY-MM-DD')` (UTC bug at the day boundary).
- **No native `alert` / `confirm` / `prompt`**: use `useDialog()` from `src/context/DialogContext.jsx` → `confirm()`, `notify()`, `openCustom()`. The codebase is fully migrated; don't reintroduce them.
- **Currency**: use `formatCurrency()` from `timeFormat.js`. Don't roll inline `${n.toLocaleString()}`.
- **Code style**: components PascalCase, hooks `useCamelCase`, all code/comments in English.
- **Tests must pass**: `npm test` covers TicketContext, hashGenerator, qrGenerator, storage, timeFormat, csvUtils. Don't break their public API.

---

## Source tree

```
src/
├── App.jsx                        # Routes + provider tree (Language → Event → Ticket → Dialog)
├── assets/charlyIllustration.js   # Base64 mascot embedded at build time
├── components/
│   ├── Common/                    # SlideToConfirm, DebugPanel, Button.module.css, ErrorBoundary, Layout
│   ├── Dashboard/                 # SalesDashboard, CheckInDashboard, Dashboard.shared.module.css
│   ├── Event/                     # CreateEvent (covers create + edit)
│   ├── Layout/                    # Layout, Navbar, StorageErrorBanner
│   ├── Scanner/                   # QRScanner (html5-qrcode), ValidationResult
│   ├── Tickets/                   # TicketForm, TicketCard, TicketList, QRDisplay,
│   │                              # TicketTable, TicketTableRow, TicketsViewToggle,
│   │                              # TicketEditConfirm, CSVPanel
│   └── ui/                        # StatCell, EmptyStateCard, FieldLabel, Modal, Toast
├── context/
│   ├── EventContext.jsx           # Event CRUD; exposes hasEvent()
│   ├── TicketContext.jsx          # Tickets, addTicketsFromCSV (dedup), getStats(), storageError
│   ├── LanguageContext.jsx        # i18n: t(), language, toggleLanguage
│   └── DialogContext.jsx          # confirm/notify/openCustom + Modal/Toast renderer
├── hooks/
│   ├── useLocalStorage.js         # Main app blob (cross-tab sync, write errors)
│   ├── useLocalStorageValue.js    # Single-key persisted state with try/catch
│   ├── usePageVisibility.js       # iOS tab-suspension recovery
│   └── usePWAInstall.js           # PWA install prompt
├── pages/                         # Home, CreateEventPage, EditEventPage, SellTicketsPage,
│                                  # TicketsPage, ValidateQRPage, CopyEventPage, DashboardPage
├── styles/                        # tokens.css → global.css → utilities.css (import order matters)
└── utils/
    ├── hashGenerator.js           # 16-char SHA-256 validation hash, generateTicketId
    ├── qrGenerator.js             # QR data encode/parse
    ├── qrCopy.js                  # copySVGToClipboard, copyPNGToClipboard, shareQR (uses svgToPngBlob)
    ├── svgTicketTemplate.js       # PNG ticket template with Charly
    ├── timeFormat.js               # formatTo12Hour, parseLocalDate, toLocalDateString,
    │                              # checkInWindowStatus, formatCurrency
    ├── csvUtils.js                # ticketsToCSV (round-trip) + ticketsToHumanCSV (price)
    ├── ticketPasteParser.js       # parseSingleNameAndId, parseTicketRows (TSV-aware)
    ├── translations.js            # ES/EN dictionary
    ├── storage.js                 # localStorage primitives + version migration
    └── base64Cleaner.js           # cleanBase64 (used by svgTicketTemplate)
```

---

## Routes

| Path | Page |
|------|------|
| `/` | Home (event details + quick stats) |
| `/create-event` `/edit-event` | CreateEvent component (mode prop) |
| `/sell-tickets` | TicketForm |
| `/tickets` | Cards / Table view toggle, search, type filter, CSV panel |
| `/validate-qr` | Camera scanner + scan log |
| `/copy-event` | JSON / CSV / PDF export, JSON import |
| `/dashboard` | Sales + Check-in dashboards |
| `*` | redirect → `/` |

Every route except `Home` is lazy-loaded.

---

## Data shape

Stored under localStorage key `sigale-event-data`:

```json
{
  "event": {
    "name": "string",
    "date": "YYYY-MM-DD",
    "venue": "string",
    "address": "string",
    "entranceTime": "HH:mm",
    "ticketTypes": { "preventa": 50000, "vip": 100000 }
  },
  "tickets": [{
    "ticketId": "TKT-<8hex>-<timestamp>",
    "buyerName": "string",
    "buyerId": "string",
    "buyerPhone": "string | '000'",
    "ticketType": "preventa | vip | …",
    "purchaseDate": "YYYY-MM-DD",
    "validationHash": "16-char hex",
    "checkedIn": false,
    "checkInTime": "ISO-8601 | null"
  }]
}
```

QR codes are NOT stored — generated on demand from `validationHash`. ~300–400 B per ticket; capacity ~10–15k tickets.

---

## Patterns to reuse before writing new code

| Need | Use |
|------|-----|
| Persisted single-key state | `useLocalStorageValue(key, initial)` |
| Confirm dialog | `useDialog().confirm({ title, message, danger })` → `Promise<boolean>` |
| Toast / status message | `useDialog().notify({ message, tone: 'success'\|'error'\|'info' })` |
| Custom modal | `useDialog().openCustom((close) => <YourBody />)` |
| Stat tile | `<StatCell icon label value subtext? variant />` |
| "No event yet" placeholder | `<EmptyStateCard icon title description />` |
| Form-field icon row | `<FieldLabel icon rowClass textClass>{children}</FieldLabel>` |
| Ticket bulk-import | `addTicketsFromCSV(rows)` from `useTickets()` (dedupes by buyerId+name+type) |
| Multi-row name+id paste | `parseTicketRows(text)` from `ticketPasteParser.js` |
| 12h time | `formatTo12Hour('14:30')` |
| Currency | `formatCurrency(50000)` → `"$50,000"` |

---

## Commands

```
npm run dev         # Vite dev server (HMR, mobile network access)
npm run build       # Production build → dist/
npm run preview     # Serve dist/
npm run lint        # ESLint
npm test            # vitest run (CI mode)
npm run test:watch  # vitest watch
npm run test:ui     # vitest UI
```

---

## Browser requirements

Chrome/Edge 90+, Firefox 88+, Safari 14+. HTTPS required for camera access.

Required APIs: Web Crypto, localStorage, Clipboard, MediaDevices (camera). Web Share API + File System Access (best-effort, feature-detected).
