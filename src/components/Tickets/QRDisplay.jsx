import { useRef, useCallback, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generateQRData } from "../../utils/qrGenerator";
import { copySVGToClipboard, copyPNGToClipboard, shareQR } from "../../utils/qrCopy";
import { useLanguage } from "../../context/LanguageContext";

export const QRDisplay = ({ ticket, event, showActions = true }) => {
  const qrRef = useRef(null);
  const [copyStatus, setCopyStatus] = useState("");
  const { t } = useLanguage();
  const qrData = generateQRData(ticket, event);

  const copyAsSVG = useCallback(async () => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector("svg");
      const success = await copySVGToClipboard(svg);
      setCopyStatus(success ? `✓ ${t("copiedToClipboard")}` : "✗ Failed to copy");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  }, [t]);

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
      {/* QR Code with white background */}
      <div
        ref={qrRef}
        className="flex justify-center p-4 bg-white rounded-lg mx-auto max-w-fit"
      >
        <QRCodeSVG value={qrData} size={160} level="L" marginSize={2} />
      </div>

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
