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
    <div className="min-h-screen px-2 py-4 md:px-6">
      <style>{`
        /* Glass & Density System */
        .glass-clean {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .glass-elevated {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        /* Typography */
        .text-heading {
          font-size: 28px;
          font-weight: 600;
          line-height: 1.1;
          color: #E2D1B9;
          margin: 0;
        }
        .text-body {
          font-size: 18px;
          font-weight: 400;
          line-height: 1.1;
          color: #BEADFF;
          margin: 0;
        }

        .color-primary { color: #758BFD; }
        
        .shadow-floating {
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.10);
        }
      `}</style>

      {/* Decorative background elements */}
      <div className="fixed top-[700px] left-[50px] w-[160px] h-[160px] rounded-full bg-[#758BFD] opacity-[0.02] pointer-events-none" />
      <div className="fixed top-[200px] right-[-50px] w-[200px] h-[200px] rounded-full bg-[#BEADFF] opacity-[0.03] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Page Header - Super Compact */}
        <div style={{ marginBottom: '6px' }}>
          <div className="flex items-center justify-between glass-elevated" style={{ padding: '6px 12px', borderRadius: '16px' }}>
            <div className="flex items-center gap-3">
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #758BFD, #BEADFF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FontAwesomeIcon icon={faChartLine} style={{ color: 'white', fontSize: '14px' }} />
              </div>
              <h1 className="text-heading" style={{ fontSize: '24px' }}>
                {t("dashboard")}
              </h1>
            </div>
            <div className="flex items-center gap-2 glass-clean" style={{ padding: '4px 10px', borderRadius: '10px' }}>
              <FontAwesomeIcon icon={faDatabase} className="color-primary" style={{ fontSize: '12px' }} />
              <div style={{ fontSize: '12px', lineHeight: '1' }}>
                <span style={{ color: '#BEADFF', opacity: 0.7 }}>{t("storage")}:</span>
                <span style={{ color: '#E2D1B9', marginLeft: '4px', fontWeight: 'bold' }}>{getStorageSizeInMB()} MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Glass Pill */}
        <div className="glass-elevated" style={{ borderRadius: '12px', padding: '3px', marginBottom: '6px' }}>
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 font-bold text-sm rounded-lg"
                style={{
                  padding: '10px 12px',
                  position: 'relative',
                  background: activeTab === tab.id
                    ? 'linear-gradient(135deg, #758BFD, #BEADFF)'
                    : 'transparent',
                  color: activeTab === tab.id
                    ? 'rgba(0, 0, 0, 0.75)'
                    : '#BEADFF',
                  boxShadow: activeTab === tab.id
                    ? '0 4px 12px rgba(117, 139, 253, 0.3)'
                    : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                  e.currentTarget.style.transform = 'scale(1)';
                }}
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
