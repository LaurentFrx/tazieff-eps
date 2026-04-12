"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import Image from "next/image";
import { LocaleLink as Link } from "@/components/LocaleLink";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getFavoritesSnapshot, subscribeFavorites, toggleFavorite } from "@/lib/favoritesStore";
import { ParcoursDashboard } from "@/app/[locale]/parcours-bac/ParcoursDashboard";
import type { LiveExerciseListItem } from "@/lib/live/types";
import logo from "../../../../public/media/branding/logo-eps.webp";

/* ── Tab definitions ──────────────────────────────────────────────── */

type TabId = "bac" | "favoris";

/* ── Favorites list ──────────────────────────────────────────────── */

function FavorisList({ exercises }: { exercises: LiveExerciseListItem[] }) {
  const favorites = useSyncExternalStore(subscribeFavorites, getFavoritesSnapshot, () => [] as string[]);
  const favExercises = useMemo(
    () => exercises.filter((ex) => favorites.includes(ex.slug)),
    [exercises, favorites],
  );

  if (favExercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl mb-3">☆</span>
        <p className="text-sm text-white/50">Aucun favori pour le moment</p>
        <p className="text-xs text-white/30 mt-1">Ajoute des exercices en favoris depuis le catalogue</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {favExercises.map((ex) => (
        <FavoriteRow key={ex.slug} exercise={ex} />
      ))}
    </ul>
  );
}

function FavoriteRow({ exercise }: { exercise: LiveExerciseListItem }) {
  const [errored, setErrored] = useState(false);
  const src = `/images/exos/thumb-${exercise.slug}.webp`;

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-white/5 p-2 pr-3">
      <Link href={`/exercices/${exercise.slug}`} className="flex items-center gap-3 flex-1 min-w-0 tap-feedback">
        <div className="relative w-14 h-14 rounded-xl overflow-hidden ring-1 ring-white/10 flex-none">
          <Image
            src={errored ? logo : src}
            alt={exercise.title}
            fill
            sizes="56px"
            className={`object-cover ${errored ? "grayscale opacity-60" : ""}`}
            onError={() => setErrored(true)}
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{exercise.title}</p>
          <p className="text-xs text-white/40 font-mono uppercase">{exercise.slug.toUpperCase()}</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => toggleFavorite(exercise.slug)}
        className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center text-yellow-400 hover:text-yellow-300 transition-colors"
        aria-label="Retirer des favoris"
      >
        ★
      </button>
    </li>
  );
}

/* ── Main component ──────────────────────────────────────────────── */

type Props = {
  exercises: LiveExerciseListItem[];
};

export function MonParcoursClient({ exercises }: Props) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabId>("bac");

  const tabs: { id: TabId; label: string; color: string }[] = [
    { id: "bac", label: "Parcours BAC", color: "#a855f7" },
    { id: "favoris", label: "Mes favoris", color: "#eab308" },
  ];

  return (
    <div className="flex flex-col gap-0 pb-24">
      {/* ── Sticky tabs bar ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-b border-white/10">
        <div className="flex gap-0">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-3 text-center text-sm font-bold transition-colors min-h-[44px]"
                style={{
                  color: isActive ? tab.color : undefined,
                  borderBottom: isActive ? `3px solid ${tab.color}` : "3px solid transparent",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────── */}
      <div className="px-4 pt-4">
        {activeTab === "bac" && <ParcoursDashboard />}
        {activeTab === "favoris" && <FavorisList exercises={exercises} />}
      </div>
    </div>
  );
}
