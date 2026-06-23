import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { eventsApi } from "../api/events";
import { getAuth } from "../api/admin";

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

// Source of truth is now the DB. Event state is loaded fresh from the API on
// every mount; we never persist event/ticket data to localStorage (per 2.0
// rule "no more localstorage, only session info can be local").
export const EventProvider = ({ children }) => {
  const [event, setEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);

  const fetchActiveEvent = useCallback(() => {
    setEventLoading(true);
    eventsApi
      .getActive()
      .then((e) => setEvent(e))
      .catch(() => setEvent(null))
      .finally(() => setEventLoading(false));
  }, []);

  useEffect(() => {
    fetchActiveEvent();
  }, [fetchActiveEvent]);

  const refreshEvent = useCallback(() => {
    fetchActiveEvent();
  }, [fetchActiveEvent]);

  const createEvent = useCallback(async (eventData) => {
    const created = await eventsApi.create(eventData, authOpts());
    setEvent(created);
    return created;
  }, []);

  const updateEvent = useCallback(
    async (eventData) => {
      const id = event?.id ?? eventData.id;
      if (!id) throw new Error("No hay un evento activo para actualizar.");
      const updated = await eventsApi.update(id, eventData, authOpts());
      setEvent(updated);
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
    }),
    [event, eventLoading, createEvent, updateEvent, clearEvent, hasEvent, refreshEvent],
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};
