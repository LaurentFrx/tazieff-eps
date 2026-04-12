"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import Image from "next/image";
import { LocaleLink as Link } from "@/components/LocaleLink";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getFavoritesSnapshot, subscribeFavorites } from "@/lib/favoritesStore";
import type { SessionDef } from "./page";
import type { LiveExerciseListItem } from "@/lib/live/types";
import logo from "../../../public/media/branding/logo-eps.webp";

/* ── LocalStorage key for last selected session ──────────────────── */

const SESSION_KEY = "eps_active_session";

function getStoredSession(): string {
  if (typeof window === "undefined") return "s1";
  return localStorage.getItem(SESSION_KEY) ?? "s1";
}

function setStoredSession(id: string) {
  localStorage.setItem(SESSION_KEY, id);
}

/* ── Greetings ───────────────────────────────────────────────────── */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

/* ── Difficulty labels ───────────────────────────────────────────── */

const LEVEL_LABELS: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

const LEVEL_COLORS: Record<string, string> = {
  debutant: "bg-green-500/20 text-green-400",
  intermediaire: "bg-amber-500/20 text-amber-400",
  avance: "bg-rose-500/20 text-rose-400",
};

/* ── Exercise thumbnail ──────────────────────────────────────────── */

function ExoThumb({ exercise }: { exercise: LiveExerciseListItem }) {
  const [errored, setErrored] = useState(false);
  const src = `/images/exos/thumb-${exercise.slug}.webp`;

  return (
    <Link
      href={`/exercices/${exercise.slug}`}
      className="flex-none w-[130px] snap-start"
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden ring-1 ring-white/10 bg-zinc-800">
        <Image
          src={errored ? logo : src}
          alt={exercise.title}
          fill
          sizes="130px"
          className={`object-cover ${errored ? "grayscale opacity-60" : ""}`}
          onError={() => setErrored(true)}
        />
      </div>
      <p className="mt-1.5 text-[11px] font-semibold text-white/80 leading-tight line-clamp-2">
        <span className="font-mono text-orange-400 uppercase">{exercise.slug.toUpperCase()}</span>{" "}
        {exercise.title}
      </p>
    </Link>
  );
}

/* ── Favorites carousel ──────────────────────────────────────────── */

function FavoritesBar({ exercises }: { exercises: LiveExerciseListItem[] }) {
  const favorites = useSyncExternalStore(subscribeFavorites, getFavoritesSnapshot, () => [] as string[]);
  const favExercises = useMemo(
    () => exercises.filter((ex) => favorites.includes(ex.slug)),
    [exercises, favorites],
  );

  if (favExercises.length === 0) return null;

  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2 px-1">
        ★ Mes favoris
      </h3>
      <div className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2">
        {favExercises.map((ex) => (
          <ExoThumb key={ex.slug} exercise={ex} />
        ))}
      </div>
    </section>
  );
}

/* ── Main component ──────────────────────────────────────────────── */

type Props = {
  sessions: SessionDef[];
  sessionExercises: Record<string, LiveExerciseListItem[]>;
};

export function MaSeanceClient({ sessions, sessionExercises }: Props) {
  const { t } = useI18n();
  const [activeSession, setActiveSession] = useState(getStoredSession);

  const currentSession = sessions.find((s) => s.id === activeSession) ?? sessions[0];
  const currentExercises = sessionExercises[currentSession.id] ?? [];
  const allExercises = useMemo(() => Object.values(sessionExercises).flat(), [sessionExercises]);

  const handleSelectSession = (id: string) => {
    setActiveSession(id);
    setStoredSession(id);
  };

  return (
    <div className="flex flex-col gap-6 px-4 pt-4 pb-28">
      {/* ─── A. EN-TÊTE ─── */}
      <header>
        <h1 className="text-2xl font-bold text-white">
          {getGreeting()} <span className="text-orange-400">!</span>
        </h1>
        <p className="text-sm text-white/50 mt-0.5">{t("nav.maSeance.label")}</p>
      </header>

      {/* ─── B. SÉANCE EN COURS ─── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{currentSession.icon}</span>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white truncate">{currentSession.titleKey}</h2>
            <p className="text-xs text-white/40">
              {currentExercises.length} exercices
              <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${LEVEL_COLORS[currentSession.level]}`}>
                {LEVEL_LABELS[currentSession.level]}
              </span>
            </p>
          </div>
          <Link
            href={currentExercises[0] ? `/exercices/${currentExercises[0].slug}` : "/exercices"}
            className="shrink-0 rounded-full px-5 py-2.5 text-sm font-bold text-white min-h-[44px] flex items-center"
            style={{ background: currentSession.color }}
          >
            Commencer
          </Link>
        </div>

        {/* Carousel horizontal d'exercices */}
        <div className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-1">
          {currentExercises.map((ex) => (
            <ExoThumb key={ex.slug} exercise={ex} />
          ))}
        </div>
      </section>

      {/* ─── C. CHOISIR UNE SÉANCE (grille 2×3) ─── */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3 px-1">
          Choisir une séance
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {sessions.map((s) => {
            const isActive = s.id === activeSession;
            const count = (sessionExercises[s.id] ?? []).length;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectSession(s.id)}
                className="flex flex-col gap-1.5 rounded-2xl p-3 text-left transition-all min-h-[44px]"
                style={{
                  background: isActive ? `${s.color}22` : "rgba(255,255,255,0.04)",
                  border: isActive ? `2px solid ${s.color}` : "2px solid transparent",
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-xs font-bold text-white/70 uppercase">{s.id.toUpperCase()}</span>
                </div>
                <p className="text-[11px] font-semibold text-white/80 leading-tight">
                  {s.titleKey.replace(/^S\d — /, "")}
                </p>
                <div className="flex items-center gap-2 mt-auto">
                  <span className="text-[10px] text-white/40">{count} exos</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${LEVEL_COLORS[s.level]}`}>
                    {LEVEL_LABELS[s.level]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── D. ACCÈS RAPIDE ─── */}
      <FavoritesBar exercises={allExercises} />

      <div className="flex gap-3">
        <Link
          href="/outils/timer"
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 min-h-[44px] text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          Timer
        </Link>
        <Link
          href="/explorer"
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 min-h-[44px] text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          Rechercher
        </Link>
      </div>
    </div>
  );
}
