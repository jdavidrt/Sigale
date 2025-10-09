import { QRScanner } from "../components/Scanner/QRScanner";
import { TicketList } from "../components/Tickets/TicketList";
import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

export const ValidateQRPage = () => {
  const [activeTab, setActiveTab] = useState("scanner");
  const { t } = useLanguage();

  return (
    <div className="min-h-screen px-4 md:px-6 py-6">
      {/* Decorative circles */}
      <div className="fixed top-[700px] left-[50px] w-[160px] h-[160px] rounded-full bg-[#758BFD] opacity-[0.03] pointer-events-none" />
      <div className="fixed top-[200px] right-[-50px] w-[200px] h-[200px] rounded-full bg-[#BEADFF] opacity-[0.04] pointer-events-none" />

      {/* Main Card */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-b from-[#1a1152] to-[#0a0620] rounded-3xl p-6 md:p-8 border border-[#758BFD] border-opacity-20 shadow-2xl">
          {/* Page Title */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🎫</span>
              <h1 className="text-2xl md:text-3xl font-bold text-[#FFEDD8]">
                {t("checkInValidation")}
              </h1>
            </div>
            <p className="text-sm md:text-base text-[#BEADFF] opacity-80">
              {t("scanQRValidate")}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setActiveTab("scanner")}
              className={`px-6 py-2.5 rounded-lg font-bold transition-all text-sm ${
                activeTab === "scanner"
                  ? "bg-[#4a3d8f] text-[#FFEDD8] border border-[#758BFD] border-opacity-50"
                  : "bg-[#2a2a2a] text-[#BEADFF] border border-[#758BFD] border-opacity-30 hover:bg-[#3a3a3a]"
              }`}
            >
              📷 {t("scanner")}
            </button>
            <button
              onClick={() => setActiveTab("tickets")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all text-sm ${
                activeTab === "tickets"
                  ? "bg-[#4a3d8f] text-[#FFEDD8] border border-[#758BFD] border-opacity-50"
                  : "bg-[#2a2a2a] text-[#BEADFF] border border-[#758BFD] border-opacity-30 hover:bg-[#3a3a3a]"
              }`}
            >
              📋 {t("ticketList")}
            </button>
          </div>

          {/* Content */}
          <div>
            {activeTab === "scanner" ? <QRScanner /> : <TicketList />}
          </div>
        </div>
      </div>
    </div>
  );
};
