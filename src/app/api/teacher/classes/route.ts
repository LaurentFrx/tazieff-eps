// Phase E.2.3.4 — POST /api/teacher/classes.
//
// Crée une nouvelle classe. L'utilisateur doit être membre actif de
// l'organisation cible (RLS + check explicite).
//
// Flow :
//   1. Auth check (401 sinon)
//   2. Validation Zod body
//   3. RPC generate_class_join_code() pour obtenir un code unique 6 chars
//   4. INSERT classes avec teacher_user_id = user.id forcé serveur
//   5. Retour de la row créée

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CreateClassSchema } from "@/lib/validation/classes";
import { jsonError } from "@/lib/api/responses";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return jsonError(401, "unauthenticated");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = CreateClassSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "validation", parsed.error.flatten());
  }
  const input = parsed.data;

  // Génération du code via la fonction DB (garantit unicité).
  const { data: codeData, error: codeError } = await supabase.rpc(
    "generate_class_join_code",
  );
  if (codeError || !codeData) {
    console.error("[classes POST] generate_class_join_code:", codeError?.message);
    return jsonError(500, "internal");
  }

  const insertPayload = {
    organization_id: input.organization_id,
    teacher_user_id: user.id,
    name: input.name,
    school_year: input.school_year ?? null,
    join_code: codeData as string,
  };

  const { data, error } = await supabase
    .from("classes")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    if (error.code === "42501") {
      return jsonError(403, "forbidden", {
        message:
          "Création refusée : vérifiez votre appartenance à l'organisation.",
      });
    }
    if (error.code === "23505") {
      // Conflit unicité (très rare avec generate_class_join_code). On
      // remonte 409 pour que le client puisse retenter.
      return jsonError(409, "conflict", {
        message: "Code en conflit, réessayez.",
      });
    }
    console.error("[classes POST] insert:", error.code, error.message);
    return jsonError(500, "internal");
  }

  return NextResponse.json(data, { status: 201 });
}
