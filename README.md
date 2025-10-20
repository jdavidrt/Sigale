# 🎫 Sígale - Mobile-First Ticket Management System

> A modern, offline-capable concert ticket management system designed for mobile-first use

## 📱 Mobile-First Design

Sígale is built with mobile devices as the primary platform, ensuring seamless ticket sales and validation on smartphones and tablets. The entire interface is optimized for touch interactions and smaller screens.

### Key Mobile Features

- **Bilingual Support (🇪🇸 🇺🇸)** - Spanish/English with auto-detection and manual toggle
- **Responsive layouts** - Adapts perfectly from 320px mobile to desktop screens
- **Touch-optimized** - Large tap targets and gesture-friendly UI
- **Camera integration** - Native QR scanning for ticket validation
- **Offline-first** - Works without internet using localStorage
- **Progressive Web App ready** - Can be installed on mobile devices
- **Share API integration** - Native mobile sharing for QR codes

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎯 Core Features

### 1. 🌍 Bilingual Interface (Spanish/English)
- **Auto-detects browser language** on first load
- **Manual language switcher** in navbar (🌐 ES/EN button)
- **Complete translation** of all UI text, alerts, and placeholders
- **Persistent preference** saved to localStorage
- **Instant switching** - No page reload required
- **Bilingual share messages** - Share tickets in user's selected language

### 2. Event Management
Create and customize your event with:
- Event name, date, venue, and address
- Custom color themes for branding (base & accent colors)
- **Unlimited dynamic ticket types** with custom names and pricing
- Mobile-friendly event editing
- Fully bilingual forms and labels
- **Event data preservation** - Editing events preserves all existing tickets
- **Import from clipboard** - Paste event JSON to restore complete event with tickets

### 3. Ticket Sales (Mobile Optimized)
- Quick buyer registration form
- Auto-generated QR codes with 10-character validation hash
- Instant ticket creation with unique ID (TKT-XXX-timestamp format)
- **Beautiful PNG ticket templates** - Custom design with Charly illustration
- Copy/share QR codes as PNG images via mobile Share API
- **Professional ticket layout** - Buyer name (top), ticket type (bold), price
- **12-hour time format** - User-friendly time display across the app
- **Delete tickets** - Remove tickets with confirmation dialog
- **Edit tickets** - Update ticket information as needed
- One-handed operation friendly
- All text translated to user's language
- **Accurate date display** - No timezone issues

### 4. QR Validation (Camera-Based)
- Real-time camera scanning with html5-qrcode
- Duplicate check-in detection with visual warnings
- Color-coded validation results (green/red/orange)
- **Searchable ticket list** - Find tickets by name, ID, or phone
- **Check-in status tracking** - Green checkmark badges for validated tickets
- Works offline with localStorage
- Optimized for scanning on phones
- Validation messages in selected language
- Dark theme UI matching mockup designs
- **Two-tab interface** - Scanner + Ticket List

### 5. Data Management
- **Copy Event Data** - Export complete event JSON to clipboard
- **Download JSON** - Save event and ticket data as file with timestamp
- **Collapsible JSON preview** - Review data before export
- **Import from clipboard** - Restore complete events with all tickets
- Backup and restore functionality
- Transfer data between devices
- **Complete data portability** - Move events across devices/browsers

### 6. Analytics Functions (Backend Only - No Dashboard UI)
- **Statistics calculations available** - getStats() function in TicketContext
- **Revenue calculation logic** - Total and per ticket type (no display UI)
- Check-in percentage logic available
- Sales breakdown logic by ticket type
- **⚠️ Note:** Dashboard pages NOT implemented - analytics functions exist but no UI to display them

## 📦 Tech Stack

**Mobile-First Framework:**
- **React 19** - Modern UI library with hooks
- **Vite** - Lightning-fast build tool
- **Tailwind CSS v4** - Utility-first, mobile-first CSS
- **React Router v6** - SPA navigation

**Mobile Features:**
- **React Context API** - Language state management (i18n)
- **qrcode.react** - SVG QR code generation
- **html5-qrcode** - Camera-based QR scanning
- **Web Crypto API** - Secure hash generation
- **localStorage** - Offline data persistence + language preference
- **Web Share API** - Native mobile sharing

## 📐 Responsive Design Breakpoints

Sígale uses Tailwind's mobile-first approach:

```css
/* Mobile (default) */
.px-2 .py-2 .text-xs

/* Tablet (md: 768px+) */
.md:px-4 .md:py-3 .md:text-base

/* Desktop (lg: 1024px+) */
.lg:px-6 .lg:py-4 .lg:text-lg
```

All components start with mobile styles and progressively enhance for larger screens.

## 🏗️ Architecture

### Mobile-First Storage Strategy
- All data stored in browser localStorage (no backend)
- ~300-400 bytes per ticket
- Capacity: 10,000-15,000 tickets
- Export/Import for multi-day events
- QR codes generated on-demand (not stored)

### React Context State Management
```
EventContext    → Event details, colors, ticket types
TicketContext   → Tickets, check-ins, statistics
LanguageContext → i18n state (ES/EN), auto-detection, persistence
```

### Data Structure
```json
{
  "event": {
    "name": "Summer Rock Festival 2025",
    "date": "2025-12-15",
    "venue": "National Stadium",
    "address": "123 Main St, City",
    "entranceTime": "19:00",
    "colors": {
      "base": "#1A1A2E",
      "emphasis": "#FF6B6B"
    },
    "ticketTypes": {
      "preventa": 50000,
      "vip": 100000
    }
  },
  "tickets": [...]
}
```

## 📱 Mobile User Workflows

### 🌍 Changing Language
1. **Auto-detection**: App detects browser language on first visit
2. **Manual toggle**: Click 🌐 button in navbar
3. **Switches between**: Spanish (ES) ↔ English (EN)
4. **Persists**: Language preference saved for next visit

### Selling Tickets (Phone)
1. Open app on mobile device
2. Navigate to "Sell" / "Vender" tab
3. Fill buyer form (optimized for mobile keyboards, in your language)
4. Generate QR code with full event details
5. Share QR as PNG via WhatsApp/Email using native Share API
6. PNG includes event name, venue address, date/time in 12h format

### Validating at Venue (Tablet/Phone)
1. Open "Validate" / "Validar" page on mobile
2. Choose between Scanner or Ticket List tabs
3. **Scanner**: Camera activates automatically for QR scanning
4. **Ticket List**: Search tickets by name, ID, or phone number
5. Instant validation with visual feedback (in selected language)
6. Duplicate detection with alerts
7. View ticket details and check-in status

### Managing Tickets
1. Navigate to Validate → Ticket List
2. Search for specific tickets using the search bar
3. View ticket details (type, price, buyer info, purchase date)
4. Delete tickets with confirmation (🗑️ button)
5. Toggle QR code visibility per ticket
6. Check-in status shown with green checkmark badge

### Exporting Event Data
1. Navigate to "Copy Event" in menu
2. View event summary (name, date, venue, ticket count)
3. Click "Copy to Clipboard" for instant JSON copy
4. Or "Download JSON File" to save locally
5. Expand JSON preview to review data before export

### Managing Events (Any Device)
1. Dashboard adapts to screen size
2. Statistics displayed in mobile-friendly cards
3. Touch-friendly buttons and controls
4. Responsive tables and lists
5. All text in your preferred language
6. Circular color pickers for theme customization
7. Times displayed in 12-hour format throughout app

## 🎨 Mobile Design Guidelines

### Typography (Mobile-Optimized)
- **Font**: Inter (optimized for screens)
- **Base size**: 16px (readable on mobile)
- **Headings**: Bold with tight letter-spacing
- **Line height**: 1.5 for readability

### Touch Targets
- **Minimum size**: 44x44px (Apple HIG)
- **Button padding**: `px-4 py-3` (minimum)
- **Tap zones**: Generous spacing between elements
- **Form inputs**: Large, easy to tap

### Mobile Navigation
- **Sticky navbar** at top
- **Icon + text** labels for clarity
- **Active states** with visual feedback
- **Bottom-sheet** patterns for modals

## 🔧 Configuration

### Tailwind Config
```js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

### Vite Config
Optimized for fast mobile development with Hot Module Replacement (HMR).

## 📂 Project Structure

```
Sígale/
├── documentation/          # Project documentation
├── src/
│   ├── components/
│   │   ├── Layout/        # Navbar, Layout (mobile-responsive)
│   │   ├── Event/         # Event creation (mobile forms)
│   │   ├── Tickets/       # Ticket forms & QR display
│   │   └── Scanner/       # Mobile camera QR scanner
│   ├── context/           # State management
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # QR generation, storage, hashing
│   ├── pages/             # Route pages (all responsive)
│   ├── App.jsx            # Router setup
│   └── index.css          # Mobile-first global styles
├── package.json
└── tailwind.config.js
```

## 🌐 Browser Compatibility (Mobile)

**Minimum versions:**
- Chrome/Edge 90+ (Android/iOS)
- Safari 14+ (iOS)
- Firefox 88+ (Android)

**Required APIs:**
- Web Crypto API ✓
- localStorage ✓
- Clipboard API ✓
- MediaDevices API (Camera) ✓
- Web Share API ✓ (iOS Safari, Chrome Android)

## 🚀 Deployment (Mobile-Ready)

### Build
```bash
npm run build
```

### Deploy to Mobile-Friendly Hosting
- **Netlify** - Automatic HTTPS (required for camera)
- **Vercel** - Edge deployment with HTTPS
- **GitHub Pages** - Free hosting with custom domain

**Important**: HTTPS is required for:
- Camera access (QR scanning)
- Clipboard API (copy QR codes)
- Service Workers (PWA features)

## 📊 Performance (Mobile)

- **First Load**: < 2s on 3G
- **Interactive**: < 1s
- **QR Generation**: < 100ms
- **Camera Scan**: Real-time (30fps)
- **Bundle Size**: < 200kb gzipped

## 🔒 Security

- **Hash Generation**: Web Crypto API (SHA-256)
- **No server**: All data client-side
- **No sensitive storage**: Payment info not stored
- **Secure context**: HTTPS only in production

## 📖 Development Stages

✅ **Stage 1** - Foundation (Complete)
- Mobile-responsive event creation
- Color themes with custom color pickers
- Unlimited dynamic ticket types
- Touch-optimized forms
- Bilingual interface (ES/EN)

✅ **Stage 2** - Tickets & QR (Complete)
- Mobile ticket sales forms
- QR generation with custom PNG templates
- Camera-based scanning with html5-qrcode
- Touch-friendly ticket cards
- Searchable ticket list
- Delete and edit ticket functionality
- Bilingual share messages

⏳ **Stage 3** - Dashboards & Analytics (Partially Complete)
- ✅ Copy event data to clipboard
- ✅ Download JSON with timestamps
- ✅ Import from clipboard
- ✅ Event data preservation on edit
- ❌ Sales dashboard UI - Not implemented
- ❌ Check-in dashboard UI - Not implemented
- ❌ Analytics visualizations - Not implemented
- ❌ Ticket viewer modal - Not implemented
- ❌ Storage monitoring/warnings - Not implemented

**Note:** Analytics calculations exist in TicketContext (getStats), but dedicated dashboard pages are not implemented.

## 🤝 Contributing

This is a mobile-first project. All contributions must:
1. Work on mobile devices (320px width minimum)
2. Use touch-friendly UI elements
3. Support offline functionality
4. Pass mobile browser testing

## 📄 License

MIT License - Build amazing mobile ticket systems!

---

**Built with ❤️ for mobile ticket management**

For detailed technical documentation, see [documentation/claude.md](documentation/claude.md)
