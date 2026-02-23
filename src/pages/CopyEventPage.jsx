import { useState } from "react";
import { useEvent } from "../context/EventContext";
import { useTickets } from "../context/TicketContext";
import { useLanguage } from "../context/LanguageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faDownload, faFileCode, faFileCsv, faInfoCircle, faChevronDown, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import s from "./CopyEventPage.module.css";

export const CopyEventPage = () => {
  const { event } = useEvent();
  const { tickets } = useTickets();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [copiedCSV, setCopiedCSV] = useState(false);
  const [showJSON, setShowJSON] = useState(false);

  const eventData = { event, tickets };

  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(eventData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(eventData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event?.name || "event"}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateCSVContent = () => {
    const headers = ["Buyer Name", "Buyer ID", "Buyer Phone", "Ticket Type", "Purchase Date", "Ticket Price"];
    const rows = tickets.map((ticket) => {
      const price = event?.ticketTypes?.[ticket.ticketType] || 0;
      return [ticket.buyerName, ticket.buyerId, ticket.buyerPhone, ticket.ticketType, ticket.purchaseDate, price];
    });
    return [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");
  };

  const handleCopyCSV = async () => {
    try {
      await navigator.clipboard.writeText(generateCSVContent());
      setCopiedCSV(true);
      setTimeout(() => setCopiedCSV(false), 3000);
    } catch (error) {
      console.error("Failed to copy CSV:", error);
    }
  };

  const handleDownloadCSV = () => {
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + generateCSVContent()], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event?.name || "event"}-tickets-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!event) return null;

  return (
    <div className={s.page}>
      <div className={s.container}>
        <div className={`glass-elevated shadow-floating ${s.mainCard}`}>
          {/* Header */}
          <div className={s.cardHeader}>
            <div className={s.cardHeaderRow}>
              <div className="icon-box">
                <FontAwesomeIcon icon={faCopy} style={{ color: "white", fontSize: "14px" }} />
              </div>
              <h1 className={s.cardTitle}>Copy Event Data</h1>
            </div>
            <p className={s.cardSubtitle}>Backup or transfer your event and ticket data</p>
          </div>

          <div className={s.cardContent}>
            {/* Event Summary */}
            <div className={`glass-clean ${s.summaryGrid}`}>
              <div>
                <p className={s.summaryLabel}>EVENT</p>
                <p className={s.summaryValue} style={{ fontWeight: "bold" }}>{event.name}</p>
              </div>
              <div>
                <p className={s.summaryLabel}>DATE</p>
                <p className={s.summaryValue}>{event.date}</p>
              </div>
              <div>
                <p className={s.summaryLabel}>VENUE</p>
                <p className={s.summaryValue}>{event.venue}</p>
              </div>
              <div>
                <p className={s.summaryLabel}>TOTAL TICKETS</p>
                <p className={s.summaryCount}>{tickets.length}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={s.actionsGrid}>
              <button
                onClick={handleCopyJSON}
                className={`glass-clean ${s.actionBtn} ${s.actionBtnCopy} ${copied ? s.copied : ""}`}
              >
                <FontAwesomeIcon icon={faFileCode} size="lg" />
                <span className={s.actionBtnLabel}>{copied ? "COPIED!" : "COPY JSON"}</span>
              </button>
              <button
                onClick={handleDownloadJSON}
                className={`glass-clean ${s.actionBtn} ${s.actionBtnDownload}`}
              >
                <FontAwesomeIcon icon={faDownload} size="lg" />
                <span className={s.actionBtnLabel}>DOWNLOAD JSON</span>
              </button>
              <button
                onClick={handleCopyCSV}
                className={`glass-clean ${s.actionBtn} ${s.actionBtnCSV} ${copiedCSV ? s.copied : ""}`}
              >
                <FontAwesomeIcon icon={faFileCsv} size="lg" />
                <span className={s.actionBtnLabel}>{copiedCSV ? "COPIED!" : "COPY CSV"}</span>
              </button>
              <button
                onClick={handleDownloadCSV}
                className={`glass-clean ${s.actionBtn} ${s.actionBtnDownload}`}
              >
                <FontAwesomeIcon icon={faDownload} size="lg" />
                <span className={s.actionBtnLabel}>DOWNLOAD CSV</span>
              </button>
            </div>

            {/* JSON Preview */}
            <div className={`glass-clean ${s.previewSection}`}>
              <button onClick={() => setShowJSON(!showJSON)} className={s.previewToggle}>
                <span>DATA PREVIEW (JSON)</span>
                <FontAwesomeIcon icon={showJSON ? faChevronDown : faChevronRight} />
              </button>
              {showJSON && (
                <div className={s.previewBody}>
                  <div className={s.previewCode}>
                    <pre className={s.previewPre}>{JSON.stringify(eventData, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* Tip */}
            <div className={s.tipSection}>
              <div className={s.tipRow}>
                <FontAwesomeIcon icon={faInfoCircle} className="color-primary" style={{ marginTop: "3px" }} />
                <div className={s.tipContent}>
                  <p className={s.tipTitle}>Expert Tip</p>
                  <p className={s.tipText}>Use the JSON export to clone events on other devices. The CSV is perfect for Excel/Google Sheets analysis.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
