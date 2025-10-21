import { useState } from "react";
import { useEvent } from "../context/EventContext";
import { useTickets } from "../context/TicketContext";
import { useLanguage } from "../context/LanguageContext";

export const CopyEventPage = () => {
  const { event } = useEvent();
  const { tickets } = useTickets();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [showJSON, setShowJSON] = useState(false);

  const eventData = {
    event,
    tickets,
  };

  const handleCopyJSON = async () => {
    try {
      const jsonString = JSON.stringify(eventData, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error("Failed to copy:", error);
      alert("Failed to copy to clipboard");
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

  if (!event) {
    return (
      <div className="min-h-screen px-4 md:px-6 py-6 flex items-center justify-center">
        <div className="bg-[#2a2a2a] rounded-xl p-8 border border-[#758BFD] border-opacity-30 text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-[#FFEDD8] mb-2">No Event Found</h2>
          <p className="text-[#BEADFF]">Please create an event first before copying event data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 md:px-6 py-6">
      {/* Decorative circles */}
      <div className="fixed top-[700px] left-[50px] w-[160px] h-[160px] rounded-full bg-[#758BFD] opacity-[0.03] pointer-events-none" />
      <div className="fixed top-[200px] right-[-50px] w-[200px] h-[200px] rounded-full bg-[#BEADFF] opacity-[0.04] pointer-events-none" />

      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-b from-[#1a1152] to-[#0a0620] rounded-3xl p-6 md:p-8 border border-[#758BFD] border-opacity-20 shadow-2xl">
          {/* Page Title */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📋</span>
              <h1 className="text-2xl md:text-3xl font-bold text-[#FFEDD8]" style={{ margin: '0' }}>
                Copy Event Data
              </h1>
            </div>
            <p className="text-sm md:text-base text-[#BEADFF] opacity-80">
              Copy or download your event and ticket data as JSON
            </p>
          </div>

          {/* Event Info */}
          <div className="bg-[#2a2a2a] rounded-xl p-5 border border-[#758BFD] border-opacity-30 mb-6">
            <h2 className="text-lg font-bold text-[#FFEDD8] mb-3">Event Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[#BEADFF] opacity-70">Event Name:</span>
                <span className="text-[#FFEDD8] ml-2 font-semibold">{event.name}</span>
              </div>
              <div>
                <span className="text-[#BEADFF] opacity-70">Date:</span>
                <span className="text-[#FFEDD8] ml-2 font-semibold">{event.date}</span>
              </div>
              <div>
                <span className="text-[#BEADFF] opacity-70">Venue:</span>
                <span className="text-[#FFEDD8] ml-2 font-semibold">{event.venue}</span>
              </div>
              <div>
                <span className="text-[#BEADFF] opacity-70">Total Tickets:</span>
                <span className="text-[#FFEDD8] ml-2 font-semibold">{tickets.length}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <button
              onClick={handleCopyJSON}
              className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all border text-sm md:text-base ${
                copied
                  ? "bg-[#4ade80] text-black border-[#4ade80]"
                  : "bg-gradient-to-r from-[#758BFD] to-[#BEADFF] text-[#FFEDD8] border-[#BEADFF] border-opacity-30 hover:opacity-90"
              }`}
            >
              {copied ? "✓ Copied to Clipboard!" : "📋 Copy to Clipboard"}
            </button>
            <button
              onClick={handleDownloadJSON}
              className="flex-1 px-6 py-4 bg-[#4a3d8f] hover:bg-[#5a4d9f] text-[#FFEDD8] rounded-xl font-bold transition-colors border border-[#758BFD] border-opacity-30 text-sm md:text-base"
            >
              💾 Download JSON File
            </button>
          </div>

          {/* JSON Preview (Collapsible) */}
          <div className="bg-[#2a2a2a] rounded-xl border border-[#758BFD] border-opacity-30 mb-6">
            <button
              onClick={() => setShowJSON(!showJSON)}
              className="w-full p-5 flex items-center justify-between hover:bg-[#3a3a3a] transition-colors rounded-xl"
            >
              <h2 className="text-lg font-bold text-[#FFEDD8]">JSON Preview</h2>
              <span className="text-[#BEADFF] text-xl">
                {showJSON ? "▼" : "▶"}
              </span>
            </button>
            {showJSON && (
              <div className="px-5 pb-5">
                <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#758BFD] border-opacity-20 max-h-96 overflow-auto">
                  <pre className="text-xs text-[#BEADFF] font-mono whitespace-pre-wrap break-words">
                    {JSON.stringify(eventData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-[#2a2a2a] bg-opacity-50 rounded-lg p-4 border border-[#758BFD] border-opacity-20">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div className="text-sm text-[#BEADFF]">
                <p className="font-semibold text-[#FFEDD8] mb-1">About Event Data Export</p>
                <p>
                  This JSON includes all event details, ticket types, and all tickets with their check-in status.
                  You can use this to backup your data or transfer it to another device.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
