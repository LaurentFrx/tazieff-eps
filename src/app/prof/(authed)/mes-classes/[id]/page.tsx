// Phase E.2.3.4 — Détail d'une classe.
//
// Server component pour le fetch initial, passe à ClassDetailClient pour
// l'interactivité (régénération du code, confirmation modale).

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ClassDetailClient from "./ClassDetailClient";
import styles from "./detail.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { id: string };

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/connexion");

  const { data, error } = await supabase
    .from("classes")
    .select(
      `
      id, name, school_year, join_code, join_code_expires_at,
      created_at, updated_at,
      organization:organizations!inner (id, name),
      enrollments:class_enrollments (student_user_id, joined_at)
      `,
    )
    .eq("id", id)
    .eq("teacher_user_id", user.id)
    .maybeSingle();

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>
          Erreur de chargement. Réessayez ou contactez le support.
        </p>
      </div>
    );
  }
  if (!data) notFound();

  const org = Array.isArray(data.organization)
    ? data.organization[0]
    : data.organization;
  const enrollments = Array.isArray(data.enrollments) ? data.enrollments : [];

  return (
    <div className={styles.page}>
      <Link href="/mes-classes" className={styles.back}>
        ← Mes classes
      </Link>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{data.name}</h1>
          <p className={styles.meta}>
            {org?.name ?? "—"}
            {data.school_year ? ` · ${data.school_year}` : ""}
          </p>
        </div>
        <span className={styles.countBadge}>
          {enrollments.length} élève{enrollments.length > 1 ? "s" : ""}
        </span>
      </header>

      <ClassDetailClient
        classId={data.id}
        initialCode={data.join_code}
        expiresAt={data.join_code_expires_at}
      />

      <section className={styles.enrollments}>
        <h2 className={styles.sectionTitle}>Élèves inscrits</h2>
        {enrollments.length === 0 ? (
          <p className={styles.emptyEnrolls}>
            Aucun élève n&apos;a rejoint cette classe pour l&apos;instant.
            Partagez le code ou le QR pour commencer.
          </p>
        ) : (
          <ul className={styles.enrollList}>
            {enrollments.map((e) => (
              <li key={e.student_user_id} className={styles.enrollItem}>
                <span className={styles.enrollId}>
                  Élève · {e.student_user_id.slice(0, 8)}…
                </span>
                <span className={styles.enrollDate}>
                  {e.joined_at
                    ? new Date(e.joined_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
