import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faCheck, faXmark, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../../context/LanguageContext";
import { useDialog } from "../../context/DialogContext";
import { guestPasses } from "../../api/guestPasses";
import s from "./GuestPassTable.module.css";

const TYPE_KEYS = {
  artist: "guestPassTypeArtist",
  crew: "guestPassTypeCrew",
  courtesy: "guestPassTypeCourtesy",
};

/**
 * One row in the editable guest-pass table. Same edit lifecycle as
 * TicketTableRow (idle -> edit -> commit/cancel), but without the
 * diff-confirm modal step: unlike a ticket edit, a guest-pass edit has
 * no payment/QR consequence, so a direct save is enough.
 */
export const GuestPassTableRow = ({ pass, bandOptions, onChanged }) => {
  const { t } = useLanguage();
  const { confirm, notify } = useDialog();

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const firstInputRef = useRef(null);

  const startEdit = () => {
    setDraft({
      band: pass.band,
      holderName: pass.holderName,
      holderIdNumber: pass.holderIdNumber,
      type: pass.type,
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDraft(null);
  };

  useEffect(() => {
    if (isEditing && firstInputRef.current) {
      firstInputRef.current.focus();
      firstInputRef.current.select?.();
    }
  }, [isEditing]);

  const setField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const commit = async () => {
    if (!draft) return;
    if (!draft.band.trim() || !draft.holderName.trim() || !draft.holderIdNumber.trim()) {
      notify({ message: t("guestPassNameInvalid"), tone: "error" });
      return;
    }
    try {
      await guestPasses.update(pass.id, draft);
      notify({ message: t("guestPassUpdatedToast"), tone: "success" });
      setIsEditing(false);
      setDraft(null);
      onChanged();
    } catch (err) {
      notify({ message: err.message || t("error"), tone: "error" });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (e.target.tagName === "SELECT") return;
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

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

  return (
    <div className={s.row} data-editing={isEditing}>
      {/* Edit-control cell (leftmost) */}
      <div className={`${s.cell} ${s.editControlCell}`}>
        {isEditing ? (
          <>
            <button
              type="button"
              className={`${s.iconBtn} ${s.iconBtnSuccess}`}
              onClick={commit}
              title={t("rowEditCommit")}
              aria-label={t("rowEditCommit")}
            >
              <FontAwesomeIcon icon={faCheck} />
            </button>
            <button
              type="button"
              className={`${s.iconBtn} ${s.iconBtnGhost}`}
              onClick={cancelEdit}
              title={t("rowEditCancel")}
              aria-label={t("rowEditCancel")}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </>
        ) : (
          <button
            type="button"
            className={`${s.iconBtn} ${s.iconBtnPrimary}`}
            onClick={startEdit}
            title={t("rowEditStart")}
            aria-label={t("rowEditStart")}
          >
            <FontAwesomeIcon icon={faPenToSquare} />
          </button>
        )}
      </div>

      {/* Band */}
      <div className={s.cell}>
        {isEditing ? (
          bandOptions.length > 0 ? (
            <select
              ref={firstInputRef}
              className={s.cellSelect}
              value={draft.band}
              onChange={(e) => setField("band", e.target.value)}
              onKeyDown={handleKeyDown}
            >
              {!bandOptions.includes(draft.band) && <option value={draft.band}>{draft.band}</option>}
              {bandOptions.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          ) : (
            <input
              ref={firstInputRef}
              className={s.cellInput}
              type="text"
              value={draft.band}
              onChange={(e) => setField("band", e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={160}
            />
          )
        ) : (
          <span>{pass.band}</span>
        )}
      </div>

      {/* Name */}
      <div className={s.cell}>
        {isEditing ? (
          <input
            className={s.cellInput}
            type="text"
            value={draft.holderName}
            onChange={(e) => setField("holderName", e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={160}
          />
        ) : (
          <span>{pass.holderName}</span>
        )}
      </div>

      {/* ID */}
      <div className={s.cell}>
        {isEditing ? (
          <input
            className={s.cellInput}
            type="text"
            value={draft.holderIdNumber}
            onChange={(e) => setField("holderIdNumber", e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={40}
          />
        ) : (
          <span>{pass.holderIdNumber}</span>
        )}
      </div>

      {/* Type */}
      <div className={s.cell}>
        {isEditing ? (
          <select
            className={s.cellSelect}
            value={draft.type}
            onChange={(e) => setField("type", e.target.value)}
            onKeyDown={handleKeyDown}
          >
            {Object.entries(TYPE_KEYS).map(([value, key]) => (
              <option key={value} value={value}>{t(key)}</option>
            ))}
          </select>
        ) : (
          <span className={s.typeBadge}>{t(TYPE_KEYS[pass.type])}</span>
        )}
      </div>

      {/* Actions (delete) */}
      <div className={`${s.cell} ${s.actionsCell}`}>
        <button
          type="button"
          className={`${s.iconBtn} ${s.iconBtnDanger}`}
          onClick={handleDelete}
          disabled={isEditing}
          title={t("delete")}
          aria-label={t("delete")}
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    </div>
  );
};
