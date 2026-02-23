import { useState, useMemo } from "react";
import { useTickets } from "../../context/TicketContext";
import { useLanguage } from "../../context/LanguageContext";
import { TicketCard } from "./TicketCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import s from "./TicketList.module.css";

export const TicketList = () => {
  const { searchTickets } = useTickets();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTickets = useMemo(() => {
    return searchTickets(searchQuery);
  }, [searchQuery, searchTickets]);

  const stats = useMemo(() => ({
    total: filteredTickets.length,
    checkedIn: filteredTickets.filter((tk) => tk.checkedIn).length,
  }), [filteredTickets]);

  return (
    <div className={s.root}>
      {/* Search Bar */}
      <div className={s.searchWrapper}>
        <FontAwesomeIcon icon={faMagnifyingGlass} className={s.searchIcon} />
        <input
          type="text"
          className={s.searchInput}
          placeholder={`${t("searchTickets")}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className={s.statsBar}>
        <span className={s.statFound}>
          {stats.total} {stats.total === 1 ? "ticket found" : "tickets found"}
        </span>
        <span className={s.statCheckedIn}>
          {stats.checkedIn} {t("checkedIn")}
        </span>
      </div>

      {/* Ticket Cards / Empty State */}
      {filteredTickets.length === 0 ? (
        <div className={s.emptyState}>
          <span className={s.emptyEmoji}>🎫</span>
          <h3 className={s.emptyTitle}>{t("noTickets")}</h3>
          <p className={s.emptyDesc}>
            {searchQuery ? "Try a different search query" : t("noTicketsDesc")}
          </p>
        </div>
      ) : (
        <div className={s.list}>
          {filteredTickets.map((ticket) => (
            <TicketCard key={ticket.ticketId} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
};
