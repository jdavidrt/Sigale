import { useState } from "react";
import { QRDisplay } from "./QRDisplay";
import { useEvent } from "../../context/EventContext";

export const TicketCard = ({ ticket }) => {
  const { event } = useEvent();
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
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {ticket.buyerName}
            </h3>
            <p className="text-sm text-gray-500 font-mono">{ticket.ticketId}</p>
          </div>
          <div className="flex items-center gap-2">
            {ticket.checkedIn && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Checked In
              </span>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Ticket Type</p>
            <p className="text-sm font-semibold text-gray-900 capitalize">
              {ticket.ticketType}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Price</p>
            <p className="text-sm font-semibold text-gray-900">
              ${event.ticketTypes[ticket.ticketType]?.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">ID Number</p>
            <p className="text-sm font-medium text-gray-700">{ticket.buyerId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Phone</p>
            <p className="text-sm font-medium text-gray-700">{ticket.buyerPhone}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Purchase Date</p>
            <p className="text-sm font-medium text-gray-700">
              {formatDate(ticket.purchaseDate)}
            </p>
          </div>
          {ticket.checkedIn && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Check-in Time</p>
              <p className="text-sm font-medium text-green-700">
                {formatTime(ticket.checkInTime)}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <button
          onClick={() => setShowQR(!showQR)}
          className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
        >
          {showQR ? "Hide QR Code" : "Show QR Code"}
        </button>

        {/* QR Code Display */}
        {showQR && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <QRDisplay ticket={ticket} event={event} />
          </div>
        )}
      </div>
    </div>
  );
};
