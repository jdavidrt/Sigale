import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileExport,
  faFileImport,
  faCopy,
  faCheck,
  faXmark,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { useEvent } from "../../context/EventContext";
import { useTickets } from "../../context/TicketContext";
import { useLanguage } from "../../context/LanguageContext";
import { ticketsToCSV, csvToTickets, isValidTicketType } from "../../utils/csvUtils";
import s from "./CSVPanel.module.css";
import btn from "../Common/Button.module.css";

export const CSVPanel = ({ filteredTickets }) => {
  const { event } = useEvent();
  const { addTicketsFromCSV } = useTickets();
  const { t } = useLanguage();

  const [mode, setMode] = useState(null); // null | 'export' | 'import'
  const [csvText, setCsvText] = useState("");
  const [copied, setCopied] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [parseErrors, setParseErrors] = useState([]);

  const handleExport = () => {
    const csv = ticketsToCSV(filteredTickets);
    setCsvText(csv);
    setMode("export");
    setResult(null);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(csvText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleImportMode = () => {
    setCsvText("");
    setMode("import");
    setResult(null);
    setParseErrors([]);
  };

  const validateAndParseCSV = () => {
    const { tickets, errors } = csvToTickets(csvText);
    const typeErrors = [];
    const validTickets = tickets.filter((ticket) => {
      if (!isValidTicketType(ticket.ticketType, event.ticketTypes)) {
        typeErrors.push(`${ticket.buyerName}: Invalid ticket type "${ticket.ticketType}"`);
        return false;
      }
      return true;
    });
    setParseErrors([...errors, ...typeErrors]);
    if (errors.length === 0 && validTickets.length > 0) return validTickets;
    return null;
  };

  const handleImport = async () => {
    const validTickets = validateAndParseCSV();
    if (!validTickets || validTickets.length === 0) return;
    setImporting(true);
    try {
      const importResult = await addTicketsFromCSV(validTickets);
      setResult(importResult);
      setCsvText("");
    } catch (err) {
      setParseErrors([err.message]);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setMode(null);
    setCsvText("");
    setResult(null);
    setParseErrors([]);
  };

  if (mode === null) {
    return (
      <div className={s.triggerRow}>
        <button onClick={handleExport} className={`${btn.btn} ${btn.primary} ${btn.md}`}>
          <FontAwesomeIcon icon={faFileExport} />
          {t("csvExport")}
        </button>
        <button onClick={handleImportMode} className={`${btn.btn} ${btn.secondary} ${btn.md}`}>
          <FontAwesomeIcon icon={faFileImport} />
          {t("csvImport")}
        </button>
      </div>
    );
  }

  return (
    <div className={`glass-elevated ${s.panel}`}>
      {/* Header */}
      <div className={s.panelHeader}>
        <h3 className={s.panelTitle}>
          {mode === "export" ? t("csvExport") : t("csvImportNewTickets")}
        </h3>
        <button onClick={handleClose} className={s.closeBtn}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      {/* CSV Textarea */}
      <textarea
        className={s.csvTextarea}
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        placeholder={mode === "import" ? t("csvPasteHere") : ""}
        readOnly={mode === "export"}
      />

      {/* Errors */}
      {parseErrors.length > 0 && (
        <div className={s.errorBox}>
          <div className={s.errorHeader}>
            <FontAwesomeIcon icon={faTriangleExclamation} />
            <span>{t("csvImportErrors")}</span>
          </div>
          <ul className={s.errorList}>
            {parseErrors.slice(0, 5).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
            {parseErrors.length > 5 && <li>...and {parseErrors.length - 5} more</li>}
          </ul>
        </div>
      )}

      {/* Success */}
      {result && (
        <div className={s.successBox}>
          <div className={s.successHeader}>
            <FontAwesomeIcon icon={faCheck} />
            <span>{t("csvImportSuccess")}</span>
          </div>
          <p className={s.successMessage}>
            {result.added} {t("csvTicketsAdded")}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className={s.actions}>
        {mode === "export" && (
          <button
            onClick={handleCopyToClipboard}
            className={`${btn.btn} ${copied ? btn.success : btn.primary} ${btn.md}`}
          >
            <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
            {copied ? t("csvCopied") : t("csvExport")}
          </button>
        )}

        {mode === "import" && (
          <button
            onClick={handleImport}
            disabled={importing || !csvText.trim()}
            className={`${btn.btn} ${btn.primary} ${btn.md}`}
          >
            <FontAwesomeIcon icon={faFileImport} />
            {importing ? "..." : t("csvImportButton")}
          </button>
        )}
      </div>
    </div>
  );
};
