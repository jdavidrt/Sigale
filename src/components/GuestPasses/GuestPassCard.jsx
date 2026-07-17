import { useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash, faImage, faShareNodes } from "@fortawesome/free-solid-svg-icons";
import { useEvent } from "../../context/EventContext";
import { useLanguage } from "../../context/LanguageContext";
import { useDialog } from "../../context/DialogContext";
import { guestPasses } from "../../api/guestPasses";
import { copyGuestPassPNG, shareGuestPass } from "../../utils/guestPassImage";
import s from "./GuestPassCard.module.css";

const TYPE_KEYS = {
  artist: "guestPassTypeArtist",
  crew: "guestPassTypeCrew",
  courtesy: "guestPassTypeCourtesy",
};

/**
 * Card view for one guest pass — mirrors TicketCard's layout and 2×2
 * action grid, but with no QR: guest passes have no validationHash by
 * design, so copy/share render the badge variant of the ticket image.
 */
export const GuestPassCard = ({ pass, onEdit, onChanged }) => {
  const { event } = useEvent();
  const { t, language } = useLanguage();
  const { confirm, notify } = useDialog();
  const [copyStatus, setCopyStatus] = useState("");

  const handleDelete = async () => {
    const ok = await confirm({
      title: t("deleteGuestPassTitle"),
      message: t("deleteGuestPassBody").replace("{name}", pass.holderName),
      confirmLabel: t("delete"),
      cancelLabel: t("cancel"),
      danger: true,
    });
    if (!ok) return;
    try {
      await guestPasses.remove(pass.id);
      notify({ message: t("guestPassDeletedToast"), tone: "info" });
      onChanged();
    } catch (err) {
      notify({ message: err.message || t("error"), tone: "error" });
    }
  };

  const copyAsPNG = useCallback(async () => {
    const success = await copyGuestPassPNG(pass, event);
    setCopyStatus(success ? `✓ ${t("copiedToClipboard")}` : `✗ ${t("copyFailed")}`);
    setTimeout(() => setCopyStatus(""), 2000);
  }, [pass, event, t]);

  const handleShare = useCallback(async () => {
    const success = await shareGuestPass(pass, event, language);
    if (!success) {
      setCopyStatus(t("shareNotSupported"));
      setTimeout(() => setCopyStatus(""), 2000);
    }
  }, [pass, event, language, t]);

  return (
    <div className={`glass-clean ${s.card} hover-lift`}>
      <div className={s.inner}>
        {/* Left — pass info */}
        <div className={s.info}>
          <div className={s.nameRow}>
            <h3 className={s.holderName}>{pass.holderName}</h3>
          </div>

          <div className={s.details}>
            <div className={s.detailRow}>
              <p className={s.band}>{pass.band}</p>
              <span className={s.typeBadge}>{t(TYPE_KEYS[pass.type])}</span>
            </div>
            <div className={s.detailRow}>
              <p className={s.holderId}>{pass.holderIdNumber}</p>
            </div>
          </div>
        </div>

        {/* Right — 2×2 action buttons */}
        <div className={s.actions}>
          <div className={s.actionRow}>
            <button
              onClick={() => onEdit(pass)}
              className={`${s.actionBtn} ${s.editBtn}`}
              title={t("rowEditStart")}
              aria-label={t("rowEditStart")}
            >
              <FontAwesomeIcon icon={faPenToSquare} />
            </button>
            <button
              onClick={handleDelete}
              className={`${s.actionBtn} ${s.deleteBtn}`}
              title={t("delete")}
              aria-label={t("delete")}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
          <div className={s.actionRow}>
            <button
              onClick={copyAsPNG}
              className={`${s.actionBtn} ${s.copyBtn}`}
              title="Copy as PNG"
              aria-label="Copy as PNG"
            >
              <FontAwesomeIcon icon={faImage} />
            </button>
            <button
              onClick={handleShare}
              className={`${s.actionBtn} ${s.shareBtn}`}
              title={t("share")}
              aria-label={t("share")}
            >
              <FontAwesomeIcon icon={faShareNodes} />
            </button>
          </div>
        </div>
      </div>

      {/* Copy status overlay */}
      {copyStatus && <div className={s.copyOverlay}>{copyStatus}</div>}
    </div>
  );
};
