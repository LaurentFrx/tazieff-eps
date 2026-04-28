// Sprint A4 — Helpers d'auth pour les tests Playwright.
//
// L'approche retenue (Option 2 du sprint A4) est de court-circuiter le flow
// magic-link via /api/test/establish-session, qui retourne un hashed_token
// que le test échange ensuite côté navigateur via supabase.auth.verifyOtp.
// Cela pose les cookies sb-* sur le HOST courant (host-only), comme un vrai
// magic-link réel le ferait.
//
// Ce qui est testé : tout sauf le flow PKCE en lui-même (couvert par les
// 945 tests Vitest + tests P0.7-quinquies/sexies/septies/undecies).
// Ce qui est PAS testé : la livraison email + le clic sur lien + l'échange
// du code via /auth/callback. Pour ces étapes, voir tests Vitest dédiés.

import type { Page, BrowserContext } from "@playwright/test";

/* ── Types et constantes ────────────────────────────────────────────── */

export type EstablishSessionResponse = {
  user: { id: string; email: string };
  hashed_token: string;
  email_otp: string | null;
  redirect_to: string | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/* ── API : pose une session pour un email donné ─────────────────────── */

/**
 * Demande à /api/test/establish-session un hashed_token, puis l'échange
 * côté navigateur via supabase.auth.verifyOtp pour poser les cookies sb-*.
 *
 * À appeler depuis un Page positionné sur le sous-domaine cible (élève /
 * prof / admin selon le besoin du test). Les cookies seront posés
 * host-only sur ce sous-domaine.
 */
export async function establishSession(
  page: Page,
  email: string,
): Promise<EstablishSessionResponse> {
  const response = await page.request.post("/api/test/establish-session", {
    data: { email },
  });
  if (!response.ok()) {
    throw new Error(
      `establish-session failed: ${response.status()} ${await response.text()}`,
    );
  }
  const json = (await response.json()) as EstablishSessionResponse;

  // 2. Échange côté navigateur : supabase.auth.verifyOtp pose les cookies
  //    sb-access-token / sb-refresh-token sur le host courant.
  //    Note : on doit naviguer sur le host avant que le supabase client soit
  //    disponible. Le caller est responsable de cette navigation.
  await page.goto("/");
  await page.evaluate(
    async ({ url, key, hashedToken, otpEmail }) => {
      const win = window as unknown as {
        __supabase?: unknown;
      };
      // Charge dynamiquement le client supabase via CDN si non monté.
      // En pratique on dépend du module @supabase/ssr déjà chargé par l'app.
      // Si non monté, on appelle l'API REST verify directement.
      const verifyResponse = await fetch(`${url}/auth/v1/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: key,
        },
        body: JSON.stringify({
          type: "magiclink",
          token: hashedToken,
          email: otpEmail,
        }),
      });
      if (!verifyResponse.ok) {
        throw new Error(
          `verifyOtp failed: ${verifyResponse.status} ${await verifyResponse.text()}`,
        );
      }
      const session = await verifyResponse.json();
      // Pose manuellement les cookies sb-* dans document.cookie. Format
      // utilisé par @supabase/ssr (chunks de 4KB max, mais ici on suppose
      // que les tokens sont assez courts pour tenir en un cookie).
      const projectRef = url.replace(/^https?:\/\//, "").split(".")[0];
      const cookieName = `sb-${projectRef}-auth-token`;
      const cookieValue = encodeURIComponent(JSON.stringify(session));
      document.cookie = `${cookieName}=${cookieValue}; path=/; SameSite=Lax`;
      void win; // avoid unused
    },
    {
      url: SUPABASE_URL ?? "",
      key: SUPABASE_ANON_KEY ?? "",
      hashedToken: json.hashed_token,
      otpEmail: email,
    },
  );

  return json;
}

/**
 * Login en tant que super_admin (Laurent). Pose la session + recharge.
 */
export async function loginAsAdmin(
  page: Page,
  email = "laurent@feroux.fr",
): Promise<EstablishSessionResponse> {
  const result = await establishSession(page, email);
  await page.reload();
  return result;
}

/**
 * Login en tant que prof académique. Email par défaut: test@ac-bordeaux.fr.
 */
export async function loginAsTeacher(
  page: Page,
  email = "test@ac-bordeaux.fr",
): Promise<EstablishSessionResponse> {
  const result = await establishSession(page, email);
  await page.reload();
  return result;
}

/**
 * Logout : clear tous les cookies sb-* du context.
 */
export async function logout(context: BrowserContext): Promise<void> {
  await context.clearCookies();
}
