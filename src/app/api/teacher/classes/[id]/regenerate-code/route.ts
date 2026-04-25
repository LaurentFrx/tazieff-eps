// Phase E.2.3.4 — POST /api/teacher/classes/[id]/regenerate-code.
//
// Régénère le join_code d'une classe (owner only). Invalide tous les
// QR codes précédemment partagés. À utiliser quand un code a fuité.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/api/responses";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError(401, "unauthenticated");

  // On vérifie explicitement l'ownership avant la RPC pour éviter une
  // génération de code inutile.
  const { data: klass, error: selErr } = await supabase
    .from("classes")
    .select("id, teacher_user_id")
    .eq("id", id)
    .maybeSingle();

  if (selErr) {
    console.error("[regen-code select]:", selErr.message);
    return jsonError(500, "internal");
  }
  if (!klass) return jsonError(404, "not_found");
  if (klass.teacher_user_id !== user.id) {
    return jsonError(403, "forbidden");
  }

  const { data: newCode, error: rpcErr } = await supabase.rpc(
    "generate_class_join_code",
  );
  if (rpcErr || !newCode) {
    console.error("[regen-code rpc]:", rpcErr?.message);
    return jsonError(500, "internal");
  }

  const { data, error } = await supabase
    .from("classes")
    .update({ join_code: newCode as string, join_code_expires_at: null })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("[regen-code update]:", error.code, error.message);
    return jsonError(500, "internal");
  }

  return NextResponse.json(data);
}
