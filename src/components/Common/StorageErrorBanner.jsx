import { useTickets } from "../../context/TicketContext";
import { useLanguage } from "../../context/LanguageContext";
import s from "./StorageErrorBanner.module.css";

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
    <div role="alert" className={s.banner}>
      <span>{message}</span>
      <button onClick={clearStorageError} className={s.dismissBtn}>
        {t("dismiss") || "Dismiss"}
      </button>
    </div>
  );
};
