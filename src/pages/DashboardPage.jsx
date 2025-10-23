import { useState } from "react";
import { SalesDashboard } from "../components/Dashboard/SalesDashboard";
import { CheckInDashboard } from "../components/Dashboard/CheckInDashboard";
import { useLanguage } from "../context/LanguageContext";
import { getStorageSizeInMB } from "../utils/storage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartLine, faDatabase } from "@fortawesome/free-solid-svg-icons";

export const DashboardPage = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("sales");

  const tabs = [
    { id: "sales", label: t("salesDashboard") },
    { id: "checkin", label: t("checkInDashboard") },
  ];

  return (
    <div className="min-h-screen px-4 md:px-6 py-6">
      {/* Decorative circles */}
      <div className="fixed top-[700px] left-[50px] w-[160px] h-[160px] rounded-full bg-[#758BFD] opacity-[0.03] pointer-events-none" />
      <div className="fixed top-[200px] right-[-50px] w-[200px] h-[200px] rounded-full bg-[#BEADFF] opacity-[0.04] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div style={{ marginBottom: '6px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faChartLine} className="text-2xl md:text-3xl text-[#758BFD]" />
              <h1 className="text-2xl md:text-3xl font-bold text-[#FFEDD8]" style={{ margin: '0' }}>
                {t("dashboard")}
              </h1>
            </div>
            <div className="flex items-center gap-2 bg-[#2a2a2a] px-3 py-1.5 rounded-lg border border-[#758BFD] border-opacity-20">
              <FontAwesomeIcon icon={faDatabase} className="text-[#758BFD] text-sm" />
              <div className="text-xs">
                <span className="text-[#BEADFF] opacity-70">{t("storage")}:</span>
                <span className="text-[#FFEDD8] ml-1 font-semibold">{getStorageSizeInMB()} MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gradient-to-b from-[#1a1152] to-[#0a0620] rounded-lg border border-[#758BFD] border-opacity-20 overflow-hidden" style={{ marginBottom: '3px' }}>
          <div className="flex border-b border-[#758BFD] border-opacity-20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 font-bold text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-[#758BFD] to-[#BEADFF] text-[#FFEDD8] border-b-2 border-[#BEADFF]"
                    : "text-[#BEADFF] hover:bg-[#4a3d8f] hover:bg-opacity-30"
                }`}
                style={{ padding: '8px 12px' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          {activeTab === "sales" && <SalesDashboard />}
          {activeTab === "checkin" && <CheckInDashboard />}
        </div>
      </div>
    </div>
  );
};
