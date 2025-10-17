import { useRef, useCallback, useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generateQRData } from "../../utils/qrGenerator";
import { copySVGToClipboard, copyPNGToClipboard, shareQR } from "../../utils/qrCopy";
import { generateTicketSVG } from "../../utils/svgTicketTemplate";
import { useLanguage } from "../../context/LanguageContext";

export const QRDisplay = ({ ticket, event, showActions = true }) => {
  const qrRef = useRef(null);
  const ticketPreviewRef = useRef(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [ticketSVG, setTicketSVG] = useState("");
  const { t } = useLanguage();
  const qrData = generateQRData(ticket, event);

  // Generate ticket preview SVG
  useEffect(() => {
    const generatePreview = async () => {
      if (qrRef.current) {
        const svg = qrRef.current.querySelector("svg");
        if (svg) {
          // Convert QR to data URL
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const img = new Image();

          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const qrDataURL = canvas.toDataURL("image/png");

            // Generate ticket SVG
            const ticketSvgString = generateTicketSVG(ticket, event, qrDataURL);
            setTicketSVG(ticketSvgString);
          };

          const svgData = new XMLSerializer().serializeToString(svg);
          const svgBlob = new Blob([svgData], {
            type: "image/svg+xml;charset=utf-8",
          });
          const url = URL.createObjectURL(svgBlob);
          img.src = url;
        }
      }
    };

    generatePreview();
  }, [ticket, event]);

  const copyAsSVG = useCallback(async () => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector("svg");
      const success = await copySVGToClipboard(svg, ticket, event);
      setCopyStatus(success ? `✓ ${t("copiedToClipboard")}` : "✗ Failed to copy");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  }, [ticket, event, t]);

  const copyAsPNG = useCallback(async () => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector("svg");
      const success = await copyPNGToClipboard(svg, ticket, event);
      setCopyStatus(success ? `✓ ${t("copiedToClipboard")}` : "✗ Failed to copy");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  }, [ticket, event, t]);

  const handleShare = useCallback(async () => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector("svg");
      const success = await shareQR(svg, ticket, event);
      if (!success) {
        setCopyStatus("Share not supported");
        setTimeout(() => setCopyStatus(""), 2000);
      }
    }
  }, [ticket, event]);

  return (
    <div className="space-y-4">
      {/* Hidden QR Code for processing */}
      <div ref={qrRef} className="hidden">
        <QRCodeSVG value={qrData} size={200} level="L" marginSize={2} />
      </div>

      {/* Ticket Preview */}
      {ticketSVG && (
        <div
          ref={ticketPreviewRef}
          className="flex justify-center mx-auto max-w-fit"
          dangerouslySetInnerHTML={{ __html: ticketSVG }}
        />
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="space-y-3">
          <div className="flex gap-2 justify-center flex-wrap">
            <button
              onClick={copyAsSVG}
              className="px-3 md:px-4 py-2 bg-[#4a3d8f] text-[#FFEDD8] rounded-lg hover:bg-[#5a4d9f] transition-colors font-medium border border-[#758BFD] border-opacity-30 text-xs md:text-sm"
            >
              📄 Copy SVG
            </button>
            <button
              onClick={copyAsPNG}
              className="px-3 md:px-4 py-2 bg-[#4a3d8f] text-[#FFEDD8] rounded-lg hover:bg-[#5a4d9f] transition-colors font-medium border border-[#758BFD] border-opacity-30 text-xs md:text-sm"
            >
              🖼️ Copy PNG
            </button>
            <button
              onClick={handleShare}
              className="px-3 md:px-4 py-2 bg-[#4a3d8f] text-[#FFEDD8] rounded-lg hover:bg-[#5a4d9f] transition-colors font-medium border border-[#758BFD] border-opacity-30 text-xs md:text-sm"
            >
              📤 {t("share")}
            </button>
          </div>

          {copyStatus && (
            <p className="text-center text-xs md:text-sm font-medium text-[#4ade80]">
              {copyStatus}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
