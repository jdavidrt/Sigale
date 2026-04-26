/**
 * Build a stable identifier for the currently-loaded event. We hash the
 * event name + date because events don't have a server-assigned id.
 * First 8 hex chars = 32 bits, enough for this scope (distinguishing
 * between a handful of events ever loaded on one device).
 */
export const computeEventId = async (event) => {
  if (!event || !event.name || !event.date) return null;
  const input = `${event.name}|${event.date}`;
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 8);
};

/**
 * Generate QR code data string from ticket and event information.
 * Includes an eventId (audit M1) so a ticket from Event A scanned at
 * Event B can be rejected at the scanner.
 */
export const generateQRData = (ticket, event, eventId = null) => {
  return JSON.stringify({
    id: ticket.ticketId,
    hash: ticket.validationHash,
    buyer: ticket.buyerName,
    type: ticket.ticketType,
    eventId: eventId ?? null,
  });
};

/**
 * Parse QR code data string back into object
 */
export const parseQRData = (qrString) => {
  try {
    const data = JSON.parse(qrString);
    if (!data.id || !data.hash) return null;
    return data;
  } catch (error) {
    console.error("Error parsing QR data:", error);
    return null;
  }
};
