// Public-storefront feature flags.
//
// ONLINE_SALES_OPEN — when false, the public purchase flow (/compra) is closed
// and the landing page directs buyers to the box office ("taquilla") instead of
// showing the "Comprar boleta" button. Tickets are then sold only in person.
// Flip back to true to re-open online sales (no other change needed).
export const ONLINE_SALES_OPEN = false;
