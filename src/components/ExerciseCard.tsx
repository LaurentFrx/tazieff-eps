"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import type { ExerciseFrontmatter } from "@/lib/content/schema";

export type ExerciseCardProps = {
  exercise: ExerciseFrontmatter;
  isLive?: boolean;
  variant?: "grid" | "list";
  favoriteAction?: ReactNode;
};

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

export function ExerciseCard({
  exercise,
  isLive,
  variant = "grid",
  favoriteAction,
}: ExerciseCardProps) {
  const primarySrc = toThumbSrc(exercise.media) ?? exercise.media;
  const [imageSrc, setImageSrc] = useState<string | undefined>(primarySrc);

  useEffect(() => {
    setImageSrc(primarySrc);
  }, [primarySrc]);

  const handleImageError = () => {
    if (exercise.media && imageSrc !== exercise.media) {
      setImageSrc(exercise.media);
    }
  };

  const title = exercise.title?.trim() || "Brouillon sans titre";
  const isList = variant === "list";
  const thumbClass = isList
    ? "h-12 w-12 rounded-xl"
    : "h-44 w-full rounded-2xl";
  const sizes = isList ? "48px" : "(max-width: 768px) 100vw, 360px";

  return (
    <div className={isList ? "flex items-center gap-3" : "flex flex-col gap-3"}>
      <div
        className={`relative shrink-0 overflow-hidden ring-1 ring-white/10 ${thumbClass}`}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={title}
            fill
            sizes={sizes}
            className="object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="h-full w-full bg-[color:var(--bg-2)]" />
        )}
        {!isList && favoriteAction ? (
          <div className="absolute right-3 top-3">{favoriteAction}</div>
        ) : null}
        {!isList && isLive ? (
          <span className="absolute left-3 top-3 pill pill-live">LIVE</span>
        ) : null}
      </div>
      {isList ? (
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-[color:var(--ink)]">
              {title}
            </h2>
            {isLive ? (
              <span className="pill pill-live shrink-0">LIVE</span>
            ) : null}
          </div>
        </div>
      ) : (
        <h2 className="text-base font-semibold text-[color:var(--ink)]">{title}</h2>
      )}
      {isList && favoriteAction ? (
        <div className="shrink-0">{favoriteAction}</div>
      ) : null}
    </div>
  );
}
