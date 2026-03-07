"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useFavorites } from "@/hooks/useFavorites";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import { IlluDumbbell, IlluClipboard, IlluBook, IlluTrophy } from "@/components/illustrations";
import { HomeFlyer } from "@/components/HomeFlyer";

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

      {/* ── Flyer hero + greeting ─────────────────────────────────── */}
      <HomeFlyer greeting={greeting || undefined} />

      {/* ── Main navigation cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {/* EXERCICES — full width, featured */}
        <Link
          href="/exercices"
          className="col-span-2 md:col-span-4 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 p-5 min-h-[140px] flex flex-col justify-end shadow-lg shadow-orange-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/35"
          style={{ animationDelay: "0ms" }}
        >
          <IlluDumbbell />
          <span className="text-4xl font-black text-white drop-shadow-sm">{exerciseCount}</span>
          <span className="text-lg font-bold text-white drop-shadow-sm">{t("pages.home.exercicesLabel")}</span>
          <span className="text-sm text-white/80">{t("pages.home.exercicesDesc")}</span>
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

        {/* BAC — full width, featured */}
        <Link
          href="/parcours-bac"
          className="col-span-2 md:col-span-4 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 p-5 min-h-[140px] flex flex-col justify-end shadow-lg shadow-violet-600/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-600/35"
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
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory scrollbar-none md:grid md:grid-cols-4 md:overflow-visible md:mx-0 md:px-0 md:pb-0">
          {outils.map((o, i) => (
            <Link
              key={o.href}
              href={o.href}
              className={`flex-shrink-0 w-[140px] md:w-auto rounded-2xl bg-gradient-to-br ${o.gradient} p-4 flex flex-col justify-end min-h-[80px] shadow-md transition-all duration-300 hover:scale-[1.03] snap-start`}
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {themes.map((th) => (
            <Link
              key={th.href}
              href={th.href}
              className={`rounded-2xl bg-gradient-to-br ${th.gradient} p-4 flex flex-col gap-1 shadow-md transition-all duration-300 hover:scale-[1.02] last:col-span-2 last:md:col-span-1`}
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
