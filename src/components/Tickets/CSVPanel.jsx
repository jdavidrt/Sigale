import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileExport,
  faFileImport,
  faCopy,
  faCheck,
  faXmark,
  faTriangleExclamation
} from "@fortawesome/free-solid-svg-icons";
import { useEvent } from "../../context/EventContext";
import { useTickets } from "../../context/TicketContext";
import { useLanguage } from "../../context/LanguageContext";
import { ticketsToCSV, csvToTickets, isValidTicketType } from "../../utils/csvUtils";

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
    setMode('export');
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
    setMode('import');
    setResult(null);
    setParseErrors([]);
  };

  const validateAndParseCSV = () => {
    const { tickets, errors } = csvToTickets(csvText);

    // Validate ticket types against event configuration
    const typeErrors = [];
    const validTickets = tickets.filter(ticket => {
      if (!isValidTicketType(ticket.ticketType, event.ticketTypes)) {
        typeErrors.push(`${ticket.buyerName}: Invalid ticket type "${ticket.ticketType}"`);
        return false;
      }
      return true;
    });

    setParseErrors([...errors, ...typeErrors]);

    // Only return valid tickets if there are no parsing errors
    if (errors.length === 0 && validTickets.length > 0) {
      return validTickets;
    }
    return null;
  };

  const handleImport = async () => {
    const validTickets = validateAndParseCSV();

    if (!validTickets || validTickets.length === 0) {
      return;
    }

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

  // Button styles following STYLE_GUIDE.md
  const buttonStyle = {
    padding: '8px 16px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #758BFD, #BEADFF)',
    border: 'none',
    color: 'rgba(0, 0, 0, 0.75)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: 'rgba(117, 139, 253, 0.1)',
    border: '1px solid rgba(117, 139, 253, 0.3)',
    color: '#758BFD'
  };

  if (mode === null) {
    return (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
        <button
          onClick={handleExport}
          style={buttonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <FontAwesomeIcon icon={faFileExport} />
          {t("csvExport")}
        </button>
        <button
          onClick={handleImportMode}
          style={secondaryButtonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <FontAwesomeIcon icon={faFileImport} />
          {t("csvImport")}
        </button>
      </div>
    );
  }

  return (
    <div
      className="glass-elevated"
      style={{
        borderRadius: '16px',
        padding: '12px',
        marginTop: '16px'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 className="text-heading" style={{ fontSize: '18px', margin: 0 }}>
          {mode === 'export' ? t("csvExport") : t("csvImportNewTickets")}
        </h3>
        <button
          onClick={handleClose}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      {/* CSV Textarea */}
      <textarea
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        placeholder={mode === 'import' ? t("csvPasteHere") : ''}
        readOnly={mode === 'export'}
        style={{
          width: '100%',
          minHeight: '120px',
          padding: '12px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(117, 139, 253, 0.15)',
          color: '#E2D1B9',
          fontSize: '12px',
          fontFamily: 'monospace',
          resize: 'vertical',
          marginBottom: '8px',
          boxSizing: 'border-box'
        }}
      />

      {/* Errors */}
      {parseErrors.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '8px 12px',
          marginBottom: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <FontAwesomeIcon icon={faTriangleExclamation} style={{ color: '#ef4444' }} />
            <span style={{ color: '#ef4444', fontWeight: '600' }}>{t("csvImportErrors")}</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#ef4444', fontSize: '12px' }}>
            {parseErrors.slice(0, 5).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
            {parseErrors.length > 5 && (
              <li>...and {parseErrors.length - 5} more</li>
            )}
          </ul>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div style={{
          background: 'rgba(74, 222, 128, 0.1)',
          border: '1px solid rgba(74, 222, 128, 0.3)',
          borderRadius: '12px',
          padding: '8px 12px',
          marginBottom: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FontAwesomeIcon icon={faCheck} style={{ color: '#4ade80' }} />
            <span style={{ color: '#4ade80', fontWeight: '600' }}>{t("csvImportSuccess")}</span>
          </div>
          <p style={{ margin: '4px 0 0', color: '#4ade80', fontSize: '14px' }}>
            {result.added} {t("csvTicketsAdded")}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        {mode === 'export' && (
          <button
            onClick={handleCopyToClipboard}
            style={{
              ...buttonStyle,
              background: copied
                ? 'linear-gradient(135deg, #4ade80, #22c55e)'
                : 'linear-gradient(135deg, #758BFD, #BEADFF)'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
            {copied ? t("csvCopied") : t("csvExport")}
          </button>
        )}

        {mode === 'import' && (
          <button
            onClick={handleImport}
            disabled={importing || !csvText.trim()}
            style={{
              ...buttonStyle,
              opacity: (importing || !csvText.trim()) ? 0.5 : 1,
              cursor: (importing || !csvText.trim()) ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!importing && csvText.trim()) {
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <FontAwesomeIcon icon={faFileImport} />
            {importing ? '...' : t("csvImportButton")}
          </button>
        )}
      </div>
    </div>
  );
};
