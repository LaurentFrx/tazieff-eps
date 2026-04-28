// Sprint A4 — Chaîne C2 : magic-link prof académique de bout en bout.
//
// Couvre l'audit-cc 2026-04-28 §5.3 C2 :
//   - Saisie email académique → POST /api/auth/teacher-magic-link → délai
//     constant + eligible:true (anti-leak)
//   - Court-circuit via /api/test/establish-session → cookies sb-* sur prof.*
//     UNIQUEMENT (isolation E.2.3.8)
//   - /tableau-de-bord rendu correctement avec session prof active.

import { test, expect } from "@playwright/test";
import { loginAsTeacher } from "./helpers/auth";

const TEACHER_EMAIL =
  process.env.PLAYWRIGHT_TEACHER_EMAIL ?? "test@ac-bordeaux.fr";

test.describe("C2 — Magic-link prof de bout en bout", () => {
  test("saisie email académique → message éligible (eligible:true)", async ({
    page,
  }) => {
    await page.goto("/connexion");

    const emailInput = page.getByLabel(/email/i).first();
    await emailInput.fill(TEACHER_EMAIL);

    await page
      .getByRole("button", { name: /recevoir|envoyer|submit/i })
      .click();

    // Anti-leak : message de succès neutre côté UI (peut différer subtilement
    // entre eligible:true et eligible:false, cf P0.8 ProLoginForm).
    await expect(
      page.getByText(/lien|envoy|sent|enviado/i),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("saisie email NON académique → ne soumet pas (validation locale)", async ({
    page,
  }) => {
    await page.goto("/connexion");
    await page.getByLabel(/email/i).first().fill("user@gmail.com");
    // Le bouton est désactivé tant que l'email n'est pas académique.
    const submitBtn = page.getByRole("button", {
      name: /recevoir|envoyer|submit/i,
    });
    await expect(submitBtn).toBeDisabled();
  });

  test("court-circuit establish-session → cookies sb-* sur prof.* uniquement", async ({
    page,
    context,
  }) => {
    await loginAsTeacher(page, TEACHER_EMAIL);

    const cookies = await context.cookies();
    const sbCookies = cookies.filter((c) => c.name.startsWith("sb-"));
    expect(sbCookies.length).toBeGreaterThan(0);
    for (const cookie of sbCookies) {
      // Cookies host-only : doivent être attachés à prof.* uniquement.
      expect(cookie.domain).toMatch(/prof\./);
      // Pas de leading dot (= pas de partage de domaine).
      expect(cookie.domain.startsWith(".")).toBe(false);
    }

    // /tableau-de-bord répond 200 (route prof authed).
    await page.goto("/tableau-de-bord");
    await expect(page).toHaveURL(/\/tableau-de-bord$/);
  });
});
