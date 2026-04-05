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
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
        <span className="border-b-2 border-cyan-400 pb-1">{heading}</span>
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {exercises.map((ex) => (
          <Link
            key={ex.slug}
            href={`/exercices/${ex.slug}`}
            className="flex items-center gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 transition-all duration-200 hover:bg-cyan-400/10"
          >
            <ExoThumb slug={ex.slug} />
            <div className="min-w-0">
              <span className="inline-block rounded-full bg-cyan-400/15 px-2 py-0.5 text-[9px] font-bold text-cyan-400 uppercase mb-1">
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
