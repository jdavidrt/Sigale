/**
 * Generate QR code data string from ticket and event information
 * @param {Object} ticket - Ticket object with all buyer and ticket details
 * @param {Object} event - Event object with event details
 * @returns {string} JSON string to encode in QR code
 */
export const generateQRData = (ticket, event) => {
  return JSON.stringify({
    ticketId: ticket.ticketId,
    hash: ticket.validationHash,
    buyer: ticket.buyerName,
    phone: ticket.buyerPhone,
    type: ticket.ticketType,
    event: event.name,
    date: event.date,
    venue: event.venue,
    time: event.entranceTime,
  });
};

/**
 * Parse QR code data string back into object
 * @param {string} qrString - JSON string from scanned QR code
 * @returns {Object|null} Parsed QR data object or null if invalid
 */
export const parseQRData = (qrString) => {
  try {
    const data = JSON.parse(qrString);

    // Validate required fields
    if (!data.ticketId || !data.hash) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error parsing QR data:", error);
    return null;
  }
};
