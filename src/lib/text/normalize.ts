/**
 * Normalize a string for comparison: lowercase, trim, strip accents.
 * Used for muscle group lookup, search, i18n dictionary, and import normalization.
 */
export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
