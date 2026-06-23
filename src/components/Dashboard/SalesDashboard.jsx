import { useTickets } from "../../context/TicketContext";
import { useEvent } from "../../context/EventContext";
import { useLanguage } from "../../context/LanguageContext";
import { faTicket, faDollarSign } from "@fortawesome/free-solid-svg-icons";
import { StatCell } from "../ui/StatCell";
import { EmptyStateCard } from "../ui/EmptyStateCard";
import { formatCurrency } from "../../utils/timeFormat";
import s from "./SalesDashboard.module.css";

export const SalesDashboard = () => {
  const { getStats } = useTickets();
  const { event } = useEvent();
  const { t } = useLanguage();
  const stats = getStats(event);

  if (!event) {
    return <EmptyStateCard icon="📊" title={t("noEvent")} description={t("noEventDesc")} />;
  }

  return (
    <div className={s.root}>
      {/* Summary stats */}
      <div className={`glass-elevated shadow-floating ${s.summaryCard}`}>
        <div className={s.statsWrapper}>
          <div className={s.statsGrid}>
            <StatCell icon={faTicket} variant="primary" label={t("totalSold")} value={stats.totalSold} />
            <StatCell
              icon={faDollarSign}
              variant="success"
              label={t("totalRevenue")}
              value={formatCurrency(stats.revenue.total)}
            />
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
                      <p className={s.typeUnitPrice}>{formatCurrency(event.ticketTypes[type])} c/u</p>
                    </div>
                    <div className={s.typeRowRight}>
                      <p className={s.typeRevenue}>{formatCurrency(stats.revenue.byType[type])}</p>
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
