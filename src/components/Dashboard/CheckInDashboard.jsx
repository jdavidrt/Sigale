import { useTickets } from "../../context/TicketContext";
import { useLanguage } from "../../context/LanguageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faChartLine, faClock } from "@fortawesome/free-solid-svg-icons";

export const CheckInDashboard = () => {
  const { tickets, getStats } = useTickets();
  const { t } = useLanguage();
  const stats = getStats();

  const checkedInTickets = tickets
    .filter((t) => t.checkedIn)
    .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime));

  const attendancePercentage = stats.totalSold > 0
    ? ((stats.totalCheckedIn / stats.totalSold) * 100).toFixed(1)
    : 0;

  return (
    <div className="checkin-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <style>{`
        .checkin-dashboard-container * {
          margin: 3px;
          padding: 3px;
        }
        .checkin-dashboard-container h3,
        .checkin-dashboard-container p {
          margin: 0;
          padding: 0;
        }
      `}</style>
      {/* Summary Card - Single Container with 3 rows */}
      <div className="bg-gradient-to-b from-[#1a1152] to-[#0a0620] rounded-lg border border-[#758BFD] border-opacity-20" style={{ padding: '6px', margin: '0' }}>
        {/* Attendees */}
        <div className="flex items-center justify-between" style={{ padding: '3px', borderBottom: '1px solid rgba(117, 139, 253, 0.1)', margin: '0' }}>
          <div className="flex items-center" style={{ gap: '4px', margin: '0' }}>
            <div className="w-6 h-6 bg-[#4ade80] bg-opacity-20 rounded flex items-center justify-center" style={{ margin: '0' }}>
              <FontAwesomeIcon icon={faUsers} className="text-[#4ade80] text-xs" />
            </div>
            <div style={{ margin: '0' }}>
              <h3 className="text-[#BEADFF] text-xs font-medium" style={{ margin: '0' }}>{t("attendees")}</h3>
              <p className="text-xs text-[#758BFD]" style={{ margin: '0', marginTop: '1px' }}>
                {t("ofTickets")} {stats.totalSold}
              </p>
            </div>
          </div>
          <p className="text-xl font-bold text-[#FFEDD8]" style={{ margin: '0' }}>{stats.totalCheckedIn}</p>
        </div>

        {/* Attendance Rate */}
        <div className="flex items-center justify-between" style={{ padding: '3px', borderBottom: '1px solid rgba(117, 139, 253, 0.1)', margin: '0' }}>
          <div className="flex items-center" style={{ gap: '4px', margin: '0' }}>
            <div className="w-6 h-6 bg-[#BEADFF] bg-opacity-20 rounded flex items-center justify-center" style={{ margin: '0' }}>
              <FontAwesomeIcon icon={faChartLine} className="text-[#BEADFF] text-xs" />
            </div>
            <h3 className="text-[#BEADFF] text-xs font-medium" style={{ margin: '0' }}>{t("attendanceRate")}</h3>
          </div>
          <p className="text-xl font-bold text-[#FFEDD8]" style={{ margin: '0' }}>{attendancePercentage}%</p>
        </div>

        {/* Remaining */}
        <div className="flex items-center justify-between" style={{ padding: '3px', margin: '0' }}>
          <div className="flex items-center" style={{ gap: '4px', margin: '0' }}>
            <div className="w-6 h-6 bg-[#758BFD] bg-opacity-20 rounded flex items-center justify-center" style={{ margin: '0' }}>
              <FontAwesomeIcon icon={faClock} className="text-[#758BFD] text-xs" />
            </div>
            <h3 className="text-[#BEADFF] text-xs font-medium" style={{ margin: '0' }}>{t("remaining")}</h3>
          </div>
          <p className="text-xl font-bold text-[#FFEDD8]" style={{ margin: '0' }}>
            {stats.totalSold - stats.totalCheckedIn}
          </p>
        </div>
      </div>

      {/* Recent Check-ins */}
      <div className="bg-gradient-to-b from-[#1a1152] to-[#0a0620] rounded-lg border border-[#758BFD] border-opacity-20" style={{ padding: '6px', margin: '0' }}>
        <h3 className="text-sm font-bold text-[#FFEDD8]" style={{ margin: '0', marginBottom: '3px', padding: '3px' }}>{t("recentCheckIns")}</h3>

        {checkedInTickets.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', margin: '0' }}>
            {checkedInTickets.slice(0, 10).map((ticket) => (
              <div
                key={ticket.ticketId}
                className="bg-[#2a2a2a] rounded border border-[#758BFD] border-opacity-20 hover:border-opacity-40 transition-all"
                style={{ padding: '6px', margin: '0' }}
              >
                <div className="flex flex-col md:flex-row justify-between md:items-center" style={{ gap: '3px', margin: '0' }}>
                  <div className="flex-1" style={{ margin: '0' }}>
                    <p className="font-bold text-xs text-[#FFEDD8]" style={{ margin: '0', marginBottom: '2px' }}>{ticket.buyerName}</p>
                    <p className="text-xs text-[#BEADFF]" style={{ margin: '0' }}>
                      <span className="font-semibold capitalize">{ticket.ticketType}</span>
                      <span className="mx-2">•</span>
                      <span className="font-mono text-xs opacity-70">{ticket.ticketId}</span>
                    </p>
                  </div>
                  <div className="text-left md:text-right" style={{ margin: '0' }}>
                    <p className="text-xs text-[#4ade80] font-semibold" style={{ margin: '0', marginBottom: '1px' }}>
                      ✓ {t("checkedIn")}
                    </p>
                    <p className="text-xs text-[#BEADFF]" style={{ margin: '0' }}>
                      {new Date(ticket.checkInTime).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-[#BEADFF]">{t("noTickets")}</p>
            <p className="text-sm text-[#758BFD] mt-2">
              {t("scanQRValidate")}
            </p>
          </div>
        )}

        {checkedInTickets.length > 10 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-[#758BFD]">
              {t("showing")} 10 {t("ofTickets")} {checkedInTickets.length} {t("recentCheckIns").toLowerCase()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
