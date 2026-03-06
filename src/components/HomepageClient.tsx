"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useFavorites } from "@/hooks/useFavorites";
import { OnboardingBanner } from "@/components/OnboardingBanner";

/* ── SVG Illustrations (white semi-transparent, ~80-100px) ────────── */

function IlluDumbbell() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" className="absolute right-2 bottom-2 opacity-20">
      <g stroke="white" strokeWidth="3" strokeLinecap="round">
        <rect x="10" y="35" width="12" height="30" rx="3" fill="white" fillOpacity="0.15" />
        <rect x="78" y="35" width="12" height="30" rx="3" fill="white" fillOpacity="0.15" />
        <rect x="2" y="40" width="10" height="20" rx="2" fill="white" fillOpacity="0.1" />
        <rect x="88" y="40" width="10" height="20" rx="2" fill="white" fillOpacity="0.1" />
        <line x1="22" y1="50" x2="78" y2="50" strokeWidth="4" />
        <circle cx="50" cy="28" r="10" fill="white" fillOpacity="0.1" />
        <line x1="50" y1="38" x2="50" y2="60" strokeWidth="3" />
        <line x1="50" y1="60" x2="38" y2="78" strokeWidth="2.5" />
        <line x1="50" y1="60" x2="62" y2="78" strokeWidth="2.5" />
        <line x1="50" y1="48" x2="35" y2="42" strokeWidth="2.5" />
        <line x1="50" y1="48" x2="65" y2="42" strokeWidth="2.5" />
      </g>
    </svg>
  );
}

function IlluClipboard() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="absolute right-2 bottom-2 opacity-20">
      <g stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <rect x="15" y="10" width="50" height="60" rx="6" fill="white" fillOpacity="0.1" />
        <rect x="28" y="5" width="24" height="12" rx="4" fill="white" fillOpacity="0.15" />
        <line x1="25" y1="30" x2="55" y2="30" />
        <line x1="25" y1="40" x2="50" y2="40" />
        <line x1="25" y1="50" x2="45" y2="50" />
        <circle cx="55" cy="55" r="12" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="2" />
        <path d="M52 55l3 3 5-6" strokeWidth="2" />
      </g>
    </svg>
  );
}

function IlluBook() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="absolute right-2 bottom-2 opacity-20">
      <g stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <path d="M40 15C32 10 20 10 10 15v50c10-5 22-5 30 0 8-5 20-5 30 0V15C60 10 48 10 40 15z" fill="white" fillOpacity="0.1" />
        <line x1="40" y1="15" x2="40" y2="65" />
        <line x1="20" y1="28" x2="35" y2="28" />
        <line x1="20" y1="36" x2="33" y2="36" />
        <line x1="20" y1="44" x2="30" y2="44" />
        <line x1="45" y1="28" x2="60" y2="28" />
        <line x1="45" y1="36" x2="58" y2="36" />
        <circle cx="60" cy="20" r="8" fill="white" fillOpacity="0.15" />
        <path d="M57 20l2 2 4-4" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

function IlluTrophy() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" className="absolute right-2 bottom-2 opacity-20">
      <g stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <path d="M35 25h30v25c0 12-7 20-15 20s-15-8-15-20V25z" fill="white" fillOpacity="0.15" />
        <path d="M35 35H20c0 10 8 15 15 15" />
        <path d="M65 35h15c0 10-8 15-15 15" />
        <line x1="50" y1="70" x2="50" y2="80" strokeWidth="3" />
        <line x1="38" y1="80" x2="62" y2="80" strokeWidth="3" />
        <polygon points="50,15 53,22 60,22 54,26 56,33 50,29 44,33 46,26 40,22 47,22" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

/* ── Greeting helper ──────────────────────────────────────────────── */

function getGreetingKey(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "pages.home.greetingMorning";
  if (h >= 12 && h < 18) return "pages.home.greetingAfternoon";
  if (h >= 18 && h < 22) return "pages.home.greetingEvening";
  return "pages.home.greetingNight";
}

/* ── Outils data ──────────────────────────────────────────────────── */

const outils = [
  { href: "/outils/ma-seance",      labelKey: "pages.home.outilMaSeance",    gradient: "from-pink-500 to-rose-500" },
  { href: "/outils/calculateur-rm", labelKey: "pages.home.outilCalculateur", gradient: "from-cyan-500 to-blue-500" },
  { href: "/outils/timer",          labelKey: "pages.home.outilTimer",       gradient: "from-amber-500 to-orange-500" },
  { href: "/outils/carnet",         labelKey: "pages.home.outilCarnet",      gradient: "from-indigo-500 to-violet-500" },
];

/* ── Themes data ──────────────────────────────────────────────────── */

const themes = [
  { href: "/exercices?theme=endurance", labelKey: "pages.home.themeEndurance", descKey: "pages.home.themeEnduranceDesc", gradient: "from-emerald-500 to-green-600", emoji: "💚" },
  { href: "/exercices?theme=volume",    labelKey: "pages.home.themeVolume",    descKey: "pages.home.themeVolumeDesc",    gradient: "from-blue-500 to-indigo-600",   emoji: "💙" },
  { href: "/exercices?theme=puissance", labelKey: "pages.home.themePuissance", descKey: "pages.home.themePuissanceDesc", gradient: "from-orange-500 to-red-600",    emoji: "🧡" },
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
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    setGreeting(t(getGreetingKey()));
  }, [t]);

  const hasFavorites = favorites.length > 0;

  return (
    <section className="page">
      <OnboardingBanner />

      {/* ── Greeting ──────────────────────────────────────────────── */}
      <div className="mt-2 mb-2">
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
          {greeting || "\u00A0"}
        </h1>
      </div>

      {/* ── Main navigation cards ─────────────────────────────────── */}
      <div className="flex flex-col gap-4">

        {/* EXERCICES — full width, featured */}
        <Link
          href="/exercices"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 p-5 min-h-[140px] flex flex-col justify-end shadow-lg shadow-orange-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/35"
          style={{ animationDelay: "0ms" }}
        >
          <IlluDumbbell />
          <span className="text-4xl font-black text-white drop-shadow-sm">{exerciseCount}</span>
          <span className="text-lg font-bold text-white drop-shadow-sm">{t("pages.home.exercicesLabel")}</span>
          <span className="text-sm text-white/80">{t("pages.home.exercicesDesc")}</span>
        </Link>

        {/* METHODES + APPRENDRE — side by side */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/methodes"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 p-4 min-h-[120px] flex flex-col justify-end shadow-lg shadow-blue-600/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-600/35"
            style={{ animationDelay: "75ms" }}
          >
            <IlluClipboard />
            <span className="text-3xl font-black text-white drop-shadow-sm">{methodeCount}</span>
            <span className="text-base font-bold text-white drop-shadow-sm">{t("pages.home.methodesLabel")}</span>
            <span className="text-xs text-white/80">{t("pages.home.methodesDesc")}</span>
          </Link>
          <Link
            href="/apprendre"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-400 p-4 min-h-[120px] flex flex-col justify-end shadow-lg shadow-green-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/35"
            style={{ animationDelay: "150ms" }}
          >
            <IlluBook />
            <span className="text-3xl font-black text-white drop-shadow-sm">{learnCount}</span>
            <span className="text-base font-bold text-white drop-shadow-sm">{t("pages.home.apprendreLabel")}</span>
            <span className="text-xs text-white/80">{t("pages.home.apprendreDesc")}</span>
          </Link>
        </div>

        {/* BAC — full width, featured */}
        <Link
          href="/parcours-bac"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 p-5 min-h-[140px] flex flex-col justify-end shadow-lg shadow-violet-600/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-600/35"
          style={{ animationDelay: "225ms" }}
        >
          <IlluTrophy />
          <span className="text-lg font-bold text-white drop-shadow-sm">{t("pages.home.bacLabel")}</span>
          <span className="text-sm text-white/80">{t("pages.home.bacDesc")}</span>
        </Link>
      </div>

      {/* ── Outils carousel ───────────────────────────────────────── */}
      <div className="mt-6">
        <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mb-3">
          {t("pages.home.outilsTitle")}
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory scrollbar-none">
          {outils.map((o, i) => (
            <Link
              key={o.href}
              href={o.href}
              className={`flex-shrink-0 w-[140px] rounded-2xl bg-gradient-to-br ${o.gradient} p-4 flex flex-col justify-end min-h-[80px] shadow-md transition-all duration-300 hover:scale-[1.03] snap-start`}
              style={{ animationDelay: `${300 + i * 60}ms` }}
            >
              <span className="text-sm font-bold text-white drop-shadow-sm">{t(o.labelKey)}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Favoris (conditional) ─────────────────────────────────── */}
      {hasFavorites && (
        <div className="mt-6">
          <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mb-3">
            {t("pages.home.favoritesTitle")}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory scrollbar-none">
            {favorites.slice(0, 10).map((slug) => (
              <Link
                key={slug}
                href={`/exercices/${slug}`}
                className="flex-shrink-0 w-[160px] rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md snap-start"
              >
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-2">
                  {slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
                <span className="text-xs text-orange-500 mt-1 block">★</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Themes / Objectifs ────────────────────────────────────── */}
      <div className="mt-6 mb-4">
        <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mb-3">
          {t("pages.home.themesTitle")}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {themes.map((th, i) => (
            <Link
              key={th.href}
              href={th.href}
              className={`rounded-2xl bg-gradient-to-br ${th.gradient} p-4 flex flex-col gap-1 shadow-md transition-all duration-300 hover:scale-[1.02] ${
                i === 2 ? "col-span-2" : ""
              }`}
            >
              <span className="text-2xl">{th.emoji}</span>
              <span className="text-base font-bold text-white drop-shadow-sm">{t(th.labelKey)}</span>
              <span className="text-xs text-white/80">{t(th.descKey)}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
