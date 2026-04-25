// Phase E.2.3.4 — Page de création d'une classe.
//
// Server component : récupère les memberships pour peupler le select org.
// Si zéro membership, affiche un message d'aide et un lien de contact.
// Sinon délègue à <CreateClassForm> (client) pour l'interactivité form.

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CreateClassForm from "./CreateClassForm";
import type { MembershipItem } from "@/lib/validation/teacher-me";
import styles from "./nouvelle.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function NouvelleClassePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/connexion");

  const { data, error } = await supabase
    .from("memberships")
    .select(`role, created_at, organization:organizations!inner (id, name, type)`)
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.errorBox}>
          Erreur de chargement des organisations. Réessayez.
        </p>
      </div>
    );
  }

  const memberships: MembershipItem[] = (data ?? []).map((row) => {
    const org = Array.isArray(row.organization) ? row.organization[0] : row.organization;
    return {
      org_id: org?.id ?? "",
      org_name: org?.name ?? "",
      org_type: org?.type ?? null,
      role: row.role,
      joined_at: row.created_at ?? null,
    };
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Nouvelle classe</h1>
        <p className={styles.subtitle}>
          Créez une classe et partagez son code avec vos élèves pour qu&apos;ils
          s&apos;y rattachent en quelques secondes.
        </p>
      </header>

      {memberships.length === 0 ? (
        <div className={styles.warning}>
          <h2 className={styles.warningTitle}>Établissement requis</h2>
          <p className={styles.warningDesc}>
            Vous devez d&apos;abord être rattaché à un établissement pour
            pouvoir créer une classe. Contactez l&apos;administrateur de votre
            organisation ou écrivez à{" "}
            <a href="mailto:contact@muscu-eps.fr" className={styles.link}>
              contact@muscu-eps.fr
            </a>
            .
          </p>
        </div>
      ) : (
        <CreateClassForm memberships={memberships} />
      )}
    </div>
  );
}
