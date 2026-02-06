import { useTickets } from "../../context/TicketContext";
import { useLanguage } from "../../context/LanguageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faChartLine, faClock, faCheckCircle } from "@fortawesome/free-solid-svg-icons";

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Summary Container */}
      <div className="glass-elevated shadow-floating" style={{ borderRadius: '24px', padding: '6px' }}>
        <div style={{ background: 'rgba(117, 139, 253, 0.08)', borderRadius: '20px', padding: '2px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
            {/* Attendees */}
            <div style={{ padding: '8px 4px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '2px' }}>
                <FontAwesomeIcon icon={faUsers} style={{ color: '#4ade80', fontSize: '12px' }} />
                <p className="text-label" style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>{t("attendees")}</p>
              </div>
              <p className="text-heading" style={{ fontSize: '24px', color: '#4ade80', margin: 0 }}>{stats.totalCheckedIn}</p>
              <p style={{ fontSize: '10px', color: '#BEADFF', margin: 0, opacity: 0.5 }}>{t("ofTickets")} {stats.totalSold}</p>
            </div>

            {/* Attendance Rate */}
            <div style={{ padding: '8px 4px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '2px' }}>
                <FontAwesomeIcon icon={faChartLine} style={{ color: '#BEADFF', fontSize: '12px' }} />
                <p className="text-label" style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>{t("attendanceRate")}</p>
              </div>
              <p className="text-heading" style={{ fontSize: '24px', color: '#BEADFF', margin: 0 }}>{attendancePercentage}%</p>
            </div>

            {/* Remaining */}
            <div style={{ padding: '8px 4px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '2px' }}>
                <FontAwesomeIcon icon={faClock} style={{ color: '#758BFD', fontSize: '12px' }} />
                <p className="text-label" style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>{t("remaining")}</p>
              </div>
              <p className="text-heading" style={{ fontSize: '24px', color: '#758BFD', margin: 0 }}>
                {stats.totalSold - stats.totalCheckedIn}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Check-ins Section */}
      <div className="glass-elevated" style={{ borderRadius: '24px', padding: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px 2px 12px' }}>
          <div style={{ width: '4px', height: '16px', borderRadius: '2px', background: '#4ade80' }}></div>
          <h3 className="text-label" style={{ opacity: 1, margin: 0 }}>{t("recentCheckIns")}</h3>
        </div>

        {checkedInTickets.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '6px' }}>
            {checkedInTickets.slice(0, 15).map((ticket) => (
              <div
                key={ticket.ticketId}
                className="glass-clean hover-lift"
                style={{ padding: '6px 12px', borderRadius: '16px', border: '1px solid rgba(74, 222, 128, 0.1)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p className="text-label" style={{ opacity: 1, margin: 0, fontSize: '14px', color: '#E2D1B9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ticket.buyerName}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                      <p className="text-label" style={{ fontSize: '10px', color: '#758BFD', margin: 0 }}>{ticket.ticketType}</p>
                      <p style={{ fontSize: '10px', color: '#BEADFF', margin: 0, opacity: 0.5, fontFamily: 'monospace' }}>{ticket.ticketId}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', color: '#4ade80' }}>
                      <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '10px' }} />
                      <p style={{ fontSize: '12px', fontWeight: 'bold', margin: 0 }}>{t("checkedIn")}</p>
                    </div>
                    <p style={{ fontSize: '10px', color: '#BEADFF', margin: 0, opacity: 0.6 }}>
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
          <div className="text-center py-10 opacity-30">
            <div className="text-4xl mb-4">👥</div>
            <p className="text-body">{t("noTickets")}</p>
          </div>
        )}

        {checkedInTickets.length > 15 && (
          <div style={{ padding: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: '#758BFD', margin: 0, opacity: 0.7 }}>
              {t("showing")} 15 {t("ofTickets")} {checkedInTickets.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
