import { formatTo12Hour } from './timeFormat';

/**
 * Helper function to wrap text to fit within a maximum width
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} text - Text to wrap
 * @param {number} maxWidth - Maximum width for text
 * @returns {string[]} Array of text lines
 */
const wrapText = (ctx, text, maxWidth) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

/**
 * Copy SVG QR code to clipboard as text
 * @param {SVGElement} svgElement - The SVG element to copy
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const copySVGToClipboard = async (svgElement) => {
  try {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    await navigator.clipboard.writeText(svgData);
    return true;
  } catch (error) {
    console.error("Error copying SVG:", error);
    return false;
  }
};

/**
 * Convert SVG to PNG with event info and copy to clipboard
 * @param {SVGElement} svgElement - The SVG element to convert and copy
 * @param {Object} ticket - Ticket object with buyer information
 * @param {Object} event - Event object with event details
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const copyPNGToClipboard = async (svgElement, ticket, event) => {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    return new Promise((resolve) => {
      img.onload = async () => {
        // Set canvas size with extra space for text
        const padding = 40;
        const maxTextWidth = img.width + padding * 2 - 80; // Leave margin on sides

        // Calculate dynamic height based on text wrapping
        let estimatedTextHeight = 250; // Base height

        canvas.width = img.width + padding * 2;
        canvas.height = img.height + estimatedTextHeight + padding * 2;

        // White background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw QR code centered
        ctx.drawImage(img, padding, padding);

        // Add text below QR code
        let textY = img.height + padding + 30;
        ctx.textAlign = "center";
        const centerX = canvas.width / 2;

        // Event name with text wrapping
        ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#111827";
        const eventNameLines = wrapText(ctx, event.name, maxTextWidth);
        eventNameLines.forEach((line, index) => {
          ctx.fillText(line, centerX, textY + (index * 30));
        });
        textY += eventNameLines.length * 30 + 10;

        // Buyer name
        ctx.font = "20px system-ui, -apple-system, sans-serif";
        ctx.fillText(ticket.buyerName, centerX, textY);
        textY += 35;

        // Event details with 12h format
        ctx.font = "16px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#4B5563";
        const formattedTime = formatTo12Hour(event.entranceTime);
        ctx.fillText(
          `📅 ${event.date} • 🕐 ${formattedTime}`,
          centerX,
          textY
        );
        textY += 25;

        // Venue name
        ctx.fillText(`📍 ${event.venue}`, centerX, textY);
        textY += 25;

        // Venue address with text wrapping
        if (event.address) {
          ctx.font = "14px system-ui, -apple-system, sans-serif";
          const addressLines = wrapText(ctx, event.address, maxTextWidth);
          addressLines.forEach((line, index) => {
            ctx.fillText(line, centerX, textY + (index * 20));
          });
          textY += addressLines.length * 20 + 10;
        }

        // Ticket ID
        ctx.font = "12px monospace";
        ctx.fillStyle = "#9CA3AF";
        ctx.fillText(`ID: ${ticket.ticketId}`, centerX, textY + 10);

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
        });
      };

      img.onerror = () => {
        console.error("Error loading SVG as image");
        resolve(false);
      };

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], {
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
 * Share QR code as PNG image with event info via Web Share API
 * @param {SVGElement} svgElement - The SVG element to convert and share
 * @param {Object} ticket - Ticket object with buyer information
 * @param {Object} event - Event object with event details
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const shareQR = async (svgElement, ticket, event) => {
  if (!navigator.share || !navigator.canShare) {
    console.warn("Web Share API not supported");
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    return new Promise((resolve) => {
      img.onload = async () => {
        // Set canvas size with extra space for text
        const padding = 40;
        const maxTextWidth = img.width + padding * 2 - 80;
        let estimatedTextHeight = 250;

        canvas.width = img.width + padding * 2;
        canvas.height = img.height + estimatedTextHeight + padding * 2;

        // White background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw QR code centered
        ctx.drawImage(img, padding, padding);

        // Add text below QR code
        let textY = img.height + padding + 30;
        ctx.textAlign = "center";
        const centerX = canvas.width / 2;

        // Event name with text wrapping
        ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#111827";
        const eventNameLines = wrapText(ctx, event.name, maxTextWidth);
        eventNameLines.forEach((line, index) => {
          ctx.fillText(line, centerX, textY + (index * 30));
        });
        textY += eventNameLines.length * 30 + 10;

        // Buyer name
        ctx.font = "20px system-ui, -apple-system, sans-serif";
        ctx.fillText(ticket.buyerName, centerX, textY);
        textY += 35;

        // Event details with 12h format
        ctx.font = "16px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#4B5563";
        const formattedTime = formatTo12Hour(event.entranceTime);
        ctx.fillText(
          `📅 ${event.date} • 🕐 ${formattedTime}`,
          centerX,
          textY
        );
        textY += 25;

        // Venue name
        ctx.fillText(`📍 ${event.venue}`, centerX, textY);
        textY += 25;

        // Venue address with text wrapping
        if (event.address) {
          ctx.font = "14px system-ui, -apple-system, sans-serif";
          const addressLines = wrapText(ctx, event.address, maxTextWidth);
          addressLines.forEach((line, index) => {
            ctx.fillText(line, centerX, textY + (index * 20));
          });
          textY += addressLines.length * 20 + 10;
        }

        // Ticket ID
        ctx.font = "12px monospace";
        ctx.fillStyle = "#9CA3AF";
        ctx.fillText(`ID: ${ticket.ticketId}`, centerX, textY + 10);

        canvas.toBlob(async (blob) => {
          try {
            const file = new File([blob], `ticket-${event.name}.png`, {
              type: "image/png",
            });

            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: `Ticket - ${event.name}`,
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
        });
      };

      img.onerror = () => {
        console.error("Error loading SVG as image");
        resolve(false);
      };

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], {
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
