"use client";

import { useMemo } from "react";
import { LocaleLink as Link } from "@/components/LocaleLink";
import Image from "next/image";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useFavorites } from "@/hooks/useFavorites";
import { SEARCH_INDEX } from "@/lib/search/search-index";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import { IlluDumbbell, IlluClipboard, IlluBook, IlluTrophy } from "@/components/illustrations";
import { HomeFlyer } from "@/components/HomeFlyer";

/* ── Outils SVG icons ────────────────────────────────────────────── */

function IconTimer() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3l2 2"/><path d="M19 3l-2 2"/><path d="M12 5V3"/>
    </svg>
  );
}

function IconCalculateur() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="16" y2="18"/>
    </svg>
  );
}

function IconMaSeance() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 12h6"/><path d="M9 16h6"/>
    </svg>
  );
}

function IconCarnet() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z"/><path d="M8 7h8"/><path d="M8 11h6"/>
    </svg>
  );
}

/* ── Outils data ──────────────────────────────────────────────────── */

const outils = [
  { href: "/outils/timer",          labelKey: "pages.home.outilTimer",       gradient: "from-amber-500 to-orange-500",  icon: <IconTimer /> },
  { href: "/outils/calculateur-rm", labelKey: "pages.home.outilCalculateur", gradient: "from-cyan-500 to-blue-500",     icon: <IconCalculateur /> },
  { href: "/outils/ma-seance",      labelKey: "pages.home.outilMaSeance",    gradient: "from-pink-500 to-rose-500",     icon: <IconMaSeance /> },
  { href: "/outils/carnet",         labelKey: "pages.home.outilCarnet",      gradient: "from-indigo-500 to-violet-500", icon: <IconCarnet /> },
];

/* ── Theme SVG icons ──────────────────────────────────────────────── */

function IconHeartbeat() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l3-9 4 18 3-9h4" />
    </svg>
  );
}

function IconBicep() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5L17.5 17.5" />
      <path d="M3.5 10L10 3.5" />
      <path d="M14 20.5L20.5 14" />
      <path d="M2 11.5l1.5-1.5" />
      <path d="M20.5 13L22 11.5" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

/* ── Themes data ──────────────────────────────────────────────────── */

const themes = [
  { href: "/methodes?objectif=endurance",  labelKey: "pages.home.themeEndurance", descKey: "pages.home.themeEnduranceDesc", gradient: "from-emerald-500 to-green-600", icon: <IconHeartbeat /> },
  { href: "/methodes?objectif=volume",     labelKey: "pages.home.themeVolume",    descKey: "pages.home.themeVolumeDesc",    gradient: "from-blue-500 to-indigo-600",   icon: <IconBicep /> },
  { href: "/methodes?objectif=puissance",  labelKey: "pages.home.themePuissance", descKey: "pages.home.themePuissanceDesc", gradient: "from-orange-500 to-red-600",    icon: <IconBolt /> },
];

/* ── Props ────────────────────────────────────────────────────────── */

type Props = {
  exerciseCount: number;
  methodeCount: number;
  learnCount: number;
};

/* ── Component ────────────────────────────────────────────────────── */

export function HomepageClient({ exerciseCount, methodeCount, learnCount }: Props) {
  const { t } = useI18n();
  const { favorites } = useFavorites();

  const slugMap = useMemo(
    () => new Map(SEARCH_INDEX.filter((e) => e.type === "exercice").map((e) => [e.slug, e])),
    [],
  );

  const validFavorites = useMemo(
    () => favorites.filter((slug) => slugMap.has(slug)),
    [favorites, slugMap],
  );

  const hasFavorites = validFavorites.length > 0;

  return (
    <section className="page">
      <OnboardingBanner />

      {/* ── Flyer hero + greeting ─────────────────────────────────── */}
      <HomeFlyer />

      {/* ── Main navigation cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {/* EXERCICES — full width, compact */}
        <Link
          href="/exercices"
          className="col-span-2 md:col-span-4 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 px-5 py-4 flex items-center gap-4 shadow-lg shadow-orange-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/35"
        >
          <IlluDumbbell />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white drop-shadow-sm">{exerciseCount}</span>
              <span className="text-lg font-bold text-white drop-shadow-sm">{t("pages.home.exercicesLabel")}</span>
            </div>
            <span className="text-sm text-white/80">{t("pages.home.exercicesDesc")}</span>
          </div>
        </Link>

        {/* METHODES — half width */}
        <Link
          href="/methodes"
          className="col-span-1 md:col-span-2 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 p-4 min-h-[120px] flex flex-col justify-end shadow-lg shadow-blue-600/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-600/35"
          style={{ animationDelay: "75ms" }}
        >
          <IlluClipboard />
          <span className="text-3xl font-black text-white drop-shadow-sm">{methodeCount}</span>
          <span className="text-base font-bold text-white drop-shadow-sm">{t("pages.home.methodesLabel")}</span>
          <span className="text-xs text-white/80">{t("pages.home.methodesDesc")}</span>
        </Link>

        {/* APPRENDRE — half width */}
        <Link
          href="/apprendre"
          className="col-span-1 md:col-span-2 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-400 p-4 min-h-[120px] flex flex-col justify-end shadow-lg shadow-green-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/35"
          style={{ animationDelay: "150ms" }}
        >
          <IlluBook />
          <span className="text-3xl font-black text-white drop-shadow-sm">{learnCount}</span>
          <span className="text-base font-bold text-white drop-shadow-sm">{t("pages.home.apprendreLabel")}</span>
          <span className="text-xs text-white/80">{t("pages.home.apprendreDesc")}</span>
        </Link>

        {/* BAC — full width, compact */}
        <Link
          href="/parcours-bac"
          className="col-span-2 md:col-span-4 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 px-5 py-3 flex items-center gap-4 shadow-lg shadow-violet-600/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-600/35"
        >
          <IlluTrophy />
          <div className="flex-1 min-w-0">
            <span className="text-base font-bold text-white drop-shadow-sm">{t("pages.home.bacLabel")}</span>
            <span className="block text-xs text-white/80">{t("pages.home.bacDesc")}</span>
          </div>
        </Link>
      </div>

      {/* ── Outils grid 2×2 ──────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {outils.map((o, i) => (
          <Link
            key={o.href}
            href={o.href}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${o.gradient} p-4 min-h-[90px] flex flex-col justify-end shadow-md transition-all duration-300 hover:scale-[1.03]`}
            style={{ animationDelay: `${300 + i * 60}ms` }}
          >
            <div className="absolute top-3 right-3 opacity-20 text-white">
              {o.icon}
            </div>
            <span className="text-base font-bold text-white drop-shadow-sm">{t(o.labelKey)}</span>
          </Link>
        ))}
      </div>

      {/* ── Share link ────────────────────────────────────────────── */}
      <div className="mt-3 text-center">
        <Link
          href="/partager"
          className="inline-flex items-center gap-1.5 text-sm text-pink-500 hover:text-pink-600 dark:text-pink-400 dark:hover:text-pink-300 font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <circle cx="13" cy="4.5" r="2.5" /><circle cx="5" cy="10" r="2.5" /><circle cx="13" cy="15.5" r="2.5" />
            <path d="M7.2 8.8l5.6-3.1M7.2 11.2l5.6 3.1" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
          {t("pages.home.shareApp")}
        </Link>
      </div>

      {/* ── Favoris (conditional) ─────────────────────────────────── */}
      {hasFavorites && (
        <div className="mt-6">
          <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mb-3">
            {t("pages.home.favoritesTitle")}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory scrollbar-none">
            {validFavorites.slice(0, 10).map((slug) => {
              const entry = slugMap.get(slug);
              const title = entry?.title ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
              return (
                <Link
                  key={slug}
                  href={`/exercices/${slug}`}
                  className="flex-shrink-0 w-40 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md snap-start"
                >
                  <div className="relative w-full aspect-video bg-zinc-200 dark:bg-zinc-700">
                    <Image
                      src={`/images/exos/thumb169-${slug}.webp`}
                      alt={title}
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                  </div>
                  <div className="p-2">
                    <span className="text-xs font-mono text-orange-500 uppercase">{slug}</span>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2">{title}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Themes / Objectifs ────────────────────────────────────── */}
      <div className="mt-6 mb-4">
        <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mb-3">
          {t("pages.home.themesTitle")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {themes.map((th) => (
            <Link
              key={th.href}
              href={th.href}
              className={`rounded-2xl bg-gradient-to-br ${th.gradient} p-4 flex flex-col gap-1 shadow-md transition-all duration-300 hover:scale-[1.02] last:col-span-2 last:md:col-span-1`}
            >
              <span className="text-white/40">{th.icon}</span>
              <span className="text-base font-bold text-white drop-shadow-sm">{t(th.labelKey)}</span>
              <span className="text-xs text-white/80">{t(th.descKey)}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
