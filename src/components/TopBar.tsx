"use client";

import { LocaleLink as Link } from "@/components/LocaleLink";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTeacherMode } from "@/hooks/useTeacherMode";
import { SearchModal } from "@/components/SearchModal";
import { useTimerContext } from "@/contexts/TimerContext";

/* ── Inline SVG icons (20×20) ────────────────────────────────────── */

function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function IconTools() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001.08 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z" />
    </svg>
  );
}

function IconTeacher() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
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
  const { unlocked: teacherUnlocked } = useTeacherMode();
  const [searchOpen, setSearchOpen] = useState(false);
  const timerCtx = useTimerContext();

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
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-lg dark:border-zinc-700 dark:bg-zinc-900/95" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-2 px-4">

          {/* ── Left: Logo ────────────────────────────────────────── */}
          <Link href="/" className="flex items-center gap-2 shrink-0 min-h-[44px]">
            <Image
              src="/media/branding/logo-eps.webp"
              alt="Logo Tazieff EPS"
              width={24}
              height={24}
              unoptimized
            />
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Tazieff&apos;EPS
            </span>
          </Link>

          {/* ── Timer badge (when active) ────────────────────────── */}
          {timerCtx?.isActive && (() => {
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
          })()}

          {/* ── Right: Action icons ───────────────────────────────── */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Search */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-center w-11 h-11 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label={t("search.open")}
            >
              <IconSearch />
            </button>

            {/* Outils — mobile only */}
            <Link
              href="/outils"
              className="flex items-center justify-center w-11 h-11 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label={t("nav.outils.label")}
            >
              <IconTools />
            </Link>

            {/* Réglages */}
            <Link
              href="/reglages"
              className="flex items-center justify-center w-11 h-11 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label={t("pages.settings.title")}
            >
              <IconSettings />
            </Link>

            {/* Mode enseignant — conditional */}
            {teacherUnlocked && (
              <Link
                href="/enseignant"
                className="flex items-center justify-center w-11 h-11 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label={t("enseignant.navLabel")}
              >
                <IconTeacher />
              </Link>
            )}
          </div>
        </div>
      </header>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}

      {/* Badge pulse animation */}
      <style>{`@keyframes timer-badge-pulse{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.3);opacity:1}}`}</style>
    </>
  );
}
