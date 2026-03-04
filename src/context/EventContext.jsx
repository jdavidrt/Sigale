import { createContext, useContext } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { loadFromStorage } from "../utils/storage";

const EventContext = createContext();

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) throw new Error("useEvent must be used within EventProvider");
  return context;
};

export const EventProvider = ({ children }) => {
  const [data, setData] = useLocalStorage({
    event: null,
    tickets: [],
  });

  const createEvent = (eventData) => {
    const fresh = loadFromStorage() || data;
    setData({
      ...fresh,
      event: { ...eventData, createdAt: new Date().toISOString() },
    });
  };

  const updateEvent = (eventData) => {
    const fresh = loadFromStorage() || data;
    setData({
      ...fresh,
      event: { ...fresh.event, ...eventData },
    });
  };

  const clearEvent = () => {
    setData({ event: null, tickets: [] });
  };

  const hasEvent = () => data.event !== null;

  return (
    <EventContext.Provider value={{ event: data.event, createEvent, updateEvent, clearEvent, hasEvent }}>
      {children}
    </EventContext.Provider>
  );
};
