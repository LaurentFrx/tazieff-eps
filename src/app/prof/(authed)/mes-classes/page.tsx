// Phase E.2.3.4 — Liste des classes du prof.
//
// Server component : fetch direct via Supabase (jointure org + count
// enrollments). Cards avec nom, niveau, org, code + mini QR, count élèves.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveEnv } from "@/lib/env";
import ClassCardMiniQr from "@/components/teacher/ClassCardMiniQr";
import styles from "./mes-classes.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ClassRow = {
  id: string;
  name: string;
  school_year: string | null;
  join_code: string;
  created_at: string | null;
  organization: { id: string; name: string } | { id: string; name: string }[] | null;
  enrollments: { student_user_id: string }[] | null;
};

export default async function MesClassesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/connexion");

  const { data, error } = await supabase
    .from("classes")
    .select(
      `
      id, name, school_year, join_code, created_at,
      organization:organizations!inner (id, name),
      enrollments:class_enrollments (student_user_id)
      `,
    )
    .eq("teacher_user_id", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.errorBox}>
          Erreur de chargement. Réessayez ou contactez le support.
        </p>
      </div>
    );
  }

  const classes = (data ?? []) as ClassRow[];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Mes classes</h1>
          <p className={styles.subtitle}>
            Gérez les classes que vous animez et partagez le code d&apos;accès
            à vos élèves.
          </p>
        </div>
        <Link href="/mes-classes/nouvelle" className={styles.cta}>
          + Nouvelle classe
        </Link>
      </header>

      {classes.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>Aucune classe pour l&apos;instant</h2>
          <p className={styles.emptyDesc}>
            Créez votre première classe pour obtenir un code à partager à
            vos élèves.
          </p>
          <Link href="/mes-classes/nouvelle" className={styles.cta}>
            Créer ma première classe
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {classes.map((c) => {
            const org = Array.isArray(c.organization)
              ? c.organization[0]
              : c.organization;
            const studentsCount = Array.isArray(c.enrollments)
              ? c.enrollments.length
              : 0;
            return (
              <Link
                key={c.id}
                href={`/mes-classes/${c.id}`}
                className={styles.card}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardName}>{c.name}</h3>
                  {c.school_year && (
                    <span className={styles.level}>{c.school_year}</span>
                  )}
                </div>
                <p className={styles.orgName}>{org?.name ?? "—"}</p>

                <div className={styles.codeRow}>
                  <div className={styles.codeBlock}>
                    <span className={styles.codeLabel}>Code</span>
                    <span className={styles.codeValue}>{c.join_code}</span>
                  </div>
                  <ClassCardMiniQr
                    value={buildJoinUrl(c.join_code)}
                    size={72}
                  />
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.students}>
                    {studentsCount} élève{studentsCount > 1 ? "s" : ""}
                  </span>
                  <span className={styles.arrow} aria-hidden="true">
                    →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// URL de rejoint d'une classe (à afficher en QR). On vise l'espace élève
// avec un paramètre ?code=XXX — la page élève /rejoindre (non encore créée,
// E.2.4) consommera ce paramètre via join_class_with_code.
//
// Sprint A1 — base URL via resolveEnv() : sur preview, le QR pointe vers
// design.muscu-eps.fr, plus vers la prod.
function buildJoinUrl(code: string): string {
  return `${resolveEnv().baseUrl.eleve}/rejoindre?code=${encodeURIComponent(code)}`;
}
