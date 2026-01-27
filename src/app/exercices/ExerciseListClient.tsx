"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { ExerciseCard } from "@/components/ExerciseCard";
import { Chips } from "@/components/Chips";
import type { ExerciseFrontmatter } from "@/lib/content/schema";
import {
  getTheme,
  onThemeChange,
  type ThemePreference,
} from "@/lib/storage";
import {
  EMPTY_FAVORITES_SERVER_SNAPSHOT,
  getFavoritesSnapshot,
  subscribeFavorites,
} from "@/lib/favoritesStore";

type ExerciseListClientProps = {
  exercises: ExerciseFrontmatter[];
};

export function ExerciseListClient({ exercises }: ExerciseListClientProps) {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyCompatible, setOnlyCompatible] = useState(false);
  const favorites = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    () => EMPTY_FAVORITES_SERVER_SNAPSHOT,
  );
  const theme = useSyncExternalStore<ThemePreference>(
    (callback) => onThemeChange(() => callback()),
    getTheme,
    () => 1 as ThemePreference,
  );

  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    exercises.forEach((exercise) => {
      const muscles = [
        ...exercise.musclesPrimary,
        ...(exercise.musclesSecondary ?? []),
      ];
      muscles.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, "fr"));
  }, [exercises]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return exercises.filter((exercise) => {
      if (onlyFavorites && !favorites.includes(exercise.slug)) {
        return false;
      }

      const themeKey = `t${theme}` as const;
      if (onlyCompatible && !exercise.themes.includes(themeKey)) {
        return false;
      }

      if (selectedTags.length > 0) {
        const muscleTags = [
          ...exercise.musclesPrimary,
          ...(exercise.musclesSecondary ?? []),
        ];
        const hasTag = selectedTags.some((tag) => muscleTags.includes(tag));
        if (!hasTag) {
          return false;
        }
      }

      if (!normalizedQuery) {
        return true;
      }

      const muscleTags = [
        ...exercise.musclesPrimary,
        ...(exercise.musclesSecondary ?? []),
      ];
      const haystack = `${exercise.title} ${muscleTags.join(" ")}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [exercises, favorites, onlyCompatible, onlyFavorites, query, selectedTags, theme]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  };

  return (
    <div className="stack-lg">
      <div className="filter-panel">
        <input
          className="field-input"
          type="search"
          placeholder="Rechercher un exercice"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="chip-row">
          <button
            type="button"
            className={`chip${onlyFavorites ? " is-active" : ""}`}
            onClick={() => setOnlyFavorites((prev) => !prev)}
          >
            Favoris
          </button>
          <button
            type="button"
            className={`chip${onlyCompatible ? " is-active" : ""}`}
            onClick={() => setOnlyCompatible((prev) => !prev)}
          >
            Compatibles thème T{theme}
          </button>
          <button
            type="button"
            className="chip chip-clear"
            onClick={() => {
              setQuery("");
              setSelectedTags([]);
              setOnlyFavorites(false);
              setOnlyCompatible(false);
            }}
          >
            Réinitialiser
          </button>
        </div>
        <Chips
          label="Muscles"
          items={tags}
          activeItems={selectedTags}
          onToggle={toggleTag}
          onClear={() => setSelectedTags([])}
        />
      </div>

      <p className="text-sm text-[color:var(--muted)]">
        {filtered.length} exercice{filtered.length > 1 ? "s" : ""} trouvé
        {filtered.length > 1 ? "s" : ""}
      </p>

      <div className="card-grid">
        {filtered.length === 0 ? (
          <div className="card">
            <h2>Aucun exercice ne correspond</h2>
            <p>Ajustez vos filtres ou vos mots-clés.</p>
          </div>
        ) : (
          filtered.map((exercise) => (
            <Link key={exercise.slug} href={`/exercices/${exercise.slug}`}>
              <article className="card">
                <ExerciseCard exercise={exercise} />
                <div className="chip-row chip-row--compact">
                  {Array.from(
                    new Set([
                      ...exercise.musclesPrimary,
                      ...(exercise.musclesSecondary ?? []),
                    ]),
                  )
                    .slice(0, 3)
                    .map((tag, index) => (
                      <span key={`${tag}-${index}`} className="chip">
                        {tag}
                      </span>
                    ))}
                  <span className="chip chip-ghost">
                    Thèmes {exercise.themes.map((value) => value.toUpperCase()).join(", ")}
                  </span>
                </div>
              </article>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
