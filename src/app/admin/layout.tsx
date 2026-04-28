// Sprint P0.7 — Layout racine de l'espace admin (sous-domaine
// admin.muscu-eps.fr). Monté uniquement sur les hosts admin.muscu-eps.fr
// et design-admin.muscu-eps.fr via le rewrite interne du middleware.
// Sur muscu-eps.fr / design.muscu-eps.fr, cette arborescence est bloquée
// en 404 (protection croisée du proxy).
//
// Différences avec le layout élève ([locale]/layout.tsx) :
//   - PAS d'AppProviders (pas d'AuthProvider anonymous, pas de i18n
//     auto-détectée, pas de BottomTabBar / TopBar)
//   - AdminAuthProvider à la place
//   - Dark mode forcé
//
// Référence : GOUVERNANCE_EDITORIALE.md §2.1, §2.2.

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminAuthProvider } from "@/lib/supabase/AdminAuthProvider";
import { I18nProvider, type Lang } from "@/lib/i18n/I18nProvider";

export const metadata: Metadata = {
  title: "Admin — Tazieff EPS",
  description: "Espace administrateur Tazieff EPS.",
  robots: {
    index: false,
    follow: false,
  },
};

function isLang(value: string): value is Lang {
  return value === "fr" || value === "en" || value === "es";
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("eps_lang")?.value ?? "fr";
  const initialLang: Lang = isLang(langCookie) ? langCookie : "fr";

  return (
    <I18nProvider initialLang={initialLang}>
      <AdminAuthProvider>
        <main
          className="min-h-screen bg-[#04040A] text-white"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          {children}
        </main>
      </AdminAuthProvider>
    </I18nProvider>
  );
}
