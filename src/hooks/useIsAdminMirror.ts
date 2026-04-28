"use client";

// Sprint hotfix admin-mirror-elements (28 avril 2026) — détecte si on est
// sur le miroir admin côté client.
//
// Contexte : sur admin.muscu-eps.fr (et design-admin.* en preview), le
// proxy sert le contenu standard de l'app élève en pass-through pour les
// paths pédagogiques (/exercices, /methodes, /bac, ...). Le layout monté
// est donc `[locale]/layout.tsx` (élève), MAIS le sous-domaine est admin.
//
// Conséquence : certains composants élève-only (panel "MODE PROF",
// OnboardingBanner, InstallPwaBanner...) apparaissent à tort sur le
// miroir admin où ils n'ont pas de sens (l'admin connecté édite via les
// inline editors, n'a pas besoin d'onboarding élève, et n'installe pas
// la PWA — il consulte sur desktop).
//
// Ce hook expose un booléen côté client qui dit "on est sur un host admin".
// Côté SSR, il retourne `false` par défaut (on assume élève) — l'hydration
// client corrige le rendu si nécessaire.
//
// Référence : audit-cc 2026-04-28 §3.3, GOUVERNANCE_EDITORIALE.md §2.1.

import { useEffect, useState } from "react";
import { isAdminHost } from "@/lib/admin-hosts";

/**
 * Retourne `true` si window.location.host est dans ADMIN_HOSTS (ou un
 * équivalent localhost). `false` côté SSR (avant hydration) et sur tout
 * autre host.
 *
 * Pattern d'usage :
 *
 *   const isAdminMirror = useIsAdminMirror();
 *   if (isAdminMirror) return null; // composant masqué sur miroir admin
 */
export function useIsAdminMirror(): boolean {
  const [isAdminMirror, setIsAdminMirror] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsAdminMirror(isAdminHost(window.location.host));
  }, []);

  return isAdminMirror;
}
