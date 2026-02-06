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
          container: "glass-elevated border-[#4ade80]/30",
          icon: "text-5xl mb-3",
          iconComponent: faCircleCheck,
          iconColor: "text-[#4ade80]",
          title: "text-[#4ade80]",
          button: "bg-gradient-to-r from-[#758BFD] to-[#BEADFF]",
        };
      case "duplicate":
        return {
          container: "glass-elevated border-red-500/30",
          icon: "text-5xl mb-3",
          iconComponent: faTriangleExclamation,
          iconColor: "text-red-400",
          title: "text-red-400",
          button: "bg-red-500/80",
        };
      case "not_found":
        return {
          container: "glass-elevated border-orange-500/30",
          icon: "text-5xl mb-3",
          iconComponent: faCircleXmark,
          iconColor: "text-orange-400",
          title: "text-orange-400",
          button: "bg-orange-500/80",
        };
      case "invalid":
      default:
        return {
          container: "glass-elevated border-[#758BFD]/30",
          icon: "text-5xl mb-3",
          iconComponent: faCircleXmark,
          iconColor: "text-[#E2D1B9]",
          title: "text-[#E2D1B9]",
          button: "bg-[#758BFD]/80",
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`rounded-2xl shadow-floating border p-6 animate-fadeIn ${styles.container}`} style={{ position: 'relative', zIndex: 10 }}>
      <div className="text-center">
        <div className={styles.icon}>
          <FontAwesomeIcon icon={styles.iconComponent} className={styles.iconColor} />
        </div>

        <h3 className={`text-2xl font-bold mb-1 ${styles.title}`} style={{ lineHeight: '1.1' }}>
          {success ? "Check-In Successful!" : "Check-In Failed"}
        </h3>

        <p className="text-body mb-4" style={{ fontSize: '16px', opacity: 0.8, lineHeight: '1.1' }}>{message}</p>

        {/* Ticket Details - High Density */}
        {ticket && (
          <div className="glass-clean rounded-xl p-4 mb-4 text-left border border-white/5" style={{ background: success ? 'rgba(74, 222, 128, 0.05)' : 'rgba(239, 68, 68, 0.05)' }}>
            <h4 className="text-label mb-3 text-center" style={{ opacity: 1, color: '#E2D1B9' }}>
              Ticket Info
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { label: "Buyer", value: ticket.buyerName },
                { label: "ID", value: ticket.buyerId },
                { label: "Type", value: ticket.ticketType, color: '#758BFD', bold: true },
                { label: "ID", value: ticket.ticketId, font: 'monospace', size: '10px', opacity: 0.6 }
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-baseline">
                  <span className="text-label" style={{ fontSize: '11px', opacity: 0.6 }}>{row.label}:</span>
                  <span style={{
                    fontSize: row.size || '14px',
                    fontWeight: row.bold ? 'bold' : 'normal',
                    color: row.color || '#E2D1B9',
                    fontFamily: row.font || 'inherit',
                    opacity: row.opacity || 1,
                    textTransform: row.label === "Type" ? 'uppercase' : 'none'
                  }}>
                    {row.value}
                  </span>
                </div>
              ))}

              {ticket.checkedIn && ticket.checkInTime && (
                <div className="flex justify-between pt-2 mt-1 border-t border-white/10">
                  <span className="text-label" style={{ fontSize: '11px', color: 'text-red-400', opacity: 1 }}>Original:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#ef4444' }}>
                    {formatTime(ticket.checkInTime)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR Data Debug */}
        {qrData && !ticket && (
          <div className="glass-clean rounded-xl p-3 mb-4 text-left border border-white/5">
            <p className="text-label mb-2" style={{ fontSize: '11px' }}>QR Data:</p>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#E2D1B9', opacity: 0.7, wordBreak: 'break-all' }}>
              TID: {qrData.ticketId || "N/A"}<br />
              HASH: {qrData.hash || "N/A"}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onClose}
          className={`w-full px-6 py-3 text-white rounded-xl transition-all font-bold shadow-lg ${styles.button}`}
        >
          {success ? <><FontAwesomeIcon icon={faCheck} className="mr-2" />Continue</> : "Try Again"}
        </button>
      </div>
    </div>
  );
};
