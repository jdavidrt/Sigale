import { useTickets } from "../../context/TicketContext";
import { useLanguage } from "../../context/LanguageContext";

/**
 * Renders a blocking banner whenever the last localStorage write failed.
 * Silent write failures at the door are the worst case — UI appears to
 * check a ticket in, but nothing was persisted. This is the operator's
 * signal to export/backup and free space before continuing.
 */
export const StorageErrorBanner = () => {
  const { storageError, clearStorageError } = useTickets();
  const { t } = useLanguage();

  if (!storageError) return null;

  const message =
    storageError.reason === "quota"
      ? t("storageQuotaError") ||
        "Storage is full. Export your data as backup and free space before continuing — the last change was NOT saved."
      : t("storageWriteError") ||
        "The last change could not be saved to this device. Please reload or export your data.";

  return (
    <div
      role="alert"
      style={{
        background: "#b91c1c",
        color: "white",
        padding: "12px 16px",
        margin: 0,
        fontSize: "14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        position: "sticky",
        top: 0,
        zIndex: 9999,
      }}
    >
      <span>{message}</span>
      <button
        onClick={clearStorageError}
        style={{
          background: "rgba(255,255,255,0.2)",
          color: "white",
          border: "1px solid white",
          padding: "4px 10px",
          borderRadius: "4px",
          cursor: "pointer",
          minHeight: "32px",
        }}
      >
        {t("dismiss") || "Dismiss"}
      </button>
    </div>
  );
};
