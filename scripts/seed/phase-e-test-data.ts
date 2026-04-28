/**
 * Sprint E.0 — Seed des données de test Phase E.
 *
 * Pose un environnement minimal mais complet pour tester les sprints E.3 → E.8 :
 *   - 1 prof (membership active sur l'organisation Tazieff existante)
 *   - 1 classe avec join_code généré via la RPC `generate_class_join_code()`
 *   - 2 élèves enrôlés (avec `student_profiles` complets)
 *   - 3 annotations sur l'exercice `s1-01` (locale FR), une par scope :
 *       private / class / school
 *
 * USAGE
 *   SEED_ALLOW=preview-test \
 *   SUPABASE_URL=https://<preview-project-ref>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<key> \
 *   npm run seed:phase-e
 *
 * GARDE PREVIEW-ONLY
 *   La fonction `assertPreviewOnly()` (cf. scripts/seed/guard.ts) refuse :
 *     - L'absence de SUPABASE_URL
 *     - Toute URL pointant vers un project_ref de production
 *     - L'absence de SEED_ALLOW=preview-test
 *     - L'absence de SUPABASE_SERVICE_ROLE_KEY
 *   Aucun seed Phase E ne peut donc s'exécuter sur la prod, même par accident.
 *
 * IDEMPOTENCE
 *   Le script utilise `upsert` partout où c'est possible. Une exécution
 *   répétée ne crée pas de doublons mais peut mettre à jour les annotations.
 *   Pour repartir d'un état propre, exécute d'abord `npm run seed:cleanup`.
 *
 * Voir aussi :
 *   - GOUVERNANCE_EDITORIALE.md v1.1 §3.2 (rendu post-it côté élève)
 *   - docs/seed-test-data.md (mode d'emploi détaillé)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { assertPreviewOnly, TEST_DATA } from "./guard";

type SeededIds = {
  organizationId: string;
  profUserId: string;
  classId: string;
  joinCode: string;
  eleve1UserId: string;
  eleve2UserId: string;
  annotationIds: { private: string; class: string; school: string };
};

async function findOrCreateUser(
  admin: SupabaseClient,
  email: string,
  metadata: Record<string, unknown>,
): Promise<string> {
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) throw listErr;
  const existing = list?.users.find((u) => u.email === email);
  if (existing) {
    console.log(`[seed] auth.users existant : ${email} → ${existing.id}`);
    return existing.id;
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser(
    {
      email,
      password: TEST_DATA.password,
      email_confirm: true,
      user_metadata: metadata,
    },
  );
  if (createErr || !created?.user) {
    throw createErr ?? new Error(`Impossible de créer le user ${email}`);
  }
  console.log(`[seed] auth.users créé : ${email} → ${created.user.id}`);
  return created.user.id;
}

async function findOrgId(admin: SupabaseClient): Promise<string> {
  const { data, error } = await admin
    .from("organizations")
    .select("id")
    .eq("code", TEST_DATA.organizationCode)
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) {
    throw new Error(
      `[seed] Organisation introuvable (code=${TEST_DATA.organizationCode}). Applique la migration P0.2 sur le projet preview avant de seed.`,
    );
  }
  return data.id;
}

async function ensureMembership(
  admin: SupabaseClient,
  userId: string,
  organizationId: string,
): Promise<void> {
  const { error } = await admin
    .from("memberships")
    .upsert(
      {
        user_id: userId,
        organization_id: organizationId,
        role: "teacher",
        status: "active",
      },
      { onConflict: "user_id,organization_id" },
    );
  if (error) throw error;
}

async function ensureClass(
  admin: SupabaseClient,
  organizationId: string,
  teacherUserId: string,
): Promise<{ classId: string; joinCode: string }> {
  // Si une classe de test existe déjà pour ce prof avec ce nom, on la réutilise
  const { data: existing, error: existErr } = await admin
    .from("classes")
    .select("id, join_code")
    .eq("teacher_user_id", teacherUserId)
    .eq("name", TEST_DATA.classDisplayName)
    .maybeSingle();
  if (existErr) throw existErr;
  if (existing?.id) {
    console.log(
      `[seed] classe existante : ${TEST_DATA.classDisplayName} → ${existing.id} (code=${existing.join_code})`,
    );
    return { classId: existing.id, joinCode: existing.join_code };
  }

  const { data: codeRpc, error: codeErr } = await admin.rpc(
    "generate_class_join_code",
  );
  if (codeErr || !codeRpc) {
    throw codeErr ?? new Error("RPC generate_class_join_code a retourné vide");
  }
  const joinCode =
    typeof codeRpc === "string" ? codeRpc : (codeRpc as { code?: string }).code;
  if (!joinCode) throw new Error("join_code invalide retourné par RPC");

  const { data: created, error: createErr } = await admin
    .from("classes")
    .insert({
      organization_id: organizationId,
      teacher_user_id: teacherUserId,
      name: TEST_DATA.classDisplayName,
      school_year: "2026-2027",
      join_code: joinCode,
    })
    .select("id, join_code")
    .single();
  if (createErr || !created) {
    throw createErr ?? new Error("INSERT classe a échoué");
  }
  console.log(`[seed] classe créée : ${created.id} (code=${created.join_code})`);
  return { classId: created.id, joinCode: created.join_code };
}

async function ensureEnrollment(
  admin: SupabaseClient,
  classId: string,
  studentUserId: string,
  firstName: string,
  lastName: string,
): Promise<void> {
  const { error: profileErr } = await admin
    .from("student_profiles")
    .upsert(
      { user_id: studentUserId, first_name: firstName, last_name: lastName },
      { onConflict: "user_id" },
    );
  if (profileErr) throw profileErr;

  const { error: enrollErr } = await admin
    .from("class_enrollments")
    .upsert(
      { class_id: classId, student_user_id: studentUserId },
      { onConflict: "class_id,student_user_id" },
    );
  if (enrollErr) throw enrollErr;
}

async function ensureAnnotation(
  admin: SupabaseClient,
  organizationId: string,
  authorUserId: string,
  classId: string,
  scope: "private" | "class" | "school",
  notes: string,
): Promise<string> {
  // Idempotence par (author_user_id, exercise_slug, locale, visibility_scope) —
  // si une annotation existe déjà pour ce trio, on la met à jour.
  const { data: existing } = await admin
    .from("teacher_annotations")
    .select("id")
    .eq("author_user_id", authorUserId)
    .eq("exercise_slug", TEST_DATA.exerciseSlug)
    .eq("locale", TEST_DATA.locale)
    .eq("visibility_scope", scope)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await admin
      .from("teacher_annotations")
      .update({ content: { notes } })
      .eq("id", existing.id);
    if (error) throw error;
    console.log(`[seed] annotation existante mise à jour : ${scope} → ${existing.id}`);
    return existing.id;
  }

  const { data: inserted, error } = await admin
    .from("teacher_annotations")
    .insert({
      organization_id: organizationId,
      author_user_id: authorUserId,
      exercise_slug: TEST_DATA.exerciseSlug,
      locale: TEST_DATA.locale,
      content: { notes },
      visibility_scope: scope,
      scope_id: scope === "class" ? classId : null,
    })
    .select("id")
    .single();
  if (error || !inserted) {
    throw error ?? new Error(`INSERT annotation ${scope} a échoué`);
  }
  console.log(`[seed] annotation créée : ${scope} → ${inserted.id}`);
  return inserted.id;
}

async function seed(): Promise<SeededIds> {
  const { url, serviceRoleKey } = assertPreviewOnly();
  console.log(`[seed] Cible Supabase : ${url}`);

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const organizationId = await findOrgId(admin);
  console.log(`[seed] organisation Tazieff : ${organizationId}`);

  const profUserId = await findOrCreateUser(admin, TEST_DATA.emails.prof, {
    role: "teacher",
    display_name: "Prof Test",
  });
  await ensureMembership(admin, profUserId, organizationId);
  console.log("[seed] membership prof OK");

  const { classId, joinCode } = await ensureClass(admin, organizationId, profUserId);

  const eleve1UserId = await findOrCreateUser(admin, TEST_DATA.emails.eleve1, {
    role: "student",
    display_name: "Élève Un",
  });
  await ensureEnrollment(admin, classId, eleve1UserId, "Élève", "Un");

  const eleve2UserId = await findOrCreateUser(admin, TEST_DATA.emails.eleve2, {
    role: "student",
    display_name: "Élève Deux",
  });
  await ensureEnrollment(admin, classId, eleve2UserId, "Élève", "Deux");
  console.log("[seed] 2 élèves + profiles + enrollments OK");

  const annotationIds = {
    private: await ensureAnnotation(
      admin,
      organizationId,
      profUserId,
      classId,
      "private",
      TEST_DATA.annotations[0].notes,
    ),
    class: await ensureAnnotation(
      admin,
      organizationId,
      profUserId,
      classId,
      "class",
      TEST_DATA.annotations[1].notes,
    ),
    school: await ensureAnnotation(
      admin,
      organizationId,
      profUserId,
      classId,
      "school",
      TEST_DATA.annotations[2].notes,
    ),
  };
  console.log("[seed] 3 annotations (private/class/school) OK");

  return {
    organizationId,
    profUserId,
    classId,
    joinCode,
    eleve1UserId,
    eleve2UserId,
    annotationIds,
  };
}

async function main(): Promise<void> {
  const ids = await seed();
  console.log("[seed] ✅ Terminé.");
  console.log(JSON.stringify(ids, null, 2));
}

main().catch((err) => {
  console.error("[seed] ❌ ERREUR :", err);
  process.exit(1);
});
