"use client";

import { createBrowserClient } from "@supabase/ssr";
import { parse, serialize } from "cookie";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSharedCookieOptions } from "./cookieOptions";

/**
 * Supabase — client navigateur typé (E.2.2+).
 *
 * Singleton : le client est mis en cache à l'échelle du module pour éviter
 * de recréer une connexion à chaque render. Respecte les policies RLS.
 *
 * ## Sprint fix-pkce-prod (28 avril 2026) — Configuration cookies explicite
 *
 * Avant ce fix : `createBrowserClient(url, key)` était appelé sans option
 * `cookies`, le SDK utilisait alors son default `document.cookie` direct
 * avec `DEFAULT_COOKIE_OPTIONS = { path:"/", sameSite:"lax", maxAge:400d }`,
 * sans `secure`. En prod HTTPS, le code_verifier PKCE était parfois posé
 * mais pas retrouvé côté serveur lors du `exchangeCodeForSession` du
 * callback magic-link (erreur "PKCE code verifier not found in storage").
 *
 * Après ce fix : on passe explicitement `cookies: { getAll, setAll }` qui
 * pose les cookies via `document.cookie` AVEC les options partagées par
 * `getSharedCookieOptions()` (path, sameSite, secure, httpOnly cohérents
 * entre browser et server). Le code_verifier est ainsi posé avec
 * `Secure: true` en HTTPS, ce qui évite les rejets/réécritures en prod.
 *
 * ## Isolation des cookies entre sous-domaines (E.2.3.8) — INCHANGÉE
 *
 * On NE configure PAS `cookieOptions.domain` volontairement. Sans `Domain`
 * explicite, le navigateur pose des cookies "host-only" attachés au host
 * exact qui les a émis (admin.muscu-eps.fr, prof.muscu-eps.fr, muscu-eps.fr).
 * Cela assure l'isolation totale entre les 3 espaces. NE PAS ajouter de
 * `domain` sans revue sécurité — cela casserait E.2.3.8.
 */

let cached: SupabaseClient<Database> | null = null;

/**
 * Retourne le client Supabase navigateur typé, ou null si la configuration
 * publique est absente (ex: build local sans `.env.local`).
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  cached = createBrowserClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        if (typeof document === "undefined") return [];
        const parsed = parse(document.cookie);
        return Object.entries(parsed).map(([name, value]) => ({
          name,
          value: value ?? "",
        }));
      },
      setAll(cookiesToSet) {
        if (typeof document === "undefined") return;
        const sharedOptions = getSharedCookieOptions();
        for (const { name, value, options } of cookiesToSet) {
          // Le SDK passe ses propres options (maxAge notamment). On les
          // merge avec nos options partagées pour garantir secure + path
          // + sameSite cohérents avec le serveur, tout en respectant le
          // maxAge décidé par le SDK pour chaque cookie (verifier vs
          // session ont des durées différentes).
          document.cookie = serialize(name, value, {
            ...sharedOptions,
            ...options,
            // On force nos valeurs pour les flags critiques même si le
            // SDK essaie de les surcharger.
            path: sharedOptions.path,
            sameSite: sharedOptions.sameSite,
            secure: sharedOptions.secure,
          });
        }
      },
    },
  });
  return cached;
}

/**
 * Variante qui throw au lieu de renvoyer null. Utile quand l'appelant
 * ne peut pas fonctionner sans Supabase (ex: magic link côté client).
 */
export function requireSupabaseBrowserClient(): SupabaseClient<Database> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error(
      "Supabase navigateur indisponible : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requis.",
    );
  }
  return client;
}
