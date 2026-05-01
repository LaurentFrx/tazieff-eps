"use client";

// Sprint topbar-refondue (30 avril 2026) — Pills colorées au centre de la
// TopBar pour switcher entre les rôles disponibles (Élève vert / Prof orange
// / Admin rouge).
//
// Comportement :
//   - Une pill par rôle disponible (selon les permissions du user).
//   - La pill du sous-domaine courant est active (couleur pleine).
//   - Les autres pills sont grisées et cliquables → navigation directe vers
//     le baseUrl du sous-domaine cible (resolveEnv() gère prod/preview/dev).
//   - Le pathname courant est préservé si la cible le supporte, sinon racine.
//
// Conformité GOUVERNANCE_EDITORIALE.md §2 : la présence d'une pill ne donne
// AUCUN privilège supplémentaire — elle ne fait que naviguer. Les
// permissions sont vérifiées côté backend (RLS + requireAdmin + magic-link
// académique). Un élève n'a aucun accès aux espaces prof/admin même s'il
// arrivait à manipuler les pills (il aurait juste l'écran de login).

import { useMemo } from "react";

import { useIdentity, type IdentityRole } from "@/lib/auth/IdentityContext";
import { resolveEnv, type AppRole } from "@/lib/env";
import { useI18n } from "@/lib/i18n/I18nProvider";

/** Rôles d'espace pour le switcher (différents de IdentityRole). */
export type SwitcherRole = "eleve" | "prof" | "admin";

const ROLE_COLORS: Record<SwitcherRole, string> = {
  eleve: "#639922", // vert (Sport Vibrant — endurance/élève)
  prof: "#EF9F27", // orange (Sport Vibrant — école/prof)
  admin: "#E24B4A", // rouge (admin — modération critique)
};

/**
 * Liste des prefixes de path qui sont propres à un sous-domaine spécifique.
 * Si l'utilisateur clique sur une pill et que le pathname courant commence
 * par un de ces prefixes, on retombe sur la racine du sous-domaine cible.
 * Les pages élève (/exercices, /methodes, /apprendre, /bac, /favoris)
 * restent en revanche disponibles partout (servies en miroir sur l'admin).
 */
const ROLE_SPECIFIC_PREFIXES: Record<SwitcherRole, string[]> = {
  eleve: [], // l'espace élève accepte tous les paths via [locale]
  prof: ["/prof"], // /prof/* n'existe que sur le sous-domaine prof
  admin: ["/admin"], // /admin/* n'existe que sur le sous-domaine admin
};

/**
 * Détermine le rôle actif (sous-domaine courant) en lisant `window.location.host`.
 * Côté serveur (SSR), retourne null — le composant est `"use client"` donc
 * le rendu effectif aura toujours accès à window.
 */
export function detectActiveRole(host: string): SwitcherRole {
  // Admin — exact match prod/preview ou *.localhost
  if (
    host === "admin.muscu-eps.fr" ||
    host === "design-admin.muscu-eps.fr" ||
    host.startsWith("admin.localhost")
  ) {
    return "admin";
  }
  // Prof
  if (
    host === "prof.muscu-eps.fr" ||
    host === "design-prof.muscu-eps.fr" ||
    host.startsWith("prof.localhost")
  ) {
    return "prof";
  }
  // Tout le reste → élève (muscu-eps.fr, design.muscu-eps.fr, localhost,
  // tazieff-eps.vercel.app, etc.)
  return "eleve";
}

/**
 * Calcule la liste des rôles que ce user a le droit de voir comme pills.
 *
 *   anonymous / student        → []                   (pas de pills)
 *   teacher                    → ["eleve", "prof"]    (2 pills)
 *   admin / super_admin        → ["eleve", "prof", "admin"] (3 pills)
 */
export function deriveAvailableRoles(role: IdentityRole): SwitcherRole[] {
  if (role === "super_admin" || role === "admin") {
    return ["eleve", "prof", "admin"];
  }
  if (role === "teacher") {
    return ["eleve", "prof"];
  }
  return [];
}

/**
 * Construit l'URL cible pour passer du sous-domaine courant à `targetRole`.
 * Tente de préserver le pathname si la cible le supporte ; sinon racine.
 */
export function buildSwitchUrl(args: {
  targetRole: SwitcherRole;
  currentPathname: string;
  baseUrl: Record<AppRole, string>;
}): string {
  const { targetRole, currentPathname, baseUrl } = args;
  const targetBase = baseUrl[targetRole];
  // Si le path courant est propre à un sous-domaine ≠ cible, on retombe à la racine.
  for (const role of ["eleve", "prof", "admin"] as const) {
    if (role === targetRole) continue;
    for (const prefix of ROLE_SPECIFIC_PREFIXES[role]) {
      if (currentPathname.startsWith(prefix)) {
        return targetBase + "/";
      }
    }
  }
  // Sinon on préserve le path.
  const path = currentPathname || "/";
  return targetBase + path;
}

export type RoleBadgeSwitcherProps = {
  /** Override pour les tests (sinon lu depuis useIdentity). */
  identityRoleOverride?: IdentityRole;
  /** Override pour les tests (sinon lu depuis window.location.host). */
  hostOverride?: string;
  /** Override pour les tests (sinon lu depuis window.location.pathname). */
  pathnameOverride?: string;
};

export function RoleBadgeSwitcher({
  identityRoleOverride,
  hostOverride,
  pathnameOverride,
}: RoleBadgeSwitcherProps = {}) {
  const identity = useIdentity();
  const { t } = useI18n();
  const effectiveIdentityRole = identityRoleOverride ?? identity.role;
  const roleLabels: Record<SwitcherRole, string> = {
    eleve: t("topBar.role.eleve"),
    prof: t("topBar.role.prof"),
    admin: t("topBar.role.admin"),
  };

  const availableRoles = useMemo(
    () => deriveAvailableRoles(effectiveIdentityRole),
    [effectiveIdentityRole],
  );

  // Résolution de l'host courant (côté client uniquement).
  const host =
    hostOverride ??
    (typeof window !== "undefined" ? window.location.host : "");
  const activeRole = host ? detectActiveRole(host) : "eleve";

  // Si moins de 2 rôles disponibles, on n'affiche pas le switcher.
  if (availableRoles.length < 2) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-1 rounded-lg p-[3px]"
      style={{ backgroundColor: "#1a1a1f" }}
      role="group"
      aria-label="Switcher de rôle"
      data-testid="role-badge-switcher"
    >
      {availableRoles.map((role) => {
        const isActive = role === activeRole;
        const color = ROLE_COLORS[role];
        return (
          <RoleBadge
            key={role}
            role={role}
            isActive={isActive}
            color={color}
            label={roleLabels[role]}
            pathnameOverride={pathnameOverride}
          />
        );
      })}
    </div>
  );
}

type RoleBadgeProps = {
  role: SwitcherRole;
  isActive: boolean;
  color: string;
  label: string;
  pathnameOverride?: string;
};

function RoleBadge({
  role,
  isActive,
  color,
  label,
  pathnameOverride,
}: RoleBadgeProps) {
  const handleClick = () => {
    if (isActive) return; // Pas de navigation si déjà actif.
    const { baseUrl } = resolveEnv();
    const currentPathname =
      pathnameOverride ??
      (typeof window !== "undefined" ? window.location.pathname : "/");
    const url = buildSwitchUrl({
      targetRole: role,
      currentPathname,
      baseUrl,
    });
    if (typeof window !== "undefined") {
      window.location.href = url;
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isActive}
      aria-current={isActive ? "page" : undefined}
      data-testid={`role-badge-${role}`}
      className="cursor-pointer rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-150 ease-out hover:bg-white/5"
      style={
        isActive
          ? {
              backgroundColor: color,
              color: "#fff",
            }
          : {
              color: "#888",
              backgroundColor: "transparent",
            }
      }
    >
      {label}
    </button>
  );
}
