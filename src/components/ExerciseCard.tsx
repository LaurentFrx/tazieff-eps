"use client";

import Image, { type StaticImageData } from "next/image";
import { useState, type CSSProperties, type ReactNode } from "react";
import logo from "../../public/media/branding/logo-eps.webp";
import type { ExerciseFrontmatter } from "@/lib/content/schema";
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
  // Strict convention: no fallback between thumbnail formats — show placeholder if missing
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

  // Sub-info: first muscle + level
  const firstMuscle = exercise.muscles?.[0] ?? null;
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
          {(firstMuscle || level) && (
            <p className="mt-0.5 text-sm text-[color:var(--muted)]">
              {[firstMuscle, level ? t(`difficulty.${level}`) : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      ) : (
        <p className="line-clamp-2 break-words text-xs font-bold leading-tight text-[color:var(--ink)]">
          {title}
        </p>
      )}
      {isList && favoriteAction ? (
        <div className="shrink-0">{favoriteAction}</div>
      ) : null}
    </div>
  );
}
