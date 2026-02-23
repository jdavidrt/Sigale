import { useState } from "react";
import { SalesDashboard } from "../components/Dashboard/SalesDashboard";
import { CheckInDashboard } from "../components/Dashboard/CheckInDashboard";
import { useLanguage } from "../context/LanguageContext";
import { getStorageSizeInMB } from "../utils/storage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartLine, faDatabase } from "@fortawesome/free-solid-svg-icons";
import s from "./DashboardPage.module.css";

export const DashboardPage = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("sales");

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
              <FontAwesomeIcon icon={faChartLine} style={{ color: "white", fontSize: "14px" }} />
            </div>
            <h1 className={s.pageTitle}>{t("dashboard")}</h1>
          </div>
          <div className={`glass-clean ${s.storageChip}`}>
            <FontAwesomeIcon icon={faDatabase} className="color-primary" style={{ fontSize: "var(--icon-sm)" }} />
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
