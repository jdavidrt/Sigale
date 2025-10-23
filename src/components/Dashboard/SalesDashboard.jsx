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
        <div className="bg-[#2a2a2a] rounded-xl p-8 border border-[#758BFD] border-opacity-30 text-center max-w-md">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-bold text-[#FFEDD8] mb-2">{t("noEvent")}</h2>
          <p className="text-[#BEADFF]">{t("noEventDesc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <style>{`
        .sales-dashboard-container * {
          margin: 3px;
          padding: 3px;
        }
        .sales-dashboard-container h3,
        .sales-dashboard-container p {
          margin: 0;
          padding: 0;
        }
      `}</style>
      {/* Summary Card - Single Container with 3 rows */}
      <div className="bg-gradient-to-b from-[#1a1152] to-[#0a0620] rounded-lg border border-[#758BFD] border-opacity-20" style={{ padding: '6px', margin: '0' }}>
        {/* Total Tickets Sold */}
        <div className="flex items-center justify-between" style={{ padding: '3px', borderBottom: '1px solid rgba(117, 139, 253, 0.1)', margin: '0' }}>
          <div className="flex items-center" style={{ gap: '4px', margin: '0' }}>
            <div className="w-6 h-6 bg-[#758BFD] bg-opacity-20 rounded flex items-center justify-center" style={{ margin: '0' }}>
              <FontAwesomeIcon icon={faTicket} className="text-[#758BFD] text-xs" />
            </div>
            <h3 className="text-[#BEADFF] text-xs font-medium" style={{ margin: '0' }}>{t("totalSold")}</h3>
          </div>
          <p className="text-xl font-bold text-[#FFEDD8]" style={{ margin: '0' }}>{stats.totalSold}</p>
        </div>

        {/* Total Revenue */}
        <div className="flex items-center justify-between" style={{ padding: '3px', borderBottom: '1px solid rgba(117, 139, 253, 0.1)', margin: '0' }}>
          <div className="flex items-center" style={{ gap: '4px', margin: '0' }}>
            <div className="w-6 h-6 bg-[#4ade80] bg-opacity-20 rounded flex items-center justify-center" style={{ margin: '0' }}>
              <FontAwesomeIcon icon={faDollarSign} className="text-[#4ade80] text-xs" />
            </div>
            <h3 className="text-[#BEADFF] text-xs font-medium" style={{ margin: '0' }}>{t("totalRevenue")}</h3>
          </div>
          <p className="text-xl font-bold text-[#FFEDD8]" style={{ margin: '0' }}>${stats.revenue.total.toLocaleString()}</p>
        </div>

        {/* Total Checked In */}
        <div className="flex items-center justify-between" style={{ padding: '3px', margin: '0' }}>
          <div className="flex items-center" style={{ gap: '4px', margin: '0' }}>
            <div className="w-6 h-6 bg-[#BEADFF] bg-opacity-20 rounded flex items-center justify-center" style={{ margin: '0' }}>
              <FontAwesomeIcon icon={faCircleCheck} className="text-[#BEADFF] text-xs" />
            </div>
            <h3 className="text-[#BEADFF] text-xs font-medium" style={{ margin: '0' }}>{t("totalCheckedIn")}</h3>
          </div>
          <p className="text-xl font-bold text-[#FFEDD8]" style={{ margin: '0' }}>{stats.totalCheckedIn}</p>
        </div>
      </div>

      {/* Sales by Type */}
      <div className="bg-gradient-to-b from-[#1a1152] to-[#0a0620] rounded-lg border border-[#758BFD] border-opacity-20" style={{ padding: '6px', margin: '0' }}>
        <h3 className="text-sm font-bold text-[#FFEDD8]" style={{ margin: '0', marginBottom: '3px', padding: '3px' }}>{t("salesByType")}</h3>

        {Object.keys(stats.byType).length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', margin: '0' }}>
            {Object.entries(stats.byType)
              .sort((a, b) => event.ticketTypes[b[0]] - event.ticketTypes[a[0]])
              .map(([type, data]) => (
              <div key={type} className="bg-[#2a2a2a] rounded border border-[#758BFD] border-opacity-20" style={{ padding: '6px', margin: '0' }}>
                {/* Two column layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', margin: '0' }}>
                  {/* Left Column */}
                  <div style={{ margin: '0' }}>
                    <p className="font-bold text-xs text-[#FFEDD8] capitalize" style={{ margin: '0', marginBottom: '2px' }}>{type}</p>
                    <p className="text-xs text-[#BEADFF]" style={{ margin: '0' }}>
                      {data.sold} {t("sold")} • {data.checkedIn} {t("checkedIn").toLowerCase()}
                    </p>
                    <p className="text-xs text-[#BEADFF]" style={{ margin: '0', marginTop: '2px' }}>
                      ${event.ticketTypes[type]?.toLocaleString()} {t("price").toLowerCase()}
                    </p>
                  </div>

                  {/* Right Column */}
                  <div style={{ margin: '0' }}>
                    <p className="font-bold text-sm text-[#4ade80]" style={{ margin: '0', marginBottom: '2px' }}>
                      ${stats.revenue.byType[type]?.toLocaleString()}
                    </p>
                    {/* Progress bar with percentage */}
                    <div style={{ margin: '0', marginTop: '4px' }}>
                      <p className="text-xs text-[#BEADFF]" style={{ margin: '0', marginBottom: '2px' }}>
                        {t("checkedIn")} {data.sold > 0 ? ((data.checkedIn / data.sold) * 100).toFixed(0) : 0}%
                      </p>
                      <div className="w-full bg-[#1a1152] rounded-full h-2" style={{ margin: '0' }}>
                        <div
                          className="bg-gradient-to-r from-[#758BFD] to-[#BEADFF] h-2 rounded-full transition-all duration-500"
                          style={{ width: `${data.sold > 0 ? (data.checkedIn / data.sold) * 100 : 0}%`, margin: '0' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-[#BEADFF]">{t("noTickets")}</p>
            <p className="text-sm text-[#758BFD] mt-2">{t("noTicketsDesc")}</p>
          </div>
        )}
      </div>
    </div>
  );
};
