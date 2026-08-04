> ⚠️ **RETIRED DOCUMENT — do not treat any of this as current.**
> It describes an earlier state of Sígale and is kept only so past decisions stay
> recoverable. See [`legacy/README.md`](../README.md) for why it was retired.
> What is true today lives in [`/CLAUDE.md`](../../CLAUDE.md) and [`/docs/`](../../docs/README.md).

---

# Stage 3: Dashboards, Import/Export & Refinement

> **Historical document. Status: ✅ shipped.** This file is the original implementation plan from before Stage 3 was built. Kept for context only — for current state see [`docs/architecture/PROJECT_OVERVIEW.md`](../../docs/architecture/PROJECT_OVERVIEW.md). The dashboards, JSON/CSV/PDF export, and JSON import all shipped; many of the templates below diverged during implementation.
5. Implement ticket viewer modal
6. Add storage warnings
7. Final polish and testing

---

## Overview
This stage adds analytics dashboards, database management, and final polish.

---

## 3.1 Sales Dashboard

**File**: `src/components/Dashboard/SalesDashboard.jsx`

```javascript
import { useTickets } from "../../context/TicketContext";
import { useEvent } from "../../context/EventContext";

export const SalesDashboard = () => {
  const { getStats } = useTickets();
  const { event } = useEvent();
  const stats = getStats();

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Tickets Sold</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalSold}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
          <p className="text-3xl font-bold mt-2">${stats.revenue.total.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Checked In</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalCheckedIn}</p>
        </div>
      </div>

      {/* Sales by Type */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Sales by Ticket Type</h3>
        <div className="space-y-4">
          {Object.entries(stats.byType).map(([type, data]) => (
            <div key={type} className="flex justify-between items-center">
              <div>
                <p className="font-semibold capitalize">{type}</p>
                <p className="text-sm text-gray-600">{data.sold} sold • {data.checkedIn} checked in</p>
              </div>
              <div className="text-right">
                <p className="font-bold">${stats.revenue.byType[type]?.toLocaleString()}</p>
                <p className="text-sm text-gray-600">${event.ticketTypes[type]} each</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## 3.2 Check-In Dashboard

**File**: `src/components/Dashboard/CheckInDashboard.jsx`

```javascript
import { useTickets } from "../../context/TicketContext";

export const CheckInDashboard = () => {
  const { tickets, getStats } = useTickets();
  const stats = getStats();

  const checkedInTickets = tickets
    .filter((t) => t.checkedIn)
    .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime));

  const attendancePercentage = stats.totalSold > 0
    ? ((stats.totalCheckedIn / stats.totalSold) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Attendees</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalCheckedIn}</p>
          <p className="text-sm text-gray-600 mt-1">of {stats.totalSold} tickets</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Attendance Rate</h3>
          <p className="text-3xl font-bold mt-2">{attendancePercentage}%</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Remaining</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalSold - stats.totalCheckedIn}</p>
        </div>
      </div>

      {/* Recent Check-ins */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Recent Check-ins</h3>
        <div className="space-y-3">
          {checkedInTickets.slice(0, 10).map((ticket) => (
            <div key={ticket.ticketId} className="flex justify-between items-center border-b pb-3">
              <div>
                <p className="font-semibold">{ticket.buyerName}</p>
                <p className="text-sm text-gray-600">{ticket.ticketType}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{new Date(ticket.checkInTime).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## 3.3 Database Export

**File**: `src/components/Database/ExportDB.jsx`

```javascript
import { useState } from "react";
import { loadFromStorage } from "../../utils/storage";

export const ExportDB = () => {
  const [showPreview, setShowPreview] = useState(false);
  const [notification, setNotification] = useState(null);

  const data = loadFromStorage();
  const jsonString = JSON.stringify(data, null, 2);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setNotification({ type: "success", message: "Copied to clipboard!" });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ type: "error", message: "Failed to copy" });
    }
  };

  const downloadJSON = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sigale-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setNotification({ type: "success", message: "Download started!" });
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`p-4 rounded-lg ${notification.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {notification.message}
        </div>
      )}

      <div className="flex gap-4">
        <button onClick={copyToClipboard} className="px-6 py-3 bg-blue-600 text-white rounded-lg">Copy to Clipboard</button>
        <button onClick={downloadJSON} className="px-6 py-3 bg-purple-600 text-white rounded-lg">Download File</button>
        <button onClick={() => setShowPreview(!showPreview)} className="px-6 py-3 bg-gray-600 text-white rounded-lg">
          {showPreview ? "Hide" : "Show"} Preview
        </button>
      </div>

      {showPreview && (
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96">
          <pre className="text-sm">{jsonString}</pre>
        </div>
      )}

      <div className="text-sm text-gray-600">
        <p>Total tickets: {data.tickets?.length || 0}</p>
        <p>Event: {data.event?.name || "No event"}</p>
      </div>
    </div>
  );
};
```

---

## 3.4 Database Import

**File**: `src/utils/validator.js`

```javascript
export const validateEventData = (data) => {
  const errors = [];

  if (!data || typeof data !== "object") {
    errors.push("Invalid data format");
    return { valid: false, errors };
  }

  if (!data.event) {
    errors.push("Missing event information");
  } else {
    const required = ["name", "date", "venue", "entranceTime", "colors", "ticketTypes"];
    required.forEach((field) => {
      if (!data.event[field]) errors.push(`Missing event field: ${field}`);
    });
  }

  if (!Array.isArray(data.tickets)) {
    errors.push("Tickets must be an array");
  }

  return { valid: errors.length === 0, errors };
};
```

**File**: `src/components/Database/ImportDB.jsx`

```javascript
import { useState } from "react";
import { saveToStorage, clearStorage } from "../../utils/storage";
import { validateEventData } from "../../utils/validator";

export const ImportDB = () => {
  const [jsonText, setJsonText] = useState("");
  const [validation, setValidation] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleValidate = () => {
    try {
      const data = JSON.parse(jsonText);
      const result = validateEventData(data);
      setValidation(result);
      if (result.valid) setShowConfirm(true);
    } catch (error) {
      setValidation({ valid: false, errors: ["Invalid JSON format: " + error.message] });
    }
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(jsonText);
      clearStorage();
      saveToStorage(data);
      window.location.reload();
    } catch (error) {
      setValidation({ valid: false, errors: ["Import failed: " + error.message] });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Paste JSON Data</label>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          className="w-full h-64 px-4 py-2 border rounded-lg font-mono text-sm"
          placeholder='{"event": {...}, "tickets": [...]}'
        />
      </div>

      <button
        onClick={handleValidate}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg"
        disabled={!jsonText}
      >
        Validate JSON
      </button>

      {validation && (
        <div className={`p-4 rounded-lg ${validation.valid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {validation.valid ? (
            <p>✓ Validation successful!</p>
          ) : (
            <div>
              <p className="font-bold mb-2">✗ Validation failed:</p>
              <ul className="list-disc list-inside space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {showConfirm && validation?.valid && (
        <div className="bg-yellow-100 border-2 border-yellow-500 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-yellow-800 mb-4">⚠ Confirm Import</h3>
          <p className="text-yellow-800 mb-4">This will replace ALL current data. This action cannot be undone.</p>
          <div className="flex gap-4">
            <button onClick={handleImport} className="px-6 py-3 bg-red-600 text-white rounded-lg">Confirm Import</button>
            <button onClick={() => setShowConfirm(false)} className="px-6 py-3 bg-gray-600 text-white rounded-lg">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 3.5 Dashboard Page

**File**: `src/pages/DashboardPage.jsx`

```javascript
import { useState } from "react";
import { SalesDashboard } from "../components/Dashboard/SalesDashboard";
import { CheckInDashboard } from "../components/Dashboard/CheckInDashboard";
import { ExportDB } from "../components/Database/ExportDB";
import { ImportDB } from "../components/Database/ImportDB";
import { getStorageSizeInMB } from "../utils/storage";

export const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState("sales");

  const tabs = [
    { id: "sales", label: "Sales Dashboard" },
    { id: "checkin", label: "Check-in Dashboard" },
    { id: "export", label: "Export Data" },
    { id: "import", label: "Import Data" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="text-sm text-gray-600">Storage: {getStorageSizeInMB()} MB</div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "sales" && <SalesDashboard />}
        {activeTab === "checkin" && <CheckInDashboard />}
        {activeTab === "export" && <ExportDB />}
        {activeTab === "import" && <ImportDB />}
      </div>
    </div>
  );
};
```

---

## 3.6 Update App.jsx

**Add to** `src/App.jsx`:

```javascript
import { DashboardPage } from "./pages/DashboardPage";

// Add route:
<Route path="/dashboard" element={<DashboardPage />} />
```

---

## 3.7 Enhanced Navbar

**Update** `src/components/Layout/Navbar.jsx`:

```javascript
import { Link, useLocation } from "react-router-dom";
import { useEvent } from "../../context/EventContext";

export const Navbar = () => {
  const { event } = useEvent();
  const location = useLocation();

  const navStyle = event ? { backgroundColor: event.colors.base } : { backgroundColor: "#1A1A2E" };
  const accentColor = event?.colors.emphasis || "#FF6B6B";

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/sell-tickets", label: "Sell Tickets" },
    { path: "/validate-qr", label: "Validate QR" },
    { path: "/dashboard", label: "Dashboard" },
  ];

  const isActive = (path) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path));

  return (
    <nav style={navStyle} className="shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="text-white">
            <Link to="/" className="text-2xl font-bold">Sígale</Link>
            {event && <p className="text-sm opacity-80 mt-1">{event.name}</p>}
          </div>

          <div className="flex gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-white hover:opacity-80 transition ${isActive(link.path) ? "font-bold" : ""}`}
                style={isActive(link.path) ? { color: accentColor } : {}}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};
```

---

## 3.8 README

**File**: `README.md`

```markdown
# Sígale - Ticket Management System

A static React web application for managing concert ticket sales, QR code generation, and entry validation.

## Features

- 🎫 Event creation with custom branding
- 💳 Ticket sales registration
- 📱 Dynamic QR code generation
- ✅ QR code validation and check-in
- 📊 Sales and check-in dashboards
- 💾 Database export/import
- 🔒 Offline-capable (localStorage)

## Installation

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- React Router
- qrcode.react
- html5-qrcode

## License

MIT
```

---

## Testing Checklist

- [ ] Sales dashboard shows statistics
- [ ] Check-in dashboard displays rates
- [ ] Can export database (copy/download)
- [ ] Can import database with validation
- [ ] JSON validation works
- [ ] Import replaces data correctly
- [ ] Navbar highlights active route
- [ ] All components responsive
- [ ] Build completes successfully
- [ ] QR codes scan on mobile devices

---

## ⚠️ IMPORTANT NOTE

**Stage 3 depends on Stage 2 being complete.** You must implement all ticket and QR functionality from Stage 2 before working on dashboards, as the dashboards display ticket and check-in data.
