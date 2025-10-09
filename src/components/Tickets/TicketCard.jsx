import { useState } from "react";
import { QRDisplay } from "./QRDisplay";
import { useEvent } from "../../context/EventContext";
import { useLanguage } from "../../context/LanguageContext";

export const TicketCard = ({ ticket }) => {
  const { event } = useEvent();
  const { t } = useLanguage();
  const [showQR, setShowQR] = useState(false);

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

  return (
    <div className="bg-[#2a2a2a] rounded-xl border-2 border-[#4ade80] border-opacity-50 overflow-hidden hover:border-opacity-70 transition-all">
      <div className="p-5 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-bold text-[#FFEDD8] mb-1">
              {ticket.buyerName}
            </h3>
            <p className="text-xs md:text-sm text-[#758BFD] font-mono">{ticket.ticketId}</p>
          </div>
          {ticket.checkedIn && (
            <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#4ade80]">
              <span className="text-base md:text-xl font-bold text-black">✓</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-[#758BFD] opacity-30 mb-4"></div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm md:text-base">
          <div>
            <p className="text-xs md:text-sm text-[#BEADFF] opacity-70 mb-1">
              {t("ticketType")}
            </p>
            <p className="font-bold text-[#FFEDD8] capitalize">
              {ticket.ticketType}
            </p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-[#BEADFF] opacity-70 mb-1">
              {t("price")}
            </p>
            <p className="font-bold text-[#FFEDD8]">
              ${event.ticketTypes[ticket.ticketType]?.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-[#BEADFF] opacity-70 mb-1">
              {t("idNumber")}
            </p>
            <p className="text-[#FFEDD8]">{ticket.buyerId}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-[#BEADFF] opacity-70 mb-1">
              {t("phoneNumber")}
            </p>
            <p className="text-[#FFEDD8]">{ticket.buyerPhone}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-[#BEADFF] opacity-70 mb-1">
              {t("purchaseDate")}
            </p>
            <p className="text-[#FFEDD8]">
              {formatDate(ticket.purchaseDate)}
            </p>
          </div>
          {ticket.checkedIn && (
            <div>
              <p className="text-xs md:text-sm text-[#BEADFF] opacity-70 mb-1">
                {t("checkedInAt")}
              </p>
              <p className="text-[#4ade80] font-medium">
                {formatTime(ticket.checkInTime)}
              </p>
            </div>
          )}
        </div>

        {/* Show QR Button */}
        <button
          onClick={() => setShowQR(!showQR)}
          className="w-full px-4 py-3 bg-[#4a3d8f] hover:bg-[#5a4d9f] text-[#FFEDD8] rounded-lg transition-colors font-bold border border-[#758BFD] border-opacity-30 text-sm md:text-base"
        >
          {showQR ? "Hide QR Code" : "Show QR Code"}
        </button>

        {/* QR Code Display */}
        {showQR && (
          <div className="mt-6 pt-6 border-t border-[#758BFD] border-opacity-30">
            <QRDisplay ticket={ticket} event={event} />
          </div>
        )}
      </div>
    </div>
  );
};
