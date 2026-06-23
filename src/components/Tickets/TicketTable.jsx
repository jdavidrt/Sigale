import { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaste, faCircleCheck, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { useEvent } from "../../context/EventContext";
import { useTickets } from "../../context/TicketContext";
import { useLanguage } from "../../context/LanguageContext";
import { parseTicketRows } from "../../utils/ticketPasteParser";
import { toLocalDateString } from "../../utils/timeFormat";
import { TicketTableRow } from "./TicketTableRow";
import s from "./TicketTable.module.css";
import btn from "../Common/Button.module.css";

/**
 * Editable spreadsheet view of tickets with paste-to-add support.
 *
 * Paste flow:
 *   1. User picks a default ticket type in the toolbar.
 *   2. Clicks "Paste Tickets" → reads clipboard text.
 *   3. parseTicketRows() splits each line into {name, id} (TSV-aware,
 *      Latin-script-aware, handles "C.C." / "Nombre:" prefixes).
 *   4. We map parsed rows into ticket objects (default type, today's
 *      purchase date, phone='000') and pipe through addTicketsFromCSV()
 *      so the existing dedup + hashing + length-cap pipeline runs.
 */
export const TicketTable = ({ tickets }) => {
  const { event } = useEvent();
  const { addTicketsFromCSV } = useTickets();
  const { t } = useLanguage();

  const ticketTypes = useMemo(() => Object.keys(event?.ticketTypes ?? {}), [event]);
  const [defaultType, setDefaultType] = useState(() => ticketTypes[0] ?? "");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState(null); // { tone: 'success'|'error', text }

  // Keep the default-type select in sync if event.ticketTypes changes
  // while the table is mounted (e.g., user edits event in another tab).
  if (defaultType && !ticketTypes.includes(defaultType) && ticketTypes[0]) {
    setDefaultType(ticketTypes[0]);
  }

  const showBanner = (tone, text) => {
    setBanner({ tone, text });
    // Banners are informational; auto-dismiss so they don't pile up.
    setTimeout(() => setBanner(null), 6000);
  };

  const handlePaste = async () => {
    if (!defaultType) {
      showBanner("error", t("selectTypeFirst"));
      return;
    }

    let text;
    try {
      text = await navigator.clipboard.readText();
    } catch {
      showBanner("error", t("pasteFailed"));
      return;
    }

    const parsed = parseTicketRows(text);
    if (parsed.length === 0) {
      showBanner("error", t("pasteEmpty"));
      return;
    }

    // Count rows the parser dropped so we can report "K ignored".
    const totalCandidateRows = text.split(/\r?\n/).map((r) => r.trim()).filter(Boolean).length;
    const ignoredRows = Math.max(0, totalCandidateRows - parsed.length);

    const purchaseDate = toLocalDateString();
    const ticketRows = parsed.map(({ name, id }) => ({
      buyerName: name,
      buyerId: id,
      buyerPhone: "000",
      ticketType: defaultType,
      purchaseDate,
    }));

    setBusy(true);
    try {
      const result = await addTicketsFromCSV(ticketRows);
      const parts = [t("pasteResultAdded").replace("{n}", result.added)];
      if (result.skipped > 0) parts.push(t("pasteResultSkipped").replace("{n}", result.skipped));
      if (ignoredRows > 0) parts.push(t("pasteResultIgnored").replace("{n}", ignoredRows));
      showBanner("success", parts.join(" · "));
    } catch (err) {
      console.error("Paste import failed:", err);
      showBanner("error", err.message || t("pasteFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`glass-elevated ${s.panel}`}>
      {/* Toolbar */}
      <div className={s.toolbar}>
        <div className={s.toolbarLeft}>
          <div className={s.typePicker}>
            <label className={s.typeLabel} htmlFor="default-type-select">
              {t("defaultTypeForPasted")}
            </label>
            <select
              id="default-type-select"
              className={s.typeSelect}
              value={defaultType}
              onChange={(e) => setDefaultType(e.target.value)}
              disabled={ticketTypes.length === 0}
            >
              {ticketTypes.length === 0 && (
                <option value="">—</option>
              )}
              {ticketTypes.map((type) => (
                <option key={type} value={type}>
                  {type.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={s.toolbarRight}>
          <button
            type="button"
            onClick={handlePaste}
            disabled={busy || !defaultType}
            className={`${btn.btn} ${btn.primary} ${btn.md}`}
          >
            <FontAwesomeIcon icon={faPaste} />
            {busy ? "…" : t("pasteTickets")}
          </button>
        </div>
      </div>

      <p className={s.hint}>{t("pasteTicketsHint")}</p>

      {/* Result banner */}
      {banner && (
        <div className={s.resultBanner} data-tone={banner.tone} role="status">
          <FontAwesomeIcon icon={banner.tone === "success" ? faCircleCheck : faTriangleExclamation} />
          <span>{banner.text}</span>
        </div>
      )}

      {/* Table */}
      {tickets.length === 0 ? (
        <div className={s.empty}>{t("tableEmpty")}</div>
      ) : (
        <div className={s.scrollWrap}>
          <div className={s.table} role="table">
            {/* Header — leftmost cell is the edit-control column (no label, kept blank for visual breathing room) */}
            <div className={s.headerCell} aria-hidden="true"></div>
            <div className={s.headerCell}>{t("colName")}</div>
            <div className={s.headerCell}>{t("colId")}</div>
            <div className={s.headerCell}>{t("colPhone")}</div>
            <div className={s.headerCell}>{t("colDelivery")}</div>
            <div className={s.headerCell}>{t("colType")}</div>
            <div className={s.headerCell}>{t("colStatus")}</div>
            <div className={s.headerCell}>{t("colActions")}</div>

            {/* Rows */}
            {tickets.map((ticket) => (
              <TicketTableRow key={ticket.ticketId} ticket={ticket} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
