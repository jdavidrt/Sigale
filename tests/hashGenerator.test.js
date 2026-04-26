import { describe, it, expect } from 'vitest';
import { generateValidationHash, generateTicketId } from '../src/utils/hashGenerator.js';

const makeTicket = (overrides = {}) => ({
  ticketId: 'TKT-001-1700000000000',
  buyerName: 'Ada Lovelace',
  buyerId: '12345678',
  purchaseDate: '2026-04-22',
  ...overrides,
});

describe('generateValidationHash', () => {
  it('is deterministic for identical input', async () => {
    const t = makeTicket();
    const a = await generateValidationHash(t);
    const b = await generateValidationHash(t);
    expect(a).toBe(b);
  });

  it('returns only hex characters', async () => {
    const hash = await generateValidationHash(makeTicket());
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('changes when buyerName changes', async () => {
    const a = await generateValidationHash(makeTicket({ buyerName: 'Alice' }));
    const b = await generateValidationHash(makeTicket({ buyerName: 'Bob' }));
    expect(a).not.toBe(b);
  });

  it('changes when ticketId changes', async () => {
    const a = await generateValidationHash(makeTicket({ ticketId: 'TKT-001-111' }));
    const b = await generateValidationHash(makeTicket({ ticketId: 'TKT-001-222' }));
    expect(a).not.toBe(b);
  });

  // Audit finding C2: hash length was widened from 10 to 16 hex chars
  // (40 → 64 bits). Collision probability at 10k tickets drops from ~0.5%
  // to ~10^-8.
  it('C2 fix: returns a 16-character hash', async () => {
    const hash = await generateValidationHash(makeTicket());
    expect(hash).toHaveLength(16);
  });

  // Smoke test for collision rate at modest N. Not a birthday-paradox proof,
  // just a guard that the hash function spreads distinct inputs uniquely.
  it('produces unique hashes across 1000 distinct tickets', async () => {
    const hashes = new Set();
    for (let i = 0; i < 1000; i++) {
      const h = await generateValidationHash(
        makeTicket({ ticketId: `TKT-${String(i).padStart(3, '0')}-${1700000000000 + i}` })
      );
      hashes.add(h);
    }
    expect(hashes.size).toBe(1000);
  });
});

describe('generateTicketId', () => {
  // L5 (fixed): id shape is now TKT-<8 hex>-<timestamp>, using
  // crypto.randomUUID for the suffix. Legacy ids in the TKT-\d{3}-\d+ shape
  // continue to validate via exact-string match.
  it('matches the TKT-<suffix>-timestamp shape', () => {
    const id = generateTicketId();
    expect(id).toMatch(/^TKT-[0-9a-f]{8}-\d+$/);
  });

  // L5: no collisions in a hot loop — the old Math.random() * 1000
  // pattern hit ~20% collisions at N=500; crypto.randomUUID should hit 0.
  it('L5 fix: 500 ids generated back-to-back are all unique', () => {
    const ids = new Set();
    for (let i = 0; i < 500; i++) ids.add(generateTicketId());
    expect(ids.size).toBe(500);
  });
});
