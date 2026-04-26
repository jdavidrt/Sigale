import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveToStorage,
  loadFromStorage,
  clearStorage,
  getStorageSize,
  CURRENT_SCHEMA_VERSION,
} from '../src/utils/storage.js';

// Minimal in-memory localStorage shim so these pure-function tests can run
// in Node without jsdom.
class MemoryStorage {
  constructor() { this.store = new Map(); }
  getItem(k) { return this.store.has(k) ? this.store.get(k) : null; }
  setItem(k, v) { this.store.set(k, String(v)); }
  removeItem(k) { this.store.delete(k); }
  clear() { this.store.clear(); }
}

globalThis.localStorage = new MemoryStorage();

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('storage round-trip', () => {
  it('saves and loads the same object shape, stamped with schemaVersion (M4)', () => {
    const data = { event: { name: 'Test' }, tickets: [{ ticketId: 'x' }] };
    expect(saveToStorage(data)).toEqual({ ok: true });
    expect(loadFromStorage()).toEqual({ ...data, schemaVersion: CURRENT_SCHEMA_VERSION });
  });

  it('migrates legacy data without schemaVersion on load (M4)', () => {
    // Simulate data written by a pre-M4 build: no schemaVersion field.
    localStorage.setItem('sigale-event-data', JSON.stringify({ event: null, tickets: [] }));
    const loaded = loadFromStorage();
    expect(loaded.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('returns null when nothing has been stored', () => {
    expect(loadFromStorage()).toBeNull();
  });

  it('returns null when stored data is corrupted JSON', () => {
    localStorage.setItem('sigale-event-data', '{not-json');
    expect(loadFromStorage()).toBeNull();
  });

  it('clearStorage removes the record', () => {
    saveToStorage({ event: null, tickets: [] });
    expect(loadFromStorage()).not.toBeNull();
    clearStorage();
    expect(loadFromStorage()).toBeNull();
  });

  it('getStorageSize is zero when empty, >0 after save', () => {
    expect(getStorageSize()).toBe(0);
    saveToStorage({ event: null, tickets: [] });
    expect(getStorageSize()).toBeGreaterThan(0);
  });
});

describe('quota handling (audit finding C5 — fixed)', () => {
  it('returns { ok: false, reason: "quota" } when setItem throws QuotaExceededError', () => {
    const err = new Error('quota');
    err.name = 'QuotaExceededError';
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw err; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = saveToStorage({ tickets: [] });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('quota');
    expect(result.error).toBe(err);
  });

  it('detects quota via numeric error code 22 as well', () => {
    const err = Object.assign(new Error('out of space'), { code: 22 });
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw err; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(saveToStorage({}).reason).toBe('quota');
  });

  it('returns reason "unknown" for non-quota errors', () => {
    const err = new Error('something else');
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw err; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(saveToStorage({}).reason).toBe('unknown');
  });
});
