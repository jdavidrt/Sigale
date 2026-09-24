/**
 * Parse pasted clipboard text into name+id pairs.
 *
 * Two entry points:
 *   - `parseSingleNameAndId(text)` → one `{name, id}` for filling a single form
 *     (TicketForm's paste button).
 *   - `parseTicketRows(text)` → an array of `{name, id}` for the bulk-paste flow
 *     in the editable ticket table. Each newline becomes a candidate row.
 *
 * The extractors are Latin-aware (Cyrillic, Arabic, CJK, accents are preserved),
 * recognize Spanish/English ID and name prefixes (C.C., NIT, Nombre, Name…), and
 * strip them out so the cleaned values are ready to write to a ticket.
 */

// Common ID-prefix labels seen in pasted Colombian/Spanish documents:
// "C.C.", "TI", "NIT", "Cédula", "ID", "Doc:", etc.
const ID_PREFIX = /^(?:C\.?C\.?|T\.?I\.?|NIT|CE|P\.?P\.?|Cédula|Cedula|Identificaci[oó]n|ID|Doc(?:umento)?)\s*[:.\-#]?\s*/i;

// Common name-prefix labels: "Nombre:", "Name:", "Cliente:".
const NAME_PREFIX = /^(?:Nombre|Name|Cliente|Client)\s*[:.\-#]?\s*/i;

// Lift the first plausible ID number out of a string.
// "Plausible" = a run of digits (optionally separated by periods) at least 6 long.
const extractId = (str) => {
  const cleaned = str.replace(ID_PREFIX, "");
  const match = cleaned.match(/[\d][\d.]*[\d]|[\d]+/);
  return match ? match[0].replace(/\./g, "") : "";
};

const hasId = (str) => {
  const num = extractId(str);
  return num.length >= 6 ? num : "";
};

// Normalize a name: strip prefix label, any trailing punctuation,
// then keep only Unicode letters / combining marks / spaces / apostrophes / hyphens.
// L6 in the prior history: \p{L}/\p{M} so non-Latin scripts survive.
const cleanName = (str) =>
  str
    .replace(NAME_PREFIX, "")
    .replace(ID_PREFIX, "")
    .trim();

const normalizeName = (str) =>
  str.replace(/[^\p{L}\p{M}\s'-]/gu, "").replace(/\s+/g, " ").trim();

const normalizeId = (str) => str.replace(/[^\d]/g, "");

/**
 * Parse one chunk of text into a single `{name, id}` pair.
 *
 * Accepts:
 *   - "Ada Lovelace\n12345"      (two lines: name then id, or vice versa)
 *   - "Ada Lovelace 12345"        (single line with id mixed in)
 *   - "Nombre: Ada / C.C. 12345"  (prefixed labels)
 *
 * Returns `{name: '', id: ''}` if it can't extract both.
 *
 * @param {string} text
 * @returns {{name: string, id: string}}
 */
export const parseSingleNameAndId = (text) => {
  if (!text) return { name: "", id: "" };

  // Single-pair mode deliberately treats rows and columns alike: every token
  // is a candidate for the one name + id the form needs.
  const lines = text.trim().split(/[\n\t]+/).map((l) => l.trim()).filter(Boolean);
  let name = "";
  let id = "";

  if (lines.length >= 2) {
    const id1 = hasId(lines[0]);
    const id2 = hasId(lines[1]);
    if (id2 && !id1) { name = cleanName(lines[0]); id = id2; }
    else if (id1 && !id2) { name = cleanName(lines[1]); id = id1; }
    else if (id1 && id2) {
      const h1 = ID_PREFIX.test(lines[0]);
      const h2 = ID_PREFIX.test(lines[1]);
      if (h2) { name = cleanName(lines[0]); id = id2; }
      else if (h1) { name = cleanName(lines[1]); id = id1; }
      else { name = cleanName(lines[0]); id = id2; }
    }
  } else if (lines.length === 1) {
    const line = lines[0];
    const idRegex = /(?:[\d][\d.]*[\d]|[\d]{6,})/g;
    let match;
    let bestMatch = null;
    while ((match = idRegex.exec(line)) !== null) {
      const digits = match[0].replace(/\./g, "");
      if (digits.length >= 6) { bestMatch = { raw: match[0], digits, index: match.index }; break; }
    }
    if (bestMatch) {
      id = bestMatch.digits;
      const cleanPart = (str) =>
        str.replace(ID_PREFIX, "").replace(/[-,|/]\s*$/, "").replace(/^\s*[-,|/]/, "").trim();
      name = cleanPart(line.substring(0, bestMatch.index)) ||
             cleanPart(line.substring(bestMatch.index + bestMatch.raw.length));
    }
  }

  return { name: normalizeName(name), id: normalizeId(id) };
};

/**
 * Parse a multi-row paste from a spreadsheet (or any newline-separated text)
 * into one `{name, id}` per row.
 *
 * Per row, prefers a TAB-split (Excel/Sheets/Numbers all paste as TSV) then
 * falls back to the single-line extractor when a row only has one cell.
 *
 * Rows where we can't recover both a name and an id are dropped silently;
 * callers can compare returned length against input row count if they want
 * a "K rows ignored" message.
 *
 * @param {string} text
 * @returns {Array<{name: string, id: string}>}
 */
export const parseTicketRows = (text) => {
  if (!text) return [];

  return text
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      // Spreadsheet paste: each cell is tab-separated.
      const cells = row.split("\t").map((c) => c.trim()).filter(Boolean);

      if (cells.length >= 2) {
        // Two columns. The column with digits is the id; the other is the name.
        const id1 = hasId(cells[0]);
        const id2 = hasId(cells[1]);
        if (id2 && !id1) return { name: normalizeName(cleanName(cells[0])), id: normalizeId(id2) };
        if (id1 && !id2) return { name: normalizeName(cleanName(cells[1])), id: normalizeId(id1) };
        if (id1 && id2) {
          // Both look numeric (e.g., a phone in col 0 and an id in col 1).
          // Prefer col 1 as the id by convention.
          return { name: normalizeName(cleanName(cells[0])), id: normalizeId(id2) };
        }
        // Neither cell has a recognizable id — fall through to single-line parse.
      }

      // One cell, or no id detected across cells: treat the whole row as one string.
      return parseSingleNameAndId(row);
    })
    .filter(({ name, id }) => name && id);
};
