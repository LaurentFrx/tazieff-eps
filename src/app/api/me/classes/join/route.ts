// Sprint E1 — POST /api/me/classes/join
//
// Inscrit l'utilisateur courant (élève) dans une classe via son code de
// classe. Crée si nécessaire :
//   1. Un compte anonyme Supabase (signInAnonymously) si l'utilisateur n'en
//      a pas encore (devrait déjà être le cas via AuthProvider côté élève).
//   2. Un student_profiles (prénom + nom).
// Puis appelle la fonction RPC `join_class_with_code`.
//
// Erreurs typées (français) :
//   - 400 validation : champs invalides
//   - 401 unauthenticated : pas de session et signInAnonymously a échoué
//   - 404 code_not_found : code inconnu (RPC lève "Code invalide ou expiré")
//   - 409 already_enrolled : pré-check, l'élève est déjà inscrit dans la
//     classe correspondant à ce code
//   - 500 join_failed : autre erreur RPC
//
// Référence : GOUVERNANCE_EDITORIALE.md §2.4 (rôle student), §3.3.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BodySchema = z.object({
  first_name: z
    .string()
    .min(1)
    .max(60)
    .transform((s) => s.trim())
    .refine((s) => s.length >= 1 && s.length <= 60, {
      message: "Prénom : 1 à 60 caractères",
    }),
  last_name: z
    .string()
    .min(1)
    .max(60)
    .transform((s) => s.trim())
    .refine((s) => s.length >= 1 && s.length <= 60, {
      message: "Nom : 1 à 60 caractères",
    }),
  code: z
    .string()
    .min(4)
    .max(64)
    .transform((s) => s.trim().toUpperCase()),
});

type ErrorBody = {
  error:
    | "validation"
    | "unauthenticated"
    | "code_not_found"
    | "already_enrolled"
    | "join_failed";
  message: string;
  details?: unknown;
};

function jsonError(status: number, body: ErrorBody) {
  return NextResponse.json(body, { status });
}

export async function POST(request: NextRequest) {
  let raw: unknown = null;
  try {
    raw = await request.json();
  } catch {
    raw = null;
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, {
      error: "validation",
      message: "Champs invalides.",
      details: parsed.error.flatten(),
    });
  }
  const { first_name, last_name, code } = parsed.data;

  const supabase = await createSupabaseServerClient();

  // 1. Récupère la session courante. Si pas de user, tente un sign-in anonyme.
  let {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { data: anonData, error: anonError } =
      await supabase.auth.signInAnonymously();
    if (anonError || !anonData.user) {
      console.error(
        "[me/classes/join] signInAnonymously failed:",
        anonError?.message ?? "no user returned",
      );
      return jsonError(401, {
        error: "unauthenticated",
        message:
          "Impossible de créer une session anonyme. Recharge la page et réessaie.",
      });
    }
    user = anonData.user;
  }

  // 2. Upsert student_profiles
  const { error: upsertError } = await supabase
    .from("student_profiles")
    .upsert(
      {
        user_id: user.id,
        first_name,
        last_name,
      },
      { onConflict: "user_id" },
    );

  if (upsertError) {
    console.error(
      "[me/classes/join] student_profiles upsert error:",
      upsertError.message,
    );
    return jsonError(500, {
      error: "join_failed",
      message: "Une erreur est survenue, réessaie dans un instant.",
    });
  }

  // 3. Pré-check : l'utilisateur est-il déjà inscrit dans la classe portant
  //    ce code ? (la fonction RPC fait ON CONFLICT DO NOTHING, donc une
  //    seconde inscription est silencieuse côté DB et on n'a pas d'autre
  //    moyen de détecter la duplication.)
  const { data: existingEnrollment, error: precheckError } = await supabase
    .from("class_enrollments")
    .select("class_id, classes!inner(join_code)")
    .eq("student_user_id", user.id)
    .eq("classes.join_code", code)
    .maybeSingle();

  if (precheckError) {
    // Erreur non bloquante : on tente quand même le RPC. Mais si c'est une
    // 42P01 ou autre erreur infra, on log et on passe.
    console.warn(
      "[me/classes/join] precheck error (non blocking):",
      precheckError.message,
    );
  }

  if (existingEnrollment) {
    return jsonError(409, {
      error: "already_enrolled",
      message: "Tu es déjà dans cette classe.",
    });
  }

  // 4. Appelle la RPC join_class_with_code
  const { data: classId, error: rpcError } = await supabase.rpc(
    "join_class_with_code",
    { p_code: code },
  );

  if (rpcError) {
    const msg = rpcError.message ?? "";
    // Le code SQL "Code invalide ou expiré" est levé par RAISE EXCEPTION.
    if (/code\s+invalide\s+ou\s+expir/i.test(msg)) {
      return jsonError(404, {
        error: "code_not_found",
        message:
          "Code de classe inconnu. Vérifie auprès de ton enseignant.",
      });
    }
    if (/non\s+authentifi/i.test(msg)) {
      return jsonError(401, {
        error: "unauthenticated",
        message:
          "Session expirée. Recharge la page et réessaie.",
      });
    }
    console.error("[me/classes/join] RPC error:", msg, rpcError.code);
    return jsonError(500, {
      error: "join_failed",
      message: "Une erreur est survenue, réessaie dans un instant.",
    });
  }

  if (!classId) {
    return jsonError(500, {
      error: "join_failed",
      message: "Une erreur est survenue, réessaie dans un instant.",
    });
  }

  // 5. Recharge les détails de la classe pour la réponse
  const { data: classRow } = await supabase
    .from("classes")
    .select(
      `
      id,
      name,
      school_year,
      organizations!inner ( name )
      `,
    )
    .eq("id", classId)
    .maybeSingle();

  if (!classRow) {
    // L'inscription a réussi mais la lecture échoue (timing RLS rare).
    // On renvoie un succès minimal.
    return NextResponse.json({
      class: { id: classId, name: "", school_year: null },
      teacher: { name: null },
      organization: { name: "" },
    });
  }

  const orgRaw = classRow.organizations as
    | { name: string }
    | { name: string }[]
    | null;
  const org = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;

  return NextResponse.json({
    class: {
      id: classRow.id,
      name: classRow.name,
      school_year: classRow.school_year,
    },
    teacher: { name: null },
    organization: { name: org?.name ?? "" },
  });
}
