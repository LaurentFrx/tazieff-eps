"use client";

import { useMemo } from "react";
import { LocaleLink as Link } from "@/components/LocaleLink";
import Image from "next/image";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useFavorites } from "@/hooks/useFavorites";
import { SEARCH_INDEX } from "@/lib/search/search-index";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import { HomeFlyer } from "@/components/HomeFlyer";
import { HomeSearchBar } from "@/components/HomeSearchBar";

/* ── SVG icons ───────────────────────────────────────────────────── */

function IconDumbbell() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5L17.5 17.5" /><path d="M3.5 10L10 3.5" /><path d="M14 20.5L20.5 14" /><path d="M2 11.5l1.5-1.5" /><path d="M20.5 13L22 11.5" /><path d="M11.5 2L13 3.5" /><path d="M3.5 20.5L5 19" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h6" /><path d="M9 11h6" /><path d="M9 15h4" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" /><path d="M8 7h8" /><path d="M8 11h5" />
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" /><path d="M18 2H6v7a6 6 0 1012 0V2z" />
    </svg>
  );
}

function IconTimer() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M5 3l2 2" /><path d="M19 3l-2 2" /><path d="M12 5V3" />
    </svg>
  );
}

function IconCalculateur() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="8" y2="10.01" /><line x1="12" y1="10" x2="12" y2="10.01" /><line x1="16" y1="10" x2="16" y2="10.01" /><line x1="8" y1="14" x2="8" y2="14.01" /><line x1="12" y1="14" x2="12" y2="14.01" /><line x1="16" y1="14" x2="16" y2="14.01" /><line x1="8" y1="18" x2="16" y2="18" />
    </svg>
  );
}

function IconCarnet() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" /><path d="M8 7h8" /><path d="M8 11h6" />
    </svg>
  );
}

function IconHeartbeat() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l3-9 4 18 3-9h4" />
    </svg>
  );
}

function IconBarbell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5L17.5 17.5" /><path d="M3.5 10L10 3.5" /><path d="M14 20.5L20.5 14" /><path d="M2 11.5l1.5-1.5" /><path d="M20.5 13L22 11.5" />
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

/* ── Starter exercises (when no favorites) ───────────────────────── */

const STARTER_SLUGS = ["s1-01", "s2-01", "s3-01"];

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

  const starterExercises = useMemo(
    () => STARTER_SLUGS.map((slug) => ({
      slug,
      title: slugMap.get(slug)?.title ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    })).filter((e) => slugMap.has(e.slug)),
    [slugMap],
  );

  return (
    <section className="page">
      <OnboardingBanner />

      {/* ── ZONE 1 : Hero compact ──────────────────────────────────── */}
      <HomeFlyer />

      {/* Search bar */}
      <HomeSearchBar />

      {/* ── ZONE 2 : Accès rapide — grille 2×2 ────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Exercices */}
        <Link
          href="/exercices"
          className="group relative overflow-hidden rounded-2xl p-4 min-h-[130px] flex flex-col justify-between shadow-lg transition-all duration-300 hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #f97316, #f59e0b)" }}
        >
          <div className="absolute top-3 right-3 text-white/20"><IconDumbbell /></div>
          <span className="text-3xl font-black text-white">{exerciseCount}</span>
          <div>
            <span className="text-sm font-bold text-white">{t("pages.home.exercicesLabel")}</span>
            <span className="block text-[11px] text-white/70">{t("pages.home.exercicesDesc")}</span>
          </div>
        </Link>

        {/* Méthodes */}
        <Link
          href="/methodes"
          className="group relative overflow-hidden rounded-2xl p-4 min-h-[130px] flex flex-col justify-between shadow-lg transition-all duration-300 hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
        >
          <div className="absolute top-3 right-3 text-white/20"><IconClipboard /></div>
          <span className="text-3xl font-black text-white">{methodeCount}</span>
          <div>
            <span className="text-sm font-bold text-white">{t("pages.home.methodesLabel")}</span>
            <span className="block text-[11px] text-white/70">{t("pages.home.methodesDesc")}</span>
          </div>
        </Link>

        {/* Apprendre */}
        <Link
          href="/apprendre"
          className="group relative overflow-hidden rounded-2xl p-4 min-h-[130px] flex flex-col justify-between shadow-lg transition-all duration-300 hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)" }}
        >
          <div className="absolute top-3 right-3 text-white/20"><IconBook /></div>
          <span className="text-3xl font-black text-white">{learnCount}</span>
          <div>
            <span className="text-sm font-bold text-white">{t("pages.home.apprendreLabel")}</span>
            <span className="block text-[11px] text-white/70">{t("pages.home.apprendreDesc")}</span>
          </div>
        </Link>

        {/* Mon BAC */}
        <Link
          href="/parcours-bac"
          className="group relative overflow-hidden rounded-2xl p-4 min-h-[130px] flex flex-col justify-between shadow-lg transition-all duration-300 hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #7c3aed, #d946ef)" }}
        >
          <div className="absolute top-3 right-3 text-white/20"><IconTrophy /></div>
          <div className="flex-1" />
          <div>
            <span className="text-sm font-bold text-white">{t("pages.home.bacLabel")}</span>
            <span className="block text-[11px] text-white/70">{t("pages.home.bacDesc")}</span>
          </div>
        </Link>
      </div>

      {/* ── ZONE 3 : Favoris ou "Pour bien commencer" ──────────────── */}
      <div>
        <h2 className="text-base font-extrabold text-[color:var(--ink)] mb-3">
          {hasFavorites ? t("pages.home.favoritesTitle") : t("pages.home.startTitle")}
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory scrollbar-none">
          {(hasFavorites ? validFavorites.slice(0, 10) : starterExercises).map((item) => {
            const slug = typeof item === "string" ? item : item.slug;
            const entry = slugMap.get(slug);
            const title = typeof item === "string"
              ? (entry?.title ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
              : item.title;
            return (
              <Link
                key={slug}
                href={`/exercices/${slug}`}
                className="flex-shrink-0 w-36 rounded-xl overflow-hidden border border-white/10 bg-white/5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md snap-start"
              >
                <div className="relative w-full aspect-video bg-zinc-800">
                  <Image
                    src={`/images/exos/thumb169-${slug}.webp`}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="144px"
                  />
                </div>
                <div className="p-2">
                  <span className="text-[10px] font-mono text-orange-400 uppercase">{slug}</span>
                  <p className="text-xs font-medium text-[color:var(--ink)] line-clamp-2">{title}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── ZONE 4 : Thèmes de Fred ────────────────────────────────── */}
      <div>
        <h2 className="text-base font-extrabold text-[color:var(--ink)] mb-3">
          {t("pages.home.themesTitle")}
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <Link
            href="/objectifs/endurance-de-force"
            className="rounded-xl p-3 flex flex-col items-center gap-1.5 text-center shadow-md transition-all duration-300 hover:scale-[1.03]"
            style={{ background: "linear-gradient(135deg, #059669, #34d399)" }}
          >
            <span className="text-white/60"><IconHeartbeat /></span>
            <span className="text-xs font-bold text-white leading-tight">{t("pages.home.themeEndurance")}</span>
          </Link>
          <Link
            href="/objectifs/gain-de-volume"
            className="rounded-xl p-3 flex flex-col items-center gap-1.5 text-center shadow-md transition-all duration-300 hover:scale-[1.03]"
            style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
          >
            <span className="text-white/60"><IconBarbell /></span>
            <span className="text-xs font-bold text-white leading-tight">{t("pages.home.themeVolume")}</span>
          </Link>
          <Link
            href="/objectifs/gain-de-puissance"
            className="rounded-xl p-3 flex flex-col items-center gap-1.5 text-center shadow-md transition-all duration-300 hover:scale-[1.03]"
            style={{ background: "linear-gradient(135deg, #f97316, #ef4444)" }}
          >
            <span className="text-white/60"><IconBolt /></span>
            <span className="text-xs font-bold text-white leading-tight">{t("pages.home.themePuissance")}</span>
          </Link>
        </div>
      </div>

      {/* ── ZONE 5 : Outils ────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-extrabold text-[color:var(--ink)] mb-3">
          {t("pages.home.outilsTitle")}
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <Link
            href="/outils/calculateur-rm"
            className="rounded-xl p-3 flex flex-col items-center gap-1.5 text-center border border-white/10 bg-white/5 transition-all duration-300 hover:bg-white/10"
          >
            <span className="text-cyan-400"><IconCalculateur /></span>
            <span className="text-[11px] font-semibold text-[color:var(--ink)]">{t("pages.home.outilCalculateur")}</span>
          </Link>
          <Link
            href="/outils/timer"
            className="rounded-xl p-3 flex flex-col items-center gap-1.5 text-center border border-white/10 bg-white/5 transition-all duration-300 hover:bg-white/10"
          >
            <span className="text-amber-400"><IconTimer /></span>
            <span className="text-[11px] font-semibold text-[color:var(--ink)]">{t("pages.home.outilTimer")}</span>
          </Link>
          <Link
            href="/outils/carnet"
            className="rounded-xl p-3 flex flex-col items-center gap-1.5 text-center border border-white/10 bg-white/5 transition-all duration-300 hover:bg-white/10"
          >
            <span className="text-violet-400"><IconCarnet /></span>
            <span className="text-[11px] font-semibold text-[color:var(--ink)]">{t("pages.home.outilCarnet")}</span>
          </Link>
        </div>
      </div>

      {/* ── Share ──────────────────────────────────────────────────── */}
      <div className="text-center pb-4">
        <Link
          href="/partager"
          className="inline-flex items-center gap-1.5 text-sm text-pink-400 hover:text-pink-300 font-medium transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <circle cx="13" cy="4.5" r="2.5" /><circle cx="5" cy="10" r="2.5" /><circle cx="13" cy="15.5" r="2.5" />
            <path d="M7.2 8.8l5.6-3.1M7.2 11.2l5.6 3.1" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
          {t("pages.home.shareApp")}
        </Link>
      </div>

      {/* ── Footer légal ─────────────────────────────────────────── */}
      <div className="text-center pb-6 pt-2">
        <nav className="inline-flex gap-2 text-[11px] text-zinc-500">
          <a href="/legal/mentions-legales" className="hover:text-zinc-400 transition-colors">Mentions l&eacute;gales</a>
          <span aria-hidden="true">&middot;</span>
          <a href="/legal/confidentialite" className="hover:text-zinc-400 transition-colors">Confidentialit&eacute;</a>
          <span aria-hidden="true">&middot;</span>
          <a href="/legal/cgu" className="hover:text-zinc-400 transition-colors">CGU</a>
        </nav>
      </div>
    </section>
  );
}
