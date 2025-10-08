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
 * Convert SVG to PNG and copy to clipboard
 * @param {SVGElement} svgElement - The SVG element to convert and copy
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const copyPNGToClipboard = async (svgElement) => {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    return new Promise((resolve) => {
      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

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
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      img.src = url;
    });
  } catch (error) {
    console.error("Error in copyPNGToClipboard:", error);
    return false;
  }
};

/**
 * Share QR code data via Web Share API
 * @param {string} qrData - The QR code data to share
 * @param {string} eventName - The event name for the share title
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const shareQR = async (qrData, eventName) => {
  if (!navigator.share) {
    console.warn("Web Share API not supported");
    return false;
  }

  try {
    await navigator.share({
      title: `Ticket - ${eventName}`,
      text: qrData,
    });
    return true;
  } catch (error) {
    // User cancelled share or error occurred
    if (error.name !== "AbortError") {
      console.error("Error sharing:", error);
    }
    return false;
  }
};
