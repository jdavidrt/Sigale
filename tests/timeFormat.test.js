import { describe, it, expect } from 'vitest';
import {
  formatTo12Hour,
  parseLocalDate,
  toLocalDateString,
  checkInWindowStatus,
} from '../src/utils/timeFormat.js';

describe('formatTo12Hour', () => {
  it('converts midnight to 12:00 AM', () => {
    expect(formatTo12Hour('00:00')).toBe('12:00 AM');
  });

  it('converts noon to 12:00 PM', () => {
    expect(formatTo12Hour('12:00')).toBe('12:00 PM');
  });

  it('converts 01:05 to 1:05 AM with zero-padded minutes', () => {
    expect(formatTo12Hour('01:05')).toBe('1:05 AM');
  });

  it('converts 13:30 to 1:30 PM', () => {
    expect(formatTo12Hour('13:30')).toBe('1:30 PM');
  });

  it('converts 23:59 to 11:59 PM', () => {
    expect(formatTo12Hour('23:59')).toBe('11:59 PM');
  });

  it('returns an empty string for empty input', () => {
    expect(formatTo12Hour('')).toBe('');
    expect(formatTo12Hour(undefined)).toBe('');
  });

  it('returns the raw input for malformed time strings', () => {
    expect(formatTo12Hour('not-a-time')).toBe('not-a-time');
  });
});

describe('parseLocalDate (audit regression lock)', () => {
  // The bug this guards against: `new Date("2026-04-22")` parses as UTC
  // midnight, which in UTC-5 displays as 2026-04-21. parseLocalDate
  // must produce a Date whose local Y/M/D matches the input.
  it('returns a Date whose local date parts match the input', () => {
    const d = parseLocalDate('2026-04-22');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3); // April = 3 (0-indexed)
    expect(d.getDate()).toBe(22);
  });

  it('handles single-digit month/day safely', () => {
    const d = parseLocalDate('2026-01-05');
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(5);
  });

  it('falls back when the string is malformed', () => {
    // parseLocalDate returns a Date (either fallback or Invalid Date).
    const d = parseLocalDate('garbage');
    expect(d).toBeInstanceOf(Date);
  });

  it('returns a valid Date when called with no argument', () => {
    const d = parseLocalDate();
    expect(Number.isNaN(d.getTime())).toBe(false);
  });
});

describe('toLocalDateString (audit M6)', () => {
  it('formats a Date as YYYY-MM-DD using LOCAL components', () => {
    // 2026-04-22 10:30 local. Do NOT use UTC — the bug being guarded
    // against is exactly using UTC when the operator thinks in local time.
    const d = new Date(2026, 3, 22, 10, 30, 0);
    expect(toLocalDateString(d)).toBe('2026-04-22');
  });

  it('pads single-digit month and day', () => {
    const d = new Date(2026, 0, 5, 9, 0, 0);
    expect(toLocalDateString(d)).toBe('2026-01-05');
  });

  it('returns empty string for an invalid date', () => {
    expect(toLocalDateString(new Date('invalid'))).toBe('');
  });
});

describe('checkInWindowStatus (audit H5)', () => {
  const event = { date: '2026-04-22' };

  it('returns ok when "now" is the event day', () => {
    const now = new Date(2026, 3, 22, 14, 0, 0);
    expect(checkInWindowStatus(event, now).status).toBe('ok');
  });

  it('returns ok the day before (rehearsal)', () => {
    const now = new Date(2026, 3, 21, 14, 0, 0);
    expect(checkInWindowStatus(event, now).status).toBe('ok');
  });

  it('returns early two days before', () => {
    const now = new Date(2026, 3, 20, 14, 0, 0);
    const res = checkInWindowStatus(event, now);
    expect(res.status).toBe('early');
    expect(res.daysDiff).toBe(-2);
  });

  it('returns late two days after', () => {
    const now = new Date(2026, 3, 24, 14, 0, 0);
    const res = checkInWindowStatus(event, now);
    expect(res.status).toBe('late');
    expect(res.daysDiff).toBe(2);
  });

  it('returns unknown for missing event', () => {
    expect(checkInWindowStatus(null).status).toBe('unknown');
    expect(checkInWindowStatus({}).status).toBe('unknown');
  });
});
