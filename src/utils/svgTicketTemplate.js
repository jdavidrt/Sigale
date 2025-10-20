import { formatTo12Hour, parseLocalDate } from './timeFormat';
import { cleanBase64 } from './base64Cleaner';

// Charly's illustration base64 - imported at build time
// This will be embedded in the ticket at the bottom right
let charlyIllustration = null;

/**
 * Load the Charly illustration from the mockups folder
 * This function should be called once to initialize the illustration
 * @param {string} base64Data - Base64 encoded image data
 */
export const loadCharlyIllustration = (base64Data) => {
  try {
    charlyIllustration = cleanBase64(base64Data);
  } catch (error) {
    console.error('Failed to load Charly illustration:', error);
    charlyIllustration = null;
  }
};

/**
 * Split long text into multiple lines
 * @param {string} text - Text to split
 * @param {number} maxCharsPerLine - Maximum characters per line
 * @returns {string[]} Array of text lines
 */
const splitTextIntoLines = (text, maxCharsPerLine) => {
  if (text.length <= maxCharsPerLine) {
    return [text];
  }

  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
};

/**
 * Calculate dynamic font size based on text length
 * @param {string} text - Text to measure
 * @param {number} maxSize - Maximum font size
 * @param {number} minSize - Minimum font size
 * @param {number} threshold - Character count threshold
 * @returns {number} Font size
 */
const calculateFontSize = (text, maxSize, minSize, threshold) => {
  if (text.length <= threshold) return maxSize;
  const ratio = Math.max(threshold / text.length, minSize / maxSize);
  return Math.max(maxSize * ratio, minSize);
};

/**
 * Generate a ticket SVG using the template design with two-column layout
 * @param {Object} ticket - Ticket object with buyer information
 * @param {Object} event - Event object with event details
 * @param {string} qrDataURL - QR code as data URL
 * @returns {string} SVG string
 */
export const generateTicketSVG = (ticket, event, qrDataURL) => {
  // Get ticket price from event.ticketTypes
  const ticketPrice = event.ticketTypes[ticket.ticketType] || 0;

  // Format date and time with proper timezone handling
  const formattedDate = parseLocalDate(event.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = formatTo12Hour(event.entranceTime);

  // Two-column layout: Left column max ~20 chars, Right column max ~18 chars
  // LEFT COLUMN: Event Name, Venue, Address, Date/Time
  const eventNameLines = splitTextIntoLines(event.name.toUpperCase(), 20);
  const eventNameFontSize = calculateFontSize(event.name, 18, 11, 20);

  const venueLines = splitTextIntoLines(event.venue || '', 22);
  const venueFontSize = calculateFontSize(event.venue || '', 12, 9, 22); // +2pt (was 10, 7)

  const addressLines = splitTextIntoLines(event.address || '', 22);
  const addressFontSize = calculateFontSize(event.address || '', 11, 8, 22); // +1pt (was 10, 7)

  // RIGHT COLUMN: Ticket Type, Price, Buyer Name, Ticket ID
  const buyerNameLines = splitTextIntoLines(ticket.buyerName.toUpperCase(), 18);
  const buyerNameFontSize = calculateFontSize(ticket.buyerName, 14, 10, 18);

  // Calculate dynamic height based on content
  const leftColumnHeight =
    (eventNameLines.length * (eventNameFontSize + 3)) +
    (venueLines.length * (venueFontSize + 2)) +
    (addressLines.length * (addressFontSize + 2)) +
    20; // Date/Time line

  const rightColumnHeight =
    15 + // Ticket type label
    (buyerNameLines.length * (buyerNameFontSize + 3)) +
    15; // Ticket ID

  const contentHeight = Math.max(leftColumnHeight, rightColumnHeight);

  // Reduced spacing: minimal padding above/below QR
  const qrTopPadding = 20; // Reduced from 50
  const qrBottomPadding = 5; // Minimal space between QR and dotted line
  const qrSize = 200;
  const dottedLineToTextSpacing = 20; // 20px separation between dotted line and text below
  const totalHeight = Math.max(300, qrTopPadding + qrSize + qrBottomPadding + dottedLineToTextSpacing + contentHeight + 40);

  // Wider ticket: 400px instead of 300px
  const ticketWidth = 400;
  const qrX = (ticketWidth - qrSize) / 2; // Center QR code
  const dottedLineY = qrTopPadding + qrSize + qrBottomPadding;
  const columnStartY = dottedLineY + dottedLineToTextSpacing;

  // Charly illustration dimensions and position (aligned with right column)
  const illustrationWidth = 112; // 20% smaller (was 140)
  const illustrationHeight = 67.2; // Maintain aspect ratio (0.6 ratio), 20% smaller (was 84)
  const illustrationX = 230; // Align with right column left margin (x=230)
  const illustrationY = totalHeight - illustrationHeight - 15; // 15px from bottom

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg id="Capa_1" data-name="Capa 1" xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${ticketWidth} ${totalHeight}">
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
      .cls-11 {
        stroke-width: 0px;
      }
      .cls-11, .cls-2, .cls-3 {
        fill: none;
      }
      .cls-12 {
        clip-path: url(#clippath);
      }
      .cls-3 {
        stroke-dasharray: 0 0 5 5;
        stroke-width: 1.5px;
      }
    </style>
    <clipPath id="clippath">
      <path class="cls-11" d="M0,0h20c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h20v${dottedLineY - 10}c-6.7,0-10,3.3-10,10s3.3,10,10,10v${totalHeight - (dottedLineY + 10)}h-20c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10H0v-${totalHeight - (dottedLineY + 10)}c6.7,0,10-3.3,10-10s-3.3-10-10-10V0Z"/>
    </clipPath>
  </defs>
  <rect class="cls-11" width="${ticketWidth}" height="${totalHeight}"/>
  <g class="cls-12">
    <g>
      <rect class="cls-1" width="${ticketWidth}" height="${totalHeight}"/>
      <rect class="cls-1" x="${qrX}" y="${qrTopPadding}" width="${qrSize}" height="${qrSize}" rx="5" ry="5"/>

      <!-- Embedded QR Code -->
      <image x="${qrX}" y="${qrTopPadding}" width="${qrSize}" height="${qrSize}" href="${qrDataURL}" preserveAspectRatio="xMidYMid meet"/>

      <line class="cls-3" x1="20" y1="${dottedLineY}" x2="${ticketWidth - 20}" y2="${dottedLineY}"/>

      <g id="eventDetails">
        <!-- LEFT COLUMN (x=30 to x=210) -->
        <g id="leftColumn">
          ${generateLeftColumn(eventNameLines, eventNameFontSize, venueLines, venueFontSize, addressLines, addressFontSize, formattedDate, formattedTime, ticket.ticketId, columnStartY)}
        </g>

        <!-- RIGHT COLUMN (x=230 to x=370) -->
        <g id="rightColumn">
          ${generateRightColumn(ticket, ticketPrice, buyerNameLines, buyerNameFontSize, columnStartY)}
        </g>
      </g>
    </g>
  </g>

  <!-- Border path with notches on both left and right -->
  <path class="cls-2" d="M0,0h20c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h20v${dottedLineY - 10}c-6.7,0-10,3.3-10,10s3.3,10,10,10v${totalHeight - (dottedLineY + 10)}h-20c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10H0v-${totalHeight - (dottedLineY + 10)}c6.7,0,10-3.3,10-10s-3.3-10-10-10V0Z"/>

  <!-- Charly Illustration (Bottom Right, aligned with right column) - Outside clipping -->
  ${charlyIllustration ? `<image x="${illustrationX}" y="${illustrationY}" width="${illustrationWidth}" height="${illustrationHeight}" href="data:image/jpeg;base64,${charlyIllustration}" preserveAspectRatio="xMidYMid meet" opacity="0.9"/>` : ''}
</svg>`;
};

/**
 * Generate left column content (Event Name, Venue, Address, Date/Time, Ticket ID)
 */
const generateLeftColumn = (eventNameLines, eventNameFontSize, venueLines, venueFontSize, addressLines, addressFontSize, formattedDate, formattedTime, ticketId, startY) => {
  let currentY = startY;
  let content = '';

  // Event Name - Modern stylish font (Helvetica/Arial)
  eventNameLines.forEach((line) => {
    content += `<text text-anchor="start" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${eventNameFontSize}" fill="#000">
      <tspan x="30" y="${currentY}">${escapeXml(line)}</tspan>
    </text>`;
    currentY += eventNameFontSize + 3;
  });

  currentY += 5; // Space between event name and venue

  // Venue - Consolas monospace font
  venueLines.forEach((line) => {
    content += `<text text-anchor="start" font-family="Consolas, Consolas" font-size="${venueFontSize}" fill="#000">
      <tspan x="30" y="${currentY}">${escapeXml(line)}</tspan>
    </text>`;
    currentY += venueFontSize + 2;
  });

  currentY += 2; // Space between venue and address

  // Address - Consolas monospace font
  addressLines.forEach((line) => {
    content += `<text text-anchor="start" font-family="Consolas, Consolas" font-size="${addressFontSize}" fill="#000">
      <tspan x="30" y="${currentY}">${escapeXml(line)}</tspan>
    </text>`;
    currentY += addressFontSize + 2;
  });

  currentY += 5; // Space before date/time

  // Date and Time - Consolas monospace font (+1pt, was 10)
  content += `<text text-anchor="start" font-family="Consolas, Consolas" font-size="11" fill="#000">
    <tspan x="30" y="${currentY}">${formattedDate}, ${formattedTime}</tspan>
  </text>`;
  currentY += 15; // Space before ticket ID

  // Ticket ID - Consolas monospace font (close to date/time) - Dark grey
  content += `<text text-anchor="start" font-family="Consolas, Consolas" font-size="8" fill="#666">
    <tspan x="30" y="${currentY}">${ticketId}</tspan>
  </text>`;

  return content;
};

/**
 * Generate right column content (Buyer Name, Ticket Type, Price)
 */
const generateRightColumn = (ticket, ticketPrice, buyerNameLines, buyerNameFontSize, startY) => {
  let currentY = startY;
  let content = '';

  // Buyer Name - Consolas monospace (now at the top)
  buyerNameLines.forEach((line) => {
    content += `<text text-anchor="start" font-family="Consolas, Consolas" font-size="${buyerNameFontSize}" fill="#000">
      <tspan x="230" y="${currentY}">${escapeXml(line)}</tspan>
    </text>`;
    currentY += buyerNameFontSize + 3;
  });

  currentY += 5; // Space between buyer name and ticket type

  // Ticket Type - Consolas monospace, bold (11pt)
  content += `<text text-anchor="start" font-family="Consolas, Consolas" font-weight="700" font-size="11" fill="#000">
    <tspan x="230" y="${currentY}">${escapeXml(ticket.ticketType.toUpperCase())}</tspan>
  </text>`;
  currentY += 12;

  // Price - Only show if price > 0 (10pt)
  if (ticketPrice > 0) {
    content += `<text text-anchor="start" font-family="Consolas, Consolas" font-size="10" fill="#000">
      <tspan x="230" y="${currentY}">$${ticketPrice.toLocaleString()}</tspan>
    </text>`;
    currentY += 13;
  } else {
    currentY += 5; // Small spacing when no price
  }

  // Ticket ID removed from right column - now in bottom left corner

  return content;
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
