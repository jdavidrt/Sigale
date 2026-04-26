import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the base64 illustration
const illustrationPath = path.join(__dirname, '../public/mockups/dibujosCharly64.txt');
const charlyIllustration = fs.readFileSync(illustrationPath, 'utf-8').trim();

// Mock ticket and event data
const ticket = {
  ticketId: 'TKT-2024-001234',
  buyerName: 'Juan Carlos Rodriguez',
  ticketType: 'VIP'
};

const event = {
  name: 'Festival de Música Latina 2024',
  venue: 'Teatro Nacional',
  address: 'Calle 123, Ciudad',
  date: '2024-12-15',
  entranceTime: '19:00',
  ticketTypes: {
    'VIP': 150000,
    'General': 80000
  }
};

// Helper functions from svgTicketTemplate.js
const splitTextIntoLines = (text, maxCharsPerLine) => {
  if (text.length <= maxCharsPerLine) return [text];
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

const calculateFontSize = (text, maxSize, minSize, threshold) => {
  if (text.length <= threshold) return maxSize;
  const ratio = Math.max(threshold / text.length, minSize / maxSize);
  return Math.max(maxSize * ratio, minSize);
};

const escapeXml = (str) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const formatTo12Hour = (time24) => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Generate left column
const generateLeftColumn = (eventNameLines, eventNameFontSize, venueLines, venueFontSize, addressLines, addressFontSize, formattedDate, formattedTime, ticketId, startY) => {
  let currentY = startY;
  let content = '';

  eventNameLines.forEach((line) => {
    content += `<text text-anchor="start" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${eventNameFontSize}" fill="#000">
      <tspan x="30" y="${currentY}">${escapeXml(line)}</tspan>
    </text>`;
    currentY += eventNameFontSize + 3;
  });

  currentY += 5;

  venueLines.forEach((line) => {
    content += `<text text-anchor="start" font-family="Monaco, 'Courier New', Courier, monospace" font-size="${venueFontSize}" fill="#000">
      <tspan x="30" y="${currentY}">${escapeXml(line)}</tspan>
    </text>`;
    currentY += venueFontSize + 2;
  });

  currentY += 2;

  addressLines.forEach((line) => {
    content += `<text text-anchor="start" font-family="Monaco, 'Courier New', Courier, monospace" font-size="${addressFontSize}" fill="#000">
      <tspan x="30" y="${currentY}">${escapeXml(line)}</tspan>
    </text>`;
    currentY += addressFontSize + 2;
  });

  currentY += 5;

  content += `<text text-anchor="start" font-family="Monaco, 'Courier New', Courier, monospace" font-size="11" fill="#000">
    <tspan x="30" y="${currentY}">${formattedDate}, ${formattedTime}</tspan>
  </text>`;
  currentY += 15;

  content += `<text text-anchor="start" font-family="Monaco, 'Courier New', Courier, monospace" font-size="8" fill="#666">
    <tspan x="30" y="${currentY}">${ticketId}</tspan>
  </text>`;

  return content;
};

// Generate right column
const generateRightColumn = (ticket, ticketPrice, buyerNameLines, buyerNameFontSize, startY) => {
  let currentY = startY;
  let content = '';

  buyerNameLines.forEach((line) => {
    content += `<text text-anchor="start" font-family="Monaco, 'Courier New', Courier, monospace" font-size="${buyerNameFontSize}" fill="#000">
      <tspan x="230" y="${currentY}">${escapeXml(line)}</tspan>
    </text>`;
    currentY += buyerNameFontSize + 3;
  });

  currentY += 5;

  content += `<text text-anchor="start" font-family="Monaco, 'Courier New', Courier, monospace" font-weight="700" font-size="11" fill="#000">
    <tspan x="230" y="${currentY}">${escapeXml(ticket.ticketType.toUpperCase())}</tspan>
  </text>`;
  currentY += 12;

  if (ticketPrice > 0) {
    content += `<text text-anchor="start" font-family="Monaco, 'Courier New', Courier, monospace" font-size="10" fill="#000">
      <tspan x="230" y="${currentY}">$${ticketPrice.toLocaleString()}</tspan>
    </text>`;
  }

  return content;
};

// Generate the ticket SVG
const generateTicketSVG = () => {
  const ticketPrice = event.ticketTypes[ticket.ticketType] || 0;

  const [year, month, day] = event.date.split('-');
  const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = formatTo12Hour(event.entranceTime);

  const eventNameLines = splitTextIntoLines(event.name.toUpperCase(), 24);
  const eventNameFontSize = calculateFontSize(event.name, 14, 9, 20);

  const venueLines = splitTextIntoLines(event.venue || '', 22);
  const venueFontSize = calculateFontSize(event.venue || '', 12, 9, 22);

  const addressLines = splitTextIntoLines(event.address || '', 22);
  const addressFontSize = calculateFontSize(event.address || '', 11, 8, 22);

  const buyerNameLines = splitTextIntoLines(ticket.buyerName.toUpperCase(), 18);
  const buyerNameFontSize = calculateFontSize(ticket.buyerName, 14, 10, 18);

  const leftColumnHeight =
    (eventNameLines.length * (eventNameFontSize + 3)) +
    (venueLines.length * (venueFontSize + 2)) +
    (addressLines.length * (addressFontSize + 2)) +
    20;

  const rightColumnHeight =
    15 +
    (buyerNameLines.length * (buyerNameFontSize + 3)) +
    15;

  const contentHeight = Math.max(leftColumnHeight, rightColumnHeight);

  const qrTopPadding = 20;
  const qrBottomPadding = 5;
  const qrSize = 200;
  const dottedLineToTextSpacing = 20;
  const totalHeight = Math.max(300, qrTopPadding + qrSize + qrBottomPadding + dottedLineToTextSpacing + contentHeight + 40);

  const ticketWidth = 400;
  const qrX = (ticketWidth - qrSize) / 2;
  const dottedLineY = qrTopPadding + qrSize + qrBottomPadding;
  const columnStartY = dottedLineY + dottedLineToTextSpacing;

  // Updated illustration dimensions (100% more = doubled from 22.4x13.44)
  const illustrationWidth = 44.8;
  const illustrationHeight = 26.88;
  const illustrationX = 230;
  const illustrationY = totalHeight - illustrationHeight - 15;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg id="Capa_1" data-name="Capa 1" xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${ticketWidth} ${totalHeight}">
  <defs>
    <style>
      .cls-1 { fill: #fff; }
      .cls-1, .cls-2 { stroke-width: 2px; }
      .cls-1, .cls-2, .cls-3 { stroke: #000; }
      .cls-11 { stroke-width: 0px; }
      .cls-11, .cls-2, .cls-3 { fill: none; }
      .cls-12 { clip-path: url(#clippath); }
      .cls-3 { stroke-dasharray: 0 0 5 5; stroke-width: 1.5px; }
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

      <!-- QR Code Placeholder -->
      <rect x="${qrX}" y="${qrTopPadding}" width="${qrSize}" height="${qrSize}" fill="#f0f0f0" stroke="#ccc"/>
      <text x="${qrX + qrSize/2}" y="${qrTopPadding + qrSize/2}" text-anchor="middle" font-family="Arial" font-size="14" fill="#999">[QR CODE]</text>

      <line class="cls-3" x1="20" y1="${dottedLineY}" x2="${ticketWidth - 20}" y2="${dottedLineY}"/>

      <g id="eventDetails">
        <g id="leftColumn">
          ${generateLeftColumn(eventNameLines, eventNameFontSize, venueLines, venueFontSize, addressLines, addressFontSize, formattedDate, formattedTime, ticket.ticketId, columnStartY)}
        </g>
        <g id="rightColumn">
          ${generateRightColumn(ticket, ticketPrice, buyerNameLines, buyerNameFontSize, columnStartY)}
        </g>
      </g>
    </g>
  </g>

  <!-- Border path with notches -->
  <path class="cls-2" d="M0,0h20c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h30c0,6.7,3.3,10,10,10s10-3.3,10-10h20v${dottedLineY - 10}c-6.7,0-10,3.3-10,10s3.3,10,10,10v${totalHeight - (dottedLineY + 10)}h-20c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10h-30c0-6.7-3.3-10-10-10s-10,3.3-10,10H0v-${totalHeight - (dottedLineY + 10)}c6.7,0,10-3.3,10-10s-3.3-10-10-10V0Z"/>

  <!-- Charly Illustration (Bottom Right) -->
  <image x="${illustrationX}" y="${illustrationY}" width="${illustrationWidth}" height="${illustrationHeight}" href="data:image/jpeg;base64,${charlyIllustration}" preserveAspectRatio="xMidYMid meet" opacity="0.9"/>
</svg>`;
};

// Generate and save the ticket
const ticketSVG = generateTicketSVG();
const outputPath = path.join(__dirname, '../test-ticket.svg');
fs.writeFileSync(outputPath, ticketSVG);

console.log(`Test ticket generated: ${outputPath}`);
