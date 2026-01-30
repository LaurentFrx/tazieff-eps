import { NextResponse } from "next/server";
import { ExerciseFrontmatterSchema } from "@/lib/content/schema";
import { splitMarkdownSections } from "@/lib/live/patch";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

type LiveExercisePayload = {
  pin?: string;
  slug?: string;
  locale?: string;
  dataJson?: {
    frontmatter?: unknown;
    content?: string;
  };
};

type LiveStats = {
  sections: number | null;
  blocks: number | null;
};

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

  const { pin, slug, locale, dataJson } = payload;
  if (!pin || !slug || !locale || !dataJson) {
    logLiveError({
      slug,
      locale,
      status: 400,
      code: "missing_fields",
      msg: "Champs requis manquants.",
    });
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
  }

  if (pin !== process.env.TEACHER_PIN) {
    logLiveError({
      slug,
      locale,
      status: 401,
      code: "invalid_pin",
      msg: "PIN invalide.",
    });
    return NextResponse.json({ error: "PIN invalide." }, { status: 401 });
  }

  const parsedFrontmatter = ExerciseFrontmatterSchema.safeParse({
    ...(dataJson.frontmatter as Record<string, unknown>),
    slug,
  });
  if (!parsedFrontmatter.success) {
    logLiveError({
      slug,
      locale,
      status: 400,
      code: "frontmatter_invalid",
      msg: "Frontmatter invalide.",
    });
    return NextResponse.json({ error: "Frontmatter invalide." }, { status: 400 });
  }

  const content = typeof dataJson.content === "string" ? dataJson.content : "";
  if (!content.trim()) {
    logLiveError({
      slug,
      locale,
      status: 400,
      code: "content_required",
      msg: "Contenu requis.",
    });
    return NextResponse.json({ error: "Contenu requis." }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const updatedAt = new Date().toISOString();
  const stats = getLiveStats(content);
  const { error } = await supabase
    .from("live_exercises")
    .upsert(
      {
        slug: parsedFrontmatter.data.slug,
        locale,
        data_json: {
          frontmatter: parsedFrontmatter.data,
          content,
        },
        updated_at: updatedAt,
      },
      { onConflict: "slug,locale" },
    );

  if (error) {
    logLiveError({
      slug,
      locale,
      status: 500,
      code: error.code ?? "supabase_error",
      msg: error.message ?? "Erreur d'enregistrement.",
    });
    return NextResponse.json({ error: "Erreur d'enregistrement." }, { status: 500 });
  }

  console.log(
    `[live-save] slug=${slug} locale=${locale} updated_at=${updatedAt} sections=${
      stats.sections ?? "unknown"
    } blocks=${stats.blocks ?? "unknown"}`,
  );

  return NextResponse.json({ ok: true });
}
