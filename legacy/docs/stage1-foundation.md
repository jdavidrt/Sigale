> ⚠️ **RETIRED DOCUMENT — do not treat any of this as current.**
> It describes an earlier state of Sígale and is kept only so past decisions stay
> recoverable. See [`legacy/README.md`](../README.md) for why it was retired.
> What is true today lives in [`/CLAUDE.md`](../../CLAUDE.md) and [`/docs/`](../../docs/README.md).

---

# Stage 1: Project Foundation & Event Creation

## ✅ STATUS: COMPLETE

This stage has been fully implemented with all core features working.

> **Historical note — Tailwind was later removed.** The `npm install … tailwindcss`, `tailwind.config.js`, and `@tailwind` steps below reflect how the foundation was *originally* scaffolded. The project has since migrated to **plain CSS only** (design tokens + CSS Modules; PostCSS runs autoprefixer only). Do not re-run the Tailwind setup — see `/CLAUDE.md` and `docs/guides/css-architecture-guide.md`.

## Overview
This stage establishes the project foundation, creates the event system, and sets up the basic application structure.

---

## 1.1 Project Initialization

**Create Vite + React project**:
```bash
npm create vite@latest Sígale -- --template react
cd Sígale
npm install
npm install react-router-dom qrcode.react html5-qrcode
npm install -D tailwindcss postcss autoprefixer @tailwindcss/postcss
```

**Note**: Manual configuration of `tailwind.config.js` and `postcss.config.js` is required (see below). Do not use `npx tailwindcss init -p` as it may create incorrect config.

**Configure Tailwind** (`tailwind.config.js`):
```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

**Configure PostCSS** (`postcss.config.js`):
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
```

**Setup Tailwind with Modern Typography** (`src/index.css`):
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Modern Typography - Inter Font (Ableton-style) */
* {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  color: #111827;
  letter-spacing: -0.01em;
}

h1, h2, h3, h4, h5, h6 {
  letter-spacing: -0.02em;
  font-weight: 700;
}

input, textarea, select, button {
  font-family: inherit;
}
```

**IMPORTANT**: Never use `@apply` directive in index.css with Tailwind v4+. Use plain CSS with hex colors instead.

---

## 1.2 Project Structure

```bash
mkdir -p src/components/Layout src/components/Event src/components/Tickets src/components/Scanner src/components/Dashboard src/components/Database src/context src/hooks src/utils src/pages src/assets
```

---

## 1.3 Storage Utilities

**File**: `src/utils/storage.js`

```javascript
const STORAGE_KEY = "sigale-event-data";

export const saveToStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    return false;
  }
};

export const loadFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    return null;
  }
};

export const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing localStorage:", error);
    return false;
  }
};

export const getStorageSize = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? new Blob([data]).size : 0;
};

export const getStorageSizeInMB = () => {
  return (getStorageSize() / (1024 * 1024)).toFixed(2);
};
```

---

## 1.4 Hash Generation

**File**: `src/utils/hashGenerator.js`

```javascript
export const generateValidationHash = async (ticketData) => {
  const dataString = JSON.stringify({
    ticketId: ticketData.ticketId,
    buyerName: ticketData.buyerName,
    buyerId: ticketData.buyerId,
    timestamp: ticketData.purchaseDate,
  });

  const encoder = new TextEncoder();
  const data = encoder.encode(dataString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return hashHex.substring(0, 10);
};

export const generateTicketId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `TKT-${random.toString().padStart(3, "0")}-${timestamp}`;
};
```

---

## 1.5 Custom Hook

**File**: `src/hooks/useLocalStorage.js`

```javascript
import { useState, useEffect } from "react";
import { saveToStorage, loadFromStorage } from "../utils/storage";

export const useLocalStorage = (initialValue) => {
  const [data, setData] = useState(() => {
    const stored = loadFromStorage();
    return stored || initialValue;
  });

  useEffect(() => {
    saveToStorage(data);
  }, [data]);

  return [data, setData];
};
```

---

## 1.6 Event Context

**File**: `src/context/EventContext.jsx`

```javascript
import { createContext, useContext } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

const EventContext = createContext();

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) throw new Error("useEvent must be used within EventProvider");
  return context;
};

export const EventProvider = ({ children }) => {
  const [data, setData] = useLocalStorage({
    event: null,
    tickets: [],
  });

  const createEvent = (eventData) => {
    setData({
      ...data,
      event: { ...eventData, createdAt: new Date().toISOString() },
    });
  };

  const updateEvent = (eventData) => {
    setData({
      ...data,
      event: { ...data.event, ...eventData },
    });
  };

  const clearEvent = () => {
    setData({ event: null, tickets: [] });
  };

  const hasEvent = () => data.event !== null;

  return (
    <EventContext.Provider value={{ event: data.event, createEvent, updateEvent, clearEvent, hasEvent }}>
      {children}
    </EventContext.Provider>
  );
};
```

---

## 1.7 Layout Components

**File**: `src/components/Layout/Navbar.jsx`

```javascript
import { Link, useLocation } from "react-router-dom";
import { useEvent } from "../../context/EventContext";

export const Navbar = () => {
  const { event } = useEvent();
  const location = useLocation();

  const navStyle = event ? { backgroundColor: event.colors.base } : { backgroundColor: "#1A1A2E" };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/sell-tickets", label: "Sell", icon: "🎫" },
    { path: "/validate-qr", label: "Validate", icon: "✅" },
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
  ];

  return (
    <nav style={navStyle} className="shadow-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <Link to="/" className="flex flex-col text-white hover:opacity-80 transition-opacity">
            <span className="text-2xl md:text-3xl font-bold tracking-tight">Sígale</span>
            {event && <span className="text-xs md:text-sm opacity-80 truncate max-w-[150px] md:max-w-none">{event.name}</span>}
          </Link>

          {/* Navigation Links - Icons + Text Always Visible */}
          <div className="flex gap-2 md:gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-2 md:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1 md:gap-2 text-xs md:text-base ${
                  isActive(link.path)
                    ? "bg-white text-gray-900 shadow-lg transform scale-105"
                    : "text-white hover:bg-white hover:bg-opacity-20"
                }`}
                style={isActive(link.path) ? { color: navStyle.backgroundColor } : {}}
              >
                <span className="text-base md:text-lg">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};
```

**File**: `src/components/Layout/Layout.jsx`

```javascript
import { Navbar } from "./Navbar";

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <Navbar />
      <main className="container mx-auto px-4 py-6 md:py-8">{children}</main>
    </div>
  );
};
```

---

## 1.8 Event Creation Form

**File**: `src/components/Event/CreateEvent.jsx`

```javascript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEvent } from "../../context/EventContext";

export const CreateEvent = () => {
  const navigate = useNavigate();
  const { createEvent } = useEvent();

  const [formData, setFormData] = useState({
    name: "",
    date: "",
    venue: "",
    entranceTime: "",
    colors: { base: "#1A1A2E", emphasis: "#FF6B6B" },
    ticketTypes: { preventa: 0, taquilla: 0 },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createEvent(formData);
    navigate("/");
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div>
        <label className="block mb-2 font-medium">Event Name</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block mb-2 font-medium">Date</label>
        <input
          type="date"
          required
          value={formData.date}
          onChange={(e) => setFormData({...formData, date: e.target.value})}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block mb-2 font-medium">Venue</label>
        <input
          type="text"
          required
          value={formData.venue}
          onChange={(e) => setFormData({...formData, venue: e.target.value})}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block mb-2 font-medium">Entrance Time</label>
        <input
          type="time"
          required
          value={formData.entranceTime}
          onChange={(e) => setFormData({...formData, entranceTime: e.target.value})}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 font-medium">Base Color</label>
          <input
            type="color"
            value={formData.colors.base}
            onChange={(e) => setFormData({...formData, colors: {...formData.colors, base: e.target.value}})}
            className="w-full h-12 rounded-lg"
          />
        </div>
        <div>
          <label className="block mb-2 font-medium">Emphasis Color</label>
          <input
            type="color"
            value={formData.colors.emphasis}
            onChange={(e) => setFormData({...formData, colors: {...formData.colors, emphasis: e.target.value}})}
            className="w-full h-12 rounded-lg"
          />
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-4">Ticket Types</h3>
        {Object.entries(formData.ticketTypes).map(([type, price]) => (
          <div key={type} className="mb-4">
            <label className="block mb-2 capitalize">{type}</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setFormData({
                ...formData,
                ticketTypes: {...formData.ticketTypes, [type]: Number(e.target.value)}
              })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        ))}
      </div>

      <button type="submit" className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Create Event
      </button>
    </form>
  );
};
```

---

## 1.9 Home Page

**File**: `src/pages/Home.jsx`

```javascript
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEvent } from "../context/EventContext";

export const Home = () => {
  const navigate = useNavigate();
  const { event, hasEvent } = useEvent();

  useEffect(() => {
    if (!hasEvent()) navigate("/create-event");
  }, [hasEvent, navigate]);

  if (!event) return null;

  return (
    <div className="space-y-8">
      <div className="rounded-lg p-8 text-white" style={{ backgroundColor: event.colors.base }}>
        <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
        <p>📍 {event.venue}</p>
        <p>📅 {event.date} • ⏰ {event.entranceTime}</p>
      </div>
    </div>
  );
};
```

**File**: `src/pages/CreateEventPage.jsx`

```javascript
import { CreateEvent } from "../components/Event/CreateEvent";

export const CreateEventPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Create New Event</h1>
      <CreateEvent />
    </div>
  );
};
```

---

## 1.10 Router Setup

**File**: `src/App.jsx`

```javascript
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EventProvider } from "./context/EventContext";
import { Layout } from "./components/Layout/Layout";
import { Home } from "./pages/Home";
import { CreateEventPage } from "./pages/CreateEventPage";

function App() {
  return (
    <EventProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create-event" element={<CreateEventPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </EventProvider>
  );
}

export default App;
```

---

## Testing Checklist

- [x] Project builds (`npm run dev`)
- [x] Can create event with all fields (including address)
- [x] Event persists in localStorage
- [x] Navbar displays event colors with active state highlighting
- [x] Home redirects to create event when none exists
- [x] Color pickers work
- [x] Event displays on home page with Edit button
- [x] Can edit existing event
- [x] Ticket types can be added/removed/renamed
- [x] At least one ticket type is required
- [x] Modern Inter font loads correctly
- [x] Navigation shows both icons and text on all screen sizes

---

## Stage 1 Enhancements (Current Implementation)

### UI/UX Improvements
- **Modern Typography**: Inter font family (Ableton-style) with proper font smoothing
- **Enhanced Navbar**:
  - Active state highlighting (white background on current page)
  - Icons + text always visible (not hidden on mobile)
  - Sticky positioning
  - Smooth hover effects
- **Gradient Background**: Subtle blue-purple gradient in Layout
- **Card-Based Design**: Event details, color theme, and ticket types in separate cards
- **Better Form Styling**:
  - Rounded inputs with focus states
  - Color pickers with hex input fields
  - Emoji icons for all labels
  - Section headers with better hierarchy

### Feature Additions
- **Address Field**: Added to event data structure
- **Event Editing**: Edit Event button on home page, dedicated EditEventPage
- **Dynamic Ticket Types**:
  - Add unlimited ticket types
  - Edit ticket type names
  - Remove ticket types (minimum 1 required)
  - Validation for duplicates and empty names
- **Responsive Design**: Mobile-first with proper breakpoints

### Technical Updates
- **PostCSS Configuration**: Updated for Tailwind v4+ with `@tailwindcss/postcss`
- **No @apply Usage**: All custom CSS uses plain CSS (avoids Tailwind errors)
- **Enhanced State Management**: updateTicketTypeName, updateTicketPrice functions
