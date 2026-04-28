/**
 * Convert 24-hour time format (HH:mm) to 12-hour format (h:mm AM/PM)
 * @param {string} time24 - Time in 24-hour format (e.g., "14:30", "09:00")
 * @returns {string} Time in 12-hour format (e.g., "2:30 PM", "9:00 AM")
 */
export const formatTo12Hour = (time24) => {
  if (!time24) return '';

  const [hours, minutes] = time24.split(':').map(Number);

  if (isNaN(hours) || isNaN(minutes)) return time24;

  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight

  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Parse date string (YYYY-MM-DD) without timezone issues
 * This prevents dates from being shifted by timezone offset when creating Date objects
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date} Date object with correct local date
 */
export const parseLocalDate = (dateString) => {
  if (!dateString) return new Date();

  const [year, month, day] = dateString.split('-').map(Number);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return new Date(dateString); // Fallback to default parsing
  }

  // Create date in local timezone (month is 0-indexed)
  return new Date(year, month - 1, day);
};

/**
 * Format a Date (or "now") as a YYYY-MM-DD string using **local** time.
 * The old pattern `new Date().toISOString().split('T')[0]` emitted the
 * UTC date, which in UTC-5 near midnight produced a date the operator
 * did not pick. Audit finding M6.
 */
export const toLocalDateString = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Format a number as a $-prefixed currency string with locale-aware
 * thousands separators. Co-located here while there's only one formatter;
 * split to a dedicated `formatters.js` when a second one shows up.
 *
 * Falsy or non-numeric input renders as "$0" rather than the legacy
 * "$undefined" the optional-chaining call sites used to emit.
 *
 * @param {number|string|null|undefined} n - Numeric value to format
 * @param {string} [locale] - BCP-47 locale (defaults to the browser's)
 * @returns {string}
 */
export const formatCurrency = (n, locale) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return '$0';
  return '$' + num.toLocaleString(locale);
};

/**
 * H5: determine whether a check-in "now" falls within a reasonable window
 * around the event date. Operators often rehearse the day before, and
 * teardown may run the day after, so we accept [event-1d, event+1d] by
 * default. Anything outside that window returns an `outside` status the
 * scanner UI can surface as a confirm-before-proceed.
 *
 * Returns one of:
 *   { status: 'ok' }
 *   { status: 'early', daysDiff }   (now is before the window)
 *   { status: 'late',  daysDiff }   (now is after the window)
 *   { status: 'unknown' }           (event or event.date missing)
 */
export const checkInWindowStatus = (event, now = new Date(), windowDays = 1) => {
  if (!event || !event.date) return { status: 'unknown' };
  const eventDay = parseLocalDate(event.date);
  if (Number.isNaN(eventDay.getTime())) return { status: 'unknown' };

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  // Compare at local-day granularity so entrance time doesn't matter.
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((nowDay - eventDay) / MS_PER_DAY);

  if (diffDays < -windowDays) return { status: 'early', daysDiff: diffDays };
  if (diffDays > windowDays)  return { status: 'late',  daysDiff: diffDays };
  return { status: 'ok', daysDiff: diffDays };
};
