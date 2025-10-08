# Stage 2: Ticket Sales, QR Generation & Validation

## ⏳ STATUS: NOT IMPLEMENTED

**This stage has NOT been built yet.** All code examples below are templates to be implemented.

### Required Steps to Complete:
1. Install dependencies (already done): `qrcode.react`, `html5-qrcode`
2. Create TicketContext for ticket state management
3. Build QR utilities (qrGenerator.js, qrCopy.js)
4. Create ticket form and list components
5. Implement QR scanner with camera
6. Add validation and duplicate detection
7. Update App.jsx with new routes

---

## Overview
This stage implements ticket sales, QR code generation/scanning, and check-in validation.

---

## 2.1 Ticket Context

**File**: `src/context/TicketContext.jsx`

```javascript
import { createContext, useContext } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { generateValidationHash, generateTicketId } from "../utils/hashGenerator";

const TicketContext = createContext();

export const useTickets = () => {
  const context = useContext(TicketContext);
  if (!context) throw new Error("useTickets must be used within TicketProvider");
  return context;
};

export const TicketProvider = ({ children }) => {
  const [data, setData] = useLocalStorage({ event: null, tickets: [] });

  const addTicket = async (ticketData) => {
    const ticketId = generateTicketId();
    const ticket = {
      ticketId,
      ...ticketData,
      purchaseDate: new Date().toISOString().split("T")[0],
      checkedIn: false,
      checkInTime: null,
    };

    const validationHash = await generateValidationHash(ticket);
    ticket.validationHash = validationHash;

    setData({ ...data, tickets: [...data.tickets, ticket] });
    return ticket;
  };

  const searchTickets = (query) => {
    const lowercaseQuery = query.toLowerCase();
    return data.tickets.filter(
      (ticket) =>
        ticket.buyerName.toLowerCase().includes(lowercaseQuery) ||
        ticket.buyerId.toLowerCase().includes(lowercaseQuery) ||
        ticket.buyerPhone.toLowerCase().includes(lowercaseQuery) ||
        ticket.ticketId.toLowerCase().includes(lowercaseQuery)
    );
  };

  const getTicketById = (ticketId) => data.tickets.find((t) => t.ticketId === ticketId);

  const checkInTicket = (ticketId) => {
    const updatedTickets = data.tickets.map((ticket) =>
      ticket.ticketId === ticketId
        ? { ...ticket, checkedIn: true, checkInTime: new Date().toISOString() }
        : ticket
    );
    setData({ ...data, tickets: updatedTickets });
  };

  const getStats = () => {
    const stats = {
      totalSold: data.tickets.length,
      totalCheckedIn: data.tickets.filter((t) => t.checkedIn).length,
      byType: {},
      revenue: { total: 0, byType: {} },
    };

    data.tickets.forEach((ticket) => {
      const type = ticket.ticketType;
      if (!stats.byType[type]) stats.byType[type] = { sold: 0, checkedIn: 0 };
      stats.byType[type].sold++;
      if (ticket.checkedIn) stats.byType[type].checkedIn++;

      const price = data.event?.ticketTypes[type] || 0;
      stats.revenue.total += price;
      if (!stats.revenue.byType[type]) stats.revenue.byType[type] = 0;
      stats.revenue.byType[type] += price;
    });

    return stats;
  };

  return (
    <TicketContext.Provider value={{ tickets: data.tickets, addTicket, searchTickets, getTicketById, checkInTicket, getStats }}>
      {children}
    </TicketContext.Provider>
  );
};
```

---

## 2.2 QR Utilities

**File**: `src/utils/qrGenerator.js`

```javascript
export const generateQRData = (ticket, event) => {
  return JSON.stringify({
    ticketId: ticket.ticketId,
    hash: ticket.validationHash,
    buyer: ticket.buyerName,
    type: ticket.ticketType,
    event: event.name,
    date: event.date,
    venue: event.venue,
    time: event.entranceTime,
  });
};

export const parseQRData = (qrString) => {
  try {
    return JSON.parse(qrString);
  } catch (error) {
    return null;
  }
};
```

**File**: `src/utils/qrCopy.js`

```javascript
export const copySVGToClipboard = async (svgElement) => {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  try {
    await navigator.clipboard.writeText(svgData);
    return true;
  } catch (error) {
    console.error("Error copying SVG:", error);
    return false;
  }
};

export const copyPNGToClipboard = async (svgElement) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();

  return new Promise((resolve) => {
    img.onload = async () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          resolve(true);
        } catch (error) {
          console.error("Error copying PNG:", error);
          resolve(false);
        }
      });
    };

    const svgData = new XMLSerializer().serializeToString(svgElement);
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  });
};

export const shareQR = async (qrData, eventName) => {
  if (navigator.share) {
    try {
      await navigator.share({ title: `Ticket - ${eventName}`, text: qrData });
      return true;
    } catch (error) {
      console.error("Error sharing:", error);
      return false;
    }
  }
  return false;
};
```

---

## 2.3 QR Display Component

**File**: `src/components/Tickets/QRDisplay.jsx`

```javascript
import { useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generateQRData } from "../../utils/qrGenerator";
import { copySVGToClipboard, copyPNGToClipboard, shareQR } from "../../utils/qrCopy";

export const QRDisplay = ({ ticket, event, showActions = true }) => {
  const qrRef = useRef(null);
  const qrData = generateQRData(ticket, event);

  const copyAsSVG = useCallback(async () => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector("svg");
      return await copySVGToClipboard(svg);
    }
    return false;
  }, []);

  const copyAsPNG = useCallback(async () => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector("svg");
      return await copyPNGToClipboard(svg);
    }
    return false;
  }, []);

  const share = useCallback(async () => {
    return await shareQR(qrData, event.name);
  }, [qrData, event.name]);

  return (
    <div className="space-y-4">
      <div ref={qrRef} className="flex justify-center p-4 bg-white rounded-lg">
        <QRCodeSVG value={qrData} size={256} level="H" includeMargin={true} />
      </div>

      {showActions && (
        <div className="flex gap-2 justify-center">
          <button onClick={copyAsSVG} className="px-4 py-2 bg-blue-600 text-white rounded">Copy SVG</button>
          <button onClick={copyAsPNG} className="px-4 py-2 bg-green-600 text-white rounded">Copy PNG</button>
          <button onClick={share} className="px-4 py-2 bg-purple-600 text-white rounded">Share</button>
        </div>
      )}

      <div className="text-center text-sm text-gray-600">
        <p>{event.name}</p>
        <p>{event.date} - {event.entranceTime}</p>
      </div>
    </div>
  );
};
```

---

## 2.4 Ticket Form

**File**: `src/components/Tickets/TicketForm.jsx`

```javascript
import { useState } from "react";
import { useTickets } from "../../context/TicketContext";
import { useEvent } from "../../context/EventContext";
import { QRDisplay } from "./QRDisplay";

export const TicketForm = () => {
  const { addTicket } = useTickets();
  const { event } = useEvent();

  const [formData, setFormData] = useState({
    buyerName: "",
    buyerId: "",
    buyerPhone: "",
    ticketType: "",
  });

  const [createdTicket, setCreatedTicket] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ticket = await addTicket(formData);
    setCreatedTicket(ticket);
    setFormData({ buyerName: "", buyerId: "", buyerPhone: "", ticketType: "" });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 font-medium">Buyer Name</label>
          <input
            type="text"
            required
            value={formData.buyerName}
            onChange={(e) => setFormData({...formData, buyerName: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Buyer ID</label>
          <input
            type="text"
            required
            value={formData.buyerId}
            onChange={(e) => setFormData({...formData, buyerId: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Phone</label>
          <input
            type="tel"
            required
            value={formData.buyerPhone}
            onChange={(e) => setFormData({...formData, buyerPhone: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Ticket Type</label>
          <select
            required
            value={formData.ticketType}
            onChange={(e) => setFormData({...formData, ticketType: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">Select type</option>
            {Object.keys(event.ticketTypes).map((type) => (
              <option key={type} value={type}>{type} - ${event.ticketTypes[type]}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Create Ticket
        </button>
      </form>

      {createdTicket && (
        <div className="border p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Ticket Created!</h3>
          <QRDisplay ticket={createdTicket} event={event} />
        </div>
      )}
    </div>
  );
};
```

---

## 2.5 QR Scanner

**File**: `src/components/Scanner/QRScanner.jsx`

```javascript
import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useTickets } from "../../context/TicketContext";
import { parseQRData } from "../../utils/qrGenerator";

export const QRScanner = () => {
  const { tickets, checkInTicket } = useTickets();
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(onScanSuccess);

      return () => scanner.clear();
    }
  }, [isScanning]);

  const onScanSuccess = (decodedText) => {
    const qrData = parseQRData(decodedText);

    if (!qrData) {
      setScanResult({ success: false, message: "Invalid QR code format" });
      return;
    }

    const ticket = tickets.find((t) => t.validationHash === qrData.hash);

    if (!ticket) {
      setScanResult({ success: false, message: "Ticket not found" });
      return;
    }

    if (ticket.checkedIn) {
      setScanResult({
        success: false,
        isDuplicate: true,
        message: `Already checked in at ${ticket.checkInTime}`,
        ticket,
      });
      return;
    }

    checkInTicket(ticket.ticketId);
    setScanResult({ success: true, message: "Check-in successful!", ticket });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => setIsScanning(!isScanning)}
          className={`px-6 py-3 rounded-lg text-white ${isScanning ? 'bg-red-600' : 'bg-blue-600'}`}
        >
          {isScanning ? 'Stop Scanning' : 'Start Scanning'}
        </button>
      </div>

      {isScanning && <div id="qr-reader" className="border rounded-lg overflow-hidden"></div>}

      {scanResult && (
        <div className={`p-6 rounded-lg ${scanResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <h3 className="text-xl font-bold mb-2">{scanResult.success ? '✓ Success' : '✗ Error'}</h3>
          <p>{scanResult.message}</p>
          {scanResult.ticket && (
            <div className="mt-4">
              <p><strong>Buyer:</strong> {scanResult.ticket.buyerName}</p>
              <p><strong>Type:</strong> {scanResult.ticket.ticketType}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

---

## 2.6 Pages

**File**: `src/pages/SellTicketsPage.jsx`

```javascript
import { TicketForm } from "../components/Tickets/TicketForm";

export const SellTicketsPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Sell Tickets</h1>
      <TicketForm />
    </div>
  );
};
```

**File**: `src/pages/ValidateQRPage.jsx`

```javascript
import { QRScanner } from "../components/Scanner/QRScanner";

export const ValidateQRPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Validate QR Code</h1>
      <QRScanner />
    </div>
  );
};
```

---

## 2.7 Update App.jsx

**Add to** `src/App.jsx`:

```javascript
import { TicketProvider } from "./context/TicketContext";
import { SellTicketsPage } from "./pages/SellTicketsPage";
import { ValidateQRPage } from "./pages/ValidateQRPage";

// Update App component:
function App() {
  return (
    <EventProvider>
      <TicketProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create-event" element={<CreateEventPage />} />
              <Route path="/sell-tickets" element={<SellTicketsPage />} />
              <Route path="/validate-qr" element={<ValidateQRPage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TicketProvider>
    </EventProvider>
  );
}
```

---

## Testing Checklist

- [ ] Can create tickets with buyer info
- [ ] Validation hash generates (10 chars)
- [ ] QR code displays after creation
- [ ] Can copy QR as SVG/PNG
- [ ] Can share QR
- [ ] Scanner opens camera
- [ ] Valid tickets check in successfully
- [ ] Duplicate scan shows warning
- [ ] Check-in status updates
- [ ] Data persists in localStorage
