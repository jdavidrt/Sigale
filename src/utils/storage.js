const STORAGE_KEY = "sigale-event-data";

// Bump this when the persisted schema changes in a way that needs
// migration. Migrations live in SCHEMA_MIGRATIONS below — keyed by the
// version they UPGRADE FROM. Today no migrations exist because we're just
// introducing the version field, but the scaffold is in place for future
// changes.
export const CURRENT_SCHEMA_VERSION = 1;

const SCHEMA_MIGRATIONS = {
  // 0: data before M4 shipped (no schemaVersion field). Already shape-
  // compatible with v1, so the upgrade is just stamping the version.
  0: (data) => ({ ...data, schemaVersion: 1 }),
};

const migrate = (raw) => {
  if (!raw || typeof raw !== "object") return raw;
  let data = raw;
  // Treat a missing schemaVersion as version 0 for back-compat with
  // stores written before M4.
  while ((data.schemaVersion ?? 0) < CURRENT_SCHEMA_VERSION) {
    const from = data.schemaVersion ?? 0;
    const step = SCHEMA_MIGRATIONS[from];
    if (!step) {
      console.warn(`No migration from schema version ${from}; leaving as-is.`);
      break;
    }
    data = step(data);
  }
  return data;
};

// Returns { ok: true } on success, or { ok: false, reason, error } on
// failure. Callers should inspect and surface the error to the user,
// especially for the 'quota' reason — on a device near capacity, a
// silently-failed write leaves the UI out of sync with disk.
export const saveToStorage = (data) => {
  try {
    // Always stamp the current schema version on write, so any read
    // can confidently skip the migration loop.
    const stamped = { ...data, schemaVersion: CURRENT_SCHEMA_VERSION };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
    return { ok: true };
  } catch (error) {
    const isQuota =
      error?.name === "QuotaExceededError" ||
      error?.code === 22 ||
      error?.code === 1014 ||
      /quota/i.test(error?.message || "");
    console.error("Error saving to localStorage:", error);
    return { ok: false, reason: isQuota ? "quota" : "unknown", error };
  }
};

export const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    return null;
  }
};

export const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing localStorage:", error);
    return false;
  }
};

export const getStorageSize = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? new Blob([data]).size : 0;
};

export const getStorageSizeInMB = () => {
  return (getStorageSize() / (1024 * 1024)).toFixed(2);
};
