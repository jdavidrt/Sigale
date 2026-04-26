import { useState, useEffect, useCallback } from "react";
import { saveToStorage, loadFromStorage } from "../utils/storage";

const SYNC_EVENT = "sigale-storage-sync";

export const useLocalStorage = (initialValue) => {
  const [data, setDataState] = useState(() => {
    const stored = loadFromStorage();
    return stored || initialValue;
  });

  // Last write error (null when the last write succeeded). UI can subscribe
  // to this and surface a banner to the operator — silent failures at the
  // door are the worst case (ticket seems checked in, but wasn't persisted).
  const [lastError, setLastError] = useState(null);

  const setData = useCallback((newValue) => {
    setDataState(newValue);
    const result = saveToStorage(newValue);
    if (result.ok) {
      setLastError(null);
    } else {
      setLastError({ reason: result.reason, at: Date.now() });
    }
    window.dispatchEvent(new Event(SYNC_EVENT));
    return result;
  }, []);

  useEffect(() => {
    const handler = () => {
      const stored = loadFromStorage();
      if (stored) setDataState(stored);
    };
    window.addEventListener(SYNC_EVENT, handler);
    return () => window.removeEventListener(SYNC_EVENT, handler);
  }, []);

  const clearError = useCallback(() => setLastError(null), []);

  return [data, setData, { lastError, clearError }];
};
