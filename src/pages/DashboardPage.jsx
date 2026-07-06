import { useEffect, useState } from "react";
import { SalesDashboard } from "../components/Dashboard/SalesDashboard";
import { CheckInDashboard } from "../components/Dashboard/CheckInDashboard";
import { useLanguage } from "../context/LanguageContext";
import { useTickets } from "../context/TicketContext";
import { getStorageSizeInMB } from "../utils/storage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartLine, faDatabase } from "@fortawesome/free-solid-svg-icons";
import s from "./DashboardPage.module.css";

export const DashboardPage = () => {
  const { t } = useLanguage();
  const { refreshFromServer } = useTickets();
  const [activeTab, setActiveTab] = useState("sales");

  // Sales/check-in stats are derived from `tickets` in TicketContext. Pull
  // the canonical list from the server on mount so the dashboard reflects
  // every confirmed order, not just what was produced on this device.
  // Explicit 'confirmed' (not relying on the server-side default) — stats
  // must never silently include pending/rejected/expired rows.
  useEffect(() => {
    refreshFromServer("confirmed");
  }, [refreshFromServer]);

  const tabs = [
    { id: "sales", label: t("salesDashboard") },
    { id: "checkin", label: t("checkInDashboard") },
  ];

  return (
    <div className={s.page}>
      <div className={s.container}>
        {/* Header */}
        <div className={`glass-elevated ${s.headerRow}`}>
          <div className={s.headerLeft}>
            <div className="icon-box">
              <FontAwesomeIcon icon={faChartLine} className="icon-box-icon" />
            </div>
            <h1 className={s.pageTitle}>{t("dashboard")}</h1>
          </div>
          <div className={`glass-clean ${s.storageChip}`}>
            <FontAwesomeIcon icon={faDatabase} className={`color-primary ${s.storageIcon}`} />
            <div>
              <span className={s.storageLabel}>{t("storage")}:</span>
              <span className={s.storageValue}>{getStorageSizeInMB()} MB</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`glass-elevated ${s.tabBar}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${s.tab} ${activeTab === tab.id ? s.active : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className={s.content}>
          {activeTab === "sales" && <SalesDashboard />}
          {activeTab === "checkin" && <CheckInDashboard />}
        </div>
      </div>
    </div>
  );
};
