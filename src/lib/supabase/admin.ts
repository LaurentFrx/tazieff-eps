import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Client Supabase ADMIN (service_role, bypass RLS) typé avec {@link Database}.
 *
 * USAGE STRICT : uniquement scripts serveur de confiance.
 *   - Seeds de dev (npm run db:seed)
 *   - Invitations prof → élève (E.2.3+)
 *   - Opérations d'administration (suppression en cascade RGPD, etc.)
 *
 * JAMAIS importé par du code Client Component. Le guard `server-only` fait
 * échouer le build à la moindre fuite vers le navigateur.
 *
 * La session n'est pas persistée (pas de cookie, pas de refresh) : le client
 * agit comme une identité machine, sans utilisateur associé.
 */
export function createSupabaseAdminClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) {
    throw new Error(
      "SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL manquant dans l'environnement.",
    );
  }
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY manquant dans l'environnement.");
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
