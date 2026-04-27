"use client";

// Sprint P0.7-quinquies — Aligné sur browser.ts (createBrowserClient
// @supabase/ssr) pour stocker la session en cookies au lieu de localStorage.
//
// Cause racine du bug "édition au clic inactive sur miroir admin" :
//   - L'ancien client.ts utilisait `createClient` de @supabase/supabase-js
//     qui stocke la session par défaut en localStorage.
//   - server.ts utilise `createServerClient` de @supabase/ssr qui lit la
//     session via les cookies.
//   - Sur le miroir admin (design-admin.muscu-eps.fr), la session admin est
//     posée dans les cookies (par /admin/login → /auth/callback). Quand
//     AuthProvider élève monte sur /fr/exercices/[slug], il lisait
//     localStorage (vide pour ce host), retombait dans `signInAnonymously()`
//     qui écrasait la session admin via les cookies posés par Supabase Auth.
//   - Conséquence : /api/me/role voyait l'anonymous user, isAdmin restait
//     false, InlineParagraphEditor n'était pas monté.
//
// Le fix délègue au singleton de browser.ts (createBrowserClient) : tous
// les callers historiques de getSupabaseBrowserClient/Async partagent
// désormais une seule instance cookies-aware, cohérente avec le serveur.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient as getSsrBrowserClient } from "./browser";

/** Synchronous access — retourne le singleton @supabase/ssr partagé. */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  return getSsrBrowserClient();
}

/**
 * Async access — préservé pour compatibilité avec les callers historiques.
 * Le client est en réalité disponible immédiatement via le singleton de
 * browser.ts (lazy-init synchrone).
 */
export async function getSupabaseBrowserClientAsync(): Promise<SupabaseClient | null> {
  return getSsrBrowserClient();
}
