import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleXmark, faTriangleExclamation, faCheck } from "@fortawesome/free-solid-svg-icons";

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
          container: "bg-[#2a2a2a] border-[#4ade80]",
          icon: "text-6xl mb-4",
          iconComponent: faCircleCheck,
          iconColor: "text-[#4ade80]",
          title: "text-[#4ade80]",
          message: "text-[#BEADFF]",
          button: "bg-gradient-to-r from-[#758BFD] to-[#BEADFF] hover:opacity-90",
        };
      case "duplicate":
        return {
          container: "bg-[#2a2a2a] border-red-500",
          icon: "text-6xl mb-4",
          iconComponent: faTriangleExclamation,
          iconColor: "text-red-400",
          title: "text-red-400",
          message: "text-[#BEADFF]",
          button: "bg-red-600 hover:bg-red-700",
        };
      case "not_found":
        return {
          container: "bg-[#2a2a2a] border-orange-500",
          icon: "text-6xl mb-4",
          iconComponent: faCircleXmark,
          iconColor: "text-orange-400",
          title: "text-orange-400",
          message: "text-[#BEADFF]",
          button: "bg-orange-600 hover:bg-orange-700",
        };
      case "invalid":
      default:
        return {
          container: "bg-[#2a2a2a] border-[#758BFD]",
          icon: "text-6xl mb-4",
          iconComponent: faCircleXmark,
          iconColor: "text-[#FFEDD8]",
          title: "text-[#FFEDD8]",
          message: "text-[#BEADFF]",
          button: "bg-[#4a3d8f] hover:bg-[#5a4d9f]",
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`rounded-xl shadow-lg border-2 p-8 ${styles.container}`}>
      <div className="text-center">
        <div className={styles.icon}>
          <FontAwesomeIcon icon={styles.iconComponent} className={styles.iconColor} />
        </div>

        <h3 className={`text-2xl font-bold mb-3 ${styles.title}`}>
          {success ? "Check-In Successful!" : "Check-In Failed"}
        </h3>

        <p className={`text-lg mb-6 ${styles.message}`}>{message}</p>

        {/* Ticket Details */}
        {ticket && (
          <div className="bg-[#1a1a1a] rounded-lg p-6 mb-6 text-left border border-[#758BFD] border-opacity-20">
            <h4 className="font-bold text-[#FFEDD8] mb-4 text-center">
              Ticket Details
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[#BEADFF] opacity-70">Buyer Name:</span>
                <span className="font-semibold text-[#FFEDD8]">
                  {ticket.buyerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BEADFF] opacity-70">ID Number:</span>
                <span className="font-semibold text-[#FFEDD8]">{ticket.buyerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BEADFF] opacity-70">Phone:</span>
                <span className="font-semibold text-[#FFEDD8]">
                  {ticket.buyerPhone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BEADFF] opacity-70">Ticket Type:</span>
                <span className="font-semibold text-[#FFEDD8] capitalize">
                  {ticket.ticketType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BEADFF] opacity-70">Ticket ID:</span>
                <span className="font-mono text-sm text-[#758BFD]">
                  {ticket.ticketId}
                </span>
              </div>
              {ticket.checkedIn && ticket.checkInTime && (
                <div className="flex justify-between pt-3 border-t border-[#758BFD] border-opacity-30">
                  <span className="text-[#BEADFF] opacity-70">Original Check-In:</span>
                  <span className="font-semibold text-red-400">
                    {formatTime(ticket.checkInTime)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR Data (for debugging not found tickets) */}
        {qrData && !ticket && (
          <div className="bg-[#1a1a1a] rounded-lg p-4 mb-6 text-left border border-[#758BFD] border-opacity-20">
            <p className="text-sm text-[#BEADFF] opacity-70 mb-2">QR Code Data:</p>
            <p className="text-xs font-mono text-[#FFEDD8] break-all">
              Ticket ID: {qrData.ticketId || "N/A"}
            </p>
            <p className="text-xs font-mono text-[#FFEDD8] break-all">
              Hash: {qrData.hash || "N/A"}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <button
          onClick={onClose}
          className={`w-full px-6 py-3 text-[#FFEDD8] rounded-lg transition-all font-bold border border-[#BEADFF] border-opacity-30 ${styles.button}`}
        >
          {success ? <><FontAwesomeIcon icon={faCheck} className="mr-2" />Continue</> : "Try Again"}
        </button>
      </div>
    </div>
  );
};
