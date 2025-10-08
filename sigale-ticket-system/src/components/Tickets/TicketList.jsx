import { useState, useMemo } from "react";
import { useTickets } from "../../context/TicketContext";
import { TicketCard } from "./TicketCard";

export const TicketList = () => {
  const { tickets, searchTickets } = useTickets();
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
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="🔍 Search by name, ID, phone, or ticket number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium whitespace-nowrap"
            >
              Clear Search
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 flex gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-gray-900">{stats.total}</span>
            <span className="text-gray-600">
              {stats.total === 1 ? "ticket" : "tickets"} found
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-green-700">{stats.checkedIn}</span>
            <span className="text-gray-600">checked in</span>
          </div>
        </div>
      </div>

      {/* Tickets Grid */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 border border-gray-100 text-center">
          <div className="text-6xl mb-4">🎫</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Tickets Found</h3>
          <p className="text-gray-600">
            {searchQuery
              ? "Try a different search query"
              : "No tickets have been created yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map((ticket) => (
            <TicketCard key={ticket.ticketId} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
};
