import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { loadFromStorage } from "../utils/storage";
import { computeEventId } from "../utils/qrGenerator";

const EventContext = createContext();

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) throw new Error("useEvent must be used within EventProvider");
  return context;
};

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
    const fresh = loadFromStorage() || data;
    setData({
      ...fresh,
      event: { ...eventData, createdAt: new Date().toISOString() },
    });
  }, [data, setData]);

  const updateEvent = useCallback((eventData) => {
    const fresh = loadFromStorage() || data;
    setData({
      ...fresh,
      event: { ...fresh.event, ...eventData },
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
