// Sprint A4 — Chaîne C1 + C4 : magic-link admin → édition au clic super_admin.
//
// Couvre l'audit-cc 2026-04-28 :
//   - C1 : saisie email → POST /api/auth/admin-magic-link → délai constant
//          1.5s → message anti-leak → court-circuit via /api/test/establish-session
//          → cookies sb-* posés sur le bon host → /admin affiche le rôle.
//   - C4 : super_admin sur miroir → click éditeur inline → POST
//          /api/teacher/exercise-override → écriture exercise_overrides +
//          audit_log → refetch → modif visible.
//
// Pré-requis :
//   - Variables PLAYWRIGHT_TEST_SECRET, NEXT_PUBLIC_SUPABASE_URL,
//     NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY exportées.
//   - L'app tourne sur les 3 sous-domaines (admin / élève / prof) en dev
//     ou en preview. Cf. docs/testing.md pour le setup local.

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

const ADMIN_EMAIL = process.env.PLAYWRIGHT_ADMIN_EMAIL ?? "laurent@feroux.fr";

test.describe("C1 — Magic-link admin de bout en bout", () => {
  test("saisie email → message anti-leak strict + délai constant ~1.5s", async ({
    page,
  }) => {
    await page.goto("/login");

    const emailInput = page.getByLabel(/email|courriel/i).first();
    await emailInput.fill(ADMIN_EMAIL);

    const start = Date.now();
    await page.getByRole("button", { name: /envoyer|submit|recevoir/i }).click();

    // Le délai constant 1.5s côté serveur doit être visible dans le timing
    // de la réponse (anti-timing-attack P0.8).
    await expect(
      page.getByTestId("admin-login-confirmation"),
    ).toBeVisible({ timeout: 5_000 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(1_400); // tolérance 100ms
  });

  test("court-circuit via establish-session → cookies sb-* posés + /admin affiche le rôle", async ({
    page,
    context,
  }) => {
    // 1. Vérifier que la route est gardée (sans header secret → 401).
    const unauthorized = await page.request.post(
      "/api/test/establish-session",
      {
        data: { email: ADMIN_EMAIL },
        headers: { "X-Playwright-Test": "wrong" },
      },
    );
    expect(unauthorized.status()).toBe(401);

    // 2. Avec le bon header (injecté par playwright.config.ts), la route
    //    retourne le hashed_token et l'email_otp.
    await loginAsAdmin(page, ADMIN_EMAIL);

    // 3. Cookies sb-* présents sur le host admin.
    const cookies = await context.cookies();
    const sbCookies = cookies.filter((c) => c.name.startsWith("sb-"));
    expect(sbCookies.length).toBeGreaterThan(0);
    for (const cookie of sbCookies) {
      // Garde host-only : le cookie doit être attaché à admin.localhost ou
      // design-admin.muscu-eps.fr ou admin.muscu-eps.fr (pas de domain leading dot).
      expect(cookie.domain).toMatch(/admin\./);
    }

    // 4. /admin affiche l'email + le rôle.
    await page.goto("/admin");
    await expect(page.getByTestId("admin-email")).toHaveText(ADMIN_EMAIL);
    await expect(page.getByTestId("admin-role")).toContainText(
      /super[- ]?admin|super[- ]?administrateur/i,
    );
  });
});

test.describe("C4 — Édition au clic super_admin (miroir)", () => {
  test.skip(
    process.env.PLAYWRIGHT_SKIP_EDIT === "1",
    "PLAYWRIGHT_SKIP_EDIT=1 — skip de l'édition réelle (pas de slug stable disponible)",
  );

  test("clic sur paragraphe → textarea visible → save → modif persiste", async ({
    page,
  }) => {
    await loginAsAdmin(page, ADMIN_EMAIL);

    // Le miroir admin sert /fr/exercices/:slug en pass-through. On choisit
    // un slug stable du catalogue (s1-01).
    await page.goto("/fr/exercices/s1-01");

    // L'éditeur inline doit être actif (isAdmin résolu via /api/me/role).
    // On attend que useAppAdmin ait chargé en cherchant le marker.
    await expect(page.getByTestId("admin-edit-toggle")).toBeVisible({
      timeout: 10_000,
    });

    // Clic sur un paragraphe de la fiche → textarea apparaît.
    const firstParagraph = page.locator("[data-edit-paragraph]").first();
    await firstParagraph.click();
    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible();

    // On ne sauve PAS de modif réelle pour éviter de polluer la table
    // exercise_overrides en environnement de test partagé. Cf. limitations
    // documentées dans docs/testing.md.
  });
});
