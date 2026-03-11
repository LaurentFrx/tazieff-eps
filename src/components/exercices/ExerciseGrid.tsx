"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ExerciseCard } from "@/components/ExerciseCard";
import type { ExerciseListItem } from "@/lib/exercices/filters";
import { toggleFavorite } from "@/lib/favoritesStore";
import { useI18n } from "@/lib/i18n/I18nProvider";

const SESSION_ORDER = ["S1", "S2", "S3", "S4", "S5", "S6"] as const;

function getSession(slug: string): string {
  const match = slug.match(/^s(\d+)-/);
  return match ? `S${match[1]}` : "Other";
}

function slugSort(a: string, b: string): number {
  const ma = a.match(/^s(\d+)-(\d+)/);
  const mb = b.match(/^s(\d+)-(\d+)/);
  if (!ma && !mb) return a.localeCompare(b);
  if (!ma) return 1;
  if (!mb) return -1;
  const sa = Number(ma[1]);
  const sb = Number(mb[1]);
  if (sa !== sb) return sa - sb;
  return Number(ma[2]) - Number(mb[2]);
}

// ---------------------------------------------------------------------------
// ViewMode type
// ---------------------------------------------------------------------------

export type ViewMode = "grid" | "list";

// ---------------------------------------------------------------------------
// FavoriteIconButton (internal)
// ---------------------------------------------------------------------------

type FavoriteIconButtonProps = {
  slug: string;
  active: boolean;
  variant?: "overlay" | "inline";
};

function FavoriteIconButton({
  slug,
  active,
  variant = "inline",
}: FavoriteIconButtonProps) {
  const variantClass =
    variant === "overlay"
      ? "border-transparent bg-black/35 text-white/70 backdrop-blur ring-1 ring-white/10"
      : "border-transparent bg-black/40 text-white/70 backdrop-blur ring-1 ring-white/15";
  const { t } = useI18n();
  const label = active ? t("favorites.remove") : t("favorites.add");

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-full border p-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)] ${variantClass}`}
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(slug);
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className={`h-4 w-4 ${active ? "text-yellow-400" : "text-white/70"}`}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M10 2.2l2.2 4.46 4.93.72-3.56 3.47.84 4.91L10 13.9l-4.41 2.32.84-4.91-3.56-3.47 4.93-.72L10 2.2z" />
      </svg>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Session group type
// ---------------------------------------------------------------------------

type SessionGroup = { session: string; items: ExerciseListItem[] };

// ---------------------------------------------------------------------------
// ExerciseGrid — main exported component
// ---------------------------------------------------------------------------

export type ExerciseGridProps = {
  exercises: ExerciseListItem[];
  favorites: string[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
};

export function ExerciseGrid({
  exercises,
  favorites,
  viewMode,
  onViewModeChange,
}: ExerciseGridProps) {
  const { t } = useI18n();

  const activeClass = "border-white/20 bg-[color:var(--bg-2)] text-[color:var(--ink)] opacity-100 ring-1 ring-white/30";
  const inactiveClass = "border-transparent text-[color:var(--muted)] opacity-60 hover:opacity-100";

  // Sort exercises by session then by number, then group by session
  const sessionGroups = useMemo((): SessionGroup[] => {
    const sorted = [...exercises].sort((a, b) => slugSort(a.slug, b.slug));
    const groups = new Map<string, ExerciseListItem[]>();
    for (const ex of sorted) {
      const session = getSession(ex.slug);
      if (!groups.has(session)) groups.set(session, []);
      groups.get(session)!.push(ex);
    }
    const orderedSessions = [...SESSION_ORDER.filter((s) => groups.has(s))];
    if (groups.has("Other")) orderedSessions.push("Other" as any);
    return orderedSessions.map((s) => ({ session: s, items: groups.get(s)! }));
  }, [exercises]);

  return (
    <>
      {/* Toolbar: count + view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[color:var(--muted)]">
          {exercises.length}{" "}
          {t(exercises.length === 1 ? "exerciseGrid.countSingular" : "exerciseGrid.countPlural")}
        </p>
        <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[color:var(--card)] p-1">
          <button
            type="button"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)] ${
              viewMode === "grid" ? activeClass : inactiveClass
            }`}
            aria-pressed={viewMode === "grid"}
            aria-label={t("exerciseGrid.gridView")}
            title={t("exerciseGrid.gridView")}
            onClick={() => onViewModeChange("grid")}
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
              <rect x="3" y="3" width="6" height="6" rx="1.5" />
              <rect x="11" y="3" width="6" height="6" rx="1.5" />
              <rect x="3" y="11" width="6" height="6" rx="1.5" />
              <rect x="11" y="11" width="6" height="6" rx="1.5" />
            </svg>
          </button>
          <button
            type="button"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)] ${
              viewMode === "list" ? activeClass : inactiveClass
            }`}
            aria-pressed={viewMode === "list"}
            aria-label={t("exerciseGrid.listView")}
            title={t("exerciseGrid.listView")}
            onClick={() => onViewModeChange("list")}
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
              <rect x="3" y="4" width="14" height="2" rx="1" />
              <rect x="3" y="9" width="14" height="2" rx="1" />
              <rect x="3" y="14" width="14" height="2" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Exercise cards grouped by session */}
      {exercises.length === 0 ? (
        <div className="card">
          <h2>{t("exerciseGrid.emptyTitle")}</h2>
          <p>{t("exerciseGrid.emptyHint")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {sessionGroups.map(({ session, items }) => (
            <section key={session}>
              <div className="my-4 flex items-center gap-2 border-l-4 border-orange-500 pl-3">
                <h2 className="text-lg font-bold text-[color:var(--ink)] flex items-baseline gap-2">
                  <span className="font-mono text-orange-400">{session}</span>
                  {session !== "Other" && (
                    <span className="text-[color:var(--ink)]">
                      {t(`exerciseGrid.sessions.${session}`)}
                    </span>
                  )}
                </h2>
                <span className="ml-auto shrink-0 rounded-full bg-gray-700 text-gray-300 px-2 py-0.5 text-sm font-medium">
                  {items.length}
                </span>
              </div>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 items-start gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-3 lg:grid-cols-5 lg:gap-4 xl:grid-cols-6">
                  {items.map((exercise) => (
                    <Link key={exercise.slug} href={`/exercices/${exercise.slug}`}>
                      <article className="card self-start !p-2 !min-h-0 !h-auto">
                        <ExerciseCard
                          exercise={{
                            ...exercise,
                            title: exercise.title?.trim() || t("exerciseGrid.untitledDraft"),
                          }}
                          isLive={exercise.isLive}
                          favoriteAction={
                            <FavoriteIconButton
                              slug={exercise.slug}
                              active={favorites.includes(exercise.slug)}
                              variant="overlay"
                            />
                          }
                        />
                      </article>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {items.map((exercise) => (
                    <Link
                      key={exercise.slug}
                      href={`/exercices/${exercise.slug}`}
                      className="block"
                    >
                      <article className="rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 shadow-sm backdrop-blur">
                        <ExerciseCard
                          exercise={{
                            ...exercise,
                            title: exercise.title?.trim() || t("exerciseGrid.untitledDraft"),
                          }}
                          isLive={exercise.isLive}
                          variant="list"
                          favoriteAction={
                            <FavoriteIconButton
                              slug={exercise.slug}
                              active={favorites.includes(exercise.slug)}
                            />
                          }
                        />
                      </article>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
