// Phase P0.1 + P0.4 — POST + DELETE /api/teacher/live-exercise
//
// Verrouillage admin : routes gatées par requireAdmin().
//
// P0.4 — La table `live_exercises` a désormais 8 colonnes (avec
// author_user_id, created_at, created_by, deleted_at) et une matrice
// RLS conforme. Le DELETE physique est transformé en soft-delete par
// trigger. Les écritures sont auditées automatiquement.
//
// L'upsert est ici réécrit en SELECT + INSERT|UPDATE explicite afin de
// préserver `author_user_id` et `created_by` originaux sur les UPDATE
// (ne jamais ré-attribuer la création à l'éditeur en cours).
//
// Référence : GOUVERNANCE_EDITORIALE.md §3.1, §7.

import { NextResponse } from "next/server";
import { ExerciseFrontmatterSchema } from "@/lib/content/schema";
import { splitMarkdownSections } from "@/lib/live/patch";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin, AuthError } from "@/lib/auth/requireAdmin";

export const runtime = "nodejs";

type LiveExercisePayload = {
  slug?: string;
  locale?: string;
  dataJson?: {
    frontmatter?: unknown;
    content?: string;
    status?: "draft" | "ready";
  };
};

type LiveStats = {
  sections: number | null;
  blocks: number | null;
};

type ErrorPayload = {
  ok: false;
  code: string;
  message: string;
};

const LEVEL_VALUES = new Set(["debutant", "intermediaire", "avance"]);

function toCleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => toCleanString(item)).filter(Boolean);
}

function toThemeArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => Number(item))
    .filter((item) => item === 1 || item === 2 || item === 3) as Array<1 | 2 | 3>;
}

function getLiveStats(content: string): LiveStats {
  if (!content.trim()) {
    return { sections: null, blocks: null };
  }
  const markdown = splitMarkdownSections(content);
  const sections = markdown.sections.length;
  const blocks = sections + (markdown.intro ? 1 : 0);
  return { sections, blocks };
}

function logLiveError({
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
    `[live-save] ERROR slug=${slug ?? "unknown"} locale=${locale ?? "unknown"} code=${
      code ?? "unknown"
    } status=${status} msg=${msg}`,
  );
}

function jsonError(code: string, message: string, status: number) {
  return NextResponse.json({ ok: false, code, message } satisfies ErrorPayload, {
    status,
  });
}

function authErrorResponse(err: AuthError, slug?: string, locale?: string) {
  logLiveError({
    slug,
    locale,
    status: err.status,
    code: err.code,
    msg: err.code === "unauthenticated" ? "Authentification requise." : "Accès refusé.",
  });
  return jsonError(
    err.code,
    err.code === "unauthenticated" ? "Authentification requise." : "Accès refusé.",
    err.status,
  );
}

export async function POST(request: Request) {
  let payload: LiveExercisePayload | null = null;
  try {
    payload = (await request.json()) as LiveExercisePayload;
  } catch {
    payload = null;
  }

  if (!payload) {
    logLiveError({
      status: 400,
      code: "invalid_payload",
      msg: "Payload invalide.",
    });
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  const { slug, locale, dataJson } = payload;
  if (!slug || !locale || !dataJson) {
    logLiveError({
      slug,
      locale,
      status: 400,
      code: "missing_fields",
      msg: "Champs requis manquants.",
    });
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // P0.1 : garde admin authentifié (remplace le check PIN).
  let user;
  try {
    const result = await requireAdmin(supabase);
    user = result.user;
  } catch (err) {
    if (err instanceof AuthError) {
      return authErrorResponse(err, slug, locale);
    }
    logLiveError({
      slug,
      locale,
      status: 500,
      code: "auth_check_failed",
      msg: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  const rawFrontmatter = (dataJson.frontmatter as Record<string, unknown>) ?? {};
  const title = toCleanString(rawFrontmatter.title);
  const tags = toStringArray(rawFrontmatter.tags);
  const muscles = toStringArray(rawFrontmatter.muscles);
  const themeCompatibility = toThemeArray(rawFrontmatter.themeCompatibility);
  const levelRaw = toCleanString(rawFrontmatter.level);
  const level = LEVEL_VALUES.has(levelRaw)
    ? (levelRaw as "debutant" | "intermediaire" | "avance")
    : undefined;
  const equipment = toStringArray(rawFrontmatter.equipment);
  const media = toCleanString(rawFrontmatter.media);
  const content = typeof dataJson.content === "string" ? dataJson.content : "";
  const hasRequired =
    Boolean(title) &&
    tags.length > 0 &&
    muscles.length > 0 &&
    themeCompatibility.length > 0;
  const status: "draft" | "ready" = hasRequired ? "ready" : "draft";
  const normalizedFrontmatter = {
    title,
    slug,
    tags,
    level,
    themeCompatibility,
    muscles,
    equipment: equipment.length > 0 ? equipment : undefined,
    media: media || undefined,
  };
  const parsedFrontmatter = ExerciseFrontmatterSchema.safeParse(normalizedFrontmatter);
  if (status === "ready" && !parsedFrontmatter.success) {
    logLiveError({
      slug,
      locale,
      status: 400,
      code: "frontmatter_invalid",
      msg: "Frontmatter invalide.",
    });
    return NextResponse.json({ error: "Frontmatter invalide." }, { status: 400 });
  }

  const updatedAt = new Date().toISOString();
  const stats = getLiveStats(content);
  void stats;

  const dataJsonPayload = {
    frontmatter: parsedFrontmatter.success
      ? parsedFrontmatter.data
      : normalizedFrontmatter,
    content,
    status,
  };

  // P0.4 : SELECT préalable pour distinguer INSERT (avec auteur) et
  // UPDATE (sans toucher author_user_id / created_by, qui restent
  // ceux du créateur originel).
  const { data: existing, error: existingError } = await supabase
    .from("live_exercises")
    .select("slug")
    .eq("slug", slug)
    .eq("locale", locale)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingError) {
    logLiveError({
      slug,
      locale,
      status: 500,
      code: existingError.code ?? "supabase_error",
      msg: existingError.message ?? "Erreur de lecture.",
    });
    return NextResponse.json({ error: "Erreur d'enregistrement." }, { status: 500 });
  }

  const writeError = existing
    ? (
        await supabase
          .from("live_exercises")
          .update({
            data_json: dataJsonPayload,
            updated_at: updatedAt,
          })
          .eq("slug", slug)
          .eq("locale", locale)
      ).error
    : (
        await supabase
          .from("live_exercises")
          .insert({
            slug,
            locale,
            data_json: dataJsonPayload,
            updated_at: updatedAt,
            author_user_id: user.id,
            created_by: user.id,
          })
      ).error;

  if (writeError) {
    if (writeError.code === "42501") {
      return jsonError("rls_denied", "Accès refusé.", 403);
    }
    logLiveError({
      slug,
      locale,
      status: 500,
      code: writeError.code ?? "supabase_error",
      msg: writeError.message ?? "Erreur d'enregistrement.",
    });
    return NextResponse.json({ error: "Erreur d'enregistrement." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim() ?? "";
  const locale = searchParams.get("locale")?.trim() ?? "";

  if (!slug || !locale) {
    return jsonError("missing_fields", "Champs requis manquants.", 400);
  }

  const supabase = await createSupabaseServerClient();

  try {
    await requireAdmin(supabase);
  } catch (err) {
    if (err instanceof AuthError) {
      return authErrorResponse(err, slug, locale);
    }
    return jsonError("internal", "Erreur interne.", 500);
  }

  const { error } = await supabase
    .from("live_exercises")
    .delete()
    .eq("slug", slug)
    .eq("locale", locale);

  if (error) {
    if (error.code === "42501") {
      return jsonError("rls_denied", "Accès refusé.", 403);
    }
    return jsonError("delete_failed", "Erreur de suppression.", 500);
  }

  return NextResponse.json({ ok: true });
}
