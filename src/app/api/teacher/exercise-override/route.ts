import { NextResponse } from "next/server";
import type { ExercisePatch } from "@/lib/live/types";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

type OverrideStats = {
  version: string | null;
  sections: number | null;
  blocks: number | null;
};

type OverridePayload = {
  pin?: string;
  slug?: string;
  locale?: string;
  patchJson?: ExercisePatch;
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
  let payload: OverridePayload | null = null;
  try {
    payload = (await request.json()) as OverridePayload;
  } catch {
    payload = null;
  }

  if (!payload) {
    logOverrideError({
      status: 400,
      code: "invalid_payload",
      msg: "Payload invalide.",
    });
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  const { pin, slug, locale, patchJson } = payload;
  if (!pin || !slug || !locale || !patchJson) {
    logOverrideError({
      slug,
      locale,
      status: 400,
      code: "missing_fields",
      msg: "Champs requis manquants.",
    });
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
  }

  if (pin !== process.env.TEACHER_PIN) {
    logOverrideError({
      slug,
      locale,
      status: 401,
      code: "invalid_pin",
      msg: "PIN invalide.",
    });
    return NextResponse.json({ error: "PIN invalide." }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();
  const updatedAt = new Date().toISOString();
  const stats = getOverrideStats(patchJson);
  const { error } = await supabase
    .from("exercise_overrides")
    .upsert(
      {
        slug,
        locale,
        patch_json: patchJson,
        updated_at: updatedAt,
      },
      { onConflict: "slug,locale" },
    );

  if (error) {
    logOverrideError({
      slug,
      locale,
      status: 500,
      code: error.code ?? "supabase_error",
      msg: error.message ?? "Erreur d'enregistrement.",
    });
    return NextResponse.json({ error: "Erreur d'enregistrement." }, { status: 500 });
  }

  console.log(
    `[override-save] slug=${slug} locale=${locale} updated_at=${updatedAt} version=${
      stats.version ?? "unknown"
    } sections=${stats.sections ?? "unknown"} blocks=${stats.blocks ?? "unknown"}`,
  );

  return NextResponse.json({ ok: true });
}
