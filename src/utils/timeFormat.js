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
 * Format a timestamp to 12-hour time format
 * @param {string|Date} timestamp - ISO timestamp or Date object
 * @returns {string} Time in 12-hour format
 */
export const formatTimestampTo12Hour = (timestamp) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);

  if (isNaN(date.getTime())) return '';

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;

  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};
