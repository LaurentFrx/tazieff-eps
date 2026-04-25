// Phase E.2.3.3 — Tableau de bord prof.
//
// Affiche :
//   - Hero de bienvenue "Bonjour {Prénom}"
//   - 3 cards stats : classes actives, élèves rattachés, annotations créées
//   - 3 cards Accès rapide vers mes-classes, mes-annotations, exercices
//
// Les données sont fetchées côté serveur via le client Supabase RLS-filtré :
// l'user ne voit que ses propres classes/annotations même si l'ID était
// manipulé côté client (ce qui n'arrive pas ici, mais c'est la convention).

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { teacherFirstNameFromEmail } from "@/lib/teacher/display";
import styles from "./tableau-de-bord.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Stats = {
  classes_count: number;
  students_count: number;
  annotations_count: number;
};

async function fetchStats(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
): Promise<Stats> {
  // 1. Classes actives (non archivées) enseignées par l'user
  const classesRes = await supabase
    .from("classes")
    .select("id", { count: "exact" })
    .eq("teacher_user_id", userId)
    .is("archived_at", null);

  const classIds = (classesRes.data ?? []).map((c) => c.id);
  const classes_count = classesRes.count ?? classIds.length;

  // 2. Élèves cumulés dans ces classes (peut compter plusieurs fois un même
  // élève s'il est dans 2 classes du prof, c'est ce qu'on veut pour
  // "élèves rattachés cumul")
  let students_count = 0;
  if (classIds.length > 0) {
    const enrollRes = await supabase
      .from("class_enrollments")
      .select("student_user_id", { count: "exact", head: true })
      .in("class_id", classIds);
    students_count = enrollRes.count ?? 0;
  }

  // 3. Annotations créées par l'user (non supprimées)
  const annRes = await supabase
    .from("teacher_annotations")
    .select("id", { count: "exact", head: true })
    .eq("author_user_id", userId)
    .is("deleted_at", null);

  return {
    classes_count,
    students_count,
    annotations_count: annRes.count ?? 0,
  };
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/connexion");

  const firstName = teacherFirstNameFromEmail(user.email);
  const stats = await fetchStats(supabase, user.id);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>
          Bonjour {firstName || "enseignant"}
        </h1>
        <p className={styles.subtitle}>
          Votre espace pédagogique. Gérez vos classes, annotez des exercices et
          suivez l&apos;activité de vos élèves.
        </p>
      </section>

      <section className={styles.statsRow} aria-label="Statistiques">
        <StatCard
          value={stats.classes_count}
          label="Classes actives"
          color="cyan"
        />
        <StatCard
          value={stats.students_count}
          label="Élèves rattachés"
          color="violet"
        />
        <StatCard
          value={stats.annotations_count}
          label="Annotations créées"
          color="orange"
        />
      </section>

      <section className={styles.quickAccess} aria-label="Accès rapide">
        <h2 className={styles.sectionTitle}>Accès rapide</h2>
        <div className={styles.cardsGrid}>
          <QuickCard
            href="/mes-classes"
            title="Mes classes"
            description="Créer, régénérer les codes, voir les élèves inscrits."
            color="cyan"
          />
          <QuickCard
            href="/mes-annotations"
            title="Mes annotations"
            description="Retrouver toutes vos notes pédagogiques, filtrer par exercice."
            color="violet"
          />
          <QuickCard
            href="/exercices"
            title="Catalogue exercices"
            description="Parcourir le catalogue et annoter un exercice."
            color="orange"
          />
        </div>
      </section>
    </div>
  );
}

// --- Sous-composants présentationnels ---

function StatCard({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: "cyan" | "violet" | "orange";
}) {
  return (
    <div className={`${styles.statCard} ${styles[`stat_${color}`]}`}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

function QuickCard({
  href,
  title,
  description,
  color,
}: {
  href: string;
  title: string;
  description: string;
  color: "cyan" | "violet" | "orange";
}) {
  return (
    <Link href={href} className={`${styles.quickCard} ${styles[`quick_${color}`]}`}>
      <div className={styles.quickCardInner}>
        <h3 className={styles.quickTitle}>{title}</h3>
        <p className={styles.quickDesc}>{description}</p>
        <span className={styles.quickArrow} aria-hidden="true">
          →
        </span>
      </div>
    </Link>
  );
}
