import { NextResponse } from "next/server";
import { ExerciseFrontmatterSchema } from "@/lib/content/schema";
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

export async function POST(request: Request) {
  let payload: LiveExercisePayload | null = null;
  try {
    payload = (await request.json()) as LiveExercisePayload;
  } catch {
    payload = null;
  }

  if (!payload) {
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  const { pin, slug, locale, dataJson } = payload;
  if (!pin || !slug || !locale || !dataJson) {
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
  }

  if (pin !== process.env.TEACHER_PIN) {
    return NextResponse.json({ error: "PIN invalide." }, { status: 401 });
  }

  const parsedFrontmatter = ExerciseFrontmatterSchema.safeParse({
    ...(dataJson.frontmatter as Record<string, unknown>),
    slug,
  });
  if (!parsedFrontmatter.success) {
    return NextResponse.json({ error: "Frontmatter invalide." }, { status: 400 });
  }

  const content = typeof dataJson.content === "string" ? dataJson.content : "";
  if (!content.trim()) {
    return NextResponse.json({ error: "Contenu requis." }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
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
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug,locale" },
    );

  if (error) {
    return NextResponse.json({ error: "Erreur d'enregistrement." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
