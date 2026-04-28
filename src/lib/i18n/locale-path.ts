import { SUPPORTED_LOCALES } from "@/lib/i18n/constants";
import type { Locale } from "@/lib/i18n/constants";

/**
 * Build a locale-aware path.
 *
 * P0.7-octies — Préfixe TOUJOURS avec la nouvelle locale, y compris pour
 * fr. Avant : `/reglages` quand newLocale === "fr". Sur le miroir admin
 * (admin.muscu-eps.fr / design-admin.muscu-eps.fr), `/reglages` sans
 * préfixe locale n'a pas de route correspondante → 404. Sur l'élève le
 * middleware réécrit en interne, donc le bug ne se voyait pas, mais la
 * cohérence avec LocaleLink (post P0.7-quater) impose le préfixe partout.
 *
 * Sprint A2 — Lit la liste des locales depuis SUPPORTED_LOCALES (source
 * unique partagée avec LocaleLink + navigation.ts).
 */
const LOCALE_PATTERN = new RegExp(
  `^/(${SUPPORTED_LOCALES.join("|")})(/|$)`,
);

export function buildLocalePath(
  currentPath: string,
  newLocale: string,
): string {
  const pathWithoutLocale = currentPath.replace(LOCALE_PATTERN, "/");
  const cleanPath = pathWithoutLocale || "/";
  return `/${newLocale}${cleanPath === "/" ? "" : cleanPath}` || `/${newLocale}`;
}

/**
 * Sprint A2 — Helper partagé entre LocaleLink (rendu JSX) et les
 * router.push() programmatiques.
 *
 * Logique alignée sur LocaleLink :
 *   - `lang === "fr"` ET pathname élève (pas de préfixe locale) → href tel quel
 *     Le proxy i18n compense en interne.
 *   - Sinon (miroir admin OU autre locale) → préfixe avec `/${lang}` sauf si :
 *     • URL externe (http*)
 *     • Ancre (#)
 *     • Path déjà préfixé (/fr/, /en/, /es/)
 *
 * @param href Chemin cible. Peut être absolu (`/exercices/x`) ou relatif (`x`).
 * @param lang Locale courante (fr|en|es).
 * @param pathname Pathname courant (window.location.pathname côté client,
 *                 usePathname() côté composant React).
 */
export function clientLocalizedHref(
  href: string,
  lang: Locale,
  pathname: string | null,
): string {
  const currentHasLocalePrefix = SUPPORTED_LOCALES.some(
    (loc) => pathname === `/${loc}` || pathname?.startsWith(`/${loc}/`),
  );

  if (lang === "fr" && !currentHasLocalePrefix) return href;

  if (
    href.startsWith("http") ||
    href.startsWith("#") ||
    href.startsWith(`/${lang}/`) ||
    href === `/${lang}`
  ) {
    return href;
  }

  return `/${lang}${href.startsWith("/") ? href : `/${href}`}`;
}
