import { useState, useEffect } from "react";

/**
 * Single-key React state mirrored to a localStorage entry.
 *
 * Distinct from the project's main `useLocalStorage` hook (which syncs
 * the entire app blob across tabs) — this one is for tiny user-prefs
 * like the active language or a debug flag.
 *
 * Reads + writes are wrapped in try/catch so Safari private mode or
 * a full quota can't crash the consuming component.
 *
 * @template T
 * @param {string} key   - localStorage key
 * @param {T | (() => T)} initial - Initial value or lazy initializer (called when no stored value exists)
 * @returns {[T, (next: T) => void]}
 */
export const useLocalStorageValue = (key, initial) => {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) return stored;
    } catch {
      /* localStorage may be unavailable — fall through to initial */
    }
    return typeof initial === "function" ? initial() : initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* Quota / private mode — best-effort only */
    }
  }, [key, value]);

  return [value, setValue];
};
