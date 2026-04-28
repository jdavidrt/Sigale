/**
 * Utility for cleaning base64 data
 * Strips data URI prefixes and whitespace from raw base64 input.
 */

/**
 * Cleans base64 data by removing data URI prefixes and whitespace
 * @param {string} rawData - Raw base64 string (may include data URI prefix)
 * @returns {string} Cleaned base64 string
 */
export const cleanBase64 = (rawData) => {
  if (!rawData || typeof rawData !== 'string') {
    throw new Error('Invalid input: rawData must be a non-empty string');
  }

  // Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
  let cleaned = rawData.replace(/^data:image\/[a-z]+;base64,/i, '');

  // Remove all whitespace (spaces, newlines, tabs, etc.)
  cleaned = cleaned.replace(/\s/g, '');

  return cleaned;
};
