/**
 * Utility for cleaning and validating base64 data
 * Handles data URIs, whitespace, and validation
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

/**
 * Validates if a string is valid base64
 * @param {string} str - String to validate
 * @returns {boolean} True if valid base64
 */
export const isValidBase64 = (str) => {
  if (!str || typeof str !== 'string') {
    return false;
  }

  // Base64 alphabet: A-Z, a-z, 0-9, +, /, and = for padding
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(str);
};

/**
 * Cleans and validates base64 data
 * @param {string} rawData - Raw base64 string
 * @returns {string} Cleaned and validated base64 string
 * @throws {Error} If the cleaned data is not valid base64
 */
export const cleanAndValidateBase64 = (rawData) => {
  const cleaned = cleanBase64(rawData);

  if (!isValidBase64(cleaned)) {
    throw new Error('Invalid base64 data after cleaning. Contains invalid characters.');
  }

  return cleaned;
};

/**
 * Converts base64 string to a data URI
 * @param {string} base64Data - Clean base64 string
 * @param {string} mimeType - MIME type (e.g., 'image/png', 'image/jpeg')
 * @returns {string} Data URI string
 */
export const toDataURI = (base64Data, mimeType = 'image/png') => {
  const cleaned = cleanBase64(base64Data);
  return `data:${mimeType};base64,${cleaned}`;
};

/**
 * Extracts MIME type from data URI
 * @param {string} dataURI - Data URI string
 * @returns {string|null} MIME type or null if not found
 */
export const extractMimeType = (dataURI) => {
  const match = dataURI.match(/^data:([a-z]+\/[a-z]+);base64,/i);
  return match ? match[1] : null;
};
