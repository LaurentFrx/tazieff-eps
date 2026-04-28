// Sprint A4 — Helpers de vérification de la locale dans les tests Playwright.
//
// Couvre la chaîne C6 de l'audit-cc 2026-04-28 : "préservation de la locale
// dans la navigation". Les bugs P0.7-octies / P0.7-quater ont été causés
// par des liens internes qui ne préfixaient pas la locale courante. Le
// helper `expectAllLinksLocalized` parcourt les <a href> de la page et
// vérifie que les liens internes commencent bien par /<locale>/.

import { expect, type Page } from "@playwright/test";

const SUPPORTED_LOCALES = ["fr", "en", "es"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Parcourt tous les <a href> de la page courante et vérifie que les liens
 * internes (qui commencent par "/" et ne sont pas des ancres ni des
 * extensions de fichier) sont préfixés par la locale attendue.
 *
 * Liens externes (http*), ancres (#), data-URI, mailto: sont ignorés.
 * Liens vers /api/*, /auth/*, /callback/* sont ignorés (routes globales
 * non-localisées). Liens vers /admin/* et /prof/* aussi (sous-domaines
 * admin/prof n'ont pas de [locale]).
 */
export async function expectAllLinksLocalized(
  page: Page,
  locale: Locale,
): Promise<void> {
  const hrefs = await page.$$eval("a[href]", (anchors) =>
    anchors.map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? ""),
  );

  const violations: string[] = [];

  for (const href of hrefs) {
    if (!href || href === "#") continue;
    if (href.startsWith("http")) continue;
    if (href.startsWith("#")) continue;
    if (href.startsWith("mailto:")) continue;
    if (href.startsWith("tel:")) continue;
    if (href.startsWith("data:")) continue;
    if (href.startsWith("/api/")) continue;
    if (href.startsWith("/auth/")) continue;
    if (href.startsWith("/callback")) continue;
    if (href.startsWith("/admin")) continue;
    if (href.startsWith("/prof")) continue;
    if (!href.startsWith("/")) continue; // liens relatifs anchor uniquement

    // Liens internes : doivent commencer par /<locale>/ ou être /<locale>
    // (la locale racine).
    const validPrefixes = SUPPORTED_LOCALES.flatMap((loc) => [
      `/${loc}`,
      `/${loc}/`,
    ]);
    const startsWithValidLocale = validPrefixes.some((prefix) =>
      href === prefix.replace(/\/$/, "") || href.startsWith(prefix),
    );
    if (!startsWithValidLocale) {
      violations.push(href);
      continue;
    }

    // Vérifie spécifiquement la locale attendue (pour les pages où on est
    // censé rester dans la même locale).
    const expectedPrefixes = [`/${locale}`, `/${locale}/`];
    const isExpected = expectedPrefixes.some(
      (prefix) =>
        href === prefix.replace(/\/$/, "") || href.startsWith(prefix),
    );
    if (!isExpected) {
      violations.push(`${href} (attendu /${locale}/...)`);
    }
  }

  expect(violations, "liens non-localisés sur la page").toEqual([]);
}

/**
 * Liste toutes les locales supportées (pour itérer dans un test).
 */
export function eachLocale(callback: (locale: Locale) => void): void {
  for (const locale of SUPPORTED_LOCALES) callback(locale);
}
