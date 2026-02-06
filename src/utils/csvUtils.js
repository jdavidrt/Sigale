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
