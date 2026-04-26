/**
 * CSV utility functions for ticket import/export.
 *
 * L4: there are TWO distinct CSV shapes in the app. They are not interchangeable.
 *
 *   1. `ticketsToRoundTripCSV` + `csvToTickets`
 *      - 5 columns: buyerName, buyerId, buyerPhone, ticketType, purchaseDate
 *      - camelCase headers, byte-for-byte round-trippable through the import path
 *      - Use this when you want to export → re-import into another instance
 *
 *   2. `ticketsToHumanCSV` (in this file — see below)
 *      - 6 columns: Buyer Name, Buyer ID, Buyer Phone, Ticket Type, Purchase Date, Ticket Price
 *      - Title-Case headers, includes derived Ticket Price column for reporting
 *      - Opens cleanly in Excel/Sheets; NOT importable back (price is not on ticket)
 *      - Used by the Copy Event Page for human-facing exports
 *
 * Mixing the two shapes breaks round-tripping; keep them separate on purpose.
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
// OWASP CSV-injection guard: Excel/Sheets treat leading =, +, -, @, tab
// and CR as formula prefixes. Prepend a single quote so the cell is
// rendered as literal text.
const FORMULA_PREFIX = /^[=+\-@\t\r]/;
const sanitizeCell = (stringValue) =>
  FORMULA_PREFIX.test(stringValue) ? `'${stringValue}` : stringValue;

// H7: field length caps — must match the `maxLength` on the form inputs so
// CSV import cannot be used as an end-run around UI validation. Values that
// exceed the cap are rejected with an explicit error instead of truncated
// silently, so the operator sees the bad row.
export const CSV_FIELD_LIMITS = {
  buyerName: 100,
  buyerId: 30,
  buyerPhone: 30,
  ticketType: 50,
  purchaseDate: 10,
};

const quoteIfNeeded = (safeValue) => {
  if (safeValue.includes(',') || safeValue.includes('"') || safeValue.includes('\n')) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }
  return safeValue;
};

const formatCell = (raw) => {
  if (raw === null || raw === undefined) return '';
  return quoteIfNeeded(sanitizeCell(String(raw)));
};

/**
 * Round-trip export. Pair with `csvToTickets` for import.
 * 5 columns, camelCase headers; no derived fields.
 */
export const ticketsToRoundTripCSV = (tickets) => {
  const headerRow = CSV_HEADERS.join(',');
  const dataRows = tickets.map(ticket =>
    CSV_HEADERS.map(header => formatCell(ticket[header])).join(',')
  );
  return [headerRow, ...dataRows].join('\n');
};

// Backward-compat alias. `ticketsToCSV` predates the human/round-trip split;
// existing callers + tests still reach for this name, so we keep the export.
export const ticketsToCSV = ticketsToRoundTripCSV;

/**
 * Human-facing export. Title-Case headers, includes derived ticket price so
 * Excel/Sheets reports come out readable. NOT importable — price is derived
 * from event.ticketTypes at export time and isn't stored on tickets. For
 * backup/transfer use `ticketsToRoundTripCSV` instead.
 *
 * @param {Array} tickets - Ticket objects to export
 * @param {Object} event  - Event with `ticketTypes: { [type]: price }` for price lookup
 */
export const ticketsToHumanCSV = (tickets, event) => {
  const headers = ['Buyer Name', 'Buyer ID', 'Buyer Phone', 'Ticket Type', 'Purchase Date', 'Ticket Price'];
  const dataRows = tickets.map(ticket => {
    const price = event?.ticketTypes?.[ticket.ticketType] ?? 0;
    return [
      ticket.buyerName,
      ticket.buyerId,
      ticket.buyerPhone,
      ticket.ticketType,
      ticket.purchaseDate,
      price,
    ].map(formatCell).join(',');
  });
  return [headers.join(','), ...dataRows].join('\n');
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

      // H7: enforce field length limits (matches UI maxLength)
      let overLength = false;
      for (const [field, max] of Object.entries(CSV_FIELD_LIMITS)) {
        if (ticketData[field] && ticketData[field].length > max) {
          errors.push(`Row ${i + 1}: ${field} exceeds ${max} characters`);
          overLength = true;
          break;
        }
      }
      if (overLength) continue;

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
