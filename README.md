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

### 2. Event Management
Create and customize your event with:
- Event name, date, venue, and address
- Custom color themes for branding
- Dynamic ticket types with pricing
- Mobile-friendly event editing
- Fully bilingual forms and labels

### 3. Ticket Sales (Mobile Optimized)
- Quick buyer registration form
- Auto-generated QR codes
- Instant ticket creation
- Copy/share QR codes via mobile Share API
- One-handed operation friendly
- All text translated to user's language

### 4. QR Validation (Camera-Based)
- Real-time camera scanning
- Duplicate check-in detection
- Visual and audio feedback
- Works offline with localStorage
- Optimized for scanning on phones
- Validation messages in selected language

### 5. Analytics Dashboard
- Sales statistics by ticket type
- Check-in tracking
- Revenue calculations
- Mobile-responsive charts and cards

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
4. Generate QR code
5. Share QR via WhatsApp/Email using native Share API

### Validating at Venue (Tablet/Phone)
1. Open "Validate" / "Validar" page on mobile
2. Camera activates automatically
3. Scan attendee's QR code from their phone
4. Instant validation with visual feedback (in selected language)
5. Duplicate detection with alerts

### Managing Events (Any Device)
1. Dashboard adapts to screen size
2. Statistics displayed in mobile-friendly cards
3. Touch-friendly buttons and controls
4. Responsive tables and lists
5. All text in your preferred language

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
- Color themes
- Dynamic ticket types
- Touch-optimized forms

✅ **Stage 2** - Tickets & QR (Complete)
- Mobile ticket sales forms
- QR generation and sharing
- Camera-based scanning
- Touch-friendly ticket cards

⏳ **Stage 3** - Dashboards (Planned)
- Mobile analytics views
- Export/Import functionality
- Storage warnings

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
