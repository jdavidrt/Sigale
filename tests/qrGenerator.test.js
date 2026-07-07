import { describe, it, expect } from 'vitest';
import { generateQRData, parseQRData } from '../src/utils/qrGenerator.js';

const ticket = {
  ticketId: 'TKT-001-1700000000000',
  validationHash: 'a3f9c1e7b2d40518',
  buyerName: 'Ada Lovelace',
  ticketType: 'preventa',
};

describe('generateQRData', () => {
  it('encodes only the validationHash (bare string, no JSON wrapper)', () => {
    expect(generateQRData(ticket)).toBe('a3f9c1e7b2d40518');
  });

  it('returns an empty string when the ticket has no hash yet', () => {
    expect(generateQRData({ ...ticket, validationHash: null })).toBe('');
    expect(generateQRData({})).toBe('');
    expect(generateQRData(null)).toBe('');
  });
});

describe('parseQRData', () => {
  it('round-trips its own bare-hash output', () => {
    const parsed = parseQRData(generateQRData(ticket));
    expect(parsed.hash).toBe(ticket.validationHash);
  });

  it('trims surrounding whitespace', () => {
    expect(parseQRData('  a3f9c1e7b2d40518  ')).toEqual({ hash: 'a3f9c1e7b2d40518' });
  });

  it('still parses the legacy JSON payload', () => {
    const legacy = JSON.stringify({ id: 'TKT-1', hash: 'abcdef0123', buyer: 'Ada' });
    expect(parseQRData(legacy)).toEqual({ hash: 'abcdef0123' });
  });

  it('returns null for legacy JSON missing a hash', () => {
    expect(parseQRData(JSON.stringify({ id: 'x' }))).toBeNull();
  });

  it('returns null for malformed JSON, empty, and non-strings without throwing', () => {
    expect(parseQRData('{not-json')).toBeNull();
    expect(parseQRData('')).toBeNull();
    expect(parseQRData('   ')).toBeNull();
    expect(parseQRData(null)).toBeNull();
    expect(parseQRData(undefined)).toBeNull();
  });
});
