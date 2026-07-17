import { formatTo12Hour, parseLocalDate, formatCurrency } from './timeFormat';
import { cleanBase64 } from './base64Cleaner';

/* ============================================================
   ASTROMELIAS · "Editorial" premium ticket
   Renders the approved mockup as an export-safe SVG:
   flyer hero on top, dark stub below with QR + details.
   Everything is self-contained (embedded image + fonts) so the
   SVG rasterises identically wherever it's shared.
   ============================================================ */

/* ── Flyer artwork (embedded as base64, like Charly was) ──────
   Call once at startup with the event flyer. You can also pass a
   ready data-URL per ticket via opts.flyerDataURL (takes priority). */
let flyerImage = null;
export const loadFlyerImage = (base64Data) => {
  try { flyerImage = cleanBase64(base64Data); }
  catch (e) { console.error('Failed to load flyer image:', e); flyerImage = null; }
};

/* ── Embedded fonts ───────────────────────────────────────────
   The SVG falls back to serif / sans-serif system fonts so it
   still renders when rasterised to a PNG. Font embedding was never
   wired up, so this stays empty. */
const FONT_FACE_CSS = '';

/* ── Palette (Astromelias tokens) ─────────────────────────── */
const C = {
  black: '#09060A', cream: '#F3E8D6',
  creamDim: 'rgba(243,232,214,0.62)', creamFaint: 'rgba(243,232,214,0.34)',
  gold: '#E7AE3F', tile: '#FBF6EC', hair: 'rgba(243,232,214,0.13)',
  perf: 'rgba(231,174,63,0.45)',
};
const SANS = "'Barlow Semi Condensed', -apple-system, 'Segoe UI', sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

/* Split long text into N lines that fit a character budget. */
const splitTextIntoLines = (text, maxChars) => {
  const t = (text || '').trim();
  if (t.length <= maxChars) return [t];
  const words = t.split(' ');
  const lines = []; let cur = '';
  words.forEach((w) => {
    const test = cur ? `${cur} ${w}` : w;
    if (test.length <= maxChars) cur = test;
    else { if (cur) lines.push(cur); cur = w; }
  });
  if (cur) lines.push(cur);
  return lines;
};

/**
 * Generate the Editorial ticket SVG.
 * @param {Object} ticket  buyer + ticket info  (buyerName, ticketType, ticketId)
 * @param {Object} event   event info           (name, venue, address, date, entranceTime, ticketTypes, flyerImageUrl?)
 * @param {string|null} qrDataURL  QR code as a data URL (ignored when opts.guest is set)
 * @param {Object} [opts]   { flyerDataURL?: string, guest?: { typeLabel: string, band: string } }
 *                          guest passes render a type badge instead of the QR,
 *                          the type label instead of the price, and no pola line
 * @returns {string} SVG markup
 */
export const generateTicketSVG = (ticket, event, qrDataURL, opts = {}) => {
  /* ── data ─────────────────────────────────────────────── */
  const guest = opts.guest || null;
  const price = guest ? 0 : (event.ticketTypes?.[ticket.ticketType] || 0);
  const dateStr = parseLocalDate(event.date)
    .toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    .replace(/[.,]/g, '').toUpperCase();             // "VIE 24 JUL 2026"
  const timeStr = formatTo12Hour(event.entranceTime); // "5:00 PM"

  const holderLines = splitTextIntoLines((ticket.buyerName || '').split(' ')[0], 16).slice(0, 2);
  const venueLines  = splitTextIntoLines(event.venue || '', 18).slice(0, 2);

  const flyerHref = opts.flyerDataURL
    || (flyerImage ? `data:image/jpeg;base64,${flyerImage}` : null);

  /* ── geometry (matches the approved mockup at 384px wide) ─ */
  const W = 384, pX = 28, R = 18, rn = 14;
  const heroH = 430;                 // big flyer hero
  const qrSize = 112, tilePad = 10, tileS = qrSize + tilePad * 2;
  const tileX = pX, tileY = heroH + 92;
  const detailsX = tileX + tileS + 16;

  const fechaLabelY = heroH + 32, dateY = heroH + 52;
  const priceY = heroH + 58;
  const puertasY = heroH + 86;
  const footerDivY = tileY + tileS + 22;
  const footerTextY = footerDivY + 20;
  const polaY = footerTextY + 20;
  const H = guest ? footerTextY + 18 : polaY + 18;

  /* ── small text helpers ───────────────────────────────── */
  const label = (x, y, text, anchor = 'start') =>
    `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${SANS}" font-size="9.5" font-weight="700" letter-spacing="2.2" fill="${C.creamFaint}">${escapeXml(text)}</text>`;
  const value = (x, y, text, opt = {}) =>
    `<text x="${x}" y="${y}" text-anchor="${opt.anchor || 'start'}" font-family="${opt.serif ? SERIF : SANS}" font-size="${opt.size || 16}" font-weight="${opt.weight || 600}" letter-spacing="${opt.track ?? 0.4}" fill="${opt.fill || C.cream}">${escapeXml(text)}</text>`;

  /* ── details column beside the QR ─────────────────────── */
  let dy = tileY + 18;
  let details = label(detailsX, dy, 'ASISTENTE');
  dy += 24;
  holderLines.forEach((ln) => { details += value(detailsX, dy, ln, { serif: true, size: 21, weight: 400 }); dy += 25; });
  dy += 8;
  details += label(detailsX, dy, 'LUGAR'); dy += 18;
  venueLines.forEach((ln) => { details += value(detailsX, dy, ln, { size: 15 }); dy += 18; });
  details += value(detailsX, dy, event.address || '', { size: 13, fill: C.creamDim });

  /* ── guest badge (replaces the QR inside the tile) ────── */
  let guestBadge = '';
  if (guest) {
    const cx = tileX + tileS / 2;
    const bandLines = splitTextIntoLines(guest.band || '', 16).slice(0, 2);
    const by = tileY + tileS / 2 - (bandLines.length > 1 ? 14 : 6);
    guestBadge =
      `<text x="${cx}" y="${by}" text-anchor="middle" font-family="${SERIF}" font-size="21" font-weight="400" letter-spacing="1.2" fill="${C.black}">${escapeXml((guest.typeLabel || '').toUpperCase())}</text>` +
      `<line x1="${cx - 34}" y1="${by + 9}" x2="${cx + 34}" y2="${by + 9}" stroke="${C.gold}" stroke-width="1.5"/>`;
    let ly = by + 26;
    bandLines.forEach((ln) => {
      guestBadge += `<text x="${cx}" y="${ly}" text-anchor="middle" font-family="${SANS}" font-size="11" font-weight="700" letter-spacing="1.4" fill="${C.black}" opacity="0.75">${escapeXml(ln.toUpperCase())}</text>`;
      ly += 14;
    });
  }

  /* ── assemble ─────────────────────────────────────────── */
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <style>${FONT_FACE_CSS}</style>
    <linearGradient id="heroFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.black}" stop-opacity="0"/>
      <stop offset="1" stop-color="${C.black}" stop-opacity="0.94"/>
    </linearGradient>
    <!-- ticket silhouette: rounded card minus the two side notches -->
    <mask id="ticketShape">
      <rect x="0" y="0" width="${W}" height="${H}" rx="${R}" ry="${R}" fill="#fff"/>
      <circle cx="0" cy="${heroH}" r="${rn}" fill="#000"/>
      <circle cx="${W}" cy="${heroH}" r="${rn}" fill="#000"/>
    </mask>
  </defs>

  <g mask="url(#ticketShape)">
    <rect x="0" y="0" width="${W}" height="${H}" fill="${C.black}"/>
    ${flyerHref ? `<image x="0" y="0" width="${W}" height="${heroH}" href="${flyerHref}" xlink:href="${flyerHref}" preserveAspectRatio="xMidYMin slice"/>` : ''}
    <rect x="0" y="${heroH - 110}" width="${W}" height="110" fill="url(#heroFade)"/>
    <rect x="0" y="${heroH}" width="${W}" height="${H - heroH}" fill="${C.black}"/>

    <!-- perforation -->
    <line x1="${pX - 2}" y1="${heroH}" x2="${W - pX + 2}" y2="${heroH}" stroke="${C.perf}" stroke-width="1.5" stroke-dasharray="0 0 5 5"/>

    <!-- date / stage + price -->
    ${label(pX, fechaLabelY, 'FECHA')}
    ${value(pX, dateY, dateStr, { size: 16, track: 0.6 })}
    ${label(W - pX, fechaLabelY, ticket.ticketType?.toUpperCase() || '', 'end')}
    ${value(W - pX, priceY, guest ? guest.typeLabel : formatCurrency(price), { serif: true, size: 30, weight: 400, fill: C.gold, anchor: 'end' })}

    <!-- entrance time -->
    <text x="${pX}" y="${puertasY}" font-family="${SANS}" font-size="13.5" font-weight="700" letter-spacing="2.4" fill="${C.creamFaint}">PUERTAS<tspan font-weight="600" letter-spacing="0.6" fill="${C.cream}" dx="8">${escapeXml(timeStr)}</tspan></text>

    <!-- QR tile (or the guest type badge — guest passes have no QR by design) -->
    <rect x="${tileX}" y="${tileY}" width="${tileS}" height="${tileS}" rx="12" ry="12" fill="${C.tile}"/>
    ${guest ? guestBadge : `<image x="${tileX + tilePad}" y="${tileY + tilePad}" width="${qrSize}" height="${qrSize}" href="${qrDataURL}" xlink:href="${qrDataURL}" preserveAspectRatio="xMidYMid meet"/>`}

    <!-- details -->
    ${details}

    <!-- footer -->
    <line x1="${pX}" y1="${footerDivY}" x2="${W - pX}" y2="${footerDivY}" stroke="${C.hair}" stroke-width="1"/>
    <text x="${pX}" y="${footerTextY}" font-family="ui-monospace, 'Courier New', monospace" font-size="11" letter-spacing="1" fill="${C.creamDim}">${escapeXml(ticket.ticketId || '')}</text>
    <text x="${W - pX}" y="${footerTextY}" text-anchor="end" font-family="ui-monospace, 'Courier New', monospace" font-size="12" font-weight="700" letter-spacing="1" fill="${C.gold}">#${escapeXml(ticket.folio || ticket.ticketId || '')}</text>
    ${guest ? '' : `<text x="${W / 2}" y="${polaY}" text-anchor="middle" font-family="${SANS}" font-size="12" font-weight="700" letter-spacing="1.5" fill="${C.gold}">✦ TODA ENTRADA INCLUYE POLA ✦</text>`}
  </g>
</svg>`;

  return assertSafeSvg(svg);
};

/* ============================================================
   Safety helpers (unchanged from the original generator)
   ============================================================ */
export const escapeXml = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
};

const DANGEROUS_SVG_PATTERNS = [
  /<script\b/i, /<iframe\b/i, /<foreignObject\b/i,
  /\son\w+\s*=/i,
  /\shref\s*=\s*["']?\s*javascript:/i,
  /\sxlink:href\s*=\s*["']?\s*javascript:/i,
];

export const assertSafeSvg = (svg) => {
  for (const pattern of DANGEROUS_SVG_PATTERNS) {
    if (pattern.test(svg)) {
      const message = `Unsafe SVG detected (matched ${pattern}). Check that every interpolated string passes through escapeXml().`;
      if (typeof import.meta !== 'undefined' && import.meta?.env?.DEV) throw new Error(message);
      console.error(message);
      return svg.replace(pattern, '');
    }
  }
  return svg;
};
