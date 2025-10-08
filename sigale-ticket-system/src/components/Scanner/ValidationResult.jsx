export const ValidationResult = ({ result, onClose }) => {
  const { success, message, type, ticket, qrData } = result;

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStyles = () => {
    switch (type) {
      case "success":
        return {
          container: "bg-green-50 border-green-200",
          icon: "text-6xl mb-4",
          iconEmoji: "✅",
          title: "text-green-900",
          message: "text-green-800",
          button: "bg-green-600 hover:bg-green-700",
        };
      case "duplicate":
        return {
          container: "bg-red-50 border-red-200",
          icon: "text-6xl mb-4",
          iconEmoji: "⚠️",
          title: "text-red-900",
          message: "text-red-800",
          button: "bg-red-600 hover:bg-red-700",
        };
      case "not_found":
        return {
          container: "bg-orange-50 border-orange-200",
          icon: "text-6xl mb-4",
          iconEmoji: "❌",
          title: "text-orange-900",
          message: "text-orange-800",
          button: "bg-orange-600 hover:bg-orange-700",
        };
      case "invalid":
      default:
        return {
          container: "bg-gray-50 border-gray-200",
          icon: "text-6xl mb-4",
          iconEmoji: "❌",
          title: "text-gray-900",
          message: "text-gray-800",
          button: "bg-gray-600 hover:bg-gray-700",
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`rounded-xl shadow-lg border-2 p-8 ${styles.container}`}>
      <div className="text-center">
        <div className={styles.icon}>{styles.iconEmoji}</div>

        <h3 className={`text-2xl font-bold mb-3 ${styles.title}`}>
          {success ? "Check-In Successful!" : "Check-In Failed"}
        </h3>

        <p className={`text-lg mb-6 ${styles.message}`}>{message}</p>

        {/* Ticket Details */}
        {ticket && (
          <div className="bg-white rounded-lg p-6 mb-6 text-left shadow-sm">
            <h4 className="font-bold text-gray-900 mb-4 text-center">
              Ticket Details
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Buyer Name:</span>
                <span className="font-semibold text-gray-900">
                  {ticket.buyerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ID Number:</span>
                <span className="font-semibold text-gray-900">{ticket.buyerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-semibold text-gray-900">
                  {ticket.buyerPhone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ticket Type:</span>
                <span className="font-semibold text-gray-900 capitalize">
                  {ticket.ticketType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ticket ID:</span>
                <span className="font-mono text-sm text-gray-900">
                  {ticket.ticketId}
                </span>
              </div>
              {ticket.checkedIn && ticket.checkInTime && (
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="text-gray-600">Original Check-In:</span>
                  <span className="font-semibold text-red-700">
                    {formatTime(ticket.checkInTime)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR Data (for debugging not found tickets) */}
        {qrData && !ticket && (
          <div className="bg-white rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 mb-2">QR Code Data:</p>
            <p className="text-xs font-mono text-gray-700 break-all">
              Ticket ID: {qrData.ticketId || "N/A"}
            </p>
            <p className="text-xs font-mono text-gray-700 break-all">
              Hash: {qrData.hash || "N/A"}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <button
          onClick={onClose}
          className={`w-full px-6 py-3 text-white rounded-lg transition-colors font-medium shadow-md ${styles.button}`}
        >
          {success ? "✓ Continue" : "Try Again"}
        </button>
      </div>
    </div>
  );
};
