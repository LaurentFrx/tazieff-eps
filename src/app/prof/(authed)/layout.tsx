// Phase E.2.3.3 — Layout des pages prof protégées (tableau-de-bord,
// mes-classes, mes-annotations, exercices, etc.).
//
// Responsabilité :
//   - Auth check côté serveur : redirect vers /connexion si pas de user
//   - Monte le TeacherHeader (client) en haut
//   - Fond noir Sport Vibrant commun à toutes les pages authentifiées
//
// L'auth check est aussi utile pour éviter un flash de contenu avant que
// le TeacherAuthContext (client) ne résolve la session. Les pages filles
// peuvent donc supposer qu'un `user` existe côté serveur.

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import TeacherHeader from "@/components/teacher/TeacherHeader";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/connexion");
  }

  return (
    <div style={{ minHeight: "100svh", backgroundColor: "#04040A", color: "#f0f0f5" }}>
      <TeacherHeader />
      <main>{children}</main>
    </div>
  );
}
