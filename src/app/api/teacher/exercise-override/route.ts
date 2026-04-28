// Phase P0.1 — POST /api/teacher/exercise-override
//
// Verrouillage admin : route gatée par requireAdmin() (super_admin / admin
// authentifiés). Le PIN est supprimé (était le mécanisme legacy).
//
// Le client utilisateur est utilisé (RLS active) au lieu du service client.
// Les colonnes author_user_id et created_by sont alimentées avec user.id
// (cf. policy `exercise_overrides_insert_admin` posée en P0.2 qui vérifie
// `author_user_id = auth.uid() AND created_by = auth.uid()`).
//
// Référence : GOUVERNANCE_EDITORIALE.md §3.1, §7. Skill gouvernance-editoriale.

import { NextResponse } from "next/server";
import { z } from "zod";
import type { ExercisePatch } from "@/lib/live/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin, AuthError } from "@/lib/auth/requireAdmin";

export const runtime = "nodejs";

const PayloadSchema = z.object({
  slug: z.string().trim().min(1),
  locale: z.string().trim().min(1),
  patchJson: z.unknown(),
});

type OverrideStats = {
  version: string | null;
  sections: number | null;
  blocks: number | null;
};

function getOverrideStats(patchJson: unknown): OverrideStats {
  if (!patchJson || typeof patchJson !== "object") {
    return { version: null, sections: null, blocks: null };
  }

  const candidate = patchJson as { version?: unknown; doc?: unknown; sections?: unknown };
  if (candidate.version === 2 && candidate.doc && typeof candidate.doc === "object") {
    const doc = candidate.doc as { sections?: unknown };
    if (Array.isArray(doc.sections)) {
      const sections = doc.sections.length;
      const blocks = doc.sections.reduce((total, section) => {
        if (!section || typeof section !== "object") {
          return total;
        }
        const blockList = (section as { blocks?: unknown }).blocks;
        return total + (Array.isArray(blockList) ? blockList.length : 0);
      }, 0);
      return { version: "2", sections, blocks };
    }
    return { version: "2", sections: null, blocks: null };
  }

  if (candidate.sections && typeof candidate.sections === "object") {
    const sectionCount = Object.keys(candidate.sections as Record<string, unknown>).length;
    return { version: "legacy", sections: sectionCount, blocks: sectionCount };
  }

  return { version: null, sections: null, blocks: null };
}

function logOverrideError({
  slug,
  locale,
  status,
  code,
  msg,
}: {
  slug?: string;
  locale?: string;
  status: number;
  code?: string;
  msg: string;
}) {
  console.error(
    `[override-save] ERROR slug=${slug ?? "unknown"} locale=${locale ?? "unknown"} code=${
      code ?? "unknown"
    } status=${status} msg=${msg}`,
  );
}

export async function POST(request: Request) {
  let raw: unknown = null;
  try {
    raw = await request.json();
  } catch {
    raw = null;
  }

  if (!raw) {
    logOverrideError({
      status: 400,
      code: "invalid_payload",
      msg: "Payload invalide.",
    });
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  const parsed = PayloadSchema.safeParse(raw);
  if (!parsed.success) {
    logOverrideError({
      status: 400,
      code: "missing_fields",
      msg: "Champs requis manquants.",
    });
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
  }
  const { slug, locale } = parsed.data;
  const patchJson = parsed.data.patchJson as ExercisePatch;

  const supabase = await createSupabaseServerClient();

  // P0.1 : garde admin authentifié (remplace le check PIN).
  let user;
  try {
    const result = await requireAdmin(supabase);
    user = result.user;
  } catch (err) {
    if (err instanceof AuthError) {
      logOverrideError({
        slug,
        locale,
        status: err.status,
        code: err.code,
        msg: err.code === "unauthenticated" ? "Authentification requise." : "Accès refusé.",
      });
      return NextResponse.json({ error: err.code }, { status: err.status });
    }
    logOverrideError({
      slug,
      locale,
      status: 500,
      code: "auth_check_failed",
      msg: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  const updatedAt = new Date().toISOString();
  const stats = getOverrideStats(patchJson);
  void stats;

  // Upsert avec traçabilité auteur (P0.2). Côté policy RLS :
  //   - INSERT : with_check exige author_user_id = auth.uid() ET created_by = auth.uid()
  //   - UPDATE : using/with_check exige is_admin() (un admin peut corriger un override d'un autre admin)
  // Pour qu'un upsert soit accepté quel que soit le chemin (insert ou update),
  // on alimente author_user_id et created_by sur l'INSERT initial.
  const { error } = await supabase
    .from("exercise_overrides")
    .upsert(
      {
        slug,
        locale,
        patch_json: patchJson,
        updated_at: updatedAt,
        author_user_id: user.id,
        created_by: user.id,
      },
      { onConflict: "slug,locale" },
    );

  if (error) {
    if (error.code === "42501") {
      logOverrideError({
        slug,
        locale,
        status: 403,
        code: "rls_denied",
        msg: error.message ?? "RLS denied.",
      });
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    logOverrideError({
      slug,
      locale,
      status: 500,
      code: error.code ?? "supabase_error",
      msg: error.message ?? "Erreur d'enregistrement.",
    });
    return NextResponse.json({ error: "Erreur d'enregistrement." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
