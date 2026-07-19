import { createContext, useCallback, useContext, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { loadFromStorage } from "../utils/storage";
import { generateValidationHash, generateTicketId } from "../utils/hashGenerator";
import { toLocalDateString } from "../utils/timeFormat";
import { admin, isLoggedIn } from "../api/admin";

/**
 * Map a DB ticket row (joined with its stage) to the internal shape every
 * Tickets/Dashboard component already understands. The DB row carries
 * fields like holderName/isUsed/usedAt; consumers expect
 * buyerName/checkedIn/checkInTime.
 *
 * `dbId` is preserved so updateTicket() can route the patch back to the
 * server when an organizer edits a server-minted ticket.
 */
export const fromServerTicket = (row) => {
  const purchaseDate = String(row.createdAt || "").slice(0, 10);
  const phone = row.holderPhone ? String(row.holderPhone) : "000";
  return {
    ticketId: `t-${row.id}`,
    dbId: row.id,
    buyerName: row.holderName || "",
    buyerId: row.holderIdNumber || "",
    buyerPhone: phone,
    // event.ticketTypes keys are lowercased + trimmed by deriveTicketTypes —
    // match that here so price lookups land.
    ticketType: String(row.stageName || "").toLowerCase().trim(),
    purchaseDate,
    checkedIn: !!row.isUsed,
    checkInTime: row.usedAt || null,
    validationHash: row.validationHash,
    orderId: row.orderId,
    folio: String(row.orderId),
    deliveryMethod: row.deliveryMethod,
    deliveryContact: row.deliveryContact,
    // Order lifecycle status. Only 'confirmed' rows have a validationHash
    // (and thus a scannable QR) — see docs/architecture/TICKETS_SCHEMA.md.
    status: row.status,
  };
};

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
    const target = fresh.tickets.find((t) => t.ticketId === ticketId);
    // If the ticket was hydrated from the server (dbId present), push the
    // edit back so the change persists for everyone — not just this device.
    // Errors propagate to the caller, which renders the toast.
    if (target?.dbId && isLoggedIn()) {
      await admin.updateTicket(target.dbId, {
        holderName: updatedData.buyerName,
        holderIdNumber: updatedData.buyerId,
        holderPhone:
          updatedData.buyerPhone && updatedData.buyerPhone !== "000"
            ? updatedData.buyerPhone
            : null,
      });
    }
    const updatedTickets = fresh.tickets.map((ticket) => {
      if (ticket.ticketId === ticketId) {
        return { ...ticket, ...updatedData };
      }
      return ticket;
    });
    setData({ ...fresh, tickets: updatedTickets });
  }, [data, setData]);

  /**
   * Pull the canonical ticket list from the server and replace the
   * in-memory cache. Called by the Tickets and Dashboard pages on mount.
   * Quietly no-ops if the organizer isn't logged in — falls back to
   * whatever localStorage has.
   *
   * `status` is passed straight through to admin.listTickets() — the
   * server defaults to 'confirmed' when omitted, so callers that need
   * confirmed-only stats (Dashboard) can rely on the default, and callers
   * that want the full lifecycle (Tickets' status filter) pass an
   * explicit value or 'all'.
   */
  const refreshFromServer = useCallback(async (status) => {
    if (!isLoggedIn()) return { ok: false, reason: "not-logged-in" };
    try {
      const rows = await admin.listTickets(status);
      const mapped = Array.isArray(rows) ? rows.map(fromServerTicket) : [];
      const fresh = loadFromStorage() || data;
      setData({ ...fresh, tickets: mapped });
      return { ok: true, count: mapped.length };
    } catch (err) {
      return { ok: false, reason: "fetch-failed", error: err };
    }
  }, [data, setData]);

  const deleteTicket = useCallback(async (ticketId) => {
    // ticketId is the local key "t-{dbId}"; extract the numeric DB id.
    const dbId = String(ticketId).replace(/^t-/, '');
    if (isLoggedIn() && dbId && !isNaN(Number(dbId))) {
      await admin.deleteTicket(Number(dbId));
    }
    const fresh = loadFromStorage() || data;
    const updatedTickets = fresh.tickets.filter((ticket) => ticket.ticketId !== ticketId);
    setData({ ...fresh, tickets: updatedTickets });
  }, [data, setData]);

  // H3: memoize stats so every card re-render doesn't re-iterate the array.
  const stats = useMemo(
    () => computeStats(data.tickets ?? [], data.event),
    [data.tickets, data.event]
  );
  // Stats are computed against an event's ticketTypes price map. EventContext
  // keeps the active event in memory only (never localStorage, per 2.0), so
  // data.event is null here — callers must pass the live event from
  // useEvent() to get non-zero sold/revenue figures. No-arg keeps the old
  // behavior for tests.
  const getStats = useCallback(
    (eventOverride) =>
      eventOverride ? computeStats(data.tickets ?? [], eventOverride) : stats,
    [stats, data.tickets]
  );

  // Deletes all confirmed purchases + tickets on the server (restores stage
  // inventory), then wipes the local cache. Falls back to local-only wipe
  // when not logged in (offline / dev mode).
  const clearAllTickets = useCallback(async () => {
    if (isLoggedIn()) {
      await admin.deleteAllPurchases();
    }
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
      clearAllTickets,
      clearAllData,
      addTicketsFromCSV,
      refreshFromServer,
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
      clearAllTickets,
      clearAllData,
      addTicketsFromCSV,
      refreshFromServer,
      storage?.lastError,
      storage?.clearError,
    ]
  );

  return (
    <TicketContext.Provider value={value}>{children}</TicketContext.Provider>
  );
};
