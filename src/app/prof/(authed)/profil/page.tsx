// Sprint E.4 (29 avril 2026) — Page profil prof.
//
// Permet au prof de saisir son nom d'affichage tel qu'il sera vu par les
// élèves au-dessus de chaque post-it d'annotation (cf. GOUVERNANCE_EDITORIALE
// v1.1 §3.2 — pattern post-it avec attribution explicite).
//
// Un display_name est saisi par membership (organization). Un prof
// multi-établissement peut donc avoir un nom différent selon le lycée.
// Fallback côté élève si display_name vide : « Ton prof ».

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import ProfilClient from "./ProfilClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type MembershipRow = {
  organization_id: string;
  role: string;
  display_name: string | null;
  organizations: { name: string } | { name: string }[] | null;
};

export default async function ProfilPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    redirect("/prof/connexion");
  }

  const { data: rawMemberships, error } = await supabase
    .from("memberships")
    .select(
      "organization_id, role, display_name, organizations:organization_id(name)",
    )
    .eq("user_id", user!.id)
    .eq("status", "active");

  const memberships = ((rawMemberships ?? []) as unknown as MembershipRow[]).map(
    (row) => ({
      organization_id: row.organization_id,
      organization_name: Array.isArray(row.organizations)
        ? row.organizations[0]?.name ?? ""
        : row.organizations?.name ?? "",
      role: row.role,
      display_name: row.display_name,
    }),
  );

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <h1
        style={{
          fontFamily: "var(--font-bebas), sans-serif",
          fontSize: 32,
          letterSpacing: "0.05em",
          color: "#FF8C00",
          marginBottom: 8,
        }}
      >
        Mon profil prof
      </h1>
      <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24, fontSize: 14 }}>
        Renseigne le nom que tes élèves verront au-dessus de tes annotations.
      </p>
      <ProfilClient
        userEmail={user!.email!}
        memberships={memberships}
        loadError={error?.message ?? null}
      />
    </main>
  );
}
