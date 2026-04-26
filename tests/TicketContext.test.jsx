// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { TicketProvider, useTickets } from '../src/context/TicketContext.jsx';

// Wrapper so renderHook can supply the provider.
const wrapper = ({ children }) => <TicketProvider>{children}</TicketProvider>;

// Prime localStorage with a known event + tickets for tests that need seeded state.
const seed = (tickets = []) => {
  localStorage.setItem(
    'sigale-event-data',
    JSON.stringify({
      event: {
        name: 'Test',
        date: '2026-04-22',
        ticketTypes: { preventa: 50000, vip: 100000, courtesy: 0 },
      },
      tickets,
    })
  );
};

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('TicketProvider — addTicket', () => {
  it('assigns a ticket id and validation hash, persists to storage', async () => {
    seed();
    const { result } = renderHook(() => useTickets(), { wrapper });

    let created;
    await act(async () => {
      created = await result.current.addTicket({
        buyerName: 'Ada',
        buyerId: '12345',
        buyerPhone: '3001234567',
        ticketType: 'preventa',
      });
    });

    expect(created.ticketId).toMatch(/^TKT-[0-9a-f]{8}-\d+$/); // L5 fix
    expect(created.validationHash).toHaveLength(16); // C2 fix
    expect(created.checkedIn).toBe(false);

    const stored = JSON.parse(localStorage.getItem('sigale-event-data'));
    expect(stored.tickets).toHaveLength(1);
    expect(stored.tickets[0].ticketId).toBe(created.ticketId);
  });
});

describe('TicketProvider — checkInTicket (audit C1, race-aware)', () => {
  it('returns { ok: true, ticket } on first check-in', async () => {
    seed([
      { ticketId: 'TKT-001-1', buyerName: 'Ada', buyerId: '1', buyerPhone: '0', ticketType: 'preventa', purchaseDate: '2026-04-22', validationHash: 'abcdef0123456789', checkedIn: false, checkInTime: null },
    ]);
    const { result } = renderHook(() => useTickets(), { wrapper });

    let res;
    await act(async () => { res = result.current.checkInTicket('TKT-001-1'); });

    expect(res.ok).toBe(true);
    expect(res.ticket.checkedIn).toBe(true);
    expect(res.ticket.checkInTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns { ok: false, reason: "not-found" } for an unknown id', async () => {
    seed();
    const { result } = renderHook(() => useTickets(), { wrapper });

    let res;
    await act(async () => { res = result.current.checkInTicket('TKT-nope'); });

    expect(res).toEqual({ ok: false, reason: 'not-found' });
  });

  it('returns { ok: false, reason: "already-checked-in" } on second scan', async () => {
    seed([
      { ticketId: 'TKT-001-1', buyerName: 'Ada', buyerId: '1', buyerPhone: '0', ticketType: 'preventa', purchaseDate: '2026-04-22', validationHash: 'abcdef0123456789', checkedIn: false, checkInTime: null },
    ]);
    const { result } = renderHook(() => useTickets(), { wrapper });

    await act(async () => { result.current.checkInTicket('TKT-001-1'); });
    let second;
    await act(async () => { second = result.current.checkInTicket('TKT-001-1'); });

    expect(second.ok).toBe(false);
    expect(second.reason).toBe('already-checked-in');
    expect(second.ticket.checkedIn).toBe(true);
  });

  // Simulates the cross-tab race: after this provider renders, another
  // "tab" writes a check-in directly to localStorage. This provider's
  // in-memory state still shows checkedIn=false, but checkInTicket's
  // fresh-read pre-check must still reject.
  it('rejects when another tab checked in between render and scan (C1)', async () => {
    seed([
      { ticketId: 'TKT-001-1', buyerName: 'Ada', buyerId: '1', buyerPhone: '0', ticketType: 'preventa', purchaseDate: '2026-04-22', validationHash: 'abcdef0123456789', checkedIn: false, checkInTime: null },
    ]);
    const { result } = renderHook(() => useTickets(), { wrapper });

    // Another "tab" writes a check-in directly to storage.
    const stored = JSON.parse(localStorage.getItem('sigale-event-data'));
    stored.tickets[0].checkedIn = true;
    stored.tickets[0].checkInTime = new Date().toISOString();
    localStorage.setItem('sigale-event-data', JSON.stringify(stored));

    // Our provider's in-memory tickets array still shows checkedIn: false,
    // but checkInTicket re-reads storage first.
    expect(result.current.tickets[0].checkedIn).toBe(false);

    let res;
    await act(async () => { res = result.current.checkInTicket('TKT-001-1'); });

    expect(res.ok).toBe(false);
    expect(res.reason).toBe('already-checked-in');
  });
});

describe('TicketProvider — clearAllTickets (audit C3, renamed from resetAllCheckIns)', () => {
  it('deletes every ticket and preserves the event', async () => {
    seed([
      { ticketId: 'TKT-001-1', buyerName: 'A', buyerId: '1', buyerPhone: '0', ticketType: 'preventa', purchaseDate: '2026-04-22', validationHash: 'h', checkedIn: false, checkInTime: null },
      { ticketId: 'TKT-001-2', buyerName: 'B', buyerId: '2', buyerPhone: '0', ticketType: 'preventa', purchaseDate: '2026-04-22', validationHash: 'h2', checkedIn: true, checkInTime: '2026-04-22T10:00:00Z' },
    ]);
    const { result } = renderHook(() => useTickets(), { wrapper });

    expect(result.current.tickets).toHaveLength(2);
    await act(async () => { result.current.clearAllTickets(); });

    expect(result.current.tickets).toHaveLength(0);
    const stored = JSON.parse(localStorage.getItem('sigale-event-data'));
    expect(stored.event).not.toBeNull(); // event preserved
    expect(stored.tickets).toEqual([]);
  });

  it('no longer exposes the old resetAllCheckIns symbol', () => {
    seed();
    const { result } = renderHook(() => useTickets(), { wrapper });
    expect(result.current.resetAllCheckIns).toBeUndefined();
    expect(typeof result.current.clearAllTickets).toBe('function');
  });
});

describe('TicketProvider — addTicketsFromCSV (audit C4, fresh-read)', () => {
  // Simulates the C4 scenario: another tab adds a ticket while a CSV
  // import is in progress. Before the fix, the CSV write would spread
  // this provider's stale `data.tickets` and overwrite the new ticket.
  it('preserves concurrent writes from another tab while importing', async () => {
    seed([
      { ticketId: 'TKT-pre-1', buyerName: 'Existing', buyerId: '999', buyerPhone: '0', ticketType: 'preventa', purchaseDate: '2026-04-22', validationHash: 'h0', checkedIn: false, checkInTime: null },
    ]);
    const { result } = renderHook(() => useTickets(), { wrapper });

    // Another "tab" appends a ticket AFTER this provider has rendered
    // but before our CSV import writes.
    const stored = JSON.parse(localStorage.getItem('sigale-event-data'));
    stored.tickets.push({
      ticketId: 'TKT-race-1', buyerName: 'RaceWinner', buyerId: '111',
      buyerPhone: '0', ticketType: 'preventa', purchaseDate: '2026-04-22',
      validationHash: 'hrace', checkedIn: false, checkInTime: null,
    });
    localStorage.setItem('sigale-event-data', JSON.stringify(stored));

    // Now import one new ticket via CSV. With the fix, the import reads
    // fresh state first and includes BOTH the existing ticket AND the
    // race-written ticket, plus the new import.
    await act(async () => {
      await result.current.addTicketsFromCSV([
        {
          buyerName: 'Imported',
          buyerId: '222',
          buyerPhone: '3',
          ticketType: 'preventa',
          purchaseDate: '2026-04-22',
        },
      ]);
    });

    const final = JSON.parse(localStorage.getItem('sigale-event-data'));
    const ids = final.tickets.map((t) => t.ticketId);
    expect(ids).toContain('TKT-pre-1');
    expect(ids).toContain('TKT-race-1'); // would be lost without C4 fix
    expect(final.tickets.find((t) => t.buyerName === 'Imported')).toBeDefined();
    expect(final.tickets).toHaveLength(3);
  });

  it('assigns 16-char validation hash to every imported ticket (C2)', async () => {
    seed();
    const { result } = renderHook(() => useTickets(), { wrapper });

    await act(async () => {
      await result.current.addTicketsFromCSV([
        { buyerName: 'A', buyerId: '1', buyerPhone: '0', ticketType: 'preventa', purchaseDate: '2026-04-22' },
        { buyerName: 'B', buyerId: '2', buyerPhone: '0', ticketType: 'preventa', purchaseDate: '2026-04-22' },
      ]);
    });

    const stored = JSON.parse(localStorage.getItem('sigale-event-data'));
    for (const t of stored.tickets) {
      expect(t.validationHash).toHaveLength(16);
    }
  });
});

describe('TicketProvider — storageError (audit C5)', () => {
  it('exposes a storageError and clearStorageError through context', () => {
    seed();
    const { result } = renderHook(() => useTickets(), { wrapper });
    expect(result.current.storageError).toBeNull();
    expect(typeof result.current.clearStorageError).toBe('function');
  });

  it('populates storageError when a write fails with quota', async () => {
    seed();
    const { result } = renderHook(() => useTickets(), { wrapper });

    vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('quota');
    err.name = 'QuotaExceededError';
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    // Let the SEED write succeed, but fail future writes.
    let shouldFail = true;
    setItemSpy.mockImplementation(function (k, v) {
      if (shouldFail) throw err;
      return Storage.prototype.setItem.wrappedMethod?.call(this, k, v);
    });

    await act(async () => {
      await result.current.addTicket({
        buyerName: 'Ada', buyerId: '1', buyerPhone: '0', ticketType: 'preventa',
      });
    });

    expect(result.current.storageError).not.toBeNull();
    expect(result.current.storageError.reason).toBe('quota');

    // Next successful write clears the error.
    shouldFail = false;
    setItemSpy.mockRestore();
    await act(async () => { result.current.clearStorageError(); });
    expect(result.current.storageError).toBeNull();
  });
});

describe('TicketProvider — addTicketsFromCSV dedupe (audit H6)', () => {
  it('skips rows that duplicate an existing ticket (same buyerId + name + type)', async () => {
    seed([
      { ticketId: 'TKT-001-1', buyerName: 'Ada', buyerId: '999', buyerPhone: '0', ticketType: 'preventa', purchaseDate: '2026-04-22', validationHash: 'h0', checkedIn: false, checkInTime: null },
    ]);
    const { result } = renderHook(() => useTickets(), { wrapper });

    let results;
    await act(async () => {
      results = await result.current.addTicketsFromCSV([
        // Exact same natural-key as the seeded ticket → should be skipped
        { buyerName: 'Ada', buyerId: '999', buyerPhone: '0', ticketType: 'preventa', purchaseDate: '2026-04-22' },
        // New buyer → should be added
        { buyerName: 'Grace', buyerId: '111', buyerPhone: '0', ticketType: 'preventa', purchaseDate: '2026-04-22' },
      ]);
    });

    expect(results.added).toBe(1);
    expect(results.skipped).toBe(1);
    const stored = JSON.parse(localStorage.getItem('sigale-event-data'));
    expect(stored.tickets).toHaveLength(2);
  });

  it('dedupes duplicate rows within the same import batch', async () => {
    seed();
    const { result } = renderHook(() => useTickets(), { wrapper });

    let results;
    await act(async () => {
      results = await result.current.addTicketsFromCSV([
        { buyerName: 'Ada', buyerId: '1', buyerPhone: '0', ticketType: 'preventa', purchaseDate: '2026-04-22' },
        { buyerName: 'Ada', buyerId: '1', buyerPhone: '0', ticketType: 'preventa', purchaseDate: '2026-04-22' },
      ]);
    });

    expect(results.added).toBe(1);
    expect(results.skipped).toBe(1);
  });
});

describe('TicketProvider — clearAllData (audit M7)', () => {
  it('wipes event and tickets in one shot for device handoff', async () => {
    seed([
      { ticketId: 'TKT-001-1', buyerName: 'A', buyerId: '1', buyerPhone: '0', ticketType: 'preventa', purchaseDate: '2026-04-22', validationHash: 'h', checkedIn: false, checkInTime: null },
    ]);
    const { result } = renderHook(() => useTickets(), { wrapper });

    await act(async () => { result.current.clearAllData(); });

    const stored = JSON.parse(localStorage.getItem('sigale-event-data'));
    expect(stored.event).toBeNull();
    expect(stored.tickets).toEqual([]);
  });
});

describe('TicketProvider — getStats', () => {
  it('counts only paid ticket types in totalSold but includes free in checkedIn', () => {
    seed([
      { ticketId: 't1', buyerName: 'A', buyerId: '1', buyerPhone: '0', ticketType: 'preventa',  purchaseDate: '2026-04-22', validationHash: 'h1', checkedIn: true,  checkInTime: '2026-04-22T10:00:00Z' },
      { ticketId: 't2', buyerName: 'B', buyerId: '2', buyerPhone: '0', ticketType: 'vip',       purchaseDate: '2026-04-22', validationHash: 'h2', checkedIn: false, checkInTime: null },
      { ticketId: 't3', buyerName: 'C', buyerId: '3', buyerPhone: '0', ticketType: 'courtesy',  purchaseDate: '2026-04-22', validationHash: 'h3', checkedIn: true,  checkInTime: '2026-04-22T10:00:00Z' },
    ]);
    const { result } = renderHook(() => useTickets(), { wrapper });
    const stats = result.current.getStats();

    expect(stats.totalSold).toBe(2); // preventa + vip; courtesy (price 0) excluded
    expect(stats.totalCheckedIn).toBe(2);
    expect(stats.revenue.total).toBe(150000); // 50k + 100k + 0
    expect(stats.byType.preventa).toEqual({ sold: 1, checkedIn: 1 });
    expect(stats.byType.vip).toEqual({ sold: 1, checkedIn: 0 });
    expect(stats.byType.courtesy).toEqual({ sold: 0, checkedIn: 1 }); // free ticket not counted as sold
  });
});
