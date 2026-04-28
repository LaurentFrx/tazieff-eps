// Sprint P0.7 — Page /admin/login. Server component qui :
//   1. Vérifie côté SSR si une session existe déjà (cookies).
//   2. Si oui, redirige immédiatement vers /admin (rewrite host-based).
//   3. Sinon, délègue le formulaire au client component.

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminLoginClient } from "./AdminLoginClient";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // L'URL publique est admin.muscu-eps.fr/, le proxy reécrit en /admin.
    redirect("/");
  }

  return <AdminLoginClient />;
}
