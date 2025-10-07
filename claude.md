# Sígale Ticket Management System - Claude Development Context

## 🚧 IMPLEMENTATION STATUS

### ✅ STAGE 1 - COMPLETE (Foundation & Event Creation)
**Implemented Files:**
- ✅ `src/utils/storage.js` - localStorage helpers
- ✅ `src/utils/hashGenerator.js` - Hash & ticket ID generation
- ✅ `src/hooks/useLocalStorage.js` - localStorage sync hook
- ✅ `src/context/EventContext.jsx` - Event state management
- ✅ `src/components/Layout/Layout.jsx` - Main layout wrapper
- ✅ `src/components/Layout/Navbar.jsx` - Dynamic colored navbar
- ✅ `src/components/Event/CreateEvent.jsx` - Event creation/editing form
- ✅ `src/pages/Home.jsx` - Landing page
- ✅ `src/pages/CreateEventPage.jsx` - Event creation page
- ✅ `src/pages/EditEventPage.jsx` - Event editing page
- ✅ `src/App.jsx` - Router with Stage 1 routes

**Working Features:**
- ✅ Event creation with name, date, venue, address, entrance time
- ✅ Color picker for base (navbar) and emphasis colors
- ✅ Dynamic ticket types (add/remove/edit names and prices)
- ✅ Event editing with pre-populated form
- ✅ Responsive design with Inter font
- ✅ localStorage persistence
- ✅ Auto-redirect to create event when none exists

### ⏳ STAGE 2 - NOT IMPLEMENTED (Tickets & QR)
**Missing Files:**
- ❌ `src/context/TicketContext.jsx`
- ❌ `src/utils/qrGenerator.js`
- ❌ `src/utils/qrCopy.js`
- ❌ `src/components/Tickets/QRDisplay.jsx`
- ❌ `src/components/Tickets/TicketForm.jsx`
- ❌ `src/components/Tickets/TicketList.jsx`
- ❌ `src/components/Tickets/TicketCard.jsx`
- ❌ `src/components/Scanner/QRScanner.jsx`
- ❌ `src/components/Scanner/ValidationResult.jsx`
- ❌ `src/pages/SellTicketsPage.jsx`
- ❌ `src/pages/ValidateQRPage.jsx`

### ⏳ STAGE 3 - NOT IMPLEMENTED (Dashboards)
**Missing Files:**
- ❌ `src/components/Dashboard/SalesDashboard.jsx`
- ❌ `src/components/Dashboard/CheckInDashboard.jsx`
- ❌ `src/components/Dashboard/TicketViewer.jsx`
- ❌ `src/components/Database/ExportDB.jsx`
- ❌ `src/components/Database/ImportDB.jsx`
- ❌ `src/utils/validator.js`
- ❌ `src/pages/DashboardPage.jsx`

---

## Project Overview

**Name**: Sígale
**Type**: Static React Web Application
**Purpose**: Concert ticket management system with QR generation, validation, and analytics
**Tech Stack**: React 19 + Vite + Tailwind CSS v4 + localStorage

## Core Architecture Principles

### 1. Data Storage Strategy
- **ALL data lives in browser localStorage as JSON**
- **NO backend server** - completely static/offline-capable
- **QR codes are NEVER stored** - dynamically generated from 10-character validation hash
- **Storage optimization**: ~300-400 bytes per ticket (capacity: 10,000-15,000 tickets)
- **Portability**: Entire database exportable/importable via JSON copy-paste

### 2. React State Management
- **Context API** for global state (no Redux/Zustand needed)
- **Two main contexts**:
  - `EventContext`: Event details, colors, ticket types
  - `TicketContext`: Tickets, check-ins, statistics
- **Custom hooks** for localStorage sync, QR generation, validation

### 3. Key Technical Decisions
- **Build tool**: Vite (fast, optimized)
- **Styling**: Tailwind CSS (utility-first)
- **Routing**: React Router v6
- **QR Generation**: `qrcode.react` (dynamic SVG from hash)
- **QR Scanning**: `html5-qrcode` (camera-based validation)
- **Hash Generation**: Web Crypto API (built-in, no library)

---

## JSON Data Structure

```json
{
  "event": {
    "name": "Summer Rock Festival 2025",
    "date": "2025-12-15",
    "venue": "National Stadium",
    "entranceTime": "19:00",
    "colors": {
      "emphasis": "#FF6B6B",
      "base": "#1A1A2E"
    },
    "ticketTypes": {
      "preventa": 50000,
      "taquilla": 70000,
      "vip": 100000
    }
  },
  "tickets": [
    {
      "ticketId": "TKT-001-1728234567",
      "buyerName": "María González",
      "buyerId": "1234567890",
      "buyerPhone": "+57 300 1234567",
      "ticketType": "preventa",
      "purchaseDate": "2025-10-06",
      "validationHash": "a7f3c2e1b9",
      "checkedIn": false,
      "checkInTime": null
    }
  ]
}
```

**Storage Key**: `sigale-event-data`

---

## Project Structure

```
/sigale-ticket-system
  ├── src/
  │   ├── components/
  │   │   ├── Layout/
  │   │   │   ├── Navbar.jsx           # Dynamic colored navbar
  │   │   │   └── Layout.jsx           # Main wrapper
  │   │   ├── Event/
  │   │   │   └── CreateEvent.jsx      # Event creation form
  │   │   ├── Tickets/
  │   │   │   ├── TicketForm.jsx       # Ticket registration
  │   │   │   ├── TicketList.jsx       # Ticket grid with search
  │   │   │   ├── TicketCard.jsx       # Individual ticket
  │   │   │   └── QRDisplay.jsx        # QR code display + copy/share
  │   │   ├── Scanner/
  │   │   │   ├── QRScanner.jsx        # Camera scanner
  │   │   │   └── ValidationResult.jsx # Scan result display
  │   │   ├── Dashboard/
  │   │   │   ├── SalesDashboard.jsx   # Sales statistics
  │   │   │   ├── CheckInDashboard.jsx # Check-in analytics
  │   │   │   └── TicketViewer.jsx     # Ticket detail modal
  │   │   └── Database/
  │   │       ├── ExportDB.jsx         # Export JSON functionality
  │   │       └── ImportDB.jsx         # Import + validation
  │   ├── context/
  │   │   ├── EventContext.jsx         # Event state
  │   │   └── TicketContext.jsx        # Tickets state
  │   ├── hooks/
  │   │   ├── useLocalStorage.js       # localStorage sync
  │   │   ├── useQRGenerator.js        # QR generation
  │   │   └── useTicketValidator.js    # Validation logic
  │   ├── utils/
  │   │   ├── storage.js               # localStorage helpers
  │   │   ├── hashGenerator.js         # 10-char hash generation
  │   │   ├── qrGenerator.js           # QR data encoding
  │   │   ├── qrCopy.js                # SVG/PNG copy + share
  │   │   └── validator.js             # JSON validation
  │   ├── pages/
  │   │   ├── Home.jsx                 # Landing page
  │   │   ├── CreateEventPage.jsx      # Event setup
  │   │   ├── SellTicketsPage.jsx      # Ticket sales
  │   │   ├── ValidateQRPage.jsx       # QR scanning
  │   │   └── DashboardPage.jsx        # Analytics
  │   ├── App.jsx                      # Router setup
  │   ├── main.jsx                     # Entry point
  │   └── index.css                    # Tailwind imports
  ├── package.json
  ├── vite.config.js
  └── tailwind.config.js
```

---

## Core Features & Requirements

### 0. Event Creation
- Form fields: name, date, venue, entranceTime
- **Color pickers**: `base` (navbar background) and `emphasis` (accents)
- **Dynamic ticket types**: User can add/remove custom types with prices
- Default types: `preventa`, `taquilla`
- Auto-redirect to event creation if no event exists in localStorage

### 1. Ticket Sales
- Form fields: buyerName, buyerId, buyerPhone, ticketType
- Auto-generate `ticketId` format: `TKT-{random}-{timestamp}`
- Generate 10-character validation hash using Web Crypto API
- Display QR code immediately after creation
- **QR Code Actions**:
  - Copy as SVG (text to clipboard)
  - Copy as PNG (image to clipboard)
  - Share via Web Share API
- QR encodes: ticketId, hash, buyer info, event details

### 2. QR Code System
- **Critical**: QR codes are NOT stored in JSON
- Generated on-demand from validation hash using `qrcode.react`
- QR data structure includes all ticket + event info
- Copy functions convert SVG to PNG via canvas
- Regenerate QR from any ticket in dashboard/list views

### 3. QR Validation & Check-In
- Use `html5-qrcode` for camera scanning
- Parse QR data and extract validation hash
- Find ticket by hash in localStorage
- **Duplicate detection**:
  - Check if `checkedIn === true`
  - Display warning with original `checkInTime`
  - Visual/audio feedback for duplicates
- Success: Update ticket with `checkedIn: true` and `checkInTime: ISO string`

### 4. Dashboard Analytics

#### Sales Dashboard
- Total tickets sold (by type)
- Total revenue (calculated from ticket prices)
- Revenue by ticket type
- Ticket search (by name/ID/phone)
- Click ticket to open `TicketViewer` modal:
  - Show full buyer info
  - Regenerate QR from hash
  - Copy/share QR

#### Check-In Dashboard
- Total checked in vs sold
- Attendance percentage
- Recent check-ins list (sorted by time)
- Check-in breakdown by ticket type

### 5. Database Management
- **Export**: Copy JSON to clipboard or download file
- **Share**: Use Web Share API to share JSON
- **Import**:
  - Paste JSON into textarea
  - Validate structure (check required fields)
  - Confirm before replacing all data
  - Clear localStorage and reload app
- **Storage warning**: Alert when 80%+ capacity used

---

## React Context APIs

### EventContext
```javascript
{
  event: {
    name, date, venue, entranceTime,
    colors: { base, emphasis },
    ticketTypes: { preventa: price, ... }
  },
  createEvent: (eventData) => void,
  updateEvent: (eventData) => void,
  clearEvent: () => void,
  hasEvent: () => boolean
}
```

### TicketContext
```javascript
{
  tickets: Array<Ticket>,
  addTicket: (ticketData) => Promise<Ticket>,
  searchTickets: (query) => Array<Ticket>,
  getTicketById: (ticketId) => Ticket,
  checkInTicket: (ticketId) => void,
  getStats: () => {
    totalSold, totalCheckedIn,
    byType: { [type]: { sold, checkedIn } },
    revenue: { total, byType: { [type]: amount } }
  }
}
```

---

## Key Utilities

### `utils/hashGenerator.js`
```javascript
export const generateValidationHash = async (ticketData) => {
  // Use Web Crypto API to hash ticket data
  // Return first 10 characters of SHA-256 hex
};

export const generateTicketId = () => {
  // Format: TKT-{random-3-digits}-{timestamp}
};
```

### `utils/qrGenerator.js`
```javascript
export const generateQRData = (ticket, event) => {
  // JSON.stringify all ticket + event info
};

export const parseQRData = (qrString) => {
  // JSON.parse and validate structure
};
```

### `utils/qrCopy.js`
```javascript
export const copySVGToClipboard = async (svgElement) => {
  // Serialize SVG and copy as text
};

export const copyPNGToClipboard = async (svgElement) => {
  // Convert SVG to canvas, then to PNG blob
  // Use Clipboard API to write image
};

export const shareQR = async (qrData, eventName) => {
  // Use navigator.share() Web Share API
};
```

### `hooks/useLocalStorage.js`
```javascript
export const useLocalStorage = (initialValue) => {
  const [data, setData] = useState(() => loadFromStorage() || initialValue);

  useEffect(() => {
    saveToStorage(data);
  }, [data]);

  return [data, setData];
};
```

---

## User Workflows

### Workflow 1: First-Time Setup
1. Open app → no event in localStorage
2. Auto-redirect to `/create-event`
3. Fill event form (name, date, venue, time, colors, ticket types)
4. Submit → event saved to localStorage
5. Navbar applies event colors
6. Redirect to home page

### Workflow 2: Selling a Ticket
1. Navigate to `/sell-tickets`
2. Fill buyer form (name, ID, phone, ticket type)
3. Submit → generates ticket ID + 10-char hash
4. QR code renders immediately from hash
5. Copy QR as SVG/PNG or share
6. Ticket saved to localStorage via TicketContext

### Workflow 3: Check-In at Venue
1. Navigate to `/validate-qr`
2. Camera opens automatically
3. Scan attendee's QR code
4. System validates hash against stored tickets
5. **If duplicate**: Show warning + original check-in time
6. **If valid**: Mark as checked in + show success
7. Dashboard updates in real-time

### Workflow 4: Multi-Day Event Management
**End of Day 1**:
1. Go to `/dashboard` → Export tab
2. Copy JSON or download file
3. Save externally (cloud, USB, etc.)

**Start of Day 2**:
1. Open app → Import tab
2. Paste JSON
3. Validate → Confirm → Replace data
4. Continue operations

---

## Critical Implementation Notes

### 1. QR Code Optimization
- **NEVER store QR codes in JSON**
- Use `<QRCodeSVG>` from `qrcode.react` to render on-demand
- Memoize QR generation with `useMemo` or `React.memo`
- Generate only when needed (ticket creation, ticket viewer, scanner result)

### 2. Duplicate Check-In Prevention
- When scanning QR, check `ticket.checkedIn` field
- If `true`, show warning with `ticket.checkInTime`
- Play error sound/vibration for duplicate
- Display buyer details to verify identity

### 3. Tailwind CSS Custom Styles - IMPORTANT
**CRITICAL**: When adding custom CSS in `src/index.css`, NEVER use `@apply` directive with the new Tailwind CSS v4+. This will cause errors like "Cannot apply unknown utility class".

**CORRECT WAY** to add custom styles in `index.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Use plain CSS, NOT @apply */
* {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  color: #111827; /* Use hex colors, NOT @apply text-gray-900 */
  letter-spacing: -0.01em;
}

h1, h2, h3, h4, h5, h6 {
  letter-spacing: -0.02em;
  font-weight: 700;
}
```

**WRONG WAY** (will cause errors):
```css
/* ❌ DO NOT DO THIS */
@layer base {
  body {
    @apply text-gray-900; /* ERROR: Cannot apply unknown utility class */
  }
}
```

**Typography Stack**:
- Primary font: Inter (from Google Fonts)
- Fallback: System fonts for performance
- Font smoothing: antialiased for crisp rendering
- Letter spacing: -0.01em (body), -0.02em (headings) for modern look

### 4. Navbar Dynamic Theming
- Read `event.colors.base` for navbar background
- Read `event.colors.emphasis` for active link color
- Apply inline styles or CSS variables
- Update on event change via EventContext

### 5. localStorage Monitoring
- Calculate storage size: `new Blob([JSON.stringify(data)]).size`
- Show warning at 80% of ~5MB limit
- Display storage usage in dashboard
- Prompt export when nearing limit

### 6. JSON Validation on Import
- Check for required fields: `event`, `tickets`
- Validate event structure (name, date, venue, etc.)
- Validate each ticket has required fields (ticketId, hash, buyer info)
- Display specific error messages for missing fields

---

## Development Phases (Aligned with Stage Files)

### ✅ Stage 1: Foundation (stage1-foundation.md) - COMPLETE
**Implemented:**
- ✅ Vite + React 19 project setup
- ✅ Tailwind CSS v4 configuration with @tailwindcss/postcss
- ✅ Folder structure creation
- ✅ Storage utilities (`storage.js`, `hashGenerator.js`)
- ✅ Custom hook (`useLocalStorage.js`)
- ✅ EventContext setup with CRUD operations
- ✅ Layout components (Navbar, Layout)
- ✅ Event creation/editing form with address field
- ✅ Dynamic ticket types (add/remove/edit)
- ✅ Home page with event check and edit functionality
- ✅ Router setup (/, /create-event, /edit-event)
- ✅ Inter font integration
- ✅ Responsive design with gradient backgrounds

**Key Enhancements:**
- Modern card-based UI with shadows and rounded corners
- Color picker with hex input for both base and emphasis colors
- Dynamic ticket type management (minimum 1 required)
- Emoji icons throughout the UI
- Active state highlighting in navbar

### ⏳ Stage 2: Tickets & QR (stage2-tickets-qr.md) - NOT IMPLEMENTED
**Remaining Work:**
- ❌ TicketContext setup
- ❌ QR utilities (`qrGenerator.js`, `qrCopy.js`)
- ❌ QR display component with copy/share
- ❌ Ticket form component
- ❌ Ticket list with search
- ❌ Ticket card component
- ❌ QR scanner with camera
- ❌ Validation result display
- ❌ Duplicate detection logic
- ❌ Update router with /sell-tickets and /validate-qr routes

### ⏳ Stage 3: Dashboards (stage3-dashboards.md) - NOT IMPLEMENTED
**Remaining Work:**
- ❌ Sales dashboard with statistics
- ❌ Check-in dashboard with analytics
- ❌ Database export component (copy/download/share)
- ❌ Database import with validation
- ❌ Ticket viewer modal (regenerate QR)
- ❌ Enhanced navbar with dashboard route
- ❌ Storage warning component
- ❌ Error boundary
- ❌ Loading states
- ❌ Toast notifications
- ❌ Final polish & README

---

## 📝 Implementation Notes for Next Developer

### Current State Summary
The foundation (Stage 1) is **fully functional** with a polished UI. The project uses:
- **React 19** with modern hooks
- **Tailwind CSS v4** (note: no @apply directive - use plain CSS)
- **localStorage** for persistence via custom hook
- **React Router v6** for navigation

### To Continue Development:
1. **Start with Stage 2** - Follow `stage2-tickets-qr.md` step by step
2. All dependencies are installed (`qrcode.react`, `html5-qrcode`)
3. The TicketContext should follow the same pattern as EventContext
4. Use the existing `hashGenerator.js` for validation hash creation
5. Wrap the app with TicketProvider in App.jsx (after EventProvider)

### Important Architecture Decisions Made:
- **Address field added** to event data (not in original plan)
- **Ticket types are fully dynamic** (can add unlimited, edit names, prices)
- **Color pickers** include both visual selector and hex text input
- **Navbar** uses event.colors.base for background
- **No @apply in CSS** - Tailwind v4 uses plain CSS with hex colors

### Files That Need Creating for Stage 2:
```
src/context/TicketContext.jsx
src/utils/qrGenerator.js
src/utils/qrCopy.js
src/components/Tickets/QRDisplay.jsx
src/components/Tickets/TicketForm.jsx
src/components/Tickets/TicketList.jsx
src/components/Tickets/TicketCard.jsx
src/components/Scanner/QRScanner.jsx
src/components/Scanner/ValidationResult.jsx
src/pages/SellTicketsPage.jsx
src/pages/ValidateQRPage.jsx
```

---

## Code Style Guidelines

### 1. Component Structure
```javascript
// Imports
import { useState, useEffect } from "react";
import { useContext } from "../context/SomeContext";

// Component
export const ComponentName = ({ prop1, prop2 }) => {
  // Hooks
  const [state, setState] = useState(initialValue);
  const { contextValue } = useContext();

  // Event handlers
  const handleEvent = () => {
    // logic
  };

  // Effects
  useEffect(() => {
    // side effects
  }, [dependencies]);

  // Render
  return (
    <div className="tailwind-classes">
      {/* JSX */}
    </div>
  );
};
```

### 2. Naming Conventions
- **Components**: PascalCase (`TicketForm.jsx`)
- **Hooks**: camelCase with `use` prefix (`useLocalStorage.js`)
- **Utils**: camelCase (`hashGenerator.js`)
- **Context**: PascalCase with `Context` suffix (`EventContext.jsx`)

### 3. File Organization
- One component per file
- Export components as named exports
- Group related components in folders
- Keep utils pure (no side effects)

### 4. Comments
- **All code in English**
- **All comments in English**
- Document complex logic
- Explain "why" not "what"

---

## Testing Checklist (Per Stage)

### Stage 1
- [ ] Project builds without errors
- [ ] Can create event with all fields
- [ ] Event persists in localStorage
- [ ] Navbar displays event colors
- [ ] Home redirects when no event
- [ ] Color pickers work

### Stage 2
- [ ] Can create tickets
- [ ] Hash generates (10 chars)
- [ ] QR displays after creation
- [ ] Copy SVG/PNG works
- [ ] Share API works
- [ ] Scanner opens camera
- [ ] Valid tickets check in
- [ ] Duplicate scan shows warning

### Stage 3
- [ ] Sales dashboard shows stats
- [ ] Check-in dashboard accurate
- [ ] Export works (copy/download)
- [ ] Import validates JSON
- [ ] Import replaces data
- [ ] Navbar highlights active route
- [ ] Mobile responsive
- [ ] Build succeeds

---

## Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "qrcode.react": "^3.1.0",
    "html5-qrcode": "^2.3.8"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

---

## Setup Commands

```bash
# Create project
npm create vite@latest sigale-ticket-system -- --template react

# Install dependencies
cd sigale-ticket-system
npm install
npm install react-router-dom qrcode.react html5-qrcode
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind
npx tailwindcss init -p

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## Common Patterns

### 1. Dynamic Color Application
```javascript
const navStyle = event ? { backgroundColor: event.colors.base } : {};
```

### 2. localStorage Sync Pattern
```javascript
const [data, setData] = useLocalStorage({ event: null, tickets: [] });
```

### 3. QR Generation Pattern
```javascript
const qrData = generateQRData(ticket, event);
return <QRCodeSVG value={qrData} size={256} level="H" />;
```

### 4. Validation Pattern
```javascript
const ticket = tickets.find(t => t.validationHash === scannedHash);
if (!ticket) return { valid: false, error: "NOT_FOUND" };
if (ticket.checkedIn) return { valid: false, error: "DUPLICATE" };
```

---

## Security Considerations

1. **Hash Generation**: Use Web Crypto API (cryptographically secure)
2. **Duplicate Prevention**: Always check `checkedIn` status before marking
3. **JSON Validation**: Validate structure before import to prevent corruption
4. **No Sensitive Data**: Don't store payment info (only names, IDs, phones)

---

## Performance Optimizations

1. **Memoization**: Use `React.memo` for ticket cards in lists
2. **useMemo**: Memoize expensive calculations (stats, filtered lists)
3. **useCallback**: Memoize event handlers to prevent re-renders
4. **Lazy Loading**: Use `React.lazy` for route components
5. **QR On-Demand**: Only generate QR when component mounts

---

## Browser Compatibility

- **Minimum**: Chrome/Edge 90+, Firefox 88+, Safari 14+
- **Required APIs**:
  - Web Crypto API (for hash generation)
  - localStorage (for data persistence)
  - Clipboard API (for copy functionality)
  - MediaDevices API (for camera scanning)
  - Web Share API (optional, for sharing)

---

## Deployment

1. Build: `npm run build`
2. Deploy `dist/` folder to:
   - Netlify (drag & drop)
   - Vercel (`vercel --prod`)
   - GitHub Pages (push dist to gh-pages)
3. **HTTPS required** for camera access on scanning page

---

This document serves as the complete reference for building Sígale. Follow the stage implementation guides (stage1-foundation.md, stage2-tickets-qr.md, stage3-dashboards.md) in order, referring back to this context for architecture decisions and patterns.
