"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* ── Mini SVG icons (20px, stroke-based) ──────────────────────────── */

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function IconDumbbell({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5L17.5 17.5" />
      <path d="M3.5 10L10 3.5" />
      <path d="M14 20.5L20.5 14" />
      <path d="M2 11.5l1.5-1.5" />
      <path d="M20.5 13L22 11.5" />
      <path d="M11.5 2L13 3.5" />
      <path d="M3.5 20.5L5 19" />
    </svg>
  );
}

function IconClipboard({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 7h6" />
      <path d="M9 11h6" />
      <path d="M9 15h4" />
    </svg>
  );
}

function IconBook({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" />
      <path d="M8 7h8" />
      <path d="M8 11h5" />
    </svg>
  );
}

function IconGradCap({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3L1 9l11 6 9-5V17" />
      <path d="M5 13.18v4.82a9 9 0 0014 0v-4.82" />
    </svg>
  );
}

/* ── Tab definition ───────────────────────────────────────────────── */

const tabs = [
  { href: "/",            labelKey: "nav.home.label",      Icon: IconHome,      color: "#f05a2b" },
  { href: "/exercices",   labelKey: "nav.exos.label",      Icon: IconDumbbell,  color: "#f97316" },
  { href: "/methodes",    labelKey: "nav.methodes.label",  Icon: IconClipboard, color: "#4f46e5" },
  { href: "/apprendre",   labelKey: "nav.apprendre.label", Icon: IconBook,      color: "#16a34a" },
  { href: "/parcours-bac",labelKey: "nav.bac.label",       Icon: IconGradCap,   color: "#7c3aed" },
] as const;

/* ── Component ────────────────────────────────────────────────────── */

export function BottomTabBar() {
  const pathname = usePathname() ?? "";
  const { t } = useI18n();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-around border-t border-zinc-200 bg-white/95 backdrop-blur-lg lg:hidden dark:border-zinc-700 dark:bg-zinc-900/95"
      style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}
      aria-label={t("nav.mainNavigation")}
    >
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/"
            ? pathname === "/"
            : pathname === tab.href || pathname.startsWith(tab.href + "/");

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-0.5 px-1 pt-2 pb-1 min-w-[56px] transition-colors"
            style={{ color: isActive ? tab.color : undefined }}
            aria-current={isActive ? "page" : undefined}
          >
            <tab.Icon active={isActive} />
            <span
              className={`text-[10px] font-semibold leading-tight ${
                isActive ? "" : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {t(tab.labelKey)}
            </span>
            {isActive && (
              <span
                className="mt-0.5 h-[3px] w-4 rounded-full"
                style={{ background: tab.color }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
