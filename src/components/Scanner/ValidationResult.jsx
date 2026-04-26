import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleXmark, faTriangleExclamation, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../../context/LanguageContext";
import s from "./ValidationResult.module.css";

const ICON_MAP = {
  success: faCircleCheck,
  duplicate: faTriangleExclamation,
  not_found: faCircleXmark,
  invalid: faCircleXmark,
  wrong_event: faTriangleExclamation,
};

export const ValidationResult = ({ result, onClose }) => {
  const { t, language } = useLanguage();
  const { success, message, type, ticket, qrData } = result;
  const state = type || "invalid";
  const icon = ICON_MAP[state] ?? faCircleXmark;

  const formatTime = (isoString) => {
    // Respect the current UI language for the formatted timestamp.
    const locale = language === "es" ? "es-CO" : "en-US";
    return new Date(isoString).toLocaleString(locale, {
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
          {success ? t("checkInSuccessTitle") : t("checkInFailedTitle")}
        </h3>

        {/* Message */}
        <p className={s.message}>{message}</p>

        {/* Ticket Details */}
        {ticket && (
          <div className={s.infoBox} data-state={state}>
            <div className={s.infoRow}>
              <span className={s.infoKey}>{t("resultBuyer")}</span>
              <span className={s.infoValue}>{ticket.buyerName}</span>
            </div>
            <div className={s.infoRow}>
              <span className={s.infoKey}>{t("detailId")}</span>
              <span className={s.infoValue}>{ticket.buyerId}</span>
            </div>
            <div className={s.infoRow}>
              <span className={s.infoKey}>{t("type")}</span>
              <span className={s.infoValuePrimary}>{ticket.ticketType}</span>
            </div>
            <div className={s.infoRow}>
              <span className={s.infoKey}>{t("ticketId")}</span>
              <span className={s.infoValueMono}>{ticket.ticketId}</span>
            </div>
            {ticket.checkedIn && ticket.checkInTime && (
              <div className={`${s.infoRow} ${s.infoTimestamp}`}>
                <span className={s.infoKey}>{t("originalCheckIn")}</span>
                <span className={s.infoValueError}>{formatTime(ticket.checkInTime)}</span>
              </div>
            )}
          </div>
        )}

        {/* QR Debug */}
        {qrData && !ticket && (
          <div className={s.debugBox}>
            <p className={s.debugLabel}>{t("qrDataLabel")}</p>
            <p className={s.debugData}>
              TID: {qrData.ticketId || "N/A"}<br />
              HASH: {qrData.hash || "N/A"}
            </p>
          </div>
        )}

        {/* Action Button */}
        <button onClick={onClose} className={s.actionBtn} data-state={state}>
          {success ? <><FontAwesomeIcon icon={faCheck} /> {t("continueAction")}</> : t("tryAgain")}
        </button>
      </div>
    </div>
  );
};
