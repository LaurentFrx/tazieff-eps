/**
 * Sprint E.0 — Garde preview-only pour les scripts de seed Phase E.
 *
 * Cette garde refuse l'exécution si :
 *  - SUPABASE_URL est absent
 *  - L'URL pointe vers un projet de production connu (cf. PROD_PROJECT_REFS)
 *  - SEED_ALLOW=preview-test n'est pas explicitement défini
 *  - SUPABASE_SERVICE_ROLE_KEY est absent
 *
 * La garde est délibérément verbeuse et multi-couches : un test seul ne suffit pas.
 * Le but est qu'aucun seed Phase E ne puisse jamais s'exécuter sur la BD prod
 * `zefkltkiigxkjcrdesrk`, même par accident (variable d'env oubliée, .env.local
 * pointant vers prod, etc.).
 *
 * Voir GOUVERNANCE_EDITORIALE.md §6 (verrouillage écritures) et le rapport
 * d'audit Phase E du 28 avril 2026 (PARTIE 6 — recommandation seed).
 */

/**
 * project_ref Supabase de production à interdire absolument.
 *
 * Si tu ajoutes un nouvel environnement prod (autre Supabase project), inscris
 * son `project_ref` (le hash 20 caractères de l'URL `https://<ref>.supabase.co`)
 * ici pour qu'aucun seed ne puisse y s'exécuter.
 */
export const PROD_PROJECT_REFS: readonly string[] = [
  "zefkltkiigxkjcrdesrk", // muscu-eps.fr (Tazieff EPS prod, configuré dans CLAUDE.md §13)
] as const;

/** Valeur attendue de la variable d'environnement SEED_ALLOW. */
export const SEED_ALLOW_VALUE = "preview-test";

export type GuardResult = {
  url: string;
  serviceRoleKey: string;
};

/**
 * Lève une erreur si l'environnement n'est pas un environnement preview-only
 * autorisé. Retourne l'URL et la service-role key validées en cas de succès.
 *
 * Cette fonction lit directement `process.env`. Le test l'invoque après avoir
 * manipulé `process.env` pour valider chaque branche de refus.
 */
export function assertPreviewOnly(): GuardResult {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  if (!url) {
    throw new Error(
      "[seed:guard] SUPABASE_URL absent. Définis SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL pointant vers un projet preview Supabase.",
    );
  }

  for (const prodRef of PROD_PROJECT_REFS) {
    if (url.includes(prodRef)) {
      throw new Error(
        `[seed:guard] Projet de production détecté (${prodRef}) dans SUPABASE_URL. Le seed Phase E est preview-only et refuse de s'exécuter sur la prod.`,
      );
    }
  }

  if (process.env.SEED_ALLOW !== SEED_ALLOW_VALUE) {
    throw new Error(
      `[seed:guard] SEED_ALLOW=${SEED_ALLOW_VALUE} requis pour autoriser explicitement le seed. Cette protection rend une exécution accidentelle impossible.`,
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!serviceRoleKey) {
    throw new Error(
      "[seed:guard] SUPABASE_SERVICE_ROLE_KEY absent. La service-role key du projet preview est requise pour créer des users via supabase.auth.admin.",
    );
  }

  return { url, serviceRoleKey };
}

/**
 * Constantes partagées des données de test Phase E.
 * Émis ici pour que le script seed et le script cleanup utilisent exactement
 * les mêmes identifiants.
 */
export const TEST_DATA = {
  /** Domaine email de test — jamais routable, jamais réel. */
  emailDomain: "@test.local",
  emails: {
    prof: "prof.test@test.local",
    eleve1: "eleve1.test@test.local",
    eleve2: "eleve2.test@test.local",
  },
  /** Code de l'organisation Tazieff (cf. CLAUDE.md §13 et migration P0.2). */
  organizationCode: "TAZIEFF2026",
  classDisplayName: "Classe de test 2nde A",
  exerciseSlug: "s1-01",
  locale: "fr" as const,
  /** Mot de passe local — jamais utilisé pour login réel, juste créer le user. */
  password: "TazieffE0_seed_dev!",
  annotations: [
    {
      scope: "private" as const,
      notes: "Note privée du prof : tester l'ouverture de poignets.",
    },
    {
      scope: "class" as const,
      notes: "Pour la classe : insister sur l'alignement du dos.",
    },
    {
      scope: "school" as const,
      notes: "Note pour l'établissement : voir aussi exercice s2-01.",
    },
  ],
} as const;
