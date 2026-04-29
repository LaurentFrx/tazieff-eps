// Phase E.2.2 — API annotations prof (item).
//
//   PATCH  → modification partielle (auteur uniquement via RLS)
//   DELETE → SOFT delete (set deleted_at = now()), jamais physique
//
// Sécurité :
//   - auth.getUser() (401 sinon)
//   - RLS bloque non-auteur (403)
//   - Jamais de DELETE physique côté app — c'est la règle explicite
//     (soft delete via deleted_at, purge physique réservée à la RGPD
//     via un script admin séparé)

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UpdateAnnotationSchema } from "@/lib/validation/annotations";
import { jsonError } from "@/lib/api/responses";
import type { Database } from "@/types/database";

type AnnotationUpdate =
  Database["public"]["Tables"]["teacher_annotations"]["Update"];

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ensureUuid(id: string): boolean {
  return UUID_RE.test(id);
}

// --------- PATCH ---------

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!ensureUuid(id)) {
    return jsonError(400, "validation", { id: ["UUID attendu"] });
  }

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
  const parsed = UpdateAnnotationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "validation", parsed.error.flatten());
  }
  const input = parsed.data;

  // Construire l'update uniquement avec les champs fournis (typé strict via Database).
  const patch: AnnotationUpdate = {};
  if (input.exercise_version !== undefined)
    patch.exercise_version = input.exercise_version;
  if (input.content !== undefined) patch.content = input.content;
  if (input.visibility_scope !== undefined)
    patch.visibility_scope = input.visibility_scope;
  if (input.scope_id !== undefined) patch.scope_id = input.scope_id;
  if (input.needs_review !== undefined) patch.needs_review = input.needs_review;
  // Sprint E.4 — réancrage paragraphe possible (laisse null pour "general").
  if (input.section_target !== undefined)
    (patch as Record<string, unknown>).section_target = input.section_target;

  if (Object.keys(patch).length === 0) {
    return jsonError(400, "validation", {
      message: "Aucun champ modifiable fourni.",
    });
  }

  const { data, error } = await supabase
    .from("teacher_annotations")
    .update(patch)
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error) {
    if (error.code === "42501") {
      return jsonError(403, "forbidden");
    }
    if (error.code === "PGRST116") {
      // No row returned (either not found, deleted, or RLS blocked)
      return jsonError(404, "not_found");
    }
    if (error.code === "23514") {
      return jsonError(400, "validation", {
        message: "scope_id incohérent avec visibility_scope.",
      });
    }
    console.error("[annotation PATCH] supabase error:", error.code, error.message);
    return jsonError(500, "internal");
  }

  return NextResponse.json(data);
}

// --------- DELETE (soft) ---------

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!ensureUuid(id)) {
    return jsonError(400, "validation", { id: ["UUID attendu"] });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return jsonError(401, "unauthenticated");
  }

  // Soft delete : on met deleted_at à now(). RLS vérifie que l'utilisateur
  // est l'auteur (policy ta_update_author + ta_delete_author). On passe par
  // UPDATE plutôt que DELETE physique pour préserver l'historique.
  const { data, error } = await supabase
    .from("teacher_annotations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id, deleted_at")
    .single();

  if (error) {
    if (error.code === "42501") {
      return jsonError(403, "forbidden");
    }
    if (error.code === "PGRST116") {
      return jsonError(404, "not_found");
    }
    console.error("[annotation DELETE] supabase error:", error.code, error.message);
    return jsonError(500, "internal");
  }

  return NextResponse.json({ ok: true, id: data.id });
}
