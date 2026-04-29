// Sprint E.4 (29 avril 2026) — profil prof : saisie du display_name affiché
// aux élèves au-dessus de chaque post-it d'annotation.
//
//   GET  /api/me/profile
//     → { memberships: [{ organization_id, organization_name,
//         role, display_name }] }
//
//   PATCH /api/me/profile
//     body: { organization_id, display_name }
//     → { ok: true, membership: {…} }
//
// Sécurité : 401 si non-authentifié. Le user ne peut PATCH que ses propres
// memberships (RLS via memberships.user_id = auth.uid()).
//
// Conformité GOUVERNANCE_EDITORIALE.md v1.1 §3.2 :
//   « En-tête : icône + nom du prof. » Le display_name est la source du
//   nom affiché. Si vide, fallback côté élève « Ton prof ».

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { jsonError } from "@/lib/api/responses";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const UpdateProfileSchema = z.object({
  organization_id: z.string().regex(UUID_RE, { message: "UUID invalide" }),
  // Aligné sur la check constraint memberships_display_name_length_check :
  // 2..50 caractères après trim, ou null pour effacer.
  display_name: z
    .string()
    .nullable()
    .refine(
      (value) => {
        if (value === null) return true;
        const trimmed = value.trim();
        return trimmed.length >= 2 && trimmed.length <= 50;
      },
      {
        message:
          "display_name doit faire 2 à 50 caractères, ou être null pour effacer.",
      },
    ),
});

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return jsonError(401, "unauthenticated");
  }

  const { data, error } = await supabase
    .from("memberships")
    .select(
      "organization_id, role, display_name, organizations:organization_id(name)",
    )
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) {
    console.error("[me/profile GET] supabase error:", error.message);
    return jsonError(500, "internal");
  }

  type RowShape = {
    organization_id: string;
    role: string;
    display_name: string | null;
    organizations: { name: string } | { name: string }[] | null;
  };

  const memberships = (data ?? []).map((row) => {
    const r = row as unknown as RowShape;
    const orgName = Array.isArray(r.organizations)
      ? r.organizations[0]?.name ?? ""
      : r.organizations?.name ?? "";
    return {
      organization_id: r.organization_id,
      organization_name: orgName,
      role: r.role,
      display_name: r.display_name,
    };
  });

  return NextResponse.json(
    { memberships },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: NextRequest) {
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
  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "validation", parsed.error.flatten());
  }
  const input = parsed.data;

  const nextDisplayName =
    input.display_name === null ? null : input.display_name.trim();

  // Le type Database généré ne contient pas encore display_name (colonne
  // ajoutée par la migration E.4 du 29 avril 2026, types non régénérés en
  // CI). On caste la table en `any` localement, le reste du chain reste
  // typé via `.eq()` qui est inferé par PostgREST. À la prochaine
  // régénération via `npm run db:types`, retirer ce cast.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const membershipsTable = supabase.from("memberships") as any;
  const { data, error } = await membershipsTable
    .update({ display_name: nextDisplayName })
    .eq("user_id", user.id)
    .eq("organization_id", input.organization_id)
    .select("organization_id, role, display_name")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return jsonError(404, "not_found", {
        message: "Membership introuvable pour cette organisation.",
      });
    }
    if (error.code === "23514") {
      return jsonError(400, "validation", {
        display_name: ["doit faire 2 à 50 caractères après trim."],
      });
    }
    console.error("[me/profile PATCH] supabase error:", error.code, error.message);
    return jsonError(500, "internal");
  }

  return NextResponse.json({ ok: true, membership: data });
}
