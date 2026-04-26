import { describe, it, expect } from 'vitest';
import { ticketsToCSV, ticketsToRoundTripCSV, ticketsToHumanCSV, csvToTickets, isValidTicketType } from '../src/utils/csvUtils.js';

const ticket = (overrides = {}) => ({
  buyerName: 'Ada Lovelace',
  buyerId: '12345',
  buyerPhone: '3001234567',
  ticketType: 'preventa',
  purchaseDate: '2026-04-22',
  ...overrides,
});

describe('ticketsToCSV', () => {
  it('emits header then one row per ticket, in canonical column order', () => {
    const csv = ticketsToCSV([ticket()]);
    const [header, row] = csv.split('\n');
    expect(header).toBe('buyerName,buyerId,buyerPhone,ticketType,purchaseDate');
    expect(row).toBe('Ada Lovelace,12345,3001234567,preventa,2026-04-22');
  });

  it('quotes values containing commas', () => {
    const csv = ticketsToCSV([ticket({ buyerName: 'Doe, John' })]);
    expect(csv.split('\n')[1]).toMatch(/^"Doe, John",/);
  });

  it('escapes embedded double-quotes by doubling them', () => {
    const csv = ticketsToCSV([ticket({ buyerName: 'Ada "Queen" Lovelace' })]);
    expect(csv.split('\n')[1]).toMatch(/^"Ada ""Queen"" Lovelace",/);
  });

  it('represents null/undefined fields as empty strings', () => {
    const csv = ticketsToCSV([ticket({ buyerPhone: null })]);
    expect(csv.split('\n')[1]).toBe('Ada Lovelace,12345,,preventa,2026-04-22');
  });

  // Audit finding H8: CSV formula injection. Cells whose first char is one
  // of =, +, -, @, \t, \r must be prefixed with a single quote so Excel
  // renders them as literal text instead of executing a formula.
  it("prefixes formula-starting cells with a single quote (audit H8)", () => {
    const csv = ticketsToCSV([ticket({ buyerName: '=HYPERLINK("http://evil","click")' })]);
    const row = csv.split('\n')[1];
    // The cell contains a comma so it's quoted; inside the quotes the value
    // now starts with ' so Excel treats it as a string literal.
    expect(row.startsWith(`"'=HYPERLINK`)).toBe(true);
  });

  it("prefixes @ + - cells too (audit H8)", () => {
    const csv = ticketsToCSV([ticket({ buyerName: '@SUM(A1)' })]);
    // No comma, not quoted, but still starts with the safety quote.
    expect(csv.split('\n')[1].startsWith("'@SUM")).toBe(true);
  });
});

describe('csvToTickets', () => {
  it('round-trips a simple ticket through export -> import', () => {
    const t = ticket();
    const csv = ticketsToCSV([t]);
    const { tickets, errors } = csvToTickets(csv);
    expect(errors).toEqual([]);
    expect(tickets).toHaveLength(1);
    expect(tickets[0]).toMatchObject(t);
  });

  it('round-trips values with commas and quotes intact', () => {
    const t = ticket({ buyerName: 'Doe, "Johnny", Jr.' });
    const csv = ticketsToCSV([t]);
    const { tickets, errors } = csvToTickets(csv);
    expect(errors).toEqual([]);
    expect(tickets[0].buyerName).toBe('Doe, "Johnny", Jr.');
  });

  it('rejects a file with a wrong header', () => {
    const { tickets, errors } = csvToTickets('name,id\nfoo,bar');
    expect(tickets).toEqual([]);
    expect(errors[0]).toMatch(/Invalid header/);
  });

  it('rejects a file with only a header row', () => {
    const { tickets, errors } = csvToTickets('buyerName,buyerId,buyerPhone,ticketType,purchaseDate');
    expect(tickets).toEqual([]);
    expect(errors[0]).toMatch(/header row and at least one data row/);
  });

  it('flags rows with missing required fields but continues parsing', () => {
    const csv = [
      'buyerName,buyerId,buyerPhone,ticketType,purchaseDate',
      ',12345,3001,preventa,2026-04-22',
      'Ada,12345,3001,preventa,2026-04-22',
    ].join('\n');
    const { tickets, errors } = csvToTickets(csv);
    expect(tickets).toHaveLength(1);
    expect(errors[0]).toMatch(/buyerName is required/);
  });

  it('flags rows with invalid purchaseDate format', () => {
    const csv = [
      'buyerName,buyerId,buyerPhone,ticketType,purchaseDate',
      'Ada,12345,3001,preventa,22/04/2026',
    ].join('\n');
    const { tickets, errors } = csvToTickets(csv);
    expect(tickets).toEqual([]);
    expect(errors[0]).toMatch(/YYYY-MM-DD/);
  });

  it('defaults an empty buyerPhone to "000"', () => {
    const csv = [
      'buyerName,buyerId,buyerPhone,ticketType,purchaseDate',
      'Ada,12345,,preventa,2026-04-22',
    ].join('\n');
    const { tickets } = csvToTickets(csv);
    expect(tickets[0].buyerPhone).toBe('000');
  });

  // Audit H7: field length caps must be enforced on CSV import so the
  // import path cannot be an end-run around the UI maxLength attributes.
  it('rejects rows with a buyerName longer than 100 chars (audit H7)', () => {
    const longName = 'A'.repeat(120);
    const csv = [
      'buyerName,buyerId,buyerPhone,ticketType,purchaseDate',
      `${longName},12345,3001,preventa,2026-04-22`,
    ].join('\n');
    const { tickets, errors } = csvToTickets(csv);
    expect(tickets).toEqual([]);
    expect(errors[0]).toMatch(/buyerName exceeds 100/);
  });

  // Audit finding H6: duplicate detection is expected to live in
  // TicketContext.addTicketsFromCSV, not in the parser itself.
  // This test documents that csvToTickets does NOT dedupe by design.
  it('does not dedupe duplicate rows at the parser layer (audit H6 lives elsewhere)', () => {
    const csv = [
      'buyerName,buyerId,buyerPhone,ticketType,purchaseDate',
      'Ada,12345,3001,preventa,2026-04-22',
      'Ada,12345,3001,preventa,2026-04-22',
    ].join('\n');
    const { tickets } = csvToTickets(csv);
    expect(tickets).toHaveLength(2);
  });
});

// L4: the two CSV shapes are distinct. ticketsToCSV is a backward-compat alias
// for ticketsToRoundTripCSV; ticketsToHumanCSV is a separate human-facing export.
describe('L4: CSV shape split', () => {
  const event = { ticketTypes: { preventa: 50000, vip: 100000 } };

  it('ticketsToCSV is aliased to ticketsToRoundTripCSV', () => {
    expect(ticketsToCSV).toBe(ticketsToRoundTripCSV);
  });

  it('ticketsToRoundTripCSV emits 5 columns with camelCase headers', () => {
    const csv = ticketsToRoundTripCSV([ticket()]);
    expect(csv.split('\n')[0]).toBe('buyerName,buyerId,buyerPhone,ticketType,purchaseDate');
  });

  it('ticketsToHumanCSV emits 6 columns with Title-Case headers and a price column', () => {
    const csv = ticketsToHumanCSV([ticket()], event);
    const [header, row] = csv.split('\n');
    expect(header).toBe('Buyer Name,Buyer ID,Buyer Phone,Ticket Type,Purchase Date,Ticket Price');
    expect(row).toBe('Ada Lovelace,12345,3001234567,preventa,2026-04-22,50000');
  });

  it('ticketsToHumanCSV prices unknown ticket types as 0', () => {
    const csv = ticketsToHumanCSV([ticket({ ticketType: 'ghost' })], event);
    expect(csv.split('\n')[1].endsWith(',0')).toBe(true);
  });

  it('ticketsToHumanCSV still applies formula-injection guard', () => {
    const csv = ticketsToHumanCSV([ticket({ buyerName: '=HYPERLINK("http://x","x")' })], event);
    const row = csv.split('\n')[1];
    expect(row.startsWith(`"'=HYPERLINK`)).toBe(true);
  });
});

describe('isValidTicketType', () => {
  const types = { preventa: 50000, vip: 100000 };

  it('accepts a type that exists in the event config', () => {
    expect(isValidTicketType('preventa', types)).toBe(true);
  });

  it('rejects a type that is not configured', () => {
    expect(isValidTicketType('general', types)).toBe(false);
  });

  it('returns false when the event has no ticket types', () => {
    expect(isValidTicketType('preventa', null)).toBe(false);
    expect(isValidTicketType('preventa', undefined)).toBe(false);
    expect(isValidTicketType('preventa', {})).toBe(false);
  });
});
