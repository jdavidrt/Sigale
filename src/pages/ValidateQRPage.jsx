import { QRScanner } from "../components/Scanner/QRScanner";
import { TicketList } from "../components/Tickets/TicketList";
import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

export const ValidateQRPage = () => {
  const [activeTab, setActiveTab] = useState("scanner");
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          🎫 {t("checkInValidation")}
        </h1>
        <p className="text-lg text-gray-600">
          {t("scanQRValidate")}
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
            📷 {t("scanner")}
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "tickets"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            📋 {t("ticketList")}
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "scanner" ? <QRScanner /> : <TicketList />}
    </div>
  );
};
