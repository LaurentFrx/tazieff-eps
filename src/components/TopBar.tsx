"use client";

// Sprint topbar-refondue (30 avril 2026) — refonte complète :
//   - Colonne 1 (gauche) : logo Tazieff EPS + texte (identique au précédent)
//   - Colonne 2 (centre) : RoleBadgeSwitcher (uniquement pour profs/admins)
//   - Colonne 3 (droite) : Search + TopBarHamburger
//
// Suppressions par rapport à l'ancienne TopBar :
//   - Icône Outils (⚡) — déplacée dans le hamburger (grille 2×2 outils)
//   - Icône Réglages (engrenage) — déplacée dans le hamburger
//     (préférences langue/thème) ; la page /reglages reste en place
//     temporairement pour les fonctions non migrées (objectif par défaut,
//     animations anatomie, code établissement) — sprint dédié à venir.
//   - Icône Mode enseignant — remplacée par la pill « Prof » du switcher.
//
// Conservés : Timer badge actif (clic → /outils/timer), lien « Ma classe »
// (élève inscrit), shortcut clavier Cmd/Ctrl+K, modal Search.

import { LocaleLink as Link } from "@/components/LocaleLink";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { SearchModal } from "@/components/SearchModal";
import { useTimerContext } from "@/contexts/TimerContext";
import { useMyClasses } from "@/hooks/useMyClasses";
import { RoleBadgeSwitcher } from "@/components/topbar/RoleBadgeSwitcher";
import { TopBarHamburger } from "@/components/topbar/TopBarHamburger";

/* ── Inline SVG icons (20×20) ────────────────────────────────────── */

function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function IconMaClasse() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

/* ── Component ───────────────────────────────────────────────────── */

function formatBadgeTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function TopBar() {
  const { t } = useI18n();
  const [searchOpen, setSearchOpen] = useState(false);
  const timerCtx = useTimerContext();
  // Sprint E1 — affichage conditionné à l'inscription dans au moins une classe.
  const { classes: myClasses } = useMyClasses();
  const hasClass = myClasses.length > 0;

  /* ── Cmd/Ctrl+K shortcut ──────────────────────────────────────── */
  useEffect(() => {
    function handleShortcut(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-lg dark:border-zinc-700 dark:bg-zinc-900/95"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        data-testid="topbar"
      >
        <div className="mx-auto grid h-12 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-2 px-4">

          {/* ── Col 1 — Identité Tazieff (logo + texte sur ≥sm) ── */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 min-h-[44px]"
            data-testid="topbar-brand"
          >
            <Image
              src="/media/branding/logo-eps-72.webp"
              alt="Logo Tazieff EPS"
              width={24}
              height={24}
              unoptimized
            />
            <span className="hidden sm:inline text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Tazieff&apos;EPS
            </span>
          </Link>

          {/* ── Col 2 — Centre : badge timer actif OU switcher rôle ── */}
          <div className="flex items-center justify-center min-w-0">
            {timerCtx?.isActive ? (
              (() => {
                const ap = timerCtx.state.phases[timerCtx.state.activePhaseIndex];
                const color = timerCtx.displayConfig?.phaseColorMap[ap?.type ?? 'work'] ?? '#8b5cf6';
                const running = timerCtx.state.status === 'running';
                return (
                  <Link
                    href="/outils/timer"
                    className="flex items-center gap-2 px-2.5 py-1 rounded-full no-underline shrink-0"
                    style={{ background: `${color}33`, border: `1px solid ${color}4d` }}
                  >
                    <span
                      className="block w-2 h-2 rounded-full"
                      style={{
                        background: color,
                        animation: running ? 'timer-badge-pulse 1.5s ease-in-out infinite' : undefined,
                      }}
                    />
                    <span className="font-mono text-[12px] font-bold text-zinc-900 dark:text-white">
                      {formatBadgeTime(timerCtx.state.secondsLeft)}
                    </span>
                  </Link>
                );
              })()
            ) : (
              <RoleBadgeSwitcher />
            )}
          </div>

          {/* ── Col 3 — Actions (search + ma classe + hamburger) ── */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-center w-11 h-11 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label={t("search.open")}
              data-testid="topbar-search-button"
            >
              <IconSearch />
            </button>

            {/* Sprint E1 — Lien Ma classe : visible uniquement si l'élève
                est inscrit dans au moins une classe. Conservé hors hamburger
                (raccourci fréquent pour les élèves inscrits). */}
            {hasClass && (
              <Link
                href="/ma-classe"
                className="flex items-center justify-center w-11 h-11 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label={t("topBar.maClasse")}
                data-testid="topbar-ma-classe"
              >
                <IconMaClasse />
              </Link>
            )}

            {/* Hamburger conditionnel par rôle */}
            <TopBarHamburger />
          </div>
        </div>
      </header>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}

      {/* Badge pulse animation */}
      <style>{`@keyframes timer-badge-pulse{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.3);opacity:1}}`}</style>
    </>
  );
}
