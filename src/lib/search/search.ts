import { SEARCH_INDEX, type SearchEntry } from "./search-index";

/** Normalize string: lowercase, strip accents */
function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export type SearchResultGroup = {
  type: SearchEntry["type"];
  items: SearchEntry[];
};

export function search(query: string): SearchResultGroup[] {
  const q = normalize(query.trim());
  if (q.length < 2) return [];

  const tokens = q.split(/\s+/).filter(Boolean);
  const matches = SEARCH_INDEX.filter((entry) => {
    const text = normalize(entry.searchText);
    return tokens.every((token) => text.includes(token));
  });

  // Group by type in display order
  const order: SearchEntry["type"][] = ["exercice", "methode", "apprendre", "glossaire"];
  const groups: SearchResultGroup[] = [];
  for (const type of order) {
    const items = matches.filter((e) => e.type === type);
    if (items.length > 0) groups.push({ type, items: items.slice(0, 8) });
  }
  return groups;
}
