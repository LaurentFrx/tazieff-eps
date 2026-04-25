// Phase E.2.2.5 — Layout racine de l'espace enseignant (sous-domaine prof).
//
// Monté uniquement sur les hosts prof.muscu-eps.fr et design-prof.muscu-eps.fr
// via le rewrite interne du middleware. Sur muscu-eps.fr, cette arborescence
// est bloquée en 404 (protection croisée du middleware).
//
// Différences avec le layout élève ([locale]/layout.tsx) :
//   - PAS d'AppProviders (qui embarque AuthProvider anonymous + i18n + theme)
//   - TeacherAuthProvider à la place (pas d'anonymous signin)
//   - Dark mode forcé, pas de toggle (design volontaire E.2.2.5)
//   - Pas de BottomTabBar / TopBar / InstallPwaBanner (espace prof minimaliste)
//   - Pas d'i18n (UI prof en français uniquement pour l'instant)

import type { Metadata } from "next";
import { TeacherAuthProvider } from "@/lib/supabase/TeacherAuthProvider";

export const metadata: Metadata = {
  title: "Espace enseignant — Tazieff EPS",
  description:
    "Accès enseignant pour créer des annotations, gérer vos classes et suivre vos élèves sur Tazieff EPS.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TeacherAuthProvider>{children}</TeacherAuthProvider>;
}
