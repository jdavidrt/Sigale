import { QRScanner } from "../components/Scanner/QRScanner";
import { TicketList } from "../components/Tickets/TicketList";
import { useState } from "react";

export const ValidateQRPage = () => {
  const [activeTab, setActiveTab] = useState("scanner");

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          🎫 Check-In Validation
        </h1>
        <p className="text-lg text-gray-600">
          Scan QR codes to validate and check in attendees
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-white rounded-lg shadow-md border border-gray-100 p-1">
          <button
            onClick={() => setActiveTab("scanner")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "scanner"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            📷 Scanner
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "tickets"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            📋 Ticket List
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "scanner" ? <QRScanner /> : <TicketList />}
    </div>
  );
};
