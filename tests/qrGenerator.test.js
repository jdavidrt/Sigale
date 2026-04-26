import { describe, it, expect, vi } from 'vitest';
import { generateQRData, parseQRData, computeEventId } from '../src/utils/qrGenerator.js';

const ticket = {
  ticketId: 'TKT-001-1700000000000',
  validationHash: 'abcdef0123',
  buyerName: 'Ada Lovelace',
  ticketType: 'preventa',
};
const event = { name: 'Test Event', date: '2026-04-22' };

describe('generateQRData', () => {
  it('serializes the minimum payload the scanner expects (eventId defaults to null)', () => {
    const json = generateQRData(ticket, event);
    expect(JSON.parse(json)).toEqual({
      id: 'TKT-001-1700000000000',
      hash: 'abcdef0123',
      buyer: 'Ada Lovelace',
      type: 'preventa',
      eventId: null,
    });
  });

  // Audit finding M1: QR payload now carries eventId so a ticket from
  // Event A scanned at Event B can be rejected by the scanner.
  it('embeds the eventId when one is provided (audit M1)', () => {
    const parsed = JSON.parse(generateQRData(ticket, event, 'deadbeef'));
    expect(parsed.eventId).toBe('deadbeef');
  });
});

describe('computeEventId', () => {
  it('returns a stable 8-hex id for the same name+date', async () => {
    const a = await computeEventId({ name: 'Test', date: '2026-04-22' });
    const b = await computeEventId({ name: 'Test', date: '2026-04-22' });
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{8}$/);
  });

  it('returns different ids for different events', async () => {
    const a = await computeEventId({ name: 'A', date: '2026-04-22' });
    const b = await computeEventId({ name: 'B', date: '2026-04-22' });
    expect(a).not.toBe(b);
  });

  it('returns null when event is missing name or date', async () => {
    expect(await computeEventId(null)).toBeNull();
    expect(await computeEventId({ name: 'A' })).toBeNull();
    expect(await computeEventId({ date: '2026-04-22' })).toBeNull();
  });
});

describe('parseQRData', () => {
  it('round-trips its own output', () => {
    const parsed = parseQRData(generateQRData(ticket, event));
    expect(parsed.id).toBe(ticket.ticketId);
    expect(parsed.hash).toBe(ticket.validationHash);
  });

  it('returns null for missing id', () => {
    expect(parseQRData(JSON.stringify({ hash: 'abc' }))).toBeNull();
  });

  it('returns null for missing hash', () => {
    expect(parseQRData(JSON.stringify({ id: 'x' }))).toBeNull();
  });

  it('returns null for malformed JSON and does not throw', () => {
    // Silence the util's console.error during the expected failure path.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(parseQRData('{not-json')).toBeNull();
    expect(parseQRData('')).toBeNull();
    spy.mockRestore();
  });
});
