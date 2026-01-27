import { NextResponse } from "next/server";
import type { ExercisePatch } from "@/lib/live/types";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

type OverridePayload = {
  pin?: string;
  slug?: string;
  locale?: string;
  patchJson?: ExercisePatch;
};

export async function POST(request: Request) {
  let payload: OverridePayload | null = null;
  try {
    payload = (await request.json()) as OverridePayload;
  } catch {
    payload = null;
  }

  if (!payload) {
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  const { pin, slug, locale, patchJson } = payload;
  if (!pin || !slug || !locale || !patchJson) {
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
  }

  if (pin !== process.env.TEACHER_PIN) {
    return NextResponse.json({ error: "PIN invalide." }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("exercise_overrides")
    .upsert(
      {
        slug,
        locale,
        patch_json: patchJson,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug,locale" },
    );

  if (error) {
    return NextResponse.json({ error: "Erreur d'enregistrement." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
