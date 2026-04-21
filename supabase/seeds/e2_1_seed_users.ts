/**
 * Phase E.2.1 — Script de seed des auth.users + données dépendantes
 *
 * Usage :
 *   pnpm tsx supabase/seeds/e2_1_seed_users.ts
 *   # ou : npx tsx supabase/seeds/e2_1_seed_users.ts
 *
 * Prérequis :
 *   - .env.local avec SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL)
 *     et SUPABASE_SERVICE_ROLE_KEY
 *   - migration e2_1_teacher_annotations_foundation.sql appliquée
 *   - e2_1_dev_seed.sql exécuté (pour les organizations)
 *
 * Effets :
 *   - Crée 3 profs fictifs dans auth.users (emails @ac-test.local et
 *     @test.local) — idempotent via getUserByEmail.
 *   - Écrit supabase/seeds/dev-credentials.json (gitignored) avec les
 *     credentials et UUIDs — utile pour tests manuels.
 *   - Crée memberships, 2 classes par prof, un exemple d'élève fictif
 *     inscrit à une classe, et 3 annotations (une par scope).
 *
 * Garde-fou :
 *   - Refuse de s'exécuter si NODE_ENV === 'production'.
 *   - Refuse de s'exécuter si le client Supabase n'est pas configuré.
 *
 * Idempotence :
 *   - Tous les INSERTs utilisent `on conflict do nothing` côté base, ou un
 *     check préalable côté script pour les auth.users.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ---------- Guard rails ----------
if (process.env.NODE_ENV === "production") {
  console.error("[seed] Refus : NODE_ENV=production. Script dev-only.");
  process.exit(1);
}

// ---------- Load .env.local ----------
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const envPath = resolve(repoRoot, ".env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match) {
      const [, key, rawValue] = match;
      if (!process.env[key]) {
        // Strip surrounding quotes if present
        const value = rawValue.replace(/^(['"])(.*)\1$/, "$2");
        process.env[key] = value;
      }
    }
  }
}

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    "[seed] SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local",
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------- Constantes du seed ----------
const ORG_IDS = {
  tazieff: "00000000-0000-0000-0001-000000000001",
  pyrenees: "00000000-0000-0000-0001-000000000002",
};

// Mots de passe locaux (uniquement .local → jamais envoyés comme vrais emails)
const DEV_PASSWORD = "Tazieff_E2_1_dev!";

const TEACHERS = [
  {
    email: "prof.alpha@ac-test.local",
    password: DEV_PASSWORD,
    display_name: "Prof Alpha",
    orgs: [{ id: ORG_IDS.tazieff, role: "teacher" }],
  },
  {
    email: "prof.beta@ac-test.local",
    password: DEV_PASSWORD,
    display_name: "Prof Bêta",
    orgs: [
      { id: ORG_IDS.tazieff, role: "teacher" },
      { id: ORG_IDS.pyrenees, role: "teacher" },
    ],
  },
  {
    email: "prof.gamma@ac-test.local",
    password: DEV_PASSWORD,
    display_name: "Prof Gamma (org_admin)",
    orgs: [{ id: ORG_IDS.pyrenees, role: "org_admin" }],
  },
] as const;

const STUDENTS = [
  {
    email: "eleve.demo@test.local",
    password: DEV_PASSWORD,
    display_name: "Élève Démo",
  },
] as const;

type CreatedUser = {
  id: string;
  email: string;
  password: string;
  display_name: string;
  kind: "teacher" | "student";
};

// ---------- Helpers ----------
async function upsertUser(
  email: string,
  password: string,
  metadata: Record<string, unknown>,
): Promise<string> {
  // Recherche par email : si trouvé, on reprend l'id existant
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) throw listErr;
  const existing = list?.users.find((u) => u.email === email);
  if (existing) {
    console.log(`[seed] auth.users OK (existant) : ${email} → ${existing.id}`);
    return existing.id;
  }
  const { data: created, error: createErr } = await admin.auth.admin.createUser(
    {
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    },
  );
  if (createErr || !created?.user) throw createErr ?? new Error("createUser failed");
  console.log(`[seed] auth.users créé : ${email} → ${created.user.id}`);
  return created.user.id;
}

async function upsertMembership(
  userId: string,
  orgId: string,
  role: string,
): Promise<void> {
  const { error } = await admin
    .from("memberships")
    .upsert(
      { user_id: userId, organization_id: orgId, role, status: "active" },
      { onConflict: "user_id,organization_id" },
    );
  if (error) throw error;
}

async function upsertClass(
  classId: string,
  orgId: string,
  teacherId: string,
  name: string,
  joinCode: string,
  schoolYear: string,
): Promise<void> {
  const { error } = await admin
    .from("classes")
    .upsert(
      {
        id: classId,
        organization_id: orgId,
        teacher_user_id: teacherId,
        name,
        school_year: schoolYear,
        join_code: joinCode,
      },
      { onConflict: "id" },
    );
  if (error) throw error;
}

async function upsertEnrollment(
  classId: string,
  studentId: string,
): Promise<void> {
  const { error } = await admin
    .from("class_enrollments")
    .upsert(
      { class_id: classId, student_user_id: studentId },
      { onConflict: "class_id,student_user_id" },
    );
  if (error) throw error;
}

async function upsertAnnotation(
  id: string,
  orgId: string,
  authorId: string,
  exerciseSlug: string,
  scope: "private" | "class" | "school",
  scopeId: string | null,
  contentText: string,
): Promise<void> {
  const { error } = await admin
    .from("teacher_annotations")
    .upsert(
      {
        id,
        organization_id: orgId,
        author_user_id: authorId,
        exercise_slug: exerciseSlug,
        locale: "fr",
        content: { text: contentText, version: 1 },
        visibility_scope: scope,
        scope_id: scopeId,
      },
      { onConflict: "id" },
    );
  if (error) throw error;
}

// ---------- Exécution ----------
async function main(): Promise<void> {
  console.log("[seed] Démarrage du seed E.2.1");

  const created: CreatedUser[] = [];

  // 1) auth.users profs
  for (const t of TEACHERS) {
    const id = await upsertUser(t.email, t.password, {
      display_name: t.display_name,
      role: "teacher",
    });
    created.push({
      id,
      email: t.email,
      password: t.password,
      display_name: t.display_name,
      kind: "teacher",
    });
  }

  // 2) auth.users élèves
  for (const s of STUDENTS) {
    const id = await upsertUser(s.email, s.password, {
      display_name: s.display_name,
      role: "student",
    });
    created.push({
      id,
      email: s.email,
      password: s.password,
      display_name: s.display_name,
      kind: "student",
    });
  }

  const teacherAlpha = created.find((u) => u.email === "prof.alpha@ac-test.local")!;
  const teacherBeta = created.find((u) => u.email === "prof.beta@ac-test.local")!;
  const teacherGamma = created.find((u) => u.email === "prof.gamma@ac-test.local")!;
  const studentDemo = created.find((u) => u.email === "eleve.demo@test.local")!;

  // 3) memberships
  for (const t of TEACHERS) {
    const user = created.find((u) => u.email === t.email)!;
    for (const org of t.orgs) {
      await upsertMembership(user.id, org.id, org.role);
    }
  }
  console.log("[seed] memberships OK");

  // 4) classes (2 par prof, sauf gamma qui est org_admin)
  const CLASSES = {
    alpha1: "00000000-0000-0000-0001-100000000001",
    alpha2: "00000000-0000-0000-0001-100000000002",
    beta1: "00000000-0000-0000-0001-100000000003",
    beta2: "00000000-0000-0000-0001-100000000004",
  };

  await upsertClass(
    CLASSES.alpha1,
    ORG_IDS.tazieff,
    teacherAlpha.id,
    "2nde 3 — Tazieff",
    "ALPHA23",
    "2026-2027",
  );
  await upsertClass(
    CLASSES.alpha2,
    ORG_IDS.tazieff,
    teacherAlpha.id,
    "1ère 5 — Tazieff",
    "ALPHA15",
    "2026-2027",
  );
  await upsertClass(
    CLASSES.beta1,
    ORG_IDS.tazieff,
    teacherBeta.id,
    "Term 2 — Tazieff",
    "BETAT2",
    "2026-2027",
  );
  await upsertClass(
    CLASSES.beta2,
    ORG_IDS.pyrenees,
    teacherBeta.id,
    "2nde 1 — Pyrénées",
    "BETA21",
    "2026-2027",
  );
  console.log("[seed] classes OK (4 classes, 2 orgs)");

  // 5) enrollment : élève démo dans la classe alpha1
  await upsertEnrollment(CLASSES.alpha1, studentDemo.id);
  console.log("[seed] class_enrollments OK");

  // 6) annotations — une par scope
  await upsertAnnotation(
    "00000000-0000-0000-0001-200000000001",
    ORG_IDS.tazieff,
    teacherAlpha.id,
    "s1-01",
    "private",
    null,
    "Brouillon privé — à retravailler sur l'alignement de la barre.",
  );
  await upsertAnnotation(
    "00000000-0000-0000-0001-200000000002",
    ORG_IDS.tazieff,
    teacherAlpha.id,
    "s1-01",
    "class",
    CLASSES.alpha1,
    "Focus 2nde 3 : tempo 3-0-1, 4 séries de 8 reps.",
  );
  await upsertAnnotation(
    "00000000-0000-0000-0001-200000000003",
    ORG_IDS.tazieff,
    teacherAlpha.id,
    "s2-03",
    "school",
    null,
    "Conseils établissement : enchaînement recommandé après échauffement.",
  );
  console.log("[seed] teacher_annotations OK (3 annotations, 3 scopes)");

  // 7) Dev credentials dump
  const credsPath = resolve(__dirname, "dev-credentials.json");
  writeFileSync(
    credsPath,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        note: "Fichier gitignored. Credentials dev uniquement. Emails .local non réels.",
        users: created,
        orgs: ORG_IDS,
        classes: CLASSES,
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`[seed] dev-credentials.json écrit : ${credsPath}`);

  console.log("[seed] Terminé avec succès.");
}

main().catch((err) => {
  console.error("[seed] ERREUR :", err);
  process.exit(1);
});
