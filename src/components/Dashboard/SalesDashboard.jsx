import { useTickets } from "../../context/TicketContext";
import { useEvent } from "../../context/EventContext";
import { useLanguage } from "../../context/LanguageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicket, faDollarSign, faCircleCheck } from "@fortawesome/free-solid-svg-icons";

export const SalesDashboard = () => {
  const { getStats } = useTickets();
  const { event } = useEvent();
  const { t } = useLanguage();
  const stats = getStats();

  if (!event) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="glass-elevated shadow-floating rounded-xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-heading" style={{ marginBottom: '8px' }}>{t("noEvent")}</h2>
          <p className="text-body">{t("noEventDesc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Summary Container - High Performance Overlay Style */}
      <div className="glass-elevated shadow-floating" style={{ borderRadius: '24px', padding: '6px' }}>
        <div style={{ background: 'rgba(117, 139, 253, 0.08)', borderRadius: '20px', padding: '2px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
            {/* Total Sold */}
            <div style={{ padding: '8px 4px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '2px' }}>
                <FontAwesomeIcon icon={faTicket} style={{ color: '#758BFD', fontSize: '12px' }} />
                <p className="text-label" style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>{t("totalSold")}</p>
              </div>
              <p className="text-heading" style={{ fontSize: '24px', color: '#758BFD', margin: 0 }}>{stats.totalSold}</p>
            </div>

            {/* Total Revenue */}
            <div style={{ padding: '8px 4px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '2px' }}>
                <FontAwesomeIcon icon={faDollarSign} style={{ color: '#4ade80', fontSize: '12px' }} />
                <p className="text-label" style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>{t("totalRevenue")}</p>
              </div>
              <p className="text-heading" style={{ fontSize: '24px', color: '#4ade80', margin: 0 }}>${stats.revenue.total.toLocaleString()}</p>
            </div>

            {/* Total Checked In */}
            <div style={{ padding: '8px 4px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '2px' }}>
                <FontAwesomeIcon icon={faCircleCheck} style={{ color: '#BEADFF', fontSize: '12px' }} />
                <p className="text-label" style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>{t("totalCheckedIn")}</p>
              </div>
              <p className="text-heading" style={{ fontSize: '24px', color: '#BEADFF', margin: 0 }}>{stats.totalCheckedIn}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales by Type Section */}
      <div className="glass-elevated" style={{ borderRadius: '24px', padding: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px 2px 12px' }}>
          <div style={{ width: '4px', height: '16px', borderRadius: '2px', background: '#758BFD' }}></div>
          <h3 className="text-label" style={{ opacity: 1, margin: 0 }}>{t("salesByType")}</h3>
        </div>

        {Object.keys(stats.byType).length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '6px' }}>
            {Object.entries(stats.byType)
              .sort((a, b) => event.ticketTypes[b[0]] - event.ticketTypes[a[0]])
              .map(([type, data]) => (
                <div key={type} className="glass-clean hover-lift" style={{ padding: '10px 12px', borderRadius: '18px', border: '1px solid rgba(117,139,253,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div>
                      <p className="text-label" style={{ opacity: 1, margin: 0, fontSize: '14px', color: '#E2D1B9' }}>{type}</p>
                      <p className="text-body" style={{ fontSize: '12px', opacity: 0.6, margin: 0 }}>
                        {data.sold} {t("sold")} • {data.checkedIn} {t("checkedIn").toLowerCase()}
                      </p>
                    </div>
                    <p className="text-heading" style={{ fontSize: '20px', color: '#4ade80', margin: 0 }}>
                      ${stats.revenue.byType[type]?.toLocaleString()}
                    </p>
                  </div>

                  {/* Progress Bar Area - High Density */}
                  <div style={{ marginTop: '0px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                      <p style={{ fontSize: '10px', color: '#BEADFF', margin: 0, opacity: 0.8 }}>
                        ${event.ticketTypes[type]?.toLocaleString()} {t("price").toLowerCase()}
                      </p>
                      <p style={{ fontSize: '10px', color: '#4ade80', fontWeight: 'bold', margin: 0 }}>
                        {t("checkedIn")} {data.sold > 0 ? ((data.checkedIn / data.sold) * 100).toFixed(0) : 0}%
                      </p>
                    </div>
                    <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', height: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${data.sold > 0 ? (data.checkedIn / data.sold) * 100 : 0}%`,
                          background: 'linear-gradient(90deg, #758BFD, #BEADFF)',
                          height: '100%',
                          borderRadius: '10px',
                          transition: 'width 0.5s ease-out'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-10 opacity-30">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-body">{t("noTickets")}</p>
          </div>
        )}
      </div>
    </div>
  );
};
