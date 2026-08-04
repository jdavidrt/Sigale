import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { eventsApi } from "../api/events";
import { getAuth } from "../api/admin";
import { useLocalStorageValue } from "../hooks/useLocalStorageValue";

/** Build the organizer Basic-auth header for write calls, or undefined if not logged in. */
function authOpts() {
  const auth = getAuth();
  return auth?.basic ? { headers: { Authorization: `Basic ${auth.basic}` } } : undefined;
}

const EventContext = createContext();

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) throw new Error("useEvent must be used within EventProvider");
  return context;
};

// Multi-event (2.0): there is no more "the one active event" to auto-load on
// mount. Public pages resolve an event by URL slug (loadEventBySlug); the
// organizer panel scopes to whichever event is selected (selectEvent),
// restored across visits via a persisted id. Source of truth is still the
// DB — nothing here is cached to localStorage except the selected event id,
// which is just a preference, not event/ticket data.
export const EventProvider = ({ children }) => {
  const [event, setEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(false);
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useLocalStorageValue("sigale-selected-event-id", "");

  /** Public pages: resolve an event by its URL slug (LandingPage, PurchaseFlowPage). */
  const loadEventBySlug = useCallback((slug) => {
    if (!slug) {
      setEvent(null);
      return Promise.resolve(null);
    }
    setEventLoading(true);
    return eventsApi
      .getBySlug(slug)
      .then((e) => {
        setEvent(e);
        return e;
      })
      .catch(() => {
        setEvent(null);
        return null;
      })
      .finally(() => setEventLoading(false));
  }, []);

  /** Organizer: switch the scoped event (persisted so it survives a reload). */
  const selectEvent = useCallback(
    (id) => {
      if (!id) return Promise.resolve(null);
      setSelectedEventId(String(id));
      setEventLoading(true);
      return eventsApi
        .getById(id)
        .then((e) => {
          setEvent(e);
          return e;
        })
        .catch(() => {
          setEvent(null);
          return null;
        })
        .finally(() => setEventLoading(false));
    },
    [setSelectedEventId],
  );

  /**
   * Organizer event selector: fetch every event, then restore the persisted
   * selection if it still exists, else default to the most recent
   * (eventsApi.listAll is ORDER BY eventDate DESC). Called once by
   * OrganizerMenu on mount — the only chrome shared by every organizer page
   * (AdminLayout-wrapped pages, plus the hand-rolled /admin and /scan).
   */
  const refreshOrganizerEvents = useCallback(async () => {
    const rows = await eventsApi.listAll(authOpts());
    setOrganizerEvents(rows);
    const stillExists = selectedEventId && rows.some((r) => String(r.id) === String(selectedEventId));
    if (stillExists) {
      if (!event || String(event.id) !== String(selectedEventId)) {
        await selectEvent(selectedEventId);
      }
    } else if (rows.length > 0) {
      await selectEvent(rows[0].id);
    } else {
      setEvent(null);
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId, selectEvent]);

  /** Re-fetch whatever event is currently loaded (by id — works for both a
   * slug-loaded public event and an organizer-selected one). Swallows
   * errors and leaves the current state untouched, since this is called
   * after routine actions (confirm/reject a purchase) where a transient
   * network hiccup shouldn't blank an already-rendered page. */
  const refreshEvent = useCallback(() => {
    if (!event?.id) return Promise.resolve(null);
    return eventsApi
      .getById(event.id)
      .then((e) => {
        setEvent(e);
        return e;
      })
      .catch(() => null);
  }, [event?.id]);

  const createEvent = useCallback(
    async (eventData) => {
      const created = await eventsApi.create(eventData, authOpts());
      setEvent(created);
      setSelectedEventId(String(created.id));
      // Best-effort refresh so the new event shows up in the selector right
      // away; a failure here doesn't affect the event that was just created.
      eventsApi
        .listAll(authOpts())
        .then(setOrganizerEvents)
        .catch(() => {});
      return created;
    },
    [setSelectedEventId],
  );

  const updateEvent = useCallback(
    async (eventData) => {
      const id = event?.id ?? eventData.id;
      if (!id) throw new Error("No hay un evento seleccionado para actualizar.");
      const updated = await eventsApi.update(id, eventData, authOpts());
      setEvent(updated);
      eventsApi
        .listAll(authOpts())
        .then(setOrganizerEvents)
        .catch(() => {});
      return updated;
    },
    [event],
  );

  const clearEvent = useCallback(() => {
    setEvent(null);
  }, []);

  const hasEvent = useCallback(() => event !== null, [event]);

  const value = useMemo(
    () => ({
      event,
      eventLoading,
      eventId: event?.id ?? null,
      createEvent,
      updateEvent,
      clearEvent,
      hasEvent,
      refreshEvent,
      // Multi-event additions — organizer selector + public slug resolution.
      organizerEvents,
      selectedEventId,
      selectEvent,
      refreshOrganizerEvents,
      loadEventBySlug,
    }),
    [
      event,
      eventLoading,
      createEvent,
      updateEvent,
      clearEvent,
      hasEvent,
      refreshEvent,
      organizerEvents,
      selectedEventId,
      selectEvent,
      refreshOrganizerEvents,
      loadEventBySlug,
    ],
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};
