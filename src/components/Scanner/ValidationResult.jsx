import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleXmark, faTriangleExclamation, faCheck } from "@fortawesome/free-solid-svg-icons";
import s from "./ValidationResult.module.css";

const ICON_MAP = {
  success: faCircleCheck,
  duplicate: faTriangleExclamation,
  not_found: faCircleXmark,
  invalid: faCircleXmark,
};

export const ValidationResult = ({ result, onClose }) => {
  const { success, message, type, ticket, qrData } = result;
  const state = type || "invalid";
  const icon = ICON_MAP[state] ?? faCircleXmark;

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`glass-elevated ${s.result}`} data-state={state}>
      <div className={s.body}>
        {/* Icon */}
        <span className={s.icon} data-state={state}>
          <FontAwesomeIcon icon={icon} />
        </span>

        {/* Title */}
        <h3 className={s.title} data-state={state}>
          {success ? "Check-In Successful!" : "Check-In Failed"}
        </h3>

        {/* Message */}
        <p className={s.message}>{message}</p>

        {/* Ticket Details */}
        {ticket && (
          <div className={s.infoBox} data-state={state}>
            <div className={s.infoRow}>
              <span className={s.infoKey}>Buyer</span>
              <span className={s.infoValue}>{ticket.buyerName}</span>
            </div>
            <div className={s.infoRow}>
              <span className={s.infoKey}>ID</span>
              <span className={s.infoValue}>{ticket.buyerId}</span>
            </div>
            <div className={s.infoRow}>
              <span className={s.infoKey}>Type</span>
              <span className={s.infoValuePrimary}>{ticket.ticketType}</span>
            </div>
            <div className={s.infoRow}>
              <span className={s.infoKey}>Ticket ID</span>
              <span className={s.infoValueMono}>{ticket.ticketId}</span>
            </div>
            {ticket.checkedIn && ticket.checkInTime && (
              <div className={`${s.infoRow} ${s.infoTimestamp}`}>
                <span className={s.infoKey}>Original check-in</span>
                <span className={s.infoValueError}>{formatTime(ticket.checkInTime)}</span>
              </div>
            )}
          </div>
        )}

        {/* QR Debug */}
        {qrData && !ticket && (
          <div className={s.debugBox}>
            <p className={s.debugLabel}>QR Data</p>
            <p className={s.debugData}>
              TID: {qrData.ticketId || "N/A"}<br />
              HASH: {qrData.hash || "N/A"}
            </p>
          </div>
        )}

        {/* Action Button */}
        <button onClick={onClose} className={s.actionBtn} data-state={state}>
          {success ? <><FontAwesomeIcon icon={faCheck} /> Continue</> : "Try Again"}
        </button>
      </div>
    </div>
  );
};
