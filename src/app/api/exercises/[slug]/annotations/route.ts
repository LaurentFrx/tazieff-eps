// Sprint E.4 (29 avril 2026) — Lecture des annotations prof côté élève.
//
//   GET /api/exercises/[slug]/annotations?locale=fr
//   → { annotations: [{ id, content, scope, section_target,
//       author_display_name, created_at }] }
//
// Conformité GOUVERNANCE_EDITORIALE.md v1.1 §3.2 :
//   - Affichage post-it côté élève AVEC attribution explicite (display_name)
//   - RLS gère la portée (private/class/school) — voir policy
//     `ta_select_auth_or_school_or_class` posée par la migration E.2.1.
//
// Sécurité :
//   - Anonyme → 200 avec array vide (pas de leak, pas d'erreur visible côté UI)
//   - Authentifié → laissé à RLS (l'élève ne voit que les annotations de
//     son organisation/classe pour les scopes school/class)
//   - Le scope `private` du prof n'est jamais retourné côté élève (RLS
//     filtre sur author_user_id pour cette portée)
//
// Pas de cache HTTP : un prof peut annoter à tout moment, l'élève doit
// voir au prochain reload (D4 — Realtime reporté à un sprint dédié).

import { NextRequest, NextResponse } from "next/server";

import { jsonError } from "@/lib/api/responses";
import { fetchStudentAnnotations } from "@/lib/live/student-annotations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOCALES = ["fr", "en", "es"] as const;
type Locale = (typeof LOCALES)[number];
function isLocale(x: string): x is Locale {
  return (LOCALES as readonly string[]).includes(x);
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  if (!slug || slug.trim().length === 0) {
    return jsonError(400, "validation", { slug: ["requis"] });
  }

  const rawLocale = request.nextUrl.searchParams.get("locale") ?? "fr";
  if (!isLocale(rawLocale)) {
    return jsonError(400, "validation", {
      locale: ["doit être 'fr' | 'en' | 'es'"],
    });
  }

  const supabase = await createSupabaseServerClient();
  const annotations = await fetchStudentAnnotations(supabase, slug, rawLocale);

  return NextResponse.json(
    { annotations },
    { headers: { "Cache-Control": "no-store" } },
  );
}
