// Sprint fix-pkce-prod (28 avril 2026) — Source unique des options de cookies
// pour les clients Supabase (browser + server). Garantit que le code_verifier
// PKCE et les cookies de session sont posés avec les MÊMES paramètres des
// deux côtés, condition nécessaire pour que `exchangeCodeForSession` côté
// serveur retrouve le verifier posé côté navigateur.
//
// Bug constaté en prod après merge du 2026-04-28 : `signInWithOtp` côté
// client posait le code_verifier avec les défauts du SDK @supabase/ssr
// (path, sameSite, mais SANS `secure: true`), tandis que côté serveur le
// `cookieStore.set(name, value, options)` propageait des options sans flag
// `secure` non plus. Sur Chrome HTTPS prod, certaines combinaisons de
// proxies (Vercel Edge → Node runtime) peuvent rejeter ou réécrire les
// cookies sans `Secure`, surtout après navigation cross-origin (mail →
// Supabase verify → admin.muscu-eps.fr/auth/callback).
//
// Le fix défensif est de :
//   1. Configurer EXPLICITEMENT le `cookies` getAll/setAll côté browser
//   2. Configurer EXPLICITEMENT les options dans `setAll` côté server
//   3. Forcer `secure: true` quand on est en HTTPS (prod, preview, et toute
//      URL non-localhost)
//   4. NE JAMAIS poser `domain` (préserve l'isolation host-only E.2.3.8)
//
// Référence : audit-cc 2026-04-28 PS3, GOUVERNANCE_EDITORIALE.md §2.1, §7.

export type SharedCookieOptions = {
  path: string;
  sameSite: "lax";
  secure: boolean;
  httpOnly: false; // PKCE verifier doit être lisible côté JS
};

/**
 * Détermine si on doit poser les cookies en mode `Secure: true`.
 *
 * Côté serveur : on lit VERCEL_URL ou request host pour décider.
 * Côté client : on regarde `window.location.protocol`.
 *
 * Règle : tout host autre que localhost / 127.0.0.1 → secure: true.
 * En dev local HTTP, secure: false (sinon Chrome refuse le cookie).
 */
export function isSecureContext(host?: string): boolean {
  if (typeof window !== "undefined") {
    return window.location.protocol === "https:";
  }
  if (!host) {
    // SSR/Route Handler sans host explicite : on suppose HTTPS (prod/preview).
    return true;
  }
  return !host.includes("localhost") && !host.startsWith("127.0.0.1");
}

/**
 * Options de cookie partagées entre createBrowserClient et createServerClient.
 *
 * IMPORTANT : pas de `domain`. Sans Domain explicite, le navigateur pose
 * des cookies "host-only" attachés au host exact (admin.muscu-eps.fr,
 * prof.muscu-eps.fr, muscu-eps.fr). Cela préserve l'isolation entre
 * sous-domaines (E.2.3.8).
 */
export function getSharedCookieOptions(host?: string): SharedCookieOptions {
  return {
    path: "/",
    sameSite: "lax",
    secure: isSecureContext(host),
    httpOnly: false,
  };
}
