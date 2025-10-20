import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicketSimple, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { useEvent } from "../context/EventContext";
import { useTickets } from "../context/TicketContext";
import { useLanguage } from "../context/LanguageContext";
import { TicketCard } from "../components/Tickets/TicketCard";

export const TicketsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { event } = useEvent();
  const { tickets, searchTickets } = useTickets();
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

  if (!event) {
    return (
      <div className="min-h-screen px-4 md:px-6 py-6 flex items-center justify-center">
        <div className="bg-[#2a2a2a] rounded-xl p-8 border border-[#758BFD] border-opacity-30 text-center max-w-md">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-6xl mb-4 text-[#758BFD]" />
          <h2 className="text-xl font-bold text-[#FFEDD8] mb-2">{t("noEvent")}</h2>
          <p className="text-[#BEADFF]">{t("noEventDesc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 md:px-6 py-6">
      {/* Decorative circles */}
      <div className="fixed top-[600px] left-[50px] w-[160px] h-[160px] rounded-full bg-[#758BFD] opacity-[0.03] pointer-events-none" />
      <div className="fixed top-[200px] right-[-50px] w-[200px] h-[200px] rounded-full bg-[#BEADFF] opacity-[0.04] pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <FontAwesomeIcon icon={faTicketSimple} className="text-2xl md:text-3xl text-[#758BFD]" />
            <h1 className="text-2xl md:text-3xl font-bold text-[#FFEDD8]">
              {t("allTickets")}
            </h1>
          </div>
          <p className="text-sm md:text-base text-[#BEADFF] opacity-80">
            {filteredTickets.length} {t("ticketsFound")}
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Search Bar */}
          <div>
            <input
              type="text"
              placeholder={t("searchTickets")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#758BFD] border-opacity-30 rounded-lg text-[#FFEDD8] placeholder-[#BEADFF] placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-[#758BFD] focus:ring-opacity-50 text-sm md:text-base"
            />
          </div>

          {/* Ticket Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={handleTypeChange}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#758BFD] border-opacity-30 rounded-lg text-[#FFEDD8] focus:outline-none focus:ring-2 focus:ring-[#758BFD] focus:ring-opacity-50 text-sm md:text-base appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23758BFD' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                backgroundPosition: "right 0.5rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.5em 1.5em",
                paddingRight: "2.5rem",
              }}
            >
              <option value="all">{t("ticketType")}: All / Todos</option>
              {event.ticketTypes && Object.keys(event.ticketTypes).map((type) => (
                <option key={type} value={type}>
                  {type.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tickets Grid */}
        {filteredTickets.length === 0 ? (
          <div className="bg-[#2a2a2a] rounded-xl p-8 border border-[#758BFD] border-opacity-30 text-center">
            <FontAwesomeIcon icon={faTicketSimple} className="text-6xl mb-4 text-[#758BFD]" />
            <h2 className="text-xl font-bold text-[#FFEDD8] mb-2">{t("noTickets")}</h2>
            <p className="text-[#BEADFF]">{t("noTicketsDesc")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTickets.map((ticket) => (
              <TicketCard key={ticket.ticketId} ticket={ticket} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
