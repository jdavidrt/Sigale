# Sígale - Ticket Management System - Project Outline

## 🚧 Current Implementation Status

**✅ STAGE 1 COMPLETE** - Foundation & Event Creation
**✅ STAGE 2 COMPLETE** - Tickets, QR Generation & Validation
**⏳ STAGE 3 PARTIAL** - Data Export/Import Complete, Dashboards Not Implemented

### What's Working Now:
- ✅ Vite + React 19 + Tailwind CSS v4 setup
- ✅ Event creation with custom branding (colors, unlimited ticket types)
- ✅ Event editing functionality (preserves existing tickets)
- ✅ Dynamic navbar with event colors
- ✅ localStorage data persistence with smart sync
- ✅ Responsive design with Inter font
- ✅ Bilingual interface (Spanish/English) with auto-detection
- ✅ **Ticket sales & registration**
- ✅ **Beautiful PNG ticket templates with Charly illustration**
- ✅ **QR code generation with 10-char validation hash**
- ✅ **Camera-based QR scanning with html5-qrcode**
- ✅ **Check-in system with duplicate detection**
- ✅ **Searchable ticket list (two-tab interface)**
- ✅ **Copy QR as SVG/PNG**
- ✅ **Bilingual Web Share API integration**
- ✅ **Delete & edit ticket functionality**
- ✅ **Copy event data to clipboard**
- ✅ **Download JSON with timestamps**
- ✅ **Import from clipboard functionality**
- ✅ **Accurate date handling (no timezone issues)**

### What's Missing (Stage 3 - Not Implemented):
- ❌ **Sales Dashboard UI** - Dedicated page to visualize sales statistics
- ❌ **Check-In Dashboard UI** - Real-time attendance tracking dashboard
- ❌ **Analytics Visualizations** - Charts, graphs, progress bars for data
- ❌ **Ticket Viewer Modal** - Modal to view/regenerate individual ticket QR codes
- ❌ **Storage Monitoring** - Warnings when approaching localStorage capacity limits

**Note:** Analytics calculation functions (getStats) exist in TicketContext, but there are no dedicated dashboard pages or UI components to display them.

---

## Overview
A static React web application for managing concert ticket sales, QR code generation, and entry validation. All data persists in browser localStorage as JSON, enabling complete database portability through simple copy-paste operations.

## Core Features

### 0. Event Creation ✅
Create a new event from scratch with the following information:
- Event name
- Event date
- Venue location & address
- Time of entrance
- Event colors (two colors: emphasis and base for navbar theming)
- Ticket types with pricing (user can dynamically add custom ticket types with values):
  - **Preventa** (Pre-sale price)
  - **Venta en Taquilla** (Box office price)
  - Additional custom ticket types as needed

### 1. Ticket Sales Registration ✅
- Capture buyer information:
  - Full name
  - ID number
  - Phone number
  - Ticket purchase date (auto-generated)
  - Ticket type (Preventa, Taquilla, or custom)
  - Unique ticket ID (auto-generated format: TKT-XXX-timestamp)
- Generate validation hash for ticket (10 characters using Web Crypto API)
- Display QR code dynamically generated from hash
- Copy/share QR code functionality:
  - Copy as SVG (text to clipboard)
  - Copy as PNG (image with white background)
  - Share via Web Share API
- QR code displays event name, date, venue, and entrance time

### 2. Data Persistence Architecture ✅
The entire database lives as a JSON structure in localStorage:

```json
{
  "event": {
    "name": "Summer Rock Festival 2025",
    "date": "2025-12-15",
    "venue": "National Stadium",
    "address": "123 Main St, City",
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
      "ticketId": "TKT-123-1728234567",
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

**Note**: QR codes are NOT stored in the JSON. They are dynamically generated on-demand from the validation hash, drastically reducing storage requirements.

### 3. QR Code System ✅
- **Storage Strategy**: QR codes are NOT stored in JSON - only the validation hash is saved
- **Generation**: QR codes are dynamically generated from the validation hash using `qrcode.react`
- **QR Content Structure**: JSON string containing:
  - Ticket ID
  - Validation hash
  - Buyer name and phone
  - Ticket type
  - Event name, date, venue, entrance time
- **Copy Functionality**: Built-in functions to copy QR code as:
  - SVG text to clipboard
  - PNG image to clipboard (with white background)
  - Direct share via Web Share API
- **Display**: QR codes generated on-demand in:
  - Ticket creation success screen
  - Ticket cards (expandable)
  - Ticket list view
- **Validation**: Scanner reads QR, extracts hash, verifies against stored ticket data
- **Security**:
  - Prevent duplicate entries for same ticket
  - Display clear warning when attempting to scan already-scanned QR
  - Visual feedback with color-coded results (green/red/orange)
  - Shows original check-in time for duplicates

**Storage Advantage**: Without storing QR codes, database size reduces by ~95%, allowing 10,000+ tickets in localStorage.

### 4. QR Code Validation & Check-In ✅
- Camera-based scanning using `html5-qrcode`
- Real-time QR code validation
- Duplicate detection system
- Color-coded validation results:
  - ✅ Green: Successful check-in
  - ⚠️ Red: Duplicate scan (already checked in)
  - ❌ Orange: Ticket not found
  - ❌ Gray: Invalid QR format
- Displays complete ticket information on scan
- Auto-stops scanning after successful read
- Manual start/stop controls

### 5. Ticket Management ✅
- Real-time search by name, ID, phone, or ticket number
- Grid view of all tickets
- Expandable ticket cards showing:
  - Buyer information
  - Ticket type and price
  - Purchase date
  - Check-in status
  - QR code (on-demand)
- Statistics: Total tickets, checked-in count
- Check-in status badges

### 6. Dashboard Views (To Be Implemented)

#### Sales Dashboard ⏳
- Total tickets sold by type (with custom types support)
- Recent transactions list
- Revenue tracking by ticket type
- Total revenue calculation
- **Ticket QR Viewer**:
  - View any sold ticket's details
  - Regenerate QR code on-demand from validation hash
  - Copy/share regenerated QR code
  - Access ticket history and buyer information

#### Check-In Dashboard ⏳
- Total attendees entered
- Real-time entry list with timestamps
- Entry rate visualization
- Attendance percentage
- Check-in status by ticket type

### 7. Database Export/Import ⏳
- **Export**: Copy entire JSON to clipboard with share option
- **Import**: Paste JSON to restore complete state
- **Validate**: Validate JSON integrity and correctness before import
- **Reset**: Clear current data before importing new event
- **Share**: Share JSON via Web Share API for easy backup

## Technical Stack

### React Setup
- **Build Tool**: Vite 7.1.9
- **React Version**: 19.1.1
- **State Management**: React Context API (EventContext + TicketContext)
- **Routing**: React Router DOM 7.9.3
- **Local Storage Hook**: Custom hook for localStorage synchronization

### Libraries Installed
1. **QR Code Generation**: `qrcode.react` 4.2.0 ✅
   - For dynamic SVG generation from hash

2. **QR Code Scanning**: `html5-qrcode` 2.3.8 ✅
   - Camera-based QR scanning
   - React wrapper implemented

3. **UI Framework**: Tailwind CSS 4.1.14 ✅
   - Utility-first styling with @tailwindcss/postcss

4. **Hash Generation**: Web Crypto API (built-in) ✅
   - 10-character validation hash

5. **Clipboard API**: Browser Clipboard API (built-in) ✅
   - SVG and PNG copy functionality

## Project Structure

```
Sígale/
├── documentation/              # All documentation files
│   ├── readme.md              # This file
│   ├── claude.md              # Development context
│   ├── stage1-foundation.md   # Stage 1 implementation guide
│   ├── stage2-tickets-qr.md   # Stage 2 implementation guide
│   └── stage3-dashboards.md   # Stage 3 implementation guide
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── Event/
│   │   │   └── CreateEvent.jsx          # Event creation/edit form ✅
│   │   ├── Layout/
│   │   │   ├── Layout.jsx               # Main layout wrapper ✅
│   │   │   └── Navbar.jsx               # Dynamic colored navbar ✅
│   │   ├── Scanner/
│   │   │   ├── QRScanner.jsx            # Camera QR scanner ✅
│   │   │   └── ValidationResult.jsx     # Scan result display ✅
│   │   ├── Tickets/
│   │   │   ├── QRDisplay.jsx            # QR code display + copy/share ✅
│   │   │   ├── TicketCard.jsx           # Individual ticket card ✅
│   │   │   ├── TicketForm.jsx           # Ticket creation form ✅
│   │   │   └── TicketList.jsx           # Searchable ticket grid ✅
│   │   └── Dashboard/                   # ⏳ To be implemented
│   │       ├── SalesDashboard.jsx
│   │       ├── CheckInDashboard.jsx
│   │       └── TicketViewer.jsx
│   ├── context/
│   │   ├── EventContext.jsx             # Event state management ✅
│   │   └── TicketContext.jsx            # Ticket state management ✅
│   ├── hooks/
│   │   └── useLocalStorage.js           # localStorage sync hook ✅
│   ├── pages/
│   │   ├── CreateEventPage.jsx          # Event creation page ✅
│   │   ├── EditEventPage.jsx            # Event editing page ✅
│   │   ├── Home.jsx                     # Landing page ✅
│   │   ├── SellTicketsPage.jsx          # Ticket sales page ✅
│   │   ├── ValidateQRPage.jsx           # QR validation page ✅
│   │   └── DashboardPage.jsx            # ⏳ Analytics page
│   ├── utils/
│   │   ├── hashGenerator.js             # Hash & ticket ID generation ✅
│   │   ├── qrCopy.js                    # QR copy/share utilities ✅
│   │   ├── qrGenerator.js               # QR data encoding/parsing ✅
│   │   ├── storage.js                   # localStorage utilities ✅
│   │   └── validator.js                 # ⏳ JSON validation
│   ├── App.css                          # App-specific styles ✅
│   ├── App.jsx                          # Main app component ✅
│   ├── index.css                        # Global styles + Tailwind ✅
│   └── main.jsx                         # Entry point ✅
├── .gitignore                           # Git ignore rules ✅
├── eslint.config.js                     # ESLint configuration ✅
├── index.html                           # HTML template ✅
├── package.json                         # Dependencies ✅
├── postcss.config.js                    # PostCSS config ✅
├── tailwind.config.js                   # Tailwind config ✅
└── vite.config.js                       # Vite config ✅
```

## React Component Architecture

### State Management Strategy

#### EventContext ✅
```javascript
{
  event: {
    name, date, venue, address, entranceTime,
    colors: { base, emphasis },
    ticketTypes: { preventa: price, taquilla: price, ... }
  },
  createEvent: (eventData) => void,
  updateEvent: (eventData) => void,
  clearEvent: () => void,
  hasEvent: () => boolean
}
```

#### TicketContext ✅
```javascript
{
  tickets: Array<Ticket>,
  addTicket: (ticketData) => Promise<Ticket>,
  searchTickets: (query) => Array<Ticket>,
  getTicketById: (ticketId) => Ticket,
  getTicketByHash: (hash) => Ticket,
  checkInTicket: (ticketId) => void,
  getStats: () => {
    totalSold, totalCheckedIn,
    byType: { [type]: { sold, checkedIn } },
    revenue: { total, byType: { [type]: amount } }
  }
}
```

## User Workflows

### Workflow 1: Event Setup ✅
1. Open application
2. If no event in localStorage, auto-redirect to "Create Event"
3. Fill event form:
   - Name, date, venue, address, entrance time
   - Define event colors (emphasis & base for navbar theming)
   - Add ticket types dynamically with prices
4. Save event - system loads details and applies colors to navbar
5. Ready to sell tickets

### Workflow 2: Selling Tickets ✅
1. Navigate to "Sell Tickets"
2. Enter buyer information:
   - Name, ID, phone number
   - Select ticket type from available options
3. Click "Create Ticket"
4. System generates:
   - Unique ticket ID (TKT-XXX-timestamp)
   - 10-character validation hash
5. Success screen displays:
   - Ticket details
   - Dynamic QR code
   - Copy/share options
6. Ticket auto-saved to localStorage

### Workflow 3: Venue Check-In ✅
1. Navigate to "Validate QR"
2. Click "Start Scanning" to activate camera
3. Position QR code in frame
4. System automatically:
   - Reads and parses QR data
   - Validates hash against stored tickets
   - Checks for duplicates
5. Results:
   - ✅ **Valid**: Shows buyer details, marks as checked in
   - ⚠️ **Duplicate**: Shows warning with original check-in time
   - ❌ **Not Found**: Displays error message
   - ❌ **Invalid**: Shows invalid format error
6. Can switch to "Ticket List" tab to view all tickets

### Workflow 4: Multi-Day Operations ⏳
**End of day:**
1. Go to dashboard
2. Click "Export Database"
3. Options:
   - Copy JSON to clipboard
   - Share JSON via Web Share API
4. Save externally

**Next day:**
1. Open application
2. Click "Import Database"
3. Paste JSON
4. System validates JSON integrity
5. Continue operations with restored data

## Key Implementation Considerations

### LocalStorage Limits
- Most browsers allow ~5-10MB
- Without storing QR codes: ~300-400 bytes per ticket
- Estimated capacity: 10,000-15,000 tickets
- QR codes generated on-the-fly from validation hash
- React hook automatically syncs state with localStorage

### QR Code Optimization ✅
- QR codes NOT stored - generated dynamically using `qrcode.react`
- 10-character validation hash for security and uniqueness
- On-demand generation: zero storage cost
- React component memoization for performance
- Copy functions:
  - SVG: Direct serialization to clipboard
  - PNG: Canvas conversion with white background

### Security Measures ✅
- 10-character hash validation (using Web Crypto API)
- Hash uniquely identifies ticket
- Duplicate check-in prevention
- Visual feedback for scan results
- Clear warnings with check-in history

### Offline Functionality
- Fully functional without internet (React app + localStorage)
- No server dependencies
- Can be deployed as static site

## Installation & Setup

```bash
# Navigate to project root
cd Sígale

# Install dependencies
npm install

# Start development server
npm run dev

# Start with network access (for mobile testing)
npm run dev -- --host

# Build for production
npm run build

# Preview production build
npm preview
```

### Current Tech Stack (Installed):
- ✅ React 19.1.1
- ✅ React Router DOM 7.9.3
- ✅ Vite 7.1.9
- ✅ Tailwind CSS 4.1.14
- ✅ qrcode.react 4.2.0
- ✅ html5-qrcode 2.3.8
- ✅ @tailwindcss/postcss 4.1.14

---

## 🚀 Recent Enhancements (Latest Updates)

### Improvements Made:
1. **✅ Bilingual Share Messages** - Share button now uses Spanish/English based on selected language
2. **✅ Date Display Fixed** - No more timezone issues; dates display correctly everywhere
3. **✅ Event Edit Preservation** - Editing events now preserves all existing tickets
4. **✅ PNG Ticket Redesign** - Professional layout: buyer name (top), ticket type (bold), price
5. **✅ Import from Clipboard** - Paste event JSON directly to restore complete events
6. **✅ Statistics & Analytics** - Real-time tracking of sales, check-ins, and revenue

---

## Access URLs

**Local Development:**
- http://localhost:5173/

**Network Access (with --host flag):**
- http://[your-ip]:5173/

**Available Routes:**
- `/` - Home page
- `/create-event` - Create new event
- `/edit-event` - Edit current event
- `/sell-tickets` - Sell tickets
- `/validate-qr` - Scan QR codes (Scanner + Ticket List tabs)
- `/copy-event` - Export/download event data

---

This React architecture gives you complete control over your data—no servers, no databases, no recurring costs. The JSON becomes your portable database, moving wherever you need it. By generating QR codes dynamically from validation hashes rather than storing them, the system achieves unprecedented efficiency: a single ticket now weighs mere bytes instead of kilobytes, like capturing lightning in a thimble rather than a barrel. Your storage breathes freely, expanding to hold thousands of tickets where others would choke on hundreds.

The React component tree flows like branches from a trunk, each piece isolated yet connected through Context, making your code as maintainable as it is powerful.
