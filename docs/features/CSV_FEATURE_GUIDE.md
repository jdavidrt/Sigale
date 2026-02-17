# CSV Import/Export Feature - Implementation Guide

## Overview

Add CSV copy/paste functionality to the TicketsPage for exporting ticket data to spreadsheets and importing NEW tickets from CSV text.

---

## Feature Scope

### Export (Copy CSV)
- Convert all visible tickets to CSV format (5 columns)
- Copy to clipboard with one click
- Respects current search/filter state

### Import (Paste CSV)
- Parse pasted CSV text
- **Add NEW tickets only** (generates new `ticketId` + `validationHash`)
- Does NOT update existing tickets (preserves QR code integrity)

---

## CSV Format

### Columns (in order)
```csv
buyerName,buyerId,buyerPhone,ticketType,purchaseDate
```

### Example
```csv
buyerName,buyerId,buyerPhone,ticketType,purchaseDate
Juan Perez,CC12345678,3001234567,preventa,2025-01-15
Maria Garcia,CC87654321,,vip,2025-01-16
Carlos Lopez,CC11111111,3005551234,general,2025-01-17
```

### Field Rules
| Field | Required | Format | Default |
|-------|----------|--------|---------|
| `buyerName` | Yes | String | - |
| `buyerId` | Yes | String | - |
| `buyerPhone` | No | String | `"000"` |
| `ticketType` | Yes | String | - |
| `purchaseDate` | Yes | `YYYY-MM-DD` | - |

**Note:** `ticketType` must match one of the event's configured ticket types.

### What Gets Auto-Generated on Import
| Field | How It's Generated |
|-------|-------------------|
| `ticketId` | `TKT-XXX-timestamp` via `generateTicketId()` |
| `validationHash` | SHA-256 hash via `generateValidationHash()` |
| `checkedIn` | Always `false` for new tickets |
| `checkInTime` | Always `null` for new tickets |

---

## Implementation Plan

### Phase 1: Create CSV Utility Functions

**File: `src/utils/csvUtils.js`**

```javascript
/**
 * CSV utility functions for ticket import/export
 * Export: 5 columns (buyerName, buyerId, buyerPhone, ticketType, purchaseDate)
 * Import: Creates NEW tickets only (no updates to existing tickets)
 */

const CSV_HEADERS = [
  'buyerName',
  'buyerId',
  'buyerPhone',
  'ticketType',
  'purchaseDate'
];

/**
 * Convert tickets array to CSV string
 * @param {Array} tickets - Array of ticket objects
 * @returns {string} CSV formatted string
 */
export const ticketsToCSV = (tickets) => {
  const headerRow = CSV_HEADERS.join(',');

  const dataRows = tickets.map(ticket => {
    return CSV_HEADERS.map(header => {
      const value = ticket[header];

      // Handle null/undefined
      if (value === null || value === undefined) return '';

      // Handle strings with commas or quotes (escape them)
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
};

/**
 * Parse CSV string to new ticket data objects
 * @param {string} csvString - CSV formatted string
 * @returns {{ tickets: Array, errors: Array }} Parsed ticket data and any errors
 */
export const csvToTickets = (csvString) => {
  const lines = csvString.trim().split('\n');
  const errors = [];
  const tickets = [];

  if (lines.length < 2) {
    return { tickets: [], errors: ['CSV must have header row and at least one data row'] };
  }

  // Validate header
  const headerLine = lines[0].toLowerCase().trim();
  const expectedHeader = CSV_HEADERS.join(',').toLowerCase();

  if (headerLine !== expectedHeader) {
    errors.push(`Invalid header. Expected: ${CSV_HEADERS.join(',')}`);
    return { tickets: [], errors };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    try {
      const values = parseCSVLine(line);

      if (values.length !== CSV_HEADERS.length) {
        errors.push(`Row ${i + 1}: Expected ${CSV_HEADERS.length} columns, got ${values.length}`);
        continue;
      }

      const ticketData = {
        buyerName: values[0].trim(),
        buyerId: values[1].trim(),
        buyerPhone: values[2].trim() || '000', // Default to "000" if empty
        ticketType: values[3].trim(),
        purchaseDate: values[4].trim()
      };

      // Validate required fields (buyerPhone is optional)
      if (!ticketData.buyerName) {
        errors.push(`Row ${i + 1}: buyerName is required`);
        continue;
      }
      if (!ticketData.buyerId) {
        errors.push(`Row ${i + 1}: buyerId is required`);
        continue;
      }
      if (!ticketData.ticketType) {
        errors.push(`Row ${i + 1}: ticketType is required`);
        continue;
      }
      if (!ticketData.purchaseDate) {
        errors.push(`Row ${i + 1}: purchaseDate is required`);
        continue;
      }

      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ticketData.purchaseDate)) {
        errors.push(`Row ${i + 1}: purchaseDate must be YYYY-MM-DD format`);
        continue;
      }

      tickets.push(ticketData);
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err.message}`);
    }
  }

  return { tickets, errors };
};

/**
 * Parse a single CSV line, handling quoted fields
 * @param {string} line - Single CSV line
 * @returns {Array<string>} Array of field values
 */
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }

  result.push(current); // Add last field
  return result;
};

/**
 * Validate ticket type against event's ticket types
 * @param {string} ticketType - Type to validate
 * @param {Object} eventTicketTypes - Event's ticket types object
 * @returns {boolean} True if valid
 */
export const isValidTicketType = (ticketType, eventTicketTypes) => {
  return Object.keys(eventTicketTypes || {}).includes(ticketType);
};
```

---

### Phase 2: Extend TicketContext

**File: `src/context/TicketContext.jsx`**

Add a new function to create multiple tickets from CSV data. The existing `addTicket` function can be reused, but a batch function is more efficient:

```javascript
// Add inside TicketProvider component (after existing functions)

/**
 * Import NEW tickets from CSV data
 * - Creates new tickets only (does NOT update existing)
 * - Generates new ticketId and validationHash for each
 * - All imported tickets start with checkedIn: false
 */
const addTicketsFromCSV = async (ticketDataArray) => {
  const results = { added: 0, errors: [] };
  const newTickets = [];

  for (const ticketData of ticketDataArray) {
    try {
      const ticketId = generateTicketId();
      const ticket = {
        ticketId,
        buyerName: ticketData.buyerName,
        buyerId: ticketData.buyerId,
        buyerPhone: ticketData.buyerPhone,
        ticketType: ticketData.ticketType,
        purchaseDate: ticketData.purchaseDate,
        checkedIn: false,
        checkInTime: null,
      };

      ticket.validationHash = await generateValidationHash(ticket);
      newTickets.push(ticket);
      results.added++;
    } catch (err) {
      results.errors.push(`${ticketData.buyerName}: ${err.message}`);
    }
  }

  // Batch update: add all new tickets at once
  setData({ ...data, tickets: [...data.tickets, ...newTickets] });
  return results;
};

// Add to context value
return (
  <TicketContext.Provider
    value={{
      // ... existing values
      addTicketsFromCSV,
    }}
  >
    {children}
  </TicketContext.Provider>
);
```

**Key Points:**
- Uses existing `generateTicketId()` and `generateValidationHash()` functions
- All imported tickets start as `checkedIn: false`
- Batch updates localStorage once (not per ticket) for performance
- Existing tickets remain completely untouched

---

### Phase 3: Add Translations

**File: `src/utils/translations.js`**

Add these keys to both language objects:

```javascript
// Spanish (add to 'es' object)
csvExport: "Exportar CSV",
csvImport: "Importar CSV",
csvImportNewTickets: "Importar Nuevas Boletas",
csvCopied: "CSV copiado al portapapeles",
csvPasteHere: "Pegar CSV aquí...",
csvImportButton: "Importar",
csvImportSuccess: "Importación exitosa",
csvTicketsAdded: "boletas agregadas",
csvImportErrors: "Errores de importación",

// English (add to 'en' object)
csvExport: "Export CSV",
csvImport: "Import CSV",
csvImportNewTickets: "Import New Tickets",
csvCopied: "CSV copied to clipboard",
csvPasteHere: "Paste CSV here...",
csvImportButton: "Import",
csvImportSuccess: "Import successful",
csvTicketsAdded: "tickets added",
csvImportErrors: "Import errors",
```

---

### Phase 4: Create CSVPanel Component

**File: `src/components/Tickets/CSVPanel.jsx`**

```jsx
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileExport,
  faFileImport,
  faCopy,
  faCheck,
  faXmark,
  faTriangleExclamation
} from "@fortawesome/free-solid-svg-icons";
import { useEvent } from "../../context/EventContext";
import { useTickets } from "../../context/TicketContext";
import { useLanguage } from "../../context/LanguageContext";
import { ticketsToCSV, csvToTickets, isValidTicketType } from "../../utils/csvUtils";

export const CSVPanel = ({ filteredTickets }) => {
  const { event } = useEvent();
  const { addTicketsFromCSV } = useTickets();
  const { t } = useLanguage();

  const [mode, setMode] = useState(null); // null | 'export' | 'import'
  const [csvText, setCsvText] = useState("");
  const [copied, setCopied] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [parseErrors, setParseErrors] = useState([]);

  const handleExport = () => {
    const csv = ticketsToCSV(filteredTickets);
    setCsvText(csv);
    setMode('export');
    setResult(null);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(csvText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleImportMode = () => {
    setCsvText("");
    setMode('import');
    setResult(null);
    setParseErrors([]);
  };

  const validateAndParseCSV = () => {
    const { tickets, errors } = csvToTickets(csvText);

    // Validate ticket types against event configuration
    const typeErrors = [];
    const validTickets = tickets.filter(ticket => {
      if (!isValidTicketType(ticket.ticketType, event.ticketTypes)) {
        typeErrors.push(`${ticket.buyerName}: Invalid ticket type "${ticket.ticketType}"`);
        return false;
      }
      return true;
    });

    setParseErrors([...errors, ...typeErrors]);

    // Only return valid tickets if there are no parsing errors
    if (errors.length === 0 && validTickets.length > 0) {
      return validTickets;
    }
    return null;
  };

  const handleImport = async () => {
    const validTickets = validateAndParseCSV();

    if (!validTickets || validTickets.length === 0) {
      return;
    }

    setImporting(true);
    try {
      const importResult = await addTicketsFromCSV(validTickets);
      setResult(importResult);
      setCsvText("");
    } catch (err) {
      setParseErrors([err.message]);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setMode(null);
    setCsvText("");
    setResult(null);
    setParseErrors([]);
  };

  // Button styles following STYLE_GUIDE.md
  const buttonStyle = {
    padding: '8px 16px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #758BFD, #BEADFF)',
    border: 'none',
    color: 'rgba(0, 0, 0, 0.75)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: 'rgba(117, 139, 253, 0.1)',
    border: '1px solid rgba(117, 139, 253, 0.3)',
    color: '#758BFD'
  };

  if (mode === null) {
    return (
      <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
        <button
          onClick={handleExport}
          style={buttonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <FontAwesomeIcon icon={faFileExport} />
          {t("csvExport")}
        </button>
        <button
          onClick={handleImportMode}
          style={secondaryButtonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <FontAwesomeIcon icon={faFileImport} />
          {t("csvImport")}
        </button>
      </div>
    );
  }

  return (
    <div
      className="glass-elevated"
      style={{
        borderRadius: '16px',
        padding: '12px',
        marginBottom: '6px'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 className="text-heading" style={{ fontSize: '18px', margin: 0 }}>
          {mode === 'export' ? t("csvExport") : t("csvImportNewTickets")}
        </h3>
        <button
          onClick={handleClose}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      {/* CSV Textarea */}
      <textarea
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        placeholder={mode === 'import' ? t("csvPasteHere") : ''}
        readOnly={mode === 'export'}
        style={{
          width: '100%',
          minHeight: '120px',
          padding: '12px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(117, 139, 253, 0.15)',
          color: '#E2D1B9',
          fontSize: '12px',
          fontFamily: 'monospace',
          resize: 'vertical',
          marginBottom: '8px'
        }}
      />

      {/* Errors */}
      {parseErrors.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '8px 12px',
          marginBottom: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <FontAwesomeIcon icon={faTriangleExclamation} style={{ color: '#ef4444' }} />
            <span style={{ color: '#ef4444', fontWeight: '600' }}>{t("csvImportErrors")}</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#ef4444', fontSize: '12px' }}>
            {parseErrors.slice(0, 5).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
            {parseErrors.length > 5 && (
              <li>...and {parseErrors.length - 5} more</li>
            )}
          </ul>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div style={{
          background: 'rgba(74, 222, 128, 0.1)',
          border: '1px solid rgba(74, 222, 128, 0.3)',
          borderRadius: '12px',
          padding: '8px 12px',
          marginBottom: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FontAwesomeIcon icon={faCheck} style={{ color: '#4ade80' }} />
            <span style={{ color: '#4ade80', fontWeight: '600' }}>{t("csvImportSuccess")}</span>
          </div>
          <p style={{ margin: '4px 0 0', color: '#4ade80', fontSize: '14px' }}>
            {result.added} {t("csvTicketsAdded")}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        {mode === 'export' && (
          <button
            onClick={handleCopyToClipboard}
            style={{
              ...buttonStyle,
              background: copied
                ? 'linear-gradient(135deg, #4ade80, #22c55e)'
                : 'linear-gradient(135deg, #758BFD, #BEADFF)'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
            {copied ? t("csvCopied") : t("csvExport")}
          </button>
        )}

        {mode === 'import' && (
          <button
            onClick={handleImport}
            disabled={importing || !csvText.trim()}
            style={{
              ...buttonStyle,
              opacity: (importing || !csvText.trim()) ? 0.5 : 1,
              cursor: (importing || !csvText.trim()) ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!importing && csvText.trim()) {
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <FontAwesomeIcon icon={faFileImport} />
            {importing ? '...' : t("csvImportButton")}
          </button>
        )}
      </div>
    </div>
  );
};
```

---

### Phase 5: Integrate into TicketsPage

**File: `src/pages/TicketsPage.jsx`**

Add the CSVPanel component:

```jsx
// Add import at top
import { CSVPanel } from "../components/Tickets/CSVPanel";

// Add inside the return, after the filters section and before the tickets grid
<CSVPanel filteredTickets={filteredTickets} />
```

---

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `src/utils/csvUtils.js` | **CREATE** | CSV parsing/serialization (5 columns) |
| `src/context/TicketContext.jsx` | **MODIFY** | Add `addTicketsFromCSV` function |
| `src/utils/translations.js` | **MODIFY** | Add 9 CSV-related translation keys |
| `src/components/Tickets/CSVPanel.jsx` | **CREATE** | CSV export/import UI panel |
| `src/pages/TicketsPage.jsx` | **MODIFY** | Import and render CSVPanel |

---

## How QR Codes Stay Intact

### The Problem
If we allowed updating existing tickets, a trailing space like `"Aleja "` → `"Aleja"` would change the hash, invalidating the printed QR code.

### The Solution
**Import creates NEW tickets only.** Existing tickets are never modified.

| Operation | Existing Tickets | New Tickets |
|-----------|------------------|-------------|
| Export CSV | Read-only (copied) | - |
| Import CSV | Untouched | Created with new ID + hash |

This guarantees that any already-printed QR codes remain valid.

---

## Security Considerations

1. **Ticket Type Validation**: Only allow ticket types that exist in the current event's `ticketTypes` object

2. **Required Field Validation**: `buyerName`, `buyerId`, `ticketType`, `purchaseDate` are mandatory; only `buyerPhone` defaults to `"000"`

3. **Data Sanitization**: CSV parsing handles quoted fields, commas, and edge cases

4. **No Direct Storage**: CSV is processed through the context, maintaining localStorage consistency

---

## Testing Checklist

- [ ] Export all tickets to CSV (5 columns)
- [ ] Export filtered tickets to CSV
- [ ] Copy CSV to clipboard
- [ ] Import new tickets from valid CSV
- [ ] Verify new tickets have unique `ticketId` and `validationHash`
- [ ] Verify existing tickets remain unchanged after import
- [ ] Reject rows with missing required fields
- [ ] Reject rows with invalid ticket types
- [ ] Handle malformed CSV gracefully (show errors)
- [ ] `buyerPhone` defaults to "000" when empty
- [ ] Bilingual translations work (ES/EN)
- [ ] Mobile touch targets meet 44x44px minimum

---

## Future Enhancements

1. **File Upload**: Accept `.csv` file drag-and-drop
2. **Preview Before Import**: Show parsed data before confirming
3. **Undo Import**: Rollback last import operation
