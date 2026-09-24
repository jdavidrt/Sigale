/**
 * Build the QR payload for a ticket. The door scanner matches purely on the
 * validationHash (the server-minted door secret), so the QR encodes ONLY that
 * hash — a short 16-char string. Keeping the payload tiny collapses the QR to a
 * low version with few modules, so it scans reliably. Cross-event protection is
 * handled by the scanner's manifest being event-scoped, not by embedding the
 * event id here.
 */
export const generateQRData = (ticket) => {
  return ticket?.validationHash ?? '';
};

/**
 * Parse a scanned QR string back into { hash }. Accepts the current bare-hash
 * payload; also tolerates a JSON payload ({ id, hash, ... }), pinned by
 * tests/qrGenerator.test.js.
 */
export const parseQRData = (qrString) => {
  if (typeof qrString !== 'string') return null;
  const trimmed = qrString.trim();
  if (!trimmed) return null;

  // JSON payload — pull the hash out of it.
  if (trimmed.startsWith('{')) {
    try {
      const data = JSON.parse(trimmed);
      return data.hash ? { hash: data.hash } : null;
    } catch {
      return null;
    }
  }

  // Current payload: the hash itself.
  return { hash: trimmed };
};
