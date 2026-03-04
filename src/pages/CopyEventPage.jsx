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
  const { t, language } = useLanguage();
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

  // PDF Export Attendance Sheet
  const handleExportAttendancePDF = async (t, language) => {
    const jsPDF = (await import('jspdf')).jsPDF;
    // Minimal margins
    const doc = new jsPDF({ margin: 8 });

    // Table headers (bilingual)
    const headers = [
      t('buyerName'),
      t('idNumber'),
      t('ticketType'),
      `${t('attendance') || (language === 'es' ? 'Asistencia' : 'Attendance')}`
    ];

    // Event info
    const eventTitle = event?.name || t('eventName');
    const eventVenue = event?.venue || t('venue');
    const eventDate = event?.date || t('date');

    // Helper: Get ticket price
    const getPrice = (ticket) => event?.ticketTypes?.[ticket.ticketType] || 0;

    // Split tickets
    const paidTickets = tickets.filter(ticket => getPrice(ticket) > 0);
    const courtesyTickets = tickets.filter(ticket => getPrice(ticket) === 0);

    // Helper: Wrap long names
    function wrapText(text, maxLen) {
      if (!text) return [''];
      if (text.length <= maxLen) return [text];
      // Try to break at space
      const idx = text.lastIndexOf(' ', maxLen);
      if (idx > 0) return [text.slice(0, idx), text.slice(idx + 1)];
      return [text.slice(0, maxLen), text.slice(maxLen)];
    }

    // Helper: Draw table with correct pagination
    function drawTable(startY, ticketsArr, title) {
      let left = 8;
      let colWidths = [95, 30, 37, 22]; // Buyer Name, ID, Ticket Type (wider), Attendance
      let headerHeight = 10;
      let y = startY;
      // Estimate max rows per page (average row height 10, but may be 18 for double-line names)
      const maxPageHeight = 250;
      let pageIdx = 0;
      let i = 0;
      while (i < ticketsArr.length) {
        if (pageIdx > 0) {
          doc.addPage();
          y = startY;
        }
        doc.setFontSize(15);
        doc.text(title, left, y);
        y += 7;
        doc.setFontSize(11);
        doc.text(`${t('venue')}: ${eventVenue}`, left, y);
        y += 6;
        doc.text(`${t('date')}: ${eventDate}`, left, y);
        y += 8;
        // Table headers
        doc.setFontSize(10);
        doc.setFillColor(230, 230, 230);
        doc.rect(left, y, colWidths.reduce((a, b) => a + b), headerHeight, 'F');
        let x = left;
        // Attendance header: center text in its cell
        headers.forEach((h, idx) => {
          if (idx === 3) {
            doc.text(h, x + colWidths[idx] / 2, y + 7, { align: 'center' });
          } else {
            doc.text(h, x + 2, y + 7);
          }
          x += colWidths[idx];
        });
        y += headerHeight;
        // Table rows for this page
        let pageHeight = 0;
        let startI = i;
        while (i < ticketsArr.length && pageHeight < maxPageHeight) {
          let ticket = ticketsArr[i];
          let nameLines = wrapText(ticket.buyerName || '', 32);
          let typeLines = wrapText((ticket.ticketType || '').toUpperCase(), 14);
          let maxLines = Math.max(nameLines.length, typeLines.length);
          let rowHeight = maxLines > 1 ? 18 : 10;
          let rowY = y + pageHeight;
          // Alternating row color
          if ((i - startI) % 2 === 1) {
            doc.setFillColor(245, 245, 245);
            doc.rect(left, rowY, colWidths.reduce((a, b) => a + b), rowHeight, 'F');
          }
          // Attendee name: larger font
          doc.setFontSize(13);
          doc.text(nameLines[0], left + 2, rowY + 7);
          if (nameLines[1]) doc.text(nameLines[1], left + 2, rowY + 15);
          // Other columns
          doc.setFontSize(10);
          doc.text(ticket.buyerId || '', left + colWidths[0] + 2, rowY + 7);
          doc.setFontSize(9);
          let typeX = left + colWidths[0] + colWidths[1] + 2;
          doc.text(typeLines[0], typeX, rowY + 7);
          if (typeLines[1]) doc.text(typeLines[1], typeX, rowY + 15);
          doc.setFontSize(10);
          // Attendance: smaller square
          doc.rect(left + colWidths[0] + colWidths[1] + colWidths[2] + 2, rowY + 4, 4, 4);
          pageHeight += rowHeight;
          i++;
        }
        pageIdx++;
      }
    }

    // Page 1: Paid tickets
    drawTable(12, paidTickets, `${eventTitle} - ${t('attendanceSheet') || (language === 'es' ? 'Hoja de Asistencia' : 'Attendance Sheet')}`);

    // Page 2: Courtesy tickets (if any)
    if (courtesyTickets.length > 0) {
      doc.addPage();
      drawTable(12, courtesyTickets, `${eventTitle} - ${t('artistCourtesy') || (language === 'es' ? 'Artista/Cortesía' : 'Artist/Courtesy')}`);
    }

    doc.save(`${eventTitle}-attendance-${new Date().toISOString().split('T')[0]}.pdf`);
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
                <span className={s.actionBtnLabel}>{copied ? t('copiedToClipboard') : t('copyJSON') || 'COPY JSON'}</span>
              </button>
              <button
                onClick={handleDownloadJSON}
                className={`glass-clean ${s.actionBtn} ${s.actionBtnDownload}`}
              >
                <FontAwesomeIcon icon={faDownload} size="lg" />
                <span className={s.actionBtnLabel}>{t('downloadJSON') || 'DOWNLOAD JSON'}</span>
              </button>
              <button
                onClick={handleCopyCSV}
                className={`glass-clean ${s.actionBtn} ${s.actionBtnCSV} ${copiedCSV ? s.copied : ""}`}
              >
                <FontAwesomeIcon icon={faFileCsv} size="lg" />
                <span className={s.actionBtnLabel}>{copiedCSV ? t('copiedToClipboard') : t('copyCSV') || 'COPY CSV'}</span>
              </button>
              <button
                onClick={handleDownloadCSV}
                className={`glass-clean ${s.actionBtn} ${s.actionBtnDownload}`}
              >
                <FontAwesomeIcon icon={faDownload} size="lg" />
                <span className={s.actionBtnLabel}>{t('downloadCSV') || 'DOWNLOAD CSV'}</span>
              </button>
              {/* Full-page PDF Export Button */}
              <button
                onClick={() => handleExportAttendancePDF(t, language)}
                className={`glass-clean ${s.actionBtn} ${s.actionBtnPDF}`}
              >
                <FontAwesomeIcon icon={faDownload} size="lg" />
                <span className={s.actionBtnLabel}>{t('exportAttendanceSheet') || (language === 'es' ? 'Exportar Hoja de Asistencia' : 'Export Attendance Sheet')}</span>
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
