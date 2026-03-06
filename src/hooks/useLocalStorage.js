import { useState, useEffect, useCallback } from "react";
import { saveToStorage, loadFromStorage } from "../utils/storage";

const SYNC_EVENT = "sigale-storage-sync";

export const useLocalStorage = (initialValue) => {
  const [data, setDataState] = useState(() => {
    const stored = loadFromStorage();
    return stored || initialValue;
  });

  const setData = useCallback((newValue) => {
    setDataState(newValue);
    saveToStorage(newValue);
    window.dispatchEvent(new Event(SYNC_EVENT));
  }, []);

  // Sync state when another context instance writes to the same storage key
  useEffect(() => {
    const handler = () => {
      const stored = loadFromStorage();
      if (stored) setDataState(stored);
    };
    window.addEventListener(SYNC_EVENT, handler);
    return () => window.removeEventListener(SYNC_EVENT, handler);
  }, []);

  return [data, setData];
};
