import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Supabase — clients serveur.
 *
 * Ce fichier contient DEUX générations de clients qui cohabitent :
 *
 *   1. {@link createSupabaseServerClient} (E.2.2+) — client typé `Database`,
 *      basé sur @supabase/ssr, lit/écrit les cookies Next.js pour récupérer
 *      la session utilisateur. Utilisé par les routes API auth + annotations
 *      et par les Server Components qui ont besoin de l'identité du user.
 *
 *   2. {@link getSupabaseServerClient} / {@link getSupabaseServiceClient}
 *      (pré-E.2.2) — clients non typés basés sur @supabase/supabase-js,
 *      utilisés par les routes legacy `/api/teacher/{exercise-override,
 *      live-exercise, upload-media}` qui s'appuient sur une auth PIN +
 *      service_role. Conservés pour rétrocompat. À migrer en E.2.5
 *      (dette technique notée dans TODO.md).
 */

// --------- Client moderne (E.2.2+) : session utilisateur via cookies ---------

const SUPABASE_URL_PUBLIC = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY_PUBLIC = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Client Supabase serveur typé avec {@link Database} (E.2.1).
 *
 * SOURCE UNIQUE pour les routes API et Server Components qui doivent lire
 * l'utilisateur courant (via cookie de session). Respecte automatiquement
 * les policies RLS (pas de bypass).
 *
 * Throw si les variables publiques sont absentes de l'environnement (fail fast,
 * prévient les bugs silencieux).
 */
export async function createSupabaseServerClient() {
  if (!SUPABASE_URL_PUBLIC || !SUPABASE_ANON_KEY_PUBLIC) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requis côté serveur.",
    );
  }
  const cookieStore = await cookies();
  return createServerClient<Database>(
    SUPABASE_URL_PUBLIC,
    SUPABASE_ANON_KEY_PUBLIC,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components : `set` ne peut pas écrire les cookies. Normal.
            // La session sera persistée lors d'une Route Handler / Action.
          }
        },
      },
    },
  );
}

// --------- Clients legacy (pré-E.2.2) : conservation pour compat ---------

const SUPABASE_URL_LEGACY =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY_LEGACY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function createLegacyClient(key: string): SupabaseClient | null {
  if (!SUPABASE_URL_LEGACY || !key) {
    return null;
  }

  return createClient(SUPABASE_URL_LEGACY, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * @deprecated Utilisé par les routes legacy. Pour toute nouvelle route,
 * préférer {@link createSupabaseServerClient} (typé + session + RLS).
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  return createLegacyClient(SUPABASE_ANON_KEY_LEGACY);
}

/**
 * @deprecated Client service_role (bypass RLS). Utilisé par les routes legacy
 * `/api/teacher/{exercise-override, live-exercise, upload-media}` pour l'auth PIN.
 * Pour les nouveaux usages (seeds, invitations), préférer le nouveau
 * `createSupabaseAdminClient()` typé dans `./admin.ts`.
 */
export function getSupabaseServiceClient(): SupabaseClient {
  const client = createLegacyClient(SUPABASE_SERVICE_ROLE_KEY);
  if (!client) {
    throw new Error("Supabase service role is not configured.");
  }
  return client;
}
