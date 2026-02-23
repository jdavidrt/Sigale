import { useState } from "react";
import { useEvent } from "../context/EventContext";
import { useTickets } from "../context/TicketContext";
import { useLanguage } from "../context/LanguageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faDownload, faFileCode, faFileCsv, faInfoCircle, faChevronDown, faChevronRight } from "@fortawesome/free-solid-svg-icons";

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
      const jsonString = JSON.stringify(eventData, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDownloadJSON = () => {
    const jsonString = JSON.stringify(eventData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
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
    const rows = tickets.map(ticket => {
      const ticketPrice = event?.ticketTypes?.[ticket.ticketType] || 0;
      return [ticket.buyerName, ticket.buyerId, ticket.buyerPhone, ticket.ticketType, ticket.purchaseDate, ticketPrice];
    });
    return [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
  };

  const handleCopyCSV = async () => {
    try {
      const csvContent = generateCSVContent();
      await navigator.clipboard.writeText(csvContent);
      setCopiedCSV(true);
      setTimeout(() => setCopiedCSV(false), 3000);
    } catch (error) {
      console.error("Failed to copy CSV:", error);
    }
  };

  const handleDownloadCSV = () => {
    const csvContent = generateCSVContent();
    const BOM = "\uFEFF";
    const csvWithBOM = BOM + csvContent;
    const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
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
    <div className="min-h-screen px-3 py-4 md:px-6">
      <style>{`
        .glass-clean { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .glass-elevated { background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.12); }
        .text-heading { font-size: 28px; font-weight: 600; line-height: 1.1; color: #E2D1B9; margin: 0; }
        .text-body { font-size: 18px; font-weight: 400; line-height: 1.1; color: #BEADFF; margin: 0; }
        .text-label { font-size: 14px; font-weight: 600; line-height: 1.1; text-transform: uppercase; color: #BEADFF; opacity: 1; margin: 0; }
        .shadow-floating { box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.10); }
      `}</style>

      <div className="max-w-4xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Main Card */}
        <div className="glass-elevated shadow-floating" style={{ borderRadius: '24px', padding: '4px', margin: '6px' }}>

          {/* Header */}
          <div style={{ padding: '12px 16px', background: 'rgba(117, 139, 253, 0.08)', borderRadius: '20px', marginBottom: '6px' }}>
            <div className="flex items-center gap-3 mb-2">
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #758BFD, #BEADFF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FontAwesomeIcon icon={faCopy} style={{ color: 'white', fontSize: '14px' }} />
              </div>
              <h1 className="text-heading" style={{ fontSize: '24px', paddingLeft: '8px' }}>Copy Event Data</h1>
            </div>
            <p className="text-body" style={{ fontSize: '14px', opacity: 0.7 }}>Backup or transfer your event and ticket data</p>
          </div>

          <div style={{ padding: '0 6px 6px 6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {/* Event Info Summary */}
            <div className="glass-clean" style={{ borderRadius: '18px', padding: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p className="text-label" style={{ fontSize: '10px', opacity: 0.6, marginBottom: '2px' }}>EVENT</p>
                  <p className="text-body" style={{ fontSize: '14px', fontWeight: 'bold' }}>{event.name}</p>
                </div>
                <div>
                  <p className="text-label" style={{ fontSize: '10px', opacity: 0.6, marginBottom: '2px' }}>DATE</p>
                  <p className="text-body" style={{ fontSize: '14px' }}>{event.date}</p>
                </div>
                <div>
                  <p className="text-label" style={{ fontSize: '10px', opacity: 0.6, marginBottom: '2px' }}>VENUE</p>
                  <p className="text-body" style={{ fontSize: '14px' }}>{event.venue}</p>
                </div>
                <div>
                  <p className="text-label" style={{ fontSize: '10px', opacity: 0.6, marginBottom: '2px' }}>TOTAL TICKETS</p>
                  <p className="text-heading" style={{ fontSize: '18px', color: '#758BFD' }}>{tickets.length}</p>
                </div>
              </div>
            </div>

            {/* Actions Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '6px' }}>
              <button onClick={handleCopyJSON} className={`p-4 rounded-xl font-bold transition-all flex flex-col items-center gap-2 ${copied ? 'bg-[#4ade80] text-black' : 'glass-clean text-[#758BFD] hover:bg-[#758BFD]/10'}`}>
                <FontAwesomeIcon icon={faFileCode} size="lg" />
                <span style={{ fontSize: '12px' }}>{copied ? 'COPIED!' : 'COPY JSON'}</span>
              </button>
              <button onClick={handleDownloadJSON} className="p-4 rounded-xl glass-clean text-[#E2D1B9] hover:bg-white/5 font-bold transition-all flex flex-col items-center gap-2">
                <FontAwesomeIcon icon={faDownload} size="lg" />
                <span style={{ fontSize: '12px' }}>DOWNLOAD JSON</span>
              </button>
              <button onClick={handleCopyCSV} className={`p-4 rounded-xl font-bold transition-all flex flex-col items-center gap-2 ${copiedCSV ? 'bg-[#4ade80] text-black' : 'glass-clean text-[#4ade80] hover:bg-[#4ade80]/10'}`}>
                <FontAwesomeIcon icon={faFileCsv} size="lg" />
                <span style={{ fontSize: '12px' }}>{copiedCSV ? 'COPIED!' : 'COPY CSV'}</span>
              </button>
              <button onClick={handleDownloadCSV} className="p-4 rounded-xl glass-clean text-[#E2D1B9] hover:bg-white/5 font-bold transition-all flex flex-col items-center gap-2">
                <FontAwesomeIcon icon={faDownload} size="lg" />
                <span style={{ fontSize: '12px' }}>DOWNLOAD CSV</span>
              </button>
            </div>

            {/* Preview Collapsible */}
            <div className="glass-clean" style={{ borderRadius: '18px', overflow: 'hidden' }}>
              <button onClick={() => setShowJSON(!showJSON)} className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all text-label" style={{ opacity: 1, fontSize: '12px' }}>
                <span>DATA PREVIEW (JSON)</span>
                <FontAwesomeIcon icon={showJSON ? faChevronDown : faChevronRight} />
              </button>
              {showJSON && (
                <div style={{ padding: '0 12px 12px 12px' }}>
                  <div className="bg-black/20 rounded-xl p-3 max-h-60 overflow-auto border border-white/5">
                    <pre style={{ fontSize: '10px', color: '#BEADFF', opacity: 0.7, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(eventData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Tips Section */}
            <div className="glass-clean" style={{ borderRadius: '18px', padding: '12px', background: 'rgba(117,139,253,0.05)' }}>
              <div className="flex gap-3">
                <FontAwesomeIcon icon={faInfoCircle} className="color-primary" style={{ marginTop: '3px' }} />
                <div style={{ fontSize: '12px', lineHeight: '1.2' }}>
                  <p className="font-bold text-[#E2D1B9] mb-1">Expert Tip</p>
                  <p className="text-[#BEADFF] opacity-80">Use the JSON export to clone events on other devices. The CSV is perfect for Excel/Google Sheets analysis.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
