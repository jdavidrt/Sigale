import { formatTo12Hour, formatCurrency } from './timeFormat';
import { generateTicketSVG } from './svgTicketTemplate';

/**
 * Render a QR code SVG element onto a white-backed canvas and return
 * a PNG data URL. Used as the QR payload inside the larger ticket SVG.
 *
 * @param {SVGElement} svgElement
 * @returns {Promise<string>} PNG data URL
 */
const qrToDataURL = (svgElement) => new Promise((resolve, reject) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();

  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    resolve(canvas.toDataURL("image/png"));
  };

  img.onerror = reject;

  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  img.src = URL.createObjectURL(svgBlob);
});

/**
 * Rasterize an SVG string to a high-DPI PNG Blob. Single source of truth
 * for the canvas + scale + smoothing pipeline used by both clipboard-PNG
 * and Web-Share flows.
 *
 * @param {string} svgString - Full SVG markup
 * @param {number} [scale=4] - DPI multiplier for sharpness on retina + print
 * @returns {Promise<Blob|null>} PNG blob, or null on rasterization failure
 */
const svgToPngBlob = (svgString, scale = 4) => new Promise((resolve) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();

  img.onload = () => {
    const svgWidth = img.naturalWidth || img.width || 300;
    const svgHeight = img.naturalHeight || img.height || 500;

    canvas.width = svgWidth * scale;
    canvas.height = svgHeight * scale;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
  };

  img.onerror = () => {
    console.error("Error loading ticket SVG as image");
    resolve(null);
  };

  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  img.src = URL.createObjectURL(svgBlob);
});

/**
 * Build the bilingual ticket-share message used by the Web Share API.
 * Pulled out so `shareQR` reads as a linear pipeline.
 */
const buildShareMessage = (ticket, event, language) => {
  // Format date and time with proper timezone handling — split YYYY-MM-DD
  // manually so we don't get a UTC midnight that flips a day in -05:00.
  const [year, month, day] = event.date.split('-');
  const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const locale = language === 'es' ? 'es-ES' : 'en-US';

  const formattedDate = eventDate.toLocaleDateString(locale, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  const formattedTime = formatTo12Hour(event.entranceTime);

  const ticketPrice = event.ticketTypes[ticket.ticketType] || 0;
  const priceLine = ticketPrice > 0
    ? (language === 'es'
        ? `\n💵 Precio: ${formatCurrency(ticketPrice)}`
        : `\n💵 Price: ${formatCurrency(ticketPrice)}`)
    : '';
  const intro = ticketPrice > 0
    ? (language === 'es' ? '🎉 ¡Gracias por comprar tu boleta! 🎫\n' : '🎉 Thank you for purchasing your ticket! 🎫\n\n')
    : '';

  if (language === 'es') {
    return `${intro}✨ ${event.name} ✨

Hola ${ticket.buyerName},
Tu boleta está confirmada y lista.

📅 Detalles del Evento:
━━━
📍 Lugar: ${event.venue}
🗺️ Dirección: ${event.address}
📆 Fecha: ${formattedDate}
🕐 Apertura de puertas: ${formattedTime}
🎫 Tipo de boleta: ${ticket.ticketType.toUpperCase()}${priceLine}
━━━

📱 Guarda esta boleta y presenta el código QR en la entrada.
Si tienes alguna pregunta, no dudes en contactarnos.
¡Nos vemos pronto! 🎊💖🎊`;
  }

  return `${intro}✨ ${event.name} ✨

Dear ${ticket.buyerName},

We're thrilled to have you join us for this amazing event! Your ticket is confirmed and ready.

📅 Event Details:
━━━━━━━━━━━━━━━━━━━━
📍 Venue: ${event.venue}
🗺️  Address: ${event.address}
📆 Date: ${formattedDate}
🕐 Doors Open: ${formattedTime}
🎫 Ticket Type: ${ticket.ticketType.toUpperCase()}${priceLine}

━━━━━━━━━━━━━━━━━━━━

📱 Important: Please save this ticket and present the QR code at the entrance. Screenshot or download this image for easy access!

We can't wait to see you there! 🎊

If you have any questions, feel free to reach out.

See you soon! 💖`;
};

/**
 * Copy the full ticket SVG (as text) to the clipboard.
 *
 * @param {SVGElement} qrSvgElement
 * @param {Object} ticket
 * @param {Object} event
 * @returns {Promise<boolean>}
 */
export const copySVGToClipboard = async (qrSvgElement, ticket, event) => {
  try {
    const qrDataURL = await qrToDataURL(qrSvgElement);
    const ticketSVG = generateTicketSVG(ticket, event, qrDataURL);
    await navigator.clipboard.writeText(ticketSVG);
    return true;
  } catch (error) {
    console.error("Error copying SVG:", error);
    return false;
  }
};

/**
 * Render the full ticket SVG to a high-DPI PNG and write it to the clipboard.
 *
 * @returns {Promise<boolean>}
 */
export const copyPNGToClipboard = async (qrSvgElement, ticket, event) => {
  try {
    const qrDataURL = await qrToDataURL(qrSvgElement);
    const ticketSVG = generateTicketSVG(ticket, event, qrDataURL);
    const blob = await svgToPngBlob(ticketSVG);
    if (!blob) return false;

    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ]);
    return true;
  } catch (error) {
    console.error("Error copying PNG:", error);
    return false;
  }
};

/**
 * Share the full ticket as a PNG file via the Web Share API, with a
 * locale-aware message body.
 *
 * @param {SVGElement} qrSvgElement
 * @param {Object} ticket
 * @param {Object} event
 * @param {string} [language='en'] - 'es' or 'en'
 * @returns {Promise<boolean>}
 */
export const shareQR = async (qrSvgElement, ticket, event, language = 'en') => {
  if (!navigator.share || !navigator.canShare) {
    console.warn("Web Share API not supported");
    return false;
  }

  try {
    const qrDataURL = await qrToDataURL(qrSvgElement);
    const ticketSVG = generateTicketSVG(ticket, event, qrDataURL);
    const blob = await svgToPngBlob(ticketSVG);
    if (!blob) return false;

    const file = new File([blob], `ticket-${ticket.ticketId}.png`, {
      type: "image/png",
    });

    if (!navigator.canShare({ files: [file] })) {
      console.warn("Sharing files not supported");
      return false;
    }

    await navigator.share({
      files: [file],
      title: `🎫 Your Ticket - ${event.name}`,
      text: buildShareMessage(ticket, event, language),
    });
    return true;
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Error sharing:", error);
    }
    return false;
  }
};
