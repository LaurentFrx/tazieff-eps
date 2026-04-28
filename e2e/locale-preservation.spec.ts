// Sprint A4 — Chaîne C6 : préservation de la locale dans la navigation.
//
// Couvre l'audit-cc 2026-04-28 §5.3 C6 + bugs P0.7-octies / P0.7-quater :
//   - Visite /[locale]/ pour chaque locale supportée
//   - Vérifie que tous les <a href> internes sont préfixés par /<locale>/
//   - Suit quelques liens clés et vérifie que la locale est conservée
//   - Teste le SearchModal : ouverture, recherche, clic résultat, locale
//     préservée
//
// Le helper expectAllLinksLocalized() ignore les liens vers /api/, /auth/,
// /admin/, /prof/ (routes globales / sous-domaines non localisés).

import { test, expect } from "@playwright/test";
import { expectAllLinksLocalized } from "./helpers/locale";

const LOCALES = ["fr", "en", "es"] as const;

for (const locale of LOCALES) {
  test.describe(`C6 — Locale '${locale}' : tous les liens internes préfixés`, () => {
    test(`/${locale} (home) : tous les <a href> internes commencent par /${locale}/`, async ({
      page,
    }) => {
      await page.goto(`/${locale}`);
      await expect(page).toHaveURL(new RegExp(`/${locale}(/|$)`));
      await expectAllLinksLocalized(page, locale);
    });

    test(`/${locale}/exercices : section catalogue, liens préfixés`, async ({
      page,
    }) => {
      await page.goto(`/${locale}/exercices`);
      await expect(page).toHaveURL(new RegExp(`/${locale}/exercices`));
      await expectAllLinksLocalized(page, locale);
    });

    test(`/${locale}/methodes : section méthodes, liens préfixés`, async ({
      page,
    }) => {
      await page.goto(`/${locale}/methodes`);
      await expect(page).toHaveURL(new RegExp(`/${locale}/methodes`));
      await expectAllLinksLocalized(page, locale);
    });

    test(`/${locale}/parcours-bac : section BAC, liens préfixés`, async ({
      page,
    }) => {
      await page.goto(`/${locale}/parcours-bac`);
      await expect(page).toHaveURL(new RegExp(`/${locale}/parcours-bac`));
      await expectAllLinksLocalized(page, locale);
    });

    test(`/${locale}/outils : section outils, liens préfixés`, async ({
      page,
    }) => {
      await page.goto(`/${locale}/outils`);
      await expect(page).toHaveURL(new RegExp(`/${locale}/outils`));
      await expectAllLinksLocalized(page, locale);
    });

    test(`/${locale}/reglages : page settings, liens préfixés`, async ({
      page,
    }) => {
      await page.goto(`/${locale}/reglages`);
      await expect(page).toHaveURL(new RegExp(`/${locale}/reglages`));
      await expectAllLinksLocalized(page, locale);
    });
  });
}

test.describe("C6 — Suivi de lien : locale conservée après clic", () => {
  test("/fr/exercices → clic premier exercice → URL /fr/exercices/<slug>", async ({
    page,
  }) => {
    await page.goto("/fr/exercices");
    const firstCard = page.locator("a[href*='/exercices/']").first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/fr\/exercices\/[a-z0-9-]+/);
  });

  test("/en/exercices → clic premier exercice → URL /en/exercices/<slug>", async ({
    page,
  }) => {
    await page.goto("/en/exercices");
    const firstCard = page.locator("a[href*='/exercices/']").first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/en\/exercices\/[a-z0-9-]+/);
  });

  test("/es/methodes → clic première méthode → URL /es/methodes/<slug>", async ({
    page,
  }) => {
    await page.goto("/es/methodes");
    const firstCard = page.locator("a[href*='/methodes/']").first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/es\/methodes\/[a-z0-9-]+/);
  });
});

test.describe("C6 — SearchModal : locale préservée dans les résultats", () => {
  test("/fr → ouvre search → tape 'planche' → clic résultat → URL en /fr/", async ({
    page,
  }) => {
    await page.goto("/fr");
    // Ouvre la modale via raccourci Ctrl/Cmd+K (modifier auto sur Mac).
    await page.keyboard.press("Control+K");
    const search = page.getByPlaceholder(/recherche|search/i).first();
    await search.fill("planche");

    // Premier résultat. Si aucun résultat, skip le test.
    const firstResult = page.locator("a[role='option']").first();
    if (await firstResult.count() === 0) {
      test.skip(true, "Aucun résultat 'planche' — index search peut-être absent");
    }
    await firstResult.click();
    await expect(page).toHaveURL(/\/fr\//);
  });
});
