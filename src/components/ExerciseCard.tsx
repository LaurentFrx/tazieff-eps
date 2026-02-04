"use client";

import Image, { type StaticImageData } from "next/image";
import { useMemo, useState, type ReactNode } from "react";
import logo from "../../public/media/branding/logo-eps.webp";
import type { ExerciseFrontmatter } from "@/lib/content/schema";

export type ExerciseCardProps = {
  exercise: ExerciseFrontmatter;
  isLive?: boolean;
  variant?: "grid" | "list";
  favoriteAction?: ReactNode;
};

type ImageCandidate = string | StaticImageData;

function toThumbSrc(src?: string) {
  if (!src) {
    return undefined;
  }
  if (!src.startsWith("/images/exos/")) {
    return src;
  }
  if (src.startsWith("/images/exos/thumb-")) {
    return src;
  }
  return src.replace("/images/exos/", "/images/exos/thumb-");
}

type SrcParts = {
  dir: string;
  filename: string;
  basename: string;
  ext: string;
  suffix: string;
};

function parseSrc(src: string): SrcParts | null {
  if (src.startsWith("data:")) {
    return null;
  }

  let path = src;
  let suffix = "";
  const queryIndex = src.indexOf("?");
  const hashIndex = src.indexOf("#");
  const cutIndex = [queryIndex, hashIndex]
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  if (cutIndex !== undefined) {
    path = src.slice(0, cutIndex);
    suffix = src.slice(cutIndex);
  }

  const lastSlash = path.lastIndexOf("/");
  const dir = lastSlash >= 0 ? path.slice(0, lastSlash + 1) : "";
  const filename = lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
  if (!filename) {
    return null;
  }

  const dotIndex = filename.lastIndexOf(".");
  const basename = dotIndex >= 0 ? filename.slice(0, dotIndex) : filename;
  const ext = dotIndex >= 0 ? filename.slice(dotIndex) : "";

  return { dir, filename, basename, ext, suffix };
}

function uniqueCandidates(candidates: ImageCandidate[]) {
  const unique: ImageCandidate[] = [];
  candidates.forEach((candidate) => {
    if (!unique.includes(candidate)) {
      unique.push(candidate);
    }
  });
  return unique;
}

function buildGridCandidates(src?: string): ImageCandidate[] {
  if (!src) {
    return [logo];
  }

  const parsed = parseSrc(src);
  if (!parsed) {
    return [logo];
  }

  const { dir, filename, basename, ext, suffix } = parsed;
  const isWebp = ext.toLowerCase() === ".webp";
  const candidates: ImageCandidate[] = [];

  if (filename.startsWith("thumb-")) {
    candidates.push(src);
  } else if (isWebp) {
    candidates.push(`${dir}thumb-${filename}${suffix}`);
  }

  if (filename.startsWith("thumb.")) {
    candidates.push(src);
  } else {
    candidates.push(`${dir}thumb.${basename}.webp${suffix}`);
  }

  candidates.push(logo);
  return uniqueCandidates(candidates);
}

type ExerciseCardImageProps = {
  candidates: ImageCandidate[];
  title: string;
  sizes: string;
  thumbClass: string;
  isList: boolean;
  favoriteAction?: ReactNode;
};

function ExerciseCardImage({
  candidates,
  title,
  sizes,
  thumbClass,
  isList,
  favoriteAction,
}: ExerciseCardImageProps) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const imageSrc = candidates[candidateIndex];
  const isFallbackLogo = !isList && imageSrc === logo;
  const imageTone = isFallbackLogo
    ? "grayscale opacity-60 brightness-90"
    : "";

  const handleImageError = () => {
    setCandidateIndex((prev) =>
      prev < candidates.length - 1 ? prev + 1 : prev,
    );
  };

  return (
    <div
      className={`relative shrink-0 overflow-hidden ring-1 ring-white/10 ${thumbClass}`}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes={sizes}
          className={`h-full w-full object-cover ${imageTone}`}
          onError={handleImageError}
        />
      ) : (
        <div className="h-full w-full bg-[color:var(--bg-2)]" />
      )}
      {!isList && favoriteAction ? (
        <div className="absolute right-2 top-2">{favoriteAction}</div>
      ) : null}
    </div>
  );
}

export function ExerciseCard({
  exercise,
  variant = "grid",
  favoriteAction,
}: ExerciseCardProps) {
  const title = exercise.title?.trim() || "Brouillon sans titre";
  const isList = variant === "list";
  const primarySrc = toThumbSrc(exercise.media) ?? exercise.media;
  const listCandidates = useMemo(
    () =>
      uniqueCandidates(
        [primarySrc, exercise.media].filter(Boolean) as ImageCandidate[],
      ),
    [exercise.media, primarySrc],
  );
  const gridCandidates = useMemo(
    () => buildGridCandidates(exercise.media),
    [exercise.media],
  );
  const candidates = isList ? listCandidates : gridCandidates;
  const candidatesKey = useMemo(
    () =>
      candidates
        .map((candidate) =>
          typeof candidate === "string" ? candidate : candidate.src,
        )
        .join("|"),
    [candidates],
  );
  const thumbClass = isList
    ? "h-24 w-24 rounded-2xl"
    : "aspect-square w-full rounded-2xl";
  const sizes = isList
    ? "96px"
    : "(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw";

  return (
    <div className={isList ? "flex items-center gap-4" : "flex flex-col gap-2"}>
      <ExerciseCardImage
        key={candidatesKey}
        candidates={candidates}
        title={title}
        sizes={sizes}
        thumbClass={thumbClass}
        isList={isList}
        favoriteAction={favoriteAction}
      />
      {isList ? (
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-[color:var(--ink)] md:text-lg">
              {title}
            </h2>
          </div>
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
