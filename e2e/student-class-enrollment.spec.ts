// Sprint A4 — Chaîne C3 : inscription élève à une classe.
//
// Couvre l'audit-cc 2026-04-28 §5.3 C3 + L08 (page rejoindre créée en A5) :
//   - Anonyme arrive sur /fr/ma-classe → formulaire affiché
//   - /fr/rejoindre?code=XXX → code pré-rempli + form
//   - Soumission avec code valide → redirect /ma-classe (statut côté API)
//
// Limitation : pas de code de classe de test stable en base. Le test vérifie
// uniquement le rendu du formulaire et le comportement client-side. Pour
// tester la soumission réelle avec un code valide, il faut soit :
//   1. Seeder un code de test dans Supabase (non fait dans ce sprint).
//   2. Mocker la réponse API via page.route() (fait ci-dessous pour le cas
//      "code_not_found").

import { test, expect } from "@playwright/test";

test.describe("C3 — Page /fr/ma-classe : formulaire d'inscription anonyme", () => {
  test("anonymous → formulaire avec champs prénom/nom/code visibles", async ({
    page,
  }) => {
    await page.goto("/fr/ma-classe");
    await expect(page.getByLabel(/prénom/i)).toBeVisible();
    await expect(page.getByLabel(/^nom/i)).toBeVisible();
    await expect(page.getByLabel(/code/i)).toBeVisible();
  });

  test("validation client : code < 4 caractères → erreur affichée", async ({
    page,
  }) => {
    await page.goto("/fr/ma-classe");
    await page.getByLabel(/prénom/i).fill("Léa");
    await page.getByLabel(/^nom/i).fill("Martin");
    await page.getByLabel(/code/i).fill("AB"); // 2 chars only
    await page.getByRole("button", { name: /rejoindre|inscrire|submit/i }).click();
    await expect(page.getByTestId("join-form-error")).toBeVisible();
  });

  test("code invalide (404 from API mock) → message d'erreur i18n", async ({
    page,
  }) => {
    await page.route("**/api/me/classes/join", (route) =>
      route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          error: "code_not_found",
          message: "Code de classe inconnu.",
        }),
      }),
    );
    await page.goto("/fr/ma-classe");
    await page.getByLabel(/prénom/i).fill("Léa");
    await page.getByLabel(/^nom/i).fill("Martin");
    await page.getByLabel(/code/i).fill("XXXX");
    await page.getByRole("button", { name: /rejoindre|inscrire|submit/i }).click();
    await expect(page.getByTestId("join-form-error")).toContainText(
      /inconnu|invalide|not.found/i,
    );
  });
});

test.describe("C3 — Page /fr/rejoindre?code=XXX (Sprint A5 L08)", () => {
  test("code en querystring → input pré-rempli", async ({ page }) => {
    await page.goto("/fr/rejoindre?code=DEMO1234");
    const codeInput = page.getByLabel(/code/i);
    await expect(codeInput).toHaveValue("DEMO1234");
  });

  test("sans querystring → input vide", async ({ page }) => {
    await page.goto("/fr/rejoindre");
    const codeInput = page.getByLabel(/code/i);
    await expect(codeInput).toHaveValue("");
  });
});
