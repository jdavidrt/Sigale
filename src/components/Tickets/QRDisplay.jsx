import { useRef, useCallback, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generateQRData } from "../../utils/qrGenerator";
import { copySVGToClipboard, copyPNGToClipboard, shareQR } from "../../utils/qrCopy";

export const QRDisplay = ({ ticket, event, showActions = true }) => {
  const qrRef = useRef(null);
  const [copyStatus, setCopyStatus] = useState("");
  const qrData = generateQRData(ticket, event);

  const copyAsSVG = useCallback(async () => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector("svg");
      const success = await copySVGToClipboard(svg);
      setCopyStatus(success ? "✓ SVG copied!" : "✗ Failed to copy");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  }, []);

  const copyAsPNG = useCallback(async () => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector("svg");
      const success = await copyPNGToClipboard(svg);
      setCopyStatus(success ? "✓ PNG copied!" : "✗ Failed to copy");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  }, []);

  const handleShare = useCallback(async () => {
    const success = await shareQR(qrData, event.name);
    if (!success) {
      setCopyStatus("Share not supported");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  }, [qrData, event.name]);

  return (
    <div className="space-y-4">
      <div
        ref={qrRef}
        className="flex justify-center p-6 bg-white rounded-xl shadow-sm border border-gray-100"
      >
        <QRCodeSVG value={qrData} size={256} level="H" includeMargin={true} />
      </div>

      <div className="text-center space-y-2">
        <p className="font-semibold text-lg text-gray-900">{event.name}</p>
        <p className="text-sm text-gray-600">
          📅 {event.date} • ⏰ {event.entranceTime}
        </p>
        <p className="text-sm text-gray-600">📍 {event.venue}</p>
        <p className="text-xs text-gray-500 font-mono mt-2">
          ID: {ticket.ticketId}
        </p>
      </div>

      {showActions && (
        <div className="space-y-3">
          <div className="flex gap-2 justify-center flex-wrap">
            <button
              onClick={copyAsSVG}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              📄 Copy SVG
            </button>
            <button
              onClick={copyAsPNG}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
            >
              🖼️ Copy PNG
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm"
            >
              📤 Share
            </button>
          </div>

          {copyStatus && (
            <p className="text-center text-sm font-medium text-gray-700">
              {copyStatus}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
