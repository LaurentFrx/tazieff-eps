"use client";

import { LocaleLink as Link } from "@/components/LocaleLink";
import Image from "next/image";
import { useState } from "react";

type Props = {
  exercises: { slug: string; title: string }[];
  heading: string;
};

function CardThumb({ slug }: { slug: string }) {
  const [err, setErr] = useState(false);
  return (
    <div className="relative w-full overflow-hidden rounded-[10px] bg-white/5" style={{ aspectRatio: '16/10' }}>
      {err ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
            <path d="M6.5 6.5L17.5 17.5" /><path d="M3.5 10L10 3.5" /><path d="M14 20.5L20.5 14" /><path d="M2 11.5l1.5-1.5" /><path d="M20.5 13L22 11.5" />
          </svg>
        </div>
      ) : (
        <Image
          src={`/images/exos/thumb169-${slug}.webp`}
          alt=""
          fill
          sizes="160px"
          className="object-cover"
          onError={() => setErr(true)}
        />
      )}
    </div>
  );
}

export function SessionExercises({ exercises, heading }: Props) {
  if (exercises.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-bebas), sans-serif' }}>
        {heading}
      </h2>
      <div
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {exercises.map((exercise) => (
          <Link
            key={exercise.slug}
            href={`/exercices/${exercise.slug}`}
            className="snap-start shrink-0 w-[160px] md:w-[200px] flex flex-col gap-2 group"
          >
            <CardThumb slug={exercise.slug} />
            <div className="flex flex-col gap-0.5 px-0.5">
              <span
                className="text-[10px] uppercase text-[#FF8C00]"
                style={{ fontFamily: 'var(--font-jetbrains), monospace' }}
              >
                {exercise.slug.toUpperCase()}
              </span>
              <span
                className="text-[12px] text-white/70 leading-tight line-clamp-2 group-hover:text-white/90 transition-colors"
                style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
              >
                {exercise.title}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
