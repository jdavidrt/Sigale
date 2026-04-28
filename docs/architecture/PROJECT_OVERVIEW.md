# Sígale — Architecture Reference

The deep-dive technical document. For the agent quick-reference, see `/CLAUDE.md`.

> **Status: production-ready.** All originally-scoped features (event setup, ticket sales, QR generation/scanning, dashboards, export/import, PWA) shipped, plus the post-launch additions described under [Recent additions](#recent-additions).

---

## Why this design

Sígale is a static React PWA with **no backend**. The browser's `localStorage` is the database. This pushes three constraints into every design choice:

1. **Storage budget** — ~5–10 MB per origin. We aim for 10–15k tickets in that envelope. The big lever is **not storing QR images**: we store a 16-char SHA-256 validation hash and regenerate the QR on demand. ~300–400 bytes/ticket.
2. **Cross-tab safety** — multiple browser tabs (or two ushers on the same device) can write concurrently. Every mutation re-reads storage before writing (see `TicketContext.checkInTicket`, `addTicketsFromCSV`).
3. **iOS Safari quirks** — tab suspension, private-mode quota, paranoid cache invalidation. Handled by `usePageVisibility`, `useLocalStorage` error surfacing, and the bespoke service worker.

---

## Tech stack

| Layer | Library | Why |
|-------|---------|-----|
| Framework | React 19 | useMemo / useCallback discipline for context-value stability |
| Build | Vite 7 | Fast HMR, native ESM, route-level code splitting |
| Styling | Tailwind CSS v4 (no `@apply`) + CSS Modules | Tokens via `src/styles/tokens.css`, scoped per-component |
| Routing | React Router v7 | Lazy-loaded routes; only Home is in the main bundle |
| QR generation | `qrcode.react` | SVG output rendered into canvas for PNG export |
| QR scanning | `html5-qrcode` | Lazy-loaded only on `/validate-qr` (~100 KB gz) |
| PDF export | `jspdf` | Dynamic-imported on the export page |
| Crypto | Web Crypto API | SHA-256 hash, 16-char prefix |
| Persistence | localStorage | Plus a custom service worker for shell offline |

---

## Storage model

Single localStorage key `sigale-event-data` holds the entire database:

```json
{
  "event": {
    "name": "Summer Festival 2025",
    "date": "2025-12-15",
    "venue": "National Stadium",
    "address": "123 Main St",
    "entranceTime": "19:00",
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
  }],
  "version": "current schema version"
}
```

Other keys (small, one-key state managed by `useLocalStorageValue`):

| Key | Purpose |
|-----|---------|
| `sigale-language` | `'es'` / `'en'` UI language |
| `sigale-tickets-view` | `'cards'` / `'table'` view preference |
| `sigale-camera-granted` | Skip permission re-prompt on `/validate-qr` |
| `debug` | Dev-time debug panel toggle |

`src/utils/storage.js` owns load/save/migrate; consumers go through `useLocalStorage` (whole-blob, cross-tab synced) or `useLocalStorageValue` (single-key, try/catch wrapped).

---

## Provider tree

```
LanguageProvider           # i18n (must be outermost so error UI can be localized)
  └── EventProvider        # event CRUD + hasEvent()
      └── TicketProvider   # tickets, getStats(), addTicketsFromCSV(), storageError
          └── DialogProvider  # confirm/notify/openCustom + Modal/Toast at root
              └── BrowserRouter / Routes
```

`EventContext` and `TicketContext` share the same blob via `useLocalStorage`; they coordinate through `loadFromStorage()` reads inside each mutator (so a CSV import in tab A doesn't clobber a ticket added in tab B).

---

## Component map by area

### Tickets

| File | Role |
|------|------|
| `TicketForm.jsx` | Create / edit one ticket; clipboard-paste fills name+id |
| `TicketCard.jsx` | Mobile-friendly card row used in `/tickets` cards view |
| `TicketList.jsx` | Card grid (kept for backward compat; `/tickets` orchestrates directly now) |
| `TicketTable.jsx` + `TicketTableRow.jsx` | Spreadsheet-style editable view; paste-to-add toolbar |
| `TicketsViewToggle.jsx` | Cards ↔ Table segment control, persisted |
| `TicketEditConfirm.jsx` | Diff view shown in the row-commit modal |
| `QRDisplay.jsx` | On-demand QR + ticket-image preview + copy/share toolbar |
| `CSVPanel.jsx` | Round-trip CSV import/export modal (separate from the table's bulk paste) |

### Scanner

| File | Role |
|------|------|
| `QRScanner.jsx` | html5-qrcode wrapper; manages camera lifecycle, async confirm for early/late check-in window |
| `ValidationResult.jsx` | Color-coded result card (success / duplicate / not-found / wrong-event / invalid) |

### Dashboard

| File | Role |
|------|------|
| `SalesDashboard.jsx` | Total sold + revenue, breakdown by ticket type |
| `CheckInDashboard.jsx` | Attendance count, percent, recent check-ins |
| `Dashboard.shared.module.css` | Layout primitives shared via CSS Modules `composes:` |

### Event

| File | Role |
|------|------|
| `Event/CreateEvent.jsx` | Single component for create + edit (`isEditing` prop). Owns ticket-type CRUD + danger-zone delete + paste-to-import |

### UI primitives (`src/components/ui/`)

These are the small reusable pieces. Reach for them before inventing new markup:

| Primitive | Use |
|-----------|-----|
| `StatCell` | One labeled value in a dashboard summary grid |
| `EmptyStateCard` | Page-level "no event yet" placeholder |
| `FieldLabel` | Icon + label row above a form input |
| `Modal` | Generic backdrop + glassy card; portal-rendered, Esc + click-outside to dismiss |
| `Toast` | Bottom-center status stack rendered by `DialogProvider` |

### Common

| File | Role |
|------|------|
| `Common/SlideToConfirm.jsx` | Slide-to-confirm gesture for irreversible actions |
| `Common/DebugPanel.jsx` | Floating panel that surfaces storage state + recent errors when `debug=1` |
| `Common/Button.module.css` | Shared button variants (`primary`, `secondary`, `danger`, `success`, `secondaryDashed`, sizes `sm/md/lg`) |
| `Layout/Layout.jsx`, `Layout/Navbar.jsx`, `Layout/StorageErrorBanner.jsx` | App shell |
| `ErrorBoundary/ErrorBoundary.jsx` | Top-level error guard |

---

## Hook reference

| Hook | Returns | Notes |
|------|---------|-------|
| `useLocalStorage(initial)` | `[data, setData, { lastError, clearError }]` | Whole-blob; cross-tab sync via custom event; surfaces write errors (quota, security) |
| `useLocalStorageValue(key, initial)` | `[value, setValue]` | Single-key prefs; try/catch around storage; lazy initializer supported |
| `usePageVisibility()` | `{ isVisible }` | Re-reads storage when tab regains focus (iOS recovery) |
| `usePWAInstall()` | `{ canInstall, promptInstall }` | Wraps `beforeinstallprompt` |

---

## Util reference

| Util | Key exports |
|------|-------------|
| `hashGenerator.js` | `generateValidationHash(ticket) → 16-char hex`, `generateTicketId() → "TKT-<8hex>-<ts>"` |
| `qrGenerator.js` | `generateQRData(ticket, event, eventId)`, `parseQRData(text)` |
| `qrCopy.js` | `copySVGToClipboard`, `copyPNGToClipboard`, `shareQR`. Internally shares `svgToPngBlob` + `buildShareMessage` |
| `svgTicketTemplate.js` | `generateTicketSVG(ticket, event, qrDataURL)`, `loadCharlyIllustration(base64)` |
| `timeFormat.js` | `formatTo12Hour`, `parseLocalDate`, `toLocalDateString`, `checkInWindowStatus`, `formatCurrency` |
| `csvUtils.js` | `ticketsToCSV` (round-trip 5-col, camelCase), `ticketsToHumanCSV` (6-col with derived price; not re-importable), `csvToTickets`, `isValidTicketType` |
| `ticketPasteParser.js` | `parseSingleNameAndId` (one form fill), `parseTicketRows` (TSV-aware multi-row) |
| `storage.js` | `loadFromStorage`, `saveToStorage`, `clearStorage`, version migration |
| `translations.js` | `translations` dictionary, `detectBrowserLanguage` |

---

## End-user workflows

**Event setup.** First load redirects to `/create-event`. Operator fills name / date / venue / address / entrance / ticket types, saves. Returns to Home with quick stats.

**Ticket sales.** `/sell-tickets`: form captures buyer info; the "Paste Name & ID" button reads the clipboard and fills both fields via `parseSingleNameAndId` (Spanish/English ID label tolerant). On submit, ticket is generated (`TKT-…` id, 16-char hash) and the success screen renders QR + copy/share buttons.

**Bulk add via paste.** `/tickets` → Table view → pick default type → "Paste Tickets" reads clipboard → `parseTicketRows` splits TSV/single-line rows → each becomes a ticket through `addTicketsFromCSV` (dedupes by `buyerId|buyerName|ticketType` against existing AND within batch). Banner reports added/skipped/ignored.

**Inline edit.** Click ✏ on a row → cells become inputs → make changes → click ✓ (or Enter) → modal shows a diff (only changed fields, old → new) → Save commits via `updateTicket()`, success toast fires.

**Check-in.** `/validate-qr` mounts the camera, scans, parses QR data, validates against the in-memory tickets. Outside the event date ±1 day window, prompts via `useDialog().confirm()` rather than blocking. Results flow into `ValidationResult` (success / duplicate / not-found / wrong-event / invalid).

**Backup / handoff.** `/copy-event` exports JSON (clipboard or file) and CSV. `CreateEvent`'s "Paste from clipboard" button accepts a JSON paste to restore. The Danger Zone wipes the event blob.

**Deletion.** Single delete: card or row → `confirm()` modal → `deleteTicket` + toast. Bulk delete: `/tickets` → Delete All → typed-`DELETE` modal (replaces the old two-step `confirm` + `prompt`).

---

## Recent additions (post-launch)

- **UI primitives folder** — `StatCell`, `EmptyStateCard`, `FieldLabel`, `Modal`, `Toast` extracted from previously-duplicated component markup. Dashboards, TicketsPage and TicketForm consume them.
- **Dialog system** — `DialogProvider` + `useDialog()` exposing `confirm()` / `notify()` / `openCustom()`. Replaces all `window.alert` / `window.confirm` / `window.prompt` site-wide. Modal + Toast rendered via React portals at the document root.
- **Editable ticket table** — `/tickets` has a Cards ↔ Table view toggle persisted under `sigale-tickets-view`. Table supports inline edit (row-level edit mode with confirm-via-diff modal), check-in toggle, bulk paste from spreadsheets, and per-row delete.
- **`formatCurrency()` util** — replaces 8+ ad-hoc `${n.toLocaleString()}` call sites. Lives in `timeFormat.js`.
- **`useLocalStorageValue`** — try/catch-wrapped single-key state hook. Used by LanguageContext + the view toggle.
- **`ticketPasteParser`** — extracted from the old inline `handlePasteInfo` in TicketForm. Now powers both the form's single paste and the table's multi-row paste.
- **`qrCopy.js` consolidation** — shared `svgToPngBlob` helper kills ~70 lines of duplicate canvas code between `copyPNGToClipboard` and `shareQR`.
- **Dashboard CSS sharing** — `Dashboard.shared.module.css` composed by both dashboards; eliminates duplicate layout rules.

---

## Performance & limits

| Metric | Target |
|--------|--------|
| Initial JS payload (Home only) | ~50 KB gz (route-level lazy loading) |
| Ticket creation | < 100 ms (hash + storage write) |
| QR scan validation | < 500 ms end-to-end |
| Storage budget | ~5–10 MB; ~10–15 k tickets in that envelope |
| Largest lazy chunk | `/validate-qr` (html5-qrcode, ~100 KB gz) |

---

## Security model

- **Validation hash**: 16-char SHA-256 prefix derived from ticket fields. Resists casual enumeration; not a substitute for a real auth boundary.
- **CSV-injection guard**: `csvUtils.formatCell` prepends `'` to cells starting with `=`, `+`, `-`, `@`, tab, or CR (Excel/Sheets formula prefix mitigation).
- **Field length caps**: `CSV_FIELD_LIMITS` enforced on import to match form `maxLength` (so CSV can't end-run UI validation).
- **Cross-tab race**: every mutator re-reads storage before writing. `checkInTicket` returns `{ ok, reason }` so the UI can distinguish stale-state from genuine duplicates.
- **No real access control**: this is a static-bundle app. Anyone with the URL can read/write the localStorage of the device they're on. For real auth, deploy behind an authenticated reverse proxy.

---

## Browser support

Chrome/Edge 90+, Firefox 88+, Safari 14+. HTTPS required for camera (`/validate-qr`). Required APIs: Web Crypto, localStorage, Clipboard, MediaDevices. Web Share API + File System Access used best-effort with feature detection.

---

## Commands

```
npm run dev      # Vite dev server with mobile-network HMR
npm run build    # Production build
npm run preview  # Serve dist/
npm run lint     # ESLint
npm test         # vitest run
```

---

## Cross-references

- Quick agent reference — `/CLAUDE.md`
- Design tokens & component visuals — `docs/design/STYLE_GUIDE.md`
- CSS module conventions — `docs/guides/css-architecture-guide.md`
- iOS Safari persistence quirks — `docs/guides/ios-persistence-guide.md`
- CSV import/export details — `docs/features/CSV_FEATURE_GUIDE.md`
- Mobile testing checklist — `docs/guides/MOBILE_TESTING.md`
- Audit lessons (race conditions, hash strength, etc.) — `docs/guides/AUDIT_LESSONS.md`
- Historical implementation log — `docs/implementation/stage{1,2,3}-*.md` (kept for context, not for status)
