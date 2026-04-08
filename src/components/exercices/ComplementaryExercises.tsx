"use client";

import { LocaleLink as Link } from "@/components/LocaleLink";
import { ExoThumb } from "@/components/ExoThumb";

type Exercise = { slug: string; title: string; muscles: string[] };

type Props = {
  exercises: Exercise[];
  heading: string;
};

export function ComplementaryExercises({ exercises, heading }: Props) {
  if (exercises.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2
        className="text-xl uppercase tracking-wider text-white"
        style={{ fontFamily: "var(--font-bebas), sans-serif" }}
      >
        {heading}
      </h2>
      <div
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {exercises.map((ex) => (
          <Link
            key={ex.slug}
            href={`/exercices/${ex.slug}`}
            className="snap-start shrink-0 w-[200px] flex items-center gap-3 rounded-xl border border-[#FF8C00]/20 bg-[#FF8C00]/5 p-3 transition-all duration-200 hover:bg-[#FF8C00]/10"
          >
            <ExoThumb slug={ex.slug} />
            <div className="min-w-0">
              <span className="inline-block rounded-full bg-[#FF8C00]/15 px-2 py-0.5 text-[9px] font-bold text-[#FF8C00] uppercase mb-1">
                Antagoniste
              </span>
              <span className="block text-sm font-medium text-zinc-200 line-clamp-2">
                {ex.title}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
