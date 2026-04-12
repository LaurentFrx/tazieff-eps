"use client";

import { LocaleLink as Link } from "@/components/LocaleLink";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* ── SVG icons (24px, stroke-based, bigger for 3-tab layout) ─────── */

function IconPlay({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="8" height="14" rx="1" />
      <rect x="14" y="5" width="8" height="14" rx="1" />
      <path d="M6 9v6" />
      <path d="M18 9v6" />
      <path d="M10 12h4" />
    </svg>
  );
}

function IconCompass({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={active ? "currentColor" : "none"} stroke="currentColor" />
    </svg>
  );
}

function IconStar({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/* ── Tab definition ───────────────────────────────────────────────── */

const tabs = [
  { href: "/",          labelKey: "nav.maSeance.label",   Icon: IconPlay,    color: "#f97316" },
  { href: "/explorer",  labelKey: "nav.explorer.label",   Icon: IconCompass,  color: "#3b82f6" },
  { href: "/mon-parcours", labelKey: "nav.monParcours.label", Icon: IconStar, color: "#a855f7" },
] as const;

/* ── Component ────────────────────────────────────────────────────── */

export function BottomTabBar() {
  const pathname = usePathname() ?? "";
  const { t } = useI18n();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-around border-t border-zinc-200 bg-white/95 backdrop-blur-lg dark:border-zinc-700 dark:bg-zinc-900/95"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
      aria-label={t("nav.mainNavigation")}
    >
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/"
            ? pathname === "/" || pathname.startsWith("/seances")
            : pathname === tab.href || pathname.startsWith(tab.href + "/")
              || (tab.href === "/explorer" && (pathname.startsWith("/exercices") || pathname.startsWith("/methodes") || pathname.startsWith("/apprendre")))
              || (tab.href === "/mon-parcours" && (pathname.startsWith("/parcours-bac") || pathname.startsWith("/bac")));

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-1 px-4 pt-2.5 pb-1.5 min-w-[80px] transition-colors"
            style={{ color: isActive ? tab.color : undefined }}
            aria-current={isActive ? "page" : undefined}
          >
            <tab.Icon active={isActive} />
            <span
              className={`text-[11px] font-bold leading-tight ${
                isActive ? "" : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {t(tab.labelKey)}
            </span>
            {isActive && (
              <span
                className="mt-0.5 h-[3px] w-6 rounded-full"
                style={{ background: tab.color }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
