import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicketSimple, faTriangleExclamation, faSearch, faFilter } from "@fortawesome/free-solid-svg-icons";
import { useEvent } from "../context/EventContext";
import { useTickets } from "../context/TicketContext";
import { useLanguage } from "../context/LanguageContext";
import { TicketCard } from "../components/Tickets/TicketCard";

export const TicketsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { event } = useEvent();
  const { tickets, searchTickets, resetAllCheckIns } = useTickets();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "all");

  // Update selected type when URL changes
  useEffect(() => {
    const typeFromUrl = searchParams.get("type");
    if (typeFromUrl) {
      setSelectedType(typeFromUrl);
    }
  }, [searchParams]);

  // Filter tickets by search query
  const searchedTickets = searchTickets(searchQuery);

  // Filter by ticket type
  const filteredTickets = selectedType === "all"
    ? searchedTickets
    : searchedTickets.filter(ticket => ticket.ticketType === selectedType);

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setSelectedType(newType);

    // Update URL
    if (newType === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ type: newType });
    }
  };

  const handleResetAllCheckIns = () => {
    const password = window.prompt(t("enterPasswordToReset") || "Enter password to reset all check-ins:");

    if (password === null) {
      // User cancelled
      return;
    }

    if (password !== "980827") {
      alert(t("incorrectPassword") || "Incorrect password. Reset cancelled.");
      return;
    }

    if (window.confirm(t("confirmResetCheckIns") || "Are you sure you want to reset all check-ins? This action cannot be undone.")) {
      resetAllCheckIns();
      alert(t("checkInsReset") || "All check-ins have been reset successfully.");
    }
  };

  if (!event) {
    return (
      <div className="min-h-screen px-4 md:px-6 py-6 flex items-center justify-center">
        <div className="glass-elevated shadow-floating rounded-xl p-8 text-center max-w-md">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-6xl mb-4 color-primary" />
          <h2 className="text-heading" style={{ margin: '0 0 8px 0' }}>{t("noEvent")}</h2>
          <p className="text-body" style={{ margin: 0 }}>{t("noEventDesc")}</p>
        </div>
      </div>
    );
  }

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
        .text-title {
          font-size: 38px;
          font-weight: 700;
          line-height: 1.1;
          color: #E2D1B9;
          margin: 0;
        }
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
        .text-label {
          font-size: 14px;
          font-weight: 600;
          line-height: 1.1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #BEADFF;
          opacity: 0.8;
          margin: 0;
        }

        .color-primary { color: #758BFD; }
        
        .shadow-floating {
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.10);
        }

        .hover-lift {
          transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(117, 139, 253, 0.25);
        }

        input::placeholder, select::placeholder {
          color: rgba(190, 173, 255, 0.5);
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        {/* Header - Super Compact */}
        <div style={{ marginBottom: '6px' }}>
          <div className="flex items-center justify-between glass-elevated" style={{ padding: '6px 12px', borderRadius: '16px' }}>
            <div className="flex items-center gap-3">
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #758BFD, #BEADFF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FontAwesomeIcon icon={faTicketSimple} style={{ color: 'white', fontSize: '14px' }} />
              </div>
              <h1 className="text-heading" style={{ fontSize: '24px', marginLeft: '4px' }}>
                {t("allTickets")}
              </h1>
            </div>
            <div className="glass-clean" style={{ padding: '4px 12px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(117, 139, 253, 0.2), rgba(190, 173, 255, 0.1))' }}>
              <p className="text-heading" style={{ fontSize: '24px', color: '#758BFD' }}>
                {filteredTickets.length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters - High Density */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2" style={{ marginBottom: '6px' }}>
          {/* Search Bar */}
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 color-primary opacity-50" style={{ fontSize: '14px' }} />
            <input
              type="text"
              placeholder={t("searchTickets")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 glass-clean rounded-xl text-[#E2D1B9] focus:outline-none focus:ring-1 focus:ring-[#758BFD] text-base"
              style={{ padding: '8px 12px 8px 36px', height: '44px' }}
            />
          </div>

          {/* Ticket Type Filter */}
          <div className="relative">
            <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 -translate-y-1/2 color-primary opacity-50" style={{ fontSize: '14px' }} />
            <select
              value={selectedType}
              onChange={handleTypeChange}
              className="w-full pl-9 pr-8 py-2 glass-clean rounded-xl text-[#E2D1B9] focus:outline-none focus:ring-1 focus:ring-[#758BFD] text-base appearance-none cursor-pointer"
              style={{
                height: '44px',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23758BFD' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                backgroundPosition: "right 0.8rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.2em 1.2em",
              }}
            >
              <option value="all" style={{ background: '#1a1152' }}>{t("ticketType")}: All / Todos</option>
              {event.ticketTypes && Object.keys(event.ticketTypes).map((type) => (
                <option key={type} value={type} style={{ background: '#1a1152' }}>
                  {type.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tickets Grid */}
        {filteredTickets.length === 0 ? (
          <div className="glass-elevated rounded-xl p-8 text-center" style={{ marginTop: '20px' }}>
            <FontAwesomeIcon icon={faTicketSimple} className="text-6xl mb-4 color-primary opacity-20" />
            <h2 className="text-heading" style={{ marginBottom: '8px' }}>{t("noTickets")}</h2>
            <p className="text-body">{t("noTicketsDesc")}</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '6px', marginTop: '6px' }}>
              {filteredTickets.map((ticket) => (
                <TicketCard key={ticket.ticketId} ticket={ticket} />
              ))}
            </div>

            {/* Reset All Check-Ins Button - Styled like Create Ticket */}
            {tickets.length > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={handleResetAllCheckIns}
                  style={{
                    padding: '16px 24px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #758BFD, #BEADFF)',
                    border: 'none',
                    color: 'rgba(0, 0, 0, 0.75)',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(117, 139, 253, 0.3)',
                    transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  🔄 {t("resetAllCheckIns") || "Reset All Check-Ins"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
