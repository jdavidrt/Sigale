import { formatTo12Hour } from './timeFormat';
import { generateTicketSVG } from './svgTicketTemplate';

/**
 * Convert QR code SVG to data URL
 * @param {SVGElement} svgElement - The QR code SVG element
 * @returns {Promise<string>} Data URL of the QR code
 */
const qrToDataURL = (svgElement) => {
  return new Promise((resolve, reject) => {
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
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
  });
};

/**
 * Copy SVG ticket to clipboard as text
 * @param {SVGElement} qrSvgElement - The QR code SVG element
 * @param {Object} ticket - Ticket object with buyer information
 * @param {Object} event - Event object with event details
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const copySVGToClipboard = async (qrSvgElement, ticket, event) => {
  try {
    // Convert QR code to data URL
    const qrDataURL = await qrToDataURL(qrSvgElement);

    // Generate complete ticket SVG using template
    const ticketSVG = generateTicketSVG(ticket, event, qrDataURL);

    await navigator.clipboard.writeText(ticketSVG);
    return true;
  } catch (error) {
    console.error("Error copying SVG:", error);
    return false;
  }
};

/**
 * Convert SVG ticket to PNG and copy to clipboard
 * @param {SVGElement} qrSvgElement - The QR code SVG element
 * @param {Object} ticket - Ticket object with buyer information
 * @param {Object} event - Event object with event details
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const copyPNGToClipboard = async (qrSvgElement, ticket, event) => {
  try {
    // Convert QR code to data URL
    const qrDataURL = await qrToDataURL(qrSvgElement);

    // Generate complete ticket SVG using template
    const ticketSVG = generateTicketSVG(ticket, event, qrDataURL);

    // Convert ticket SVG to PNG
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    return new Promise((resolve) => {
      img.onload = async () => {
        // Scale factor for high-definition output (4x for high quality)
        const scale = 4;

        // Get actual SVG dimensions (supports dynamic height)
        const svgWidth = img.naturalWidth || img.width || 300;
        const svgHeight = img.naturalHeight || img.height || 500;

        // Set canvas size to scaled dimensions using actual SVG size
        canvas.width = svgWidth * scale;
        canvas.height = svgHeight * scale;

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw the ticket SVG scaled up
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob }),
            ]);
            resolve(true);
          } catch (error) {
            console.error("Error copying PNG:", error);
            resolve(false);
          }
        }, 'image/png', 1.0); // Maximum quality
      };

      img.onerror = () => {
        console.error("Error loading ticket SVG as image");
        resolve(false);
      };

      const svgBlob = new Blob([ticketSVG], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);
      img.src = url;
    });
  } catch (error) {
    console.error("Error in copyPNGToClipboard:", error);
    return false;
  }
};

/**
 * Share ticket as PNG image via Web Share API
 * @param {SVGElement} qrSvgElement - The QR code SVG element
 * @param {Object} ticket - Ticket object with buyer information
 * @param {Object} event - Event object with event details
 * @param {string} language - Current language ('es' or 'en')
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const shareQR = async (qrSvgElement, ticket, event, language = 'en') => {
  if (!navigator.share || !navigator.canShare) {
    console.warn("Web Share API not supported");
    return false;
  }

  try {
    // Convert QR code to data URL
    const qrDataURL = await qrToDataURL(qrSvgElement);

    // Generate complete ticket SVG using template
    const ticketSVG = generateTicketSVG(ticket, event, qrDataURL);

    // Convert ticket SVG to PNG
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    return new Promise((resolve) => {
      img.onload = async () => {
        // Scale factor for high-definition output (4x for high quality)
        const scale = 4;

        // Get actual SVG dimensions (supports dynamic height)
        const svgWidth = img.naturalWidth || img.width || 300;
        const svgHeight = img.naturalHeight || img.height || 500;

        // Set canvas size to scaled dimensions using actual SVG size
        canvas.width = svgWidth * scale;
        canvas.height = svgHeight * scale;

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw the ticket SVG scaled up
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
          try {
            const file = new File([blob], `ticket-${ticket.ticketId}.png`, {
              type: "image/png",
            });

            // Format date and time with proper timezone handling
            const [year, month, day] = event.date.split('-');
            const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            const locale = language === 'es' ? 'es-ES' : 'en-US';

            const formattedDate = eventDate.toLocaleDateString(locale, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            });
            const formattedTime = formatTo12Hour(event.entranceTime);

            // Create bilingual share message based on current language
            const shareMessage = language === 'es'
              ? `🎉 ¡Gracias por comprar tu boleta! 🎫

✨ ${event.name} ✨

Hola ${ticket.buyerName},

Tu boleta está confirmada y lista.

📅 Detalles del Evento:
━━━
📍 Lugar: ${event.venue}
🗺️ Dirección: ${event.address}
📆 Fecha: ${formattedDate}
🕐 Apertura de puertas: ${formattedTime}
🎫 Tipo de boleta: ${ticket.ticketType.toUpperCase()}
💵 Precio: $${event.ticketTypes[ticket.ticketType]?.toLocaleString() || 0}

━━━

📱 Guarda esta boleta y presenta el código QR en la entrada. 


Si tienes alguna pregunta, no dudes en contactarnos.

¡Nos vemos pronto! 🎊💖🎊`
              : `🎉 Thank you for purchasing your ticket! 🎫

✨ ${event.name} ✨

Dear ${ticket.buyerName},

We're thrilled to have you join us for this amazing event! Your ticket is confirmed and ready.

📅 Event Details:
━━━━━━━━━━━━━━━━━━━━
📍 Venue: ${event.venue}
🗺️  Address: ${event.address}
📆 Date: ${formattedDate}
🕐 Doors Open: ${formattedTime}
🎫 Ticket Type: ${ticket.ticketType.toUpperCase()}
💵 Price: $${event.ticketTypes[ticket.ticketType]?.toLocaleString() || 0}

━━━━━━━━━━━━━━━━━━━━

📱 Important: Please save this ticket and present the QR code at the entrance. Screenshot or download this image for easy access!

We can't wait to see you there! 🎊

If you have any questions, feel free to reach out.

See you soon! 💖`;

            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: `🎫 Your Ticket - ${event.name}`,
                text: shareMessage,
              });
              resolve(true);
            } else {
              console.warn("Sharing files not supported");
              resolve(false);
            }
          } catch (error) {
            if (error.name !== "AbortError") {
              console.error("Error sharing:", error);
            }
            resolve(false);
          }
        }, 'image/png', 1.0); // Maximum quality
      };

      img.onerror = () => {
        console.error("Error loading ticket SVG as image");
        resolve(false);
      };

      const svgBlob = new Blob([ticketSVG], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);
      img.src = url;
    });
  } catch (error) {
    console.error("Error in shareQR:", error);
    return false;
  }
};
