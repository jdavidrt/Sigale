import { useTickets } from "../../context/TicketContext";
import { useEvent } from "../../context/EventContext";
import { useLanguage } from "../../context/LanguageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicket, faDollarSign } from "@fortawesome/free-solid-svg-icons";
import s from "./SalesDashboard.module.css";

export const SalesDashboard = () => {
  const { getStats } = useTickets();
  const { event } = useEvent();
  const { t } = useLanguage();
  const stats = getStats();

  if (!event) {
    return (
      <div className={s.noEvent}>
        <div className={`glass-elevated shadow-floating ${s.noEventCard}`}>
          <span className={s.noEventEmoji}>📊</span>
          <h2 className="text-heading">{t("noEvent")}</h2>
          <p className="text-body">{t("noEventDesc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={s.root}>
      {/* Summary stats */}
      <div className={`glass-elevated shadow-floating ${s.summaryCard}`}>
        <div className={s.statsWrapper}>
          <div className={s.statsGrid}>
            {/* Total Sold */}
            <div className={s.statCell}>
              <div className={s.statIconRow}>
                <FontAwesomeIcon icon={faTicket} className={s["statIcon--primary"]} />
                <p className={s.statLabel}>{t("totalSold")}</p>
              </div>
              <p className={`${s.statValue} ${s["statValue--primary"]}`}>{stats.totalSold}</p>
            </div>

            {/* Total Revenue */}
            <div className={s.statCell}>
              <div className={s.statIconRow}>
                <FontAwesomeIcon icon={faDollarSign} className={s["statIcon--success"]} />
                <p className={s.statLabel}>{t("totalRevenue")}</p>
              </div>
              <p className={`${s.statValue} ${s["statValue--success"]}`}>
                ${stats.revenue.total.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales by type */}
      <div className={`glass-elevated ${s.typeCard}`}>
        <div className={s.sectionHeader}>
          <div className="accent-bar" />
          <h3 className={s.sectionTitle}>{t("salesByType")}</h3>
        </div>

        {Object.keys(stats.byType).length > 0 ? (
          <div className={s.typeList}>
            {Object.entries(stats.byType)
              .sort((a, b) => event.ticketTypes[b[0]] - event.ticketTypes[a[0]])
              .map(([type, data]) => (
                <div key={type} className={`glass-clean hover-lift ${s.typeRow}`}>
                  <div className={s.typeRowInner}>
                    <div className={s.typeRowLeft}>
                      <p className={s.typeName}>{type}</p>
                      <p className={s.typeUnitPrice}>${event.ticketTypes[type]?.toLocaleString()} c/u</p>
                    </div>
                    <div className={s.typeRowRight}>
                      <p className={s.typeRevenue}>${stats.revenue.byType[type]?.toLocaleString()}</p>
                      <p className={s.typeSold}>{data.sold} {t("sold")}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className={s.emptyType}>
            <span className={s.emptyTypeEmoji}>📊</span>
            <p className="text-body">{t("noTickets")}</p>
          </div>
        )}
      </div>
    </div>
  );
};
