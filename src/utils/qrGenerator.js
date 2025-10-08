/**
 * Generate QR code data string from ticket and event information
 * @param {Object} ticket - Ticket object with all buyer and ticket details
 * @param {Object} event - Event object with event details
 * @returns {string} JSON string to encode in QR code
 */
export const generateQRData = (ticket, event) => {
  return JSON.stringify({
    id: ticket.ticketId,
    hash: ticket.validationHash,
    buyer: ticket.buyerName,
    type: ticket.ticketType,
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
    if (!data.id || !data.hash) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error parsing QR data:", error);
    return null;
  }
};
