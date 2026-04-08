"use client";

import { useEffect, useMemo, useState } from "react";
import { LocaleLink as Link } from "@/components/LocaleLink";
import Image from "next/image";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useFavorites } from "@/hooks/useFavorites";
import { SEARCH_INDEX } from "@/lib/search/search-index";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import { HomeFlyer } from "@/components/HomeFlyer";
import { HomeSearchBar } from "@/components/HomeSearchBar";
import { HomeJsonLd } from "@/components/seo/HomeJsonLd";
import { useReveal } from "@/hooks/useReveal";
import { useCountUp } from "@/hooks/useCountUp";

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

  // --- Reveal hooks ---
  const [flyerRef, flyerVisible] = useReveal(0.1);
  const [searchRef, searchVisible] = useReveal();
  const [gridRef, gridVisible] = useReveal();
  const [starterRef, starterVisible] = useReveal();
  const [themesRef, themesVisible] = useReveal();
  const [outilsRef, outilsVisible] = useReveal();
  const [footerRef, footerVisible] = useReveal();

  // --- Count-up hooks ---
  const exoCount = useCountUp(exerciseCount, gridVisible, 1000);
  const metCount = useCountUp(methodeCount, gridVisible, 1000);
  const lrnCount = useCountUp(learnCount, gridVisible, 1000);

  // --- Entrance animation (once per session) ---
  const [showEntrance, setShowEntrance] = useState(false);
  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    if (!sessionStorage.getItem("homeAnimPlayed")) {
      setShowEntrance(true);
      sessionStorage.setItem("homeAnimPlayed", "1");
    }
  }, []);

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
      <HomeJsonLd />
      <OnboardingBanner />

      {/* ── ZONE 1 : Hero compact ──────────────────────────────────── */}
      <div
        ref={flyerRef as React.RefObject<HTMLDivElement>}
        className={`reveal-section${flyerVisible ? ' is-visible' : ''}`}
        style={{ transitionDuration: "0.8s" }}
      >
        <HomeFlyer />
      </div>

      {/* Search bar */}
      <div
        ref={searchRef as React.RefObject<HTMLDivElement>}
        className={`reveal-section${searchVisible ? ' is-visible' : ''}`}
        style={{ transitionDelay: "100ms" }}
      >
        <HomeSearchBar />
      </div>

      {/* ── ZONE 2 : Accès rapide — grille 2×2 ────────────────────── */}
      <div ref={gridRef as React.RefObject<HTMLDivElement>} className="grid grid-cols-2 gap-3">
        {/* Exercices */}
        <Link
          href="/exercices"
          className={`tap-feedback reveal-section group relative overflow-hidden rounded-2xl p-4 min-h-[130px] flex flex-col justify-between shadow-lg${gridVisible ? ' is-visible' : ''}`}
          style={{ background: "linear-gradient(135deg, #f97316, #f59e0b)", transitionDelay: "0ms" }}
        >
          <div className="absolute top-3 right-3 text-white/20"><IconDumbbell /></div>
          <span className="text-3xl font-black text-white">{exoCount}</span>
          <div>
            <span className="text-sm font-bold text-white">{t("pages.home.exercicesLabel")}</span>
            <span className="block text-[11px] text-white/90">{t("pages.home.exercicesDesc")}</span>
          </div>
        </Link>

        {/* Méthodes */}
        <Link
          href="/methodes"
          className={`tap-feedback reveal-section group relative overflow-hidden rounded-2xl p-4 min-h-[130px] flex flex-col justify-between shadow-lg${gridVisible ? ' is-visible' : ''}`}
          style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", transitionDelay: "80ms" }}
        >
          <div className="absolute top-3 right-3 text-white/20"><IconClipboard /></div>
          <span className="text-3xl font-black text-white">{metCount}</span>
          <div>
            <span className="text-sm font-bold text-white">{t("pages.home.methodesLabel")}</span>
            <span className="block text-[11px] text-white/90">{t("pages.home.methodesDesc")}</span>
          </div>
        </Link>

        {/* Apprendre */}
        <Link
          href="/apprendre"
          className={`tap-feedback reveal-section group relative overflow-hidden rounded-2xl p-4 min-h-[130px] flex flex-col justify-between shadow-lg${gridVisible ? ' is-visible' : ''}`}
          style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)", transitionDelay: "160ms" }}
        >
          <div className="absolute top-3 right-3 text-white/20"><IconBook /></div>
          <span className="text-3xl font-black text-white">{lrnCount}</span>
          <div>
            <span className="text-sm font-bold text-white">{t("pages.home.apprendreLabel")}</span>
            <span className="block text-[11px] text-white/90">{t("pages.home.apprendreDesc")}</span>
          </div>
        </Link>

        {/* Mon BAC */}
        <Link
          href="/parcours-bac"
          className={`tap-feedback reveal-section group relative overflow-hidden rounded-2xl p-4 min-h-[130px] flex flex-col justify-between shadow-lg${gridVisible ? ' is-visible' : ''}`}
          style={{ background: "linear-gradient(135deg, #7c3aed, #d946ef)", transitionDelay: "240ms" }}
        >
          <div className="absolute top-3 right-3 text-white/20"><IconTrophy /></div>
          <div className="flex-1" />
          <div>
            <span className="text-sm font-bold text-white">{t("pages.home.bacLabel")}</span>
            <span className="block text-[11px] text-white/90">{t("pages.home.bacDesc")}</span>
          </div>
        </Link>
      </div>

      {/* ── ZONE 3 : Favoris ou "Pour bien commencer" ──────────────── */}
      <div ref={starterRef as React.RefObject<HTMLDivElement>}>
        <h2 className={`reveal-section text-base font-extrabold text-[color:var(--ink)] mb-3${starterVisible ? ' is-visible' : ''}`}>
          {hasFavorites ? t("pages.home.favoritesTitle") : t("pages.home.startTitle")}
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory scrollbar-none">
          {(hasFavorites ? validFavorites.slice(0, 10) : starterExercises).map((item, i) => {
            const slug = typeof item === "string" ? item : item.slug;
            const entry = slugMap.get(slug);
            const title = typeof item === "string"
              ? (entry?.title ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
              : item.title;
            return (
              <Link
                key={slug}
                href={`/exercices/${slug}`}
                className={`reveal-step tap-feedback flex-shrink-0 w-36 rounded-xl overflow-hidden border border-white/10 bg-white/5 shadow-sm snap-start${starterVisible ? ' is-visible' : ''}`}
                style={{ transform: starterVisible ? "none" : "translateX(-20px)", transitionDelay: `${i * 100}ms` }}
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

      {/* ── ZONE 4 : Thèmes d'entraînement ─────────────────────────── */}
      <div ref={themesRef as React.RefObject<HTMLDivElement>}>
        <h2 className={`reveal-section text-base font-extrabold text-[color:var(--ink)] mb-3${themesVisible ? ' is-visible' : ''}`}>
          {t("pages.home.themesTitle")}
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <Link
            href="/objectifs/endurance-de-force"
            className={`reveal-section tap-feedback rounded-xl p-3 flex flex-col items-center gap-1.5 text-center shadow-md${themesVisible ? ' is-visible' : ''}`}
            style={{ background: "linear-gradient(135deg, #059669, #34d399)", transitionDelay: "0ms", boxShadow: undefined }}
            onPointerEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(52, 211, 153, 0.3)"; }}
            onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
          >
            <span className="text-white/60"><IconHeartbeat /></span>
            <span className="text-xs font-bold text-white leading-tight">{t("pages.home.themeEndurance")}</span>
          </Link>
          <Link
            href="/objectifs/gain-de-volume"
            className={`reveal-section tap-feedback rounded-xl p-3 flex flex-col items-center gap-1.5 text-center shadow-md${themesVisible ? ' is-visible' : ''}`}
            style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", transitionDelay: "80ms" }}
            onPointerEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(99, 102, 241, 0.3)"; }}
            onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
          >
            <span className="text-white/60"><IconBarbell /></span>
            <span className="text-xs font-bold text-white leading-tight">{t("pages.home.themeVolume")}</span>
          </Link>
          <Link
            href="/objectifs/gain-de-puissance"
            className={`reveal-section tap-feedback rounded-xl p-3 flex flex-col items-center gap-1.5 text-center shadow-md${themesVisible ? ' is-visible' : ''}`}
            style={{ background: "linear-gradient(135deg, #f97316, #ef4444)", transitionDelay: "160ms" }}
            onPointerEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(249, 115, 22, 0.3)"; }}
            onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
          >
            <span className="text-white/60"><IconBolt /></span>
            <span className="text-xs font-bold text-white leading-tight">{t("pages.home.themePuissance")}</span>
          </Link>
        </div>
      </div>

      {/* ── ZONE 5 : Outils ────────────────────────────────────────── */}
      <div ref={outilsRef as React.RefObject<HTMLDivElement>}>
        <h2 className={`reveal-section text-base font-extrabold text-[color:var(--ink)] mb-3${outilsVisible ? ' is-visible' : ''}`}>
          {t("pages.home.outilsTitle")}
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <Link
            href="/outils/calculateur-rm"
            className={`reveal-section tap-feedback rounded-xl p-3 flex flex-col items-center gap-1.5 text-center border border-white/10 bg-white/5${outilsVisible ? ' is-visible' : ''}`}
            style={{ transitionDelay: "0ms" }}
          >
            <span className="text-cyan-400"><IconCalculateur /></span>
            <span className="text-[11px] font-semibold text-[color:var(--ink)]">{t("pages.home.outilCalculateur")}</span>
          </Link>
          <Link
            href="/outils/timer"
            className={`reveal-section tap-feedback rounded-xl p-3 flex flex-col items-center gap-1.5 text-center border border-white/10 bg-white/5${outilsVisible ? ' is-visible' : ''}`}
            style={{ transitionDelay: "80ms" }}
          >
            <span className="text-amber-400"><IconTimer /></span>
            <span className="text-[11px] font-semibold text-[color:var(--ink)]">{t("pages.home.outilTimer")}</span>
          </Link>
          <Link
            href="/outils/carnet"
            className={`reveal-section tap-feedback rounded-xl p-3 flex flex-col items-center gap-1.5 text-center border border-white/10 bg-white/5${outilsVisible ? ' is-visible' : ''}`}
            style={{ transitionDelay: "160ms" }}
          >
            <span className="text-violet-400"><IconCarnet /></span>
            <span className="text-[11px] font-semibold text-[color:var(--ink)]">{t("pages.home.outilCarnet")}</span>
          </Link>
        </div>
      </div>

      {/* ── Share ──────────────────────────────────────────────────── */}
      <div ref={footerRef as React.RefObject<HTMLDivElement>} className={`reveal-section text-center pb-4${footerVisible ? ' is-visible' : ''}`}>
        <Link
          href="/partager"
          className="tap-feedback inline-flex items-center gap-1.5 text-sm text-pink-400 hover:text-pink-300 font-medium transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <circle cx="13" cy="4.5" r="2.5" /><circle cx="5" cy="10" r="2.5" /><circle cx="13" cy="15.5" r="2.5" />
            <path d="M7.2 8.8l5.6-3.1M7.2 11.2l5.6 3.1" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
          {t("pages.home.shareApp")}
        </Link>
      </div>

      {/* ── Footer légal ─────────────────────────────────────────── */}
      <div className={`reveal-section text-center pb-6 pt-2${footerVisible ? ' is-visible' : ''}`} style={{ transitionDelay: "100ms" }}>
        <nav className="inline-flex gap-2 text-[11px] text-zinc-500">
          <a href="/legal/mentions-legales" className="tap-feedback hover:text-zinc-400 transition-colors">Mentions l&eacute;gales</a>
          <span aria-hidden="true">&middot;</span>
          <a href="/legal/confidentialite" className="tap-feedback hover:text-zinc-400 transition-colors">Confidentialit&eacute;</a>
          <span aria-hidden="true">&middot;</span>
          <a href="/legal/cgu" className="tap-feedback hover:text-zinc-400 transition-colors">CGU</a>
        </nav>
      </div>
    </section>
  );
}
