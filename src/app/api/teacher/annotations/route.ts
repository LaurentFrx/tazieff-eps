// Phase E.2.2 — API annotations prof (collection).
//
//   GET  ?slug=s1-01&locale=fr  → liste visible (RLS-filtrée) du user connecté
//   POST                        → crée une annotation (author_user_id forcé serveur)
//
// Sécurité :
//   - auth.getUser() obligatoire (401 sinon)
//   - author_user_id TOUJOURS = user.id — on ignore tout champ author_user_id
//     que le client tenterait de passer dans le body
//   - Le RLS DB couvre les cas organization_id incohérent (403)
//   - Soft delete : les rows avec deleted_at != null sont filtrés par la policy
//     SELECT (cf. migration E.2.1 `ta_select_auth_or_school_or_class`)

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CreateAnnotationSchema } from "@/lib/validation/annotations";
import { jsonError } from "@/lib/api/responses";

export const runtime = "nodejs";

const LOCALES = ["fr", "en", "es"] as const;
type Locale = (typeof LOCALES)[number];
function isLocale(x: string): x is Locale {
  return (LOCALES as readonly string[]).includes(x);
}

// --------- GET : liste ---------

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return jsonError(401, "unauthenticated");
  }

  const slug = request.nextUrl.searchParams.get("slug")?.trim() ?? "";
  const rawLocale = request.nextUrl.searchParams.get("locale") ?? "fr";

  if (!slug) {
    return jsonError(400, "validation", {
      slug: ["requis : ?slug=<exercise-slug>"],
    });
  }
  if (!isLocale(rawLocale)) {
    return jsonError(400, "validation", {
      locale: ["doit être 'fr' | 'en' | 'es'"],
    });
  }

  // RLS filtre automatiquement : l'utilisateur ne voit que ses annotations
  // (private + auteur), celles de son org en scope=school, et celles des
  // classes où il est inscrit en scope=class.
  const { data, error } = await supabase
    .from("teacher_annotations")
    .select("*")
    .eq("exercise_slug", slug)
    .eq("locale", rawLocale)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[annotations GET] supabase error:", error.message);
    return jsonError(500, "internal");
  }

  return NextResponse.json({ annotations: data ?? [] });
}

// --------- POST : création ---------

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
  const parsed = CreateAnnotationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "validation", parsed.error.flatten());
  }
  const input = parsed.data;

  const insertPayload = {
    organization_id: input.organization_id,
    author_user_id: user.id, // ← FORCÉ serveur, jamais lu du body
    exercise_slug: input.exercise_slug,
    locale: input.locale,
    exercise_version: input.exercise_version ?? null,
    content: input.content,
    visibility_scope: input.visibility_scope,
    scope_id: input.scope_id ?? null,
    // Sprint E.4 — ancrage paragraphe (cf. validation/annotations.ts).
    // Le type Database généré ne contient pas encore section_target ;
    // cast local en `any` jusqu'à régénération via `npm run db:types`.
    section_target: input.section_target ?? null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const annotationsTable = supabase.from("teacher_annotations") as any;
  const { data, error } = await annotationsTable
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    // Code PostgREST 42501 = RLS refuse (membership manquant, org_id invalide).
    if (error.code === "42501") {
      return jsonError(403, "forbidden", {
        message:
          "Insertion refusée : vérifiez votre appartenance à l'organisation.",
      });
    }
    if (error.code === "23514") {
      // Check constraint (scope_id_coherent) — doublon côté DB de notre Zod.
      return jsonError(400, "validation", {
        message: "scope_id incohérent avec visibility_scope.",
      });
    }
    console.error("[annotations POST] supabase error:", error.code, error.message);
    return jsonError(500, "internal");
  }

  return NextResponse.json(data, { status: 201 });
}
