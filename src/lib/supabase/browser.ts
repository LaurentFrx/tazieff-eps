"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Supabase — client navigateur typé (E.2.2+).
 *
 * Coexiste avec `./client.ts` (pré-E.2.2, non typé, renvoie null si env
 * manquante). Pour tout NOUVEAU code client, préférer cette version typée.
 *
 * Singleton : le client est mis en cache à l'échelle du module pour éviter
 * de recréer une connexion à chaque render. Respecte les policies RLS.
 */

let cached: SupabaseClient<Database> | null = null;

/**
 * Retourne le client Supabase navigateur typé, ou null si la configuration
 * publique est absente (ex: build local sans `.env.local`). Les appelants
 * doivent gérer le cas null comme "Supabase indisponible".
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  cached = createBrowserClient<Database>(url, anonKey);
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
