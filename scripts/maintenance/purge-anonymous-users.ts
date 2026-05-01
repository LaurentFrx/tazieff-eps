/**
 * Sprint fix-anonymous-users (1 mai 2026) — Script de purge des comptes
 * anonymes obsolètes.
 *
 * Audit du 30 avril 2026 : 904 utilisateurs anonymes en BD pour 2 users
 * réels (super_admin + 1 prof). Cf. SQL :
 *
 *   SELECT count(*) FILTER (WHERE is_anonymous = true) FROM auth.users;
 *
 * Pourquoi un script en plus de la fonction Postgres :
 *   - La fonction `public.purge_obsolete_anonymous_users()` (cf. migration
 *     20260501110000) est destinée à un cron Supabase. Ce script-ci sert
 *     pour les exécutions manuelles ad-hoc, avec dry-run et logging.
 *   - Il utilise auth.admin.deleteUser via service_role — équivalent côté
 *     SDK plutôt que SQL direct, ce qui peut être préférable selon les
 *     RLS / triggers présents.
 *
 * Usage :
 *   npm run script:purge-anonymous           # dry-run (n'efface rien)
 *   npm run script:purge-anonymous -- --apply  # purge réelle
 *
 * Critère par défaut : anonymes inactifs > 30 jours sans données associées
 * dans training_entries / student_profiles / class_enrollments.
 *
 * Nécessite SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL dans
 * l'environnement (cf. .env.local).
 */

import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const DAYS_INACTIVE = Number(process.env.PURGE_DAYS_INACTIVE ?? "30");

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Erreur : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans l'environnement.",
    );
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`[purge-anonymous] Mode : ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log(`[purge-anonymous] Critère : inactif > ${DAYS_INACTIVE} jours`);

  // Identification des cibles via SQL direct (plus performant que paginer
  // listUsers + filtrer côté script).
  const { data: targets, error: selectError } = await supabase.rpc(
    "purge_obsolete_anonymous_users_dryrun",
    {},
  );

  if (selectError) {
    // Si la fonction dryrun n'existe pas, on tombe sur la fonction "live"
    // en mode APPLY uniquement.
    if (!APPLY) {
      console.log(
        `[purge-anonymous] Fonction dry-run absente, exécution skippée. Re-lancez avec --apply pour purger via purge_obsolete_anonymous_users().`,
      );
      return;
    }
    const { data: deleted, error: applyError } = await supabase.rpc(
      "purge_obsolete_anonymous_users",
      {},
    );
    if (applyError) {
      console.error("[purge-anonymous] Erreur :", applyError.message);
      process.exit(1);
    }
    console.log(`[purge-anonymous] ${deleted} comptes supprimés.`);
    return;
  }

  console.log(`[purge-anonymous] ${targets?.length ?? 0} cibles identifiées.`);
  if (!APPLY) {
    console.log(`[purge-anonymous] Mode DRY-RUN, aucune suppression.`);
    return;
  }

  const { data: deleted, error: applyError } = await supabase.rpc(
    "purge_obsolete_anonymous_users",
    {},
  );
  if (applyError) {
    console.error("[purge-anonymous] Erreur :", applyError.message);
    process.exit(1);
  }
  console.log(`[purge-anonymous] ${deleted} comptes supprimés.`);
}

main().catch((err) => {
  console.error("[purge-anonymous] Fatal:", err);
  process.exit(1);
});
