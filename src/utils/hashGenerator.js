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

  return hashHex.substring(0, 10);
};

export const generateTicketId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `TKT-${random.toString().padStart(3, "0")}-${timestamp}`;
};
