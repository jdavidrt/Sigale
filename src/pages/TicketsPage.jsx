import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicketSimple, faTriangleExclamation, faSearch, faFilter } from "@fortawesome/free-solid-svg-icons";
import { useEvent } from "../context/EventContext";
import { useTickets } from "../context/TicketContext";
import { useLanguage } from "../context/LanguageContext";
import { TicketCard } from "../components/Tickets/TicketCard";
import { CSVPanel } from "../components/Tickets/CSVPanel";
import s from "./TicketsPage.module.css";
import btn from "../components/Common/Button.module.css";

export const TicketsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { event } = useEvent();
  const { tickets, searchTickets, clearAllTickets } = useTickets();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "all");

  useEffect(() => {
    const typeFromUrl = searchParams.get("type");
    if (typeFromUrl) setSelectedType(typeFromUrl);
  }, [searchParams]);

  const searchedTickets = searchTickets(searchQuery);
  const filteredTickets = selectedType === "all"
    ? searchedTickets
    : searchedTickets.filter((ticket) => ticket.ticketType === selectedType);

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setSelectedType(newType);
    if (newType === "all") setSearchParams({});
    else setSearchParams({ type: newType });
  };

  // H1: A hard-coded password in a static bundle is not access control — anyone
  // can read it with DevTools. Removing the password theater; rely on an
  // explicit two-step confirmation instead. Operators who need real access
  // control should deploy the app behind an auth'd reverse proxy.
  const handleClearAllTickets = () => {
    if (tickets.length === 0) return;
    const firstPrompt = window.confirm(
      t("confirmResetCheckIns") ||
        `Delete all ${tickets.length} tickets?\n\nThis cannot be undone.`
    );
    if (!firstPrompt) return;
    const typed = window.prompt(
      t("confirmResetCheckInsRetype") ||
        `Type DELETE to confirm deleting all ${tickets.length} tickets:`
    );
    if (typed === null) return;
    if (typed.trim().toUpperCase() !== "DELETE") {
      alert(t("deletionCancelled") || "Deletion cancelled.");
      return;
    }
    clearAllTickets();
    alert(t("checkInsReset") || "All tickets have been deleted.");
  };

  if (!event) {
    return (
      <div className={s.noEvent}>
        <div className={`glass-elevated shadow-floating ${s.noEventCard}`}>
          <FontAwesomeIcon icon={faTriangleExclamation} className="color-primary" style={{ fontSize: "60px", marginBottom: "var(--space-7)" }} />
          <h2 className="text-heading" style={{ margin: "0 0 var(--space-4) 0" }}>{t("noEvent")}</h2>
          <p className="text-body" style={{ margin: 0 }}>{t("noEventDesc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.container}>
        {/* Header */}
        <div className={`glass-elevated ${s.headerRow}`}>
          <div className={s.headerLeft}>
            <div className="icon-box">
              <FontAwesomeIcon icon={faTicketSimple} style={{ color: "white", fontSize: "14px" }} />
            </div>
            <h1 className={s.pageTitle}>{t("allTickets")}</h1>
          </div>
          <div className={`glass-clean ${s.countBadge}`}>
            {filteredTickets.length}
          </div>
        </div>

        {/* Filters */}
        <div className={s.filtersRow}>
          <div className={s.searchWrapper}>
            <FontAwesomeIcon icon={faSearch} className={s.searchIcon} />
            <input
              type="text"
              className={`glass-clean ${s.searchInput}`}
              placeholder={t("searchTickets")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={s.filterWrapper}>
            <FontAwesomeIcon icon={faFilter} className={s.filterIcon} />
            <select
              value={selectedType}
              onChange={handleTypeChange}
              className={`glass-clean ${s.filterSelect}`}
            >
              <option value="all" style={{ background: "#1a1152" }}>{t("ticketType")}: {t("filterAll")}</option>
              {event.ticketTypes && Object.keys(event.ticketTypes).map((type) => (
                <option key={type} value={type} style={{ background: "#1a1152" }}>
                  {type.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tickets */}
        {filteredTickets.length === 0 ? (
          <div className={`glass-elevated ${s.emptyState}`}>
            <FontAwesomeIcon icon={faTicketSimple} className="color-primary" style={{ fontSize: "60px", opacity: 0.20, marginBottom: "var(--space-7)" }} />
            <h2 className="text-heading" style={{ marginBottom: "var(--space-4)" }}>{t("noTickets")}</h2>
            <p className="text-body">{t("noTicketsDesc")}</p>
          </div>
        ) : (
          <>
            <div className={s.ticketGrid}>
              {filteredTickets.map((ticket) => (
                <TicketCard key={ticket.ticketId} ticket={ticket} />
              ))}
            </div>

            {tickets.length > 0 && (
              <div className={s.resetRow}>
                <button onClick={handleClearAllTickets} className={`${btn.btn} ${btn.primary} ${btn.lg}`}>
                  🗑️ {t("clearAllTickets") || "Delete All Tickets"}
                </button>
              </div>
            )}
          </>
        )}

        {/* CSV Panel */}
        <CSVPanel filteredTickets={filteredTickets} />
      </div>
    </div>
  );
};
