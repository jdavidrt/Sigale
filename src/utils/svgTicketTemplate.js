import { formatTo12Hour } from './timeFormat';

/**
 * Generate a ticket SVG using the template design
 * @param {Object} ticket - Ticket object with buyer information
 * @param {Object} event - Event object with event details
 * @param {string} qrDataURL - QR code as data URL
 * @returns {string} SVG string
 */
export const generateTicketSVG = (ticket, event, qrDataURL) => {
  // Get ticket price from event.ticketTypes
  const ticketPrice = event.ticketTypes[ticket.ticketType] || 0;

  // Format date and time
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = formatTo12Hour(event.entranceTime);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg id="Capa_1" data-name="Capa 1" xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 300 500">
  <defs>
    <style>
      .cls-1 {
        fill: #fff;
      }
      .cls-1, .cls-2 {
        stroke-width: 2px;
      }
      .cls-1, .cls-2, .cls-3 {
        stroke: #000;
      }
      .cls-4 {
        font-size: 16.9px;
      }
      .cls-4, .cls-5, .cls-6, .cls-7, .cls-8, .cls-9 {
        fill: #000;
      }
      .cls-4, .cls-5, .cls-6, .cls-7, .cls-8, .cls-9, .cls-10 {
        isolation: isolate;
      }
      .cls-4, .cls-5, .cls-7, .cls-8, .cls-9 {
        font-family: Georgia-Bold, Georgia;
        font-weight: 700;
      }
      .cls-5 {
        font-size: 14.5px;
      }
      .cls-11 {
        stroke-width: 0px;
      }
      .cls-11, .cls-2, .cls-3 {
        fill: none;
      }
      .cls-6 {
        font-family: Consolas, Consolas;
      }
      .cls-6, .cls-7 {
        font-size: 10px;
      }
      .cls-12 {
        clip-path: url(#clippath);
      }
      .cls-3 {
        stroke-dasharray: 0 0 5 5;
        stroke-width: 1.5px;
      }
      .cls-8 {
        font-size: 28.5px;
      }
      .cls-9 {
        font-size: 16.3px;
      }
      .cls-10 {
        fill: #999;
        font-family: Georgia, Georgia;
        font-size: 16px;
      }
    </style>
    <clipPath id="clippath">
      <path class="cls-11" d="M0,0h20c0,6.7,3.3,10,10,10s10-3.3,10-10h20c0,6.7,3.3,10,10,10s10-3.3,10-10h20c0,6.7,3.3,10,10,10s10-3.3,10-10h20c0,6.7,3.3,10,10,10s10-3.3,10-10h20c0,6.7,3.3,10,10,10s10-3.3,10-10h20c0,6.7,3.3,10,10,10s10-3.3,10-10h20c0,6.7,3.3,10,10,10s10-3.3,10-10h20v290c-6.7,0-10,3.3-10,10s3.3,10,10,10v190h-20c0-6.7-3.3-10-10-10s-10,3.3-10,10h-20c0-6.7-3.3-10-10-10s-10,3.3-10,10h-20c0-6.7-3.3-10-10-10s-10,3.3-10,10h-20c0-6.7-3.3-10-10-10s-10,3.3-10,10h-20c0-6.7-3.3-10-10-10s-10,3.3-10,10h-20c0-6.7-3.3-10-10-10s-10,3.3-10,10h-20c0-6.7-3.3-10-10-10s-10,3.3-10,10H0v-190c6.7,0,10-3.3,10-10s-3.3-10-10-10V0Z"/>
    </clipPath>
  </defs>
  <rect class="cls-11" width="300" height="500"/>
  <g class="cls-12">
    <g>
      <rect class="cls-1" width="300" height="500"/>
      <rect class="cls-1" x="50" y="50" width="200" height="200" rx="5" ry="5"/>

      <!-- Embedded QR Code -->
      <image x="50" y="50" width="200" height="200" href="${qrDataURL}" preserveAspectRatio="xMidYMid meet"/>

      <line class="cls-3" x1="20" y1="300" x2="280" y2="300"/>
      <g id="eventDetails">
        <text class="cls-8" text-anchor="middle" transform="translate(150 348.8)"><tspan x="0" y="0">${escapeXml(event.name.toUpperCase())}</tspan></text>
        <text class="cls-9" text-anchor="middle" transform="translate(150 372.9) scale(1 1)"><tspan x="0" y="0">${escapeXml(event.venue.toUpperCase())}</tspan></text>
        <text class="cls-5" text-anchor="middle" transform="translate(150 397.3)"><tspan x="0" y="0">${formattedDate}, ${formattedTime}</tspan></text>
        <text class="cls-7" text-anchor="middle" transform="translate(150 418.4)"><tspan x="0" y="0">${escapeXml(ticket.ticketType.toUpperCase())}, $${ticketPrice.toLocaleString()}</tspan></text>
        <text class="cls-4" text-anchor="middle" transform="translate(150 449.1)"><tspan x="0" y="0">${escapeXml(ticket.buyerName.toUpperCase())}</tspan></text>
        <text class="cls-6" text-anchor="middle" transform="translate(150 473.3)"><tspan x="0" y="0">${ticket.ticketId}</tspan></text>
      </g>
    </g>
  </g>
  <path class="cls-2" d="M0,0h20c0,6.7,3.3,10,10,10s10-3.3,10-10h20c0,6.7,3.3,10,10,10s10-3.3,10-10h20c0,6.7,3.3,10,10,10s10-3.3,10-10h20c0,6.7,3.3,10,10,10s10-3.3,10-10h20c0,6.7,3.3,10,10,10s10-3.3,10-10h20c0,6.7,3.3,10,10,10s10-3.3,10-10h20c0,6.7,3.3,10,10,10s10-3.3,10-10h20v290c-6.7,0-10,3.3-10,10s3.3,10,10,10v190h-20c0-6.7-3.3-10-10-10s-10,3.3-10,10h-20c0-6.7-3.3-10-10-10s-10,3.3-10,10h-20c0-6.7-3.3-10-10-10s-10,3.3-10,10h-20c0-6.7-3.3-10-10-10s-10,3.3-10,10h-20c0-6.7-3.3-10-10-10s-10,3.3-10,10h-20c0-6.7-3.3-10-10-10s-10,3.3-10,10h-20c0-6.7-3.3-10-10-10s-10,3.3-10,10H0v-190c6.7,0,10-3.3,10-10s-3.3-10-10-10V0Z"/>
</svg>`;
};

/**
 * Escape XML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
const escapeXml = (str) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};
