"use client";

// Sprint topbar-refondue (30 avril 2026) — Menu hamburger conditionnel par
// rôle, à droite de la TopBar. Remplace les 3 anciennes icônes (Outils,
// Réglages, Mode enseignant) par un menu unique structuré.
//
// Sections affichées selon le rôle :
//   - Tous : Outils (grille 2x2) + Préférences (langue, thème) +
//     Mentions légales + Aide + Logout
//   - Prof / super_admin : section "Espace prof" en plus
//   - Super_admin : section "Espace admin" en plus (placeholders)
//
// Pages admin avancées non encore créées : les liens du hamburger pointent
// vers les routes target — accepteront 404 jusqu'à ce que les pages soient
// implémentées dans des sprints dédiés (mémoire utilisateur #20).

import { useEffect, useRef, useState } from "react";

import { LocaleLink } from "@/components/LocaleLink";
import { useIdentity } from "@/lib/auth/IdentityContext";
import { useI18n, type Lang } from "@/lib/i18n/I18nProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { resolveEnv } from "@/lib/env";

const LANG_OPTIONS: Array<{ value: Lang; label: string }> = [
  { value: "fr", label: "FR" },
  { value: "en", label: "EN" },
  { value: "es", label: "ES" },
];

export type TopBarHamburgerProps = {
  /** Override IdentityContext role pour les tests. */
  identityRoleOverride?: ReturnType<typeof useIdentity>["role"];
};

export function TopBarHamburger({
  identityRoleOverride,
}: TopBarHamburgerProps = {}) {
  const { t, lang, setLang } = useI18n();
  const identity = useIdentity();
  const role = identityRoleOverride ?? identity.role;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const isTeacherOrAbove =
    role === "teacher" || role === "admin" || role === "super_admin";
  const isAdmin = role === "admin" || role === "super_admin";

  // Click outside → close.
  useEffect(() => {
    if (!isOpen) return;
    function onMouseDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isOpen]);

  // ESC → close.
  useEffect(() => {
    if (!isOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const closeAndNav = () => setIsOpen(false);

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsOpen(false);
    // Redirige vers la racine du host courant (login si admin/prof, home si élève).
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const profBaseUrl =
    typeof window !== "undefined" ? resolveEnv().baseUrl.prof : "";
  const adminBaseUrl =
    typeof window !== "undefined" ? resolveEnv().baseUrl.admin : "";

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t("topBar.hamburger.openMenu")}
        data-testid="topbar-hamburger-button"
        className="flex h-9 w-9 flex-col items-center justify-center gap-1 rounded-md transition-colors"
        style={{
          backgroundColor: isOpen ? "#2a2a2f" : "transparent",
          color: isOpen ? "#ffffff" : "#888",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: "20px",
            height: "2px",
            backgroundColor: "currentColor",
            borderRadius: "1px",
          }}
        />
        <span
          aria-hidden="true"
          style={{
            width: "20px",
            height: "2px",
            backgroundColor: "currentColor",
            borderRadius: "1px",
          }}
        />
        <span
          aria-hidden="true"
          style={{
            width: "20px",
            height: "2px",
            backgroundColor: "currentColor",
            borderRadius: "1px",
          }}
        />
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-orientation="vertical"
          data-testid="topbar-hamburger-panel"
          className="absolute right-0 top-full mt-2 z-50 w-72 rounded-[10px] border bg-[#1a1a1f] p-3 shadow-2xl"
          style={{ borderColor: "#2a2a2f", borderWidth: "0.5px" }}
        >
          {/* ── Outils ─────────────────────────────────────────── */}
          <SectionTitle>{t("topBar.hamburger.tools")}</SectionTitle>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <ToolTile
              icon="⏱️"
              label={t("topBar.hamburger.timer")}
              href="/outils/timer"
              onClick={closeAndNav}
              testId="hamburger-tool-timer"
            />
            <ToolTile
              icon="🧮"
              label={t("topBar.hamburger.calculator")}
              href="/outils/calculateur-rm"
              onClick={closeAndNav}
              testId="hamburger-tool-rm"
            />
            <ToolTile
              icon="📋"
              label={t("topBar.hamburger.session")}
              href="/outils/ma-seance"
              onClick={closeAndNav}
              testId="hamburger-tool-session"
            />
            <ToolTile
              icon="📔"
              label={t("topBar.hamburger.notebook")}
              href="/outils/carnet"
              onClick={closeAndNav}
              testId="hamburger-tool-notebook"
            />
          </div>

          {/* ── Espace prof (teacher / admin / super_admin) ──── */}
          {isTeacherOrAbove ? (
            <>
              <SectionDivider />
              <SectionTitle>
                {t("topBar.hamburger.teacherSpace")}
              </SectionTitle>
              <ExternalLink
                href={`${profBaseUrl}/tableau-de-bord`}
                onClick={closeAndNav}
                testId="hamburger-teacher-dashboard"
              >
                {t("topBar.hamburger.teacherDashboard")}
              </ExternalLink>
              <ExternalLink
                href={`${profBaseUrl}/mes-classes`}
                onClick={closeAndNav}
                testId="hamburger-teacher-classes"
              >
                {t("topBar.hamburger.teacherClasses")}
              </ExternalLink>
              <ExternalLink
                href={`${profBaseUrl}/mes-annotations`}
                onClick={closeAndNav}
                testId="hamburger-teacher-annotations"
              >
                {t("topBar.hamburger.teacherAnnotations")}
              </ExternalLink>
              <ExternalLink
                href={`${profBaseUrl}/profil`}
                onClick={closeAndNav}
                testId="hamburger-teacher-profile"
              >
                {t("topBar.hamburger.teacherProfile")}
              </ExternalLink>
            </>
          ) : null}

          {/* ── Espace admin (super_admin uniquement) ─────────── */}
          {isAdmin ? (
            <>
              <SectionDivider />
              <SectionTitle>{t("topBar.hamburger.adminSpace")}</SectionTitle>
              <ExternalLink
                href={`${adminBaseUrl}/`}
                onClick={closeAndNav}
                testId="hamburger-admin-home"
              >
                {t("topBar.hamburger.adminHome")}
              </ExternalLink>
              <ExternalLink
                href={`${adminBaseUrl}/tableau-de-bord`}
                onClick={closeAndNav}
                testId="hamburger-admin-dashboard"
              >
                {t("topBar.hamburger.adminDashboard")}
              </ExternalLink>
              <ExternalLink
                href={`${adminBaseUrl}/audit`}
                onClick={closeAndNav}
                testId="hamburger-admin-audit"
              >
                {t("topBar.hamburger.adminAudit")}
              </ExternalLink>
              <ExternalLink
                href={`${adminBaseUrl}/etablissements`}
                onClick={closeAndNav}
                testId="hamburger-admin-orgs"
              >
                {t("topBar.hamburger.adminOrgs")}
              </ExternalLink>
            </>
          ) : null}

          {/* ── Préférences ────────────────────────────────────── */}
          <SectionDivider />
          <SectionTitle>{t("topBar.hamburger.preferences")}</SectionTitle>
          <div className="flex items-center justify-between mb-2 px-2">
            <span className="text-sm text-white/80">
              {t("topBar.hamburger.language")}
            </span>
            <div className="flex gap-1">
              {LANG_OPTIONS.map((opt) => {
                const isActive = opt.value === lang;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLang(opt.value)}
                    aria-pressed={isActive}
                    data-testid={`hamburger-lang-${opt.value}`}
                    className="rounded px-2 py-1 text-xs font-medium transition-colors"
                    style={
                      isActive
                        ? { backgroundColor: "#2a2a2f", color: "#fff" }
                        : { backgroundColor: "transparent", color: "#666" }
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-sm text-white/80">
              {t("topBar.hamburger.theme")}
            </span>
            <span
              className="text-xs"
              style={{ color: "#666" }}
              data-testid="hamburger-theme-static"
            >
              {t("topBar.hamburger.themeDark")}
            </span>
          </div>

          {/* ── Liens transverses ─────────────────────────────── */}
          <SectionDivider />
          <LocaleLink
            href="/legal/mentions-legales"
            className="block rounded-md px-2 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
            onClick={closeAndNav}
            data-testid="hamburger-legal"
          >
            {t("topBar.hamburger.legal")}
          </LocaleLink>
          <LocaleLink
            href="/apprendre"
            className="block rounded-md px-2 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
            onClick={closeAndNav}
            data-testid="hamburger-help"
          >
            {t("topBar.hamburger.help")}
          </LocaleLink>

          {/* ── Logout ────────────────────────────────────────── */}
          <SectionDivider />
          <button
            type="button"
            onClick={handleLogout}
            data-testid="hamburger-logout"
            className="block w-full text-left rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-white/5"
            style={{ color: "#E24B4A" }}
          >
            {t("topBar.hamburger.logout")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ── Helpers de présentation ─────────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
      style={{ color: "#666" }}
    >
      {children}
    </p>
  );
}

function SectionDivider() {
  return (
    <div
      className="my-2 border-t"
      style={{ borderColor: "#2a2a2f", borderWidth: "0.5px" }}
    />
  );
}

function ToolTile({
  icon,
  label,
  href,
  onClick,
  testId,
}: {
  icon: string;
  label: string;
  href: string;
  onClick: () => void;
  testId: string;
}) {
  return (
    <LocaleLink
      href={href}
      onClick={onClick}
      data-testid={testId}
      className="flex flex-col items-center gap-1 rounded-md p-3 text-center transition-colors hover:bg-white/5"
    >
      <span aria-hidden="true" className="text-2xl">
        {icon}
      </span>
      <span className="text-xs font-medium text-white/80">{label}</span>
    </LocaleLink>
  );
}

function ExternalLink({
  href,
  onClick,
  testId,
  children,
}: {
  href: string;
  onClick: () => void;
  testId: string;
  children: React.ReactNode;
}) {
  // Liens cross-host : <a href> classique (la nav forcera le rechargement,
  // ce qui est voulu pour passer d'un sous-domaine à l'autre).
  return (
    <a
      href={href}
      onClick={onClick}
      data-testid={testId}
      className="block rounded-md px-2 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
    >
      {children}
    </a>
  );
}
