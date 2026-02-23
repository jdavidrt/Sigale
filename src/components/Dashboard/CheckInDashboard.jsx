import { useTickets } from "../../context/TicketContext";
import { useLanguage } from "../../context/LanguageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faChartLine, faClock, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import s from "./CheckInDashboard.module.css";

export const CheckInDashboard = () => {
  const { tickets, getStats } = useTickets();
  const { t } = useLanguage();
  const stats = getStats();

  const checkedInTickets = tickets
    .filter((tk) => tk.checkedIn)
    .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime));

  const attendancePercentage = stats.totalSold > 0
    ? ((stats.totalCheckedIn / stats.totalSold) * 100).toFixed(1)
    : 0;

  return (
    <div className={s.root}>
      {/* Summary stats */}
      <div className={`glass-elevated shadow-floating ${s.summaryCard}`}>
        <div className={s.statsWrapper}>
          <div className={s.statsGrid}>
            {/* Attendees */}
            <div className={s.statCell}>
              <div className={s.statIconRow}>
                <FontAwesomeIcon icon={faUsers} className={s["statIcon--success"]} />
                <p className={s.statLabel}>{t("attendees")}</p>
              </div>
              <p className={`${s.statValue} ${s["statValue--success"]}`}>{stats.totalCheckedIn}</p>
              <p className={s.statSubtext}>{t("ofTickets")} {stats.totalSold}</p>
            </div>

            {/* Attendance Rate */}
            <div className={s.statCell}>
              <div className={s.statIconRow}>
                <FontAwesomeIcon icon={faChartLine} className={s["statIcon--secondary"]} />
                <p className={s.statLabel}>{t("attendanceRate")}</p>
              </div>
              <p className={`${s.statValue} ${s["statValue--secondary"]}`}>{attendancePercentage}%</p>
            </div>

            {/* Remaining */}
            <div className={s.statCell}>
              <div className={s.statIconRow}>
                <FontAwesomeIcon icon={faClock} className={s["statIcon--primary"]} />
                <p className={s.statLabel}>{t("remaining")}</p>
              </div>
              <p className={`${s.statValue} ${s["statValue--primary"]}`}>
                {stats.totalSold - stats.totalCheckedIn}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent check-ins */}
      <div className={`glass-elevated ${s.recentCard}`}>
        <div className={s.sectionHeader}>
          <div className="accent-bar" style={{ background: "var(--color-success)" }} />
          <h3 className={s.sectionTitle}>{t("recentCheckIns")}</h3>
        </div>

        {checkedInTickets.length > 0 ? (
          <div className={s.list}>
            {checkedInTickets.slice(0, 15).map((ticket) => (
              <div key={ticket.ticketId} className={`glass-clean hover-lift ${s.listRow}`}>
                <div className={s.listRowInner}>
                  <div className={s.listLeft}>
                    <p className={s.listName}>{ticket.buyerName}</p>
                    <div className={s.listMeta}>
                      <p className={s.listType}>{ticket.ticketType}</p>
                      <p className={s.listTicketId}>{ticket.ticketId}</p>
                    </div>
                  </div>
                  <div className={s.listRight}>
                    <p className={s.listStatus}>
                      <FontAwesomeIcon icon={faCheckCircle} />
                      {t("checkedIn")}
                    </p>
                    <p className={s.listTime}>
                      {new Date(ticket.checkInTime).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={s.emptyState}>
            <span className={s.emptyEmoji}>👥</span>
            <p className="text-body">{t("noTickets")}</p>
          </div>
        )}

        {checkedInTickets.length > 15 && (
          <p className={s.moreLabel}>
            {t("showing")} 15 {t("ofTickets")} {checkedInTickets.length}
          </p>
        )}
      </div>
    </div>
  );
};
