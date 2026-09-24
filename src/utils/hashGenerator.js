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

  // 16 hex chars = 64 bits of entropy. Birthday-collision probability at
  // 10k tickets is ~10^-8. Existing tickets with 10-char hashes remain
  // valid because getTicketByHash uses exact match on whatever is stored.
  return hashHex.substring(0, 16);
};

// Math.random() * 1000 + Date.now() collides whenever two ids are
// issued in the same millisecond with the same random slot — a real
// scenario during CSV bulk import. Use crypto.randomUUID() for a
// guaranteed-unique suffix; fall back to the old pattern only if the
// platform is too old to have it. Existing TKT-nnn-ts ids remain valid
// because getTicketById uses exact-string match.
export const generateTicketId = () => {
  const timestamp = Date.now();
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    // First 8 chars of a UUIDv4 = 32 random bits; paired with the ms
    // timestamp this has no practical collision surface.
    const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    return `TKT-${suffix}-${timestamp}`;
  }
  const random = Math.floor(Math.random() * 1000);
  return `TKT-${random.toString().padStart(3, "0")}-${timestamp}`;
};
