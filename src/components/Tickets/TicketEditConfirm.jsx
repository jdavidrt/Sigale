import { useLanguage } from "../../context/LanguageContext";
import btn from "../Common/Button.module.css";
import s from "./TicketEditConfirm.module.css";

const FIELD_KEYS = [
  ["buyerName", "colName"],
  ["buyerId", "colId"],
  ["buyerPhone", "colPhone"],
  ["ticketType", "colType"],
  ["checkedIn", "colStatus"],
];

const formatStatus = (checkedIn, t) =>
  checkedIn ? t("statusCheckedIn") : t("statusPending");

/**
 * Body content for the row-commit modal. Renders a diff list of changed
 * fields (original strikethrough, new highlighted), plus Cancel/Save buttons.
 *
 * The parent (DialogProvider's openCustom) supplies `close()`. Save calls
 * `onConfirm()` which the row's commit handler wires to updateTicket().
 *
 * @param {object} props
 * @param {Object} props.ticket   - Current ticket (the "before" values)
 * @param {Object} props.draft    - Draft values from edit mode (the "after" values)
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 */
export const TicketEditConfirm = ({ ticket, draft, onConfirm, onCancel }) => {
  const { t } = useLanguage();

  // Build the list of changed fields. We intentionally don't list unchanged
  // ones — the modal is a diff, not a re-display of the whole record.
  const changes = FIELD_KEYS
    .map(([key, labelKey]) => ({ key, labelKey, before: ticket[key], after: draft[key] }))
    .filter((c) => c.before !== c.after);

  const renderValue = (key, value) => {
    if (key === "checkedIn") return formatStatus(value, t);
    return value !== undefined && value !== null && value !== "" ? String(value) : <span className={s.empty}>—</span>;
  };

  return (
    <>
      <h2 className={s.confirmTitle}>
        {t("editConfirmTitle")}
      </h2>
      <p className={s.subject}>
        {t("editConfirmFor").replace("{buyer}", ticket.buyerName)}
      </p>
      <p className={s.intro}>{t("editConfirmBody")}</p>

      {changes.length === 0 ? (
        <p className={s.empty}>{t("editNoChanges")}</p>
      ) : (
        <div className={s.diffList}>
          {changes.map(({ key, labelKey, before, after }) => (
            <div key={key} className={s.diffRow}>
              <span className={s.fieldLabel}>{t(labelKey)}</span>
              <span>
                <span className={s.fieldValueOld}>{renderValue(key, before)}</span>
                {"  →  "}
                <span className={s.fieldValueNew}>{renderValue(key, after)}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className={s.confirmActions}>
        <button type="button" className={`${btn.btn} ${btn.secondary} ${btn.md}`} onClick={onCancel}>
          {t("cancel")}
        </button>
        <button
          type="button"
          className={`${btn.btn} ${btn.primary} ${btn.md}`}
          onClick={onConfirm}
          disabled={changes.length === 0}
        >
          {t("saveChanges")}
        </button>
      </div>
    </>
  );
};
