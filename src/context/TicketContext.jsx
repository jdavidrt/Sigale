import { createContext, useContext } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { loadFromStorage } from "../utils/storage";
import { generateValidationHash, generateTicketId } from "../utils/hashGenerator";

const TicketContext = createContext();

export const useTickets = () => {
  const context = useContext(TicketContext);
  if (!context) throw new Error("useTickets must be used within TicketProvider");
  return context;
};

export const TicketProvider = ({ children }) => {
  const [data, setData] = useLocalStorage({ event: null, tickets: [] });

  const addTicket = async (ticketData) => {
    const ticketId = generateTicketId();
    const ticket = {
      ticketId,
      ...ticketData,
      purchaseDate: new Date().toISOString().split("T")[0],
      checkedIn: false,
      checkInTime: null,
    };

    const validationHash = await generateValidationHash(ticket);
    ticket.validationHash = validationHash;

    const fresh = loadFromStorage() || data;
    setData({ ...fresh, tickets: [...fresh.tickets, ticket] });
    return ticket;
  };

  const searchTickets = (query) => {
    if (!query || query.trim() === "") return data.tickets;

    const lowercaseQuery = query.toLowerCase();
    return data.tickets.filter(
      (ticket) =>
        ticket.buyerName.toLowerCase().includes(lowercaseQuery) ||
        ticket.buyerId.toLowerCase().includes(lowercaseQuery) ||
        ticket.buyerPhone.toLowerCase().includes(lowercaseQuery) ||
        ticket.ticketId.toLowerCase().includes(lowercaseQuery)
    );
  };

  const getTicketById = (ticketId) => data.tickets.find((t) => t.ticketId === ticketId);

  const getTicketByHash = (hash) => data.tickets.find((t) => t.validationHash === hash);

  const checkInTicket = (ticketId) => {
    const fresh = loadFromStorage() || data;
    const updatedTickets = fresh.tickets.map((ticket) =>
      ticket.ticketId === ticketId
        ? { ...ticket, checkedIn: true, checkInTime: new Date().toISOString() }
        : ticket
    );
    setData({ ...fresh, tickets: updatedTickets });
  };

  const updateTicket = async (ticketId, updatedData) => {
    const fresh = loadFromStorage() || data;
    const updatedTickets = fresh.tickets.map((ticket) => {
      if (ticket.ticketId === ticketId) {
        return { ...ticket, ...updatedData };
      }
      return ticket;
    });
    setData({ ...fresh, tickets: updatedTickets });
  };

  const deleteTicket = (ticketId) => {
    const fresh = loadFromStorage() || data;
    const updatedTickets = fresh.tickets.filter((ticket) => ticket.ticketId !== ticketId);
    setData({ ...fresh, tickets: updatedTickets });
  };

  const getStats = () => {
    const stats = {
      totalSold: data.tickets.length,
      totalCheckedIn: data.tickets.filter((t) => t.checkedIn).length,
      byType: {},
      revenue: { total: 0, byType: {} },
    };

    data.tickets.forEach((ticket) => {
      const type = ticket.ticketType;
      if (!stats.byType[type]) stats.byType[type] = { sold: 0, checkedIn: 0 };
      stats.byType[type].sold++;
      if (ticket.checkedIn) stats.byType[type].checkedIn++;

      const price = data.event?.ticketTypes[type] || 0;
      stats.revenue.total += price;
      if (!stats.revenue.byType[type]) stats.revenue.byType[type] = 0;
      stats.revenue.byType[type] += price;
    });

    return stats;
  };

  const importData = (importedData) => {
    setData(importedData);
  };

  const resetAllCheckIns = () => {
    const fresh = loadFromStorage() || data;
    const updatedTickets = fresh.tickets.map((ticket) => ({
      ...ticket,
      checkedIn: false,
      checkInTime: null,
    }));
    setData({ ...fresh, tickets: updatedTickets });
  };

  const addTicketsFromCSV = async (ticketDataArray) => {
    const results = { added: 0, errors: [] };
    const newTickets = [];

    for (const ticketData of ticketDataArray) {
      try {
        const ticketId = generateTicketId();
        const ticket = {
          ticketId,
          buyerName: ticketData.buyerName,
          buyerId: ticketData.buyerId,
          buyerPhone: ticketData.buyerPhone,
          ticketType: ticketData.ticketType,
          purchaseDate: ticketData.purchaseDate,
          checkedIn: false,
          checkInTime: null,
        };

        ticket.validationHash = await generateValidationHash(ticket);
        newTickets.push(ticket);
        results.added++;
      } catch (err) {
        results.errors.push(`${ticketData.buyerName}: ${err.message}`);
      }
    }

    setData({ ...data, tickets: [...data.tickets, ...newTickets] });
    return results;
  };

  return (
    <TicketContext.Provider
      value={{
        tickets: data.tickets,
        addTicket,
        updateTicket,
        searchTickets,
        getTicketById,
        getTicketByHash,
        checkInTicket,
        deleteTicket,
        getStats,
        importData,
        resetAllCheckIns,
        addTicketsFromCSV,
      }}
    >
      {children}
    </TicketContext.Provider>
  );
};
