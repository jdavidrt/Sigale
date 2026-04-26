import { createContext, useCallback, useContext, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { loadFromStorage } from "../utils/storage";
import { generateValidationHash, generateTicketId } from "../utils/hashGenerator";
import { toLocalDateString } from "../utils/timeFormat";

const TicketContext = createContext();

export const useTickets = () => {
  const context = useContext(TicketContext);
  if (!context) throw new Error("useTickets must be used within TicketProvider");
  return context;
};

// H6: identify duplicate rows on CSV re-import by hashing the natural key.
// We do NOT include purchaseDate in the dedupe key — that field is assigned
// at import time, so a second upload of the same export would always see a
// different date and skip nothing.
const dedupeKey = (t) =>
  `${(t.buyerId || "").trim()}|${(t.buyerName || "").trim().toLowerCase()}|${(t.ticketType || "").trim()}`;

// H3: pure, pullable-out-of-the-provider stats computation. Kept as a module
// function so the useMemo dep list in the provider is straightforward.
const computeStats = (tickets, event) => {
  const stats = {
    totalSold: 0,
    totalCheckedIn: 0,
    byType: {},
    revenue: { total: 0, byType: {} },
  };
  const types = event?.ticketTypes || {};

  tickets.forEach((ticket) => {
    const type = ticket.ticketType;
    const price = types[type] || 0;

    if (!stats.byType[type]) stats.byType[type] = { sold: 0, checkedIn: 0 };
    if (price > 0) {
      stats.byType[type].sold++;
      stats.totalSold++;
    }
    if (ticket.checkedIn) {
      stats.byType[type].checkedIn++;
      stats.totalCheckedIn++;
    }

    stats.revenue.total += price;
    if (!stats.revenue.byType[type]) stats.revenue.byType[type] = 0;
    stats.revenue.byType[type] += price;
  });

  return stats;
};

export const TicketProvider = ({ children }) => {
  const [data, setData, storage] = useLocalStorage({ event: null, tickets: [] });

  const addTicket = useCallback(async (ticketData) => {
    const ticketId = generateTicketId();
    const ticket = {
      ticketId,
      ...ticketData,
      purchaseDate: toLocalDateString(),
      checkedIn: false,
      checkInTime: null,
    };

    const validationHash = await generateValidationHash(ticket);
    ticket.validationHash = validationHash;

    const fresh = loadFromStorage() || data;
    setData({ ...fresh, tickets: [...fresh.tickets, ticket] });
    return ticket;
  }, [data, setData]);

  const searchTickets = useCallback((query) => {
    if (!query || query.trim() === "") return data.tickets;

    const lowercaseQuery = query.toLowerCase();
    return data.tickets.filter(
      (ticket) =>
        ticket.buyerName.toLowerCase().includes(lowercaseQuery) ||
        ticket.buyerId.toLowerCase().includes(lowercaseQuery) ||
        ticket.buyerPhone.toLowerCase().includes(lowercaseQuery) ||
        ticket.ticketId.toLowerCase().includes(lowercaseQuery)
    );
  }, [data.tickets]);

  const getTicketById = useCallback(
    (ticketId) => data.tickets.find((t) => t.ticketId === ticketId),
    [data.tickets]
  );

  const getTicketByHash = useCallback(
    (hash) => data.tickets.find((t) => t.validationHash === hash),
    [data.tickets]
  );

  // Returns a typed result so the scanner UI can distinguish
  //   ok:        successful first check-in
  //   not-found: ticket id does not exist (stale state, deleted, etc.)
  //   already-checked-in: caught by the fresh-read pre-check — another
  //     scanner/tab already checked this ticket in since our render.
  //   write-failed: storage rejected the write (e.g. quota). UI should
  //     surface storageError.
  const checkInTicket = useCallback((ticketId) => {
    const fresh = loadFromStorage() || data;
    const existing = fresh.tickets.find((t) => t.ticketId === ticketId);

    if (!existing) {
      return { ok: false, reason: "not-found" };
    }
    if (existing.checkedIn) {
      return { ok: false, reason: "already-checked-in", ticket: existing };
    }

    const checkInTime = new Date().toISOString();
    const updated = { ...existing, checkedIn: true, checkInTime };
    const updatedTickets = fresh.tickets.map((t) =>
      t.ticketId === ticketId ? updated : t
    );
    const writeResult = setData({ ...fresh, tickets: updatedTickets });
    if (writeResult && writeResult.ok === false) {
      return { ok: false, reason: "write-failed", error: writeResult };
    }
    return { ok: true, ticket: updated };
  }, [data, setData]);

  const updateTicket = useCallback(async (ticketId, updatedData) => {
    const fresh = loadFromStorage() || data;
    const updatedTickets = fresh.tickets.map((ticket) => {
      if (ticket.ticketId === ticketId) {
        return { ...ticket, ...updatedData };
      }
      return ticket;
    });
    setData({ ...fresh, tickets: updatedTickets });
  }, [data, setData]);

  const deleteTicket = useCallback((ticketId) => {
    const fresh = loadFromStorage() || data;
    const updatedTickets = fresh.tickets.filter((ticket) => ticket.ticketId !== ticketId);
    setData({ ...fresh, tickets: updatedTickets });
  }, [data, setData]);

  // H3: memoize stats so every card re-render doesn't re-iterate the array.
  const stats = useMemo(
    () => computeStats(data.tickets, data.event),
    [data.tickets, data.event]
  );
  const getStats = useCallback(() => stats, [stats]);

  const importData = useCallback((importedData) => {
    setData(importedData);
  }, [setData]);

  const clearAllTickets = useCallback(() => {
    const fresh = loadFromStorage() || data;
    setData({ ...fresh, tickets: [] });
  }, [data, setData]);

  // M7: device-handoff wipe — clears event AND tickets in one shot so the
  // next operator doesn't see stale data. Called by an explicit "Reset this
  // device" button, not by createEvent (which may be in-progress).
  const clearAllData = useCallback(() => {
    setData({ event: null, tickets: [] });
  }, [setData]);

  const addTicketsFromCSV = useCallback(async (ticketDataArray) => {
    const results = { added: 0, skipped: 0, errors: [] };
    const newTickets = [];

    const fresh = loadFromStorage() || data;
    // H6: pre-seed with existing keys so the new batch is deduped against
    // both (a) tickets already in storage and (b) other rows in the same import.
    const seenKeys = new Set(fresh.tickets.map(dedupeKey));

    for (const ticketData of ticketDataArray) {
      try {
        const key = dedupeKey(ticketData);
        if (seenKeys.has(key)) {
          results.skipped++;
          continue;
        }
        seenKeys.add(key);

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

    setData({ ...fresh, tickets: [...fresh.tickets, ...newTickets] });
    return results;
  }, [data, setData]);

  // H2: memoize the context value so consumers don't re-render on every
  // provider render with a fresh object identity.
  const value = useMemo(
    () => ({
      tickets: data.tickets,
      stats,
      addTicket,
      updateTicket,
      searchTickets,
      getTicketById,
      getTicketByHash,
      checkInTicket,
      deleteTicket,
      getStats,
      importData,
      clearAllTickets,
      clearAllData,
      addTicketsFromCSV,
      storageError: storage?.lastError ?? null,
      clearStorageError: storage?.clearError ?? (() => {}),
    }),
    [
      data.tickets,
      stats,
      addTicket,
      updateTicket,
      searchTickets,
      getTicketById,
      getTicketByHash,
      checkInTicket,
      deleteTicket,
      getStats,
      importData,
      clearAllTickets,
      clearAllData,
      addTicketsFromCSV,
      storage?.lastError,
      storage?.clearError,
    ]
  );

  return (
    <TicketContext.Provider value={value}>
      {children}
    </TicketContext.Provider>
  );
};
