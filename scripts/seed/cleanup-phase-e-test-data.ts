/**
 * Sprint E.0 — Cleanup des données de seed Phase E.
 *
 * Supprime tout ce que `phase-e-test-data.ts` a posé en BD :
 *   - Les annotations du prof de test sur l'exercice s1-01 (DELETE physique
 *     pour purge, pas de soft-delete : c'est de la donnée de test à éradiquer)
 *   - Les class_enrollments des élèves de test
 *   - Les student_profiles des élèves de test
 *   - La classe « Classe de test 2nde A » du prof de test
 *   - La membership du prof
 *   - Les auth.users (emails @test.local) — la cascade FK se charge du reste
 *
 * Le script est idempotent : si une partie a déjà été supprimée, il continue.
 *
 * USAGE
 *   SEED_ALLOW=preview-test \
 *   SUPABASE_URL=https://<preview-project-ref>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<key> \
 *   npm run seed:cleanup
 *
 * GARDE PREVIEW-ONLY : identique à phase-e-test-data.ts (cf. guard.ts).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { assertPreviewOnly, TEST_DATA } from "./guard";

async function deleteAnnotations(
  admin: SupabaseClient,
  authorUserId: string,
): Promise<number> {
  const { data, error } = await admin
    .from("teacher_annotations")
    .delete()
    .eq("author_user_id", authorUserId)
    .eq("exercise_slug", TEST_DATA.exerciseSlug)
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

async function deleteEnrollments(
  admin: SupabaseClient,
  studentUserIds: string[],
): Promise<number> {
  if (studentUserIds.length === 0) return 0;
  const { data, error } = await admin
    .from("class_enrollments")
    .delete()
    .in("student_user_id", studentUserIds)
    .select("class_id");
  if (error) throw error;
  return data?.length ?? 0;
}

async function deleteStudentProfiles(
  admin: SupabaseClient,
  studentUserIds: string[],
): Promise<number> {
  if (studentUserIds.length === 0) return 0;
  const { data, error } = await admin
    .from("student_profiles")
    .delete()
    .in("user_id", studentUserIds)
    .select("user_id");
  if (error) throw error;
  return data?.length ?? 0;
}

async function deleteClass(
  admin: SupabaseClient,
  teacherUserId: string,
): Promise<number> {
  const { data, error } = await admin
    .from("classes")
    .delete()
    .eq("teacher_user_id", teacherUserId)
    .eq("name", TEST_DATA.classDisplayName)
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

async function deleteMembership(
  admin: SupabaseClient,
  teacherUserId: string,
): Promise<number> {
  const { data, error } = await admin
    .from("memberships")
    .delete()
    .eq("user_id", teacherUserId)
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

async function deleteAuthUser(
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) throw listErr;
  const target = list?.users.find((u) => u.email === email);
  if (!target) {
    console.log(`[cleanup] auth.users absent : ${email} (rien à faire)`);
    return null;
  }
  const { error: delErr } = await admin.auth.admin.deleteUser(target.id);
  if (delErr) throw delErr;
  console.log(`[cleanup] auth.users supprimé : ${email} → ${target.id}`);
  return target.id;
}

async function cleanup(): Promise<void> {
  const { url, serviceRoleKey } = assertPreviewOnly();
  console.log(`[cleanup] Cible Supabase : ${url}`);

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1) Localiser les users de test (par email pattern @test.local)
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) throw listErr;

  const testUsers = (list?.users ?? []).filter((u) =>
    u.email?.endsWith(TEST_DATA.emailDomain),
  );

  if (testUsers.length === 0) {
    console.log(`[cleanup] Aucun user ${TEST_DATA.emailDomain} trouvé. Rien à faire.`);
    return;
  }
  console.log(`[cleanup] ${testUsers.length} user(s) ${TEST_DATA.emailDomain} détectés.`);

  const profUser = testUsers.find((u) => u.email === TEST_DATA.emails.prof);
  const studentUsers = testUsers.filter(
    (u) =>
      u.email === TEST_DATA.emails.eleve1 ||
      u.email === TEST_DATA.emails.eleve2,
  );

  // 2) Suppression dans l'ordre inverse des FKs pour rester sûr même si la
  //    cascade FK n'est pas configurée sur certaines tables :
  //    annotations → enrollments → student_profiles → classes → memberships → auth.users
  if (profUser) {
    const annCount = await deleteAnnotations(admin, profUser.id);
    console.log(`[cleanup] annotations supprimées : ${annCount}`);
  }

  const studentIds = studentUsers.map((u) => u.id);
  const enrollCount = await deleteEnrollments(admin, studentIds);
  console.log(`[cleanup] enrollments supprimés : ${enrollCount}`);

  const profileCount = await deleteStudentProfiles(admin, studentIds);
  console.log(`[cleanup] student_profiles supprimés : ${profileCount}`);

  if (profUser) {
    const classCount = await deleteClass(admin, profUser.id);
    console.log(`[cleanup] classes supprimées : ${classCount}`);

    const membershipCount = await deleteMembership(admin, profUser.id);
    console.log(`[cleanup] memberships supprimées : ${membershipCount}`);
  }

  // 3) Suppression des auth.users
  for (const email of [
    TEST_DATA.emails.prof,
    TEST_DATA.emails.eleve1,
    TEST_DATA.emails.eleve2,
  ]) {
    await deleteAuthUser(admin, email);
  }

  console.log("[cleanup] ✅ Terminé.");
}

cleanup().catch((err) => {
  console.error("[cleanup] ❌ ERREUR :", err);
  process.exit(1);
});
