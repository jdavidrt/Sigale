import { useState, useMemo } from "react";
import { useTickets } from "../../context/TicketContext";
import { useLanguage } from "../../context/LanguageContext";
import { TicketCard } from "./TicketCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

export const TicketList = () => {
  const { tickets, searchTickets } = useTickets();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTickets = useMemo(() => {
    return searchTickets(searchQuery);
  }, [searchQuery, searchTickets]);

  const stats = useMemo(() => {
    return {
      total: filteredTickets.length,
      checkedIn: filteredTickets.filter((t) => t.checkedIn).length,
    };
  }, [filteredTickets]);

  return (
    <div className="space-y-5">
      {/* Search Bar */}
      <div className="relative">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BEADFF] opacity-50" />
        <input
          type="text"
          placeholder={`${t("searchTickets")}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-[#758BFD] border-opacity-30 rounded-lg text-[#FFEDD8] placeholder-[#BEADFF] placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-[#758BFD] focus:ring-opacity-50 text-sm"
        />
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-[13px]">
        <span className="text-[#4ade80] font-semibold">
          {stats.total} {stats.total === 1 ? 'ticket found' : 'tickets found'}
        </span>
        <span className="text-[#758BFD] font-semibold">
          {stats.checkedIn} {t("checkedIn")}
        </span>
      </div>

      {/* Tickets Grid */}
      {filteredTickets.length === 0 ? (
        <div className="bg-[#2a2a2a] rounded-xl p-12 border border-[#758BFD] border-opacity-20 text-center">
          <div className="text-6xl mb-4">🎫</div>
          <h3 className="text-xl font-bold text-[#FFEDD8] mb-2">{t("noTickets")}</h3>
          <p className="text-[#BEADFF]">
            {searchQuery
              ? "Try a different search query"
              : t("noTicketsDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredTickets.map((ticket) => (
            <TicketCard key={ticket.ticketId} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
};
