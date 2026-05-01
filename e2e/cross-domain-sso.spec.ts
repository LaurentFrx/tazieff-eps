// Sprint C1 (1er mai 2026) — Tests e2e auto-login cross-domain.
//
// Couvre les comportements observables sans session établie : validation
// du body, refus 401 si pas authentifié, redirect 302 sur token invalide.
//
// Note : la suite complète (super_admin authentifié → switch → session
// transférée) nécessite un helper d'établissement de session côté serveur.
// Cf. e2e/admin-flow.spec.ts pour le pattern. Ces scénarios full-flow sont
// reportés en sprint d'intégration ultérieur (à la suite du déploiement
// preview de cross-domain-sso).

import { test, expect } from "@playwright/test";

test.describe("C1 — /api/auth/cross-domain/generate (validation)", () => {
  test("body vide → 400 validation", async ({ request }) => {
    const response = await request.post("/api/auth/cross-domain/generate", {
      data: {},
    });
    // 400 (validation) attendu si la route est joignable. 401 acceptable
    // aussi si Next.js n'instancie pas le handler avant le check de session.
    expect([400, 401]).toContain(response.status());
  });

  test("target_host non whitelisté → 400 validation", async ({ request }) => {
    const response = await request.post("/api/auth/cross-domain/generate", {
      data: { target_host: "evil.example.com", target_path: "/" },
    });
    // 400 si validation passe avant auth ; 401 si auth check passe avant.
    // Les deux sont acceptables — l'important est qu'il N'Y AIT PAS 200.
    expect([400, 401]).toContain(response.status());
  });

  test("sans session → 401 unauthenticated", async ({ request }) => {
    const response = await request.post("/api/auth/cross-domain/generate", {
      data: {
        target_host: "prof.muscu-eps.fr",
        target_path: "/tableau-de-bord",
      },
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("unauthenticated");
  });
});

test.describe("C1 — /api/auth/cross-domain/consume (token invalide)", () => {
  test("sans token → redirige vers login", async ({ page }) => {
    const response = await page.goto("/api/auth/cross-domain/consume", {
      waitUntil: "domcontentloaded",
    });
    // Redirect 302 → on suit la redirection. La page finale doit contenir
    // le query param cross_domain_error.
    expect(response?.status()).toBeLessThan(500);
    expect(page.url()).toContain("cross_domain_error=invalid_token");
  });

  test("token de longueur incorrecte → redirige vers login", async ({
    page,
  }) => {
    await page.goto("/api/auth/cross-domain/consume?token=short&path=/", {
      waitUntil: "domcontentloaded",
    });
    expect(page.url()).toContain("cross_domain_error=invalid_token");
  });

  test("token de bonne longueur mais inexistant → redirige", async ({
    page,
  }) => {
    const fakeToken = "a".repeat(64);
    await page.goto(
      `/api/auth/cross-domain/consume?token=${fakeToken}&path=/`,
      { waitUntil: "domcontentloaded" },
    );
    expect(page.url()).toContain("cross_domain_error=invalid_token");
  });
});
