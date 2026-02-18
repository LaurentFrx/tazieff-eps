import type { Lang } from "@/lib/i18n/messages";
import dictionary from "./dictionary.json";

type Category = keyof typeof dictionary;

function normalizeTerm(term: string): string {
  return term
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function translateTerm(
  term: string,
  category: Category,
  lang: Lang,
): string {
  const key = normalizeTerm(term);
  const entry = (dictionary[category] as Record<string, Record<string, string>>)[key];
  return entry?.[lang] ?? term;
}

export function translateTerms(
  terms: string[],
  category: Category,
  lang: Lang,
): string[] {
  return terms.map((term) => translateTerm(term, category, lang));
}
