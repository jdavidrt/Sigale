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
        const textHeight = 200;
        canvas.width = img.width + padding * 2;
        canvas.height = img.height + textHeight + padding * 2;

        // White background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw QR code centered
        ctx.drawImage(img, padding, padding);

        // Add text below QR code
        const textY = img.height + padding + 30;
        ctx.fillStyle = "#111827";
        ctx.textAlign = "center";
        const centerX = canvas.width / 2;

        // Event name
        ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
        ctx.fillText(event.name, centerX, textY);

        // Buyer name
        ctx.font = "20px system-ui, -apple-system, sans-serif";
        ctx.fillText(ticket.buyerName, centerX, textY + 35);

        // Event details
        ctx.font = "16px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#4B5563";
        ctx.fillText(
          `📅 ${event.date} • ⏰ ${event.entranceTime}`,
          centerX,
          textY + 70
        );
        ctx.fillText(`📍 ${event.venue}`, centerX, textY + 95);

        // Ticket ID
        ctx.font = "12px monospace";
        ctx.fillStyle = "#9CA3AF";
        ctx.fillText(`ID: ${ticket.ticketId}`, centerX, textY + 125);

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
        const textHeight = 200;
        canvas.width = img.width + padding * 2;
        canvas.height = img.height + textHeight + padding * 2;

        // White background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw QR code centered
        ctx.drawImage(img, padding, padding);

        // Add text below QR code
        const textY = img.height + padding + 30;
        ctx.fillStyle = "#111827";
        ctx.textAlign = "center";
        const centerX = canvas.width / 2;

        // Event name
        ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
        ctx.fillText(event.name, centerX, textY);

        // Buyer name
        ctx.font = "20px system-ui, -apple-system, sans-serif";
        ctx.fillText(ticket.buyerName, centerX, textY + 35);

        // Event details
        ctx.font = "16px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#4B5563";
        ctx.fillText(
          `📅 ${event.date} • ⏰ ${event.entranceTime}`,
          centerX,
          textY + 70
        );
        ctx.fillText(`📍 ${event.venue}`, centerX, textY + 95);

        // Ticket ID
        ctx.font = "12px monospace";
        ctx.fillStyle = "#9CA3AF";
        ctx.fillText(`ID: ${ticket.ticketId}`, centerX, textY + 125);

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
