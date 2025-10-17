import { useState, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generateQRData } from "../../utils/qrGenerator";
import { copyPNGToClipboard, shareQR } from "../../utils/qrCopy";
import { useEvent } from "../../context/EventContext";
import { useTickets } from "../../context/TicketContext";
import { useLanguage } from "../../context/LanguageContext";

export const TicketCard = ({ ticket }) => {
  const { event } = useEvent();
  const { deleteTicket } = useTickets();
  const { t } = useLanguage();
  const qrRef = useRef(null);
  const [copyStatus, setCopyStatus] = useState("");
  const qrData = generateQRData(ticket, event);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this ticket?\n\nBuyer: ${ticket.buyerName}\nTicket ID: ${ticket.ticketId}\n\nThis action cannot be undone.`
    );

    if (confirmDelete) {
      deleteTicket(ticket.ticketId);
    }
  };

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
    <div className={`bg-[#2a2a2a] rounded-xl border-2 ${ticket.checkedIn ? 'border-[#4ade80] border-opacity-50' : 'border-[#758BFD] border-opacity-20'} overflow-hidden transition-all relative`}>
      {/* Hidden QR Code for processing */}
      <div ref={qrRef} className="hidden">
        <QRCodeSVG value={qrData} size={200} level="L" marginSize={2} />
      </div>

      {/* Checkmark Badge - Top Right */}
      {ticket.checkedIn && (
        <div className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-[#4ade80] z-10">
          <span className="text-lg font-bold text-black">✓</span>
        </div>
      )}

      <div className="p-5">
        {/* Header - Name and Ticket ID */}
        <div className="mb-3 pr-10">
          <h3 className="text-lg font-bold text-[#FFEDD8] mb-1.5">
            {ticket.buyerName}
          </h3>
          <p className="text-xs text-[#758BFD] font-mono">{ticket.ticketId}</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#758BFD] opacity-30 mb-4"></div>

        {/* Details Grid - 2 Columns */}
        <div className="space-y-4">
          {/* Row 1: Ticket Type and Price */}
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              <p className="text-xs text-[#BEADFF] opacity-70 mb-1.5">
                {t("ticketType")}
              </p>
              <p className="text-[15px] font-bold text-[#FFEDD8] capitalize">
                {ticket.ticketType}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#BEADFF] opacity-70 mb-1.5">
                {t("price")}
              </p>
              <p className="text-[15px] font-bold text-[#FFEDD8]">
                ${event.ticketTypes[ticket.ticketType]?.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Row 2: ID Number and Phone */}
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              <p className="text-xs text-[#BEADFF] opacity-70 mb-1.5">
                {t("idNumber")}
              </p>
              <p className="text-sm text-[#FFEDD8]">{ticket.buyerId}</p>
            </div>
            <div>
              <p className="text-xs text-[#BEADFF] opacity-70 mb-1.5">
                {t("phoneNumber")}
              </p>
              <p className="text-sm text-[#FFEDD8]">{ticket.buyerPhone}</p>
            </div>
          </div>

          {/* Row 3: Purchase Date and Action Buttons */}
          <div className="grid grid-cols-2 gap-x-8 items-end">
            <div>
              <p className="text-xs text-[#BEADFF] opacity-70 mb-1.5">
                {t("purchaseDate")}
              </p>
              <p className="text-sm text-[#FFEDD8]">
                {formatDate(ticket.purchaseDate)}
              </p>
            </div>
            <div className="flex justify-end gap-2 flex-wrap">
              <button
                onClick={handleDelete}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-[#FFEDD8] rounded-md transition-colors font-bold border border-red-500 border-opacity-30 text-xs whitespace-nowrap"
                title="Delete ticket"
              >
                🗑️
              </button>
              <button
                onClick={copyAsPNG}
                className="px-3 py-2 bg-[#4a3d8f] hover:bg-[#5a4d9f] text-[#FFEDD8] rounded-md transition-colors font-bold border border-[#758BFD] border-opacity-30 text-xs whitespace-nowrap"
                title="Copy ticket as PNG"
              >
                🖼️
              </button>
              <button
                onClick={handleShare}
                className="px-3 py-2 bg-[#4a3d8f] hover:bg-[#5a4d9f] text-[#FFEDD8] rounded-md transition-colors font-bold border border-[#758BFD] border-opacity-30 text-xs whitespace-nowrap"
                title="Share ticket"
              >
                📤
              </button>
            </div>
          </div>

          {/* Copy Status */}
          {copyStatus && (
            <div className="text-center pt-2">
              <p className="text-xs font-medium text-[#4ade80]">
                {copyStatus}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
