import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { loadFromStorage } from "../utils/storage";
import { computeEventId } from "../utils/qrGenerator";
import { deriveTicketTypes /*, eventsApi */ } from "../api/events";

const EventContext = createContext();

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) throw new Error("useEvent must be used within EventProvider");
  return context;
};

/*
 * ────────────────────────────────────────────────────────────────────────────
 * 2.0 BACKEND MIGRATION — read me before flipping
 *
 * Today this context is the local source of truth: the event lives in the
 * `sigale-event-data` localStorage blob (shared with TicketContext). The 2.0
 * server isn't running locally yet, so we keep that working and just grow the
 * event shape to the richer schema (stages[], venueCapacity, artists, …).
 *
 * When the backend is live (VITE_API_URL points at it), switch over by:
 *   1. On mount, `eventsApi.getActive()` -> setEvent(...) (with loading/error).
 *   2. In createEvent/updateEvent, `await eventsApi.create/update(...)` and use
 *      the returned event instead of writing localStorage (see the marked
 *      blocks below). `src/api/events.js` already has the matching shapes.
 *   3. Drop the localStorage writes once TicketContext is migrated (Phase 3).
 * Each switch point is tagged `// >>> API:` below.
 * ────────────────────────────────────────────────────────────────────────────
 */

/**
 * Normalize an event to the 2.0 shape so every consumer can rely on
 * `stages` (array) and `ticketTypes` (derived map, kept for back-compat with
 * Home + TicketContext stats). Legacy events that only have `ticketTypes`
 * get a `stages` array synthesized from it.
 */
function normalizeEvent(eventData) {
  if (!eventData) return null;

  let stages = Array.isArray(eventData.stages) ? eventData.stages : null;

  // Back-compat: synthesize stages from a legacy ticketTypes map.
  if (!stages && eventData.ticketTypes) {
    stages = Object.entries(eventData.ticketTypes).map(([name, price], i) => ({
      name,
      price: Number(price) || 0,
      totalQuantity: 0, // unknown for legacy events; organizer can fill on edit
      sortOrder: i,
      activatesAt: null,
      status: i === 0 ? "active" : "upcoming",
    }));
  }

  stages = stages || [];

  return {
    ...eventData,
    stages,
    // ticketTypes stays in lock-step with stages so legacy reads keep working.
    ticketTypes: deriveTicketTypes(stages),
  };
}

export const EventProvider = ({ children }) => {
  const [data, setData] = useLocalStorage({ event: null, tickets: [] });
  const [eventId, setEventId] = useState(null);

  // Recompute the stable event id whenever the event changes. Cheap
  // enough (one SHA-256 on a short string) to refresh eagerly.
  useEffect(() => {
    let cancelled = false;
    if (!data.event) {
      setEventId(null);
      return undefined;
    }
    computeEventId(data.event).then((id) => {
      if (!cancelled) setEventId(id);
    });
    return () => { cancelled = true; };
  }, [data.event?.name, data.event?.date]);

  const createEvent = useCallback((eventData) => {
    // >>> API: const saved = await eventsApi.create(eventData); then setEvent(saved)
    const fresh = loadFromStorage() || data;
    setData({
      ...fresh,
      event: normalizeEvent({ ...eventData, createdAt: new Date().toISOString() }),
    });
  }, [data, setData]);

  const updateEvent = useCallback((eventData) => {
    // >>> API: const saved = await eventsApi.update(event.id, eventData); then setEvent(saved)
    const fresh = loadFromStorage() || data;
    setData({
      ...fresh,
      event: normalizeEvent({ ...fresh.event, ...eventData }),
    });
  }, [data, setData]);

  const clearEvent = useCallback(() => {
    setData({ event: null, tickets: [] });
  }, [setData]);

  const hasEvent = useCallback(() => data.event !== null, [data.event]);

  // H2: memoize the context value so consumers don't re-render on every
  // provider render with a fresh object identity.
  const value = useMemo(
    () => ({
      event: data.event,
      eventId,
      createEvent,
      updateEvent,
      clearEvent,
      hasEvent,
    }),
    [data.event, eventId, createEvent, updateEvent, clearEvent, hasEvent]
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};
