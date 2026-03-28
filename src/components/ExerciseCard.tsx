"use client";

import Image, { type StaticImageData } from "next/image";
import { useState, type CSSProperties, type ReactNode } from "react";
import logo from "../../public/media/branding/logo-eps.webp";
import type { ExerciseFrontmatter } from "@/lib/content/schema";
import { getMuscleGroup } from "@/lib/exercices/muscleGroups";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type ExerciseCardProps = {
  exercise: ExerciseFrontmatter & {
    thumbSrc?: string;
    thumb169Src?: string;
    thumb916Src?: string;
    thumbListSrc?: string;
    thumbListAspect?: "16/9" | "9/16" | "1/1";
    imageSrc?: string;
  };
  isLive?: boolean;
  variant?: "grid" | "list";
  favoriteAction?: ReactNode;
};

type ImageCandidate = string | StaticImageData;

// ---------------------------------------------------------------------------
// Level badge colors
// ---------------------------------------------------------------------------

const LEVEL_BADGE: Record<string, string> = {
  debutant: "bg-green-100 text-green-700",
  intermediaire: "bg-yellow-100 text-yellow-700",
  avance: "bg-red-100 text-red-700",
};

const LEVEL_BADGE_LIST: Record<string, string> = {
  debutant: "bg-green-500/20 text-green-400",
  intermediaire: "bg-amber-500/20 text-amber-400",
  avance: "bg-rose-500/20 text-rose-400",
};

// ---------------------------------------------------------------------------
// Slug formatting: "s1-03" → "S1-03"
// ---------------------------------------------------------------------------

function formatSlug(slug: string): string {
  const m = slug.match(/^(s\d+-\d+)/i);
  return m ? m[1].toUpperCase() : slug.toUpperCase();
}

// ---------------------------------------------------------------------------
// ExerciseCardImage (internal)
// ---------------------------------------------------------------------------

type ExerciseCardImageProps = {
  candidates: ImageCandidate[];
  title: string;
  sizes: string;
  thumbClass: string;
  thumbStyle?: CSSProperties;
  isList: boolean;
  favoriteAction?: ReactNode;
  levelBadge?: ReactNode;
};

function ExerciseCardImage({
  candidates,
  title,
  sizes,
  thumbClass,
  thumbStyle,
  isList,
  favoriteAction,
  levelBadge,
}: ExerciseCardImageProps) {
  const [errored, setErrored] = useState(false);
  const imageSrc = errored ? logo : candidates[0];
  const isFallbackLogo = imageSrc === logo || errored;
  const imageTone = isFallbackLogo
    ? "grayscale opacity-60 brightness-90"
    : "";

  return (
    <div
      className={`relative shrink-0 overflow-hidden ring-1 ring-white/10 ${thumbClass}`}
      style={thumbStyle}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes={sizes}
          className={`h-full w-full object-cover ${imageTone}`}
          onError={() => setErrored(true)}
        />
      ) : (
        <div className="h-full w-full bg-[color:var(--bg-2)]" />
      )}
      {!isList && levelBadge ? (
        <div className="absolute left-1.5 top-1.5 z-10">{levelBadge}</div>
      ) : null}
      {!isList && favoriteAction ? (
        <div className="absolute right-2 top-2 z-10">{favoriteAction}</div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ExerciseCard — main exported component
// ---------------------------------------------------------------------------

export function ExerciseCard({
  exercise,
  variant = "grid",
  favoriteAction,
}: ExerciseCardProps) {
  const { t } = useI18n();
  const title = exercise.title?.trim() || t("exerciseGrid.untitledDraft");
  const isList = variant === "list";
  const slug = exercise.slug;
  const displaySlug = formatSlug(slug);

  // Strict convention: no fallback between thumbnail formats
  const gridCandidates: ImageCandidate[] = [`/images/exos/thumb-${slug}.webp`, logo];
  const listCandidates: ImageCandidate[] = [`/images/exos/thumb169-${slug}.webp`, logo];
  const candidates = isList ? listCandidates : gridCandidates;
  const thumbClass = isList
    ? "w-32 sm:w-36 flex-none rounded-2xl"
    : "aspect-square w-full rounded-2xl";
  const thumbStyle = isList
    ? ({ aspectRatio: "16/9" } satisfies CSSProperties)
    : undefined;
  const sizes = isList
    ? "(max-width: 640px) 128px, 144px"
    : "(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw";

  const level = exercise.level ?? null;
  const levelBadgeColors = level ? LEVEL_BADGE[level] : null;

  // Level badge for grid overlay
  const levelBadge = level && levelBadgeColors ? (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight ${levelBadgeColors}`}>
      {t(`difficultyShort.${level}`)}
    </span>
  ) : null;

  return (
    <div className={isList ? "flex items-center gap-4" : "flex flex-col gap-2"}>
      <ExerciseCardImage
        key={`${slug}-${variant}`}
        candidates={candidates}
        title={title}
        sizes={sizes}
        thumbClass={thumbClass}
        thumbStyle={thumbStyle}
        isList={isList}
        favoriteAction={favoriteAction}
        levelBadge={levelBadge}
      />
      {isList ? (
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-[color:var(--ink)] md:text-lg">
            {title}
          </h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {exercise.muscles.length > 0 && (() => {
              const groupId = getMuscleGroup(exercise.muscles[0]);
              return groupId ? (
                <span className="text-sm text-zinc-400">
                  {t(`filters.muscleGroups.${groupId}`)}
                </span>
              ) : null;
            })()}
            {level && LEVEL_BADGE_LIST[level] && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold leading-tight ${LEVEL_BADGE_LIST[level]}`}>
                {t(`difficultyShort.${level}`)}
              </span>
            )}
            <span className="text-sm font-mono text-zinc-500 uppercase">
              {displaySlug}
            </span>
          </div>
        </div>
      ) : (
        <p className="line-clamp-2 break-words text-xs font-bold leading-tight text-[color:var(--ink)]">
          <span className="font-mono font-bold text-orange-400">{displaySlug}</span>
          {" "}
          <span>{title}</span>
        </p>
      )}
      {isList && favoriteAction ? (
        <div className="shrink-0">{favoriteAction}</div>
      ) : null}
    </div>
  );
}
