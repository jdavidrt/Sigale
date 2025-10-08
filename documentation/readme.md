# Sígale - Ticket Management System - Project Outline

## 🚧 Current Implementation Status

**✅ STAGE 1 COMPLETE** - Foundation & Event Creation
**⏳ STAGE 2 PENDING** - Tickets, QR Generation & Validation
**⏳ STAGE 3 PENDING** - Dashboards, Analytics & Database Management

### What's Working Now:
- ✅ Vite + React 19 + Tailwind CSS v4 setup
- ✅ Event creation with custom branding (colors, ticket types)
- ✅ Event editing functionality
- ✅ Dynamic navbar with event colors
- ✅ localStorage data persistence
- ✅ Responsive design with Inter font
- ✅ Address field for venue location

### What's Missing (To Be Implemented):
- ⏳ Ticket sales & registration
- ⏳ QR code generation & display
- ⏳ QR code scanning & validation
- ⏳ Check-in system with duplicate detection
- ⏳ Sales dashboard & analytics
- ⏳ Check-in dashboard & attendance tracking
- ⏳ Database export/import functionality

---

## Overview
A static React web application for managing concert ticket sales, QR code generation, and entry validation. All data persists in browser localStorage as JSON, enabling complete database portability through simple copy-paste operations.

## Core Features

### 0. Event Creation
Create a new event from scratch with the following information:
- Event name
- Event date
- Venue location
- Time of entrance
- Event colors (two colors: emphasis and base for navbar theming)
- Ticket types with pricing (user can dynamically add custom ticket types with values):
  - **Preventa** (Pre-sale price)
  - **Venta en Taquilla** (Box office price)
  - Additional custom ticket types as needed

### 1. Ticket Sales Registration
- Capture buyer information:
  - Full name
  - ID number
  - Phone number
  - Ticket purchase date (date only, no time)
  - Ticket type (Preventa, Taquilla, or custom)
  - Unique ticket ID (auto-generated)
- Generate validation hash for ticket (10 characters)
- Display QR code dynamically generated from hash
- Copy/share QR code functionality:
  - Copy as SVG
  - Copy as PNG image
  - Share via Web Share API
- QR code displays event name, date, and entrance time prominently

### 2. Data Persistence Architecture
The entire database lives as a JSON structure in localStorage:

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

**Note**: QR codes are NOT stored in the JSON. They are dynamically generated on-demand from the validation hash, drastically reducing storage requirements.

### 3. QR Code System
- **Storage Strategy**: QR codes are NOT stored in JSON - only the validation hash is saved
- **Generation**: QR codes are dynamically generated from the validation hash whenever needed
- **QR Content Structure**: The validation hash encodes:
  - Ticket ID
  - Buyer name
  - Phone number
  - Ticket type
  - Event name, date, venue, entrance time
- **Copy Functionality**: Built-in function to copy QR code as:
  - SVG text to clipboard
  - PNG image to clipboard
  - Direct share via Web Share API
- **Display**: QR codes generated on-demand in ticket list and detail views
- **Validation**: Scanner reads QR, extracts hash, verifies against stored ticket data
- **Security**: 
  - Prevent duplicate entries for same ticket
  - Display clear warning when attempting to scan already-scanned QR
  - Visual and audio feedback for duplicate scan attempts
  
**Storage Advantage**: Without storing QR codes, database size reduces by ~95%, allowing 10,000+ tickets in localStorage.

### 4. Dashboard Views

#### Sales Dashboard
- Total tickets sold by type (with custom types support)
- Recent transactions list
- Revenue tracking by ticket type
- Total revenue calculation
- Search functionality by name/ID/phone
- **Ticket QR Viewer**: 
  - View any sold ticket's details
  - Regenerate QR code on-demand from validation hash
  - Copy/share regenerated QR code
  - Access ticket history and buyer information
  - Quick actions: view QR, copy QR, share QR

#### Check-In Dashboard
- Total attendees entered
- Real-time entry list with timestamps
- Entry rate visualization
- Attendance percentage
- Check-in status by ticket type

### 5. Database Export/Import
- **Export**: Copy entire JSON to clipboard with share option
- **Import**: Paste JSON to restore complete state
- **Validate**: Validate JSON integrity and correctness before import
- **Reset**: Clear current data before importing new event
- **Share**: Share JSON via Web Share API for easy backup

## Technical Stack

### React Setup
- **Build Tool**: Vite (for fast development and optimized builds)
- **React Version**: 18+
- **State Management**: React Context API + useState/useReducer hooks
- **Routing**: React Router v6 (for navigation between views)
- **Local Storage Hook**: Custom hook for localStorage synchronization

### Required Libraries
1. **QR Code Generation**: `qrcode.react` or `react-qr-code`
   - npm: `npm install qrcode.react`
   - For dynamic SVG generation from hash
   
2. **QR Code Scanning**: `html5-qrcode` with React wrapper
   - npm: `npm install html5-qrcode`
   - Create custom React component wrapper

3. **UI Framework**: Tailwind CSS
   - npm: `npm install -D tailwindcss postcss autoprefixer`
   - Configure with Vite

4. **Hash Generation**: Built-in Web Crypto API (no external library needed)

5. **Clipboard API**: Built-in browser Clipboard API for copy functionality

6. **Icons**: `lucide-react` (available in React artifacts)
   - For UI icons and visual elements

### Project Structure
```
/sigale-ticket-system
  ├── public/
  │   └── index.html
  ├── src/
  │   ├── components/
  │   │   ├── Layout/
  │   │   │   ├── Navbar.jsx           # Dynamic colored navbar
  │   │   │   └── Layout.jsx           # Main layout wrapper
  │   │   ├── Event/
  │   │   │   ├── CreateEvent.jsx      # Event creation form
  │   │   │   └── EventHeader.jsx      # Event info display
  │   │   ├── Tickets/
  │   │   │   ├── TicketForm.jsx       # Ticket registration form
  │   │   │   ├── TicketList.jsx       # List of sold tickets
  │   │   │   ├── TicketCard.jsx       # Individual ticket display
  │   │   │   └── QRDisplay.jsx        # QR code display component
  │   │   ├── Scanner/
  │   │   │   ├── QRScanner.jsx        # QR scanner component
  │   │   │   └── ValidationResult.jsx # Scan result display
  │   │   ├── Dashboard/
  │   │   │   ├── SalesDashboard.jsx   # Sales statistics
  │   │   │   ├── CheckInDashboard.jsx # Check-in statistics
  │   │   │   └── Charts.jsx           # Data visualizations
  │   │   └── Database/
  │   │       ├── ExportDB.jsx         # Export functionality
  │   │       └── ImportDB.jsx         # Import functionality
  │   ├── context/
  │   │   ├── EventContext.jsx         # Event state management
  │   │   └── TicketContext.jsx        # Ticket state management
  │   ├── hooks/
  │   │   ├── useLocalStorage.js       # localStorage sync hook
  │   │   ├── useQRGenerator.js        # QR generation hook
  │   │   └── useTicketValidator.js    # Ticket validation hook
  │   ├── utils/
  │   │   ├── storage.js               # localStorage utilities
  │   │   ├── hashGenerator.js         # Hash generation (10 chars)
  │   │   ├── qrGenerator.js           # QR code generation utilities
  │   │   ├── qrCopy.js                # QR copy/share utilities
  │   │   └── validator.js             # JSON validation utilities
  │   ├── pages/
  │   │   ├── Home.jsx                 # Landing/event selection
  │   │   ├── CreateEventPage.jsx      # Event creation page
  │   │   ├── SellTicketsPage.jsx      # Ticket sales page
  │   │   ├── ValidateQRPage.jsx       # QR scanning page
  │   │   └── DashboardPage.jsx        # Analytics page
  │   ├── App.jsx                      # Main app component
  │   ├── main.jsx                     # Entry point
  │   └── index.css                    # Global styles + Tailwind
  ├── package.json
  ├── vite.config.js
  ├── tailwind.config.js
  └── README.md
```

## React Component Architecture

### State Management Strategy

#### EventContext
```javascript
{
  event: {
    name, date, venue, entranceTime, colors, ticketTypes
  },
  createEvent: (eventData) => {},
  updateEvent: (eventData) => {},
  clearEvent: () => {}
}
```

#### TicketContext
```javascript
{
  tickets: [],
  addTicket: (ticketData) => {},
  checkInTicket: (ticketId) => {},
  searchTickets: (query) => {},
  getStats: () => {}
}
```

### Key React Hooks

#### useLocalStorage
```javascript
const [data, setData] = useLocalStorage('sigale-db', initialValue);
// Automatically syncs with localStorage
```

#### useQRGenerator
```javascript
const { generateQR, copyAsSVG, copyAsPNG, shareQR } = useQRGenerator(hash);
```

#### useTicketValidator
```javascript
const { validate, isCheckedIn } = useTicketValidator();
```

## User Workflows

### Workflow 1: Event Setup
1. Open application
2. If no event JSON in localStorage, auto-redirect to "Create Event"
3. Fill event form:
   - Name, date, venue, entrance time
   - Define event colors (emphasis & base for navbar theming)
   - Add ticket types dynamically with prices
4. Save event - system loads details and applies colors to navbar
5. Ready to sell tickets

### Workflow 2: Selling Tickets
1. Navigate to "Sell Tickets"
2. Enter buyer information:
   - Name, ID, phone number
   - Select ticket type from available options
3. Click "Generate Ticket"
4. System generates 10-character validation hash
5. Stores ticket data (no QR stored)
6. QR code dynamically renders from hash
7. Copy/share options:
   - Copy as SVG text
   - Copy as PNG image
   - Share via Web Share API
8. Ticket auto-saved to localStorage via React Context

### Workflow 3: Venue Check-In
1. Navigate to "Validate QR"
2. Camera opens automatically
3. Scan attendee's QR code
4. System validates and checks duplicates
5. Success: Show confirmation with buyer details
6. Duplicate: Display warning with original check-in time
7. Dashboard updates in real-time via React state

### Workflow 4: Multi-Day Operations
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
- Without storing QR codes: ~300-400 bytes per ticket (with phone number)
- Estimated capacity: 10,000-15,000 tickets
- QR codes generated on-the-fly from validation hash
- Monitor storage usage and warn at 80% capacity
- React hook automatically syncs state with localStorage

### QR Code Optimization
- QR codes NOT stored - generated dynamically using React components
- 10-character validation hash for security and uniqueness
- On-demand generation: zero storage cost
- React component memoization for performance
- Copy functions convert hash to QR in multiple formats

### Security Measures
- 10-character hash validation (using Web Crypto API)
- Hash uniquely identifies ticket and encodes all data
- Timestamp checks to prevent old ticket reuse
- Visual and audio feedback for duplicate scans
- Clear warnings with check-in history

### Offline Functionality
- Fully functional without internet (React app + localStorage)
- Service Worker for PWA behavior (Vite PWA plugin)
- Install as standalone app on mobile devices

### React-Specific Optimizations
- Component memoization (React.memo) for lists
- useMemo for expensive calculations
- useCallback for event handlers
- Lazy loading for route components
- Context API to avoid prop drilling

## Development Phases

**Phase 1**: Vite + React setup, routing, and base layout  
**Phase 2**: Event creation form with color picker and dynamic ticket types  
**Phase 3**: Context API setup for state management  
**Phase 4**: localStorage hook integration  
**Phase 5**: Ticket creation form and hash generation  
**Phase 6**: Dynamic QR generation component with React  
**Phase 7**: QR copy/share utilities (SVG, PNG, Web Share)  
**Phase 8**: Scanner integration with React wrapper  
**Phase 9**: Validation logic with duplicate detection  
**Phase 10**: Dashboard components with charts  
**Phase 11**: Import/export functionality with validation  
**Phase 12**: Navbar dynamic theming based on event colors  
**Phase 13**: Polish UI/UX, error handling, and loading states  
**Phase 14**: PWA configuration for offline support  

## Installation & Setup

```bash
# Navigate to project
cd sigale-ticket-system

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Current Tech Stack (Installed):
- ✅ React 19.1.1
- ✅ React Router DOM 7.9.3
- ✅ Vite 7.1.7
- ✅ Tailwind CSS 4.1.14
- ✅ qrcode.react 4.2.0 (ready for Stage 2)
- ✅ html5-qrcode 2.3.8 (ready for Stage 2)

---

## 📁 Current File Structure

```
sigale-ticket-system/
├── src/
│   ├── components/
│   │   ├── Event/
│   │   │   └── CreateEvent.jsx ✅
│   │   └── Layout/
│   │       ├── Layout.jsx ✅
│   │       └── Navbar.jsx ✅
│   ├── context/
│   │   └── EventContext.jsx ✅
│   ├── hooks/
│   │   └── useLocalStorage.js ✅
│   ├── pages/
│   │   ├── CreateEventPage.jsx ✅
│   │   ├── EditEventPage.jsx ✅
│   │   └── Home.jsx ✅
│   ├── utils/
│   │   ├── hashGenerator.js ✅
│   │   └── storage.js ✅
│   ├── App.jsx ✅
│   ├── index.css ✅
│   └── main.jsx ✅
├── package.json ✅
├── tailwind.config.js ✅
├── postcss.config.js ✅
└── vite.config.js ✅
```

---

## 🚀 Next Steps: Implementing Stage 2

To continue development, follow `stage2-tickets-qr.md` to implement:

1. **TicketContext** - Ticket state management
2. **QR Utilities** - Generate QR codes from validation hash
3. **Ticket Form** - Register ticket sales
4. **QR Scanner** - Camera-based validation
5. **Duplicate Detection** - Prevent double check-ins

All dependencies are already installed. See `stage2-tickets-qr.md` for complete implementation guide.

---

This React architecture gives you complete control over your data—no servers, no databases, no recurring costs. The JSON becomes your portable database, moving wherever you need it. By generating QR codes dynamically from validation hashes rather than storing them, the system achieves unprecedented efficiency: a single ticket now weighs mere bytes instead of kilobytes, like capturing lightning in a thimble rather than a barrel. Your storage breathes freely, expanding to hold thousands of tickets where others would choke on hundreds.

The React component tree flows like branches from a trunk, each piece isolated yet connected through Context, making your code as maintainable as it is powerful.