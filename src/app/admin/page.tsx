// Sprint P0.7 — Page /admin (home admin minimal).
//
// Server component avec garde :
//   - Pas de user → redirect /admin/login
//   - User mais pas admin (cas edge) → redirect / (élève)
//   - Sinon : affiche statut + rôle + bouton de déconnexion

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/auth/requireAdmin";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { LogoutButton } from "./_components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = await isAdminUser(user.id, supabase);
  if (!role.is_admin) {
    // Cas edge : user authentifié mais pas dans app_admins. On le
    // renvoie vers la page de login admin (pas vers / élève, pour ne
    // pas l'expulser hors du sous-domaine).
    redirect("/login");
  }

  // i18n : on lit la locale via cookie (espace admin n'a pas de [locale] route).
  const lang = getServerLang();
  const t = getServerT(lang);

  const roleLabel = role.is_super_admin
    ? t("adminHome.role.superAdmin")
    : t("adminHome.role.admin");

  return (
    <section className="mx-auto max-w-md px-6 py-16">
      <h1
        className="mb-6 text-3xl uppercase tracking-wider"
        style={{
          fontFamily: "var(--font-bebas), sans-serif",
          color: "#00E5FF",
        }}
      >
        {t("adminHome.title")}
      </h1>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-white/60">
            {t("adminHome.connectedAs")}
          </p>
          <p className="text-sm text-white" data-testid="admin-email">
            {user.email ?? user.id}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-white/60">
            {t("adminHome.roleLabel")}
          </p>
          <p
            className="text-sm font-semibold text-cyan-300"
            data-testid="admin-role"
          >
            {roleLabel}
          </p>
        </div>

        {/* P0.7-bis : lien vers le catalogue (servi en miroir sur ce host
            par le proxy host-based admin, avec édition au clic active). */}
        <Link
          href="/exercices"
          className="inline-flex items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-400/20"
          data-testid="admin-catalog-link"
        >
          {t("adminHome.catalogLink")}
        </Link>

        <LogoutButton label={t("adminHome.logout")} />
      </div>
    </section>
  );
}
